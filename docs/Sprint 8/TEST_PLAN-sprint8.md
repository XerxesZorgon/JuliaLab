# Test Plan — Sprint 8

**Project:** JuliaLabApp
**Sprint:** 8 — Tier 2 wiring + Undo/Redo/Clipboard + FIGURES state model + Plot Builder SDD
**Version:** 0.1
**Date:** 2026-07-04
**Author:** John Peach / eurAIka
**Design doc:** `docs/Sprint 8/DESIGN-sprint8.md`

---

## 1. Test Strategy

Sprint 8 has two spikes (John-run), one document deliverable, and functional
changes across five files. Test types:

| Type | Method | Who |
|---|---|---|
| **Spike** | Manual console/palette test | John |
| **Static (diff review)** | `git diff` before any build or launch | Antigravity shows; John approves |
| **Build smoke** | `npm run build:ext` exits 0 | Antigravity (reported) |
| **Functional (button)** | Click each wired button; observe workbench response | John |
| **Functional (KB inject)** | Click Undo/Redo/Clipboard with text selected; observe edit | John |
| **Functional (selection)** | Click FIGURES buttons; inspect `window.plotConfig` in DevTools | John |
| **Document** | File exists and is complete | John |
| **Regression (teardown)** | ✕-quit + process-diff audit | John |

No automated test framework. All tests are binary pass/fail with observable outcomes.

---

## 2. Milestone Structure

| Milestone | Scope | Gate |
|---|---|---|
| M1 — Spikes | S8-1 DEBUG palette verify + S8-2 sendInputEvent verify | Both reported PASS before any implementation |
| M2 — Tier 2 wiring | 12 command id changes in `index.html` | Functional: each button produces workbench response |
| M3 — KB injection | `index.html` + `preload.js` + `main.js` + `renderer.js` | Functional: Undo/Redo/Clipboard work from ribbon |
| M4 — FIGURES state | `index.html` + `renderer.js` + `ribbon.css` | Functional: radio/toggle state; `window.plotConfig` correct |
| M5 — Plot Builder SDD | `docs/Sprint 8/SDD-plot-builder.md` | Document complete |
| M6 — Regression | Teardown + Sprint 7 criteria | Clean |

---

## 3. Test Cases

### M1 — Spikes

**T-101: Spike S8-1 — CODE/DEBUG palette verification (John-run)**

Launch: `npm run start:fast`

For each candidate id, press `Ctrl+Shift+P` in the workbench and search:

| Search term | Expected id in palette |
|---|---|
| "toggle breakpoint" | confirm exact command id shown |
| "step over" | confirm exact command id shown |
| "debug continue" | confirm exact command id shown |

**Pass:** John reports exact ids as shown in palette. Any mismatch from
the candidate ids in DESIGN-sprint8.md is noted and the correction becomes
the wired id in M2.

**Fail:** Palette shows no matching command — button stays `noop` with
updated comment.

---

**T-102: Spike S8-2 — sendInputEvent keyboard injection (John-run)**

Pre-condition: app running (`npm run start:fast`), a `.jl` file open in
editor with some text typed.

1. Press `Ctrl+Shift+I` to open ribbon DevTools
2. In Console tab, run:
```javascript
// Temporarily expose sendInputEvent path for spike
const wc = require('@electron/remote').getCurrentWebContents();
// Alternative — test via a direct ipc call once preload.js is updated,
// OR test the concept via ribbon DevTools console using window.electronAPI
// if sendKey is already exposed. Since it's not yet, use this approach:

// Actually test the CONCEPT by calling from main process context:
// Open main process DevTools from Help menu in workbench (if available)
// OR add a temporary globalShortcut for testing:
```

**Simpler spike approach** — add `sendKey` to `preload.js` first (one line,
Task M3-001), then test before writing `main.js` handler:

1. Add `sendKey` to preload.js
2. `npm run start:fast`
3. Open ribbon DevTools console, run:
```javascript
window.electronAPI.sendKey('ctrl+z');
```
4. Observe whether the editor undoes the last action.

**Pass:** Editor undoes. Report: "T-102 PASS — sendInputEvent works."
**Fail:** Nothing happens or error. Report: "T-102 FAIL — [paste any error].
Escalate to planning thread before M3 implementation."

