# Contributing

Thanks for helping. Bug reports, fixes and new languages are all welcome. The most useful thing right now is building and trying the Docker images, which haven't been tested yet (see "Status" in the [README](README.md)).

## Before you start

- For anything bigger than a small fix, open an issue first so we can agree on the approach.
- [`CLAUDE.md`](CLAUDE.md) holds the design notes: the saved state, the layout tree, the language-server client and the container setup. Read the part you're changing.

## Ground rules

- **The app stays one HTML file with no build step.** Inline CSS and JS; load libraries from cdnjs only. It has to work when opened straight from disk.
- **Keep the fallbacks working.** If CodeMirror fails to load, the editor falls back to a `<textarea>`, so every editor feature checks `cm`. Every icon is `<i class="ic fi fi-rr-NAME" data-fb="X">` with a Unicode fallback.
- **Go easy on Compiler Explorer.** It's a free community service: keep the 800 ms debounce and the AbortController, and don't add requests that fire on their own.
- **The app never starts containers.** Giving the gateway control of Docker would hand any website a way into your computer. Show the `docker compose` command instead.
- **Keep the footer credits.** The Flaticon attribution is a requirement of the icon licence.
- **Keep the licence notice and source link in the About dialog,** including the “Made by Dervis Mansuroglu” credit, which is an additional licence term (see [ADDITIONAL-TERMS.md](ADDITIONAL-TERMS.md)).
- **Start new source files with a licence header** like the one in `lsp/gateway/gateway.js`.

## Style

- Match the surrounding code: its naming, comment density and idioms.
- Use the existing colour tokens (`--bg`, `--panel`, `--accent`, …) and define every new colour for both the light and dark themes.
- Text the user sees uses typographic quotes and apostrophes (’ “ ”).

## Checks

```sh
npm run sync      # after any change to app/index.html
npm run check     # syntax checks, compose config, gateway copy in sync
```

The end-to-end test runs the gateway and the bridge as plain Node processes and drives the app in headless Chromium:

```sh
npm i -g pyright
npm run setup:test && npm i && npx playwright install chromium
npm run test:e2e
```

CI runs both on every pull request.

## Trying the containers

```sh
cd lsp
cp .env.example .env
docker compose --profile python up -d --build    # or java, rust, go, c, cpp, haskell, all
docker compose logs -f gateway
```

If an image fails to build or a language server misbehaves, please open an issue with the output of `docker compose build <service>` or `LOG_STDERR=true docker compose up <service>`, plus your OS and CPU architecture.

To add a language server, follow "Adding a language" in [`lsp/README.md`](lsp/README.md).

## Pull requests

- Keep each pull request to one change, and say how you tested it.
- For UI changes, include a screenshot in both themes.

By contributing, you agree that your contributions are licensed under the [GNU GPL 3.0](LICENSE) (`GPL-3.0-only`), with the additional term in [ADDITIONAL-TERMS.md](ADDITIONAL-TERMS.md).
