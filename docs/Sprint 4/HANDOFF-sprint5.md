# HANDOFF — Sprint 4 → Sprint 5
**Project:** JuliaLabApp
**Date:** 2026-06-26
**Sprint 4 tag:** `sprint4-complete`
**Repo:** `C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp`
**Docs:** `JuliaLabApp\docs\Sprint 4\`

---

## 1. What Sprint 4 Delivered

| Feature | Status | Notes |
|---|---|---|
| Fixed port 41000 + pre-flight sweep | ✅ | Replaces dynamic port; stabilises browser origin |
| Process-tree teardown (serve-web + Pluto) | ✅ | Server-data predicate sweep; ADR-012 |
| Extension copy skip list | ✅ | tsconfig/package-lock excluded; KI-4 |
| Bounded REPL start delay (2000 ms) | ✅ | SC-3; readiness probe deferred |
| Workspace panel persistent | ✅ | Already satisfied by VSCodium default |
| Trust dialog eliminated | ✅ | Fixed origin → IndexedDB persists |
| LIVE EDITOR → Pluto in browser | ✅ | SC-4 (a/b/c) all verified |
| Project docs committed to git | ✅ | docs/ was never tracked; now is |
| Antigravity rules file | ✅ | .antigravity/rules.md |
| View background colour (KI-2) | ⚠️ | setBackgroundColor applied; flash persists |

---

## 2. Current Repo State

```
Branch: main
Tag:    sprint4-complete
Status: clean
```

### Key architectural decisions locked in Sprint 4

- **Fixed port 41000** — browser-origin stability. Dynamic port broke IndexedDB
  persistence. ADR-015 amended.
- **Server-data predicate teardown** — `killServerDataTree()` kills by
  `-match 'serve-web' -and -match 'server-data'` with `taskkill /F /T`. The
  `codium-tunnel.exe` subtree is NOT a descendant of the spawned cmd.exe; only
  the predicate sweep reaches it. ADR-012.
- **Pluto via ipcMain spawn** — not via WS bridge. Two ribbon dispatch paths now
  exist: WS bridge (HOME, PLOTS) and ipcMain (LIVE EDITOR). ADR-013.
- **Trust is browser-origin-keyed** — `security.workspace.trust.enabled` in any
  settings.json is ignored under serve-web (VSCode #210965, as-designed). Trust
  state lives in IndexedDB. Fixed port resolves this. ADR-016.

---

## 3. Key File Locations

| File | Purpose |
|---|---|
| `main.js` | Electron main — port, spawn, teardown, Pluto handler, pre-flight |
| `preload.js` | contextBridge — minimize/maximize/close/ribbonCommand/launchPluto |
| `index.html` | Ribbon UI — HOME/PLOTS/APPS/LIVE EDITOR/INSERT/VIEW tabs |
| `renderer.js` | Tab dispatch — WS bridge or ipcMain branch |
| `extensions/julialab/src/extension.ts` | julialab extension — REPL start, layout, WS server |
| `scripts/detect-deps.js` | Dependency detection — writes Machine/settings.json |
| `scripts/copy-extension.js` | Build step — copies dist/ + package.json (skips tsconfig/package-lock) |
| `server-data/Machine/settings.json` | VSCodium machine settings — all tool paths |
| `.antigravity/rules.md` | Antigravity standing instructions |

### Build commands

| Command | Use |
|---|---|
| `npm start` | Full build (compiles extension) then launch |
| `npm run start:fast` | Launch without rebuilding extension |
| `npm run build:ext` | Build extension only |

---

## 4. Known Issues Carried into Sprint 5

### KI-2 — Black flash on window resize (partial)
`setBackgroundColor('#1e1e1e')` applied to both `WebContentsView` objects. Flash
persists on fast resize. Likely cause: `debounce(setViewBounds, 16)` leaves a
gap frame, or `BaseWindow` repaints before views catch up. Try: call
`setViewBounds()` immediately on `resize` event (no debounce) and measure.

### KI-3 — REPL start delay is machine-speed-dependent
2000 ms bounded delay before `startJuliaRepl()` in `extension.ts`. Correct fix
is a readiness probe via `juliaExt.exports` (Spike J, deferred). Note:
`juliaExt.activate()` is already awaited; `isActive` polling is a no-op. The
probe must target the language server's async init, not `isActive`.

### KI-5 — No GitHub remote configured
`git push origin` fails — no remote named `origin`. Fix:
`git remote add origin <github-url>` then push main and tags.

---

## 5. Sprint 5 Candidate Scope

### Candidate A — `--cli-data-dir` investigation (trust + state persistence)
`codium-tunnel serve-web --help` reveals `--cli-data-dir <DIR>` (env:
`VSCODE_CLI_DATA_DIR`). This controls where CLI metadata is stored, including
possibly the trust `state.vscdb`. Passing `--cli-data-dir` pointed at
`server-data/` may make trust state persistent independently of port — useful if
dynamic ports are ever needed again, and may resolve any remaining H1 serve-web
state issues. **Spike first:** pass the flag, check whether a `state.vscdb`
appears in the target dir after a trust click.

### Candidate B — H1/H2 persistence discriminator
With fixed port and working teardown, run the discriminator: launch, dismiss the
julia-vscode telemetry prompt (click "No"), clean ✕-quit, relaunch — does the
prompt stay dismissed? If yes: H2 confirmed (unclean exits caused loss); fixed
port + clean teardown resolves everything. If no: H1 (structural non-persistence
in serve-web) — investigate serve-web's storage layer.

### Candidate C — Ribbon tab completion (APPS, INSERT, VIEW)
Wire the three remaining stub tabs. APPS: consider Julia package browser or
extension marketplace — note that MATLAB's APPS tab launches GUI apps, not a
package manager, so the framing needs design thought. INSERT: `editor.action
.insertSnippet` is the clean single-command target. VIEW: layout picker (two-
column, command-window-only, etc.) — requires custom UI or a layout-preset command.
**Scope INSERT first** (trivial, no design needed), then design APPS/VIEW.

### Candidate D — Windows distribution packaging
Package JuliaLab as a distributable Windows installer (NSIS or Squirrel via
electron-builder). Does not bundle VSCodium or Julia. **Gated behind a clean-
machine spike**: `server-data/Machine/settings.json` still contains absolute paths
(`C:\Users\johnx\...`). Must be templated (detect-deps populates on first run) or
the installer will only work on John's machine. Do the spike before writing the
packaging config.

### Candidate E — KI-2 resize flash fix
Investigate `debounce` removal and immediate `setViewBounds` on resize. Measure
whether the flash is the debounce gap or a BaseWindow-level repaint issue.

### Candidate F — KI-3 readiness probe (Spike J)
Replace the 2000 ms delay in `extension.ts` with a proper readiness signal. Read
`juliaExt.exports` and determine whether it exposes a ready Promise or event.
If it does, `await` it; if not, document why and accept the delay permanently.

---

## 6. Architecture Notes for Sprint 5

**Pluto lifecycle is basic.** One server per session; click LIVE EDITOR twice →
no-op (double-launch guard). Multi-notebook workers are spawned by Pluto
internally and reaped by T1's `childPids` + `killTree` on quit. No mid-session
Pluto stop/restart UI exists.

**detect-deps writes settings.json on every launch.** It merges, not overwrites.
Any key NOT in its managed set (`julia.executablePath`, `wolfbook.wolframKernelPath`,
`lean4.toolchainPath`, `workbench.statusBar.visible`) is preserved. Keys it
manages are overwritten with freshly detected values — intentional.

**Antigravity discipline (reinforced this sprint):**
- One file per atomic task; Ask mode; diff review before apply; commit on green;
  `git checkout -- <file>` (not patch) on red.
- **Teardown/lifecycle tasks are verified by John via ✕-quit + process-diff audit.
  The agent must NOT declare these tasks verified.** (`.antigravity/rules.md`)
- Fix-attempt loops and multi-step diagnosis escalate to this planning thread.
- Verification must exercise the actual code path under test — `taskkill /IM
  electron.exe` bypasses `before-quit → killServer()` and invalidates the test.

**WebSocket bridge vs ipcMain dispatch:**
- WS bridge (HOME, PLOTS): `data-command="<vscodium-command>"`, no `data-dispatch`.
- ipcMain (LIVE EDITOR): `data-command="pluto:launch" data-dispatch="ipc"`.
- Future tabs: use WS bridge for VSCodium commands; use ipcMain for OS-level
  process lifecycle (spawn, kill, open external).

**Process teardown is a sweep, not a tree walk.** `killServerDataTree()` kills
by command-line predicate at quit and at pre-flight. `state.childPids` tracks
additional spawned processes (Pluto). Both are in `killServer()` and
`preflightPort()`. New long-lived spawns MUST register their PID in
`state.childPids`.

---

## 7. Sprint 4 Learnings — Hard-Won

1. **Dynamic port + browser storage = state reset each session.** Trust, telemetry,
   sidebar state all live in IndexedDB, which is origin-keyed by port. Never use
   dynamic ports for a serve-web workbench that needs persistent client state.

2. **codium-tunnel daemonizes its own server.** The serve-web process tree is
   NOT under the spawned `cmd.exe`. Only a command-line predicate sweep can reach it.
   `taskkill /T` on the spawn PID reaps nothing useful.

3. **PowerShell `-like` with escaped backslashes silently matches nothing.** Use
   `-match` with unescaped regex literals. `serve-web` and `server-data` have no
   regex metacharacters — `-match` is the correct, simple choice.

4. **Antigravity cannot verify lifecycle tasks.** It bypassed `before-quit` three
   times via `taskkill /IM electron.exe` and reported false greens. The rule is
   now in `.antigravity/rules.md` and should be reinforced at the start of every
   Sprint 5 teardown-adjacent task.

5. **VSCode serve-web ignores settings.json for trust.** Issue #210965, labeled
   as-designed. Don't spend time on settings-based trust approaches in future
   sprints unless the architecture changes.

6. **`getJuliaExe()` reads the detected julia path, not bare `julia`.** `julia`
   may not be on PATH in the Electron spawn context. Always use the detected
   absolute path from settings.json for any Julia spawning.
