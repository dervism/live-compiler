# Live Compiler — notes for Claude Code

Live Compiler is a code editor in a single HTML file. It compiles as you type through the Compiler Explorer API, and it can connect to language servers on your own computer for completion and live errors. It's open source at [github.com/dervism/live-compiler](https://github.com/dervism/live-compiler) under `GPL-3.0-only` with one attribution term.

This file has the rules to keep and a map of the code. Everything else has its own home; link to it rather than repeating it here:

| What | Where |
|---|---|
| Features, quick start, privacy | `README.md` |
| Contributor ground rules and checks | `CONTRIBUTING.md` |
| Running the language servers, their security model | `lsp/README.md` |
| Why things are the way they are | ADRs in `docs/architecture/decision_records/`, indexed in the [decision register](docs/architecture/decision_register/README.md) |
| Bugs, gaps, untested parts, follow-up work | [GitHub issues](https://github.com/dervism/live-compiler/issues) |

## Project constraints

Every ADR is checked against these (`adr-template.md` lists them). Changing one needs an ADR.

- **One HTML file, no build step.** Inline CSS and JS, libraries from cdnjs only. It must work opened from disk or served by the gateway; a claude.ai-published artifact can't reach compiler-explorer.com.
- **The fallbacks keep working.**
  - **Editor:** CodeMirror 5.65.16 (show-hint, anyword-hint, matchbrackets, closebrackets and many modes). If it fails to load, the app uses a `<textarea>`, so every editor feature checks `cm`.
  - **Icons:** Flaticon UIcons 2.6.0 (regular rounded), written as `<i class="ic fi fi-rr-NAME" data-fb="X">`. `<body class="nofi">` shows the Unicode fallbacks until the font loads, and `checkIcon` covers a single missing glyph.
- **Go easy on Compiler Explorer** ([ADR-0003](docs/architecture/decision_records/0003-compile-through-compiler-explorer.md)). Keep the 800 ms debounce and the AbortController, and add nothing that sends requests on its own.
- **The language-server security model holds** ([ADR-0004](docs/architecture/decision_records/0004-route-language-servers-through-a-localhost-gateway.md)). The gateway listens on 127.0.0.1 only and checks the token, the Host header and the Origin. Language containers have no internet access.
- **The app never starts or controls containers.** That would hand a website a way into your computer. The settings dialog shows the `docker compose` command instead.
- **The credits and licence notices stay** ([ADR-0002](docs/architecture/decision_records/0002-license-under-gpl-3.0-only.md)).
  - **Footer:** Compiler Explorer API (Matt Godbolt and contributors, "Not affiliated"), "Made by Dervis Mansuroglu", "Built with Claude by Anthropic", and the Flaticon attribution, which the icon licence requires.
  - **About dialog:** the licence notice, the source link and the “Made by Dervis Mansuroglu” credit, which is the additional term in `ADDITIONAL-TERMS.md`.
  - **New source files:** they get the SPDX header that `gateway.js` carries.

## Compiler Explorer

- **Base URL:** `https://compiler-explorer.com/api`. Call it Compiler Explorer or compiler-explorer.com, not godbolt.org.
- **The app makes four calls:**
  - `GET /api/languages?fields=id,name,defaultCompiler,example`
  - `GET /api/compilers/<lang>?fields=id,name,semver`
  - `POST /api/compiler/<id>/compile` with `filters.execute:true`, `intel:true` and the rest of the filters
  - `POST /api/shortener` for "Open in CE", falling back to a `/clientstate/<base64>` link
- **Languages:**
  - The 29 featured languages are in `LANGS` (editor mode, default flags) and `HELLO` (starter programs).
  - The rest are listed under "More on Compiler Explorer" and start from the API's `example`.
  - Ids are Compiler Explorer's (`c++`, `csharp`, `objc`, `llvm`, …).

## App internals (`app/index.html`)

- **Saved state:** everything lives in `localStorage['livecc:v1']`. An inline script in `<head>` applies the theme before the first paint. Wrap all storage access in try/catch.

  ```
  {lang, code:{lang:src}, compilers:{lang:id}, flags:{lang:str},
   layout, theme:'light'|'dark'|'system', font, auto, tab,
   lsp:{enabled, url, token, langs:{java:bool,…}}}
  ```

- **Layout tree:** a leaf is a panel id (`'editor'|'asm'|'output'|'diag'`); a split is `{d:'row'|'col', s:[fractions], c:[children]}`.
  - The helpers are `norm` (flattens same-direction nesting, renormalises sizes), `without`, `dock(tree, target, id, side)` (side is left, right, top, bottom or center, where center swaps), `togglePanel` and `PRESETS`.
  - `validTree` guards stored layouts.
  - Panel DOM nodes are created once and moved between slots, which keeps CodeMirror's state. Call `refreshEditor()` after moving them.
- **Narrow screens:** below 820 px, the nav becomes a ☰ menu and the panels become tabs (`state.tab`).
- **Source ↔ assembly links:** assembly lines carry `data-line` from `asm[].source.line`. The cursor highlights matching assembly lines; hovering an assembly line highlights its source line.

## Language-server client (inside `app/index.html`)

- **Connecting:**
  - `LSP_LANGS` maps app language ids to server keys (`c++`→`cpp`); `LSP_ALL` lists the languages in the settings dialog.
  - `startLsp()` probes `/health`, then needs the language ticked, its container running and a token.
  - The token comes from `/token` when the gateway serves the app; otherwise the user pastes it.
- **`LspClient`** is a small JSON-RPC client over a WebSocket.
  - It waits for the bridge's `bridge/ready` (`rootUri`, `documentUri`, `languageId`), then sends `initialize`, `initialized` and `didOpen`, and a full-text `didChange` on every edit.
  - It answers server requests (`workspace/configuration`, …) with nulls.
- **Completion:** show-hint with an async `lspHint`, client-side prefix filtering and `completionItem/resolve` for docs. It triggers on `.`, `::`, `->`, 2+ identifier characters and Ctrl+Space.
- **Signature help** fires from the `change` event, not `inputRead`, because closebrackets inserts `()` itself.
- **Hover** waits 450 ms.
- **Diagnostics** use `markText` (`lsp-err`, `lsp-warn`, message as `title`); the counts show in the Source panel's title bar.
- **Close codes:**

  | Code | Meaning |
  |---|---|
  | 4401 | Bad token |
  | 4404 / 4503 | Container not running (retries every 15 s) |
  | 4408 | Idle |
  | 4429 | Too many sessions |
  | 1011 | Server crashed (no retry) |

## Language servers (`lsp/`)

```
browser ─ws /lsp/<lang>?token=─▶ gateway (127.0.0.1:7998, only published port)
                                   └─▶ lsp-<lang> containers on an `internal: true` network
```

- **`gateway/gateway.js`:**
  - It serves `/health`, `/token`, and at `/` a **copy** of the app in `gateway/public/index.html`, which `npm run sync` keeps in step.
  - It polls each container's `/health` every 5 s.
- **`bridge/server.js`** runs in every container ([ADR-0005](docs/architecture/decision_records/0005-run-language-servers-behind-a-bridge-one-container-per-language.md)).
  - It pipes stdio (Content-Length framing) to the WebSocket.
  - Each session gets a scratch project from `bridge/templates/<lang>` and its own process group.
- **Dockerfiles:** each `languages/<x>/Dockerfile` copies `node` and the bridge from a shared build stage into an official toolchain image. They run as uid 10001, with `lsp/` as the build context.
- **pyright must be 1.1.414 or newer** (pinned in `docker-compose.yml`, the Python Dockerfile and CI). 1.1.390 goes silent after `initialized` when the client declares `workspace.workspaceFolders`, as the app does.
- **Adding a language:** follow `lsp/README.md`, and also add the language to the gateway's `NAMES` table, which its steps leave out ([#8](https://github.com/dervism/live-compiler/issues/8)).

## What's tested

CI runs `npm run check` and `tests/e2e-lsp.mjs`, which drives the app in headless Chromium against the gateway and bridge with pyright. Everything else that's untested or broken has an issue, for example:

- [#9](https://github.com/dervism/live-compiler/issues/9): the Docker images have never been built.
- [#10](https://github.com/dervism/live-compiler/issues/10): only pyright has run with the app.
- [#1](https://github.com/dervism/live-compiler/issues/1): some syntax colours are unreadable in the dark theme.

## Working on it

```sh
npm run sync     # copy app/index.html → lsp/gateway/public/index.html; run after every app edit
npm run check    # syntax checks, compose config, gateway copy in sync
npm i -g pyright@1.1.414 && npm run setup:test && npm i && npx playwright install chromium
npm run test:e2e
```

- **App edits:** edit `app/index.html` in place, then run `npm run sync` and `npm run check`.
- **Style:**
  - Match the surrounding code.
  - Use the UI tokens (`--bg`, `--panel`, `--accent`, …), and define every new colour for both themes.
  - Text the user sees uses typographic quotes and apostrophes.
- **ADRs** ([ADR-0001](docs/architecture/decision_records/0001-record-architecture-decisions.md)):
  - **When one is needed:** for a decision that's hard to reverse, changes a constraint or an interface (the Compiler Explorer calls, the gateway, the saved state), or concerns security, licensing or CI.
  - **How:** start from `adr-template.md`, and add the register row in the same pull request.
  - **Changes:** accepted ADRs aren't rewritten; a new ADR supersedes them.
- **Work tracking** ([ADR-0006](docs/architecture/decision_records/0006-track-work-in-github-issues.md)):
  - File every bug, gap or follow-up as an issue as soon as it's found, with a task list and links to the related ADRs.
  - ADRs never hold to-do lists or status.
  - Security problems go into a private advisory, as `SECURITY.md` describes.
- **Models** go in `docs/architecture/models/` in any tool's format; diagrams inside ADRs stay Mermaid C4 ([ADR-0007](docs/architecture/decision_records/0007-keep-architecture-models-in-any-tool.md)).
