# Test Plan — Sprint 7

**Project:** JuliaLabApp
**Sprint:** 7 — Ribbon button wiring (Tier 1) + COMMAND WINDOW sync + DevTools
**Version:** 0.1
**Date:** 2026-07-02
**Author:** John Peach / eurAIka
**Design doc:** `docs/Sprint 7/DESIGN-sprint7.md`

---

## 1. Test Strategy

Sprint 7 changes are primarily `data-command` attribute corrections in
`index.html` and a new WS reverse channel in `extension.ts`/`renderer.js`.
The appropriate test types are:

| Type | Method | Who |
|---|---|---|
| **Spike** | Manual browser console test — confirms CSP allows renderer WebSocket | John |
| **Functional (button)** | Click each wired button; observe workbench response | John |
| **Functional (sync)** | Toggle terminal via ribbon and directly; observe button state | John |
| **Functional (collapse)** | F2 / Hide Ribbon; observe tab text disappears | John |
| **Functional (DevTools)** | Ctrl+Shift+I; observe inspector opens | John |
| **Static (command ids)** | Read `git diff index.html`; confirm undo/redo fix and Tier 2 demotions | Antigravity (diff review) |
| **Build smoke** | `npm run build:ext` exits 0 | Antigravity (reported) |
| **Regression (teardown)** | ✕-quit + process-diff audit | John |

No automated test framework is appropriate for this sprint — all changes are
UI attribute corrections and event wiring. The test burden is manual but
concentrated: most buttons can be verified in a single app session.

---

## 2. Milestone Structure

| Milestone | Scope | Gate |
|---|---|---|
| M1 — CSP spike | Confirm renderer WebSocket allowed | Spike result reported before any sync implementation |
| M2 — command id fixes | undo/redo fix + Tier 2 demotions in `index.html` | Static diff review + build smoke |
| M3 — DevTools shortcut | `Ctrl+Shift+I` in `main.js` | Functional: inspector opens |
| M4 — tab-text hide | CSS + `hideRibbon()`/`pinRibbon()` in `renderer.js`/`ribbon.css` | Functional: text disappears on collapse |
| M5 — COMMAND WINDOW sync | `extension.ts` + `renderer.js` WS receiver | Functional: button tracks terminal state |
| M6 — Tier 2 table | `julia-commands.md` produced by triangulation | Document present and complete |
| M7 — Regression | Full teardown + Sprint 6 criteria | Teardown audit green |

---

## 3. Test Cases

### M1 — CSP Spike (Spike S7-1)

**T-101: Renderer WebSocket allowed by CSP**

This is a **John-run manual spike** before any `connectEventReceiver` code is
written.

- Launch app: `npm run start:fast`
- Open ribbon DevTools: use any available method (currently none — this test
  confirms DevTools access itself, so use `main.js` temporary
  `openDevTools()` call on startup, or add the Ctrl+Shift+I shortcut first
  as M3 and run S7-1 after)
- In the ribbon DevTools console, run:
  ```javascript
  const ws = new WebSocket('ws://127.0.0.1:2999');
  ws.onopen = () => console.log('CSP PASS: WebSocket connected');
  ws.onerror = e => console.log('CSP FAIL:', e);
  ```
- **Pass:** Console logs `CSP PASS: WebSocket connected`
- **Fail:** Console logs a CSP error or connection refused

**If T-101 FAILS:** The `connectEventReceiver()` approach must change to an
ipcMain relay. Escalate to planning thread before implementing M5.

**Sequencing note:** M3 (DevTools shortcut) should be implemented before S7-1
so the DevTools are accessible without a temporary code change.

---

### M2 — Command ID Fixes

**T-201: undo/redo dispatch verified (static)**
- Read `git diff index.html`
- **Pass:** Both `data-command="undo"` → `data-command="editor.action.undo"`
  and `data-command="redo"` → `data-command="editor.action.redo"` appear in
  the diff; no other EDIT group buttons changed

**T-202: Undo fires in editor (functional)**
- Open a `.jl` file in the workbench; type a character
- Click CODE tab → click Undo
- **Pass:** The typed character is removed from the editor

**T-203: Redo fires in editor (functional)**
- Immediately after T-202, click Redo
- **Pass:** The character reappears

