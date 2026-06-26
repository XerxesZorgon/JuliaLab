# tasks.md — JuliaLabApp Sprint 1
**Last updated:** 2026-06-22

---

## Task 001: Spike — Verify openvscode-server embeds in WebContentsView
**Status:** [ ] Pending
**Milestone:** M0
**Depends on:** —

### What to do
Create a minimal throwaway Electron script (`spike/spike.js`) — NOT in the
main project folder — that does exactly this in sequence:

1. Spawns `openvscode-server` bound to `127.0.0.1:3000` using whatever
   binary is available (download the latest release from
   https://github.com/gitpod-io/openvscode-server/releases and note the
   exact version tag and the VSCodium version it corresponds to).
2. Waits for a line on its stdout matching `/[Ll]istening/` before
   continuing (timeout 20s).
3. Creates a `BaseWindow` (800×600, frameless false for the spike).
4. Creates one `WebContentsView`, loads `http://127.0.0.1:3000`, adds
   it to the window filling the full content area.
5. Writes to the console: the exact Electron version, the exact
   openvscode-server version, and the exact stdout ready-signal line.

Then manually verify all four spike criteria:
- SPIKE-1: server started; version noted.
- SPIKE-2: VSCodium workbench (file tree, editor, terminal) is visible
  in the window.
- SPIKE-3: Type `julia -e 'println("hello")'` in the integrated terminal
  10 times; echo is subjectively imperceptible.
- SPIKE-4: Add `--default-workspace` and a Machine/settings.json with
  `{"window.titleBarStyle":"custom","window.menuBarVisibility":"hidden",
  "workbench.activityBar.visible":false}` to the spawn flags; reload;
  confirm all three chrome elements are suppressed.

### Files touched
- `spike/spike.js` — throwaway spike file (not committed to main project)

### Acceptance Criterion
Report back ALL of the following as a single message:
```
SPIKE RESULT: PASS / FAIL
Electron version: X.Y.Z
openvscode-server version: X.Y.Z  (VSCodium upstream: X.Y.Z)
Ready signal line: <exact stdout line>
SPIKE-1: PASS/FAIL — <notes>
SPIKE-2: PASS/FAIL — <notes>
SPIKE-3: PASS/FAIL — <notes>
SPIKE-4: PASS/FAIL — <notes>
```
Overall PASS only if all four sub-criteria are PASS.
Do not proceed to Task 002 until this report is confirmed in the
Claude Projects planning thread and PLAN.md dependency versions are filled in.

### On Failure
Report: `FAIL: SPIKE — [which criterion failed] — [exact error or observation]`
Include any console errors, process exit codes, and the stdout of the server.
Do NOT attempt to fix or work around. Escalate to planning thread.

---

## Task 002: Initialize package.json and project scaffold
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** Task 001 (PASS + versions pinned in PLAN.md)

### What to do
In `C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp`,
create `package.json` with exact pinned versions from PLAN.md (filled in
after spike). Set `"main": "main.js"`, `"name": "julialab-app"`,
`"version": "0.1.0"`. Add a `"start": "electron ."` script.
Also create `.gitignore` (node_modules, spike/, dist/).
Do NOT run `npm install` — show the diff and wait for approval.

### Files touched
- `package.json` — new file
- `.gitignore` — new file

### Acceptance Criterion
`cat package.json` shows exact pinned Electron version (no `^`).
`npm install` (run by John after approval) completes without error.
`npx electron --version` matches the pinned version.

### On Failure
Report: `FAIL: Task 002 — [exact error from npm install]`
Do not attempt resolution. Escalate.

---

## Task 003: main.js skeleton — BaseWindow, frameless, empty
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** Task 002

### What to do
Create `main.js` with the minimal Electron main process that:
- Imports `{ app, BaseWindow }` from `'electron'`.
- On `app.whenReady()`: creates one `BaseWindow` (1280×800, `frame: false`,
  `show: false`).
