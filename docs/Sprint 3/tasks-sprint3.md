# tasks.md — JuliaLabApp Sprint 3
**Last updated:** 2026-06-24

---

## Task 001: Spike A — serve-web folder flag, activation, bridge, view ID
**Status:** [ ] Pending
**Milestone:** M0
**Depends on:** sprint2-complete tag (ae7bb5a)

### What to do (manual — not Antigravity)

**Pre-flight:**
```powershell
taskkill /F /IM node.exe 2>$null
taskkill /F /IM codium.exe 2>$null
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\JuliaLab"
```

**Step 1 — folder flag (SPIKE-A1):**
```powershell
& "C:\Program Files\VSCodium\bin\codium.cmd" serve-web `
    --host 127.0.0.1 --port 3457 `
    --server-data-dir "C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp\server-data" `
    --without-connection-token `
    --default-folder "$env:USERPROFILE\JuliaLab"
```
Open `http://127.0.0.1:3457` in browser. Wait 10 seconds.
If Explorer sidebar does NOT show `JULIALAB` folder, kill process and try
candidate 2 (bare path — append `"$env:USERPROFILE\JuliaLab"` as last arg
without `--default-folder`).
Record: which candidate worked, or FAIL-ALL.

**Step 2 — julia-vscode activation (SPIKE-A2):**
With browser still open from Step 1:
- Check Activity Bar for Julia beaker (flask) icon.
- If absent: File → New File, save as `test.jl`. Check again.
Record: PASS / PARTIAL (activates on file open only) / FAIL.

**Step 3 — window event bridge (SPIKE-A3):**
Open a second terminal. Add a temporary `openDevTools` line to `main.js`
after `createWindow()`:
```js
setTimeout(() => state.workbenchView.webContents.openDevTools({ mode: 'detach' }), 3000);
```
Run `npm run start:fast`. In the workbench DevTools console, paste:
```js
window.dispatchEvent(new CustomEvent('julialab-command', { detail: { command: 'test' } }));
```
Then check the extension host output channel for any log of receipt.
(Because the extension is not yet built, this tests whether the main frame's
`window.dispatchEvent` is even visible in the extension host context.)
Record: PASS (event reaches extension host) / FAIL (does not reach).
**Remove the temporary `openDevTools` line from `main.js` before proceeding.**

**Step 4 — julia-explorer view container ID (SPIKE-A4):**
With workbench DevTools open from Step 3, in the console:
```js
Object.keys(globalThis._commands?._commands ?? {}).filter(k => k.startsWith('workbench.view'))
```
If that returns nothing, open Command Palette (Ctrl+Shift+P), type `julia`,
and scan for sidebar-opening commands. Record the exact command ID that opens
the Julia Explorer sidebar.
Record: confirmed ID string.

### Acceptance Criterion
```
SPIKE-A1: PASS — folder flag syntax: <exact flag used>
         OR: FAIL-ALL — ADR-008 Option B fallback required
SPIKE-A2: PASS / PARTIAL / FAIL
SPIKE-A3: PASS (Option A) / FAIL (Option B WebSocket)
SPIKE-A4: julia-explorer command ID: <exact string>
```
Report full result to planning thread before Task 002.

### On Failure
```
FAIL: Task 001 — [SPIKE-Ax] — [exact observation]
```
SPIKE-A1 FAIL-ALL blocks Task 002 — escalate immediately.
SPIKE-A3 FAIL does not block Task 002 — Option B path is already designed.

---

## Task 002: main.js — default workspace folder
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** Task 001 (SPIKE-A1 result determines flag syntax)

### Files touched
- `main.js`

### What to add
At top of file, after existing `const` declarations, add:
```js
const os = require('os');
const fs = require('fs');

const DEFAULT_WORKSPACE = path.join(os.homedir(), 'JuliaLab');
```

