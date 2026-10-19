# Live Compiler — context for Claude Code

This project was started in a Claude (Cowork) chat by Dervis Mansuroglu and moved here to continue in Claude Code. This file holds what that conversation decided, so you don't have to rediscover it.

## What it is

1. **`app/index.html`** is the main product. It's a single-file code editor:
   - It compiles as you type through the **Compiler Explorer API** (godbolt.org) and shows assembly, program output and compiler messages.
   - The panels can be resized, docked and hidden.
   - It has light, dark and system themes.
   - It saves everything in `localStorage`.
   - It can optionally connect to local language servers for completion, hover, signature help and diagnostics.
2. **`deck/index.html`** is the earlier version: a 10-slide presentation where each code slide is a live Compiler Explorer editor.
3. **`lsp/`** holds the optional language servers: one Docker container per language behind a gateway.

The footer credits must stay: Compiler Explorer API (Matt Godbolt and contributors, "Not affiliated"), "Made by Dervis Mansuroglu", "Built with Claude by Anthropic", and the Flaticon UIcons attribution (the icon licence requires it).

## Hard constraints (why things are the way they are)

- **The app is a standalone HTML file with no build step.** A claude.ai-published artifact can't call godbolt.org (outside hosts are blocked), so the app must be opened from disk or served by the gateway. Keep it one file: inline CSS and JS, with libraries from cdnjs only.
- **The editor is CodeMirror 5.65.16 from cdnjs.** It uses the show-hint, anyword-hint, matchbrackets and closebrackets addons and many modes. If CodeMirror fails to load, the app falls back to a `<textarea>`; keep that path working, since every editor feature checks `cm`.
- **Icons are Flaticon UIcons 2.6.0 (regular rounded) from `cdn-uicons.flaticon.com`, with a Unicode fallback.** Every icon is `<i class="ic fi fi-rr-NAME" data-fb="X">`. `<body class="nofi">` shows the fallbacks until the font is confirmed loaded. A single missing glyph also falls back (see `checkIcon`).
- **Compiler Explorer API calls:**
  - `GET /api/languages?fields=id,name,defaultCompiler,example`
  - `GET /api/compilers/<lang>?fields=id,name,semver`
  - `POST /api/compiler/<id>/compile` with `filters.execute:true`, `intel:true` and the rest of the filters
  - `POST /api/shortener` for "Open in CE", falling back to a `/clientstate/<base64>` link

  The API allows cross-origin (CORS) requests. It's a free community service: keep the 800 ms debounce and the AbortController, and don't hammer it.
- **Languages:**
  - 28 featured languages are in `LANGS` (editor mode and default flags) and `HELLO` (starter programs).
  - The rest come from the API under "More on Compiler Explorer" and use the API's `example` as starter code.
  - The ids are Compiler Explorer's (`c++`, `csharp`, `fsharp`, `objc`, `llvm`, …).

## App internals (`app/index.html`)

- **Saved state:** everything lives in `localStorage['livecc:v1']`:

  ```
  {lang, code:{lang:src}, compilers:{lang:id}, flags:{lang:str},
   layout, theme:'light'|'dark'|'system', font, auto, tab,
   lsp:{enabled, url, token, langs:{java:bool,…}}}
  ```

  An inline script in `<head>` applies the theme before the first paint. Always wrap storage access in try/catch.
- **Layout tree:** a leaf is a panel id (`'editor'|'asm'|'output'|'diag'`); a split is `{d:'row'|'col', s:[fractions], c:[children]}`.
  - The helpers are `norm` (flattens same-direction nesting, renormalises sizes), `without`, `dock(tree, target, id, side)` (side is left, right, top, bottom or center, where center swaps), `togglePanel` and `PRESETS`.
  - `validTree` guards stored layouts.
  - Panel DOM nodes are created once and moved between slots, which keeps CodeMirror's state. Call `refreshEditor()` after moving them.
- **Narrow screens:** below 820 px, the nav collapses into a ☰ menu and the panels become tabs (`state.tab`).
- **Source ↔ assembly links:** assembly lines carry `data-line` from the response's `asm[].source.line`. The cursor highlights matching assembly lines, and hovering an assembly line highlights its source line.

## Language-server client (inside `app/index.html`)

- **Mapping and connecting:**
  - `LSP_LANGS` maps app language ids to server keys (`c++`→`cpp`).
  - `LSP_ALL` lists the languages shown in the settings dialog.
  - `startLsp()` probes `/health`, then checks: the language is ticked, its container is running, and there is a token.
  - When the app is served by the gateway, the token comes from `/token`; otherwise the user pastes it.
