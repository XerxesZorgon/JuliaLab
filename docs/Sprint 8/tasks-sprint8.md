# tasks-sprint8.md — JuliaLab Sprint 8

**Sprint:** 8 — Tier 2 wiring + Undo/Redo/Clipboard + FIGURES state model + Plot Builder SDD
**Date:** 2026-07-04
**Design doc:** `docs/Sprint 8/DESIGN-sprint8.md`
**Test plan:** `docs/Sprint 8/TEST_PLAN-sprint8.md`
**ADRs in force:** ADR-020, ADR-021, ADR-022, ADR-023

Legend: `[ ]` Pending · `[x]` Done · `[!]` Blocked · `[~]` In Progress

---

## Milestone M1 — Spikes

Both spikes gate their downstream milestones. Do not begin M2 until T-101
is reported. Do not begin M3 Task 003 until T-102 is reported.

---

### Task 001: Spike S8-1 — Palette-verify CODE/DEBUG command ids (John-run)
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** —

#### What to do
This is a **John-run spike**. Antigravity does not execute it.

Launch: `npm run start:fast`

In the workbench, press `Ctrl+Shift+P` and search for each term below.
Note the **exact command id** shown in the palette (the gray text to the
right of the command name):

| Search term | Candidate id | Palette shows |
|---|---|---|
| toggle breakpoint | `editor.debug.action.toggleBreakpoint` | _______ |
| step over | `workbench.action.debug.stepOver` | _______ |
| debug continue | `workbench.action.debug.continue` | _______ |

#### Report format
"Task 001 DONE — Breakpoint: [exact id], Step: [exact id], Continue: [exact id]"

If any id differs from the candidate, the corrected id is used in Task 002.
If a command is absent from the palette entirely, that button stays `noop`
with an updated comment in Task 002.

#### Files touched
None (spike only, no commit).

---

## Milestone M2 — Tier 2 Wiring

All changes are `index.html` only. No `extension.ts` change — all ids
fall under allowed prefixes (ADR-020). No build step required.

---

### Task 002: Wire Tier 2 command ids in index.html
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** 001 (spike result must be reported first)

#### What to do
Replace `noop` values with verified command ids for 12 buttons across CODE,
HOME, VIEW, and FIGURES. Also remove the `<!-- Tier 2: ... -->` HTML
comments above wired buttons. Use the palette-verified DEBUG ids from
Task 001.

#### Files touched
- `index.html` — 12 `data-command` attribute changes + comment removals

#### Action

**CODE/RUN group — 4 changes:**

Find and replace each `noop` in the RUN group (remove the Tier 2 comment
above each button at the same time):

```
<!-- Tier 2: language-julia.executeJuliaCodeInREPL — verify before wiring -->
<span class="ribbon-btn-large" data-command="noop">
```
→ Remove comment; change `data-command` to `language-julia.executeFile`

```
<!-- Tier 2: language-julia.executeJuliaCodeInREPL -->
<span class="ribbon-btn-small" data-command="noop">
  <span class="ribbon-icon"><img src="assets/icons/code/run-selection.svg"
```
→ Remove comment; change `data-command` to `language-julia.executeJuliaCodeInREPL`

```
<!-- Tier 2: language-julia.executeJuliaCellInREPL -->
<span class="ribbon-btn-small" data-command="noop">
  <span class="ribbon-icon"><img src="assets/icons/code/execute-cell.svg"
```
→ Remove comment; change `data-command` to `language-julia.executeCell`

```
<!-- Tier 2: language-julia.restartLanguageServer — likely language-julia.restartREPL, verify -->
<span class="ribbon-btn-small" data-command="noop">
  <span class="ribbon-icon"><img src="assets/icons/code/restart-repl.svg"
```
→ Remove comment; change `data-command` to `language-julia.restartREPL`

**CODE/DEBUG group — 3 changes (use Task 001 verified ids):**

Find each `noop` button in the DEBUG group and change to the palette-verified
id. If Task 001 confirmed the candidates:
- Breakpoint: `editor.debug.action.toggleBreakpoint`
- Step: `workbench.action.debug.stepOver`
- Continue: `workbench.action.debug.continue`

**HOME/DIRECTORY group — 3 changes:**

