# Test Plan — Sprint 3
**Project:** JuliaLabApp — `julialab` VSCodium extension  
**Date:** 2026-06-24  
**Repo:** `C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp`  
**Depends on:** SDD-sprint3.md, DESIGN-sprint3.md  
**Prior sprint tag:** `sprint2-complete` (ae7bb5a)

---

## Pre-Flight Checklist (run before every test session)

```powershell
# 1. Kill any lingering codium / node processes
taskkill /F /IM node.exe 2>$null
taskkill /F /IM codium.exe 2>$null

# 2. Confirm port 3456 is free
netstat -ano | findstr :3456
# Expected: no output

# 3. Confirm sprint2-complete baseline is intact
cd C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp
git log --oneline -3
# Expected: ae7bb5a at or near HEAD

# 4. Confirm Julia is reachable
& "C:\Users\johnx\.julia\juliaup\julia-1.12.1+0.x64.w64.mingw32\bin\julia.exe" --version
# Expected: julia version 1.12.1
```

---

## Section 1 — Spike A Tests (gates Task 002)

Run before any code changes. These are manual shell tests.

### SPIKE-A1 — `--default-folder` flag syntax

**Purpose:** Determine the correct CLI argument for `codium serve-web` to
open a specific folder in the workbench.

**Procedure:**

```powershell
# Create target folder if absent
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\JuliaLab"

# Test candidate 1: --default-folder
& "C:\Program Files\VSCodium\bin\codium.cmd" serve-web `
    --host 127.0.0.1 --port 3457 `
    --server-data-dir "C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp\server-data" `
    --without-connection-token `
    --default-folder "$env:USERPROFILE\JuliaLab"
# Open http://127.0.0.1:3457 in browser. Wait 10s.
```

**Pass (candidate 1):** Explorer sidebar shows `JULIALAB` folder tree.  
**Fail:** Try candidate 2 (bare positional path):

```powershell
& "C:\Program Files\VSCodium\bin\codium.cmd" serve-web `
    --host 127.0.0.1 --port 3457 `
    --server-data-dir "C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp\server-data" `
    --without-connection-token `
    "$env:USERPROFILE\JuliaLab"
```

**Record:** Which candidate passed, or FAIL-ALL if none. FAIL-ALL triggers
ADR-008 Option B fallback path — document and escalate before Task 002.

---

### SPIKE-A2 — julia-vscode activation with folder open

**Prerequisite:** SPIKE-A1 passed (folder opens in workbench).  
**Procedure:** With the browser open on the serve-web workbench from SPIKE-A1:

1. Check Activity Bar for the Julia beaker icon (flask/beaker shape, blue).
2. Click the beaker icon. Confirm the Julia Explorer sidebar opens showing
   at minimum: `JULIA WORKSPACE` and `JULIA PLOT NAVIGATOR` sections.

**Pass:** Beaker icon present and Julia Explorer opens.  
**Partial pass:** Beaker icon absent but appears after opening any `.jl` file
(create `test.jl` via File → New File, save with `.jl` extension).
Document as: `SPIKE-A2: PARTIAL — julia-vscode activates on file open only`.
Task 012 must call `juliaExt.activate()` explicitly.  
**Fail:** Beaker icon absent and does not appear after `.jl` file open.
Escalate before Task 012.

---

### SPIKE-A3 — window event bridge reachability

**Prerequisite:** SPIKE-A1 passed.  
**Purpose:** Determine whether `executeJavaScript` on `workbenchView` can
reach the extension host's event listeners — determines ADR-010 Option A vs B.

**Procedure:**

1. Temporarily add to `main.js` after `createWindow()`:
   ```js
   setTimeout(() => {
     state.workbenchView.webContents.openDevTools({ mode: 'detach' });
   }, 3000);
   ```
2. Run `npm run start:fast` (or `npm start` if extension not yet built).
3. In the workbench DevTools console, paste:
   ```js
   window.dispatchEvent(
     new CustomEvent('julialab-command', { detail: { command: 'test' } })
   );
   ```
