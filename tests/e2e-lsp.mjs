// End-to-end test of the language-server path, without Docker.
//
// Runs the gateway and one bridge as plain Node processes, opens the app served by the
// gateway in headless Chromium (Playwright), and checks completion, docs, signature help,
// diagnostics, hover and the per-language settings. Needs: node 20+, playwright with
// Chromium, pyright-langserver on PATH (`npm i -g pyright`). Other languages are tested
// if their servers are on PATH.
//
//   cd lsp/bridge && npm i && cd ../gateway && npm i && cd ../..
//   npm i -D playwright codemirror@5.65.16      # codemirror is served locally to the page
//   node tests/e2e-lsp.mjs
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CM = path.join(root, 'node_modules/codemirror/');
const TOKEN = 'e2e-token';
const procs = [];
const run = (cwd, file, env) => { const p = spawn('node', [file], {cwd, env:{...process.env, ...env}, stdio:'inherit'}); procs.push(p); return p; };

run(path.join(root, 'lsp/bridge'), 'server.js', {LSP_LANGS:'python,rust,c,cpp,go,java,haskell', SESSIONS_DIR:fs.mkdtempSync(path.join(os.tmpdir(), 'lsp-'))});
run(path.join(root, 'lsp/gateway'), 'gateway.js', {LSP_TOKEN:TOKEN, UPSTREAMS:'python=127.0.0.1:7999,rust=127.0.0.1:7999,c=127.0.0.1:7999,cpp=127.0.0.1:7999,go=127.0.0.1:7999,java=127.0.0.1:7999,haskell=127.0.0.1:7999'});
await new Promise(r => setTimeout(r, 3000));

let failed = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!ok) failed++; };

const b = await chromium.launch();
try {
  const p = await b.newPage({viewport:{width:1440, height:900}});
  p.on('pageerror', e => console.log('page error:', e.message));
  // Serve CodeMirror from node_modules; block every other external request (godbolt, fonts, icons).
  await p.route('**/*', r => {
    const u = r.request().url();
    const m = u.match(/codemirror\/5\.65\.16\/(.+)$/);
    if (m) {
      const rel = m[1].replace('.min.', '.');
      const f = CM + (/^codemirror\.(js|css)$/.test(rel) ? 'lib/' + rel : rel);
      return fs.existsSync(f) ? r.fulfill({path:f, contentType:f.endsWith('.css') ? 'text/css' : 'application/javascript'}) : r.abort();
    }
    return u.startsWith('http://localhost:7998') ? r.continue() : r.abort();
  });
  await p.goto('http://localhost:7998/');
  await p.selectOption('#lang', 'python');
  await p.waitForFunction(() => document.querySelector('#lspPill').dataset.state === 'ok', null, {timeout:30000}).catch(() => {});
  check('python connects', await p.getAttribute('#lspPill', 'data-state') === 'ok', await p.getAttribute('#lspPill', 'title'));

  await p.evaluate(() => { const cm = document.querySelector('.CodeMirror').CodeMirror; cm.setValue('import os\n\nname: str = "hi"\nx = undefined_thing\n'); cm.focus(); cm.setCursor({line:4, ch:0}); });
  await p.keyboard.type('name.up');
  await p.waitForSelector('.CodeMirror-hints', {timeout:15000}).catch(() => {});
  const hints = await p.$$eval('.CodeMirror-hint', l => l.map(x => x.textContent));
  check('completion after "."', hints.some(h => h.includes('upper')), hints.slice(0, 5).join(', '));
  await p.waitForTimeout(600);
  check('completion docs box', /upper/.test(await p.textContent('.lsp-doc').catch(() => '')));
  await p.keyboard.press('Enter'); await p.keyboard.type('(');
  await p.waitForTimeout(1500);
  check('accepting inserts text', (await p.evaluate(() => document.querySelector('.CodeMirror').CodeMirror.getLine(4))).startsWith('name.upper('));
  check('signature help', await p.evaluate(() => getComputedStyle(document.querySelector('.lsp-sig')).display) === 'block');
  const sq = await p.$$eval('.lsp-err', l => l.map(x => x.title));
  check('diagnostic squiggle', sq.some(t => /undefined_thing/.test(t)), sq.join(' | '));
  const xy = await p.evaluate(() => document.querySelector('.CodeMirror').CodeMirror.charCoords({line:0, ch:8}, 'window'));
  await p.mouse.move(xy.left + 2, xy.top + 5); await p.waitForTimeout(1500);
  check('hover docs', /os/i.test(await p.textContent('.lsp-tip:not(.lsp-sig)')));

  await p.click('#lspPill'); await p.waitForTimeout(1200);
  check('settings list languages', (await p.$$('.lsp-lang')).length === 7);
  await p.locator('.lsp-lang', {hasText:'Python'}).locator('input').uncheck();
  await p.click('#lspSave'); await p.waitForTimeout(1500);
  check('unticked language stays off', await p.getAttribute('#lspPill', 'data-state') === 'off');
} finally {
  await b.close();
  procs.forEach(p => p.kill());
}
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
