---
{
  "id": "file_t1qpb9mh",
  "filetype": "document",
  "filename": "DESIGN-sprint3",
  "created_at": "2026-06-26T18:55:27.597Z",
  "updated_at": "2026-06-26T18:55:32.547Z",
  "meta": {
    "location": "/",
    "tags": [],
    "categories": [],
    "description": "",
    "source": "markdown"
  }
}
---
# Design Document — Sprint 3

**Project:** JuliaLabApp — `julialab` VSCodium extension\
**Version:** 0.1\
**Date:** 2026-06-24\
**Author:** John Peach / eurAIka\
**Repo:** `C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp`\
**Depends on:** SDD-sprint3.md, ADR-008 through ADR-011

---

## 1. File Tree — End State After Sprint 3

```
JuliaLabApp/
├── main.js                          MODIFIED  (Tasks 002, 005)
├── preload.js                       MODIFIED  (Task 006)
├── renderer.js                      MODIFIED  (Task 007)
├── index.html                       MODIFIED  (Task 007)
├── package.json                     MODIFIED  (Task 009 — adds build:ext, start:fast, ws dep)
├── .gitignore                       MODIFIED  (Task 010)
│
├── extensions/
│   └── julialab/                    NEW DIR
│       ├── package.json             NEW  (Task 011)
│       ├── tsconfig.json            NEW  (Task 011)
│       ├── src/
│       │   └── extension.ts         NEW  (Task 012)
│       └── dist/
│           └── extension.js         BUILD ARTEFACT (gitignored)
│
├── scripts/
│   ├── detect-deps.js               UNCHANGED
│   ├── install-extensions.js        UNCHANGED
│   └── copy-extension.js            NEW  (Task 010)
│
└── server-data/
    ├── extensions/
    │   ├── julialab/                BUILD ARTEFACT (gitignored)
    │   ├── julialang.language-julia-1.219.2-universal/   UNCHANGED
    │   ├── anthropic.claude-code-*/                      UNCHANGED
    │   ├── leanprover.lean4-*/                           UNCHANGED
    │   ├── wolfbook.wolfbook-*/                          UNCHANGED
    │   └── tamasfe.even-better-toml-*/                   UNCHANGED
    └── Machine/
        └── settings.json            MODIFIED  (Task 003)
```

---

## 2. Spike Tasks (gates — must pass before build tasks)

### Spike A — `codium serve-web` folder flag (gates Task 002)

**Question:** What CLI argument causes `codium serve-web` to open a specific folder in the workbench? Candidates in order of likelihood:

1. `--default-folder <absolute-windows-path>` — documented for `code` CLI
2. Bare positional path argument after all flags
3. `--folder-uri vscode-remote://...` — unlikely in local serve-web context

**Spike procedure (Antigravity, manual shell):**

```powershell
# Kill any running codium processes first
# Then try candidate 1:
& "C:\Program Files\VSCodium\bin\codium.cmd" serve-web `
    --host 127.0.0.1 --port 3457 `
    --server-data-dir "C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp\server-data" `
    --without-connection-token `
    --default-folder "C:\Users\johnx\JuliaLab"
# Open http://127.0.0.1:3457 in browser
# PASS if: workbench opens with JuliaLab folder in Explorer sidebar
# FAIL: try next candidate
```

**Pass result:** Record the working flag syntax. Task 002 uses it.\
**Fail result (all candidates fail):** Use ADR-008 Option B fallback — extension opens folder via API. Document which option was used. Task 002 is replaced by extension-side folder-open logic in Task 012.

**Additional check during Spike A — julia-vscode activation:**\
After folder opens, verify julia-vscode activates: check Activity Bar for the Julia beaker icon. If it does not appear, note it — Task 012 must call `vscode.extensions.getExtension('julialang.language-julia').activate()`explicitly.

**Additional check during Spike A — window event bridge (determines ADR-010 path):**\
With JuliaLab running (after Task 002), open Electron DevTools on `workbenchView` (`main.js` temporary line: `state.workbenchView.webContents.openDevTools()`). In the DevTools console, run:

```js
window.dispatchEvent(new CustomEvent('julialab-command', { detail: { command: 'julialab.focusEditor' } }))
```

Then check whether the extension host received it. Because the extension host runs as a Web Worker in serve-web mode, its `window` is the worker global — separate from the main frame's `window`. `dispatchEvent` on the main frame will NOT reach the worker's `addEventListener`. This test confirms the risk.

**Spike A bridge decision table:**

