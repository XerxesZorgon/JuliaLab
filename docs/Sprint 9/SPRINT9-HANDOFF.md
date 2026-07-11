---
{
  "id": "file_npp1b5d8",
  "filetype": "document",
  "filename": "SPRINT9-HANDOFF",
  "created_at": "2026-07-11T11:47:53.659Z",
  "updated_at": "2026-07-11T11:47:53.660Z",
  "meta": {
    "location": "/",
    "tags": [],
    "categories": [],
    "description": "",
    "source": "markdown"
  }
}
---
# Sprint 9 Opening Context — JuliaLabApp

**Date:** 2026-07-04
**Prepared by:** Claude (eurAIka planning thread)
**Incoming tag:** `sprint8-complete` (to be pushed after Task 010)
**Repo:** https://github.com/XerxesZorgon/JuliaLab
**Project path:** `C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp`

---

## Current application state

JuliaLabApp is a Windows desktop IDE for scientists migrating from MATLAB to Julia.
Architecture: Electron BaseWindow → ribbon WebContentsView (index.html/renderer.js)
+ workbench WebContentsView (codium serve-web at port 41000) → julialab VSCode
extension (extension.ts).

**What works as of sprint8-complete:**

| Feature | Status |
|---|---|
| 4-tab ribbon (HOME/CODE/FIGURES/VIEW) | ✓ Fully functional |
| HOME: SEARCH, SETTINGS/Preferences+Keybindings | ✓ Wired |
| HOME: Docs, Examples, Community | ✓ Opens system browser |
| HOME: Change Dir | ✓ Opens folder picker, persists workspace |
| HOME: New Folder | ✓ Wired |
| HOME: Instantiate | ✓ Wired |
| CODE: New, Open, Save | ✓ Wired |
| CODE: Undo, Redo, Cut, Copy, Paste | ✓ Via sendInputEvent keyboard injection |
| CODE: Go to Def, Find, Forward, Back | ✓ Wired |
| CODE: Indent, Comment | ✓ Wired |
| CODE: Run, Run Selection, Execute Cell, Restart REPL | ✓ Wired |
| CODE: Breakpoint, Step, Continue | ✓ Wired (palette-verified) |
| FIGURES: New, Close, Close All | ✓ Wired |
| FIGURES: PLOT TYPE radio group (12 types) | ✓ Selection state (noop execution) |
| FIGURES: STYLE multi-toggle (5 options) | ✓ Selection state (noop execution) |
| FIGURES: AXES multi-toggle (6 options) | ✓ Selection state (noop execution) |
| FIGURES: Plot button | ✓ Present, green, noop (Sprint 9 target) |
| VIEW: FILE BROWSER, DOCUMENTATION | ✓ Wired |
| VIEW: COMMAND WINDOW | ✓ Wired + partial sync |
| VIEW: LAYOUT, THEME, RIBBON | ✓ Wired |
| F2 / Hide Ribbon | ✓ Collapses to tab strip |
| Ctrl+Shift+I | ✓ Opens ribbon DevTools |
| Session restore | ✓ Workspace persisted in last-workspace.json |
| Teardown | ✓ All processes clean on ✕-quit |

---

## Sprint 9 primary goal

**Implement the Plot Builder** — the full functionality of the FIGURES tab
Plot button. When the user selects a plot type, style options, and axes options
via the ribbon selection buttons and clicks Plot, a variable picker webview
opens, the user selects x/y variables from the Julia workspace, and the
generated Plots.jl code executes in the REPL.

**Secondary goals:**
- Activity bar launchers: Pluto, Lean, Wolfram, Claude
- KI-8: dirty file indicator (`.` dot) missing for modified Julia files

---

## Sprint 9 task sketch (from SDD-plot-builder.md)

| Task | Scope | Gate |
|---|---|---|
| S9-001 | Spike: variable discovery — test REPL output capture | First — gates everything |
| S9-002 | `extension.ts`: ADR-024 WS bridge args extension | Second — required for REPL execution |
| S9-003 | `extension.ts`: `julialab.openPlotBuilder` + webview panel | After S9-002 |
| S9-004 | `plot-builder.html`: webview UI (variable dropdowns, Run button) | After S9-003 |
| S9-005 | `plot-builder.js` / webview script: code generation + messaging | After S9-004 |
| S9-006 | `renderer.js`: `plot-builder` dispatch branch | After S9-002 |
| S9-007 | `extension.ts`: REPL execution via ADR-024 args | After S9-005 |
| S9-008 | Integration test: select vars → Run → plot appears | After S9-007 |
| S9-009 | Activity bar launchers (Pluto, Lean, Wolfram, Claude) | Independent |
| S9-010 | KI-8: dirty file indicator investigation | Independent |
| S9-011 | Regression + tag sprint9-complete | Last |