Find:
```html
              <span class="ribbon-btn-small" data-command="noop">
                <span class="ribbon-icon"><img src="assets/icons/home/current-dir.svg"
```
Change `data-command` to `language-julia.cdHere`

Find:
```html
              <span class="ribbon-btn-small" data-command="noop">
                <span class="ribbon-icon"><img src="assets/icons/home/change-dir.svg"
```
Change `data-command` to `language-julia.changeCurrentEnvironment`

Find:
```html
              <span class="ribbon-btn-small" data-command="noop">
                <span class="ribbon-icon"><img src="assets/icons/home/new-folder.svg"
```
Change `data-command` to `workbench.action.files.newFolder`

**HOME/PACKAGE MANAGER — 1 change:**

Find:
```html
              <span class="ribbon-btn-small" data-command="noop">
                <span class="ribbon-icon"><img src="assets/icons/home/instantiate.svg"
```
Change `data-command` to `language-julia.instantiateEnvironment`

**VIEW/PANES DOCUMENTATION — 1 change:**

Find:
```html
              <!-- Tier 2: julia documentation panel command — verify -->
              <span class="ribbon-btn-toggle" data-command="noop" data-toggle="true">
                <span class="ribbon-icon"><img src="assets/icons/view/documentation.svg"
```
Remove comment; change `data-command` to `language-julia.show-documentation-pane`

**FIGURES/FIGURE — 2 changes:**

Find:
```html
              <span class="ribbon-btn-small" data-command="noop">
                <span class="ribbon-icon"><img src="assets/icons/figures/close.svg"
```
Change `data-command` to `language-julia.plotpane-delete`

Find:
```html
              <span class="ribbon-btn-small" data-command="noop">
                <span class="ribbon-icon"><img src="assets/icons/figures/close-all.svg"
```
Change `data-command` to `language-julia.plotpane-delete-all`

#### Show diff before proceeding
Show `git diff index.html`. Confirm:
1. Exactly 12 `data-command` attribute values changed from `noop`
2. Four `<!-- Tier 2: ... -->` comments removed (RUN group)
3. One `<!-- Tier 2: ... -->` comment removed (VIEW DOCUMENTATION)
4. No structural markup changes
5. No other files modified

Wait for approval before launching.

#### Acceptance criterion
```
npm run start:fast
```
Report T-201 through T-207 from TEST_PLAN-sprint8.md:
- CODE Run/Run Selection/Execute Cell/Restart REPL — each produces REPL response
- HOME Current Dir/Change Dir/New Folder — each produces workbench response
- HOME Instantiate — REPL shows Pkg output
- VIEW DOCUMENTATION — docs pane opens
- FIGURES Close/Close All — plot pane responds
- noop buttons still silent

#### On failure
Report verbatim: "Task 002 FAILED — [list which buttons failed and what happened]"

---

### Task 002-commit: Commit M2 wiring
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** 002 (all buttons verified)

#### Action
```
git add index.html
git commit -m "Sprint 8 Task 002: Tier 2 button wiring (M2)

- CODE/RUN: executeFile, executeJuliaCodeInREPL, executeCell, restartREPL
- CODE/DEBUG: toggleBreakpoint, stepOver, debug.continue (palette-verified)
- HOME/DIRECTORY: cdHere, changeCurrentEnvironment, newFolder
- HOME/PKG: instantiateEnvironment
- VIEW/PANES: show-documentation-pane
- FIGURES/FIGURE: plotpane-delete, plotpane-delete-all"
```

#### Acceptance criterion
`git log --oneline -1` shows the M2 commit. `git status` clean.

---

## Milestone M3 — Keyboard Injection (Undo/Redo/Clipboard)

Four tasks in dependency order: preload → spike → main.js + renderer.js + index.html.
Tasks 004 (main.js) and 005 (renderer.js + index.html) only run after
Task 003 spike PASSES.

---

### Task 003: Add sendKey to preload.js + run Spike S8-2
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** —

#### What to do
Two steps in one task: (1) add `sendKey` to `preload.js` (one line),
(2) run Spike S8-2 to verify `sendInputEvent` works before writing more code.

#### Files touched
- `preload.js` — one new entry in contextBridge

