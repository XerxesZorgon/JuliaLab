# tasks-sprint6.md — JuliaLab Sprint 6

**Sprint:** 6 — MATLAB-style ribbon redesign
**Date:** 2026-06-27
**Design doc:** `docs/Sprint 6/DESIGN-sprint6.md` (v0.2)
**Test plan:** `docs/Sprint 6/TEST_PLAN-sprint6.md`
**ADRs in force:** ADR-020, ADR-021, ADR-022

Legend: `[ ]` Pending · `[x]` Done · `[!]` Blocked · `[~]` In Progress

---

## Milestone M1 — Foundation

Gate: build smoke green (T-103); icon assets present (T-102); static
prefix-allowlist diff reviewed and approved (T-104).

---

### Task 001: Revert spike markup from index.html
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** —

#### What to do
Remove the spike dropdown test code that was added in Spike S6-1 and never
committed (it is still present in the working tree). Revert `index.html` to
its pre-spike state using git.

#### Files touched
- `index.html` — revert to `sprint5-complete` state

#### Acceptance Criterion
`git diff HEAD -- index.html` produces no output (file matches the last commit).
The `#spike-dd`, `#spike-menu`, `#spike-style`, and `#spike-bottom` identifiers
are absent from `index.html`.

#### On Failure
Report: "Task 001 FAILED — git diff still shows spike markup. Exact diff output: [paste diff]"

---

### Task 002: Copy icon assets into assets/icons/
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** 001

#### What to do
Create the directory `assets/icons/` at the project root and copy all 16 files
from `docs/Compute42 images/icons/` into it:

  clear-workspace.svg, find-files.svg, find.svg, format-code.svg,
  go-to-file.svg, JuliaLab icon.png, JuliaLab-icon.svg, new-script.svg,
  new.svg, open-dyad.svg, open.svg, packages.svg, run-file.svg,
  run-section.svg, save.svg, workspace.svg

Do not rename any file. Do not modify any file contents.

#### Files touched
- `assets/icons/` — new directory + 16 copied files (no source file modified)