In `spawnServer()`, immediately before the `spawn()` call, add:
```js
fs.mkdirSync(DEFAULT_WORKSPACE, { recursive: true });
```

In the `spawn()` args array, append after `'--without-connection-token'`:
```js
'<SPIKE-A1 confirmed flag>', DEFAULT_WORKSPACE,
```
Replace `<SPIKE-A1 confirmed flag>` with the exact flag recorded in Task 001.
If SPIKE-A1 was FAIL-ALL, do not do this task — see On Failure.

### Acceptance Criterion
`npm run start:fast` → browser workbench opens with `JULIALAB` folder
visible in Explorer sidebar.
`%USERPROFILE%\JuliaLab` directory exists on disk.
Window controls (minimise/maximise/close) still work.
Server starts without error.
```
git commit -m "Task 002: default workspace folder via serve-web flag"
```

### On Failure
```
FAIL: Task 002 — [exact error or what is not visible]
```
If folder does not open: revert, escalate. Do not attempt further flag
candidates inline — return to planning thread.

---

## Task 003: server-data/Machine/settings.json — julia-vscode defaults
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** Task 002 PASS

### Files touched
- `server-data/Machine/settings.json`

### What to write
Replace file content with exactly:
```json
{
  "workbench.statusBar.visible": true,
  "julia.executablePath": "C:\\Users\\johnx\\.julia\\juliaup\\julia-1.12.1+0.x64.w64.mingw32\\bin\\julia.exe",
  "wolfbook.wolframKernelPath": "C:\\Program Files\\Wolfram Research\\Wolfram Engine\\14.1\\WolframKernel.exe",
  "lean4.toolchainPath": "C:\\Users\\johnx\\.elan\\toolchains\\leanprover--lean4---stable",

  "julia.symbolCacheDownload": true,
  "julia.enableTelemetry": false,

  "workbench.activityBar.location": "default",
  "workbench.panel.defaultLocation": "bottom",
  "workbench.sideBar.location": "left",

  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.fontSize": 13
}
```

### Acceptance Criterion
`npm run start:fast` → cold launch shows:
- Activity Bar present on left.
- No new warnings or errors in DevTools console.
- Terminal profile is PowerShell (open a new terminal: title should say
  `powershell` not `cmd`).
- `julia.executablePath` still present (detect-deps Sprint 2 value preserved).
```
git commit -m "Task 003: settings.json — julia-vscode defaults + layout keys"
```

### On Failure
```
FAIL: Task 003 — [exact observation]
```
Revert to prior settings.json. Escalate.

---

## Task 004: Spike B — julia-vscode plot pane in serve-web context
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** Task 002 PASS (REPL must be startable; Julia REPL may need
to be started manually for this spike since Task 012 is not yet done)

### What to do (manual — not Antigravity)

**Step 1:** With JuliaLab running after Task 002, open Command Palette
(Ctrl+Shift+P) and run `Julia: Start REPL`. Wait for Julia prompt.

**Step 2:** In the Julia REPL:
```julia
using CairoMakie
fig = lines(1:10, rand(10))
display(fig)
```

**Step 3:** Observe:
- Does a plot pane WebviewPanel appear inside the VSCodium workbench?
- Or does a separate browser popup/tab open?
- Or nothing?

**Step 4:** Run `vscode.commands.executeCommand('language-julia.show-plotpane')`
in workbench DevTools console to confirm command exists.

### Acceptance Criterion
```
SPIKE-B1: PASS — plot renders in WebviewPanel inside workbench
     OR:  PARTIAL — plot renders in external popup/tab (document; advisory)
     OR:  FAIL — no plot renders (escalate before Task 008)
language-julia.show-plotpane command: EXISTS / NOT FOUND
```
Report result to planning thread.
FAIL blocks SC-3 / ribbon PLOTS wiring (Tasks 008 and the relevant part
of Task 007 may proceed structurally but SC-3 cannot be declared PASS).

