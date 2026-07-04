# tasks-sprint7.md — JuliaLab Sprint 7

**Sprint:** 7 — Ribbon button wiring (Tier 1) + COMMAND WINDOW sync + DevTools
**Date:** 2026-07-02
**Design doc:** `docs/Sprint 7/DESIGN-sprint7.md`
**Test plan:** `docs/Sprint 7/TEST_PLAN-sprint7.md`
**ADRs in force:** ADR-020, ADR-021, ADR-022, ADR-023

Legend: `[ ]` Pending · `[x]` Done · `[!]` Blocked · `[~]` In Progress

---

## Milestone M3 — DevTools Shortcut
*M3 before M1 spike: DevTools must be accessible before the CSP test can run.*

---

### Task 001: Add Ctrl+Shift+I DevTools shortcut to main.js
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** —

#### What to do
Add a `globalShortcut` registration for `CommandOrControl+Shift+I` that
toggles DevTools on the ribbon `WebContentsView`. Place it immediately after
the existing F2 registration in `app.whenReady()`.

#### Files touched
- `main.js` — one new `globalShortcut.register(...)` call

#### Action
Find the existing F2 shortcut block:
```javascript
  globalShortcut.register('F2', () => {
```
After the closing `});` of that block, add:
```javascript
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (state.ribbonView) {
      state.ribbonView.webContents.toggleDevTools();
    }
  });
```

#### Show diff before proceeding
Show `git diff main.js`. Confirm only the new shortcut block is added,
nothing else changed. Wait for approval before launching.

#### Acceptance criterion
```
npm run start:fast
```
Press `Ctrl+Shift+I`. DevTools inspector opens attached to the ribbon view.
Press `Ctrl+Shift+I` again. DevTools closes. (T-301, T-302)

#### On failure
Report verbatim: "Task 001 FAILED — [describe what happened on Ctrl+Shift+I]"

---

## Milestone M1 — CSP Spike

---

### Task 002: Spike S7-1 — Confirm CSP allows renderer WebSocket (John-run)
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** 001 (DevTools must be open to run this test)

#### What to do
This is a **John-run manual spike**. Antigravity does not execute it.

With the app running (`npm run start:fast`):
1. Press `Ctrl+Shift+I` to open ribbon DevTools
2. In the Console tab, run:
```javascript
const ws = new WebSocket('ws://127.0.0.1:2999');
ws.onopen = () => console.log('CSP PASS: WebSocket connected');
ws.onerror = e => console.log('CSP FAIL:', e.type);
setTimeout(() => console.log('ws.readyState:', ws.readyState), 1000);
```
3. Wait 2 seconds and observe the console output.

**If PASS** (`CSP PASS: WebSocket connected` logged, readyState = 1):
Report: "Task 002 PASS — renderer WebSocket allowed. Proceeding with
`connectEventReceiver()` approach in M5."

**If FAIL** (CSP error logged):
Report: "Task 002 FAIL — CSP blocks renderer WebSocket. Escalate to planning
thread before M5 tasks begin."

Do not write any M5 code until this result is reported here.

#### Files touched
- None (spike only; no commit)

#### Acceptance criterion
John reports PASS or FAIL with the exact console output.

---

## Milestone M2 — Command ID Fixes

---

### Task 003: Fix undo/redo command ids and add Tier 2 comments in index.html
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** 001

#### What to do
Two fixes and several annotations in `index.html`. No structural markup
changes — only `data-command` attribute values and HTML comments.

**Fix 1 — undo/redo bare ids fail the prefix check.**
Find:
```html
              <span class="ribbon-btn-small" data-command="undo">
```
Replace with:
```html
              <span class="ribbon-btn-small" data-command="editor.action.undo">
```
Find:
```html
              <span class="ribbon-btn-small" data-command="redo">
```
Replace with:
```html
              <span class="ribbon-btn-small" data-command="editor.action.redo">
```

