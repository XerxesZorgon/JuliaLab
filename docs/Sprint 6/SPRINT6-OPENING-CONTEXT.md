# JuliaLabApp — Sprint 6 Opening Context

## What this project is

JuliaLabApp is a Windows desktop IDE for scientists transitioning from MATLAB to
Julia. It presents a MATLAB-style ribbon interface (currently a flat tab bar)
wrapping a full VSCodium workbench embedded in Electron via `codium serve-web`.
The architecture is: Electron `BaseWindow` → ribbon `WebContentsView` (index.html
/ renderer.js) + workbench `WebContentsView` (http://127.0.0.1:41000) → `codium
serve-web` server process → julialab VSCode extension (extension.ts) inside the
extension host.

**Repo:** `C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp`
**GitHub:** `https://github.com/XerxesZorgon/JuliaLab`
**Tag at sprint start:** `sprint5-complete`
**Methodology:** eurAIka — this chat is the architectural/planning layer;
Antigravity (Claude Code, Ask mode) executes atomic one-file tasks.

---

## Current architecture — locked decisions

- **Fixed port 41000** — browser-origin stability. Dynamic port resets IndexedDB
  (trust, telemetry, sidebar state) each session. Never change without an ADR.
- **Process teardown** — `killServerDataTree()` uses PowerShell `Get-CimInstance`
  with `-match 'serve-web' -and -match 'server-data'`. The codium-tunnel process
  tree is NOT a descendant of the spawned cmd.exe; only this predicate sweep
  reaches it. `taskkill /T` on the spawn PID is insufficient.
- **Two ribbon dispatch paths:**
  - WS bridge (port 2999): HOME, PLOTS — `data-command="<vscodium-command>"`
  - ipcMain: LIVE EDITOR — `data-command="pluto:launch" data-dispatch="ipc"`
- **`codium` not on PATH** — must be invoked as `cmd.exe /c codium.cmd` with
  `shell: false`.
- **Workspace trust** — lives in Electron userData IndexedDB at
  `C:\Users\johnx\AppData\Roaming\julialab-app`, keyed to
  `http://127.0.0.1:41000`. Settings-based trust approaches are structurally
  blocked (VSCode issue #210965). Fixed port resolves this; do not revisit.

---

## Key files

| File | Role |
|---|---|
| `main.js` | Electron main — port, spawn, teardown, Pluto handler, resize |
| `preload.js` | contextBridge — minimize/maximize/close/ribbonCommand/launchPluto |
| `index.html` | Ribbon UI — HOME/PLOTS/APPS/LIVE EDITOR/INSERT/VIEW tabs (flat text) |
| `renderer.js` | Tab dispatch — WS bridge or ipcMain branch |
| `extensions/julialab/src/extension.ts` | julialab extension — REPL start, layout, WS server |
| `scripts/detect-deps.js` | Dependency detection — writes Machine/settings.json |
| `server-data/Machine/settings.json` | VSCodium machine settings — all tool paths |
| `.antigravity/rules.md` | Antigravity standing instructions |

### Build commands
- `npm start` — full build (compiles extension) then launch
- `npm run start:fast` — launch without rebuilding extension
- `npm run build:ext` — build extension only

---

## What Sprint 5 resolved (do not re-investigate)

| Item | Finding | Status |
|---|---|---|
| `--cli-data-dir` flag (Spike A) | Writes only a token key half + LRU file. No trust state on disk. Flag permanently rejected (ADR-017). | Closed |
| H1/H2 telemetry discriminator (Spike B) | H2 confirmed. Telemetry dismissal persists via fixed-port IndexedDB. No action needed. | Closed |
| `juliaExt.exports` API (Spike J) | Exports: `version, getEnvironment, getJuliaupExecutable, getJuliaExecutable, getJuliaPath, getPkgServer, installJuliaOrJuliaup, executeInREPL`. No readiness signal. | Closed |
| KI-3 REPL readiness probe | Permanently infeasible. 2000 ms `setTimeout` in `extension.ts::activate()` stays. Do not revisit unless julia-vscode publishes a lifecycle API. (ADR-019) | Closed |
| KI-5 GitHub remote | Configured. `origin/main` = JuliaLab rewrite. `origin/compute42` = prior Compute42 build preserved for reference. All sprint tags pushed. | Done |
| KI-2 resize flash | Debounce removed (`state.win.on('resize', setViewBounds)`). Flash reduced but not eliminated. H2 root cause: BaseWindow-level repaint timing — Electron-internal. (ADR-018) | Partial ⚠️ |

**Note on `juliaExt.exports`:** Within `extension.ts`, `juliaExt.exports.getJuliaExecutable()` is available as a cleaner Julia path source than reading `settings.json` directly. Use it in any future in-extension Julia spawning.

**Note on extension host stdout:** `console.log` in extension code is invisible from the Electron terminal. The extension host is a detached Node.js process. Use `fs.writeFileSync` to a file in `__dirname` for any runtime probes.

---

## Known issues entering Sprint 6

### KI-2 — Resize flash H2 residual (cosmetic)
BaseWindow repaints to new dimensions before WebContentsViews catch up. No
application-layer fix is known. Possible Sprint 6 approaches: Electron version
upgrade, compositor hooks if available. Low priority; cosmetic only.

### KI-6 — False "Julia crashed" popup (NEW, Sprint 5)
Observed during regression testing: julia-vscode crash dialog appears
occasionally but the REPL continues to function afterward. Likely cause: the
language server hits a transient fault (OOM spike, GC pause, watchdog timeout)
and julia-vscode surfaces a dialog even though it recovers. To diagnose: read
`server-data/data/logs/<session>/exthost1/output_logging_<ts>/4-Julia Language
Server.log` immediately after a crash dialog appears. Not blocking.

---

## Sprint 6 primary goal — MATLAB-style ribbon redesign

Replace the current flat text-tab ribbon with a grouped-button MATLAB-style
ribbon. This is the committed primary feature for Sprint 6.

**Reference material available:**
- `origin/compute42` branch — the prior Tauri/Vue build with a working MATLAB-
  style ribbon; use `git show compute42:<path>` or `git checkout compute42 --
  <path>` to inspect specific files without switching branches.
- `docs/Matlab1.png` through `docs/Matlab5.png` — MATLAB layout screenshots
- `docs/Reconstructing the 4-Panel MATLAB Layout.mdx` — layout intent document

**Design constraints for the redesign:**
- Ribbon height will likely increase from the current 52 px. If it changes,
  `setViewBounds()` in `main.js` must be updated — `ribbonH` is a hardcoded
  constant there.
- Both dispatch paths must survive: WS bridge tabs keep `data-command=
  "<vscodium-command>"`; LIVE EDITOR keeps `data-dispatch="ipc"`.
- The redesign touches only `index.html` and `ribbon.css` (plus `main.js` if
  ribbon height changes). `renderer.js` dispatch logic should not need changes
  if `data-command` and `data-dispatch` attributes are preserved.
- New spawned processes (e.g. if APPS tab spawns anything) must register their
  PID in `state.childPids` in `main.js`.

**Secondary Sprint 6 candidates (scope TBD):**
- INSERT tab — wire `editor.action.insertSnippet` via WS bridge (trivial, one task)
- APPS tab — needs design before wiring; what Julia GUI apps belong here?
- VIEW tab — layout preset picker; needs design
- KI-6 — diagnose false crash popup
- KI-2 H2 — investigate Electron compositor fix (low priority)
- Windows packaging — gated behind detect-deps absolute-path templating spike

---

## Antigravity rules (`.antigravity/rules.md`)

1. **Never quit JuliaLab with `taskkill /IM electron.exe`** during verification.
   Always use the window ✕ control. This exercises the `before-quit →
   killServer()` code path under test; bypassing it produces false greens.

2. **Never run `npm start` or `npm run start:fast` before receiving explicit
   approval on any pending diff.** Launch commands are manual steps performed
   by John unless an explicit task action says otherwise.

These rules were earned through specific Sprint failures. Enforce them at the
start of every Sprint 6 task.

---

## Antigravity execution discipline

- One file per atomic task — if a task spans two files, split it
- Ask mode only — show diff, await approval, then apply
- Commit after every verified green state
- `git checkout -- <file>` (never patch) on red; escalate to this planning thread
- Teardown/lifecycle tasks: John verifies via ✕-quit + process-diff audit;
  Antigravity must not declare these verified
- Spike modifications: always followed by an explicit revert task; never committed

---

## Sprint 6 document pipeline

Per eurAIka methodology, generate in order before writing any code:
1. SDD-sprint6.md (what & why)
2. ADR(s) for new decisions (ribbon architecture, tab wiring approach)
3. DESIGN-sprint6.md or equivalent (how — ribbon component breakdown, CSS approach)
4. TEST_PLAN-sprint6.md
5. tasks-sprint6.md (atomic steps)

Prior sprint documents for reference: `docs/Sprint 4/` and `docs/Sprint 5/`.
ADR numbering continues from ADR-019; next is ADR-020.