### On Failure
```
FAIL: Task 004 — [SPIKE-B1] — [exact observation and any console errors]
```

---

## Task 005: main.js — ribbon IPC handler
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** Task 003 PASS; Task 001 SPIKE-A3 result determines Option A or B

### Files touched
- `main.js`

### What to add — choose ONE option per SPIKE-A3 result

**Option A (use if SPIKE-A3 PASS — window event bridge works):**

Add after existing `ipcMain.on('window:close', ...)` handler:
```js
ipcMain.on('ribbon-command', (_event, command) => {
  if (!state.workbenchView) return;
  const script = `
    window.dispatchEvent(new CustomEvent('julialab-command', {
      detail: { command: ${JSON.stringify(command)} }
    }));
  `;
  state.workbenchView.webContents.executeJavaScript(script).catch(err => {
    console.error('[ribbon-command] executeJavaScript failed:', err.message);
  });
});
```

**Option B (use if SPIKE-A3 FAIL — WebSocket bridge required):**

Add to `state` object at top of file:
```js
ribbonWs: null,
```

Add `const { WebSocket, WebSocketServer } = require('ws');` after existing
`const` declarations.

Add after existing `ipcMain.on('window:close', ...)` handler:
```js
ipcMain.on('ribbon-command', (_event, command) => {
  if (state.ribbonWs?.readyState === WebSocket.OPEN) {
    state.ribbonWs.send(JSON.stringify({ command }));
  } else {
    console.warn('[ribbon-command] WebSocket not ready, command dropped:', command);
  }
});
```

Add to `app.whenReady()` block, after `waitForReady(proc)` and before
`createWindow()`:
```js
function connectRibbonWebSocket() {
  const tryConnect = () => {
    const ws = new WebSocket('ws://127.0.0.1:2999');
    ws.on('open',  ()  => { state.ribbonWs = ws; console.log('[ribbon-ws] connected'); });
    ws.on('close', ()  => { state.ribbonWs = null; setTimeout(tryConnect, 2000); });
    ws.on('error', ()  => { /* retry handled by close */ });
  };
  setTimeout(tryConnect, 5000);
}
connectRibbonWebSocket();
```

Add to `killServer()`, before `state.serverProcess = null`:
```js
state.ribbonWs?.close();
state.ribbonWs = null;
```

### Verification (before commit)
Add a temporary `console.log` inside the `ipcMain.on('ribbon-command', ...)` handler:
```js
console.log('[ribbon-command] received:', command);
```
This will be tested in Task 007. Remove before Task 005 commit.
**Do not remove — leave for Task 007 to verify, then remove in Task 007 commit.**

### Acceptance Criterion
File saves and `npm run start:fast` launches without error.
No syntax errors in Electron main process output.
(Functional test deferred to Task 007.)
```
git commit -m "Task 005: ribbon IPC handler — Option A/B [state which]"
```

### On Failure
```
FAIL: Task 005 — [exact error]
```
Revert. Escalate.

---

## Task 006: preload.js — expose ribbonCommand to renderer
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** Task 005 PASS

### Files touched
- `preload.js`

### What to change
Add one entry to the `contextBridge.exposeInMainWorld` call:
```js
contextBridge.exposeInMainWorld('electronAPI', {
  minimize:      () => ipcRenderer.send('window:minimize'),
  maximize:      () => ipcRenderer.send('window:maximize'),
  close:         () => ipcRenderer.send('window:close'),
  ribbonCommand: (command) => ipcRenderer.send('ribbon-command', command),
});
```

### Acceptance Criterion
`npm run start:fast` → in ribbon DevTools console (right-click ribbon →
Inspect), run:
```js
window.electronAPI.ribbonCommand('test')
```
Electron main process output shows:
```
[ribbon-command] received: test
```
No errors.
```
git commit -m "Task 006: preload.js — expose ribbonCommand via contextBridge"
```

### On Failure
```
FAIL: Task 006 — [exact error or missing log output]
```
Revert. Escalate.