#### Acceptance Criterion
`dir assets\icons\` lists exactly 16 files matching the names above.
`git status` shows the new directory as untracked (or staged if `git add`
was run); no file in `docs/Compute42 images/icons/` is modified or deleted.

#### On Failure
Report: "Task 002 FAILED — [list missing or extra files, or any modified source file]"

---

### Task 003: Replace RIBBON_COMMANDS exact-match with prefix allowlist in extension.ts
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** 001

#### What to do
In `extensions/julialab/src/extension.ts`, replace the exact-match dispatch
in the WebSocket bridge with a prefix-allowlist check (ADR-020).

The current bridge handler (inside `wss.on('connection', ws => { ... })`) reads:

```typescript
if (command && command in RIBBON_COMMANDS) {
  vscode.commands.executeCommand(command).then(...)
}
```

Replace this with:

```typescript
const ALLOWED_PREFIXES = [
  'julialab.',
  'workbench.action.',
  'editor.action.',
  'language-julia.',
];
if (command && ALLOWED_PREFIXES.some(p => command.startsWith(p))) {
  vscode.commands.executeCommand(command).then(undefined, err => {
    console.error('[julialab] ws command failed:', err);
  });
}
```

Define `ALLOWED_PREFIXES` as a `const` at module scope (alongside the existing
constants at the top of the file), not inside the callback. Remove the
`RIBBON_COMMANDS` map entirely — it is no longer needed for dispatch. Keep
`registerRibbonCommands()` and `applyLayoutIfFirstOpen()` and all other
functions unchanged.

Then run `npm run build:ext` to compile.

#### Files touched
- `extensions/julialab/src/extension.ts` — replace bridge dispatch logic;
  remove `RIBBON_COMMANDS` map; add `ALLOWED_PREFIXES` constant

#### Acceptance Criterion
`npm run build:ext` exits 0 with no TypeScript errors.
`git diff extensions/julialab/src/extension.ts` shows:
  (a) `RIBBON_COMMANDS` map removed,
  (b) `ALLOWED_PREFIXES` array added at module scope,
  (c) the bridge `if` condition changed to `.some(p => command.startsWith(p))`,
  (d) no other functions modified.

#### On Failure
Report: "Task 003 FAILED — [paste full tsc error output or diff excerpt showing unexpected change]"

---

## Milestone M2 — Tab Strip & Height

Gate: T-201 through T-206 all pass.

---

### Task 004: Add RIBBON_HEIGHT constant and CSS injection to main.js (ADR-021)
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** 001

#### What to do
In `main.js`, introduce `RIBBON_HEIGHT` as the single source of truth for
ribbon height (ADR-021).

Make three changes — all in `main.js`:

1. Add a module-level constant after the existing constants block
   (near `SERVER_PORT`, `SERVER_DATA_DIR`):
   ```javascript
   const RIBBON_HEIGHT = 124;
   ```

2. In `setViewBounds()`, replace the hard-coded `const ribbonH = 52;` with:
   ```javascript
   const ribbonH = RIBBON_HEIGHT;
   ```

3. After the line `state.ribbonView.webContents.loadFile(...)` in
   `createWindow()`, add:
   ```javascript
   state.ribbonView.webContents.on('did-finish-load', () => {
     state.ribbonView.webContents.insertCSS(
       `:root { --ribbon-height: ${RIBBON_HEIGHT}px; }`
     );
   });
   ```

No other changes to `main.js`.

#### Files touched
- `main.js` — add `RIBBON_HEIGHT` constant; update `setViewBounds()`; add
  CSS injection after ribbon view load

#### Acceptance Criterion
`git diff main.js` shows exactly three hunks matching the changes above and
no others. The literal string `52` no longer appears as a standalone ribbon
height value anywhere in `main.js` (grep: `grep -n "ribbonH = 52" main.js`
returns no output).

#### On Failure
Report: "Task 004 FAILED — [paste diff showing unexpected changes, or grep output showing 52 still present]"

---

### Task 005: Rewrite ribbon.css for light theme and grouped-button layout
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** 004

#### What to do
Replace the entire contents of `ribbon.css` with the Sprint 6 light-theme
grouped-button stylesheet. The new file must:

- Remove `--ribbon-height: 52px` from `:root` (the value now comes from
  `main.js` injection per ADR-021; keep only a fallback comment).
- Set `#ribbon` to flex-column: strip row (30 px) on top, body row (94 px)
  below; total 124 px; background `#F0F0F0`; no bottom border on `#ribbon`
  itself (the body's separator handles it).
- Style `#ribbon-strip`: `height: 30px; background: #00589C;
  display: flex; align-items: stretch; -webkit-app-region: drag;`
- Style `.ribbon-tab`: `color: #ffffff; opacity: 0.75; font-size: 11px;
  font-weight: 600; letter-spacing: 0.05em; padding: 0 12px;
  border-bottom: 2px solid transparent; -webkit-app-region: no-drag;
  background: transparent; border: none; cursor: pointer;`
- Style `.ribbon-tab.active`: `opacity: 1; background: rgba(255,255,255,0.13);
  border-bottom: 2px solid #ffffff;`
- Style `#win-controls`: right-aligned on the strip; `height: 30px`.
- Style `.win-btn`: `width: 36px; height: 30px;` white glyphs on blue;
  `#btn-close:hover` → red `#C0392B`.
- Style `#ribbon-body-container`: `flex: 1; position: relative;` (holds all
  body divs).
- Style `.ribbon-body`: `display: none; flex-direction: row;
  align-items: stretch; height: 94px; background: #F0F0F0;`
- Style `.ribbon-body.active`: `display: flex;`
- Style `.ribbon-group`: flex-column; border-right `1px solid #DCDCDC`;
  padding `5px 8px 0`.
- Style `.ribbon-group-inner`: `display: flex; gap: 2px; flex: 1;
  align-items: center;`
- Style `.ribbon-group-label`: `font-size: 9.5px; color: #8A8A8A;
  text-transform: uppercase; letter-spacing: 0.07em; text-align: center;
  padding: 1px 6px 4px; border-top: 1px solid #DCDCDC;`
- Style `.ribbon-btn-large` and `.ribbon-btn-small` for the two button sizes
  (large: flex-column, 48 px min-width, 22 px icon; small: flex-row, 14 px
  icon); hover: `background: rgba(0,88,156,0.09);
  border: 1px solid rgba(0,88,156,0.2); border-radius: 4px;`
- Style `.ribbon-icon`: `display: inline-block; flex-shrink: 0;` for SVG
  icon containers.
- Style `.ribbon-tile`: the JuliaLab icon tile at left —
  `width: 48px; display: flex; align-items: center; justify-content: center;
  border-right: 1px solid #DCDCDC; flex-shrink: 0;`

All colours must match the DESIGN spec exactly: strip `#00589C`, body
`#F0F0F0`, separators `#DCDCDC`, labels `#8A8A8A`, button text `#333333`.

#### Files touched
- `ribbon.css` — complete rewrite

#### Acceptance Criterion
`npm run start:fast` launches without a white-screen or console CSS parse
error. The ribbon area renders as a blue 30 px strip on top of a light-gray
94 px body (even with the old `index.html` markup still present — it will
look unstyled but must not crash). `git diff ribbon.css` shows the old
`--ribbon-height: 52px` `:root` rule is gone.

#### On Failure
Report: "Task 005 FAILED — [paste console error or describe visual failure]"

---

### Task 006: Rewrite index.html — tab strip and body container structure
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** 005

#### What to do
Replace the contents of `index.html` `<body>` with the full Sprint 6 ribbon
markup. Keep `<head>` unchanged (CSP, stylesheet link, deferred renderer.js).

The new `<body>` structure:

```html
<body>
  <div id="ribbon">

    <!-- Row 1: tab strip (30 px, blue) -->
    <div id="ribbon-strip">
      <div id="ribbon-tabs">
        <button class="ribbon-tab active" data-tab="home">HOME</button>
        <button class="ribbon-tab" data-tab="edit">EDIT</button>
        <button class="ribbon-tab" data-tab="plots">PLOTS</button>
        <button class="ribbon-tab" data-tab="apps">APPS</button>
        <button class="ribbon-tab" data-tab="view">VIEW</button>
        <button class="ribbon-tab" data-tab="pluto">PLUTO</button>
        <button class="ribbon-tab" data-tab="lean">LEAN</button>
        <button class="ribbon-tab" data-tab="wolfram">WOLFRAM</button>
      </div>
      <div id="win-controls">
        <button class="win-btn" id="btn-minimize">&#x2500;</button>
        <button class="win-btn" id="btn-maximize">&#x25A1;</button>
        <button class="win-btn" id="btn-close">&#x2715;</button>
      </div>
    </div>

    <!-- Row 2: body container (94 px, light gray) -->
    <div id="ribbon-body-container">

      <div class="ribbon-body active" data-tab="home">
        <!-- populated in Task 007 -->
      </div>
      <div class="ribbon-body" data-tab="edit">
        <div class="ribbon-tile"><!-- icon: Task 007 --></div>
        <div class="ribbon-group">
          <div class="ribbon-group-inner">
            <span class="ribbon-btn-small" data-command="noop">
              <span class="ribbon-icon"><!-- find icon --></span>
              <span>Find</span>
            </span>
            <span class="ribbon-btn-small" data-command="noop">
              <span class="ribbon-icon"><!-- find icon --></span>
              <span>Find Files</span>
            </span>
            <span class="ribbon-btn-small" data-command="noop">
              <span class="ribbon-icon"><!-- undo icon --></span>
              <span>Undo</span>
            </span>
            <span class="ribbon-btn-small" data-command="noop">
              <span class="ribbon-icon"><!-- redo icon --></span>
              <span>Redo</span>
            </span>
          </div>
          <div class="ribbon-group-label">NAVIGATE</div>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-group-inner">
            <span class="ribbon-btn-small" data-command="noop"><span>Cut</span></span>
            <span class="ribbon-btn-small" data-command="noop"><span>Copy</span></span>
            <span class="ribbon-btn-small" data-command="noop"><span>Paste</span></span>
          </div>
          <div class="ribbon-group-label">EDIT</div>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-group-inner">
            <span class="ribbon-btn-small" data-command="noop"><span>Format Code</span></span>
            <span class="ribbon-btn-small" data-command="noop"><span>Run Section</span></span>
            <span class="ribbon-btn-small" data-command="noop"><span>Breakpoints</span></span>
          </div>
          <div class="ribbon-group-label">CODE</div>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-group-inner">
            <span class="ribbon-btn-large" data-command="noop"><span>Run</span></span>
            <span class="ribbon-btn-large" data-command="noop"><span>Step</span></span>
            <span class="ribbon-btn-large" data-command="noop" style="opacity:0.4"><span>Stop</span></span>
          </div>
          <div class="ribbon-group-label">RUN</div>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-group-inner">
            <span class="ribbon-btn-small" data-command="noop"><span>Packages</span></span>
            <span class="ribbon-btn-small" data-command="noop"><span>Workspace</span></span>
            <span class="ribbon-btn-small" data-command="noop"><span>Revise</span></span>
          </div>
          <div class="ribbon-group-label">ENVIRONMENT</div>
        </div>
      </div>

      <div class="ribbon-body" data-tab="plots">
        <div class="ribbon-tile"><!-- icon: Task 007 --></div>
        <div class="ribbon-group">
          <div class="ribbon-group-inner">
            <span class="ribbon-btn-large" data-command="language-julia.show-plotpane">
              <span class="ribbon-icon"><!-- plot icon --></span>
              <span>Show Plot Pane</span>
            </span>
          </div>
          <div class="ribbon-group-label">PLOTS</div>
        </div>
      </div>

      <div class="ribbon-body" data-tab="apps">
        <div class="ribbon-tile"><!-- icon: Task 007 --></div>
        <div class="ribbon-group">
          <div class="ribbon-group-inner">
            <span class="ribbon-btn-small" data-command="noop"><span>Genie App</span></span>
            <span class="ribbon-btn-small" data-command="noop"><span>Dashboard</span></span>
            <span class="ribbon-btn-small" data-command="noop"><span>Open Dyad</span></span>
          </div>
          <div class="ribbon-group-label">LAUNCH</div>
        </div>
      </div>

      <div class="ribbon-body" data-tab="view">
        <div class="ribbon-tile"><!-- icon: Task 007 --></div>
        <div class="ribbon-group">
          <div class="ribbon-group-inner">
            <span class="ribbon-btn-small" data-command="noop"><span>Default Layout</span></span>
            <span class="ribbon-btn-small" data-command="noop"><span>Wide Editor</span></span>
            <span class="ribbon-btn-small" data-command="noop"><span>Presentation</span></span>
          </div>
          <div class="ribbon-group-label">LAYOUT</div>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-group-inner">
            <span class="ribbon-btn-small" data-command="noop"><span>File Browser</span></span>
            <span class="ribbon-btn-small" data-command="noop"><span>Workspace</span></span>
            <span class="ribbon-btn-small" data-command="noop"><span>Plot Panel</span></span>
            <span class="ribbon-btn-small" data-command="noop"><span>AI Pane</span></span>
          </div>
          <div class="ribbon-group-label">PANELS</div>
        </div>
      </div>

      <div class="ribbon-body" data-tab="pluto">
        <div class="ribbon-tile"><!-- icon: Task 007 --></div>
        <div class="ribbon-group">
          <div class="ribbon-group-inner">
            <span class="ribbon-btn-large" data-command="pluto:launch" data-dispatch="ipc">
              <span class="ribbon-icon"><!-- notebook icon --></span>
              <span>Launch Pluto</span>
            </span>
          </div>
          <div class="ribbon-group-label">NOTEBOOK</div>
        </div>
      </div>

      <div class="ribbon-body" data-tab="lean">
        <div class="ribbon-tile"><!-- icon: Task 007 --></div>
        <div class="ribbon-group">
          <div class="ribbon-group-inner">
            <span class="ribbon-btn-small" data-command="noop"><span>Coming in Sprint 7</span></span>
          </div>
          <div class="ribbon-group-label">LEAN 4</div>
        </div>
      </div>

      <div class="ribbon-body" data-tab="wolfram">
        <div class="ribbon-tile"><!-- icon: Task 007 --></div>
        <div class="ribbon-group">
          <div class="ribbon-group-inner">
            <span class="ribbon-btn-small" data-command="noop"><span>Coming in Sprint 7</span></span>
          </div>
          <div class="ribbon-group-label">WOLFRAM</div>
        </div>
      </div>

    </div><!-- #ribbon-body-container -->
  </div><!-- #ribbon -->
</body>
```

Note: HOME body is left empty (`<!-- populated in Task 007 -->`); icons are
all placeholder comments (`<!-- icon: Task 007 -->`). Both are filled in
Task 007. The `data-command` and `data-dispatch` attributes on the two live
buttons (PLOTS Show Plot Pane, PLUTO Launch Pluto) must be present exactly
as shown.

#### Files touched
- `index.html` — full `<body>` rewrite; `<head>` untouched

#### Acceptance Criterion
`npm run start:fast` launches without a white-screen error. The ribbon shows
a blue strip with 8 white-text tabs and a light-gray body below it. Clicking
each tab switches the visible body div (verify one non-HOME tab shows its
placeholder text). The workbench view loads beneath the ribbon with no visible
gap or overlap (T-205). Window controls respond.

#### On Failure
Report: "Task 006 FAILED — [describe visual failure or paste console error]"

---

## Milestone M3 — HOME Body & Icons

Gate: T-301 through T-308 all pass.

---

### Task 007: Populate HOME body and add JuliaLab icon tile + SVG icons to all bodies
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** 006

#### What to do
This is the largest single task in the sprint. It populates the HOME body with
the FILE / CODE / VARIABLES / NAVIGATE groups and wires the JuliaLab icon tile
into every body's `ribbon-tile` div. It also adds the SVG icons for HOME buttons.

**Part A — JuliaLab icon tile (all bodies)**
In each `<div class="ribbon-tile"><!-- icon: Task 007 --></div>`, replace the
comment with:
```html
<img src="assets/icons/JuliaLab-icon.svg" width="34" height="34"
     alt="JuliaLab" style="border-radius:6px;" />
```

**Part B — HOME body**
Replace `<!-- populated in Task 007 -->` with the full HOME body markup:

```html
<div class="ribbon-tile">
  <img src="assets/icons/JuliaLab-icon.svg" width="34" height="34"
       alt="JuliaLab" style="border-radius:6px;" />
</div>

<div class="ribbon-group">
  <div class="ribbon-group-inner">
    <span class="ribbon-btn-large" data-command="workbench.action.files.newUntitledFile">
      <span class="ribbon-icon">
        <img src="assets/icons/new-script.svg" width="26" height="30" alt="" />
      </span>
      <span>New Script</span>
    </span>
    <div style="display:flex;flex-direction:column;gap:2px;">
      <span class="ribbon-btn-small" data-command="workbench.action.files.newUntitledFile">
        <span class="ribbon-icon">
          <img src="assets/icons/new.svg" width="16" height="18" alt="" />
        </span>
        <span>New</span>
      </span>
      <span class="ribbon-btn-small" data-command="workbench.action.files.openFile">
        <span class="ribbon-icon">
          <img src="assets/icons/open.svg" width="16" height="16" alt="" />
        </span>
        <span>Open</span>
      </span>
      <span class="ribbon-btn-small" data-command="workbench.action.quickOpen">
        <span class="ribbon-icon">
          <img src="assets/icons/go-to-file.svg" width="16" height="20" alt="" />
        </span>
        <span>Go to File</span>
      </span>
      <span class="ribbon-btn-small" data-command="workbench.action.findInFiles">
        <span class="ribbon-icon">
          <img src="assets/icons/find-files.svg" width="15" height="15" alt="" />
        </span>
        <span>Find Files</span>
      </span>
    </div>
  </div>
  <div class="ribbon-group-label">FILE</div>
</div>

<div class="ribbon-group">
  <div class="ribbon-group-inner">
    <span class="ribbon-btn-large" data-command="language-julia.executeJuliaCodeInREPL">
      <span class="ribbon-icon">
        <img src="assets/icons/run-section.svg" width="26" height="26" alt="" />
      </span>
      <span>Run Section</span>
    </span>
    <div style="display:flex;flex-direction:column;gap:2px;">
      <span class="ribbon-btn-small" data-command="editor.action.formatDocument">
        <span class="ribbon-icon">
          <img src="assets/icons/format-code.svg" width="18" height="22" alt="" />
        </span>
        <span>Format Code</span>
      </span>
      <span class="ribbon-btn-small" data-command="language-julia.executeFile">
        <span class="ribbon-icon">
          <img src="assets/icons/run-file.svg" width="16" height="16" alt="" />
        </span>
        <span>Run File</span>
      </span>
    </div>
  </div>
  <div class="ribbon-group-label">CODE</div>
</div>

<div class="ribbon-group">
  <div class="ribbon-group-inner">
    <div style="display:flex;flex-direction:column;gap:2px;">
      <span class="ribbon-btn-small" data-command="language-julia.clearAllInlineResults">
        <span class="ribbon-icon">
          <img src="assets/icons/clear-workspace.svg" width="18" height="19" alt="" />
        </span>
        <span>Clear Workspace</span>
      </span>
      <span class="ribbon-btn-small" data-command="language-julia.show-workspace">
        <span class="ribbon-icon">
          <img src="assets/icons/workspace.svg" width="18" height="18" alt="" />
        </span>
        <span>Workspace</span>
      </span>
      <span class="ribbon-btn-small" data-command="language-julia.openPackageDir">
        <span class="ribbon-icon">
          <img src="assets/icons/packages.svg" width="16" height="16" alt="" />
        </span>
        <span>Packages</span>
      </span>
    </div>
  </div>
  <div class="ribbon-group-label">VARIABLES</div>
</div>

<div class="ribbon-group" style="border-right:none;">
  <div class="ribbon-group-inner">
    <div style="display:flex;flex-direction:column;gap:2px;">
      <span class="ribbon-btn-small" data-command="editor.action.startFindReplaceAction">
        <span class="ribbon-icon">
          <img src="assets/icons/find.svg" width="15" height="15" alt="" />
        </span>
        <span>Find</span>
      </span>
      <span class="ribbon-btn-small" data-command="workbench.action.findInFiles">
        <span class="ribbon-icon">
          <img src="assets/icons/find-files.svg" width="15" height="15" alt="" />
        </span>
        <span>Find Files</span>
      </span>
    </div>
    <div style="display:flex;flex-direction:column;gap:2px;">
      <span class="ribbon-btn-small" data-command="workbench.action.navigateBack">
        <span class="ribbon-icon">
          <img src="assets/icons/save.svg" width="15" height="14" alt="" />
        </span>
        <span>Undo</span>
      </span>
      <span class="ribbon-btn-small" data-command="workbench.action.navigateForward">
        <span class="ribbon-icon">
          <img src="assets/icons/save.svg" width="15" height="14" alt="" />
        </span>
        <span>Redo</span>
      </span>
    </div>
  </div>
  <div class="ribbon-group-label">NAVIGATE</div>
</div>
```

**Note on command ids:** The command ids above are the best available
approximations, but several (`language-julia.executeJuliaCodeInREPL`,
`language-julia.clearAllInlineResults`, `language-julia.show-workspace`,
`language-julia.openPackageDir`, `language-julia.executeFile`) must be
verified against the installed julia-vscode export list from Sprint 5's
Spike J finding (`juliaExt.exports`) before wiring. If a command id is wrong,
the button will silently do nothing (prefix check passes, command not found).
Record the verified ids in a comment inside the relevant group. Undo/Redo
use `workbench.action.navigateBack/Forward` as placeholders; the correct
editor undo/redo ids are `undo` and `redo` (bare) — verify and correct if
the navigate commands don't produce the expected result during T-306 testing.

**Note on icons:** Undo and Redo have no dedicated icons in the current asset
set (`save.svg` is used as a placeholder above). If you want to add `undo.svg`
and `redo.svg` to `assets/icons/` before this task, do so as a separate commit
first; otherwise the placeholder is acceptable for Sprint 6.

#### Files touched
- `index.html` — fill HOME body markup and all `ribbon-tile` img tags

#### Acceptance Criterion
`npm run start:fast` launches. HOME tab is active. The JuliaLab icon tile is
visible at the left end of the ribbon body. Four group labels are visible:
FILE, CODE, VARIABLES, NAVIGATE. All icon `<img>` tags load without
broken-image placeholders (verify in DevTools Network tab: all `assets/icons/`
requests return 200). T-301 through T-307 pass.

#### On Failure
Report: "Task 007 FAILED — [list which icons are broken (404) or which groups are missing]"

---

## Milestone M4 — Tab Switching

Gate: T-401 through T-405 all pass.

---

### Task 008: Rewrite renderer.js — tab→body switching model
**Status:** [ ] Pending
**Milestone:** M4
**Depends on:** 007

#### What to do
Replace the tab-click dispatch logic in `renderer.js` with the tab→body
switching model. The current logic (starting at `// Ribbon tab clicks`)
dispatches a command on every tab click. The new model switches the visible
body div and dispatches only on button clicks within bodies.

Replace the entire section from `// Ribbon tab clicks` to the end of the file
with:

```javascript
// ── Tab → body switching ──────────────────────────────────────────────────────

function activateTab(tabEl) {
  // Update tab active state
  document.querySelectorAll('.ribbon-tab')
    .forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');

  // Show matching body, hide others
  const target = tabEl.dataset.tab;
  document.querySelectorAll('.ribbon-body')
    .forEach(b => b.classList.toggle('active', b.dataset.tab === target));
}

// Initialise: activate the default tab on load
const defaultTab = document.querySelector('.ribbon-tab.active');
if (defaultTab) activateTab(defaultTab);

// Tab strip clicks
document.querySelectorAll('.ribbon-tab').forEach(tab => {
  tab.addEventListener('click', () => activateTab(tab));
});

// ── Button dispatch ───────────────────────────────────────────────────────────

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-command]');
  if (!btn) return;
  const command = btn.dataset.command;
  if (!command || command === 'noop') return;

  if (btn.dataset.dispatch === 'ipc') {
    if (command === 'pluto:launch') {
      window.electronAPI.launchPluto();
    }
  } else {
    window.electronAPI.ribbonCommand(command);
  }
});
```

Keep the window-controls section (lines 1–14 of the current file) unchanged.

#### Files touched
- `renderer.js` — replace tab-click section with tab→body model + event-
  delegated button dispatch

#### Acceptance Criterion
`npm run start:fast` launches. Clicking each of the 8 tabs switches the visible
body without reloading the workbench. Clicking HOME returns to the HOME body.
No JavaScript error appears in DevTools console. T-401 and T-402 pass.

#### On Failure
Report: "Task 008 FAILED — [describe which tab click fails or paste console error]"

---

## Milestone M5 — Live Buttons

Gate: T-501 through T-505 all pass.

---

### Task 009: Verify and correct HOME button command ids against julia-vscode exports
**Status:** [ ] Pending
**Milestone:** M5
**Depends on:** 008

#### What to do
This is a **John-run verification task** — Antigravity does not execute it.
Spike J (Sprint 5) confirmed `juliaExt.exports` exposes:
`executeInREPL` (and others). Run the app and open the VSCodium DevTools
(Help → Toggle Developer Tools inside the workbench) or use the extension
host log probe to list all registered commands matching `language-julia.*`.

For each HOME button with a `language-julia.*` command id, verify it fires
the expected action. Correct any wrong id directly in `index.html` — one
small edit per wrong id. Commit each correction individually.

Commands to verify (from Task 007):
- `language-julia.executeJuliaCodeInREPL` → Run Section
- `language-julia.executeFile` → Run File
- `language-julia.clearAllInlineResults` → Clear Workspace
- `language-julia.show-workspace` → Workspace panel
- `language-julia.openPackageDir` → Packages

Also verify the plain `workbench.action.*` and `editor.action.*` commands
fire correctly (they should — the prefix allowlist covers them, and they're
standard VSCodium commands).

Report verified ids back here before Task 010.

#### Files touched
- `index.html` — correct any wrong `data-command` values (one edit per id)

#### Acceptance Criterion
John reports: "Task 009 DONE — verified ids: [list]. Corrected: [list of
any changes made]. All HOME buttons produce a visible response in the workbench."