---

## Key architecture facts

### File roles
- `main.js`: Electron main — BaseWindow, RIBBON_HEIGHT=124 (SSOT), globalShortcuts
  (F2, Ctrl+Shift+I), ipcMain handlers (ribbon:hide, ribbon:pin, workbench-key,
  ribbon-command, pluto:launch), workspace persistence (loadLastWorkspace/saveLastWorkspace)
- `preload.js`: contextBridge — minimize/maximize/close/ribbonCommand/hideRibbon/
  pinRibbon/launchPluto/sendKey
- `index.html`: Ribbon markup — 4 tabs, all body divs, icons from
  `assets/icons/<tab>/`, FIGURES Plot button (`data-dispatch="plot-builder"`)
- `renderer.js`: Tab→body switching, button dispatch (WS/ipc/kb/group/plot-builder
  branches), toggle/theme/sync handlers, connectEventReceiver(), window.plotConfig
- `ribbon.css`: Light theme, #00589C strip, grouped layout, toggle/select/plot
  button styles
- `extension.ts`: julialab extension — WS bridge (port 2999, prefix allowlist
  ADR-020), connectedClients Set, broadcastPanelState(), terminal sync events,
  startJuliaRepl, applyLayoutIfFirstOpen, doc opener commands, workspace helpers

### Critical constraints
- `codium` not on PATH — invoke as `cmd.exe /c codium.cmd`
- Fixed port 41000 — browser origin stability (dynamic ports break IndexedDB)
- Teardown uses PowerShell Get-CimInstance matching serve-web + server-data
- serve-web architecture: editor-scoped commands (undo/redo/clipboard) require
  DOM focus in workbench WebContentsView — use sendInputEvent (main.js handler
  `workbench-key`) not WS bridge
- CSS dropdowns inside ribbon WebContentsView clip at view bounds (ADR-022)
- console.log in extension.ts invisible from Electron terminal (extension host
  is detached Node.js process); use fs.writeFileSync probe for debugging
- File System Access API blocks session restore for loose files — always open
  a folder (workspace) not an individual file; workspace persisted in
  `server-data/last-workspace.json`

### ADR registry
- ADR-020: Prefix allowlist dispatch (`julialab.`, `workbench.action.`,
  `editor.action.`, `language-julia.`)
- ADR-021: RIBBON_HEIGHT=124 SSOT in main.js; injected as CSS var via insertCSS
- ADR-022: Dropdowns deferred (ribbon view clips overflow)
- ADR-023: COMMAND WINDOW sync via WS reverse channel (panelState events)
- ADR-024: **Planned Sprint 9** — WS bridge argument passing
  `{ command, args?: any[] }` for executeJuliaCodeInREPL with code string

### WS bridge dispatch
Ribbon button → `main.js` WS client → extension host WS server (port 2999).
Extension processes message `{ command, args? }`. Allowed prefixes: `julialab.`,
`workbench.action.`, `editor.action.`, `language-julia.`.

Special cases in extension.ts:
- `julialab.syncPanelState` → broadcasts terminal state to sender
- `workbench.action.terminal.toggleTerminal|show` → focus + terminal.focus
- `workbench.action.terminal.toggleTerminal|hide` → focus + closePanel

### Keyboard injection
`data-dispatch="kb"` + `data-key="ctrl+z"` on button → renderer.js →
`window.electronAPI.sendKey(key)` → ipcRenderer → `workbench-key` ipcMain →
`wc.focus() + wc.sendInputEvent(keyDown) + wc.sendInputEvent(keyUp)`.