---

## Task 007: index.html + renderer.js — ribbon tab click dispatch
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** Task 006 PASS

### Files touched
- `index.html`
- `renderer.js`

### What to change in index.html
Add `data-command` attributes to all ribbon tab spans:
```html
<span class="ribbon-tab active" data-command="julialab.focusEditor">HOME</span>
<span class="ribbon-tab"        data-command="julialab.showPlots">PLOTS</span>
<span class="ribbon-tab"        data-command="noop">APPS</span>
<span class="ribbon-tab"        data-command="noop">LIVE EDITOR</span>
<span class="ribbon-tab"        data-command="noop">INSERT</span>
<span class="ribbon-tab"        data-command="noop">VIEW</span>
```

### What to change in renderer.js
Replace entire file content with:
```js
// renderer.js — JuliaLabApp
// Sprint 1 — Task 006: window control button wiring
// Sprint 3 — Task 007: ribbon tab command dispatch

'use strict';

// Window controls
document.getElementById('btn-minimize')
  .addEventListener('click', () => window.electronAPI.minimize());
document.getElementById('btn-maximize')
  .addEventListener('click', () => window.electronAPI.maximize());
document.getElementById('btn-close')
  .addEventListener('click', () => window.electronAPI.close());

// Ribbon tab clicks
document.querySelectorAll('.ribbon-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ribbon-tab')
      .forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const command = tab.dataset.command;
    if (command && command !== 'noop') {
      window.electronAPI.ribbonCommand(command);
    }
  });
});
```

### Acceptance Criterion
`npm run start:fast`:
- Clicking HOME tab → Electron main process logs `[ribbon-command] received: julialab.focusEditor`.
- Clicking PLOTS tab → logs `[ribbon-command] received: julialab.showPlots`.
- Clicking APPS tab → no log (noop).
- Active CSS class moves correctly between tabs on each click.
- Window controls still work.

Remove the temporary `console.log` from Task 005 ribbon IPC handler now:
delete the line `console.log('[ribbon-command] received:', command);` from `main.js`.
Include this deletion in the Task 007 commit.

```
git commit -m "Task 007: ribbon tab click dispatch + remove debug log"
```

### On Failure
```
FAIL: Task 007 — [which tab / exact observation]
```
Revert both files (index.html and renderer.js) and the main.js log removal
together: `git checkout HEAD -- index.html renderer.js main.js`. Escalate.

---

## Task 008: root package.json — build scripts + ws dependency
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** Task 007 PASS

### Files touched
- `package.json`

### What to write
Replace entire file content with:
```json
{
  "name": "julialab-app",
  "version": "0.1.0",
  "description": "MATLAB-familiar Julia IDE — VSCodium in a single Electron window",
  "main": "main.js",
  "scripts": {
    "build:ext": "cd extensions/julialab && npm install && npm run compile && cd ../.. && node scripts/copy-extension.js",
    "start":     "npm run build:ext && electron .",
    "start:fast": "electron ."
  },
  "dependencies": {
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "electron": "39.8.8"
  }
}
```
Note: if SPIKE-A3 confirmed Option A (window event bridge), `ws` is unused
but harmless. Remove it in a cleanup commit after sprint3-complete if desired.

### Acceptance Criterion
`npm install` completes (installs `ws` into `node_modules`).
`npm run start:fast` still launches correctly.
`npm run build:ext` fails with a clear error (extension source does not exist
yet — expected and acceptable at this stage).
```
git commit -m "Task 008: package.json — build:ext, start:fast, ws dependency"
```

### On Failure
```
FAIL: Task 008 — [exact error]
```
Revert. Escalate.

---

## Task 009: .gitignore + scripts/copy-extension.js
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** Task 008 PASS

### Files touched
- `.gitignore`
- `scripts/copy-extension.js` — new file

