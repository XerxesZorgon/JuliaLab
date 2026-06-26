# tasks.md
**Project:** JuliaLabShell — Electron/VSCodium Chrome Proof-of-Concept
**Version:** 0.1
**Date:** 2026-06-22

---

## Task 001: package.json + main.js skeleton
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** —

### What to do
Create `JuliaLabShell/package.json` with Electron 39.8.8 pinned as a
devDependency and a `dev` script that runs `electron .`. Then create
`JuliaLabShell/main.js` that imports Electron's `app` and `BrowserWindow`,
waits for `app.whenReady()`, and opens a single `BrowserWindow` (1400×900,
`frame: false`, `webPreferences: { preload: path.join(__dirname, 'preload.js'),
contextIsolation: true, nodeIntegration: false }`). The window should load
`index.html`. Register `app.on('window-all-closed', () => app.quit())`.
Do not create `preload.js` or `index.html` yet — those are T002 and T003.

### Files touched
- `package.json` — created
- `main.js` — created

### Acceptance Criterion
`npm install` completes without errors. `npm run dev` opens a blank Electron
window (1400×900, no OS title bar) and the terminal shows no uncaught
exceptions. A missing `preload.js` warning in the console is acceptable at
this stage.

### On Failure
```
TASK 001 FAILED
Criterion: npm run dev opens blank frameless Electron window, no uncaught exceptions
Observed: [exact console output]
Action taken: none — awaiting instruction
```

---

## Task 002: preload.js + contextBridge skeleton
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** Task 001

### What to do
Create `JuliaLabShell/preload.js`. Use Electron's `contextBridge` and
`ipcRenderer` to expose `window.electronAPI` with exactly these five members:
`minimize()` → sends `'window:minimize'`; `maximize()` → sends
`'window:maximize'`; `close()` → sends `'window:close'`;
`onVSCodiumStatus(callback)` → registers a listener on `'vscodium:status'`
that calls `callback(status)`. Do not add any other members. Do not modify
`main.js` or `package.json`.

### Files touched
- `preload.js` — created

### Acceptance Criterion
`npm run dev` launches without errors and the console no longer shows a
preload warning. Opening DevTools (Ctrl+Shift+I in the Electron window) and
running `window.electronAPI` in the console returns an object with exactly
the four keys: `minimize`, `maximize`, `close`, `onVSCodiumStatus`.

### On Failure
```
TASK 002 FAILED
Criterion: window.electronAPI has exactly four keys in DevTools console
Observed: [exact output of window.electronAPI in console]
Action taken: none — awaiting instruction
```

---

## Task 003: index.html + renderer.js skeleton
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** Task 002

### What to do
Create `JuliaLabShell/index.html`. The page must have: `box-sizing: border-box`,
`margin: 0`, `overflow: hidden` on `body`; a `<div id="ribbon">` at the top
(height 52px, background `#f3f3f3`, full width); a `<div id="vscodium-status">`
below the ribbon filling the remaining height (background `#1e1e1e`, color
`#cccccc`, centered text reading "VSCodium not started"). Load
`renderer.js` as a `<script>` at the bottom of `<body>`. Create
`JuliaLabShell/renderer.js` as an empty file with a single comment:
`// renderer logic added in later tasks`. Do not add ribbon styling or
IPC wiring yet — those are T004 and T005.

### Files touched
- `index.html` — created
- `renderer.js` — created

### Acceptance Criterion
`npm run dev` opens the Electron window showing a light gray bar (52px) at
the top and a dark area below filling the remaining space with the text
"VSCodium not started" centered. No console errors.

### On Failure
```
TASK 003 FAILED
Criterion: frameless window shows 52px gray ribbon area + dark status area with centered text
Observed: [description of what actually appeared]
Console errors: [paste any errors]
Action taken: none — awaiting instruction
```

---

## Task 004: ribbon.css — MATLAB geometry, tab labels, window controls
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** Task 003