#### On Failure
Report: "Task 009 BLOCKED — [describe which command id produces no response
and what the correct id appears to be from the command palette]"

---

### Task 010: Smoke-test PLOTS Show Plot Pane and PLUTO Launch Pluto
**Status:** [ ] Pending
**Milestone:** M5
**Depends on:** 009

#### What to do
This is a **John-run functional test** — not an Antigravity code task.
With the app running after Task 009:

1. Click the PLOTS tab → click "Show Plot Pane".
   Expected: julia-vscode plot pane opens or focuses (T-501).

2. Click the PLUTO tab → click "Launch Pluto".
   Expected: Pluto server spawns; browser tab opens (T-503).

3. Open DevTools console → type:
   `window.electronAPI.ribbonCommand('evil.takeOver')`
   Expected: no workbench change, no error dialog (T-504).

4. Confirm `language-julia.show-plotpane` still works via PLOTS (T-505).

Report results back here. No code change is expected from this task unless
a command id needs correction (in which case edit `index.html` and commit).

#### Files touched
- `index.html` — only if a command id correction is needed

#### Acceptance Criterion
John reports: "Task 010 DONE — T-501 PASS, T-503 PASS, T-504 PASS, T-505 PASS."

#### On Failure
Report: "Task 010 FAILED — [list which test failed and what was observed]"