| Test result | Path chosen | Task 005 / Task 012 variant |
|---|---|---|
| `window` event reaches extension host | Option A — `window` event | As designed in §3.5 / §3.8 primary |
| `window` event does NOT reach extension host | Option B — WebSocket | Use §3.2 WebSocket variant below |

**Additional check during Spike A —** `julia-explorer` **view container ID:**\
In the VSCodium DevTools console, run:

```js
// Lists all registered view containers
Object.keys(vscode.commands._commands).filter(k => k.startsWith('workbench.view'))
```

Confirm `workbench.view.extension.julia-explorer` appears. If the ID differs, record the correct one for Task 012.

---

### Spike B — julia-vscode plot pane in serve-web context (gates Task 008)

**Question:** Does julia-vscode's plot pane (`language-julia.show-plotpane`) render CairoMakie output in the serve-web browser context?

**Spike procedure (manual, with JuliaLab running after Task 002):**

```julia
# In the Julia REPL (started via language-julia.startREPL):
using CairoMakie
lines(1:10, rand(10))
```

**Pass:** A PNG figure appears in a WebviewPanel inside the VSCodium workbench.\
**Partial pass:** Figure appears but in a separate browser popup/tab — document and decide whether acceptable.\
**Fail:** No figure appears, or error in DevTools console — escalate to planning chat before proceeding. ADR-011 fallback (Compute42 display.jl port) would be revisited.

---

## 3. Detailed File Specifications

---

### 3.1 `server-data/Machine/settings.json` — Task 003

**Change:** Add julia-vscode layout and auto-start settings.

**Full file content after Task 003:**

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

**What each new key does:**

| Key | Purpose |
|---|---|
| `julia.symbolCacheDownload` | Allows julia-vscode to cache symbols — speeds up LSP on first use |
| `julia.enableTelemetry` | Disabled for privacy |
| `workbench.activityBar.location` | Ensures Activity Bar is on left (default), not hidden |
| `workbench.panel.defaultLocation` | Terminal/panel opens at bottom |
| `workbench.sideBar.location` | Sidebar (Explorer, Julia views) on left |
| `terminal.integrated.defaultProfile.windows` | Ensures PowerShell, not cmd |
| `terminal.integrated.fontSize` | Readable default |

**Not set here (set by extension on first open):**\
`workbench.view.extension.julia-explorer` visibility is controlled by the `julialab` extension's layout command sequence, not a static setting.

---

### 3.2 `main.js` — Task 002 (folder) + Task 005 (IPC handler)

#### Task 002 amendment — default workspace folder

**Add near top, after existing** `const` **declarations:**

```js
const os   = require('os');
const fs   = require('fs');

const DEFAULT_WORKSPACE = path.join(os.homedir(), 'JuliaLab');
```

**Add to** `spawnServer()`**, after the existing spawn arguments (exact flag determined by Spike A; placeholder shown):**

```js
// Ensure default workspace folder exists
fs.mkdirSync(DEFAULT_WORKSPACE, { recursive: true });
```

**Amend the** `spawn` **call args array** (one additional argument, appended after `'--without-connection-token'`):

```js
'--default-folder', DEFAULT_WORKSPACE,
// ^ replace with Spike A confirmed flag syntax if different
```

#### Task 005 amendment — ribbon IPC handler

**Spike A determines which variant is used. Both are specified here.**

---

**Option A (window event — use if Spike A bridge test passes):**

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

---

**Option B (WebSocket — use if Spike A bridge test fails):**

Add near top of `main.js`, after existing `const` declarations:

```js
const { WebSocket, WebSocketServer } = require('ws');  // npm install ws --save
const RIBBON_WS_PORT = 2999;
```

Add to `app.whenReady()` block, after `waitForReady(proc)` resolves and before `createWindow()`:

