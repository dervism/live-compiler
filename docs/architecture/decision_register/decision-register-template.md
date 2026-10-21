# Architecture decision register

<!--
How to use this template: copy this file to `README.md` in this folder, so GitHub shows the
register when someone opens the folder. Then delete this comment and the example rows.
-->

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
| [ADR-NNNN](../decision_records/NNNN-short-title.md) | Short title | Proposed | YYYY-MM-DD | Area | – |

## Pending decisions

<!-- Questions that need an ADR but don't have one yet. They get a number only when the ADR is written. -->

| Question | Why it matters | Owner | Issue |
|---|---|---|---|
| The question, phrased as a choice | What it affects or blocks | A team or role | The GitHub issue where it's being decided |

## How this register is kept

- Every accepted architecture decision has an ADR, and every ADR has a row here.
- A new ADR and its row are added in the same pull request.
- When an ADR's status changes, update both the ADR and its row.
- Superseded and rejected ADRs stay in place for the record; their rows say what replaced them.
- When a pending decision gets its ADR, move it from "Pending decisions" to "Decisions".
- Revisit an accepted ADR when its review trigger happens.
