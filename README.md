# Live Compiler

A browser code editor that compiles as you type using the [Compiler Explorer](https://godbolt.org) API. It shows the assembly, the program output and the compiler messages, in panels you can rearrange. It works with about 28 featured languages, plus everything else Compiler Explorer supports.

| Path | What |
|---|---|
| `app/index.html` | The editor app. Open it in a browser; no install needed. |
| `deck/index.html` | A slide deck with live code slides |
| `lsp/` | Optional local language servers (Docker, one container per language) for completion, hover and live errors. See `lsp/README.md` |
| `tests/` | End-to-end test of the language-server path |
| `CLAUDE.md` | Design notes and decisions, for Claude Code or any contributor |

Made by Dervis Mansuroglu · Built with Claude by Anthropic · Compiling by the Compiler Explorer API (not affiliated) · Icons: UIcons by Flaticon
