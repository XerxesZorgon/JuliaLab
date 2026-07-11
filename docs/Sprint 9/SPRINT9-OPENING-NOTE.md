# Sprint 9 Opening Note — JuliaLabApp

**For:** New Claude planning thread
**Date:** 2026-07-04
**Project:** JuliaLabApp — MATLAB-to-Julia IDE (Windows desktop, Electron + VSCodium serve-web)
**GitHub:** https://github.com/XerxesZorgon/JuliaLab
**Project path:** `C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp`
**Incoming git tag:** `sprint8-complete`

---

## How to orient yourself

This project uses the **eurAIka methodology** — strict phase gating:
Problem Statement → SDD → ADRs → Design Doc → Test Plan → tasks.md → implementation.
No phase is skipped. All documents live in `docs/Sprint N/`.

**Read these first, in order:**

1. `docs/Sprint 9/SPRINT9-HANDOFF.md` — complete application state, architecture
   constraints, ADR registry, critical lessons, and the Sprint 9 task sketch.
   This is the primary orientation document.

2. `docs/Sprint 9/SDD-plot-builder.md` — the Plot Builder SDD produced at the
   end of Sprint 8. This is the primary design input for Sprint 9 implementation.
   Read it before writing any Sprint 9 documents.

3. `docs/Sprint 8/DESIGN-sprint8.md` — shows what was built in Sprint 8,
   including the `window.plotConfig` accumulator design and the Plot button
   markup. Sprint 9 consumes this.

**Sprint history** (all tagged on `origin/main`):
- `sprint6-complete` — MATLAB-style ribbon redesign (4 tabs, icon sets, CSS)
- `sprint7-complete` — Ribbon wiring Tier 1 + COMMAND WINDOW sync + DevTools
- `sprint8-complete` — Tier 2 wiring + Undo/Redo/Clipboard + FIGURES state model

Each sprint has a full document set in `docs/Sprint N/`:
SDD · ADRs · DESIGN · TEST_PLAN · tasks.md

---

## Sprint 9 primary goal

**Implement the Plot Builder** — the full functionality of the FIGURES tab
Plot button. The user selects a plot type, style options, and axes options via
the FIGURES ribbon buttons, clicks the green **Plot** button, a variable picker
opens showing Julia workspace variables, the user selects x/y variables and
clicks Run, and a Plots.jl plot appears in the julia-vscode plot pane.

**Secondary goals:**
- Activity bar launchers: Pluto, Lean, Wolfram, Claude
  (via `contributes.viewsContainers` in `extension.ts` package.json)
- KI-8: Dirty file indicator (`.` dot) missing for modified Julia files

---

## First steps in Sprint 9

The eurAIka methodology requires documents before code. The SDD is done
(`SDD-plot-builder.md`). The sequence from here:

**Step 1 — Write ADR-024** (argument passing extension to WS bridge).
Before any implementation, the `{ command, args?: any[] }` extension to the
WS bridge message format must be documented as an ADR. This is the architectural
foundation everything else in Sprint 9 depends on.

**Step 2 — Write the Sprint 9 DESIGN document**.
Expand `SDD-plot-builder.md` into a full DESIGN doc covering exact file changes,
function signatures, webview HTML structure, and message passing protocol.

**Step 3 — Write the Sprint 9 TEST PLAN**.

**Step 4 — Write tasks.md**.

**Step 5 — Run Spike S9-001 (first task, John-run)**.
Before any implementation: confirm whether `language-julia.executeJuliaCodeInREPL`
output can be captured by the extension host, or whether a file-based approach
is needed. This spike gates all other Sprint 9 implementation tasks.

---

## What NOT to do

- Do not start writing code before the design and test plan documents are complete
- Do not skip the Spike S9-001 — variable discovery is the unknown that could
  require redesigning the entire variable picker approach
- Do not modify `extension.ts` before ADR-024 is written and confirmed
- Antigravity rules (in `SPRINT9-HANDOFF.md` and `.antigravity/rules.md`):
  never taskkill electron.exe, never run npm start before diff approval,
  one file per task

---

## Key file locations

| File | What it is |
|---|---|
| `main.js` | Electron main — BaseWindow, ipcMain, workspace persistence, globalShortcuts |
| `preload.js` | contextBridge — all electronAPI methods including sendKey |
| `index.html` | Ribbon markup — FIGURES Plot button has `data-dispatch="plot-builder"` |
| `renderer.js` | Tab switching, dispatch branches, window.plotConfig, connectEventReceiver |
| `ribbon.css` | All ribbon styles including ribbon-btn-select and ribbon-btn-plot |
| `extensions/julialab/src/extension.ts` | Extension host — WS bridge, terminal sync, doc openers |
| `docs/Sprint 9/SDD-plot-builder.md` | Plot Builder design specification |
| `docs/Sprint 9/SPRINT9-HANDOFF.md` | Full architecture reference document |
| `server-data/last-workspace.json` | Persisted workspace path (gitignored, runtime) |