**Fix 2 — HOME SETTINGS/Theme opens picker without args (confusing).**
Find:
```html
              <span class="ribbon-btn-small" data-command="workbench.action.selectTheme">
                <span class="ribbon-icon"><img src="assets/icons/home/theme.svg" width="18" height="18" alt="" /></span>
                <span>Theme</span>
```
Replace `data-command` value only:
```html
              <span class="ribbon-btn-small" data-command="noop">
                <span class="ribbon-icon"><img src="assets/icons/home/theme.svg" width="18" height="18" alt="" /></span>
                <span>Theme</span>
```

**Fix 3 — CODE RUN group: demote language-julia.* to noop with Tier 2 comments.**
Find the Run large button:
```html
            <span class="ribbon-btn-large" data-command="language-julia.executeJuliaCodeInREPL">
```
Replace with:
```html
            <!-- Tier 2: language-julia.executeJuliaCodeInREPL — verify before wiring -->
            <span class="ribbon-btn-large" data-command="noop">
```
Find Run Selection:
```html
              <span class="ribbon-btn-small" data-command="language-julia.executeJuliaCodeInREPL">
                <span class="ribbon-icon"><img src="assets/icons/code/run-selection.svg"
```
Replace `data-command` only:
```html
              <!-- Tier 2: language-julia.executeJuliaCodeInREPL -->
              <span class="ribbon-btn-small" data-command="noop">
                <span class="ribbon-icon"><img src="assets/icons/code/run-selection.svg"
```
Find Execute Cell:
```html
              <span class="ribbon-btn-small" data-command="language-julia.executeJuliaCellInREPL">
```
Replace `data-command` only and add comment above:
```html
              <!-- Tier 2: language-julia.executeJuliaCellInREPL -->
              <span class="ribbon-btn-small" data-command="noop">
```
Find Restart REPL:
```html
              <span class="ribbon-btn-small" data-command="language-julia.restartLanguageServer">
```
Replace `data-command` only and add comment above:
```html
              <!-- Tier 2: language-julia.restartLanguageServer — likely language-julia.restartREPL, verify -->
              <span class="ribbon-btn-small" data-command="noop">
```

**Fix 4 — VIEW PANES placeholder commands are wrong (focusActiveEditorGroup).**
Find all three right-column PANES buttons with `workbench.action.focusActiveEditorGroup`:
```html
              <span class="ribbon-btn-toggle" data-command="workbench.action.focusActiveEditorGroup" data-toggle="true">
                <span class="ribbon-icon"><img src="assets/icons/view/variable-editor.svg"
```
Replace `data-command` only:
```html
              <!-- Tier 2: language-julia.show-variable-editor or similar — verify -->
              <span class="ribbon-btn-toggle" data-command="noop" data-toggle="true">
                <span class="ribbon-icon"><img src="assets/icons/view/variable-editor.svg"
```
Same for DOCUMENTATION and HISTORY (both currently have `workbench.action.focusActiveEditorGroup`).

**Fix 5 — VIEW WORKSPACE command is language-julia.* — demote.**
Find:
```html
              <span class="ribbon-btn-toggle" data-command="language-julia.show-workspace" data-toggle="true">
```
Replace:
```html
              <!-- Tier 2: language-julia.show-workspace — verify -->
              <span class="ribbon-btn-toggle" data-command="noop" data-toggle="true">
```

#### Show diff before proceeding
Show `git diff index.html`. Confirm:
1. `editor.action.undo` and `editor.action.redo` replace bare `undo`/`redo`
2. SETTINGS/Theme → `noop`
3. Four RUN group buttons → `noop` with `<!-- Tier 2: ... -->` comments
4. Three right-column PANES buttons → `noop` with comments
5. WORKSPACE → `noop` with comment
6. No structural markup changes; no other `data-command` values changed

Wait for approval before launching.