```js
// Connect ribbon WebSocket client to extension host server
function connectRibbonWebSocket() {
  state.ribbonWs = null;
  const tryConnect = () => {
    const ws = new WebSocket(`ws://127.0.0.1:${RIBBON_WS_PORT}`);
    ws.on('open',  ()  => { state.ribbonWs = ws; console.log('[ribbon-ws] connected'); });
    ws.on('close', ()  => { state.ribbonWs = null; setTimeout(tryConnect, 2000); });
    ws.on('error', ()  => { /* retry on close */ });
  };
  // Delay first attempt: extension needs time to activate and open its server
  setTimeout(tryConnect, 5000);
}
connectRibbonWebSocket();
```

Add `ribbonWs: null` to the `state` object at top of file.

Replace the `ipcMain.on('ribbon-command', ...)` handler with:

```js
ipcMain.on('ribbon-command', (_event, command) => {
  if (state.ribbonWs?.readyState === WebSocket.OPEN) {
    state.ribbonWs.send(JSON.stringify({ command }));
  } else {
    console.warn('[ribbon-command] WebSocket not ready, command dropped:', command);
  }
});
```

Add to `killServer()`, before `state.serverProcess = null`:

```js
state.ribbonWs?.close();
state.ribbonWs = null;
```

**Note:** Option B requires `ws` as a runtime dependency. Add to root `package.json` `dependencies` (not `devDependencies`):

```json
"dependencies": { "ws": "^8.18.0" }
```

---

**No other changes to** `main.js`**.**

---

### 3.3 `preload.js` — Task 006

**Add one entry to the** `contextBridge.exposeInMainWorld` **call:**

```js
// Existing:
contextBridge.exposeInMainWorld('electronAPI', {
  minimize:       () => ipcRenderer.send('window:minimize'),
  maximize:       () => ipcRenderer.send('window:maximize'),
  close:          () => ipcRenderer.send('window:close'),
  // New:
  ribbonCommand:  (command) => ipcRenderer.send('ribbon-command', command),
});
```

---

### 3.4 `index.html` — Task 007 (ribbon tab `data-command` attributes)

**Change:** Add `data-command` attributes to wired ribbon tabs. Unwired tabs (APPS, LIVE EDITOR, INSERT, VIEW) get `data-command="noop"`.

```html
<!-- existing span elements, amended: -->
<span class="ribbon-tab active" data-command="julialab.focusEditor">HOME</span>
<span class="ribbon-tab"        data-command="julialab.showPlots">PLOTS</span>
<span class="ribbon-tab"        data-command="noop">APPS</span>
<span class="ribbon-tab"        data-command="noop">LIVE EDITOR</span>
<span class="ribbon-tab"        data-command="noop">INSERT</span>
<span class="ribbon-tab"        data-command="noop">VIEW</span>
```

**No other changes to** `index.html`**.**

---

### 3.5 `renderer.js` — Task 007 (ribbon tab click handlers)

**Replace entire file content:**

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
    // Update active state
    document.querySelectorAll('.ribbon-tab')
      .forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Dispatch command
    const command = tab.dataset.command;
    if (command && command !== 'noop') {
      window.electronAPI.ribbonCommand(command);
    }
  });
});
```

---

### 3.6 `extensions/julialab/package.json` — Task 011

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

**Notes:**

- `activationEvents: ["onStartupFinished"]` fires after all other extensions have activated. This ensures julia-vscode is ready before `julialab` calls `language-julia.startREPL`.
- `main: "./dist/extension.js"` — TypeScript compiles to `dist/`.
- Commands registered here are the targets for ribbon IPC strings (ADR-010).

---

### 3.7 `extensions/julialab/tsconfig.json` — Task 011

```json
{
  "compilerOptions": {
    "module":           "commonjs",
    "target":           "ES2020",
    "outDir":           "./dist",
    "rootDir":          "./src",
    "strict":           true,
    "esModuleInterop":  true,
    "skipLibCheck":     true
  },
  "exclude": ["node_modules", "dist"]
}
```

---

### 3.8 `extensions/julialab/src/extension.ts` — Task 012

This is the only non-trivial new file. Full content:

```typescript
// extension.ts — julialab VSCodium extension
// Sprint 3: auto-start REPL, layout preset, ribbon command bridge

import * as vscode from 'vscode';

// ── Constants ────────────────────────────────────────────────────────────────

const JULIA_EXT_ID    = 'julialang.language-julia';
const LAYOUT_DONE_KEY = 'julialab.layoutApplied';

// Commands the ribbon can invoke (ADR-010)
const RIBBON_COMMANDS: Record<string, string> = {
  'julialab.focusEditor': 'workbench.action.focusFirstEditorGroup',
  'julialab.showPlots':   'language-julia.show-plotpane',
};

// ── Activation ───────────────────────────────────────────────────────────────

export async function activate(context: vscode.ExtensionContext): Promise<void> {

  // 1. Register ribbon-bridge commands
  registerRibbonCommands(context);

  // 2. Register command bridge (Electron ribbon → extension host)
  //    Spike A determines which path is used:
  //    - Option A (window event): registerWindowEventBridge(context)
  //    - Option B (WebSocket):    registerWebSocketBridge(context)
  //    Comment out the unused path before Task 012 commit.
  registerWindowEventBridge(context);   // Option A — replace if Spike A fails
  // registerWebSocketBridge(context);  // Option B — uncomment if Spike A fails

  // 3. Ensure julia-vscode is active
  await ensureJuliaExtension();

  // 4. Apply MATLAB layout preset (one-shot, first open only)
  await applyLayoutIfFirstOpen(context);

  // 5. Auto-start Julia REPL
  await startJuliaRepl();
}

export function deactivate(): void {}

// ── Ribbon command registration ───────────────────────────────────────────────

function registerRibbonCommands(context: vscode.ExtensionContext): void {
  for (const [commandId, vsCodeCommand] of Object.entries(RIBBON_COMMANDS)) {
    const disposable = vscode.commands.registerCommand(commandId, async () => {
      try {
        await vscode.commands.executeCommand(vsCodeCommand);
      } catch (err) {
        console.error(`[julialab] command ${commandId} failed:`, err);
      }
    });
    context.subscriptions.push(disposable);
  }
}

// ── Command bridge (Electron → extension host) ────────────────────────────────
// Two implementations; Spike A determines which is used.
// Only one of registerWindowEventBridge / registerWebSocketBridge
// is called from activate() — see comment there.

// Option A: window CustomEvent (simpler; only works if extension host
// shares main-frame window scope — confirmed by Spike A bridge test)
function registerWindowEventBridge(context: vscode.ExtensionContext): void {
  const handler = (event: Event) => {
    const e = event as CustomEvent<{ command: string }>;
    const command = e.detail?.command;
    if (command && command in RIBBON_COMMANDS) {
      vscode.commands.executeCommand(command).then(undefined, err => {
        console.error(`[julialab] window bridge command failed:`, err);
      });
    }
  };
  window.addEventListener('julialab-command', handler);
  context.subscriptions.push({
    dispose: () => window.removeEventListener('julialab-command', handler),
  });
}

// Option B: WebSocket server (fallback; use when window events do not
// cross the Web Worker boundary in serve-web mode)
function registerWebSocketBridge(context: vscode.ExtensionContext): void {
  // Dynamic require: 'ws' is available in the extension host Node context.
  // In serve-web mode the extension host is a worker with Node-like globals
  // provided by VSCodium's server runtime — require() is available.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { WebSocketServer } = require('ws') as typeof import('ws');
  const RIBBON_WS_PORT = 2999;

  const wss = new WebSocketServer({ host: '127.0.0.1', port: RIBBON_WS_PORT });

  wss.on('connection', ws => {
    console.log('[julialab] ribbon WebSocket client connected');
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as { command?: string };
        const command = msg.command;
        if (command && command in RIBBON_COMMANDS) {
          vscode.commands.executeCommand(command).then(undefined, err => {
            console.error(`[julialab] ws bridge command failed:`, err);
          });
        }
      } catch (err) {
        console.error('[julialab] ws bridge parse error:', err);
      }
    });
  });

  wss.on('error', (err: Error) => {
    console.error('[julialab] WebSocket server error:', err.message);
    vscode.window.showWarningMessage(
      `JuliaLab: ribbon bridge failed to start on port ${RIBBON_WS_PORT}. ` +
      'Ribbon tabs will not be functional.'
    );
  });

  context.subscriptions.push({
    dispose: () => wss.close(),
  });
}

// ── julia-vscode activation guard ────────────────────────────────────────────

async function ensureJuliaExtension(): Promise<void> {
  const juliaExt = vscode.extensions.getExtension(JULIA_EXT_ID);
  if (!juliaExt) {
    vscode.window.showWarningMessage(
      'JuliaLab: julia-vscode extension not found. ' +
      'Workspace panel and plot pane will not be available.'
    );
    return;
  }
  if (!juliaExt.isActive) {
    try {
      await juliaExt.activate();
    } catch (err) {
      console.error('[julialab] failed to activate julia-vscode:', err);
    }
  }
}

// ── MATLAB layout preset (one-shot) ──────────────────────────────────────────

async function applyLayoutIfFirstOpen(
  context: vscode.ExtensionContext
): Promise<void> {
  const alreadyApplied = context.workspaceState.get<boolean>(LAYOUT_DONE_KEY);
  if (alreadyApplied) return;

  try {
    // Open the Julia activity bar view container (shows Workspace, Plot Navigator, Docs)
    await vscode.commands.executeCommand(
      'workbench.view.extension.julia-explorer'
    );
    // Ensure the terminal panel is open at the bottom
    await vscode.commands.executeCommand(
      'workbench.action.terminal.toggleTerminal'
    );
    // Focus the editor group so the editor is centre-front
    await vscode.commands.executeCommand(
      'workbench.action.focusFirstEditorGroup'
    );

    await context.workspaceState.update(LAYOUT_DONE_KEY, true);
  } catch (err) {
    // Layout commands can fail if the workbench is not fully initialised.
    // Non-fatal — user can arrange panels manually.
    console.error('[julialab] layout preset failed (non-fatal):', err);
  }
}

// ── Auto-start Julia REPL ─────────────────────────────────────────────────────

async function startJuliaRepl(): Promise<void> {
  try {
    await vscode.commands.executeCommand('language-julia.startREPL');
  } catch (err) {
    // Non-fatal — user can start REPL manually via Ctrl+Shift+P.
    console.error('[julialab] failed to start Julia REPL (non-fatal):', err);
    vscode.window.showWarningMessage(
      'JuliaLab: Julia REPL did not start automatically. ' +
      'Use the Julia menu or Ctrl+Shift+P → "Julia: Start REPL".'
    );
  }
}
```