#### Action — Step 1: edit preload.js
Find:
```javascript
  launchPluto:   () => ipcRenderer.send('pluto:launch'),
```
Replace with:
```javascript
  launchPluto:   () => ipcRenderer.send('pluto:launch'),
  sendKey:       (key) => ipcRenderer.send('workbench-key', key),
```

Show `git diff preload.js`. Confirm exactly one line added. Wait for approval.

#### Action — Step 2: Spike S8-2 (John-run after preload.js is approved and app launched)

```
npm run start:fast
```

Open a `.jl` file in the workbench and type a few characters.
Press `Ctrl+Shift+I` to open ribbon DevTools.
In the Console tab, run:
```javascript
window.electronAPI.sendKey('ctrl+z');
```

**Pass:** The last typed character disappears from the editor.
**Fail:** Nothing happens or error appears.

**Note:** `sendKey` calls `ipcRenderer.send('workbench-key', key)` but the
ipcMain handler doesn't exist yet — so currently it will send the message
but nothing will respond. This means the spike will FAIL until Task 004
(main.js handler) is in place.

**Revised spike approach:** Run the spike AFTER Task 004 is approved but
BEFORE it is committed. Sequence:
1. Approve and apply preload.js change (this task)
2. Write and approve main.js handler (Task 004) — show diff, wait for approval
3. Launch app — run spike in DevTools
4. If PASS → commit both preload.js and main.js together
5. If FAIL → revert both, escalate

#### Acceptance criterion (revised)
`git diff preload.js` shows exactly one new line. Spike result reported
after Task 004 diff is approved (see Task 004).

#### On failure
Report verbatim: "Task 003 FAILED — [paste diff or spike console output]"

---

### Task 004: Add workbench-key ipcMain handler to main.js
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** 003 (preload.js approved)

#### What to do
Add one ipcMain handler that receives a key string from the renderer and
sends it as a keyboard event to the workbench `WebContentsView`.

#### Files touched
- `main.js` — one new `ipcMain.on` block

#### Action
Find the `ipcMain.on('ribbon:pin', ...)` handler closing `});`. After it, add:

```javascript
  ipcMain.on('workbench-key', (_event, key) => {
    if (!state.workbenchView) return;
    const wc = state.workbenchView.webContents;
    const parts = key.toLowerCase().split('+');
    const keyCode = parts[parts.length - 1].toUpperCase();
    const modifiers = parts.slice(0, -1).map(m =>
      m === 'ctrl'  ? 'ctrl'  :
      m === 'shift' ? 'shift' :
      m === 'alt'   ? 'alt'   : m
    );
    wc.sendInputEvent({ type: 'keyDown', keyCode, modifiers });
    wc.sendInputEvent({ type: 'keyUp',   keyCode, modifiers });
  });
```

#### Show diff before proceeding
Show `git diff main.js`. Confirm only the new ipcMain block is added.
**Do not launch yet** — run Spike S8-2 first (see below).

#### Spike S8-2 (runs here, after Task 004 diff is approved)
```
npm run start:fast
```
Open a `.jl` file, type a character, open ribbon DevTools, run:
```javascript
window.electronAPI.sendKey('ctrl+z');
```

**Pass:** character removed from editor → proceed to commit and Tasks 005-006
**Fail:** nothing happens → report here; do NOT commit; revert both
`preload.js` and `main.js`; escalate to planning thread

Wait for spike result before any further tasks.

#### Acceptance criterion
T-102 PASS (spike result). Then:
`git diff main.js` shows exactly the new ipcMain block.

#### On failure
Report verbatim: "Task 004 FAILED — spike T-102 FAIL: [paste console output]"
Then: `git checkout -- preload.js main.js`

---

### Task 004-commit: Commit preload.js + main.js together
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** 004 (spike PASS)

#### Action
```
git add preload.js main.js
git commit -m "Sprint 8 Tasks 003-004: keyboard injection via sendInputEvent (M3)

- preload.js: expose sendKey() via ipcRenderer workbench-key
- main.js: ipcMain workbench-key handler → sendInputEvent keyDown+keyUp
- Spike S8-2 PASS: Ctrl+Z fires in workbench view from ribbon"
```

#### Acceptance criterion
`git log --oneline -1` shows the commit. `git status` clean.

---

### Task 005: Add KB dispatch to renderer.js + index.html EDIT group
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** 004-commit