**T-204: Tier 2 demotions present (static)**
- Read `git diff index.html`
- **Pass:** RUN group buttons (Run, Run Selection, Execute Cell, Restart REPL)
  show `data-command="noop"` with `<!-- Tier 2: ... -->` HTML comments;
  no `language-julia.*` ids remain in the RUN group

**T-205: HOME SETTINGS/Theme demoted (static)**
- Read `git diff index.html`
- **Pass:** `workbench.action.selectTheme` removed from SETTINGS/Theme button;
  replaced with `noop`

**T-206: Wired HOME/SEARCH buttons fire (functional)**
For each button, click it and observe the workbench response:
- Find in Files → search panel opens in sidebar — PASS/FAIL
- Replace → replace panel opens in sidebar — PASS/FAIL
- Symbols → quick-pick symbol list opens — PASS/FAIL
- Go to File → quick-open file picker opens — PASS/FAIL

**T-207: Wired HOME/SETTINGS buttons fire (functional)**
- Preferences → Settings editor opens — PASS/FAIL
- Keybindings → Keyboard Shortcuts editor opens — PASS/FAIL

**T-208: CODE PROJECT buttons fire (functional)**
- New → new untitled file opens in editor — PASS/FAIL
- Open → file open dialog appears — PASS/FAIL
- Save → active file saved (status bar confirms) — PASS/FAIL

**T-209: CODE EDIT clipboard buttons fire (functional)**
Pre-condition: a `.jl` file is open with some text selected.
- Cut → selected text removed; clipboard has it — PASS/FAIL
- Copy → clipboard has selection; text unchanged — PASS/FAIL
- Paste → clipboard content pasted at cursor — PASS/FAIL

**T-210: CODE NAVIGATE buttons fire (functional)**
Pre-condition: a `.jl` file open with a function call.
- Go to Def → jumps to definition or shows peek — PASS/FAIL
- Find → in-file find widget appears — PASS/FAIL
- Forward / Back → navigation history moves — PASS/FAIL

**T-211: CODE FORMAT buttons fire (functional)**
Pre-condition: a `.jl` file with indented and commented code.
- Indent → selected lines indented — PASS/FAIL
- Comment → selected lines toggled commented — PASS/FAIL

**T-212: VIEW FILE BROWSER fires (functional)**
- Click FILE BROWSER toggle → Explorer panel shows/hides — PASS/FAIL

**T-213: VIEW LOAD LAYOUT fires (functional)**
- Click Load layout → editor splits into two columns — PASS/FAIL

**T-214: noop buttons are silent (functional)**
Click any button with `data-command="noop"` (e.g. DIRECTORY/Current Dir,
PACKAGE MANAGER/Add, FIGURES/Line):
- **Pass:** Nothing happens in the workbench; no error dialog; no console error

---

### M3 — DevTools Shortcut

**T-301: Ctrl+Shift+I opens ribbon DevTools**
- Launch app: `npm run start:fast`
- Press `Ctrl+Shift+I`
- **Pass:** Electron DevTools inspector opens attached to the ribbon
  `WebContentsView`; the Elements panel shows `#ribbon` DOM

**T-302: Ctrl+Shift+I closes DevTools when already open**
- With DevTools open from T-301, press `Ctrl+Shift+I` again
- **Pass:** DevTools closes

---

### M4 — Tab Text Hide on Collapse

**T-401: Hide Ribbon hides tab text**
- Click VIEW tab → click Hide Ribbon (or press F2)
- **Pass:** Ribbon body collapses to 30px strip; tab labels (HOME CODE FIGURES
  VIEW) are no longer visible; only the blue strip and window controls show

**T-402: Pin Ribbon restores tab text**
- While ribbon is collapsed, click Pin Ribbon (or press F2)
- **Pass:** Ribbon body restores; tab labels reappear; active tab highlighted

**T-403: Tab text hidden correctly via F2 from any view**
- Click in the workbench (focus shifts away from ribbon)
- Press F2
- **Pass:** Tab text hides (global shortcut works regardless of focus)
- Press F2 again
- **Pass:** Tab text restores

**T-404: Window controls remain functional when ribbon is collapsed**
- With ribbon collapsed (tab text hidden), click minimize (−)
- **Pass:** Window minimizes; restores correctly