---

### 3.9 `scripts/copy-extension.js` — Task 010

```js
// copy-extension.js — build step: copies julialab extension to server-data
// Sprint 3 — Task 010

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
      // Skip node_modules and TypeScript source in the served copy
      if (entry.name === 'node_modules' || entry.name === 'src') continue;
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

console.log('[copy-extension] copying julialab extension to server-data...');
copyDir(SRC, DEST);
console.log('[copy-extension] done.');
```

**What is copied:** `dist/`, `package.json`, `tsconfig.json`.\
**What is excluded:** `src/`, `node_modules/` — not needed at runtime.

---

### 3.10 `package.json` (root) — Task 009

**Full file content after Task 009:**

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

`start` **vs** `start:fast`**:**

| Script | When to use |
| :--- | :--- |
| `npm start` | First run of the day, or after any change to `extensions/julialab/src/` |
| `npm run start:fast` | Iteration on `main.js`, `renderer.js`, or other non-extension files — skips the \~5–10s TypeScript compile |

`ws` **dependency:** Added to `dependencies` (not `devDependencies`) because it is required at runtime if Spike A selects Option B (WebSocket bridge). If Spike A selects Option A (window events), `ws` is unused but harmless. Remove it in a cleanup task after Spike A if Option A is confirmed.

---

### 3.11 `.gitignore` amendment — Task 010

**Lines to append:**

```
# Sprint 3 — julialab extension build artefacts
extensions/julialab/dist/
extensions/julialab/node_modules/
server-data/extensions/julialab/
```

---

## 4. Task Sequence and Dependencies

```
Spike A  ──►  Task 002 (main.js: folder flag)
                  │
                  ▼
             Task 003 (settings.json)
                  │
                  ▼
             Task 009 (root package.json)
             Task 010 (.gitignore + copy-extension.js)
             Task 011 (ext package.json + tsconfig)
                  │
                  ▼
             Task 012 (extension.ts — main source file)
                  │
                  ▼
             Task 005 (main.js: ribbon IPC handler)
             Task 006 (preload.js: ribbonCommand)
             Task 007 (index.html + renderer.js: tab dispatch)
                  │
                  ▼
Spike B  ──►  SC-3 plot pane validation
                  │
                  ▼
             SC-1, SC-2, SC-4 acceptance testing
```

**Hard gates:**

- Task 002 may not begin until Spike A has a confirmed flag syntax.
- Task 007 / Task 005 / Task 006 (ribbon wiring) may not begin until Task 012 is committed and the extension loads in the workbench.
- SC-3 may not be declared pass/fail until Spike B has been run.

---

## 5. Acceptance Test Summary

Full test procedures are in the Test Plan document. Summary criteria:

| SC | Manual verification |
|---|---|
| SC-1 | Launch JuliaLab → `%USERPROFILE%\JuliaLab` appears in Explorer sidebar → Julia REPL appears in terminal within 5s |
| SC-2 | Type `x = rand(3,3)` in REPL → `x` visible in Julia Workspace panel within 3s |
| SC-3 (post-spike) | Click PLOTS ribbon tab → plot pane comes to focus → `using CairoMakie; lines(1:10,rand(10))` renders PNG in pane |
| SC-4 | Click HOME ribbon tab → active editor group receives focus |

---

## 6. Files Not Touched in Sprint 3

| File | Reason |
|---|---|
| `scripts/detect-deps.js` | `julia.executablePath` already set correctly in settings.json |
| `scripts/install-extensions.js` | No new extensions in Sprint 3 |
| `server-data/extensions/julialang.*` | Unchanged pre-installed extension |
| `ribbon.css` | No visual changes to ribbon in Sprint 3 |
| `server-data/Machine/settings.json` (beyond Task 003) | Single atomic change only |
