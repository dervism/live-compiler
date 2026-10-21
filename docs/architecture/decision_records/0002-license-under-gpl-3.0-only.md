# ADR-0002: License the project under GPL-3.0-only, with an attribution term

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-21 |
| **Owner** | Maintainers (currently Dervis Mansuroglu) |
| **Area** | Licensing |
| **Requirements** | – |
| **Supersedes** | – (the earlier MIT and AGPL licences predate the ADR process; see Context) |
| **Related** | [ADR-0001](0001-record-architecture-decisions.md) (this ADR follows its conventions); the CLA-or-DCO question under "Pending decisions" in the [register](../decision_register/README.md) depends on this decision; issues [#5](https://github.com/dervism/live-compiler/issues/5) (CLA or DCO), [#2](https://github.com/dervism/live-compiler/issues/2) (checking the licence headers), [#9](https://github.com/dervism/live-compiler/issues/9) (the licence files in the Docker images) |

## Context

This ADR records a decision made before the ADR process existed.

The licence changed three times while the project was being published:

| Licence | From | Commit |
|---|---|---|
| MIT | 2026-10-20 23:16 | [`49b9f0a`](https://github.com/dervism/live-compiler/commit/49b9f0aee182854878d48683b68147d8e36e1288) |
| AGPL-3.0-only | 2026-10-21 00:07 | [`33fd8c9`](https://github.com/dervism/live-compiler/commit/33fd8c9507231397d6a49dee6fe92b903b340bf4) |
| GPL-3.0-only with an attribution term | 2026-10-21 00:57 | [`e1fae75`](https://github.com/dervism/live-compiler/commit/e1fae75e83abe0f5d6ec9d5235daffd3faa41a41) |

MIT was chosen first because it's simple and permissive. The maintainer then wanted a licence that keeps changed copies open, and chose the AGPL. That was dropped within the hour because many companies' policies ban AGPL code outright, which would cut the number of people able to use or contribute to the project.

The facts that shaped the choice:

- **The maintainer could relicense freely.** At the time there were no forks, no pull requests and no outside contributors, so there was a single copyright holder.
- **Compiler Explorer's licence doesn't apply.** The project contains none of Compiler Explorer's code (BSD-2-Clause); it only calls its public API.
- **The dependencies are permissive.** CodeMirror, `ws` and pyright are MIT-licensed. CodeMirror, the icons and the fonts are loaded from CDNs at runtime, and the language servers are downloaded when the images are built, so none of them is in the repository. The UIcons licence requires the Flaticon credit in the app's footer.
- **Hosting the app distributes it.** The app is a single HTML file whose JavaScript is sent to every browser that opens it. In the Free Software Foundation's view that counts as conveying the program, so the GPL already applies to hosted copies of the app. The gateway and the bridge, by contrast, run as servers.
- **The code was written with Claude.** Anthropic's terms give the user whatever rights Anthropic has in the output, so the maintainer can license it. How far copyright protects AI-assisted code is still unsettled; in the US, it covers the human contribution: the design decisions, choosing and arranging what went in, and the edits.

## Decision drivers

1. Changed copies of the app stay open, including copies hosted for other people.
2. The licence stays acceptable to companies and contributors; licences that many corporate policies ban outright are avoided.
3. The author credit stays visible in the app.
4. An established, OSI-approved licence that GitHub recognises, and that is compatible with the dependencies.
5. The maintainer keeps control over future licence versions.

## Options considered

### Option 1: MIT (the licence the project started with)

- **Pros:** The simplest licence, and the widest adoption.
- **Cons:** No copyleft: anyone can ship a changed copy without sharing it. The author credit only has to stay in the licence notice, not in the app.

### Option 2: AGPL-3.0-only

- **Pros:** Also covers changed copies of the gateway or the bridge that someone runs as a hosted service.
- **Cons:** Many companies ban AGPL code outright (Google, for example), so fewer people could use or contribute to the project. Its network clause adds little here: the app's code reaches every browser anyway, and the gateway is built to run only on the user's own computer.

### Option 3: GPL-3.0-only, with an attribution term under section 7(b)

- **Pros:** Copyleft for every distributed or hosted copy of the app. Much more widely accepted than the AGPL. An explicit patent licence, a 30-day period to fix a violation, and compatibility with Apache-2.0 code. Section 7(b) explicitly allows requiring an author credit.
- **Cons:** A changed gateway or bridge run as a hosted service doesn't have to be shared. Some companies avoid the GPL too. The attribution term has to stay within what section 7(b) allows; anything stricter, such as requiring the credit in the footer, would count as a "further restriction" that anyone may remove.

### Option 4: GPL-2.0

- **Pros:** Familiar, and compatible with older GPL-2.0-only code such as the Linux kernel.
- **Cons:** No explicit patent licence and no period to fix violations. Incompatible with Apache-2.0 code and with GPL-3.0. It has no mechanism for adding an attribution term.

### Option 5: A source-available licence, such as PolyForm Noncommercial

- **Pros:** Can forbid commercial use altogether.
- **Cons:** Not open source, so the project couldn't call itself that. It would put off contributors. (Creative Commons' NonCommercial licences were also ruled out: Creative Commons itself advises against using them for software.)

## Decision

We will license the project under **GPL-3.0-only** (option 3), with one additional term under section 7(b): the "Made by Dervis Mansuroglu" credit must stay in the Appropriate Legal Notices, which in this app are in the About dialog.

- **`-only`, not `-or-later`:** future GPL versions published by the Free Software Foundation don't apply automatically; the maintainers decide whether to adopt them.
- **The licence text is unmodified.** `LICENSE` holds the GPL-3.0 text exactly as gnu.org publishes it, so GitHub recognises it. The additional term is in a separate file, [`ADDITIONAL-TERMS.md`](../../../ADDITIONAL-TERMS.md). Changed versions may reword the credit to show they're modified, restyle it, move it or translate it, as long as it stays in the legal notices.
- **Source files point to the term**, as section 7 requires: `app/index.html`, `lsp/gateway/gateway.js` and `lsp/bridge/server.js` carry an `SPDX-License-Identifier: GPL-3.0-only` header and a pointer to `ADDITIONAL-TERMS.md`. New source files get the same header.
- **The About dialog shows the legal notices:** the copyright, the licence, the additional term, the absence of a warranty, and a link to the source.
- **Contributions** are accepted under the same terms, as CONTRIBUTING.md says, until the CLA-or-DCO question is decided.

## Consequences

- **Positive:** Changed copies of the app, including hosted ones, must stay open. The author credit stays in the app. GitHub recognises the licence and shows it on the repository.
- **Negative:** A changed gateway or bridge can be run as a hosted service without sharing the changes. Some companies avoid GPL code. Copies taken during the first hours keep the licence they came with: MIT for the commits from `49b9f0a` up to `33fd8c9`, and the AGPL for those from `33fd8c9` up to `e1fae75`. No forks existed at the time.
- **Risks and mitigations:**
  - Copyleft and the attribution term are only as strong as the copyright behind them, which is less certain for AI-assisted code. The human design work and edits are documented in the history. If commercial licensing ever becomes a plan, get legal advice.
  - Once others contribute, relicensing their code needs their agreement. Whether to require a CLA or a DCO is decided before the first outside contribution is merged ([#5](https://github.com/dervism/live-compiler/issues/5)).
  - An attribution term that asks too much could be removed by anyone. The term is limited to what section 7(b) allows: the About dialog only, and the wording may change.

## Architectural impact

- **Components:** all of them, through licence headers: the app (`app/index.html`), the gateway (`lsp/gateway`), the bridge (`lsp/bridge`), plus the docs and `package.json` files.
- **Interfaces:** the About dialog's legal notices become a requirement: changed versions must keep them.
- **Quality attributes:** legal compliance, and how many people can adopt and contribute to the project.
- **Diagram:** none for this decision.

## Validation

- GitHub's licence API identifies the repository's licence as "GNU General Public License v3.0".
- `LICENSE` matches the text published at gnu.org word for word.
- The About dialog shows the licence, the additional term, the no-warranty notice and the source link.
- An automatic check of the licence headers in source files is tracked in [#2](https://github.com/dervism/live-compiler/issues/2).

## Review trigger

- The first outside contribution arrives, or the CLA-or-DCO question is decided.
- Someone wants a commercial licence, or wants to run the gateway or the bridge as a hosted service.
- The project needs a dependency whose licence is incompatible with GPL-3.0.
- Docker images are published.
- The law on copyright in AI-generated work changes significantly.

## Project constraints

- [x] The app stays one HTML file with no build step, and its libraries come from cdnjs only.
- [x] The editor still works when CodeMirror fails to load (the `<textarea>` fallback), and every icon keeps its Unicode fallback.
- [x] Compiler Explorer is used considerately: the 800 ms debounce and the AbortController stay, and nothing sends requests on its own.
- [x] The language-server security model holds: the gateway listens on 127.0.0.1 only and checks the token, the Host header and the Origin; language containers have no internet access.
- [x] The app never starts or controls containers.
- [x] The licence notices, the "Made by Dervis Mansuroglu" credit and the other footer credits stay.

This ADR is a record of a licensing decision, not legal advice.