**Sequencing:** T-102 runs after `sendKey` is added to `preload.js` (first
step of M3) but before the full `main.js` handler is written.

---

### M2 — Tier 2 Wiring

**T-201: CODE/RUN buttons fire (functional)**

Pre-condition: a `.jl` file open in editor; Julia REPL running.

| Button | Expected workbench response |
|---|---|
| Run (large) | Whole file executes in REPL; output appears |
| Run Selection | Selected code executes in REPL |
| Execute Cell | Current cell executes in REPL |
| Restart REPL | REPL restarts; fresh `julia>` prompt appears |

Each: PASS/FAIL.

---

**T-202: CODE/DEBUG buttons fire (functional)**

Pre-condition: debugger attached to a Julia file with a breakpoint set.
(If debugger cannot be attached, verify via command palette that the same
command id triggers the expected action.)

| Button | Expected response |
|---|---|
| Breakpoint | Breakpoint toggled at current cursor line |
| Step | Debugger steps over current line |
| Continue | Debugger continues to next breakpoint |

Each: PASS/FAIL.

**Note:** If Julia debugger is not available in the test environment, test
these buttons by observing whether the VSCodium debug UI responds (debug
toolbar appears/updates). Report what is observed.

---

**T-203: HOME/DIRECTORY buttons fire (functional)**

| Button | Expected response |
|---|---|
| Current Dir | Julia working directory shown or changed in REPL |
| Change Dir | Environment picker or directory dialog appears |
| New Folder | New folder dialog appears in workbench |

Each: PASS/FAIL.

---

**T-204: HOME Instantiate fires (functional)**

Click HOME → Instantiate.
**Pass:** REPL shows Pkg output (`Resolving...` or similar) for the current
environment.

---

**T-205: VIEW DOCUMENTATION fires (functional)**

Click VIEW → DOCUMENTATION toggle button.
**Pass:** julia-vscode documentation pane opens in the sidebar.

---

**T-206: FIGURES Close and Close All fire (functional)**

Pre-condition: at least one plot displayed in the julia-vscode plot pane.

| Button | Expected response |
|---|---|
| Close | Current plot removed from plot pane |
| Close All | All plots removed from plot pane |

Each: PASS/FAIL.

---

**T-207: noop buttons are silent (functional)**

Click five `noop` buttons across different tabs (e.g. HOME/Recent,
HOME/Add, CODE/Multicursor, FIGURES/Line, FIGURES/Record):
**Pass:** nothing happens; no error dialog; no console error.

---

### M3 — Keyboard Injection (Undo/Redo/Clipboard)

**T-301: Undo fires via ribbon (functional)**

Pre-condition: a `.jl` file open; type a character; cursor in editor area
but click away so editor appears to lose focus.
Click CODE → Undo.
**Pass:** the typed character is removed from the editor.

---

**T-302: Redo fires via ribbon (functional)**

Immediately after T-301, click CODE → Redo.
**Pass:** the character reappears.

---

**T-303: Cut fires via ribbon (functional)**

Pre-condition: text selected in editor.
Click CODE → Cut.
**Pass:** selected text removed; clipboard contains it (paste elsewhere
to verify).

---

**T-304: Copy fires via ribbon (functional)**

Pre-condition: text selected in editor.
Click CODE → Copy.
**Pass:** selected text unchanged; clipboard contains it.

---

**T-305: Paste fires via ribbon (functional)**

Pre-condition: clipboard has text content (from T-303 or T-304).
Click CODE → Paste.
**Pass:** clipboard content inserted at cursor.

---

**T-306: No focus side-effect (functional)**

After any KB injection button click, click back in the editor and press
`Ctrl+Z` manually.
**Pass:** manual undo still works (sendInputEvent did not corrupt focus
state).

---

### M4 — FIGURES Selection State

**T-401: PLOT TYPE is a radio group (functional)**

Click LINE → observe it turns blue/highlighted.
Click SCATTER → observe LINE deselects, SCATTER highlights.
Click SCATTER again → observe it deselects (second click deselects).

Open ribbon DevTools console:
```javascript
console.log(window.plotConfig.type);
```
**Pass:** logs `'scatter'` after clicking Scatter, `null` after second click.

