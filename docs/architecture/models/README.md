# Architecture models

This folder holds the C4 models of the whole Live Compiler system: the system context, the containers and the components. It's meant for real modelling work, so files from any tool are welcome here, as [ADR-0007](../decision_records/0007-keep-architecture-models-in-any-tool.md) decides:

- **Sources:** Structurizr DSL and workspace JSON, D2, C4-PlantUML, Mermaid, or another tool's format.
- **Exports:** SVG, PNG or PDF. Each export sits next to the source it was generated from and is named after it, so it can be regenerated. Prefer SVG where the tool offers it.

Diagrams inside ADRs are different: they stay Mermaid C4 code blocks, so GitHub can render them ([ADR-0001](../decision_records/0001-record-architecture-decisions.md)). The models describe the system as it is now; an ADR's diagram shows what its decision was about, at the time it was made.

Structurizr is the first tool to be set up here; see [#11](https://github.com/dervism/live-compiler/issues/11).
