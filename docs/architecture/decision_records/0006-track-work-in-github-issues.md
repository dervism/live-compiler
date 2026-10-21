# ADR-0006: Track bugs, gaps and follow-up work in GitHub issues, and keep ADRs to decisions

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-21 |
| **Owner** | Maintainers (currently Dervis Mansuroglu) |
| **Area** | Docs and process |
| **Requirements** | – |
| **Supersedes** | – |
| **Related** | Expands on the "Work tracking" convention in [ADR-0001](0001-record-architecture-decisions.md); [SECURITY.md](../../../SECURITY.md); the first issues filed this way are [#2](https://github.com/dervism/live-compiler/issues/2) to [#10](https://github.com/dervism/live-compiler/issues/10) |

## Context

The first ADRs (ADR-0001 to ADR-0005) collected more than decisions. While they were written, they gathered "Follow-up work" lists, notes such as "not built yet" and "not checked yet", and dated results under "Validation".

That causes problems:

- **Accepted ADRs are meant to stay put.** ADR-0001 says an accepted ADR is never silently rewritten. A task list inside one either goes stale, or forces repeated edits to a record that should be stable.
- **Tasks spread across ADRs get lost.** They can't be assigned, prioritised, discussed or closed, nobody is notified about them, and there's no single place that shows what is still open.
- **Readers can't tell decisions from to-dos.** An ADR that mixes the two is harder to trust as a record of what was decided and why.

The repository already has what issue tracking needs: a bug report form (`.github/ISSUE_TEMPLATE/bug_report.yml`), labels, and private vulnerability reporting described in SECURITY.md.

## Decision drivers

1. Every open task stays visible until it's done or explicitly dropped.
2. ADRs stay stable records of decisions and their reasons.
3. Work can be prioritised, assigned, discussed and closed, and people are notified about it.
4. Work links to the decision behind it, and each decision to its work, as ADR-0001's traceability convention asks.
5. Security problems aren't made public before they're fixed.

## Options considered

### Option 1: Follow-up lists inside each ADR (how ADR-0001 to ADR-0005 began)

- **Pros:** The tasks sit right next to the decision that caused them.
- **Cons:** Accepted ADRs shouldn't keep changing, so the lists go stale. Tasks can't be assigned, closed or searched across ADRs, and nobody is notified about them.

### Option 2: A task list file in the repository

- **Pros:** Lives with the code and is reviewed in pull requests.
- **Cons:** One more document to keep up to date by hand. No assignment, notifications or discussion, and frequent merge conflicts.

### Option 3: GitHub issues with task lists that link to the ADRs

- **Pros:** Each task is tracked until it's closed, can be assigned and labelled, and notifies the people following it. Pull requests close issues automatically ("Fixes #N"). Task lists show progress. Contributors can find work through the `help wanted` label.
- **Cons:** The work lives on GitHub rather than in the repository's files. Readers of an ADR must follow links to see what's still open. Filing issues straight away takes discipline.

### Option 4: A GitHub Projects board

- **Pros:** An overview for planning and prioritising.
- **Cons:** More overhead than a project this size needs, and it's built on issues anyway. It can be added on top of option 3 later.

## Decision

We will track bugs, gaps and follow-up work in GitHub issues, and keep ADRs to decisions (option 3).

- **File issues when the problem is found.** Every bug, gap or follow-up found in the codebase, or while writing an ADR, becomes a GitHub issue straight away, not a note for later.
- **One issue per topic,** with a task list when the work has several steps. Bugs use the bug report form. Issues are labelled `bug`, `enhancement`, `documentation`, `question` or `help wanted`.
- **Link both ways.** An issue links to the ADRs it relates to, and an ADR lists its issues under "Related".
- **ADRs contain decisions only:** the context, the decision drivers, the options, the decision, and its consequences, including the risks it accepts. No task lists, no "not done yet" notes, and no dated results.
- **"Validation" describes how a decision is verified.** A check that doesn't exist yet is an issue, linked from there.
- **Pending decisions get an issue too.** A question that needs an ADR is linked from "Pending decisions" in the [register](../decision_register/README.md). The issue closes when the ADR that answers it is accepted.
- **Security problems go into a private draft security advisory,** not a public issue, as SECURITY.md describes. ADRs don't describe a vulnerability until its fix is published.
- **Issues close through the pull request that completes them,** or with a comment that explains why the work was dropped.

## Consequences

- **Positive:** Open work is visible in one place, with its progress. ADRs stay stable, and readers can trust them as a record of decisions. Contributors can find work to pick up.
- **Negative:** The work lives on GitHub, outside the repository's files. To see what's still open, ADR readers follow links. Filing an issue for every gap takes discipline.
- **Risks and mitigations:**
  - Open issues pile up and go stale: when an ADR is superseded or its review trigger happens, its linked issues are reviewed too, and updated or closed.
  - The project moves away from GitHub: issues can be exported through GitHub's API, and ADRs link to issues by full URL, so the links say where they pointed.
  - An unfixed vulnerability is disclosed by accident: such problems go only into private advisories, and ADRs describe them only after the fix is published.

## Architectural impact

- **Components:** the ADR template and the decision register (`docs/architecture/`), and the issue templates (`.github/ISSUE_TEMPLATE/`).
- **Interfaces:** none.
- **Quality attributes:** maintainability, and how open the project's state is to contributors.
- **Diagram:** none for this decision.

## Validation

- Reviewers check in pull requests that new and changed ADRs contain no task lists or status notes, and that each new issue links to its ADRs.
- The automatic ADR check in [#2](https://github.com/dervism/live-compiler/issues/2) flags "Follow-up" sections in ADRs.

## Review trigger

- The project gains more maintainers or regular contributors, and a Projects board would help with planning.
- Open issues regularly go stale, or ADRs start collecting tasks again.
- The project moves away from GitHub.

## Project constraints

- [x] The app stays one HTML file with no build step, and its libraries come from cdnjs only.
- [x] The editor still works when CodeMirror fails to load (the `<textarea>` fallback), and every icon keeps its Unicode fallback.
- [x] Compiler Explorer is used considerately: the 800 ms debounce and the AbortController stay, and nothing sends requests on its own.
- [x] The language-server security model holds: the gateway listens on 127.0.0.1 only and checks the token, the Host header and the Origin; language containers have no internet access.
- [x] The app never starts or controls containers.
- [x] The licence notices, the "Made by Dervis Mansuroglu" credit and the other footer credits stay.
