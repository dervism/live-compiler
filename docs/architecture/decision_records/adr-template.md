# ADR-NNNN: Short title, phrased as the choice made

<!--
How to use this template
1. Copy this file to `NNNN-short-title.md` in this folder. NNNN is the next free number,
   zero-padded (0001, 0002, …). Numbers are never reused, even for rejected ADRs.
2. Fill in every section, then delete these comments.
3. Add the ADR to the decision register (../decision_register/) in the same pull request.
4. Once an ADR is accepted, don't rewrite it. To change the decision, write a new ADR that
   supersedes it, and set the old one's status to "Superseded by ADR-NNNN".
5. Don't put follow-up tasks, open questions or known gaps in the ADR. Open GitHub issues for
   them, with task lists that link to this ADR, and list the issues under "Related" (ADR-0006).
-->

| | |
|---|---|
| **Status** | Proposed <!-- Proposed · Accepted · Rejected · Deprecated · Superseded by [ADR-NNNN](NNNN-short-title.md) --> |
| **Date** | YYYY-MM-DD <!-- the date of the latest status change --> |
| **Owner** | <!-- a team or role, not just a person, e.g. Maintainers --> |
| **Area** | <!-- Editor app · Language servers · Compiler Explorer integration · CI and tooling · Licensing · Docs and process --> |
| **Requirements** | <!-- the requirements this decision answers: issues, or documents in docs/planning --> |
| **Supersedes** | – <!-- or [ADR-NNNN](NNNN-short-title.md) --> |
| **Related** | <!-- other ADRs and how they relate (depends on, related to), plus the GitHub issues and pull requests for work that follows from this decision --> |

## Context

<!--
What problem or need led to this decision? Describe the situation as it is today: requirements,
constraints, risks and what already exists. Stick to facts, and link to code, issues and
measurements where you can.
-->

## Decision drivers

<!-- The criteria the options are judged against, most important first. -->

- …

## Options considered

### Option 1: Name

<!-- What the option is, in a few sentences. -->

- **Pros:** …
- **Cons:** …

### Option 2: Name

- **Pros:** …
- **Cons:** …

## Decision

<!--
Which option was chosen, and why it beats the others against the decision drivers.
Start with "We will …".
-->

## Consequences

<!-- What becomes easier and what becomes harder. Include the downsides and the risks you accept. -->

- **Positive:** …
- **Negative:** …
- **Risks and mitigations:** … <!-- each risk you accept, and what limits it -->

## Architectural impact

<!-- Name what the decision touches, and delete the lines that don't apply. -->

- **Components:** <!-- the app (app/index.html) · the gateway (lsp/gateway) · the bridge (lsp/bridge) · the language containers (lsp/languages) · CI and scripts -->
- **Interfaces:** <!-- the Compiler Explorer API · LSP over WebSocket (browser ⇄ gateway ⇄ bridge ⇄ server) · the gateway's /health, /token and /lsp/<lang> · the saved state in localStorage['livecc:v1'] · docker compose profiles and .env -->
- **Quality attributes:** <!-- security · privacy · performance · load on Compiler Explorer · offline and fallback behaviour · accessibility -->
- **Diagram:** <!-- a Mermaid C4 diagram (C4Context, C4Container, C4Component, C4Dynamic or C4Deployment) in a mermaid code block, following ADR-0001; for more detail, link to a model in ../models (ADR-0007) -->

## Validation

<!--
How the decision is verified: a check in scripts/check.sh, the end-to-end test, a CI job, a
measurement, or a manual check that someone repeats. Describe the method, not results or gaps;
checks that don't exist yet are GitHub issues, linked from here.
-->

## Review trigger

<!--
What should make us revisit the decision. For example: a new CodeMirror version on cdnjs, a change
to Compiler Explorer's API or terms, or a language server dropping a feature we rely on.
-->

## Project constraints

<!--
These come from CLAUDE.md. Tick each one the decision keeps. If the decision changes one,
leave it unticked and explain why under Consequences.
-->

- [ ] The app stays one HTML file with no build step, and its libraries come from cdnjs only.
- [ ] The editor still works when CodeMirror fails to load (the `<textarea>` fallback), and every icon keeps its Unicode fallback.
- [ ] Compiler Explorer is used considerately: the 800 ms debounce and the AbortController stay, and nothing sends requests on its own.
- [ ] The language-server security model holds: the gateway listens on 127.0.0.1 only and checks the token, the Host header and the Origin; language containers have no internet access.
- [ ] The app never starts or controls containers.
- [ ] The licence notices, the "Made by Dervis Mansuroglu" credit and the other footer credits stay.
