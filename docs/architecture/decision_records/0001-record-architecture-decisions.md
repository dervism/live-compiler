# ADR-0001: Record architecture decisions as Markdown ADRs, with Mermaid C4 diagrams

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-21 |
| **Owner** | Maintainers (currently Dervis Mansuroglu) |
| **Area** | Docs and process |
| **Requirements** | – |
| **Supersedes** | – |
| **Related** | The [decision register](../decision_register/README.md); issues [#2](https://github.com/dervism/live-compiler/issues/2) (the CI checks), [#3](https://github.com/dervism/live-compiler/issues/3) (ADRs for earlier decisions), [#4](https://github.com/dervism/live-compiler/issues/4) (linking the ADRs from the docs) |

## Context

Live Compiler has been public since 2026-10-20. Its decisions are recorded in two places, and neither keeps the reasoning:

- **CLAUDE.md** describes how things are today. Its "Hard constraints" section explains some of the reasons, but not the options that lost, and a changed decision simply replaces the old text.
- **Commit messages** hold the rest. In the project's first two days, for example, the licence went from MIT to the AGPL 3.0 to `GPL-3.0-only` with an attribution term, pyright was pinned to 1.1.414 because 1.1.390 stops responding, and the API moved from godbolt.org to compiler-explorer.com. Why each choice was made, and what else was considered, is only in commit messages and chat history.

There are no architecture diagrams either. The only picture of the system is an ASCII sketch in `lsp/README.md` and `CLAUDE.md`.

## Decision drivers

1. The reasons behind a decision, including the options that lost, stay findable and survive later changes.
2. Decisions are reviewed like code: plain text in the repository, changed through pull requests.
3. Records and diagrams render on GitHub without extra tools or a build step, like the rest of the project.
4. The process is light enough for a small project to keep up.
5. Mistakes such as broken links, invalid statuses or missing fields are caught automatically.

## Options considered

### Option 1: Markdown ADRs and a register in the repository, with Mermaid C4 diagrams

- **Pros:** Versioned and reviewed with the code. GitHub renders both Markdown and Mermaid, so nothing needs building. Plain text can be checked in CI. C4 gives diagrams consistent levels of detail (context, containers, components).
- **Cons:** Each decision takes some writing. The register repeats each ADR's title and status, so the two can drift apart. Mermaid's C4 support is experimental.

### Option 2: Keep recording decisions in CLAUDE.md and commit messages

- **Pros:** No new process. CLAUDE.md is already read by Claude Code and by contributors.
- **Cons:** Rejected options and replaced decisions are lost. CLAUDE.md keeps growing. Commit messages are hard to find and can't be corrected later.

### Option 3: GitHub issues, Discussions or the wiki

- **Pros:** Good for discussion and comments, and easy to link to.
- **Cons:** The decisions live outside the repository's history. Wiki pages aren't reviewed through pull requests. They're hard to check in CI, and they'd be lost if the project moved away from GitHub.

### Option 4: Diagrams in D2, PlantUML or Structurizr instead of Mermaid

- **Pros:** Better layout control (D2), and mature C4 tooling (C4-PlantUML and Structurizr).
- **Cons:** GitHub doesn't render any of them in Markdown, so every diagram would need a rendering step and generated images in the repository. That goes against the project's no-build-step approach.

## Decision

We will record architecture decisions as ADRs in this repository (option 1), with these conventions:

- **Identifiers:** each ADR gets the next sequential, stable ID: ADR-0001, ADR-0002, and so on. IDs are never reused or renumbered, not even for rejected ADRs. The file is `docs/architecture/decision_records/NNNN-short-title.md`.
- **File format:** ADRs and the decision register are Markdown. ADRs start from [`adr-template.md`](adr-template.md), and the register lives in [`../decision_register/README.md`](../decision_register/README.md). Architecture diagrams use Mermaid's [C4 diagram syntax](https://mermaid.ai/open-source/syntax/c4.html) in `mermaid` code blocks, so GitHub renders them.
- **Status:** every ADR has exactly one of these statuses: Proposed, Accepted, Rejected, Superseded or Deprecated. The register defines them.
- **Ownership:** every ADR names a team or role as its owner, for example "Maintainers", not just a person.
- **History:** an accepted ADR is never silently rewritten. Corrections that don't change its meaning, such as typos and broken links, are fine. Any meaningful change goes into a new ADR that supersedes the old one, or refers back to it.
- **Traceability:** every ADR links to the requirements it answers, the components it affects (in its "Architectural impact" section) and its related ADRs.
- **Work tracking:** ADRs record decisions, not work. Follow-up tasks, open questions and known gaps go into GitHub issues, with task lists, that link to the relevant ADRs; an ADR lists those issues under "Related". Security problems go into a private security advisory instead, as SECURITY.md describes.
- **Automation:** CI checks the ADRs and the register: links resolve, IDs are unique and sequential and match the file names, status values are valid, required metadata is filled in, and every ADR has a matching row in the register.
- **Source of truth:** each ADR is authoritative for its decision, its reasoning and its consequences. The register is authoritative for finding decisions and for the overview, but it isn't a second copy of the decisions. It repeats each ADR's title, status and date, and if the two disagree, the ADR is right and the register is corrected.
- **What needs an ADR:** a decision that is hard to reverse; that changes a project constraint; that changes an interface (the use of the Compiler Explorer API, the language-server protocol and the gateway's endpoints, or the saved state in `localStorage`); or that concerns security, licensing, or the tools and CI that contributors depend on. Bug fixes, refactoring within the constraints, and UI adjustments don't need one.

## Consequences

- **Positive:** The reasons behind decisions, and the options that lost, stay in the repository next to the code. Decisions get reviewed in pull requests. Everything renders on GitHub as it is.
- **Negative:** Each significant decision now costs an ADR and a register row. The register repeats some of each ADR, so the two can drift apart.
- **Risks and mitigations:**
  - The register drifts from the ADRs: the CI check compares them ([#2](https://github.com/dervism/live-compiler/issues/2)).
  - Mermaid's C4 syntax is experimental and may change: keep diagrams simple, and stick to the elements C4-PlantUML also supports, since Mermaid follows its syntax.
  - Mermaid's C4 diagrams use fixed colours, so they don't adapt to GitHub's dark mode: check new diagrams in both of GitHub's themes. What works, found while drawing the diagrams in ADR-0003 to ADR-0005:
    - Give every relationship a mid-grey label and line, `UpdateRelStyle(from, to, $textColor="#7a7a7a", $lineColor="#7a7a7a")`, which reads at about 4.3:1 on both white and GitHub's dark background.
    - Leave boundaries unlabelled, because Mermaid can't recolour their labels; say where things run in the title and in the element descriptions instead.
    - Space shapes out with `%%{init: {"c4": {"c4ShapeMargin": 90}}}%%` and `UpdateLayoutConfig($c4ShapeInRow="2")`, and move labels that still overlap with `$offsetX` and `$offsetY`.
  - The process becomes too heavy for a small project: ADRs are only for the decisions listed under "What needs an ADR".

## Architectural impact

- **Components:** none of the running system. This adds `docs/architecture/` and, later, a check in CI.
- **Interfaces:** none.
- **Quality attributes:** maintainability, and how easy the project is to understand and contribute to.
- **Diagram:** none for this decision.

## Validation

`npm run check` fails on a broken link, a duplicate or out-of-order ID, an invalid status, missing metadata, or an ADR missing from the register ([#2](https://github.com/dervism/live-compiler/issues/2)). Reviewers also check new and changed ADRs in pull requests.

## Review trigger

- ADRs stop being written, or keeping them up costs more than it saves.
- Mermaid changes or drops its C4 syntax, or GitHub stops rendering it.
- The project gets more maintainers, and ownership needs splitting into more roles.

## Project constraints

- [x] The app stays one HTML file with no build step, and its libraries come from cdnjs only.
- [x] The editor still works when CodeMirror fails to load (the `<textarea>` fallback), and every icon keeps its Unicode fallback.
- [x] Compiler Explorer is used considerately: the 800 ms debounce and the AbortController stay, and nothing sends requests on its own.
- [x] The language-server security model holds: the gateway listens on 127.0.0.1 only and checks the token, the Host header and the Origin; language containers have no internet access.
- [x] The app never starts or controls containers.
- [x] The licence notices, the "Made by Dervis Mansuroglu" credit and the other footer credits stay.