4. Add a temporary listener in the extension's `activate()` to confirm receipt:
   ```typescript
   window.addEventListener('julialab-command', e =>
     console.log('[julialab] bridge test received:', e)
   );
   ```
5. Check the extension host output (VSCodium → Help → Toggle Developer Tools →
   look for worker console output, or check Output panel → `julialab`).

**Pass:** `[julialab] bridge test received:` appears in extension host output.
Use Option A in Task 005 and Task 012.  
**Fail:** No output in extension host. Use Option B (WebSocket) in Task 005
and Task 012. Remove temporary listener before committing Task 012.

**Record decision in commit message for Task 005:**
`Task 005: ribbon IPC handler — Option A (window event)` or `Option B (WebSocket)`.

---

### SPIKE-A4 — `julia-explorer` view container ID

**Prerequisite:** SPIKE-A1 and SPIKE-A2 passed.  
**Procedure:** In the workbench DevTools console:

```js
// List all workbench.view commands registered
Object.keys(
  globalThis._commands?._commands ??
  globalThis.vscode?.commands?._commands ??
  {}
).filter(k => k.startsWith('workbench.view'))
```

If the above returns nothing (API not accessible from main frame), instead:

1. Open Command Palette (Ctrl+Shift+P).
2. Type `julia` and scan for view-opening commands.
3. Note the exact command that opens the Julia Explorer sidebar.

**Pass:** `workbench.view.extension.julia-explorer` confirmed present.
Use as-is in Task 012.  
**Partial pass:** Different ID found (e.g. `workbench.view.julia-explorer`).
Record correct ID — patch `extension.ts` before Task 012 commit.  
**Fail:** No command found that opens Julia Explorer. Layout preset in Task 012
must be redesigned. Escalate.

---

## Section 2 — Spike B Test (gates SC-3 / ribbon PLOTS wiring)

Run after Task 002, Task 003, Task 011, and Task 012 are committed and
the extension is loading in the workbench.

### SPIKE-B1 — julia-vscode plot pane in serve-web context

**Prerequisite:** Julia REPL is running (SC-1 passing or manually started).  
**Procedure:**

```julia
# In the Julia REPL integrated terminal:
using CairoMakie
fig = lines(1:10, rand(10))
display(fig)
```

**Pass:** A PNG figure renders inside a WebviewPanel tab within the VSCodium
workbench. The plot pane is accessible without leaving the browser tab.  
**Partial pass — external popup:** Figure opens in a separate browser window
or tab outside the workbench frame. Document as:
`SPIKE-B1: PARTIAL — plot pane opens externally`.
Decision required: acceptable for Sprint 3 (SC-3 passes with caveat), or
escalate to planning chat to revisit ADR-011 fallback.  
**Fail — no output:** No figure appears and no error in DevTools console.
Run `vscode.commands.executeCommand('language-julia.show-plotpane')` in
DevTools console and observe. Escalate before any plot-related wiring.  
**Fail — error:** Error in Julia terminal or DevTools console. Record exact
error text and escalate.

---

## Section 3 — Per-Task Acceptance Criteria

Each task must pass its criterion before the next task begins.
One file changed per task. Diff reviewed before `npm start`.

