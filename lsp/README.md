# Live Compiler — local language servers

This adds IDE-style help to the Live Compiler app: completion as you type, documentation on hover, parameter hints and live error squiggles. Real language servers run on your own computer, **one Docker container per language**, so you only build and run the ones you want.

| Profile | Container | Server | Rough image size |
|---|---|---|---|
| `python` | lsp-python | pyright | ~0.4 GB |
| `go` | lsp-go | gopls | ~1 GB |
| `c`, `cpp` | lsp-clang (serves both) | clangd 18 | ~0.9 GB |
| `java` | lsp-java | Eclipse JDT LS | ~0.8 GB |
| `rust` | lsp-rust | rust-analyzer | ~1.5 GB |
| `haskell` | lsp-haskell | haskell-language-server + GHC | ~4 GB |

Compiling and running still go through Compiler Explorer (compiler-explorer.com); these containers only provide editor intelligence.

## Start

```sh
cd lsp
cp .env.example .env
# edit .env: choose your languages and set a token (openssl rand -hex 16)
#   COMPOSE_PROFILES=java,python
#   LSP_TOKEN=…
docker compose up -d --build
```

You can also pick languages on the command line instead of in `.env`:

```sh
docker compose --profile java --profile python up -d --build
```

You can add a language later the same way; the ones already running keep running. To stop one, run `docker compose stop java`.

Then either:

- **Open http://localhost:7998.** The gateway serves the app and connects without a token.
- **Or open `app/index.html` directly.** Click **LSP** in the toolbar and paste the token, which you can find with `docker compose logs gateway | grep Token`.

## Choosing languages in the app

Click **LSP** in the toolbar. The settings show every language with a tick box and its status (running or not running).

- **What connects:** a language connects only when it's ticked *and* its container is running. Untick a language to turn its help off, even if its container is running.
- **Starting missing containers:** the dialog writes the exact `docker compose` command for the ticked languages that aren't running, plus the matching `COMPOSE_PROFILES` line for `.env`.
- **Late starts:** if you start a container while the app is open, it connects within about 15 seconds.

The LSP button shows the state for the current language:

| Colour | Meaning |
|---|---|
| Green | Ready |
| Blue | Starting or indexing |
| Grey | Offline or switched off |
| Hollow | The container isn't running |
| Red | Error; hover the button for details |

The app can't start or stop containers itself. That would mean giving the gateway control of Docker, which a website could try to abuse.

## Using it

- Type `.` (or `::` or `->`) after a variable, or start typing a name. **Ctrl+Space** opens suggestions at any time.
- Arrow keys pick a suggestion, Enter or Tab accepts it, and Esc closes the list. The side box shows the signature and documentation.
- Hover over a name to see its type and docs.
- Type `(` for a parameter hint.
- Wavy underlines mark errors and warnings; hover them for the message. The Source panel shows the counts.

## How it works

```
browser ──ws──▶ gateway :7998 ──▶ lsp-java    ─┐
  (token,        (127.0.0.1 only)   lsp-python  ├─ "lsp-internal" network:
   origin and                       lsp-clang  ─┘  no published ports, no internet
   host checks)
```

- **gateway** (Node, ~200 MB) is the only container with a published port. It checks the token, the Origin and the Host header. It polls each language container every 5 seconds to see what's running, and forwards each session to the right one.
- **Each language container** runs the same small bridge (`bridge/server.js`) next to its language server. Every connection gets a fresh scratch project from `bridge/templates/<lang>` and its own server process, and both are deleted afterwards.
- **No internet:** language containers sit on an `internal` Docker network, so they can't reach the internet or be reached from outside the gateway.

## Security

- **Local only:** the gateway listens on `127.0.0.1` only. Keep it that way.
- **Token:** every WebSocket needs the token. `/token` hands it out only to the page served by the gateway itself.
- **Host header check:** requests whose `Host` isn't localhost are refused, which blocks DNS rebinding.
- **Origin check:** only `file://` pages and `http://localhost` / `http://127.0.0.1` may connect.
- **Unprivileged and isolated:** language servers run as an unprivileged user, use a temporary `/tmp`, and have a memory limit per container.

## Settings (`.env`)

| Variable | Default | Meaning |
|---|---|---|
| `COMPOSE_PROFILES` | – | Languages to start with a plain `docker compose up` |
| `LSP_TOKEN` | random each start | Access token |
| `LSP_PORT` | 7998 | Port on 127.0.0.1 |
| `MAX_SESSIONS` | 6 | Concurrent sessions across all languages |
| `IDLE_MINUTES` | 30 | Close idle sessions |
| `LOG_STDERR` | false | Print language-server logs (`docker compose logs -f java`) |

Toolchain versions are build arguments in `docker-compose.yml`. If haskell-language-server doesn't support the GHC version ghcup picks, set `GHC_VERSION` (for example `9.6.6`) and rebuild with `docker compose build haskell`.

## Adding a language

1. Add a template folder in `bridge/templates/<lang>` and an entry in the `LANGS` table in `bridge/server.js`.
2. Create `languages/<lang>/Dockerfile`; copy an existing one, since they all share the same bridge stage.
3. Add a service with `profiles: [<lang>, all]` to `docker-compose.yml`, and the language to the gateway's `UPSTREAMS`.
4. Map the app's language id to it in `LSP_LANGS` and `LSP_ALL` in the app.

## Troubleshooting

- **"LSP offline":** the gateway isn't running. Check `docker compose ps`.
- **The button is hollow:** that language's container isn't running. Start it with the command from the settings dialog.
- **"LSP token":** the token changed (it's random unless you set it in `.env`).
- **"LSP error":** run `LOG_STDERR=true docker compose up -d <language>`, then `docker compose logs -f <language>` (the C/C++ service is called `clang`).