### What to add to .gitignore
Append these lines:
```
# Sprint 3 — julialab extension build artefacts
extensions/julialab/dist/
extensions/julialab/node_modules/
server-data/extensions/julialab/
```

### What to write in scripts/copy-extension.js
```js
// copy-extension.js — copies julialab extension build to server-data
'use strict';

const fs   = require('fs');
const path = require('path');

const SRC  = path.join(__dirname, '..', 'extensions', 'julialab');
const DEST = path.join(__dirname, '..', 'server-data', 'extensions', 'julialab');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'src') continue;
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

console.log('[copy-extension] copying julialab → server-data/extensions/julialab');
copyDir(SRC, DEST);
console.log('[copy-extension] done.');
```

### Acceptance Criterion
`node scripts/copy-extension.js` exits with error: `no such file or directory`
on `extensions/julialab` — expected and acceptable (source not yet created).
`git status` shows `.gitignore` modified and `scripts/copy-extension.js` new.
`git ls-files server-data/extensions/julialab/` returns no output (gitignored).
```
git commit -m "Task 009: .gitignore + copy-extension.js build script"
```

### On Failure
```
FAIL: Task 009 — [exact error]
```
Revert both files. Escalate.

---

## Task 010: extensions/julialab/package.json + tsconfig.json
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** Task 009 PASS

### Files touched
- `extensions/julialab/package.json` — new file
- `extensions/julialab/tsconfig.json` — new file

### What to write in extensions/julialab/package.json
```json
{
  "name": "julialab",
  "displayName": "JuliaLab",
  "description": "JuliaLab IDE integration — auto-start, layout, ribbon bridge",
  "version": "0.1.0",
  "engines": { "vscode": "^1.90.0" },
  "categories": ["Other"],
  "activationEvents": ["onStartupFinished"],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "julialab.focusEditor",
        "title": "JuliaLab: Focus Editor"
      },
      {
        "command": "julialab.showPlots",
        "title": "JuliaLab: Show Plot Pane"
      }
    ]
  },
  "scripts": {
    "compile": "tsc -p ./",
    "watch":   "tsc -watch -p ./"
  },
  "devDependencies": {
    "@types/vscode": "^1.90.0",
    "typescript":    "^5.4.0"
  }
}
```

### What to write in extensions/julialab/tsconfig.json
```json
{
  "compilerOptions": {
    "module":          "commonjs",
    "target":          "ES2020",
    "outDir":          "./dist",
    "rootDir":         "./src",
    "strict":          true,
    "esModuleInterop": true,
    "skipLibCheck":    true
  },
  "exclude": ["node_modules", "dist"]
}
```

### Acceptance Criterion
```powershell
cd extensions/julialab
npm install
```
Completes without error. `node_modules/@types/vscode` and
`node_modules/typescript` directories exist.
```powershell
npm run compile
```
Fails with `error TS6053: File 'src/extension.ts' not found` — expected
and acceptable. No other errors.
```
git commit -m "Task 010: julialab extension scaffold — package.json + tsconfig"
```

### On Failure
```
FAIL: Task 010 — [exact error beyond missing extension.ts]
```
Revert both files. Escalate.

---

## Task 011: extensions/julialab/src/extension.ts
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** Task 010 PASS; SPIKE-A2, SPIKE-A3, SPIKE-A4 results applied here

### Files touched
- `extensions/julialab/src/extension.ts` — new file

### What to write
Write the file exactly as specified in DESIGN-sprint3.md §3.8, with
these substitutions from Spike A results:

1. **SPIKE-A3 result → bridge path:**
   - If SPIKE-A3 PASS: leave `registerWindowEventBridge(context)` active,
     comment out `registerWebSocketBridge(context)`.
   - If SPIKE-A3 FAIL: comment out `registerWindowEventBridge(context)`,
     uncomment `registerWebSocketBridge(context)`.
   Delete the inactive function body entirely before committing — do not
   leave dead code.

