# Software Description Document — Sprint 8

**Project:** JuliaLabApp
**Sprint:** 8 — Tier 2 button wiring + Undo/Redo/Clipboard + FIGURES state model + Plot Builder SDD
**Version:** 0.1
**Date:** 2026-07-04
**Author:** John Peach / eurAIka
**Tag at sprint start:** `sprint7-complete`
**ADRs in force (inherited):** ADR-020, ADR-021, ADR-022, ADR-023

---

## 1. Purpose

Sprint 8 has four goals:

1. **Wire confirmed Tier 2 buttons** — CODE/RUN, CODE/DEBUG, HOME/DIRECTORY,
   HOME/PACKAGE MANAGER (Instantiate), and VIEW/DOCUMENTATION using verified
   command ids from `docs/Sprint 7/julia-commands.md`.

2. **Undo/Redo/Clipboard via keyboard injection** — implement
   `workbenchView.webContents.sendInputEvent()` in `main.js` so the ribbon
   EDIT group buttons send `Ctrl+Z`, `Ctrl+Y`, `Ctrl+X`, `Ctrl+C`, `Ctrl+V`
   directly to the workbench view, bypassing the serve-web DOM focus constraint.

3. **FIGURES tab selection state model** — PLOT TYPE buttons become radio-group
   selectors (one active at a time); STYLE and AXES buttons become toggle
   selectors (multiple can be active). Add a prominent **Plot** button at the
   right end of the FIGURES ribbon. All selection state is stored in
   `renderer.js` and passed to Sprint 9's plot builder. No commands are
   dispatched by these buttons this sprint.

4. **Plot Builder SDD** — produce a complete `docs/Sprint 8/SDD-plot-builder.md`
   specifying the Sprint 9 variable picker webview, code generation, and REPL
   execution. This document gates Sprint 9 implementation.

---

## 2. Features

### Feature 1 — Tier 2 button wiring

**CODE/RUN group** (4 buttons, all `language-julia.*`):

| Button | Command | Notes |
|---|---|---|
| Run (large) | `language-julia.executeFile` | Runs whole active file |
| Run Selection | `language-julia.executeJuliaCodeInREPL` | Executes selected code in REPL |
| Execute Cell | `language-julia.executeCell` | Executes current cell |
| Restart REPL | `language-julia.restartREPL` | Restarts Julia REPL process |

**CODE/DEBUG group** (3 buttons — palette-verify before wiring):

| Button | Candidate command | Prefix |
|---|---|---|
| Breakpoint | `editor.debug.action.toggleBreakpoint` | `editor.` ✓ |
| Step | `workbench.action.debug.stepOver` | `workbench.action.` ✓ |
| Continue | `workbench.action.debug.continue` | `workbench.action.` ✓ |

**HOME/DIRECTORY group** (3 buttons):

| Button | Command | Notes |
|---|---|---|
| Current Dir | `language-julia.cdHere` | Changes Julia working dir |
| Change Dir | `language-julia.changeCurrentEnvironment` | Changes Julia environment |
| New Folder | `workbench.action.files.newFolder` | Standard VSCode |

**HOME/PACKAGE MANAGER** (1 button):

| Button | Command | Notes |
|---|---|---|
| Instantiate | `language-julia.instantiateEnvironment` | Instantiates current env |

**VIEW/PANES** (1 button):

| Button | Command | Notes |
|---|---|---|
| DOCUMENTATION | `language-julia.show-documentation-pane` | Opens julia-vscode docs pane |

**Total Tier 2 wires this sprint:** 12 buttons, all confirmed ✓ in the
Sprint 7 dump. CODE/DEBUG ids palette-verified as first task (Spike S8-1).

### Feature 2 — Undo/Redo/Clipboard via sendInputEvent

Five buttons in CODE/EDIT currently dispatch `noop` due to the serve-web DOM
focus constraint. The fix: a new ipcMain handler in `main.js` that calls
`state.workbenchView.webContents.sendInputEvent()` with the appropriate
keyboard event. The ribbon button sends `data-dispatch="kb"` + `data-key`
to `preload.js` → `ipcRenderer` → `main.js` → `sendInputEvent`.

Key mapping:

| Button | `data-key` | Electron key event |
|---|---|---|
| Undo | `ctrl+z` | `{type:'keyDown', keyCode:'Z', modifiers:['ctrl']}` |
| Redo | `ctrl+y` | `{type:'keyDown', keyCode:'Y', modifiers:['ctrl']}` |
| Cut | `ctrl+x` | `{type:'keyDown', keyCode:'X', modifiers:['ctrl']}` |
| Copy | `ctrl+c` | `{type:'keyDown', keyCode:'C', modifiers:['ctrl']}` |
| Paste | `ctrl+v` | `{type:'keyDown', keyCode:'V', modifiers:['ctrl']}` |

Files changed: `index.html` (add `data-dispatch="kb"` + `data-key`),
`preload.js` (expose `sendKey`), `main.js` (ipcMain handler),
`renderer.js` (dispatch branch for `data-dispatch="kb"`).

### Feature 3 — FIGURES selection state model

The FIGURES tab gets a **plot configuration accumulator** — clicking buttons
sets state that the Sprint 9 Plot button will read to generate a Plots.jl call.

**PLOT TYPE group** — radio group (one selected at a time):
- Add `data-group="plot-type"` and `data-value="<type>"` to each button
- CSS: `.ribbon-btn-select` class (similar to `.ribbon-btn-toggle` but radio)
- `renderer.js`: clicking any PLOT TYPE button clears `.active` from all
  others in the group, sets `.active` on clicked button
- Selected value stored in `window.plotConfig.type`

