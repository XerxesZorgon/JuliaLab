# ADR-003: Implement ribbon as plain HTML/CSS in Electron renderer (Sprint 1)
**Date:** 2026-06-22
**Status:** Accepted

## Context

The ribbon bar (HOME / PLOTS / APPS / LIVE EDITOR / INSERT / VIEW tabs +
window controls) must occupy the top of the Electron window above the
`WebContentsView`. It must be styled to match MATLAB R2023b+. Reference
images are available at:
`C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabShell\docs\Matlab1.png`
through `Matlab5.png`.

## Decision

Implement the ribbon as plain HTML/CSS/JS in the Electron renderer process
(`index.html` + `ribbon.css` + `renderer.js`), directly porting the
geometry and styles from the JuliaLabShell PoC.

## Rationale

- The PoC already validated the MATLAB R2023b+ ribbon geometry and CSS
  in plain HTML — no framework needed for Sprint 1.
- Keeps the renderer process dependency-free; Vue 3 can be introduced in
  Sprint 3 when the JuliaLab extension needs a component framework.
- The ribbon `WebContentsView` (or renderer div) is sized by the Electron
  main process; plain HTML is sufficient to handle resize events via IPC.
- Avoids a build step in Sprint 1; the renderer is loaded directly as
  static files.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Vue 3 component (from Compute42 fork) | Adds build toolchain complexity in Sprint 1; deferred to Sprint 3 |
| Electron `titleBarOverlay` / `customButtonsOnHover` | Does not support a full multi-tab ribbon; only replaces window controls |
| Native menu (Electron Menu API) | MATLAB ribbon UX is not a native menu; requires custom rendering regardless |

## Consequences

- Easier: no build step; direct port of PoC CSS; ribbon is ready in Task 002.
- Harder: ribbon tabs are visual-only in Sprint 1 (no command dispatch);
  command wiring is a Sprint 3 task.
- Locked in: ribbon height is defined as a CSS variable (`--ribbon-height`)
  and used by the main process to calculate `WebContentsView` bounds.
  This variable must not change without updating both `ribbon.css` and
  `main.js` `setBounds()` calls.