| Task | File changed | Pass criterion |
|---|---|---|
| 002 | `main.js` | `npm start` → browser title bar shows `JULIALAB` in Explorer sidebar. `%USERPROFILE%\JuliaLab` directory exists on disk. No regression on window controls or server startup. |
| 003 | `server-data/Machine/settings.json` | Cold launch → terminal profile is PowerShell. Activity Bar present. No new warnings in DevTools console. |
| 009 | `package.json` (root) | `npm run build:ext` completes without error (extension not yet built — this task creates the scripts entry only). `npm run start:fast` still launches correctly. |
| 010 | `.gitignore` + `scripts/copy-extension.js` | `node scripts/copy-extension.js` exits 0 (will fail gracefully if `extensions/julialab/dist/` doesn't exist yet — acceptable). `.gitignore` entries confirmed with `git status`. |
| 011 | `extensions/julialab/package.json` + `tsconfig.json` | `cd extensions/julialab && npm install` completes. `npm run compile` exits with error (no `src/extension.ts` yet) — expected and acceptable. |
| 012 | `extensions/julialab/src/extension.ts` | `npm run compile` exits 0. `npm start` loads JuliaLab. Extension appears in workbench Extensions panel as `julialab` (installed). Julia REPL starts within 5s. Julia beaker icon visible in Activity Bar. |
| 005 | `main.js` | Ribbon IPC handler present. Verify with temporary `console.log` in handler: clicking PLOTS tab in ribbon logs `[ribbon-command] julialab.showPlots` in Electron main process output. Remove log before commit. |
| 006 | `preload.js` | `window.electronAPI.ribbonCommand` callable from renderer DevTools console without error. |
| 007 | `index.html` + `renderer.js` | Clicking each ribbon tab updates `active` class correctly. Clicking PLOTS tab triggers ribbon IPC (verified via Task 005 log or bridge behaviour). Clicking non-wired tabs (APPS etc.) produces no error. |

---

## Section 4 — Sprint 3 Acceptance Criteria

All four must pass for `sprint3-complete` tag. SC-3 requires SPIKE-B1 to
have passed first.

### SC-1 — Default workspace + REPL auto-start

**Procedure:**

1. Quit JuliaLab completely.
2. Run `npm start`.
3. Start timer when Electron window appears.
4. Observe workbench.

**Pass:** Within 5 seconds of window appearance:
- Explorer sidebar shows `JULIALAB` folder (from `%USERPROFILE%\JuliaLab`).
- Integrated terminal opens at bottom of workbench.
- Terminal shows Julia startup banner (`julia>` prompt visible).

**Fail conditions (record exactly):**
- `SC-1 FAIL: folder not open` — Explorer shows "No Folder Opened".
- `SC-1 FAIL: REPL not started within 5s` — terminal absent or shows
  PowerShell prompt only. Start timer again; if Julia appears within 15s,
  record as `SC-1 SLOW` and investigate race (Flag 2 mitigation).
- `SC-1 FAIL: REPL error` — terminal shows Julia error on startup.
  Record exact error text.

---

### SC-2 — Workspace panel visible and live

**Prerequisite:** SC-1 passing.  
**Procedure:**

1. Confirm Julia beaker icon is visible in Activity Bar.
2. Click beaker icon. Confirm Julia Explorer sidebar opens with
   `JULIA WORKSPACE` section visible (may be empty initially — expected).
3. In the Julia REPL, type:
   ```julia
   x = rand(3, 3)
   ```
   and press Enter.
4. Start timer.

**Pass:** Within 3 seconds, `x` appears in the `JULIA WORKSPACE` panel
showing name `x`, type `Matrix{Float64}`, size `3×3`.

**Fail conditions:**
- `SC-2 FAIL: workspace panel absent` — Julia Explorer sidebar has no
  `JULIA WORKSPACE` section. Check julia-vscode activation (SPIKE-A2).
- `SC-2 FAIL: variable not appearing` — `x` does not appear within 10s.
  Check julia-vscode REPL connection in Output panel → `Julia Language Server`.
- `SC-2 FAIL: wrong type or size` — variable appears but metadata is wrong.
  Record exact values shown.

---

### SC-3 — PLOTS ribbon tab wired and plot pane functional

**Prerequisite:** SPIKE-B1 passed (plot pane confirmed accessible).  
**Prerequisite:** SC-1 passing (REPL running).  
**Procedure:**

1. In the Julia REPL:
   ```julia
   using CairoMakie
   lines(1:10, rand(10))
   ```
2. Confirm a plot renders in the julia-vscode plot pane (within the workbench).
3. Navigate away from the plot pane (e.g. click the Explorer icon in Activity Bar).
4. Click the `PLOTS` tab in the JuliaLab ribbon.
5. Start timer.

**Pass:** Within 2 seconds of clicking the ribbon tab, the plot pane comes
to the foreground and the previously rendered CairoMakie figure is visible.

**Fail conditions:**
- `SC-3 FAIL: plot did not render` — no figure appeared in step 2.
  This is a SPIKE-B1 regression — re-run spike and escalate.
- `SC-3 FAIL: ribbon tab has no effect` — plot pane does not come to focus.
  Check bridge path (Option A or B) via DevTools. Escalate.
- `SC-3 FAIL: plot pane opens externally` — figure renders in a separate
  browser window. Document as known gap; advisory fail only if SPIKE-B1
  recorded this as partial pass.

---

### SC-4 — HOME ribbon tab wired

**Procedure:**

1. Click any non-editor view (e.g. Julia Explorer sidebar, terminal).
2. Click the `HOME` tab in the JuliaLab ribbon.

**Pass:** Focus moves to the editor group. If a file is open, the cursor
is active in the editor. If no file is open, the welcome/empty editor pane
is focused (no error).

**Fail conditions:**
- `SC-4 FAIL: HOME tab has no effect` — no focus change observed.
  Check ribbon IPC handler and bridge path.
- `SC-4 FAIL: error in console` — record exact error text.

---

## Section 5 — Regression Tests

Run after all SC tests pass, before tagging `sprint3-complete`.

| Test | Procedure | Pass |
|---|---|---|
| R-1: Window controls | Click minimise, maximise, close buttons in ribbon | Each performs correct OS window action |
| R-2: Window resize | Drag window to half screen, then maximise | Ribbon and workbench views resize correctly; no overlap or gap |
| R-3: Clean shutdown | Quit via close button | No orphaned `node.exe` or `codium.exe` processes in Task Manager |
| R-4: Extension install integrity | Open workbench Extensions panel | All Sprint 2 extensions listed as installed: `julialang.language-julia`, `leanprover.lean4`, `wolfbook.wolfbook`, `Anthropic.claude-code` |
| R-5: detect-deps | Check `server-data/Machine/settings.json` | Julia, Wolfram, Lean4 paths still present; not overwritten by Task 003 |
| R-6: Port conflict recovery | With JuliaLab running, try `npm start` in second terminal | Second launch exits with "Server timeout" or port error; first instance unaffected |
| R-7: `%USERPROFILE%\JuliaLab` persistence | Add a file `test.jl` to `%USERPROFILE%\JuliaLab`; relaunch JuliaLab | File still present in Explorer sidebar after relaunch |

---

## Section 6 — Failure Protocol

1. Record failure as: `FAIL: [SC-N or R-N or SPIKE-Xn] — [exact observation]`
   Include: what was seen, what was expected, any console errors verbatim.
2. **Do NOT fix inline.**
3. **Revert the last committed task** (`git revert HEAD --no-edit`).
4. **Escalate to planning chat** with the failure record before any further
   execution.

**Advisory fails** (do not block `sprint3-complete` tag, but must be documented):
- SC-3 if SPIKE-B1 was a partial pass (plot renders externally).
- SC-2 if workspace panel appears but variable update is slow (>3s but <15s).

**Blocking fails** (sprint tag must not be applied):
- SC-1 fail of any kind.
- SC-4 fail.
- Any regression in R-1 through R-5.

---

## Section 7 — Sprint Tag Checklist

Before applying `sprint3-complete` tag:

```powershell
# 1. All SC tests pass (SC-3 may be advisory)
# 2. All regression tests pass
# 3. Clean git status
git status
# Expected: nothing to commit

# 4. Confirm build artefacts are gitignored
git ls-files server-data/extensions/julialab/
# Expected: no output (directory is gitignored)

git ls-files extensions/julialab/dist/
# Expected: no output

# 5. Tag
git tag sprint3-complete
git push origin sprint3-complete
```