#### Acceptance criterion
```
npm run start:fast
```
Report each as PASS or FAIL (T-201 through T-214):
1. Click CODE → select text → click Undo → text reverts (editor.action.undo fires)
2. Click Redo → text restores (editor.action.redo fires)
3. Click noop buttons (Current Dir, Add, Run, Line chart) → nothing happens
4. Click HOME Search buttons (Find in Files, Replace, Symbols, Go to File) → panels open
5. Click HOME Settings buttons (Preferences, Keybindings) → editors open
6. Click CODE PROJECT (New, Open, Save) → correct workbench actions
7. Click CODE EDIT clipboard (Cut, Copy, Paste) → correct clipboard actions
8. Click CODE NAVIGATE (Go to Def, Find, Forward, Back) → correct navigation
9. Click CODE FORMAT (Indent, Comment) → correct formatting
10. Click VIEW FILE BROWSER → Explorer shows/hides
11. Click VIEW Load layout → editor splits into two columns
12. No JavaScript console errors

Quit via ✕ only.

#### On failure
Report verbatim: "Task 003 FAILED — [describe which button misbehaved and what happened]"

---

## Milestone M4 — Tab Text Hide on Collapse

---

### Task 004: Add ribbon-tabs-hidden CSS rule to ribbon.css
**Status:** [ ] Pending
**Milestone:** M4
**Depends on:** 001

#### What to do
Append one new rule block to `ribbon.css` that hides tab label text when
the ribbon is collapsed.

#### Files touched
- `ribbon.css` — one new rule appended after the last existing rule

#### Action
Append at the end of `ribbon.css`:
```css
/* ── Collapsed ribbon — hide tab labels (Sprint 7) ─────────────────────── */

#ribbon-strip.ribbon-tabs-hidden .ribbon-tab {
  color: transparent;
  pointer-events: none;
}
```

#### Show diff before proceeding
Show `git diff ribbon.css`. Confirm only the new rule is appended.
Wait for approval before proceeding to Task 005.

#### Acceptance criterion
`git diff ribbon.css` shows exactly the new rule and nothing else.
`findstr /C:"ribbon-tabs-hidden" ribbon.css` returns one matching line.

#### On failure
Report verbatim: "Task 004 FAILED — [paste diff]"

---

### Task 005: Add tab-text hide/show to hideRibbon()/pinRibbon() in renderer.js
**Status:** [ ] Pending
**Milestone:** M4
**Depends on:** 004

#### What to do
Add one line to `hideRibbon()` and one line to `pinRibbon()` in `renderer.js`
to toggle the `ribbon-tabs-hidden` class on `#ribbon-strip`.

#### Files touched
- `renderer.js` — two one-line additions

#### Action
Find `hideRibbon()`:
```javascript
function hideRibbon() {
  const hideBtn = document.getElementById('btn-hide-ribbon');
  const pinBtn  = document.getElementById('btn-pin-ribbon');
  if (hideBtn) hideBtn.classList.add('active');
  if (pinBtn)  pinBtn.classList.remove('active');
  window.electronAPI.hideRibbon();
}
```
Replace with:
```javascript
function hideRibbon() {
  document.getElementById('ribbon-strip').classList.add('ribbon-tabs-hidden');
  const hideBtn = document.getElementById('btn-hide-ribbon');
  const pinBtn  = document.getElementById('btn-pin-ribbon');
  if (hideBtn) hideBtn.classList.add('active');
  if (pinBtn)  pinBtn.classList.remove('active');
  window.electronAPI.hideRibbon();
}
```
Find `pinRibbon()`:
```javascript
function pinRibbon() {
  const hideBtn = document.getElementById('btn-hide-ribbon');
  const pinBtn  = document.getElementById('btn-pin-ribbon');
  if (hideBtn) hideBtn.classList.remove('active');
  if (pinBtn)  pinBtn.classList.add('active');
  window.electronAPI.pinRibbon();
}
```
Replace with:
```javascript
function pinRibbon() {
  document.getElementById('ribbon-strip').classList.remove('ribbon-tabs-hidden');
  const hideBtn = document.getElementById('btn-hide-ribbon');
  const pinBtn  = document.getElementById('btn-pin-ribbon');
  if (hideBtn) hideBtn.classList.remove('active');
  if (pinBtn)  pinBtn.classList.add('active');
  window.electronAPI.pinRibbon();
}
```

