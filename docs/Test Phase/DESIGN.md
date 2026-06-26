# Software Design Document
**Project:** JuliaLabShell — Electron/VSCodium Chrome Proof-of-Concept
**Version:** 0.1
**Date:** 2026-06-22
**Author:** John Peach / eurAIka

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Electron Main Process  (main.js)                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  BrowserWindow  (frameless, 1400×900)               │   │
│  │                                                     │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │  Renderer Process  (index.html + renderer.js) │  │   │
│  │  │                                               │  │   │
│  │  │  ┌─────────────────────────────────────────┐  │  │   │
│  │  │  │  Ribbon  (ribbon.html / ribbon.css)     │  │  │   │
│  │  │  │  HOME | PLOTS | APPS | LIVE EDITOR |    │  │  │   │
│  │  │  │  INSERT | VIEW          [─][□][✕]       │  │  │   │
│  │  │  └─────────────────────────────────────────┘  │  │   │
│  │  │                                               │  │   │
│  │  │  ┌─────────────────────────────────────────┐  │  │   │
│  │  │  │  VSCodium placeholder div               │  │  │   │
│  │  │  │  (shows VSCodium PID / status)          │  │  │   │
│  │  │  └─────────────────────────────────────────┘  │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  child_process.spawn(vscodium, args)                        │
│    --user-data-dir=./vscodium-data                          │
│    --no-sandbox                                             │
│    --disable-gpu  (optional, stability)                     │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  VSCodium Process  (separate OS window)                     │
│                                                             │
│  Title bar: HIDDEN  (window.titleBarStyle = hidden)         │
│  Menu bar:  HIDDEN  (window.menuBarVisibility = hidden)     │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Editor  |  File Tree  |  Terminal                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Two-window model (PoC):** The Electron shell owns a frameless window
containing the ribbon. VSCodium runs as a separate OS-level window, chrome-
suppressed, positioned immediately below the ribbon window. They appear as one
application to the user. Single-window embedding is deferred to a later phase.

---

## 2. Component Breakdown

| Component | File | Responsibility |
|---|---|---|
| Main process | `main.js` | Create Electron BrowserWindow; spawn VSCodium subprocess; handle IPC for window controls and VSCodium positioning |
| Preload script | `preload.js` | Expose `contextBridge` API so renderer can call minimize/maximize/close and query VSCodium status without `nodeIntegration` |
| Renderer entry | `index.html` | Shell HTML; loads ribbon and status area |
| Ribbon styles | `ribbon.css` | MATLAB R2023b+ ribbon geometry, tab styling, window control buttons |
| Renderer logic | `renderer.js` | Wire window control buttons to preload API; receive VSCodium status from main |
| VSCodium settings | `vscodium-data/User/settings.json` | Written by main.js before spawn; sets `window.titleBarStyle`, `window.menuBarVisibility` |
| Package manifest | `package.json` | Electron 39.8.8 dependency; `npm run dev` script |

---

## 3. Data Model

No persistent data model. The only state is runtime:

| State | Owner | Type | Notes |
|---|---|---|---|
| VSCodium process handle | `main.js` | `ChildProcess` | Killed on Electron app quit |
| Electron window bounds | `main.js` | `{x, y, width, height}` | Used to position VSCodium window below ribbon |
| Ribbon height | `main.js` constant | `number` (px) | `52` — matches MATLAB ribbon height |
| VSCodium status | `main.js` → IPC → renderer | `string` | `"starting" \| "ready" \| "error"` |

---

## 4. Interface Specification

### 4.1 contextBridge API (preload.js → renderer)

```javascript
window.electronAPI = {
  // Window controls
  minimize: ()  => ipcRenderer.send('window:minimize'),
  maximize: ()  => ipcRenderer.send('window:maximize'),
  close:    ()  => ipcRenderer.send('window:close'),

  // VSCodium status
  onVSCodiumStatus: (callback) =>
    ipcRenderer.on('vscodium:status', (_event, status) => callback(status))
}
```

