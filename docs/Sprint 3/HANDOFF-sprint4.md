# HANDOFF — Sprint 3 → Sprint 4
**Project:** JuliaLabApp  
**Date:** 2026-06-25  
**Sprint 3 tag:** `sprint3-complete` (28c141b)  
**Repo:** `C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp`  
**Docs:** `JuliaLabApp\docs\Sprint 3\`

---

## 1. What Sprint 3 Delivered

A thin custom `julialab` VSCodium extension (TypeScript) that makes JuliaLab
self-configuring on launch:

| Feature | Status | Notes |
|---|---|---|
| Default workspace folder (`%USERPROFILE%\JuliaLab`) | ✅ Delivered | `--default-folder` CLI flag to `codium serve-web` |
| Julia REPL auto-start on launch | ✅ Delivered | `language-julia.startREPL` called from `activate()` |
| MATLAB-style layout preset (one-shot) | ✅ Delivered | julia-explorer sidebar + terminal + editor focus |
| Ribbon HOME tab → focus editor | ✅ Delivered | `workbench.action.focusActiveEditorGroup` |
| Ribbon PLOTS tab → julia-vscode plot pane | ✅ Delivered | `language-julia.show-plotpane` |
| CairoMakie plot rendering in workbench | ✅ Confirmed | Renders in `Julia Plots (1/1)` WebviewPanel tab |
| Workspace variable panel | ✅ Confirmed | `REPLVariables` via julia-vscode, visible on demand |
| detect-deps settings merge fix | ✅ Delivered | `Object.assign()` merge; no longer overwrites manual keys |

### Architecture decisions locked in Sprint 3

- **WebSocket bridge on port 2999** — Electron ribbon → extension host. Window
  `CustomEvent` approach was tested and confirmed non-functional in serve-web
  mode (extension host is a Web Worker; main frame `window` is a separate
  context). WebSocket is the permanent solution. See ADR-010.
- **julia-vscode owns Julia process** — No custom Julia runtime code. The
  Compute42 named-pipe architecture (`main.jl`, `display.jl`, `workspace.jl`)
  is permanently superseded. See ADR-011.
- **Extension source in `extensions/julialab/`** — built via `npm run build:ext`,
  served from `server-data/extensions/julialab/` (gitignored artefact).
  See ADR-009.
- **`publisher` field required** — VSCodium serve-web rejects extensions without
  a `publisher` field in `package.json`. Value is `"julialab"`. Do not remove.

---

## 2. Current Repo State

```
Branch: main
Tag:    sprint3-complete (28c141b)
Status: clean (nothing to commit)
```

### Key file locations

| File | Purpose |
|---|---|
| `main.js` | Electron main process — BaseWindow, WebContentsView, serve-web spawn, WebSocket client |
| `preload.js` | contextBridge — exposes `minimize`, `maximize`, `close`, `ribbonCommand` |
| `index.html` | Ribbon bar UI — six tabs with `data-command` attributes |
| `renderer.js` | Ribbon tab click dispatch via `electronAPI.ribbonCommand` |
| `extensions/julialab/src/extension.ts` | julialab extension — activation, WebSocket server, REPL start, layout preset |
| `extensions/julialab/package.json` | Extension manifest — publisher: julialab, activationEvents: onStartupFinished |
| `scripts/detect-deps.js` | Dependency detection — merges into settings.json, does not overwrite |
| `scripts/copy-extension.js` | Build step — copies dist/ and package.json to server-data/extensions/julialab/ |
| `server-data/Machine/settings.json` | VSCodium machine settings — all paths + layout keys |

### Build commands

| Command | Use |
|---|---|
| `npm start` | Full build (compiles extension) then launch — use after any extension change |
| `npm run start:fast` | Launch without rebuilding extension — use when only main.js/renderer.js changed |
| `npm run build:ext` | Build extension only — compile + copy to server-data |

---

## 3. Known Issues Carried into Sprint 4

These are advisory items — JuliaLab is fully functional with all of them
present. They are quality and robustness improvements, not regressions.

### KI-1 — Orphaned node.exe processes on quit (R-3)
**Symptom:** After closing JuliaLab, 2 `node.exe` processes remain in Task
Manager. No codium.exe orphans.  
**Cause:** `killServer()` sends `SIGTERM` to the `codium serve-web` process,
but Windows does not propagate signals to child processes. The extension host
and file watcher node children are not reaped.  
**Fix:** Replace `SIGTERM` in `killServer()` with a PowerShell
`taskkill /F /T /PID` call that force-kills the entire process tree.  
**File:** `main.js` → `killServer()`

### KI-2 — Black flash on window resize (R-2)
**Symptom:** Brief black background visible between ribbon and workbench
panes during window drag/resize.  
**Cause:** `ribbonView` and `workbenchView` are two separate `WebContentsView`s
that repaint asynchronously. The `debounce(setViewBounds, 16)` call fires
after the resize event, leaving a gap frame.  
**Fix:** Set `backgroundColor: '#1e1e1e'` on the `BaseWindow` (already done)
and add `backgroundColor: '#1e1e1e'` to both `WebContentsView` constructors.
This makes the gap colour match the content rather than showing black.  
**File:** `main.js` → `createWindow()`

### KI-3 — Julia extension crash reporter on startup (advisory)
**Symptom:** julia-vscode shows a crash reporter dialog on first launch of
each session. Extension recovers and continues working.  
**Cause:** `julialab` extension calls `language-julia.startREPL` immediately
on `onStartupFinished`, which can catch julia-vscode mid-initialisation.  
**Fix:** Add a 1500ms delay before `startJuliaRepl()` in `extension.ts`:
```typescript
await new Promise(resolve => setTimeout(resolve, 1500));
await startJuliaRepl();
```
**File:** `extensions/julialab/src/extension.ts` → `activate()`

### KI-4 — Extraneous files copied to server-data extension dir (cosmetic)
**Symptom:** `server-data/extensions/julialab/` contains `tsconfig.json` and
`package-lock.json` alongside `dist/` and `package.json`. These files are
harmless but are not needed by the extension host at runtime.  
**Fix:** Add `'tsconfig.json'`, `'package-lock.json'` to the skip list in
`copy-extension.js`.  
**File:** `scripts/copy-extension.js`

### KI-5 — No GitHub remote configured
**Symptom:** `git push origin sprint3-complete` fails — no remote named
`origin`.  
**Fix:** `git remote add origin <github-url>` then `git push --set-upstream
origin main` and `git push origin sprint3-complete`.  
**Not a code issue** — repository has not been pushed to GitHub yet.

---

## 4. Sprint 4 Candidate Scope

The following are candidate features for Sprint 4. None are committed —
Sprint 4 Phase 0 will prioritise and scope them.

### Candidate A — KI fixes (robustness)
Fix KI-1 through KI-4 as a robustness pass. Low risk, well-understood fixes.
Estimated: 4 atomic tasks.

### Candidate B — Pluto.jl Live Editor tab
Wire the LIVE EDITOR ribbon tab to launch a Pluto.jl notebook server and
embed it in a WebviewPanel or a third WebContentsView. This was deferred
from Sprint 3 as out of scope. Higher complexity — requires:
- Spawning a Julia process running `Pluto.run()` on a fixed port
- Embedding the Pluto UI (it's a full browser app) in the workbench
- Managing Pluto server lifecycle alongside codium serve-web

### Candidate C — Ribbon tab completion (APPS, INSERT, VIEW)
Wire the remaining three ribbon tabs to meaningful VSCodium commands:
- APPS → open Extensions marketplace or a curated Julia packages panel
- INSERT → `editor.action.insertSnippet` or a Julia-specific snippet menu
- VIEW → layout picker (two-column, command window only, etc.)
Low complexity — purely a ribbon command mapping exercise.

### Candidate D — Windows distribution packaging
Package JuliaLab as a distributable Windows installer (NSIS or Squirrel).
Bundles Electron, the extension, and the server-data directory. Does not
bundle VSCodium or Julia — those remain user-installed prerequisites.
Higher complexity — requires electron-builder configuration.

### Candidate E — Workspace panel UX polish
The julia-vscode `REPLVariables` panel is functional but bare. Candidate:
open it by default in the Activity Bar sidebar without requiring the user
to click the beaker icon each time.  
Implementation: the layout preset in `applyLayoutIfFirstOpen()` already
calls `workbench.view.extension.julia-explorer` — this should open the
panel. If it is not persisting across relaunches, investigate
`workbench.activityBar` settings or add a `workbench.view.*` setting to
`settings.json`.

---

## 5. Architecture Notes for Sprint 4

**Extension rebuild required for any change to `extension.ts`:**
```
npm run build:ext   (or npm start for a full rebuild + launch)
```
After any `extension.ts` change, the old `server-data/extensions/julialab/`
must be replaced by the new build. `npm run build:ext` handles this via
`copy-extension.js`. Do not manually edit files in `server-data/extensions/julialab/`.

**WebSocket port 2999 is now a system constant:**
Both `main.js` (`RIBBON_WS_PORT = 2999`) and `extension.ts` (`RIBBON_WS_PORT = 2999`)
must stay in sync. If the port changes, update both files in the same commit.

**`onStartupFinished` activation event:**
The julialab extension activates after all other extensions. This is
intentional — it ensures julia-vscode is ready before `startJuliaRepl()`
is called. Do not change to an earlier activation event without also adding
a readiness check for julia-vscode.

**Layout preset is one-shot:**
`applyLayoutIfFirstOpen()` writes `julialab.layoutApplied = true` to
`workspaceState` on first run and never fires again. If the layout needs
to be re-applied during development, clear workspace state by deleting
the VSCodium workspace storage directory under `server-data/`.

**detect-deps writes to settings.json on every launch:**
It merges, not overwrites. Any new keys added to `settings.json` manually
will survive relaunches. Keys that detect-deps manages
(`julia.executablePath`, `wolfbook.wolframKernelPath`, `lean4.toolchainPath`,
`workbench.statusBar.visible`) will be overwritten with freshly detected
values on each launch — this is intentional behaviour.