---

### M5 — COMMAND WINDOW Sync

**T-501: Spike S7-1 PASSED (prerequisite)**
This test only runs if T-101 passed. If T-101 failed and the ipcMain relay
was used instead, adapt these tests to verify the relay path.

**T-502: Build smoke after extension.ts changes**
- Run `npm run build:ext`
- **Pass:** Exits 0; no TypeScript errors

**T-503: COMMAND WINDOW button starts active (terminal open)**
- Launch app: `npm start` (full build required to load new extension)
- Wait for Julia REPL to start (terminal panel opens automatically)
- Click VIEW tab
- **Pass:** COMMAND WINDOW button shows green `.active` state (terminal is open)

**T-504: COMMAND WINDOW button deactivates when terminal closes**
- With terminal open and COMMAND WINDOW button green:
- Close the terminal panel directly in VSCodium (click the × on the terminal)
- **Pass:** COMMAND WINDOW button turns gray within ~1 second

**T-505: COMMAND WINDOW button activates when terminal reopens**
- With terminal closed and button gray:
- Open a new terminal in VSCodium (View → Terminal or `Ctrl+\``)
- **Pass:** COMMAND WINDOW button turns green within ~1 second

**T-506: COMMAND WINDOW ribbon button toggles terminal correctly**
- With terminal open and button green:
- Click COMMAND WINDOW button
- **Pass:** Terminal hides; button turns gray (sync fires)
- Click COMMAND WINDOW button again
- **Pass:** Terminal shows; button turns green (sync fires)

**T-507: Other PANES buttons unaffected by sync**
- Toggle FILE BROWSER button on and off
- **Pass:** Only FILE BROWSER button changes state; COMMAND WINDOW button
  is unaffected

---

### M6 — Tier 2 Command ID Table

**T-601: `docs/Sprint 7/julia-commands.md` exists and is complete**
- **Pass:** File present at that path; contains a row for every
  `language-julia.*` command currently set to `noop` in `index.html`:
  Run, Run Selection, Execute Cell, Restart REPL, WORKSPACE toggle,
  VARIABLE EXPLORER, DOCUMENTATION, HISTORY, and all FIGURES buttons
  that have Julia backing commands
- Each row has: Button name, Candidate id, Palette confirmed (✓/✗),
  Log confirmed (✓/✗), Notes

---

### M7 — Regression

**T-701: Teardown clean (John-verified)**
- `$before` snapshot → `npm start` → `$after` snapshot → ✕-quit → wait 5s →
  `$final` snapshot → `Compare-Object $after $final`
- **Pass:** No output (all sprint-7 processes terminated)

**T-702: Sprint 6 acceptance criteria still green**
- T-601 through T-606 from `docs/Sprint 6/TEST_PLAN-sprint6.md` still pass
- Specifically: teardown clean, drag works, min/max/restore works, resize
  flush, no new console errors, REPL auto-starts

**T-703: Tab switching still works**
- Click HOME → CODE → FIGURES → VIEW → HOME
- **Pass:** Each body switches correctly; no layout regression

---

## 4. Definition of Pass — Sprint 7

Sprint 7 is **green** when:

1. T-101 PASS (CSP spike) or documented fallback path implemented
2. T-201 through T-214 all PASS
3. T-301, T-302 PASS
4. T-401 through T-404 PASS
5. T-502 through T-507 PASS
6. T-601 PASS (Tier 2 table complete)
7. T-701, T-702, T-703 PASS
8. `git log --oneline -1` shows sprint 7 commit
9. Tag `sprint7-complete` pushed to `origin/main`

---

## 5. Failure Protocol

Same as Sprint 6:
1. Antigravity stops; does not patch; escalates here with verbatim output
2. File reverted (`git checkout -- <file>`); failure diagnosed in planning
   thread before corrected task written
3. Antigravity never declares T-701 (teardown) passed — John-verified only
4. Spike T-101 result must be reported before M5 tasks begin

---

## 6. Out of Scope

- `language-julia.*` command wiring (Tier 2 — Sprint 8)
- PANES sync beyond COMMAND WINDOW
- Dropdown mechanism (ADR-022)
- Activity bar launchers
- Windows packaging
