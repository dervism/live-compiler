# ADR-0007: Keep the architecture models in docs/architecture/models, in any tool's format, while ADRs keep Mermaid C4

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-21 |
| **Owner** | Maintainers (currently Dervis Mansuroglu) |
| **Area** | Docs and process |
| **Requirements** | – |
| **Supersedes** | – |
| **Related** | Amends the diagram convention in [ADR-0001](0001-record-architecture-decisions.md); issues [#11](https://github.com/dervism/live-compiler/issues/11) (setting up Structurizr) and [#2](https://github.com/dervism/live-compiler/issues/2) (checking ADR diagrams) |

## Context

[ADR-0001](0001-record-architecture-decisions.md) chose Mermaid's C4 syntax for architecture diagrams, because GitHub renders Mermaid in Markdown. It rejected D2, PlantUML and Structurizr for the same reason: GitHub can't render them.

Drawing the first diagrams, for ADR-0003 to ADR-0005, showed the limits of Mermaid's C4 support for real modelling work:

- **The syntax is experimental,** and the layout can barely be controlled: overlapping labels had to be moved by hand, one offset at a time.
- **Colours are fixed,** and boundary labels can't be recoloured, so they're unreadable in GitHub's dark mode.
- **Each diagram is a separate drawing.** Nothing keeps element names, descriptions and relationships consistent from one diagram to the next.

The project now needs C4 models of the whole system, at three levels: the system context, the containers, and the components.

Modelling tools differ in what they offer:

- **[Structurizr](https://docs.structurizr.com/ai)** keeps a single model as code and draws consistent views from it. It was created by the author of the C4 model, enforces C4's rules (for example, containers must belong to a software system), and is free and open source.
  - Its [`local` command](https://docs.structurizr.com/local) runs on your own computer, in Docker, and accepts only `localhost` URLs.
  - It exports views to [Mermaid](https://docs.structurizr.com/export/mermaid), PlantUML and C4-PlantUML. Its Mermaid output needs Mermaid's `securityLevel: "loose"` to render correctly.
  - Its [MCP server](https://docs.structurizr.com/ai/mcp) gives AI assistants tools to validate, parse and inspect the model, and to export views.
- **D2 and C4-PlantUML** are diagrams-as-code tools, with better layout control than Mermaid.
- **Other tools** produce images and documents, such as SVG, PNG and PDF.

## Decision drivers

1. Diagrams in ADRs keep rendering on GitHub, with no tools needed.
2. Modelling work can use the tools best suited to it, with views that stay consistent with each other.
3. Models are kept as text where possible, so they can be versioned, reviewed and compared.
4. People without a modelling tool can still see the models.
5. AI assistants can help with modelling.

## Options considered

### Option 1: Mermaid C4 for everything (ADR-0001 as it stood)

- **Pros:** One syntax, and GitHub renders all of it.
- **Cons:** Experimental C4 support and poor layout control. No shared model, so diagrams drift apart. Not suited to modelling the whole system.

### Option 2: A single modelling tool for everything, including the diagrams in ADRs

- **Pros:** One consistent model behind every diagram.
- **Cons:** GitHub can't render a modelling tool's own format, so ADRs would need exported images, which go stale. Structurizr's Mermaid export needs a setting that GitHub's rendering may not allow.

### Option 3: A models folder open to several tools and file types, while ADRs keep Mermaid C4

- **Pros:** ADR diagrams still render on GitHub. Modelling work gets proper tools. Exported images let anyone view the models.
- **Cons:** Several tools to learn and install. Models made in different tools can drift apart. Exported images and PDFs add binary files that can't be compared line by line, and that go stale when their source changes.

## Decision

We will keep the architecture models in `docs/architecture/models/`, and allow any modelling tool's files there, while ADRs keep using Mermaid C4 (option 3).

- **The models folder holds the C4 models of the whole system:** the system context, the containers and the components.
- **Any tool's files are allowed there:** source formats such as Structurizr DSL (and Structurizr's workspace JSON), D2, C4-PlantUML and Mermaid, and exports such as SVG, PNG and PDF.
- **Diagrams in ADRs keep using Mermaid's C4 syntax,** in `mermaid` code blocks, so GitHub renders them. ADR-0001's conventions for those diagrams, including its rules for dark mode, still apply. An ADR may link to a model or an export in `docs/architecture/models/` for more detail.
- **Models describe the system as it is; an ADR's diagram shows what its decision was about, at the time of the decision.** Where the two differ, the models describe the current system.
- **Each export sits next to the source it was generated from, and is named after it,** so it can be regenerated when the source changes.
- **Structurizr is the first tool to set up.** Running it locally, and its MCP server, is tracked in [#11](https://github.com/dervism/live-compiler/issues/11).

## Consequences

- **Positive:** ADR diagrams stay readable on GitHub without tools. Modelling gets tools that keep views consistent and check C4's rules. AI assistants can work on the models through Structurizr's MCP server.
- **Negative:** Contributors may need to install a tool to change a model. ADR diagrams and models are maintained separately. Binary exports make the repository larger.
- **Risks and mitigations:**
  - **A model and an ADR diagram disagree:** the models describe the current system, and the ADR diagram the moment of the decision, as stated above.
  - **Exports go stale:** each one is named after its source and regenerated when the source changes. SVG is preferred to PNG and PDF where a tool offers it, since it's text and smaller.
  - **Structurizr's Mermaid export can't simply be pasted into an ADR:** it needs `securityLevel: "loose"`, and may not use Mermaid's C4 syntax. ADR diagrams therefore stay hand-written unless an export is shown to meet ADR-0001's conventions.
  - **Modelling tools run as local web services:** their ports are published on 127.0.0.1 only, as for the project's own services. Models are sent only to locally run tools, not to public instances such as `mcp.structurizr.com`.

## Architectural impact

- **Components:** none of the running system. This adds `docs/architecture/models/`.
- **Interfaces:** none.
- **Quality attributes:** how easy the system is to understand and to change, and the accuracy of its documentation.
- **Diagram:** none for this decision.

## Validation

- Reviewers check in pull requests that diagrams in ADRs are `mermaid` code blocks using Mermaid's C4 syntax, and that every export sits next to its source.
- The automatic ADR check in [#2](https://github.com/dervism/live-compiler/issues/2) verifies that ADR diagrams use Mermaid's C4 syntax.

## Review trigger

- GitHub starts rendering another modelling format, such as Structurizr DSL, D2 or PlantUML.
- Mermaid's C4 syntax becomes stable, or is dropped.
- One tool turns out to cover all the modelling, and the folder can be limited to it.
- Structurizr's licence or availability changes.

## Project constraints

- [x] The app stays one HTML file with no build step, and its libraries come from cdnjs only.
- [x] The editor still works when CodeMirror fails to load (the `<textarea>` fallback), and every icon keeps its Unicode fallback.
- [x] Compiler Explorer is used considerately: the 800 ms debounce and the AbortController stay, and nothing sends requests on its own.
- [x] The language-server security model holds: the gateway listens on 127.0.0.1 only and checks the token, the Host header and the Origin; language containers have no internet access.
- [x] The app never starts or controls containers.
- [x] The licence notices, the "Made by Dervis Mansuroglu" credit and the other footer credits stay.
