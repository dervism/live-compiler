# ADR-0008: Build the production version of the editor app with Astro

| | |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-10-21 |
| **Owner** | Maintainers (currently Dervis Mansuroglu) |
| **Area** | Editor app |
| **Requirements** | – |
| **Supersedes** | – (the one-file app predates the ADR process; see [#3](https://github.com/dervism/live-compiler/issues/3)) |
| **Related** | [ADR-0003](0003-compile-through-compiler-explorer.md) (the app has no server of its own); [ADR-0004](0004-route-language-servers-through-a-localhost-gateway.md) (the gateway serves a copy of the app) |

## Context

The editor app, `app/index.html`, is a single HTML file of about 1,600 lines: inline CSS and JavaScript, no build step, and libraries loaded from cdnjs. That made the first version quick to build and easy to run, since it opens straight from disk.

This version is a minimum viable product (MVP). It has no components, no modules and no unit tests, and every new feature makes the one file harder to change. The project needs a production version, built on a frontend tech stack chosen for it.

## Decision drivers

1. A production-quality app, with a sound architecture that can grow.
2. Freedom to choose UI component libraries, and to change them later, without being locked to one.
3. No server of its own: like the MVP, the app is static files that run in the browser ([ADR-0003](0003-compile-through-compiler-explorer.md)).

## Options considered

### Option 1: Keep the one-file app

- **Pros:** No build step and no dependencies. It already works, and it opens from disk.
- **Cons:** A one-file MVP isn't a production-quality app, and it isn't a good architecture for an app of this size.

### Option 2: Next.js

- **Pros:** A widely used framework with a large ecosystem.
- **Cons:** Next.js is built on React, so it locks the app to React.

### Option 3: Astro

- **Pros:** Astro supports components from several UI frameworks, such as React, Preact, Svelte, Vue and Solid, through its integrations. That leaves the project free to choose, mix or change component libraries in the long run. Astro builds static sites, so the result is plain HTML, CSS and JavaScript with no server running behind it.
- **Cons:** It adds a build step and npm dependencies.

## Decision

We will build the production version of the editor app with Astro (option 3), because it doesn't tie the app to one component library, and because it builds the app as a static site, so the app still needs no server of its own. The one-file app stays as the MVP until the Astro version replaces it.

Which UI framework to use first and where the code lives are left to later decisions, with their own ADRs where they need one.

## Consequences

- **Positive:** The app can be split into components and modules, and tested. The project can pick the right component library for each part, and change it later.
- **Negative:** Contributors need Node.js and a build to work on the app. For a while there are two versions of the app. The production version drops the first project constraint (one HTML file, no build step, libraries from cdnjs only); the MVP keeps it until it's replaced.
- **Risks and mitigations:**
  - **The built files may not open straight from disk,** as the MVP does, because Astro's pages link their scripts and styles with root-relative paths by default. Any static web server can serve them instead, and so can the gateway, which already serves the app.
  - **Users lose their saved code when the app is replaced:** the production version keeps reading `localStorage['livecc:v1']`.

## Architectural impact

- **Components:** the app (`app/index.html`, replaced in time by an Astro project); the gateway, which serves a copy of the app; CI and scripts, which will build and test it.
- **Interfaces:** none change. The saved state in `localStorage['livecc:v1']` carries over.
- **Quality attributes:** maintainability and testability. The app stays static, with no server of its own.
- **Diagram:** none for this decision.

## Validation

CI builds the Astro app and runs the end-to-end test against the build.

## Review trigger

- Astro drops or limits its support for a UI framework the app uses.
- The app needs a server of its own, so it can no longer be a static site.
- Astro's licence or maintenance changes.

## Project constraints

- [ ] The app stays one HTML file with no build step, and its libraries come from cdnjs only.
- [x] The editor still works when CodeMirror fails to load (the `<textarea>` fallback), and every icon keeps its Unicode fallback.
- [x] Compiler Explorer is used considerately: the 800 ms debounce and the AbortController stay, and nothing sends requests on its own.
- [x] The language-server security model holds: the gateway listens on 127.0.0.1 only and checks the token, the Host header and the Origin; language containers have no internet access.
- [x] The app never starts or controls containers.
- [x] The licence notices, the "Made by Dervis Mansuroglu" credit and the other footer credits stay.
