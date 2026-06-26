# Software Design Document
**Project:** JuliaLabApp — Sprint 1
**Version:** 0.1
**Date:** 2026-06-22

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   OS Window (BaseWindow)                     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Ribbon WebContentsView  (H = ribbon-height)  │   │
│  │   [HOME] [PLOTS] [APPS] [LIVE EDITOR] [INSERT] [VIEW]│   │
│  │                                    [─] [□] [✕]       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      Workbench WebContentsView  (H = win - ribbon)   │   │
│  │                                                      │   │
│  │   http://127.0.0.1:PORT  (openvscode-server)         │   │
│  │                                                      │   │
│  │  [file tree] │ [editor area]                         │   │
│  │              │                                       │   │
│  │              ├───────────────────────────────────    │   │
│  │              │ [integrated terminal — xterm.js]      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

         Electron Main Process
         ┌────────────────────────────────┐
         │  main.js                       │
         │  - spawn openvscode-server     │
         │  - wait for ready signal       │
         │  - create BaseWindow           │
         │  - create ribbonView (static)  │
         │  - create workbenchView (URL)  │
         │  - handle resize → setBounds() │
         │  - handle close → kill server  │
         └────────────────────────────────┘
                    │ child_process
                    ▼
         ┌────────────────────────────────┐
         │  openvscode-server (Node.js)   │
         │  binds 127.0.0.1:PORT          │
         │  serves workbench HTTP + WS    │
         │  runs extension host           │
         │  manages PTY via node-pty      │
         └────────────────────────────────┘
```

---

## 2. Module / Component Breakdown

| Component | File | Responsibility |
|---|---|---|
| Main process | `main.js` | Server spawn, window creation, view layout, resize/close handling |
| Preload script | `preload.js` | contextBridge — exposes `minimize`, `maximize`, `close` to ribbon renderer |
| Ribbon renderer | `index.html` | Shell HTML: ribbon div only |
| Ribbon styles | `ribbon.css` | MATLAB R2023b+ geometry, tab styles, window control styles; defines `--ribbon-height` |
| Ribbon logic | `renderer.js` | Button click → IPC to main; tab active state |
| Server settings | `server-data/Machine/settings.json` | Written by main.js before spawn; suppresses VSCodium chrome |
| Server manager | (inline in `main.js`) | `spawnServer()`, `waitForReady()`, `killServer()` |

No separate modules in Sprint 1 — all logic lives in `main.js`. Split into
modules in Sprint 3 when complexity warrants it.

---

## 3. Data Model

No persistent data model in Sprint 1. State held in memory in main process:

```js
// main.js runtime state
{
  serverProcess: ChildProcess | null,   // openvscode-server handle
  serverPort:    number,                 // assigned at spawn
  serverReady:   boolean,               // true after ready signal
  win:           BaseWindow | null,     // the single OS window
  ribbonView:    WebContentsView | null,
  workbenchView: WebContentsView | null,
  ribbonHeight:  number,                // px, read from --ribbon-height at startup
}
```

---

## 4. Interface Specification

### 4.1 Server spawn contract

```
spawnServer(dataDir: string, port: number): ChildProcess

Preconditions:
  - dataDir/Machine/settings.json exists and contains chrome-suppression keys
  - port is available on 127.0.0.1

Postcondition:
  - process.stdout emits a line matching /Listening on/
    (openvscode-server ready signal) within TIMEOUT_MS (default 15000)

On timeout: reject Promise; Electron shows error dialog; app exits.
```

### 4.2 View bounds contract

```
setBounds(win: BaseWindow, ribbonHeight: number):
  ribbonView.setBounds ({ x:0, y:0,
                          width: win.getContentSize()[0],
                          height: ribbonHeight })
  workbenchView.setBounds({ x:0, y:ribbonHeight,
                            width:  win.getContentSize()[0],
                            height: win.getContentSize()[1] - ribbonHeight })

Called on: window 'resize' event (debounced 16ms)
```

### 4.3 contextBridge API (preload.js → renderer.js)

```js
window.electronAPI = {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close:    () => ipcRenderer.send('window:close'),
}
```

### 4.4 IPC channels (main process handlers)

| Channel | Direction | Action |
|---|---|---|
| `window:minimize` | renderer → main | `win.minimize()` |
| `window:maximize` | renderer → main | `win.isMaximized() ? win.unmaximize() : win.maximize()` |
| `window:close` | renderer → main | `killServer()` then `win.destroy()` |

---

## 5. Key Algorithms

### 5.1 Server ready detection

```
1. spawn openvscode-server with stdout pipe
2. start timeout timer (TIMEOUT_MS)
3. on each stdout line:
     if line matches READY_PATTERN (/Listening on/):
       resolve(port)
       clear timer
4. on timer fire: reject("server timeout")
5. on process 'error': reject(err)
```

### 5.2 Resize debounce

```
win.on('resize', debounce(() => setBounds(win, ribbonHeight), 16))
```
16 ms ≈ one frame at 60 Hz. Prevents layout thrash during drag.

### 5.3 Clean shutdown

```
app.on('before-quit', async (e) => {
  e.preventDefault()
  await killServer()   // SIGTERM → wait 2s → SIGKILL
  app.exit(0)
})
```

---

## 6. Error Handling Strategy

| Error | Detection | Response |
|---|---|---|
| Server fails to start (binary not found) | `spawnServer` rejects on process 'error' | Show Electron dialog "openvscode-server not found at PATH"; exit |
| Server timeout (not ready in 15s) | Timer fires | Show dialog "Server did not start in time"; exit |
| Server crashes after ready | `serverProcess.on('exit')` | Show dialog "Server exited unexpectedly"; offer Reload |
| WebContentsView load failure | `workbenchView.webContents.on('did-fail-load')` | Show dialog with error code; exit |
| Port already in use | Server process exits immediately with EADDRINUSE | Retry with port+1 (max 3 attempts) |

All errors are logged to `{app_data}/org.julialab.ide/logs/main.log` via
`electron-log` (or `console.error` redirected to file in Sprint 1).

---

## 7. Dependency List

| Library | Version (pinned) | Purpose |
|---|---|---|
| electron | **TBD — resolve in spike** | App framework, BaseWindow, WebContentsView |
| openvscode-server | **TBD — must match VSCodium 1.121.03429** | Workbench server |
| node.js | 22.22.1 | Runtime (already installed) |

No npm dependencies in Sprint 1 beyond Electron itself. `electron-builder`
deferred to Sprint 4.

> ⚠️ **Open item:** Exact Electron version and exact openvscode-server binary
> version/URL must be pinned in PLAN.md before Task 002. Task 001 (spike)
> determines these values.

---

## 8. Open Design Questions

| # | Question | Resolution path |
|---|---|---|
| DQ-1 | Which Electron version supports `BaseWindow` + `WebContentsView` stably on Windows 10? | Task 001 spike — test Electron 30+ |
| DQ-2 | Does openvscode-server emit exactly `/Listening on/` as its ready string, or does the pattern differ? | Task 001 spike — inspect stdout |
| DQ-3 | Does `window.titleBarStyle: custom` in Machine/settings.json suppress the workbench title bar when loaded in a WebContentsView? | Task 001 spike |
| DQ-4 | What is the exact openvscode-server binary tag that matches VSCodium 1.121.03429? | Task 001 spike — check gitpod-io/openvscode-server releases |
| DQ-5 | Is ribbon height a fixed pixel value or does it scale with Windows display scaling (DPI)? | Measure in Task 002 against Matlab1–5.png reference images |

All DQ items must be resolved (either by spike or by measurement) before
Task 003 begins. No open design questions may remain at Task 003.