### What to do
Create `JuliaLabShell/ribbon.css` and link it from `index.html`. Style the
`#ribbon` div to match MATLAB R2023b+ ribbon geometry: height 52px, background
`#f3f3f3`, border-bottom `1px solid #d0d0d0`, display flex, align-items
center. Inside `#ribbon`, add (by updating `index.html`):

- A `-webkit-app-region: drag` drag area spanning most of the ribbon width
  (allows the frameless window to be dragged by the ribbon)
- Six tab labels as `<span class="ribbon-tab">` elements with text:
  HOME, PLOTS, APPS, LIVE EDITOR, INSERT, VIEW. Font: Segoe UI 11px,
  color `#333`, padding 0 12px, height 100%, line-height 52px.
  Active tab (HOME) has bottom-border `2px solid #0078d4` and color `#0078d4`.
- A window controls group `<div id="win-controls">` flush right containing
  three `<button>` elements: minimize (─), maximize (□), close (✕).
  Buttons: 46px wide, 52px tall, no border, background transparent,
  font-size 16px. Close button hover background `#e81123`, color white.
  Minimize and maximize hover background `#e5e5e5`.
- `-webkit-app-region: no-drag` on the tab spans and win-controls div
  (so clicks register, not drags).

Do not add IPC wiring to the buttons yet — that is T005.

### Files touched
- `ribbon.css` — created
- `index.html` — updated (link ribbon.css, add tab spans and win-controls div)

### Acceptance Criterion
`npm run dev` shows the ribbon bar with six tab labels and three window
control buttons correctly styled. The HOME tab has a blue underline. The
close button turns red on hover. The window can be dragged by clicking and
holding the ribbon tab area. **Take a screenshot and confirm geometry matches
MATLAB R2023b+ ribbon before proceeding.**

### On Failure
```
TASK 004 FAILED
Criterion: ribbon shows six tabs + three window controls; HOME tab blue underline; drag works
Observed: [description]
Console errors: [paste any]
Action taken: none — awaiting instruction
```

---

## Task 005: Wire window controls via IPC
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** Task 004

### What to do
Update `renderer.js` to wire the three window control buttons to
`window.electronAPI`: clicking minimize calls `window.electronAPI.minimize()`;
clicking maximize calls `window.electronAPI.maximize()`; clicking close calls
`window.electronAPI.close()`. Use `document.getElementById` or
`querySelector` to find the buttons. Update `main.js` to handle the three
IPC channels: `'window:minimize'` → `win.minimize()`; `'window:maximize'` →
`win.isMaximized() ? win.unmaximize() : win.maximize()`; `'window:close'` →
`app.quit()`. Import `ipcMain` from electron at the top of `main.js`.

### Files touched
- `renderer.js` — updated
- `main.js` — updated

### Acceptance Criterion
Clicking minimize hides the window to the taskbar. Clicking maximize fills
the screen; clicking again restores. Clicking close terminates the Electron
process (terminal returns to prompt). No console errors on any button click.

### On Failure
```
TASK 005 FAILED
Criterion: minimize/maximize/close buttons all operate Electron window correctly
Observed: [which button failed and what happened]
Console errors: [paste any]
Action taken: none — awaiting instruction
```

---

## Task 006: Write vscodium-data/User/settings.json
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** Task 005

### What to do
Update `main.js` to write VSCodium's chrome-suppression settings before
spawning VSCodium. In the `app.whenReady()` block, before any spawn call,
use `fs.mkdirSync` with `{ recursive: true }` to create
`<__dirname>/vscodium-data/User/`, then use `fs.writeFileSync` to write
`settings.json` with exactly this content:

```json
{
  "window.titleBarStyle": "custom",
  "window.menuBarVisibility": "hidden",
  "workbench.colorTheme": "Default Light Modern"
}
```

Do not spawn VSCodium yet — that is T007. Import `fs` and `path` from Node
at the top of `main.js` if not already present.

### Files touched
- `main.js` — updated (fs.mkdirSync + fs.writeFileSync before spawn)