#### Show diff before proceeding
Show `git diff renderer.js`. Confirm exactly two new lines added
(one in each function). Wait for approval before launching.

#### Acceptance criterion
```
npm run start:fast
```
Report each as PASS or FAIL (T-401 through T-404):
1. Click VIEW → Hide Ribbon → tab labels disappear; only blue strip + window controls visible
2. Click Pin Ribbon (or press F2) → tab labels reappear; active tab highlighted
3. Click workbench, press F2 → tab labels hide; press F2 again → restore
4. Window controls (−, □, ×) functional when ribbon is collapsed

Quit via ✕ only.

#### On failure
Report verbatim: "Task 005 FAILED — observation [N] FAIL: [describe]"

---

## Milestone M5 — COMMAND WINDOW Sync
*Only begin after Task 002 (Spike S7-1) reports PASS.*
*If Task 002 FAIL, escalate to planning thread before writing any M5 task.*

---

### Task 006: Add terminal event publisher to extension.ts
**Status:** [ ] Pending (blocked on Task 002 PASS)
**Milestone:** M5
**Depends on:** 002 (PASS required)

#### What to do
Add a `connectedClients` Set to track WS connections for reverse-channel
broadcasting, and add `onDidOpenTerminal`/`onDidCloseTerminal` subscriptions
that publish panel state to connected ribbon renderers.

#### Files touched
- `extensions/julialab/src/extension.ts`

#### Action
**Edit 1 — add `connectedClients` Set at module scope.**
After the `ALLOWED_PREFIXES` constant block, add:
```typescript
// Connected WS clients — used for reverse-channel event broadcasting (ADR-023)
const connectedClients = new Set<import('ws').WebSocket>();
```

**Edit 2 — track connections in `registerWebSocketBridge()`.**
Inside `wss.on('connection', ws => {`, immediately after the opening brace,
add:
```typescript
    connectedClients.add(ws);
    ws.on('close', () => connectedClients.delete(ws));
```

**Edit 3 — add `broadcastPanelState()` helper function.**
After the closing brace of `registerWebSocketBridge()`, add:
```typescript
// ── Panel state broadcaster (ADR-023) ────────────────────────────────────────

function broadcastPanelState(panel: string, open: boolean): void {
  const msg = JSON.stringify({ event: 'panelState', panel, open });
  connectedClients.forEach(ws => {
    if ((ws as any).readyState === 1 /* OPEN */) {
      ws.send(msg);
    }
  });
}
```

**Edit 4 — subscribe to terminal events in `activate()`.**
In `activate()`, after the `registerWebSocketBridge(context)` call, add:
```typescript
  // ADR-023: terminal panel state sync for COMMAND WINDOW ribbon button
  context.subscriptions.push(
    vscode.window.onDidOpenTerminal(() => {
      broadcastPanelState('terminal', true);
    }),
    vscode.window.onDidCloseTerminal(() => {
      broadcastPanelState('terminal', vscode.window.terminals.length > 0);
    })
  );
```

Then run:
```
npm run build:ext
```

#### Show diff before proceeding
Show `git diff extensions/julialab/src/extension.ts`. Confirm:
1. `connectedClients` Set added at module scope
2. `connectedClients.add(ws)` and `ws.on('close', ...)` inside connection handler
3. `broadcastPanelState()` function added
4. Two `onDid*Terminal` subscriptions in `activate()`
5. No other logic changed

Wait for approval before running build.

#### Acceptance criterion
`npm run build:ext` exits 0. No TypeScript errors.

#### On failure
Report verbatim: "Task 006 FAILED — [paste tsc error output]"

---

### Task 007: Add connectEventReceiver() WS client to renderer.js
**Status:** [ ] Pending (blocked on Task 002 PASS)
**Milestone:** M5
**Depends on:** 006

#### What to do
Add a WebSocket client in `renderer.js` that connects to port 2999 and
listens for `panelState` events from `extension.ts`, updating the COMMAND
WINDOW button's `.active` class to match the actual terminal state.

#### Files touched
- `renderer.js` — one new function + one call, appended at the end

