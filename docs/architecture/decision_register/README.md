# Architecture decision register

This register lists every architecture decision record (ADR) for Live Compiler with its current status, and the decisions that still need one. The records themselves are in [`../decision_records/`](../decision_records/).

Each ADR is the source of truth for its decision, its reasoning and its consequences. This register is the index: use it to find decisions and see where they stand. It repeats each ADR's title, status and date; if the two ever disagree, the ADR is right and the row gets corrected.

## Statuses

| Status | Meaning |
|---|---|
| Proposed | Under discussion, not yet in effect |
| Accepted | In effect |
| Rejected | Considered and turned down; kept for the record |
| Deprecated | No longer applies, and nothing replaces it |
| Superseded | Replaced by a later ADR, named in the "Superseded by" column |

## Decisions

| ADR | Title | Status | Date | Area | Superseded by |
|---|---|---|---|---|---|
| [ADR-0001](../decision_records/0001-record-architecture-decisions.md) | Record architecture decisions as Markdown ADRs, with Mermaid C4 diagrams | Accepted | 2026-10-21 | Docs and process | – |
| [ADR-0002](../decision_records/0002-license-under-gpl-3.0-only.md) | License the project under GPL-3.0-only, with an attribution term | Accepted | 2026-10-21 | Licensing | – |
| [ADR-0003](../decision_records/0003-compile-through-compiler-explorer.md) | Compile and run code through the public Compiler Explorer API at compiler-explorer.com | Accepted | 2026-10-21 | Compiler Explorer integration | – |
| [ADR-0004](../decision_records/0004-route-language-servers-through-a-localhost-gateway.md) | Route language-server sessions through one authenticating gateway on localhost | Accepted | 2026-10-21 | Language servers | – |
| [ADR-0005](../decision_records/0005-run-language-servers-behind-a-bridge-one-container-per-language.md) | Run each language server behind a small bridge, in one container per language | Accepted | 2026-10-21 | Language servers | – |
| [ADR-0006](../decision_records/0006-track-work-in-github-issues.md) | Track bugs, gaps and follow-up work in GitHub issues, and keep ADRs to decisions | Accepted | 2026-10-21 | Docs and process | – |
| [ADR-0007](../decision_records/0007-keep-architecture-models-in-any-tool.md) | Keep the architecture models in docs/architecture/models, in any tool's format, while ADRs keep Mermaid C4 | Accepted | 2026-10-21 | Docs and process | – |

## Pending decisions

| Question | Why it matters | Owner | Issue |
|---|---|---|---|
| Should outside contributions need a CLA or a DCO? | It decides whether the project can still be relicensed, for example to sell commercial licences, once other people's code is in it. | Maintainers | [#5](https://github.com/dervism/live-compiler/issues/5) |

## How this register is kept

- Every accepted architecture decision has an ADR, and every ADR has a row here.
- A new ADR and its row are added in the same pull request.
- When an ADR's status changes, update both the ADR and its row.
- Superseded and rejected ADRs stay in place for the record; their rows say what replaced them.
- When a pending decision gets its ADR, move it from "Pending decisions" to "Decisions".
- Revisit an accepted ADR when its review trigger happens.