#### What to do
Two coordinated changes: (1) add the `kb` dispatch branch to `renderer.js`,
(2) add `data-dispatch="kb"` and `data-key` attrs to the five EDIT buttons
in `index.html`.

#### Files touched
- `renderer.js` — one new dispatch branch
- `index.html` — 5 button attribute additions

#### Action — renderer.js
Find the KB injection comment placeholder in the dispatch handler. After the
generic toggle branch and before the standard WS dispatch, add:

```javascript
  // Keyboard injection — sends key event to workbench view via ipcMain
  if (btn.dataset.dispatch === 'kb') {
    const key = btn.dataset.key;
    if (key) window.electronAPI.sendKey(key);
    return;
  }
```

#### Action — index.html EDIT group
For each of the five EDIT buttons, add `data-dispatch="kb"` and `data-key`:

Find the Undo button:
```html
              <!-- serve-web: editor.action.undo requires workbench DOM focus; use Ctrl+Z -->
              <span class="ribbon-btn-small" data-command="noop">
                <span class="ribbon-icon"><img src="assets/icons/code/undo.svg"
```
Replace the opening span only:
```html
              <span class="ribbon-btn-small" data-command="noop" data-dispatch="kb" data-key="ctrl+z">
                <span class="ribbon-icon"><img src="assets/icons/code/undo.svg"
```
Remove the `<!-- serve-web: ... -->` comment above it.

Find Redo:
```html
              <!-- serve-web: editor.action.redo requires workbench DOM focus; use Ctrl+Y -->
              <span class="ribbon-btn-small" data-command="noop">
                <span class="ribbon-icon"><img src="assets/icons/code/redo.svg"
```
Replace:
```html
              <span class="ribbon-btn-small" data-command="noop" data-dispatch="kb" data-key="ctrl+y">
                <span class="ribbon-icon"><img src="assets/icons/code/redo.svg"
```

Find Paste:
```html
              <!-- serve-web: clipboard commands require workbench DOM focus; use Ctrl+V -->
              <span class="ribbon-btn-small" data-command="noop">
                <span class="ribbon-icon"><img src="assets/icons/code/paste.svg"
```
Replace:
```html
              <span class="ribbon-btn-small" data-command="noop" data-dispatch="kb" data-key="ctrl+v">
                <span class="ribbon-icon"><img src="assets/icons/code/paste.svg"
```

Find Cut:
```html
              <!-- serve-web: clipboard commands require workbench DOM focus; use Ctrl+X -->
              <span class="ribbon-btn-small" data-command="noop">
                <span class="ribbon-icon"><img src="assets/icons/code/cut.svg"
```
Replace:
```html
              <span class="ribbon-btn-small" data-command="noop" data-dispatch="kb" data-key="ctrl+x">
                <span class="ribbon-icon"><img src="assets/icons/code/cut.svg"
```

Find Copy:
```html
              <!-- serve-web: clipboard commands require workbench DOM focus; use Ctrl+C -->
              <span class="ribbon-btn-small" data-command="noop">
                <span class="ribbon-icon"><img src="assets/icons/code/copy.svg"
```
Replace:
```html
              <span class="ribbon-btn-small" data-command="noop" data-dispatch="kb" data-key="ctrl+c">
                <span class="ribbon-icon"><img src="assets/icons/code/copy.svg"
```

#### Show diff before proceeding
Show `git diff renderer.js` and `git diff index.html`. Confirm:
1. KB dispatch branch added in `renderer.js` (3 lines)
2. Five EDIT buttons have `data-dispatch="kb"` and correct `data-key`
3. Five `<!-- serve-web: ... -->` comments removed
4. No other changes

Wait for approval before launching.

#### Acceptance criterion
```
npm run start:fast
```
Report T-301 through T-306:
1. Undo — character removed from editor
2. Redo — character reappears
3. Cut — selected text removed; clipboard has it
4. Copy — text unchanged; clipboard has it
5. Paste — clipboard content inserted at cursor
6. Manual Ctrl+Z still works after ribbon button use

Quit via ✕ only.

#### On failure
Report verbatim: "Task 005 FAILED — T-[N] FAIL: [describe]"

---

### Task 005-commit: Commit M3 renderer + index changes
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** 005 (all KB tests pass)

