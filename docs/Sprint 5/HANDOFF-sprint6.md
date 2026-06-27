---
{
  "id": "file_rn9vhg56",
  "filetype": "document",
  "filename": "HANDOFF-sprint6",
  "created_at": "2026-06-27T18:59:07.886Z",
  "updated_at": "2026-06-27T18:59:07.887Z",
  "meta": {
    "location": "/",
    "tags": [],
    "categories": [],
    "description": "",
    "source": "markdown"
  }
}
---
# HANDOFF — Sprint 5 → Sprint 6
**Project:** JuliaLabApp
**Date:** 2026-06-27
**Sprint 5 tag:** `sprint5-complete`
**Repo:** `C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp`
**GitHub:** `https://github.com/XerxesZorgon/JuliaLab`
**Docs:** `JuliaLabApp\docs\Sprint 5\`

---

## 1. What Sprint 5 Delivered

| Feature | Status | Notes |
|---|---|---|
| Spike A — `--cli-data-dir` investigation | ✅ | Flag rejected; writes only token key + LRU, no trust state |
| Spike B — H1/H2 telemetry discriminator | ✅ | H2 confirmed; fixed port fully resolves dismissal persistence |
| Spike J — `juliaExt.exports` API surface | ✅ | Path B; no readiness signal; KI-3 closed permanently |
| KI-2 resize flash (debounce removal) | ⚠️ | Flash reduced (H1 partial); H2 (BaseWindow repaint) confirmed residual |
| KI-3 REPL start delay | ✅ closed | 2000 ms delay retained; KI-3 infeasible per ADR-019 |
| KI-5 GitHub remote | ✅ | `origin` configured; `sprint1–5` tags pushed; Compute42 on `compute42` branch |
| `.antigravity/rules.md` — launch rule | ✅ | No pre-approval `npm start`; launches manual by John only |

---

## 2. Current Repo State

```
Branch: main
Tag:    sprint5-complete (83c5742 chore: add agent rule for launch commands)
Status: clean
GitHub: https://github.com/XerxesZorgon/JuliaLab
Remote branches: main (JuliaLab rewrite), compute42 (prior Compute42 build)
Sprint tags: sprint1-complete through sprint5-complete
```

### Git log (top 4)
```
83c5742 chore: add agent rule for launch commands
d564338 docs: add Sprint 5 planning and ADRs
d152de4 T-KI2: remove resize debounce; direct setViewBounds on resize (ADR-018, KI-2 partial)
6a794ce docs: Sprint 4 final documentation (SDD v0.3, ADRs 012-016, tasks, handoff)
```

---

## 3. Spike Findings — Permanent Record

### Spike A — `--cli-data-dir`
Passing `--cli-data-dir SERVER_DATA_DIR` to `codium serve-web` writes two
files: `server-data/serve-web-key-half` (connection token) and
`server-data/serve-web/lru.json` (recently-opened workspaces). It does NOT
create a `state.vscdb` or any disk-based trust store. Trust persistence is
exclusively browser-side IndexedDB, fully resolved by fixed port. Flag
permanently rejected (ADR-017).

### Spike B — H1/H2 discriminator
H2 confirmed: the julia-vscode telemetry notification stays dismissed across
clean quit/relaunch cycles. No new files appear in `globalStorage/julialang.
language-julia/`. State lives in Electron userData IndexedDB, stable at fixed
port 41000. No action required.

### Spike J — `juliaExt.exports`
julia-vscode v1.219.2 exports:
`version, getEnvironment, getJuliaupExecutable, getJuliaExecutable,
getJuliaPath, getPkgServer, installJuliaOrJuliaup, executeInREPL`

No readiness signal. The 2000 ms `setTimeout` delay in `extension.ts::activate()`
is the only available mechanism. KI-3 closed as permanently infeasible given
the current API. Revisit only if julia-vscode publishes a formal readiness API.

**Sprint 6 note:** `juliaExt.exports.getJuliaExecutable()` is available from
within `extension.ts` — a cleaner source than re-reading `settings.json` for
any future in-extension Julia spawning.

---

## 4. Known Issues Carried into Sprint 6

### KI-2 — Resize flash (H2 residual)
The debounce removal (T-KI2) reduced the flash but did not eliminate it. Root
cause is confirmed as BaseWindow-level repaint timing: the BaseWindow repaints
to its new dimensions before WebContentsViews catch up. No application-layer
fix is available. Possible remedies to investigate: Electron compositor hooks,
a newer Electron version with improved view-bounds synchronisation, or accepting
the cosmetic defect permanently.

### KI-6 — False "Julia crashed" popup (NEW)
Observed during Sprint 5 regression testing: a julia-vscode crash dialog appears
occasionally but the REPL continues to function normally after dismissal. Likely
cause: the language server or a worker process hits a transient fault (OOM spike,
GC pause, watchdog timeout) and julia-vscode surfaces an error dialog even though
the process recovers. Not a teardown or launch issue — purely an in-session
stability signal. Investigate by reading the Julia Language Server log at
`server-data/data/logs/<session>/exthost1/output_logging_<ts>/4-Julia Language
Server.log` immediately after a crash dialog appears.

---

## 5. Antigravity Protocol Learnings — Hard-Won This Sprint

1. **Antigravity ran `npm start` before diff approval three times.** This left
   orphaned Electron processes that held locks on `C:\Users\johnx\AppData\
   Roaming\julialab-app`, causing cache errors (`Unable to move the cache:
   Access is denied`) and a black-screen session during Spike A. The new rule
   in `.antigravity/rules.md` prohibits pre-approval launches. Enforce it at
   the start of every Sprint 6 task involving main.js or launch sequences.

2. **Extension host stdout is not forwarded to Electron main process.** In
   serve-web mode, the extension host runs as a detached Node.js process (PID
   visible as `<NNNNN> Launched Extension Host Process` in server stdout).
   `console.log` in extension code is invisible from the terminal. Use
   `fs.writeFileSync` to a file in `__dirname` for any future runtime probes
   in extension code.

3. **Spike methodology with Antigravity is viable but requires strict gating.**
   Every spike step (apply → manual test → read result → revert) must be issued
   as a separate instruction with an explicit manual gate between each. Combining
   steps into one instruction gives Antigravity room to race ahead of John's
   manual verification steps.

4. **`--force-with-lease` over bare `--force` for remote pushes.** Prevents
   accidental overwrites if the remote was updated between fetch and push.
   Standard for all future destructive pushes.

---

## 6. Sprint 6 Candidate Scope

### Candidate A — Full MATLAB-style ribbon redesign (committed)
Replace the flat text-tab ribbon with a grouped-button MATLAB-style ribbon.
John has a working reference version from the Compute42 build (now preserved
on `origin/compute42`). This is the primary Sprint 6 feature.

Design constraints:
- Ribbon height may need to increase from 52 px to accommodate grouped buttons
  with icons and labels
- `setViewBounds()` must be updated if ribbon height changes
- WS bridge dispatch model (HOME, PLOTS) and ipcMain model (LIVE EDITOR) must
  both survive the redesign — commands stay wired, only the HTML/CSS changes
- Reference: `docs/Matlab1–5.png` and `docs/Reconstructing the 4-Panel MATLAB
  Layout.mdx` for layout intent

### Candidate B — INSERT tab wiring
Wire `editor.action.insertSnippet` via the WS bridge. Trivial one-task
implementation once ribbon redesign is in place.

### Candidate C — APPS tab design
MATLAB's APPS tab launches GUI applications. Analogous Julia candidates:
Pluto (already on LIVE EDITOR), Makie interactive plots, Genie.jl web apps.
Needs design thought before implementation — what is the right set of apps to
expose? Spike recommended before any wiring.

### Candidate D — VIEW tab layout picker
Preset layout switching (two-column, command-window-only, etc.) via the WS
bridge. Requires either VSCode layout commands or custom GoldenLayout presets
(reference: prior Tauri/GoldenLayout work in Compute42).

### Candidate E — KI-2 residual flash (H2)
Investigate Electron compositor hooks or version upgrade for BaseWindow repaint
synchronisation. Low priority; cosmetic only.

### Candidate F — KI-6 false crash popup
Read julia-vscode LS logs during a crash-dialog event; determine whether it is
a recoverable transient or a silent hang. Document root cause and decide whether
to suppress the dialog or address the underlying fault.

### Candidate G — Windows distribution packaging
Package JuliaLab as a Windows installer (NSIS or Squirrel via electron-builder).
Gated behind `detect-deps` absolute-path templating — `server-data/Machine/
settings.json` currently contains `C:\Users\johnx\...` paths that must be
populated at install time, not baked in. Do the detect-deps spike before writing
the packaging config.

---

## 7. Key File Locations

| File | Purpose |
|---|---|
| `main.js` | Electron main — port, spawn, teardown, Pluto handler, resize handler |
| `preload.js` | contextBridge — minimize/maximize/close/ribbonCommand/launchPluto |
| `index.html` | Ribbon UI — six tabs, window controls |
| `renderer.js` | Tab dispatch — WS bridge or ipcMain branch |
| `extensions/julialab/src/extension.ts` | julialab extension — REPL start, layout, WS server |
| `scripts/detect-deps.js` | Dependency detection — writes Machine/settings.json |
| `scripts/copy-extension.js` | Build step — copies dist/ + package.json |
| `server-data/Machine/settings.json` | VSCodium machine settings — all tool paths |
| `.antigravity/rules.md` | Antigravity standing instructions |
| `docs/Sprint 5/ADR-017-*.md` | `--cli-data-dir` decision (rejected) |
| `docs/Sprint 5/ADR-018-*.md` | Resize debounce removal (KI-2 partial) |
| `docs/Sprint 5/ADR-019-*.md` | REPL readiness probe (KI-3 closed) |

### Build commands

| Command | Use |
|---|---|
| `npm start` | Full build (compiles extension) then launch |
| `npm run start:fast` | Launch without rebuilding extension |
| `npm run build:ext` | Build extension only |

---

## 8. Sprint 5 Learnings — Architecture

1. **`juliaExt.exports` is a utility API, not a lifecycle API.** The eight
   exported functions cover Julia environment queries and REPL execution. The
   language server init is entirely internal to julia-vscode. The 2000 ms delay
   is the permanent solution until the julia-vscode team publishes a lifecycle
   event.

2. **Browser-side IndexedDB (Electron userData) is the sole trust store.**
   `C:\Users\johnx\AppData\Roaming\julialab-app` is where Electron stores all
   WebContentsView browser state for `http://127.0.0.1:41000`. This directory
   is not in the repo and not in `server-data/`. If it is deleted or corrupted,
   the workspace trust dialog will reappear once and then persist again. No disk
   backup is possible or necessary.

3. **Electron cache lock errors from stale processes are self-resolving** once
   processes are killed via the PowerShell predicate sweep. The errors
   (`Unable to move the cache: Access is denied`) are not a symptom of code
   defects — they are an OS file-lock artefact of multiple concurrent Electron
   instances sharing a userData directory.