### 4.2 IPC Channels (main.js handles)

| Channel | Direction | Payload | Action |
|---|---|---|---|
| `window:minimize` | renderer → main | — | `win.minimize()` |
| `window:maximize` | renderer → main | — | `win.isMaximized() ? win.unmaximize() : win.maximize()` |
| `window:close` | renderer → main | — | `app.quit()` (also kills VSCodium child) |
| `vscodium:status` | main → renderer | `string` | Display in status area |

### 4.3 VSCodium Spawn Arguments

```javascript
const args = [
  '--user-data-dir', path.join(__dirname, 'vscodium-data'),
  '--no-sandbox',
  '--disable-extensions',   // PoC only — prevents extension chrome
]
```

VSCodium executable path resolved from:
1. `VSCODIUM_PATH` environment variable (allows override)
2. Windows default: `C:\Users\<user>\AppData\Local\Programs\VSCodium\VSCodium.exe`

### 4.4 VSCodium Settings (written before spawn)

```json
// vscodium-data/User/settings.json
{
  "window.titleBarStyle": "custom",
  "window.menuBarVisibility": "hidden",
  "workbench.colorTheme": "Default Light Modern"
}
```

---

## 5. Key Algorithms

### 5.1 VSCodium Window Positioning

After VSCodium spawns, main.js polls for its window to appear (500ms interval,
5s timeout), then positions it:

```
vscodium_x      = electron_window.x
vscodium_y      = electron_window.y + RIBBON_HEIGHT  (52px)
vscodium_width  = electron_window.width
vscodium_height = electron_window.height - RIBBON_HEIGHT
```

**Limitation (PoC):** Window positioning of a child process's OS window from
Electron requires either `node-window-manager` (native addon) or a PowerShell
call to `SetWindowPos`. The PoC uses a PowerShell one-liner via
`child_process.execSync`. This is intentionally crude — the single-window
upgrade eliminates this entirely.

### 5.2 Graceful Shutdown

```
app.on('before-quit') →
  vscodiumProcess.kill() →
  wait up to 2s →
  app.exit(0)
```

---

## 6. Error Handling Strategy

| Error | Detection | Response |
|---|---|---|
| VSCodium executable not found | `fs.existsSync` before spawn | Renderer shows "VSCodium not found at \<path\>. Set VSCODIUM_PATH." |
| VSCodium exits unexpectedly | `process.on('exit')` | Renderer status → "VSCodium exited (code N)" |
| VSCodium window positioning fails | PowerShell exit code ≠ 0 | Log warning; continue — VSCodium still usable, just not aligned |
| IPC channel error | `ipcMain.on` try/catch | Log to console; no crash |

All errors log to `console.error` (visible in `npm run dev` terminal). No
error telemetry. No user-visible modal dialogs in the PoC.

---

## 7. Dependency List

| Library | Version (pinned) | Purpose |
|---|---|---|
| electron | 39.8.8 | Shell runtime — matches VSCodium's bundled Electron |
| electron-builder | 25.1.8 | Dev tooling only (`npm run dev` script) |

No other runtime dependencies. `node-window-manager` is explicitly excluded
(native addon compilation risk on Windows); PowerShell is used instead for
window positioning.

---

## 8. File Tree

```
JuliaLabShell/
├── package.json
├── main.js
├── preload.js
├── index.html
├── renderer.js
├── ribbon.css
├── vscodium-data/
│   └── User/
│       └── settings.json      ← written by main.js on first run
└── docs/
    ├── SDD.md
    └── adr/
        ├── ADR-001-electron-shell-embedding.md
        ├── ADR-002-chrome-suppression.md
        └── ADR-003-ribbon-technology.md
```

---

## 9. Open Design Questions

None. All decisions recorded in ADR-001, ADR-002, ADR-003.
