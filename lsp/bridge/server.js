'use strict';
/*
 * Live Compiler — language bridge (runs inside each language container).
 *
 * Internal only: it sits on a Docker network with no published ports and no internet
 * access, and is reached solely through the gateway, which does all authentication.
 *
 *   GET /health          languages this container serves
 *   WS  /lsp/<lang>      one language-server session per connection
 *
 * Each session gets a scratch project copied from templates/<lang> and its own
 * server process; both are removed when the socket closes.
 *
 * Copyright (C) 2026 Dervis Mansuroglu
 * SPDX-License-Identifier: GPL-3.0-only
 * Additional term under GPL section 7(b): see ADDITIONAL-TERMS.md at https://github.com/dervism/live-compiler
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');
const { WebSocketServer } = require('ws');

const PORT       = +process.env.PORT || 7999;
const IDLE_MS    = (+process.env.IDLE_MINUTES || 30) * 60_000;
const SESS_DIR   = process.env.SESSIONS_DIR || '/tmp/lsp-sessions';
const LOG_STDERR = /^(1|true|yes)$/i.test(process.env.LOG_STDERR || '');
const TEMPLATES  = path.join(__dirname, 'templates');
const VERSION    = require('./package.json').version;

const LANGS = {
  java:    { name:'Java',    cmd:'jdtls',              args:['-data', '${data}', '--jvm-arg=-Xmx1G'], file:'Main.java',   languageId:'java' },
  haskell: { name:'Haskell', cmd:'haskell-language-server-wrapper', args:['--lsp'],          file:'Main.hs',     languageId:'haskell' },
  c:       { name:'C',       cmd:'clangd',             args:['--background-index=false', '--header-insertion=never', '--log=error'], file:'main.c',   languageId:'c' },
  cpp:     { name:'C++',     cmd:'clangd',             args:['--background-index=false', '--header-insertion=never', '--log=error'], file:'main.cpp', languageId:'cpp' },
  rust:    { name:'Rust',    cmd:'rust-analyzer',      args:[],                               file:'src/main.rs', languageId:'rust' },
  go:      { name:'Go',      cmd:'gopls',              args:['serve'],                        file:'main.go',     languageId:'go',
             env:{ GOFLAGS:'-mod=mod', GOTOOLCHAIN:'local', GOPROXY:'off' } },
  python:  { name:'Python',  cmd:'pyright-langserver', args:['--stdio'],                      file:'main.py',     languageId:'python' },
};

function onPath(cmd){
  return (process.env.PATH || '').split(path.delimiter).some(dir => {
    try { fs.accessSync(path.join(dir, cmd), fs.constants.X_OK); return true; } catch { return false; }
  });
}
const WANTED = (process.env.LSP_LANGS || Object.keys(LANGS).join(',')).split(',').map(s => s.trim()).filter(k => LANGS[k]);
const AVAILABLE = WANTED.filter(k => onPath(LANGS[k].cmd) && fs.existsSync(path.join(TEMPLATES, k)));

fs.mkdirSync(SESS_DIR, { recursive:true });
const sessions = new Map();

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type':'application/json', 'Cache-Control':'no-store' });
    return res.end(JSON.stringify({ ok:true, version:VERSION, languages:AVAILABLE, sessions:sessions.size }));
  }
  res.writeHead(404).end();
});

const wss = new WebSocketServer({ noServer:true, maxPayload:8 * 1024 * 1024 });
server.on('upgrade', (req, socket, head) => {
  const m = /^\/lsp\/([a-z+]+)$/.exec(new URL(req.url, 'http://x').pathname);
  if (!m) { socket.end('HTTP/1.1 404 Not Found\r\n\r\n'); socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, ws => {
    if (!AVAILABLE.includes(m[1])) return ws.close(4404, 'language not available');
    startSession(ws, m[1]);
  });
});

function startSession(ws, key){
  const def = LANGS[key];
  const id = `${key}-${crypto.randomBytes(5).toString('hex')}`;
  const dir = path.join(SESS_DIR, id), data = path.join(SESS_DIR, id + '-data');
  fs.cpSync(path.join(TEMPLATES, key), dir, { recursive:true });
  fs.mkdirSync(data, { recursive:true });
  const docPath = path.join(dir, def.file);
  const args = def.args.map(a => a.replace('${data}', data).replace('${dir}', dir));

  const child = spawn(def.cmd, args, { cwd:dir, env:{ ...process.env, ...(def.env || {}) }, stdio:['pipe', 'pipe', 'pipe'], detached:true });
  const s = { id, child, ws, idle:null, writeTimer:null, closed:false };
  sessions.set(id, s);
  log(`+ ${id} (${sessions.size} open)`);

  const touch = () => { clearTimeout(s.idle); s.idle = setTimeout(() => ws.close(4408, 'idle'), IDLE_MS); };
  touch();

  ws.send(JSON.stringify({ jsonrpc:'2.0', method:'bridge/ready', params:{
    rootUri:pathToFileURL(dir).href, documentUri:pathToFileURL(docPath).href, languageId:def.languageId, language:key, name:def.name } }));

  // server → browser: split the stdout byte stream into LSP messages
  let buf = Buffer.alloc(0);
  child.stdout.on('data', chunk => {
    buf = Buffer.concat([buf, chunk]);
    for (;;) {
      const he = buf.indexOf('\r\n\r\n');
      if (he < 0) break;
      const len = /Content-Length:\s*(\d+)/i.exec(buf.subarray(0, he).toString('ascii'));
      if (!len) { buf = buf.subarray(he + 4); continue; }
      const end = he + 4 + +len[1];
      if (buf.length < end) break;
      const body = buf.subarray(he + 4, end).toString('utf8');
      buf = buf.subarray(end);
      if (ws.readyState === 1) ws.send(body);
    }
  });
  child.stderr.on('data', d => { if (LOG_STDERR) process.stderr.write(`[${id}] ${d}`); });
  child.stdin.on('error', () => {});

  // browser → server: frame each message; mirror the document to disk for servers that read files
  const writeDoc = text => {
    clearTimeout(s.writeTimer);
    s.writeTimer = setTimeout(() => fs.writeFile(docPath, text, () => {}), 250);
  };
  ws.on('message', raw => {
    touch();
    const text = raw.toString('utf8');
    let msg;
    try { msg = JSON.parse(text); } catch { return; }
    if (msg.method === 'textDocument/didOpen' && msg.params?.textDocument?.text != null) writeDoc(msg.params.textDocument.text);
    else if (msg.method === 'textDocument/didChange') {
      const ch = msg.params?.contentChanges || [];
      const last = ch[ch.length - 1];
      if (last && !last.range && typeof last.text === 'string') writeDoc(last.text);
    }
    const b = Buffer.from(text, 'utf8');
    child.stdin.write(`Content-Length: ${b.length}\r\n\r\n`);
    child.stdin.write(b);
  });

  const cleanup = reason => {
    if (s.closed) return;
    s.closed = true;
    clearTimeout(s.idle); clearTimeout(s.writeTimer);
    sessions.delete(id);
    try { process.kill(-child.pid, 'SIGTERM'); } catch {}
    setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }, 3000).unref();
    setTimeout(() => { fs.rm(dir, { recursive:true, force:true }, () => {}); fs.rm(data, { recursive:true, force:true }, () => {}); }, 3500).unref();
    log(`- ${id} (${reason})`);
  };
  ws.on('close', () => cleanup('closed'));
  ws.on('error', () => cleanup('socket error'));
  child.on('error', err => { cleanup('spawn failed: ' + err.message); if (ws.readyState === 1) ws.close(1011, 'language server failed to start'); });
  child.on('exit', code => { cleanup(`server exited ${code}`); if (ws.readyState === 1) ws.close(1011, 'language server exited'); });
}

function log(m){ console.log(new Date().toISOString(), m); }

server.listen(PORT, '0.0.0.0', () => {
  log(`language bridge v${VERSION} on :${PORT} serving ${AVAILABLE.map(k => LANGS[k].name).join(', ') || '(nothing — no servers found)'}`);
  const missing = WANTED.filter(k => !AVAILABLE.includes(k));
  if (missing.length) log(`not found on PATH: ${missing.map(k => LANGS[k].cmd).join(', ')}`);
});

const shutdown = () => { for (const s of sessions.values()) try { s.ws.close(1001, 'shutting down'); } catch {} setTimeout(() => process.exit(0), 500); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
