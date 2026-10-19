'use strict';
/*
 * Live Compiler — gateway.
 *
 * The only container with a published port (127.0.0.1:7998). It authenticates the
 * browser and forwards each language-server session to that language's container.
 *
 *   GET /health          which languages are running (CORS open, no secrets)
 *   GET /token           the access token, readable only by a page served from here
 *   GET /                the Live Compiler app
 *   WS  /lsp/<lang>?token=…   proxied to the language container
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const WebSocket = require('ws');

const PORT     = +process.env.PORT || 7998;
const TOKEN    = (process.env.LSP_TOKEN || '').trim() || crypto.randomBytes(16).toString('hex');
const ORIGINS  = list(process.env.ALLOWED_ORIGINS || 'null,http://localhost,http://127.0.0.1,http://[::1]');
const HOSTS    = list(process.env.ALLOWED_HOSTS || 'localhost,127.0.0.1,[::1]');
const MAX      = +process.env.MAX_SESSIONS || 6;
const PUBLIC   = path.join(__dirname, 'public');
const VERSION  = require('./package.json').version;

const NAMES = { java:'Java', haskell:'Haskell', c:'C', cpp:'C++', rust:'Rust', go:'Go', python:'Python' };
// language → host[:port] of the container serving it
const UPSTREAMS = Object.fromEntries(list(process.env.UPSTREAMS ||
  'python=lsp-python,go=lsp-go,c=lsp-clang,cpp=lsp-clang,java=lsp-java,rust=lsp-rust,haskell=lsp-haskell')
  .map(pair => { const [k, v] = pair.split('='); return [k.trim(), v.includes(':') ? v.trim() : `${v.trim()}:7999`]; })
  .filter(([k]) => NAMES[k]));

function list(s){ return s.split(',').map(x => x.trim()).filter(Boolean); }

/* ---------- which language containers are up ---------- */
const up = new Set();
async function poll(){
  const hosts = [...new Set(Object.values(UPSTREAMS))];
  await Promise.all(hosts.map(async host => {
    let langs = [];
    try {
      const r = await fetch(`http://${host}/health`, { signal:AbortSignal.timeout(1500) });
      langs = (await r.json()).languages || [];
    } catch {}
    for (const [k, h] of Object.entries(UPSTREAMS)) if (h === host) langs.includes(k) ? up.add(k) : up.delete(k);
  }));
}
poll(); setInterval(poll, 5000).unref();