### Acceptance Criterion
`npm run dev` launches. The file
`JuliaLabShell/vscodium-data/User/settings.json` exists on disk with exactly
the three keys above. Verify with:
`type JuliaLabShell\vscodium-data\User\settings.json` in PowerShell.
No console errors.

### On Failure
```
TASK 006 FAILED
Criterion: vscodium-data/User/settings.json exists with correct content
Observed: [file missing / wrong content / error]
Console errors: [paste any]
Action taken: none — awaiting instruction
```

---

## Task 007: Spawn VSCodium subprocess in main.js
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** Task 006

### What to do
Update `main.js` to spawn VSCodium after writing settings.json. Add a
constant at the top of the file:
`const VSCODIUM_EXE = process.env.VSCODIUM_PATH ||
'C:\\Program Files\\VSCodium\\VSCodium.exe';`
After the settings.json write, check `fs.existsSync(VSCODIUM_EXE)` — if
false, send `'vscodium:status'` with value `'error: VSCodium not found at
' + VSCODIUM_EXE` and return without spawning. If true, spawn with
`child_process.spawn(VSCODIUM_EXE, ['--user-data-dir',
path.join(__dirname, 'vscodium-data'), '--no-sandbox',
'--disable-extensions'], { detached: false })`. Store the result as
`vscodiumProcess`. Register `vscodiumProcess.on('exit', (code) =>
win.webContents.send('vscodium:status', 'exited: code ' + code))`.
Register `app.on('before-quit', () => { if (vscodiumProcess)
vscodiumProcess.kill(); })`. Import `child_process` at the top of main.js.
Update `renderer.js` to call `window.electronAPI.onVSCodiumStatus((s) =>
{ document.getElementById('vscodium-status').textContent = s; })`.

### Files touched
- `main.js` — updated (spawn + exit handler + before-quit handler)
- `renderer.js` — updated (onVSCodiumStatus listener)

### Acceptance Criterion
`npm run dev` launches the Electron ribbon window AND opens a VSCodium
window within 10 seconds. The `#vscodium-status` div updates from "VSCodium
not started" to "exited: code N" if VSCodium is closed. Closing the Electron
window (via OS or close button) does not leave an orphaned VSCodium.exe
process in Task Manager.

### On Failure
```
TASK 007 FAILED
Criterion: VSCodium window opens within 10s; no orphan process on close
Observed: [what happened — window appeared? error message?]
Console errors: [paste any]
Action taken: none — awaiting instruction
```

---

## Task 008: Emit vscodium:status events; display in renderer
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** Task 007

### What to do
Update `main.js` to emit a `'vscodium:status'` event with value `'starting'`
immediately after the spawn call, and `'ready'` after a 3000ms timeout
(crude but sufficient for PoC — VSCodium has no ready signal in subprocess
mode). Update `renderer.js` so the `onVSCodiumStatus` callback sets
`#vscodium-status` text to the received status string and also updates the
text color: `'starting'` → `#ffcc00`; `'ready'` → `#00cc66`;
any string starting with `'error'` or `'exited'` → `#ff4444`.

### Files touched
- `main.js` — updated (status emit on spawn + 3s ready timeout)
- `renderer.js` — updated (color-coded status display)

### Acceptance Criterion
`npm run dev` shows `#vscodium-status` text cycle: yellow "starting" →
green "ready" (after ~3s). If VSCodium is manually closed, text turns red
"exited: code N". No console errors.

### On Failure
```
TASK 008 FAILED
Criterion: status cycles starting(yellow) → ready(green); exits turn red
Observed: [what was displayed and when]
Console errors: [paste any]
Action taken: none — awaiting instruction
```

---

## Task 009: PowerShell SetWindowPos — initial VSCodium positioning
**Status:** [ ] Pending
**Milestone:** M4
**Depends on:** Task 008