**STYLE group** — multi-select toggles:
- Add `data-group="plot-style"` and `data-value="<style>"` to each button
- `renderer.js`: clicking toggles `.active`; active values stored in
  `window.plotConfig.style` (array)

**AXES group** — multi-select toggles:
- Add `data-group="plot-axes"` and `data-value="<axis>"` to each button
- `renderer.js`: same as STYLE; stored in `window.plotConfig.axes` (array)

**ANIMATE group** — unchanged this sprint (noop)

**FIGURE group** — wire Close, Close All; keep New wired; Tile/Cascade noop:

| Button | Command |
|---|---|
| Close | `language-julia.plotpane-delete` |
| Close All | `language-julia.plotpane-delete-all` |

**Plot button** — new large button appended after ANIMATE group:
- `class="ribbon-btn-large"`, `data-command="noop"` (Sprint 9)
- `data-dispatch="plot-builder"` attribute for Sprint 9 identification
- Visually prominent — green background to stand out from the gray ribbon
- Label: **Plot**
- Icon: `assets/icons/figures/new.svg` (reuse) or a new `plot-run.svg` if
  you want to create one

**`window.plotConfig` object** (initialised in `renderer.js`):
```javascript
window.plotConfig = {
  type: null,       // string: 'line', 'scatter', 'bar', etc.
  style: [],        // array: ['theme', 'markers', ...]
  axes: [],         // array: ['x-label', 'y-label', 'grid', ...]
};
```

### Feature 4 — Plot Builder SDD (document only, no code)

`docs/Sprint 8/SDD-plot-builder.md` specifies the Sprint 9 implementation:

- Variable picker: workspace variable list from Julia REPL (`names(Main)`
  filtered by type), displayed as dropdowns for x, y, optional z
- Plot type selection: read from `window.plotConfig.type`
- Style/axes options: read from `window.plotConfig.style` and `.axes`
- Code generation: assemble `plot(x, y, seriestype=:scatter, ...)` string
- Execution: send generated code to REPL via `language-julia.executeJuliaCodeInREPL`
  with argument — requires ADR-024 (argument-passing extension to WS bridge)
- Delivery: Plot button click opens a VSCodium webview panel or executes
  directly if variables can be inferred from workspace

---

## 3. Non-Goals

- Plot builder UI implementation (Sprint 9)
- Activity bar launchers (Sprint 9)
- HOME/PACKAGE MANAGER bulk operations (Add, Remove, Status, Registry, Update All)
- HOME/UPDATE group
- HOME/HELP group (except Docs → `language-julia.show-documentation`)
- VIEW/PANES (WORKSPACE, VARIABLE EXPLORER, HISTORY)
- FIGURES/ANIMATE group wiring
- Dropdown mechanism (ADR-022 — deferred)
- Windows packaging

---

## 4. Success Criteria (binary)

| # | Criterion | Verifiable by |
|---|---|---|
| S1 | CODE/RUN buttons execute Julia commands in REPL | Click each; observe REPL response |
| S2 | CODE/DEBUG buttons trigger debug actions | Click each with debugger attached |
| S3 | HOME/DIRECTORY buttons fire (cdHere, changeEnv, newFolder) | Click each; observe workbench |
| S4 | HOME Instantiate fires | Click; observe REPL pkg output |
| S5 | VIEW DOCUMENTATION button opens julia-vscode docs pane | Click; observe panel |
| S6 | Undo/Redo/Clipboard work from ribbon buttons | Click each with editor text selected |
| S7 | FIGURES PLOT TYPE is a radio group — clicking one deselects others | Visual + `window.plotConfig.type` in DevTools |
| S8 | FIGURES STYLE/AXES are multi-select toggles | Visual + `window.plotConfig.style/axes` in DevTools |
| S9 | FIGURES Plot button is prominent and visible | Visual |
| S10 | FIGURES Close/Close All wire to plotpane commands | Click; observe plot pane |
| S11 | `docs/Sprint 8/SDD-plot-builder.md` exists and is complete | Document present |
| S12 | Teardown clean; Sprint 7 regression green | Process-diff audit |

---

## 5. Files Changed This Sprint

| File | Change |
|---|---|
| `index.html` | Tier 2 command ids; EDIT group `data-dispatch="kb"` + `data-key`; FIGURES selection attributes + Plot button |
| `preload.js` | Expose `sendKey(key)` via `ipcRenderer.send('workbench-key', key)` |
| `main.js` | ipcMain handler for `workbench-key` → `sendInputEvent` |
| `renderer.js` | `data-dispatch="kb"` branch; FIGURES radio/toggle selection logic; `window.plotConfig` init |
| `ribbon.css` | `.ribbon-btn-select` style (FIGURES radio); Plot button green style |
| `docs/Sprint 8/SDD-plot-builder.md` | Plot builder specification (John + Claude, no code) |

---

## 6. Open Questions

**ADR-024 (needed for Sprint 9):** The WS bridge currently forwards a command
id with no arguments. `language-julia.executeJuliaCodeInREPL` requires a code
string argument. Sprint 9 needs an argument-passing mechanism. Options:
(a) encode arguments in the command string `command|arg1|arg2`,
(b) send a new message type `{ command, args: [] }` and update `extension.ts`
to call `executeCommand(command, ...args)`,
(c) add a new `julialab.executeCode` command in `extension.ts` that wraps
`executeInREPL`. Option (b) is cleanest and is the Sprint 9 ADR decision.
Noted here so it doesn't surprise the Sprint 9 design phase.

**Spike S8-1 (palette verification):** CODE/DEBUG candidate ids must be
verified in the command palette before wiring — first task of the sprint.
If any id is wrong, the correction is made in the spike report before any
`index.html` task runs.