2. **SPIKE-A2 result → julia-vscode activation:**
   - If SPIKE-A2 PASS: `ensureJuliaExtension()` as written (checks
     `isActive`, calls `activate()` only if needed).
   - If SPIKE-A2 PARTIAL: add a 1000ms delay before calling
     `language-julia.startREPL`:
     ```typescript
     await new Promise(resolve => setTimeout(resolve, 1000));
     ```
     after `await ensureJuliaExtension();` and before `await applyLayoutIfFirstOpen(context)`.

3. **SPIKE-A4 result → julia-explorer command ID:**
   Replace `'workbench.view.extension.julia-explorer'` in
   `applyLayoutIfFirstOpen()` with the exact string recorded in Task 001
   SPIKE-A4 if different.

### Acceptance Criterion
```powershell
cd extensions/julialab
npm run compile
```
Exits 0. `dist/extension.js` exists.

```powershell
cd ../..
npm run build:ext
```
Exits 0. `server-data/extensions/julialab/dist/extension.js` exists.
`server-data/extensions/julialab/package.json` exists.

`npm start` → JuliaLab launches. In workbench Extensions panel
(Ctrl+Shift+X), `julialab` appears as installed.
Julia REPL starts automatically within 5 seconds.
Julia beaker icon visible in Activity Bar.
No errors in workbench DevTools console attributed to `julialab`.
```
git commit -m "Task 011: extension.ts — activate, REPL auto-start, layout, bridge [Option A/B]"
```

### On Failure
```
FAIL: Task 011 — [exact error: compile error / extension not loading / REPL not starting]
```
Revert `extensions/julialab/src/extension.ts` only.
Do not revert Task 010 scaffold. Escalate.

---

## Task 012: Full SC verification + sprint3-complete tag
**Status:** [ ] Pending
**Milestone:** M4
**Depends on:** Task 011 PASS; Task 004 SPIKE-B1 result governs SC-3 status

### Pre-flight
```powershell
taskkill /F /IM node.exe 2>$null
taskkill /F /IM codium.exe 2>$null
```

### What to do
Run full acceptance test per TEST_PLAN-sprint3.md Sections 3, 4, and 5.

**SC-1:**
Cold launch `npm start`. Start timer when Electron window appears.
- Explorer shows `JULIALAB` folder?
- Julia REPL starts within 5s?

**SC-2:**
Julia beaker icon in Activity Bar → click → Julia Workspace panel visible.
Type `x = rand(3, 3)` in REPL. Variable `x` appears in panel within 3s?

**SC-3:**
(Contingent on SPIKE-B1 PASS or PARTIAL.)
```julia
using CairoMakie
lines(1:10, rand(10))
```
Plot renders in workbench. Navigate away. Click PLOTS ribbon tab.
Plot pane comes to focus within 2s?

**SC-4:**
Click any sidebar view. Click HOME ribbon tab.
Editor group receives focus?

**Regression tests R-1 through R-7** per TEST_PLAN-sprint3.md Section 5.

### Report format
```
SC-1: PASS/FAIL — <notes>
SC-2: PASS/FAIL — <notes>
SC-3: PASS/FAIL/ADVISORY — <notes>
SC-4: PASS/FAIL — <notes>
R-1:  PASS/FAIL
R-2:  PASS/FAIL
R-3:  PASS/FAIL
R-4:  PASS/FAIL
R-5:  PASS/FAIL
R-6:  PASS/FAIL
R-7:  PASS/FAIL
SPRINT 3: PASS / FAIL
```

### If PASS (SC-3 advisory acceptable)
```powershell
git add -A
git commit -m "Sprint 3: julialab extension — REPL auto-start, layout, ribbon wiring"
git tag sprint3-complete
git push origin sprint3-complete
```

### On Failure
```
FAIL: Task 012 — [which SC/R failed] — [exact observation]
```
Do not tag. Escalate to planning thread with full report.