#### Action
Append at the end of `renderer.js` (after the `pinRibbon()` function):
```javascript
// ── Event receiver — extension → renderer (ADR-023) ──────────────────────────

function connectEventReceiver() {
  const ws = new WebSocket('ws://127.0.0.1:2999');

  ws.addEventListener('message', e => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.event === 'panelState' && msg.panel === 'terminal') {
        const btn = document.querySelector(
          '[data-command="workbench.action.terminal.toggleTerminal"]'
        );
        if (btn) btn.classList.toggle('active', msg.open);
      }
    } catch (_) { /* ignore malformed messages */ }
  });

  ws.addEventListener('close', () => {
    setTimeout(connectEventReceiver, 3000);
  });

  ws.addEventListener('error', () => {
    // error event always precedes close; reconnect handled by close handler
  });
}

// Wait 6s for extension host WS server to start before connecting
setTimeout(connectEventReceiver, 6000);
```

#### Show diff before proceeding
Show `git diff renderer.js`. Confirm:
1. `connectEventReceiver()` function appended
2. `setTimeout(connectEventReceiver, 6000)` call present
3. No existing functions modified

Wait for approval before launching.
**Note:** this task requires `npm start` (full build), not `npm run start:fast`,
because `extension.ts` changed in Task 006.

#### Acceptance criterion
```
npm start
```
Report each as PASS or FAIL (T-503 through T-506):
1. After REPL starts (terminal opens), click VIEW tab →
   COMMAND WINDOW button shows green
2. Close terminal panel in VSCodium → COMMAND WINDOW button turns gray
3. Open new terminal in VSCodium → COMMAND WINDOW button turns green
4. Click COMMAND WINDOW button → terminal toggles; button tracks state

Quit via ✕ only.

#### On failure
Report verbatim: "Task 007 FAILED — observation [N] FAIL: [describe; include
whether the WS event receiver connected (check ribbon DevTools console for
connectEventReceiver errors)]"

---

## Milestone M6 — Tier 2 Command ID Table

---

### Task 008: Produce julia-commands.md via triangulation (John-run)
**Status:** [ ] Pending
**Milestone:** M6
**Depends on:** 001 (DevTools needed for extension host log probe)

#### What to do
This is a **John-run research task**. Antigravity does not execute it.

Produce `docs/Sprint 7/julia-commands.md` by triangulating command ids for
every `language-julia.*` button currently set to `noop` in `index.html`.

**Buttons to verify:**
- CODE/RUN: Run / Run Selection / Execute Cell / Restart REPL
- CODE/DEBUG: Breakpoint / Step / Continue
- CODE/FORMAT: Refactor
- VIEW/PANES: WORKSPACE / VARIABLE EXPLORER / DOCUMENTATION / HISTORY
- FIGURES/FIGURE: Close / Close All / Tile / Cascade
- FIGURES/PLOT TYPE: all 12 plot type buttons
- FIGURES/STYLE: Theme / Colors / Line Width / Markers / Opacity
- FIGURES/AXES: X Label / Grid / X Limits / Y Label / Legend / Y Limits
- FIGURES/ANIMATE: Record / Play / Stop / Export GIF / Speed

**Triangulation steps per command:**

*Step 1 — Command palette:*
In the running app, press `Ctrl+Shift+P` in the workbench.
Search for the action by name. Note the exact command id shown in the palette.

*Step 2 — Extension host log probe (for language-julia.* commands):*
Add a temporary `fs.writeFileSync` in `extension.ts::activate()`:
```typescript
  // TEMP: dump language-julia commands to file for Tier 2 table
  const cmds = await vscode.commands.getCommands(true);
  const juliaCommands = cmds.filter(c => c.startsWith('language-julia'));
  require('fs').writeFileSync(
    require('path').join(__dirname, 'julia-commands-dump.txt'),
    juliaCommands.join('\n')
  );
```
Run `npm start`. Read `extensions/julialab/julia-commands-dump.txt`.
Remove the temp probe before committing (revert `extension.ts`).