#### Action
```
git add renderer.js index.html
git commit -m "Sprint 8 Task 005: KB dispatch wiring for Undo/Redo/Clipboard (M3)

- renderer.js: kb dispatch branch → window.electronAPI.sendKey(key)
- index.html: Undo(ctrl+z), Redo(ctrl+y), Cut(ctrl+x),
  Copy(ctrl+c), Paste(ctrl+v) — data-dispatch=kb + data-key attrs"
```

#### Acceptance criterion
`git log --oneline -1` shows the M3 commit. `git status` clean.

---

## Milestone M4 — FIGURES Selection State Model

Two tasks: CSS first (no launch needed), then index.html + renderer.js together.

---

### Task 006: Add ribbon-btn-select and ribbon-btn-plot styles to ribbon.css
**Status:** [ ] Pending
**Milestone:** M4
**Depends on:** —

#### What to do
Append two new rule blocks to `ribbon.css`.

#### Files touched
- `ribbon.css` — two rule blocks appended

#### Action
Append at the end of `ribbon.css` (after the existing
`#ribbon-strip.ribbon-tabs-hidden` rule):

```css
/* ── FIGURES selection buttons (Sprint 8) ──────────────────────────────── */

.ribbon-btn-select {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 5px;
  font-size: 10.5px;
  font-family: 'Segoe UI', sans-serif;
  color: #333333;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  -webkit-app-region: no-drag;
  white-space: nowrap;
  justify-content: flex-start;
}

.ribbon-btn-select:hover {
  background: rgba(0, 88, 156, 0.09);
  border-color: rgba(0, 88, 156, 0.2);
}

.ribbon-btn-select.active {
  background: #DDEEFF;
  border-color: #00589C;
  color: #003366;
}

/* ── FIGURES Plot button (Sprint 8) ────────────────────────────────────── */

.ribbon-btn-plot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 4px 10px;
  min-width: 52px;
  font-size: 10px;
  font-family: 'Segoe UI', sans-serif;
  font-weight: 600;
  color: #ffffff;
  background: #2E8B3D;
  border: 1px solid #1a5c27;
  border-radius: 4px;
  cursor: pointer;
  -webkit-app-region: no-drag;
}

.ribbon-btn-plot:hover {
  background: #3aaa4d;
  border-color: #1a5c27;
}

.ribbon-btn-plot:active {
  background: #1a5c27;
}
```

#### Show diff before proceeding
Show `git diff ribbon.css`. Confirm exactly the two new rule blocks appended.
No launch needed for this task.

#### Acceptance criterion
`git diff ribbon.css` shows the two new blocks and nothing else.
`findstr /C:"ribbon-btn-select" ribbon.css` returns at least one match.
`findstr /C:"ribbon-btn-plot" ribbon.css` returns at least one match.

#### On failure
Report verbatim: "Task 006 FAILED — [paste diff]"

---

### Task 007: Add FIGURES selection attrs + Plot button to index.html; add plotConfig + group dispatch to renderer.js
**Status:** [ ] Pending
**Milestone:** M4
**Depends on:** 006

#### What to do
Three coordinated changes:
(1) `index.html` — change PLOT TYPE / STYLE / AXES buttons to
    `ribbon-btn-select` with `data-group` + `data-value`; add Plot button
(2) `renderer.js` — add `window.plotConfig` init + group dispatch branch

#### Files touched
- `index.html` — FIGURES body: 23 button class/attribute changes + new Plot button group
- `renderer.js` — plotConfig init + group dispatch branch

#### Action — renderer.js (two additions)

**Addition 1 — plotConfig init.** After `'use strict';` near the top, add:
```javascript
// ── FIGURES plot configuration accumulator (Sprint 8) ─────────────────────────
window.plotConfig = {
  type:  null,  // string: selected plot type
  style: [],    // array: active style options
  axes:  [],    // array: active axes options
};
```