---

## Milestone M6 — Regression & Tag

Gate: T-601 through T-606 all pass; sprint tag pushed.

---

### Task 011: Full regression pass (John-verified)
**Status:** [ ] Pending
**Milestone:** M6
**Depends on:** 010

#### What to do
This is a **John-run regression task**. Run the full T-6xx test suite from
`TEST_PLAN-sprint6.md`:

- T-601: ✕-quit teardown process-diff audit (PowerShell `Get-CimInstance`)
- T-602: Window drag region preserved
- T-603: Minimize / maximize / restore
- T-604: Resize — workbench stays flush
- T-605: No new console errors at startup
- T-606: Sprint 5 acceptance criteria still green

Report each result. If any fails, escalate here before proceeding to Task 012.

#### Files touched
- None (verification only; fixes addressed as separate tasks if needed)

#### Acceptance Criterion
John reports: "Task 011 DONE — T-601 PASS, T-602 PASS, T-603 PASS, T-604 PASS,
T-605 PASS, T-606 PASS."

#### On Failure
Report: "Task 011 FAILED — [list failing tests and observations]"
Escalate to planning thread. Do not tag.

---

### Task 012: Commit, tag, and push sprint6-complete
**Status:** [ ] Pending
**Milestone:** M6
**Depends on:** 011

#### What to do
Create the sprint completion commit and tag.

```bash
git add -A
git commit -m "Sprint 6 complete: MATLAB-style ribbon redesign

- ADR-020: prefix-allowlist dispatch in extension.ts
- ADR-021: RIBBON_HEIGHT=124 SSOT in main.js
- ADR-022: dropdowns deferred to Sprint 7
- New tab order: HOME EDIT PLOTS APPS VIEW PLUTO LEAN WOLFRAM
- Light theme: #00589C strip / #F0F0F0 body
- HOME body: FILE CODE VARIABLES NAVIGATE groups with JL26 icons
- Placeholder bodies for all non-HOME tabs
- Live: PLOTS show-plotpane, PLUTO launch via ipc
- Icon assets: assets/icons/ (16 files from Compute42 set)"

git tag sprint6-complete
git push origin main --tags
```

#### Files touched
- `.git/` only (commit + tag)

#### Acceptance Criterion
`git log --oneline -1` shows the sprint 6 commit message.
`git tag` lists `sprint6-complete`.
`git push` exits 0.
GitHub `https://github.com/XerxesZorgon/JuliaLab` shows the tag on `main`.

#### On Failure
Report: "Task 012 FAILED — [paste git error output]"