### What to do
Update `main.js` to position the VSCodium window below the ribbon after
the 3000ms ready timeout fires. Get the Electron window bounds with
`win.getBounds()` → `{x, y, width, height}`. Then call
`child_process.execSync` with a PowerShell one-liner that uses
`Add-Type` to import `user32.dll` and calls `SetWindowPos` to move the
VSCodium window to:
  x = bounds.x
  y = bounds.y + 52
  width = bounds.width
  height = bounds.height - 52
Find the VSCodium window by process ID using
`[System.Diagnostics.Process]::GetProcessById(vscodiumProcess.pid).MainWindowHandle`.
Wrap the `execSync` call in a try/catch — on error, log a warning to
console but do not throw (VSCodium remains usable, just unaligned). Use
`SWP_NOZORDER = 0x0004` flag in SetWindowPos to avoid z-order changes.

### Files touched
- `main.js` — updated (PowerShell positioning after ready timeout)

### Acceptance Criterion
After `npm run dev`, within 4 seconds, the VSCodium window is visually
positioned immediately below the ribbon with no gap and no overlap.
VSCodium left edge, right edge, and width match the Electron window.

### On Failure
```
TASK 009 FAILED
Criterion: VSCodium window positioned flush below ribbon within 4s of launch
Observed: [position of VSCodium window — gap? overlap? wrong size?]
PowerShell error (if any): [paste]
Action taken: none — awaiting instruction
```

---

## Task 010: Re-position VSCodium on Electron window move and resize
**Status:** [ ] Pending
**Milestone:** M4
**Depends on:** Task 009

### What to do
Extract the PowerShell positioning logic from T009 into a named function
`positionVSCodium(win, vscodiumProcess)` in `main.js`. Call this function
from three Electron window events: `win.on('move', ...)`,
`win.on('resize', ...)`, and `win.on('focus', ...)`. Debounce the move and
resize calls with a 100ms `setTimeout` / `clearTimeout` pattern to avoid
flooding PowerShell with rapid calls during a drag. The focus handler fires
immediately without debounce (re-aligns after alt-tab). Wrap all three
handlers in try/catch — log warnings, do not throw.

### Files touched
- `main.js` — updated (positionVSCodium function + move/resize/focus handlers)

### Acceptance Criterion
Drag the Electron window to a new screen position — VSCodium follows within
200ms and remains flush below the ribbon. Resize the Electron window —
VSCodium resizes to match within 200ms. Alt-tab away and back — VSCodium
re-aligns immediately. No console errors during any of these operations.

### On Failure
```
TASK 010 FAILED
Criterion: VSCodium follows Electron window on move, resize, and focus
Observed: [which event failed; what VSCodium did instead]
Console errors: [paste any]
Action taken: none — awaiting instruction
```

---

## Task 011: README.md + PoC gate
**Status:** [ ] Pending
**Milestone:** M5
**Depends on:** Task 010

### What to do
Create `JuliaLabShell/README.md` with the following sections:
- **JuliaLabShell** — one-sentence description
- **What it does** — two sentences on the PoC purpose
- **Requirements** — Node 22.22.1, VSCodium 1.121.03429 at
  `C:\Program Files\VSCodium\`, Windows 10 x64
- **Installation** — `npm install`
- **Usage** — `npm run dev`
- **PoC Verdict** — placeholder section: "[ ] PASS / [ ] FAIL — [date] —
  [one sentence on outcome and next steps]"

After creating README.md: run the full integration test from TEST_PLAN.md
(all four SC checks in one session). Take a screenshot. Fill in the PoC
Verdict section. Commit everything with message:
`feat: JuliaLabShell PoC complete — [PASS/FAIL]`.

### Files touched
- `README.md` — created

### Acceptance Criterion
`README.md` exists with all five sections. The PoC Verdict section is filled
in (not placeholder). A screenshot file exists at `docs/poc-screenshot.png`.
Final commit exists with message starting `feat: JuliaLabShell PoC complete`.

### On Failure
```
TASK 011 FAILED
Criterion: README exists; verdict filled; screenshot committed; final commit present
Observed: [what is missing]
Action taken: none — awaiting instruction
```