*Step 3 — Ribbon DevTools console:*
For any command discovered in Steps 1–2, test it:
```javascript
// In ribbon DevTools console — sends command via WS bridge
window.electronAPI.ribbonCommand('language-julia.<candidate-id>');
```
Observe whether the workbench responds correctly.

**Output format** (`docs/Sprint 7/julia-commands.md`):
```markdown
# Julia VSCodium Command ID Table — Sprint 7 Tier 2

| Button | Tab/Group | Candidate ID | Palette ✓/✗ | Log ✓/✗ | Console test | Notes |
|---|---|---|---|---|---|---|
| Run | CODE/RUN | language-julia.executeFile | ✓ | ✓ | PASS | Runs whole file |
| Run Selection | CODE/RUN | language-julia.executeJuliaCodeInREPL | ✓ | ✓ | PASS | |
...
```

#### Files touched
- `docs/Sprint 7/julia-commands.md` — new file (John-produced)
- `extensions/julialab/src/extension.ts` — temp probe added then reverted

#### Acceptance criterion
John reports: "Task 008 DONE — julia-commands.md present at
`docs/Sprint 7/julia-commands.md` with [N] rows. Extension.ts probe reverted
and clean (`git diff extensions/` is empty)."

---

## Milestone M7 — Regression & Tag

---

### Task 009: Full regression pass (John-verified)
**Status:** [ ] Pending
**Milestone:** M7
**Depends on:** 003, 005, 007, 008

#### What to do
John-run regression. Antigravity must not declare any item passed.

Run T-701 through T-703 from `TEST_PLAN-sprint7.md`:

**T-701 — Teardown:**
```powershell
$before = Get-CimInstance Win32_Process | Where-Object {$_.Name -match 'node|electron|codium'} | Select-Object ProcessId, CommandLine
```
`npm start` → wait for app → ✕-quit → wait 5 seconds
```powershell
$final = Get-CimInstance Win32_Process | Where-Object {$_.Name -match 'node|electron|codium'} | Select-Object ProcessId, CommandLine
Compare-Object $before $final -Property ProcessId
```
**Pass:** no output from `Compare-Object` (no new processes remain).

**T-702 — Sprint 6 criteria:** drag/min-max-restore/resize-flush/no-errors/REPL starts.

**T-703 — Tab switching:** HOME → CODE → FIGURES → VIEW → HOME, all switch correctly.

#### Acceptance criterion
John reports: "Task 009 DONE — T-701 PASS, T-702 PASS, T-703 PASS."

#### On failure
Escalate failing test here. Do not tag until all pass.

---

### Task 010: Commit, tag, and push sprint7-complete
**Status:** [ ] Pending
**Milestone:** M7
**Depends on:** 009

#### What to do
```
git add -A
git commit -m "Sprint 7 complete: ribbon button wiring Tier 1 + DevTools + COMMAND WINDOW sync

- Task 001: Ctrl+Shift+I DevTools shortcut (main.js)
- Task 003: undo/redo fixed (editor.action.*); RUN/VIEW Tier 2 demotions (index.html)
- Task 004/005: F2 collapse hides tab text (ribbon.css + renderer.js)
- Task 006/007: COMMAND WINDOW toggle sync via WS reverse channel (ADR-023)
  extension.ts broadcasts onDidOpenTerminal/onDidCloseTerminal events;
  renderer.js connectEventReceiver() updates button state
- Task 008: julia-commands.md Tier 2 table (docs/Sprint 7/)
- Tier 1 wired: HOME SEARCH/SETTINGS, CODE PROJECT/EDIT/NAVIGATE/FORMAT,
  VIEW FILE BROWSER/LOAD LAYOUT — all workbench.action.* and editor.action.*
- Teardown T-701 clean; T-702/T-703 pass"

git tag sprint7-complete
git push origin main --tags
```

#### Acceptance criterion
`git log --oneline -1` shows the sprint 7 commit.
`git tag` lists `sprint7-complete`.
`git push` exits 0.

#### On failure
Report verbatim: "Task 010 FAILED — [paste git error output]"