/* ---------- guards ---------- */
function hostOk(req){
  const h = (req.headers.host || '').toLowerCase();
  const name = h.startsWith('[') ? h.slice(0, h.indexOf(']') + 1) : h.split(':')[0];
  return HOSTS.includes(name);
}
function originOk(req){
  const o = req.headers.origin;
  if (!o) return true;                                    // non-browser clients; the token still applies
  return ORIGINS.includes(o) || ORIGINS.some(a => a !== 'null' && o.startsWith(a + ':'));
}
function sameOrigin(req){
  const o = req.headers.origin, site = req.headers['sec-fetch-site'];
  if (o) return o === `http://${req.headers.host}`;
  return !site || site === 'same-origin' || site === 'none';
}
function tokenOk(t){
  const a = Buffer.from(String(t || '')), b = Buffer.from(TOKEN);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ---------- HTTP ---------- */
const server = http.createServer(async (req, res) => {
  if (!hostOk(req)) { res.writeHead(403).end('host not allowed'); return; }
  const url = new URL(req.url, 'http://x');
  const json = (code, body, cors) => {
    res.writeHead(code, { 'Content-Type':'application/json', 'Cache-Control':'no-store', ...(cors ? {'Access-Control-Allow-Origin':'*'} : {}) });
    res.end(JSON.stringify(body));
  };
  if (req.method === 'OPTIONS') { res.writeHead(204, {'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET'}).end(); return; }
  if (url.pathname === '/health') {
    if (url.searchParams.has('refresh')) await poll();
    const known = Object.keys(UPSTREAMS);
    return json(200, { ok:true, name:'live-compiler-lsp', gateway:true, version:VERSION,
      languages:known.filter(k => up.has(k)), known, names:NAMES, sessions:sessions.size, maxSessions:MAX, tokenRequired:true }, true);
  }
  if (url.pathname === '/token') {
    // No CORS header, so other origins cannot read it; the Host check blocks DNS rebinding.
    if (!sameOrigin(req)) return json(403, { error:'same-origin only' });
    return json(200, { token:TOKEN });
  }
  if (url.pathname === '/' || url.pathname === '/index.html') {
    const f = path.join(PUBLIC, 'index.html');
    if (fs.existsSync(f)) { res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-cache'}); fs.createReadStream(f).pipe(res); return; }
  }
  res.writeHead(404).end('not found');
});

/* ---------- WebSocket proxy ---------- */
const sessions = new Set();
const wss = new WebSocket.WebSocketServer({ noServer:true, maxPayload:8 * 1024 * 1024 });

server.on('upgrade', (req, socket, head) => {
  if (!hostOk(req) || !originOk(req)) { socket.end('HTTP/1.1 403 Forbidden\r\n\r\n'); socket.destroy(); return; }
  const url = new URL(req.url, 'http://x');
  const m = /^\/lsp\/([a-z+]+)$/.exec(url.pathname);
  if (!m) { socket.end('HTTP/1.1 404 Not Found\r\n\r\n'); socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, client => {
    // Reject after the handshake so the browser can see why (custom close codes).
    if (!tokenOk(url.searchParams.get('token'))) return client.close(4401, 'bad token');
    if (!UPSTREAMS[m[1]])                        return client.close(4404, 'unknown language');
    if (sessions.size >= MAX)                    return client.close(4429, 'too many sessions');
    proxy(client, m[1]);
  });
});

const safeCode = c => (c >= 4000 && c < 5000) || [1000, 1001, 1011].includes(c) ? c : 1011;

function proxy(client, lang){
  const target = `ws://${UPSTREAMS[lang]}/lsp/${lang}`;
  const upstream = new WebSocket(target, { perMessageDeflate:false, handshakeTimeout:4000 });
  const queue = [];
  let opened = false, done = false;
  sessions.add(client);
  log(`+ ${lang} → ${UPSTREAMS[lang]} (${sessions.size}/${MAX})`);

  const finish = (code, reason) => {
    if (done) return;
    done = true;
    sessions.delete(client);
    try { if (client.readyState <= 1) client.close(safeCode(code), String(reason || '').slice(0, 120)); } catch {}
    try { if (upstream.readyState <= 1) upstream.close(1000); } catch {}
    log(`- ${lang} (${code}${reason ? ' ' + reason : ''})`);
  };

  client.on('message', d => { const t = d.toString('utf8'); opened ? upstream.send(t) : queue.push(t); });
  client.on('close', () => finish(1000, 'client closed'));
  client.on('error', () => finish(1011, 'client error'));

  upstream.on('open', () => { opened = true; queue.splice(0).forEach(t => upstream.send(t)); });
  upstream.on('message', d => { if (client.readyState === 1) client.send(d.toString('utf8')); });
  upstream.on('close', (code, reason) => finish(code, reason.toString()));
  upstream.on('error', () => {
    if (!opened) { up.delete(lang); finish(4503, `${NAMES[lang]} container is not running`); }
    else finish(1011, 'language container connection lost');
  });
}

function log(m){ console.log(new Date().toISOString(), m); }

server.listen(PORT, '0.0.0.0', () => {
  const bar = '─'.repeat(64);
  console.log(`${bar}\n Live Compiler language-server gateway v${VERSION} on port ${PORT}`);
  console.log(` Token: ${TOKEN}`);
  console.log(` Open http://localhost:${PORT} (connects automatically), or paste the token`);
  console.log(` into the app's language-server settings when opening the HTML file directly.\n${bar}`);
  setTimeout(() => log(`running: ${[...up].map(k => NAMES[k]).join(', ') || 'no language containers yet'}`), 2500).unref();
});

const shutdown = () => { for (const c of sessions) try { c.close(1001, 'shutting down'); } catch {} setTimeout(() => process.exit(0), 300); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