**Addition 2 — group dispatch branch.** In the click handler, after the
generic toggle branch and before the KB dispatch branch, add:
```javascript
  // FIGURES selection — radio (plot-type) or multi-toggle (style/axes)
  if (btn.dataset.group) {
    const group = btn.dataset.group;
    const value = btn.dataset.value;
    if (group === 'plot-type') {
      document.querySelectorAll('[data-group="plot-type"]')
        .forEach(b => b.classList.remove('active'));
      btn.classList.toggle('active');
      window.plotConfig.type = btn.classList.contains('active') ? value : null;
    } else if (group === 'plot-style') {
      btn.classList.toggle('active');
      const idx = window.plotConfig.style.indexOf(value);
      if (idx === -1) window.plotConfig.style.push(value);
      else window.plotConfig.style.splice(idx, 1);
    } else if (group === 'plot-axes') {
      btn.classList.toggle('active');
      const idx = window.plotConfig.axes.indexOf(value);
      if (idx === -1) window.plotConfig.axes.push(value);
      else window.plotConfig.axes.splice(idx, 1);
    }
    return;
  }
```

#### Action — index.html FIGURES body

**PLOT TYPE group (12 buttons):**
Change each from `ribbon-btn-small data-command="noop"` to
`ribbon-btn-select data-group="plot-type" data-value="<value>" data-command="noop"`:

| Button | `data-value` |
|---|---|
| Line | `line` |
| Bar | `bar` |
| Scatter | `scatter` |
| Area | `area` |
| Histogram | `histogram` |
| Boxplot | `boxplot` |
| Violin | `violin` |
| Contour | `contour` |
| Surface | `surface` |
| Heatmap | `heatmap` |
| Pie Chart | `pie` |
| Stem | `stem` |

Example — find:
```html
              <span class="ribbon-btn-small" data-command="noop">
                <span class="ribbon-icon"><img src="assets/icons/figures/scatter.svg" width="22" height="18" alt="" /></span>
                <span>Scatter</span>
              </span>
```
Replace:
```html
              <span class="ribbon-btn-select" data-group="plot-type" data-value="scatter" data-command="noop">
                <span class="ribbon-icon"><img src="assets/icons/figures/scatter.svg" width="22" height="18" alt="" /></span>
                <span>Scatter</span>
              </span>
```
Apply same pattern to all 12 PLOT TYPE buttons.

**STYLE group (5 buttons):**
Change class to `ribbon-btn-select`, add `data-group="plot-style"` and `data-value`:

| Button | `data-value` |
|---|---|
| Theme | `theme` |
| Colors | `colors` |
| Line Width | `linewidth` |
| Markers | `markers` |
| Opacity | `opacity` |

**AXES group (6 buttons):**
Change class to `ribbon-btn-select`, add `data-group="plot-axes"` and `data-value`:

| Button | `data-value` |
|---|---|
| X Label | `xlabel` |
| Grid | `grid` |
| X Limits | `xlims` |
| Y Label | `ylabel` |
| Legend | `legend` |
| Y Limits | `ylims` |

**Plot button — append as final group in FIGURES body:**
Find `</div><!-- FIGURES -->` and insert immediately before it:

```html
        <!-- PLOT — executes assembled plot configuration (Sprint 9) -->
        <div class="ribbon-group" style="border-right:none;">
          <div class="ribbon-group-inner" style="align-items:center;padding:4px 12px 0;">
            <span class="ribbon-btn-plot" data-command="noop" data-dispatch="plot-builder">
              <span class="ribbon-icon">
                <img src="assets/icons/figures/new.svg" width="26" height="26" alt="" />
              </span>
              <span>Plot</span>
            </span>
          </div>
          <div class="ribbon-group-label">PLOT</div>
        </div>
```

#### Show diff before proceeding
Show `git diff renderer.js` and `git diff index.html`. Confirm:
1. `window.plotConfig` initialised in `renderer.js`
2. Group dispatch branch added in `renderer.js`
3. 23 FIGURES buttons changed to `ribbon-btn-select` with `data-group` + `data-value`
4. Plot button group appended before `</div><!-- FIGURES -->`
5. No changes outside FIGURES body in `index.html`

Wait for approval before launching.

#### Acceptance criterion
```
npm run start:fast
```
Report T-401 through T-407:
1. Click Scatter → blue highlight; `window.plotConfig.type === 'scatter'`
2. Click Line → Scatter deselects, Line highlights; `type === 'line'`
3. Click Line again → deselects; `type === null`
4. Click Markers + Opacity → both highlighted; `style === ['markers','opacity']`
5. Click Markers again → only Opacity highlighted; `style === ['opacity']`
6. Switch tabs and back — plotConfig unchanged
7. Plot button visible, green, same height as CODE/Run