---

**T-402: STYLE is a multi-select toggle (functional)**

Click MARKERS → highlighted.
Click OPACITY → both MARKERS and OPACITY highlighted.
Click MARKERS again → only OPACITY highlighted.

Console:
```javascript
console.log(window.plotConfig.style);
```
**Pass:** array reflects current active selections.

---

**T-403: AXES is a multi-select toggle (functional)**

Click X LABEL, Y LABEL → both highlighted.
Console:
```javascript
console.log(window.plotConfig.axes);
```
**Pass:** `['xlabel', 'ylabel']` (order may vary).

---

**T-404: plotConfig resets correctly (functional)**

Select a plot type, switch to CODE tab, switch back to FIGURES.
Console:
```javascript
console.log(window.plotConfig);
```
**Pass:** config is unchanged (persists across tab switches; only resets
on app restart).

---

**T-405: Plot button is visible and styled correctly (visual)**

**Pass:** Plot button appears at the right end of the FIGURES ribbon,
green background, same height as CODE/Run button, label "Plot" centered
below the icon.

---

**T-406: Plot button is noop this sprint (functional)**

Click Plot button.
**Pass:** nothing happens in the workbench; no error; no console error.
`window.plotConfig` is unchanged.

---

**T-407: Selection button hover state (visual)**

Hover over an unselected PLOT TYPE button.
**Pass:** light blue tint appears on hover; no green (green is for VIEW
PANES toggles only).

---

### M5 — Plot Builder SDD

**T-501: `docs/Sprint 8/SDD-plot-builder.md` exists and is complete**

**Pass:** file present at path; contains all required sections:
- Variable discovery (Julia REPL query method)
- ADR-024 design (argument-passing WS extension)
- Webview specification (variable dropdowns, option display, Run button)
- Code generation (Plots.jl call assembly)
- Execution path (REPL dispatch)

John confirms: "T-501 PASS — SDD-plot-builder.md complete."

---

### M6 — Regression

**T-601: Teardown clean (John-verified)**

```powershell
$before = Get-CimInstance Win32_Process | Where-Object {$_.Name -match 'node|electron|codium'} | Select-Object ProcessId, CommandLine
```
`npm start` → use app → ✕-quit → wait 5s:
```powershell
$final = Get-CimInstance Win32_Process | Where-Object {$_.Name -match 'node|electron|codium'} | Select-Object ProcessId, CommandLine
Compare-Object $before $final -Property ProcessId
```
**Pass:** no output.

**T-602: Sprint 7 criteria still green**

- Drag, min/max/restore, resize flush — PASS/FAIL each
- No new console errors — PASS/FAIL
- REPL auto-starts — PASS/FAIL
- Tab switching HOME → CODE → FIGURES → VIEW → HOME — PASS/FAIL
- F2 hide/restore tab text — PASS/FAIL
- COMMAND WINDOW toggle works from ribbon — PASS/FAIL

---

## 4. Definition of Pass — Sprint 8

Sprint 8 is **green** when:

1. T-101 PASS (DEBUG ids verified — or corrections documented)
2. T-102 PASS (sendInputEvent works — or escalated with alternative approach)
3. T-201 through T-207 all PASS
4. T-301 through T-306 all PASS
5. T-401 through T-407 all PASS
6. T-501 PASS (SDD-plot-builder.md complete)
7. T-601, T-602 PASS
8. `git log --oneline -1` shows sprint 8 commit
9. Tag `sprint8-complete` pushed to `origin/main`

---

## 5. Failure Protocol

Same as Sprints 6 and 7:
1. Antigravity stops on first failure; does not patch
2. Reports verbatim output and escalates here
3. File reverted before corrected task is written
4. T-601 (teardown) is John-verified only — Antigravity never declares it

---

## 6. Out of Scope

- Plot builder UI implementation (Sprint 9)
- Activity bar launchers (Sprint 9)
- HOME/PACKAGE MANAGER bulk ops, UPDATE, HELP groups
- VIEW/PANES WORKSPACE, VARIABLE EXPLORER, HISTORY
- FIGURES/ANIMATE group wiring
- Dropdown mechanism (ADR-022)
- Windows packaging