- **`LspClient`** is a small JSON-RPC client over a WebSocket:
  - It waits for the bridge's `bridge/ready` notification, which gives `rootUri`, `documentUri` and `languageId`.
  - It then sends `initialize`, `initialized` and `didOpen`, and a full-text `didChange` on every edit.
  - It answers server requests (`workspace/configuration`, and so on) with nulls.
- **Features:**
  - Completion uses show-hint with an async `lspHint`, client-side prefix filtering, and `completionItem/resolve` for docs.
  - It triggers on `.`, `::`, `->`, or 2+ identifier characters, and on Ctrl+Space.
  - Signature help is triggered from the `change` event, not `inputRead`, because closebrackets inserts `()` itself.
  - Hover uses a 450 ms delay.
  - Diagnostics are drawn with `markText` (`lsp-err` and `lsp-warn` classes, with the message as `title`), and their counts appear in the Source panel title bar.
- **Close codes it handles:**

  | Code | Meaning |
  |---|---|
  | 4401 | Bad token |
  | 4404 / 4503 | The language container isn't running (retries every 15 s) |
  | 4408 | Idle |
  | 4429 | Too many sessions |
  | 1011 | The server crashed (no retry) |

## Language servers (`lsp/`)

```
browser ─ws /lsp/<lang>?token=─▶ gateway (127.0.0.1:7998, only published port)
                                   └─▶ lsp-<lang> containers on an `internal: true` network
```

- **`lsp/gateway/gateway.js`:**
  - It checks the token (timing-safe), the Host header (localhost only, against DNS rebinding) and the Origin (`null`, `http://localhost`, `http://127.0.0.1`).
  - It serves `/health` (CORS open; lists running and known languages), `/token` (same-origin only) and `/` (a **copy** of the app in `gateway/public/index.html`).
  - It polls each upstream's `/health` every 5 s and pipes WebSocket messages through.
- **`lsp/bridge/server.js`** runs in every language container:
  - It handles stdio ⇄ WebSocket framing using Content-Length headers.
  - Each session gets a scratch project from `bridge/templates/<lang>` (`Cargo.toml`, `go.mod`, `compile_flags.txt`, `hie.yaml`, and so on) and its own process group. The document is mirrored to disk.
  - `LSP_LANGS` chooses what a container serves. Servers: jdtls, haskell-language-server-wrapper, clangd (shared by C and C++), rust-analyzer, gopls, pyright-langserver.
- **`lsp/languages/<x>/Dockerfile`:**
  - Each one starts with a shared `bridge` build stage, then copies the `node` binary and the bridge into an official toolchain image.
  - Everything runs as uid 10001.
  - The build context is `lsp/`.
- **`docker-compose.yml`** has profiles `python, go, c, cpp, java, rust, haskell, all`, or set `COMPOSE_PROFILES` in `.env`.
- **The app never starts containers.** Giving the gateway control of Docker would hand a website a way into your computer. The settings dialog shows the `docker compose` command instead.

## Status

- **Tested (without Docker):** the gateway and the bridge running as plain Node processes, with pyright, driven by Playwright. `tests/e2e-lsp.mjs` covers completion, the docs box, signature help, squiggles, hover and per-language switching; all checks passed. Layout docking, persistence and themes were also checked in headless Chromium.
- **Not tested:**
  - **Docker images:** none of them have been built yet. The original environment couldn't download images from Docker Hub.
  - **Docker risks:**
    - The Haskell images use GHC/HLS "recommended" versions that might not match each other.
    - jdtls uses an unpinned snapshot.
    - The gopls version may need bumping.
  - **Other languages:** Java, Haskell, C/C++, Rust and Go have never run with the app.
  - **Live godbolt.org:** compiling against the real godbolt.org was never exercised from that environment, which was blocked. The request and response shapes follow the documented API.
- **Ideas discussed, not done:**
  - A fallback that guesses Java/C++ members without a language server.
  - Running Compiler Explorer itself locally in Docker, for offline compiling.

## Working on it

```sh
npm run check            # syntax-check inline scripts + services, compose config, gateway copy in sync
npm run sync             # copy app/index.html → lsp/gateway/public/index.html (do this after app edits)
npm run setup:test && npm i && npm run test:e2e   # needs pyright-langserver on PATH
cd lsp && docker compose --profile python up -d --build   # first real container test
```

Conventions:

- Edit `app/index.html` in place and keep it a single file.
- After an app change, run `npm run sync` and `npm run check`.
- Keep the warm, minimal UI tokens (`--bg`, `--panel`, `--accent`, …) and define both themes for every new colour.
- Text the user sees uses typographic quotes and apostrophes.