- Loads no URL and adds no views yet.
- Calls `win.show()` after creation.
- Handles `app.on('window-all-closed', () => app.quit())`.
- Does NOT touch `spawnServer`, `WebContentsView`, or ribbon yet.

### Files touched
- `main.js` — new file

### Acceptance Criterion
`npm start` opens a blank frameless window (1280×800). No crash. No error
in the terminal. `Ctrl+C` in the terminal closes the app cleanly.

### On Failure
Report: `FAIL: Task 003 — [exact error and stack trace]`
Revert and escalate.

---

## Task 004: preload.js — contextBridge for window controls
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** Task 003

### What to do
Create `preload.js` that exposes exactly three methods on `window.electronAPI`:
`minimize()`, `maximize()`, `close()` — each sends the corresponding
`ipcRenderer.send('window:minimize' | 'window:maximize' | 'window:close')`.

In `main.js`, add the three `ipcMain.on` handlers that call
`win.minimize()`, `win.isMaximized() ? win.unmaximize() : win.maximize()`,
and `win.destroy()` respectively.

Wire `preload.js` into the `BaseWindow` constructor via
`webPreferences: { preload: path.join(__dirname, 'preload.js'),
contextIsolation: true, nodeIntegration: false }`.

### Files touched
- `preload.js` — new file
- `main.js` — add `ipcMain` handlers and `webPreferences` to constructor

### Acceptance Criterion
From the DevTools console of the BaseWindow, running
`window.electronAPI.minimize()` minimises the window.
`window.electronAPI.maximize()` maximises then (called again) restores.
`window.electronAPI.close()` closes the window and exits the app.

### On Failure
Report: `FAIL: Task 004 — [exact error]`. Revert `main.js` and delete
`preload.js`. Escalate.

---

## Task 005: index.html + ribbon.css — MATLAB ribbon layout
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** Task 004

### What to do
Create `index.html` and `ribbon.css` that render the MATLAB R2023b+-style
ribbon bar. Port geometry and styles directly from the JuliaLabShell PoC
(`JuliaLabShell/index.html` and `JuliaLabShell/ribbon.css`).

The ribbon must have:
- Six tab labels: HOME, PLOTS, APPS, LIVE EDITOR, INSERT, VIEW.
- Three window control buttons: minimise (─), maximise (□), close (✕).
- The CSS variable `--ribbon-height` set to the correct pixel value
  (measure from Matlab1.png reference; nominal value from PoC is 88px —
  verify against reference images before committing).
- No scrollbar. No VSCodium chrome. No other content.

Load `index.html` into the `BaseWindow` via `win.loadFile('index.html')`.
Do NOT add the `WebContentsView` yet.

### Files touched
- `index.html` — new file
- `ribbon.css` — new file
- `main.js` — add `win.loadFile('index.html')`

### Acceptance Criterion
`npm start` shows the frameless window with the MATLAB-style ribbon
filling the top. Tab labels are visible. Window control buttons are
present. No other content visible. Visually matches Matlab1.png reference
(allow ±2px tolerance on heights; tab label text must match exactly).

### On Failure
Report: `FAIL: Task 005 — [what does not match and by how much]`
Revert all three files to prior state. Escalate.

---

## Task 006: renderer.js — window control button click wiring
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** Task 005

### What to do
Create `renderer.js` that:
- Queries the minimise, maximise, and close buttons by their IDs
  (`#btn-minimize`, `#btn-maximize`, `#btn-close` — add these IDs to
  `index.html` if not already present from Task 005).
- Adds `click` event listeners that call `window.electronAPI.minimize()`,
  `window.electronAPI.maximize()`, `window.electronAPI.close()`.
- Add `<script defer src="renderer.js"></script>` to `index.html`.

### Files touched
- `renderer.js` — new file
- `index.html` — add button IDs and script tag if missing

### Acceptance Criterion
M1 gate: `npm start` → clicking ─ minimises, □ maximises/restores,
✕ closes with no orphan process (verify in Task Manager).
Commit with message `M1: shell skeleton complete`.