Quit via ✕ only.

#### On failure
Report verbatim: "Task 007 FAILED — T-[N] FAIL: [describe]"

---

### Task 007-commit: Commit M4 changes
**Status:** [ ] Pending
**Milestone:** M4
**Depends on:** 007 (all selection tests pass)

#### Action
```
git add ribbon.css renderer.js index.html
git commit -m "Sprint 8 Tasks 006-007: FIGURES selection state model (M4)

- ribbon.css: ribbon-btn-select (blue radio/toggle); ribbon-btn-plot (green)
- renderer.js: window.plotConfig accumulator; group dispatch branch
- index.html: 12 PLOT TYPE radio buttons; 5 STYLE toggles; 6 AXES toggles;
  Plot button (noop, data-dispatch=plot-builder) — Sprint 9 target"
```

#### Acceptance criterion
`git log --oneline -1` shows M4 commit. `git status` clean.

---

## Milestone M5 — Plot Builder SDD

---

### Task 008: Produce SDD-plot-builder.md (John + Claude collaborative)
**Status:** [ ] Pending
**Milestone:** M5
**Depends on:** —

#### What to do
This is a **planning thread task** — produced here (Claude) based on John's
input, not by Antigravity. When John says "ready for plot builder SDD,"
Claude produces `docs/Sprint 8/SDD-plot-builder.md` covering:

- Variable discovery architecture
- ADR-024 (WS argument-passing extension)
- Webview specification and layout
- Code generation logic (Plots.jl call assembly from `window.plotConfig`)
- Execution path (REPL dispatch with arguments)
- Sprint 9 task sketch

The document is saved to `docs/Sprint 8/` and committed as part of
the sprint-complete commit (Task 010).

#### Acceptance criterion
John confirms: "Task 008 DONE — SDD-plot-builder.md saved to docs/Sprint 8/"

---

## Milestone M6 — Regression & Tag

---

### Task 009: Full regression pass (John-verified)
**Status:** [ ] Pending
**Milestone:** M6
**Depends on:** 005-commit, 007-commit, 008

#### What to do
John-run. Antigravity does not declare any item passed.

**T-601 — Teardown:**
```powershell
$before = Get-CimInstance Win32_Process | Where-Object {$_.Name -match 'node|electron|codium'} | Select-Object ProcessId, CommandLine
```
`npm start` → use app → ✕-quit → wait 5s:
```powershell
$final = Get-CimInstance Win32_Process | Where-Object {$_.Name -match 'node|electron|codium'} | Select-Object ProcessId, CommandLine
Compare-Object $before $final -Property ProcessId
```
Pass: no output.

**T-602 — Sprint 7 regression:**
- Tab switching HOME → CODE → FIGURES → VIEW → HOME — PASS/FAIL
- F2 hide/restore — PASS/FAIL
- COMMAND WINDOW toggle — PASS/FAIL
- Drag, min/max/restore, resize flush — PASS/FAIL each
- REPL auto-starts — PASS/FAIL
- No new console errors — PASS/FAIL

#### Report format
"Task 009 DONE — T-601 [P/F], T-602 tabs [P/F] F2 [P/F] CW [P/F]
drag [P/F] min/max [P/F] resize [P/F] REPL [P/F] console [P/F]"

---

### Task 010: Commit, tag, and push sprint8-complete
**Status:** [ ] Pending
**Milestone:** M6
**Depends on:** 009

#### Action
```
git add -A
git commit -m "Sprint 8 complete: Tier 2 wiring + KB injection + FIGURES state model

- Task 002: 12 Tier 2 command id wires (CODE/RUN, CODE/DEBUG, HOME, VIEW, FIGURES)
- Tasks 003-005: Undo/Redo/Clipboard via sendInputEvent keyboard injection
  preload.js + main.js + renderer.js + index.html
- Tasks 006-007: FIGURES selection state model
  ribbon-btn-select CSS; window.plotConfig; Plot button (Sprint 9 target)
- Task 008: SDD-plot-builder.md (docs/Sprint 8/)
- Teardown T-601 clean; T-602 regression green"

git tag sprint8-complete
git push origin main --tags
```

#### Acceptance criterion
`git log --oneline -1` shows sprint 8 commit.
`git tag` lists `sprint8-complete`.
`git push` exits 0.
