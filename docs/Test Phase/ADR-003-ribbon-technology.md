# ADR-003: Ribbon Implementation as Plain HTML/CSS in Electron Renderer
**Date:** 2026-06-22
**Status:** Accepted

## Context

The custom ribbon must render in the Electron shell's own window chrome area,
above the embedded VSCodium surface. A technology choice is needed for the
ribbon renderer: a full frontend framework (Vue, React), a web component
library, or plain HTML/CSS.

## Decision

Implement the ribbon as plain HTML/CSS in the Electron main window's renderer
process. No frontend framework. No build step for the ribbon itself.

## Rationale

- The PoC ribbon is static (visual only, no command wiring); a framework adds
  no value at this scope
- Plain HTML/CSS eliminates a build pipeline from the PoC, keeping the
  feedback loop fast and the diff surface small
- If the PoC succeeds and the full rewrite proceeds, Vue components from the
  existing JuliaLab ribbon can be adopted then — this decision does not
  foreclose that path
- Electron's renderer process runs Chromium 142; modern CSS (grid, custom
  properties, flexbox) is fully available without a framework

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Vue 3 (porting existing JuliaLab ribbon) | Adds Vite build step and npm dependency graph to PoC; obscures whether embedding works |
| React | Same objection; no prior art in this codebase |
| Web Components | Correct long-term direction but adds spec complexity unnecessary for a static PoC |

## Consequences

- **Easier:** zero build tooling for ribbon; Antigravity diffs are single HTML/CSS files; fast iteration
- **Harder:** when full rewrite adopts Vue, ribbon must be rewritten (not just lifted); this is acceptable given PoC scope
- **Locked in:** ribbon interacts with Electron main process via `contextBridge` / `ipcRenderer` for window controls (minimize/maximize/close); this IPC pattern must be preserved in the full rewrite