### On Failure
Report: `FAIL: Task 006 — [which button failed and observed behaviour]`
Revert `renderer.js` and `index.html` changes. Escalate.

---

## Task 007: server-data/Machine/settings.json — chrome suppression
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** Task 006

### What to do
Create the directory `server-data/Machine/` and the file
`server-data/Machine/settings.json` containing:
```json
{
  "window.titleBarStyle": "custom",
  "window.menuBarVisibility": "hidden",
  "workbench.activityBar.visible": false,
  "workbench.statusBar.visible": true
}
```
This file is written statically for Sprint 1. In Sprint 4 it will be
written programmatically to the app data directory.

### Files touched
- `server-data/Machine/settings.json` — new file

### Acceptance Criterion
`cat server-data/Machine/settings.json` (or `type` on Windows) outputs
the exact JSON above with no syntax errors (`node -e
"JSON.parse(require('fs').readFileSync('server-data/Machine/settings.json','utf8'))"` exits 0).

### On Failure
Report: `FAIL: Task 007 — [parse error or missing keys]`. Fix inline
(single-file task, low risk) or escalate.

---

## Task 008: main.js — spawnServer() + waitForReady()
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** Task 007

### What to do
Add to `main.js` (only `main.js`):

1. A constant `OVSCODE_BIN` pointing to the openvscode-server binary
   (absolute path; use the version pinned in PLAN.md from Task 001).
2. A constant `SERVER_DATA_DIR` = `path.join(__dirname, 'server-data')`.
3. A constant `SERVER_PORT` = `3000` (hardcoded for Sprint 1; dynamic
   port detection is Sprint 4).
4. `function spawnServer()` that:
   - Spawns `OVSCODE_BIN` with args:
     `['--host', '127.0.0.1', '--port', String(SERVER_PORT),
       '--server-data-dir', SERVER_DATA_DIR,
       '--without-connection-token']`
   - Stores the child process in `state.serverProcess`.
   - Pipes stdout to `process.stdout` for logging.
5. `function waitForReady()` that returns a Promise resolving when
   the server stdout emits a line matching the ready signal confirmed
   in Task 001, or rejecting after 20s.
6. In `app.whenReady()`, call `spawnServer()` then `await waitForReady()`
   before creating the window. If `waitForReady()` rejects, show
   `dialog.showErrorBox` and call `app.exit(1)`.

Do NOT add `WebContentsView` yet.

### Files touched
- `main.js` — add server spawn logic

### Acceptance Criterion
`npm start` logs the server ready signal to the console within 20s and
then opens the frameless window with the ribbon. No dialog. No crash.
`Ctrl+C` kills both Electron and the server child process.

### On Failure
Report: `FAIL: Task 008 — [exact error, timeout or crash, server stdout]`
Revert `main.js` to Task 006 state. Escalate.

---

## Task 009: main.js — create workbenchView, loadURL, setBounds()
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** Task 008

### What to do
Add to `main.js` (only `main.js`):

1. Import `WebContentsView` from `'electron'`.
2. After `await waitForReady()` and after `win.loadFile('index.html')`,
   read `--ribbon-height` from `ribbon.css` to get `ribbonHeight`
   (parse the CSS file with a regex; store as a number).
3. Create `state.workbenchView = new WebContentsView()`.
4. Call `win.contentView.addChildView(state.workbenchView)`.
5. Implement `function setViewBounds(win)` per the DESIGN.md spec
   (section 4.2). Call it immediately after adding the child view.
6. Load `http://127.0.0.1:${SERVER_PORT}` into `state.workbenchView.webContents`.
7. Add `win.on('resize', debounce(() => setViewBounds(win), 16))`.
   Implement `debounce` inline (3 lines; no lodash dependency).

### Files touched
- `main.js` — add WebContentsView creation and bounds logic

### Acceptance Criterion
M2 gate: `npm start` → ribbon at top, VSCodium workbench below, flush,
no gap. File tree visible. Open a file in the editor. Open a terminal.
Run `julia -e 'println("hello")'` — output visible. Drag-resize window:
ribbon and workbench stay flush. Commit `M2: server integration complete`.