### window.plotConfig (Sprint 8 accumulator, Sprint 9 consumer)
```javascript
window.plotConfig = {
  type:  null,   // string: 'scatter', 'line', 'bar', etc.
  style: [],     // array: ['markers', 'opacity', ...]
  axes:  [],     // array: ['xlabel', 'ylabel', 'grid', ...]
};
```
Plot button has `data-dispatch="plot-builder"` — Sprint 9 renderer.js handler
reads `window.plotConfig` and sends it to the extension host to open the
variable picker webview.

### Antigravity rules (enforced)
- Never quit via `taskkill /IM electron.exe` — use ✕ control
- Never run `npm start` before diff approval
- Teardown tests are John-verified only, never Antigravity-declared
- One file change per Antigravity task; flag and refuse if scope too large

### Build pipeline
- `npm run build:ext` → `tsc -p ./` → `node scripts/copy-extension.js`
  → deploys to `server-data/extensions/julialab/`
- Always run `build:ext` before `npm start` when `extension.ts` has changed
- `npm run start:fast` skips build:ext — use only for UI-only changes

---

## Open issues / known items

| ID | Description | Sprint |
|---|---|---|
| KI-8 | Dirty file indicator (dot) missing for modified Julia files | 9 |
| KI-6 | False Julia crash popup (intermittent) | Diagnose when next seen |
| ADR-022 | Dropdown mechanism (CSS dropdowns clip in ribbon view) | Deferred |
| — | COMMAND WINDOW: × panel close leaves button green (panel-visibility API not exposed) | Accepted limitation |
| — | FIGURES ANIMATE group not wired (no julia-vscode commands exist) | Deferred |
| — | HOME PACKAGE MANAGER bulk ops (Add, Remove, Status, Registry, Update All) | Sprint 10+ |
| — | HOME UPDATE group | Sprint 10+ |

---

## Key learnings from Sprints 6–8

1. `language-julia.executeJuliaCellInREPL` does not exist — use `language-julia.executeCell`
2. `workbench.action.terminal.toggleTerminal` has a 3-state focus machine — use
   deterministic `terminal.focus` (show) + `closePanel` (hide) instead
3. `simpleBrowser.show` does not accept URL arguments in serve-web mode — use
   `vscode.env.openExternal(vscode.Uri.parse(url))` for external docs
4. VSCodium URL-encodes Windows paths as `/C:/...` — strip leading `/` and
   convert slashes when reading `?folder=` param from `did-navigate`
5. `sendInputEvent` requires `wc.focus()` first — unfocused webContentsView
   discards keyboard events silently
6. Session restore for loose files (opened via File→Open File outside workspace)
   fails with SecurityError — always open a folder as workspace, not individual files
7. The `|show|hide` state suffix on toggle commands must be scoped to COMMAND
   WINDOW only — other toggle buttons must not receive the suffix
8. **Webview panels in this app must inline all JavaScript directly into
   the HTML (`<script nonce="...">...code...</script>`), never load it via
   an external `src` attribute.** `codium serve-web` renders webview panels
   as browser-hosted content that depends on a service-worker-mediated
   `vscode-resource` proxy to fetch external script/resource files — this
   mechanism is documented as fragile in nested/embedded webview contexts
   (a currently-open upstream VS Code/Chromium issue), and in this app's
   case (Electron `WebContentsView` hosting a browser-rendered VS Code
   instance, itself hosting a webview panel) it failed silently: HTML/CSS
   rendered correctly, but the external script never executed, with no
   visible error anywhere (webview DevTools/Inspect is also unavailable in
   this context — right-click only offers Cut/Copy/Paste). Confirmed fix:
   read the JS file's content in the extension host and embed it directly
   in the HTML string via `getPlotBuilderHtml()`-style substitution, using
   a function-form `String.replace()` argument (not a plain string) to
   avoid `$`-pattern misinterpretation of any template literals in the
   embedded code.

---

## Docs in `docs/Sprint 8/`
- `SDD-sprint8.md`
- `DESIGN-sprint8.md`
- `TEST_PLAN-sprint8.md`
- `SDD-plot-builder.md` ← **primary Sprint 9 design input**

## Sprint 9 eurAIka methodology
Per the software-project skill, Sprint 9 begins with:
1. Socratic elicitation (already done — scope confirmed in Sprint 8 planning)
2. SDD (done — `SDD-plot-builder.md`)
3. ADR-024 (write before any implementation)
4. DESIGN doc → TEST PLAN → tasks.md
5. Spike S9-001 first (variable discovery) — gates implementation