### On Failure
Report: `FAIL: Task 009 — [what is wrong: blank view / gap / crash / terminal error]`
Revert `main.js` to Task 008 state. Escalate.

---

## Task 010: main.js — clean shutdown
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** Task 009

### What to do
Add to `main.js` (only `main.js`):

1. `async function killServer()`:
   - If `state.serverProcess` is null or already exited, return.
   - Send `SIGTERM` to `state.serverProcess`.
   - Wait up to 2000ms for the process to exit.
   - If still running after 2000ms, send `SIGKILL`.
2. Replace the existing `app.on('window-all-closed')` handler with
   `app.on('before-quit', async (e) => { e.preventDefault(); await killServer(); app.exit(0); })`.
3. In the `window:close` IPC handler: call `app.quit()` (which triggers
   `before-quit`) instead of `win.destroy()` directly.

### Files touched
- `main.js` — add killServer and update quit handler

### Acceptance Criterion
Click ✕ → window closes → open Task Manager → no `node.exe` or
`openvscode-server` process remains after 3 seconds.

### On Failure
Report: `FAIL: Task 010 — [orphan process name and PID observed]`
Revert `main.js` to Task 009 state. Escalate.

---

## Task 011: main.js — server crash recovery dialog
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** Task 010

### What to do
Add to `main.js` (only `main.js`):

In `spawnServer()`, after storing the child process, add:
```js
state.serverProcess.on('exit', (code, signal) => {
  if (state.shuttingDown) return;  // expected exit during shutdown
  dialog.showErrorBox(
    'JuliaLab — Server Error',
    `openvscode-server exited unexpectedly (code ${code}, signal ${signal}).\nPlease restart JuliaLab.`
  );
  app.exit(1);
});
```
Add `state.shuttingDown = false` to the initial state object.
Set `state.shuttingDown = true` at the top of `killServer()`.

### Files touched
- `main.js` — add crash recovery handler

### Acceptance Criterion
Kill the openvscode-server process externally (Task Manager) while
JuliaLabApp is running. Within 2 seconds, JuliaLabApp shows an error
dialog. Clicking OK exits the app. No orphan processes.

### On Failure
Report: `FAIL: Task 011 — [no dialog shown / app did not exit / orphan process]`
Revert `main.js` to Task 010 state. Escalate.

---

## Task 012: Sprint 1 integration smoke test + SC verification
**Status:** [ ] Pending
**Milestone:** M4
**Depends on:** Task 011

### What to do
This is a verification-only task. No code changes. Run the full Sprint 1
acceptance checklist from TEST_PLAN.md:

1. Cold launch (`npm start` from a terminal with no prior instance running).
2. Verify SC-1: no VSCodium title bar, menu bar, or activity bar visible.
3. Verify SC-2: open a file via File > Open File (Ctrl+O); edit it;
   save (Ctrl+S).
4. Verify SC-3: type 10 Julia commands in the integrated terminal at
   normal speed; confirm no visible echo lag.
5. Verify SC-4: click ✕; open Task Manager; confirm no orphan processes.
6. Verify SC-5: drag the window to three different sizes; confirm ribbon
   and workbench stay flush.

Report results in the format:
```
SC-1: PASS/FAIL — <notes>
SC-2: PASS/FAIL — <notes>
SC-3: PASS/FAIL — <notes>
SC-4: PASS/FAIL — <notes>
SC-5: PASS/FAIL — <notes>
SPRINT 1: PASS / FAIL
```

If all five PASS: commit with message `sprint1-complete` and tag.
If any FAIL: do not commit. Report to planning thread.

### Files touched
- None (verification only)

### Acceptance Criterion
All five SC criteria PASS. `git log --oneline -1` shows
`sprint1-complete` after the commit.

### On Failure
Report: `FAIL: Task 012 — [which SC failed and exact observation]`
Do not commit. Escalate to planning thread.
