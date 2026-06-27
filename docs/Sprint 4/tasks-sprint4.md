# tasks — Sprint 4 (COMPLETE)
**Project:** JuliaLabApp
**Date closed:** 2026-06-26
**Tag:** `sprint4-complete`

All tasks verified. Legend: ☑ done · ⚠️ partial · ↩ reverted

---

## ☑ T-port-fix-A — Revert to fixed port 41000 (main.js)
**Commit:** `T-port-fix-A: revert to fixed port 41000 (trust persistence, ADR-015 amendment)`
**Note:** Supersedes original T-port (dynamic port). Dynamic port caused per-session
browser-origin partitioning → trust/state reset each launch.

## ☑ T-port-fix-B — Startup port pre-flight (main.js)
**Commit:** `T-port-fix-B: startup port pre-flight reaps stale serve-web (ADR-015 amendment)`
**Note:** `preflightPort()` calls `killServerDataTree()` before spawn; 300 ms
socket-release wait. Handles crash/force-kill stale-port case.

## ☑ T1 — Process-tree teardown (main.js)
**Commits:** `T1: process-tree teardown via server-data sweep (ADR-012)` (squashed from T1, T1-fix-2, T1-fix-3)
**Mechanism:** Server-data `-match` predicate sweep + `killTree` for `childPids`.
`taskkill /T` + `-like` predicate dead ends documented in ADR-012.
**Verified:** Process-diff audit — zero spawned-tree processes after ✕-quit.

## ⚠️ T2 — View background colour (main.js)
**Commit:** `T2: dark view background eliminates resize black-flash (KI-2)`
**Status:** `setBackgroundColor('#1e1e1e')` applied to both views. Flash persists
on fast resize — setBackgroundColor is necessary but insufficient. Root cause
(debounce gap or BaseWindow repaint timing) deferred to Sprint 5.

## ☑ T3 — Extension copy skip list (copy-extension.js)
**Commit:** `T3: skip tsconfig/package-lock in extension copy (KI-4)`
**Verified:** Delete-and-rebuild confirmed `tsconfig.json`/`package-lock.json`
absent from `server-data/extensions/julialab/`.

## ☑ T4 — Race-free REPL start (extension.ts)
**Commit:** `T4: 1500ms delay before REPL start clears julia-vscode init race (KI-3)`
**Note:** Delay increased to 2000 ms during testing (1500 ms insufficient on
this machine). Verified at 2000 ms: 3 consecutive cold launches, no crash reporter.

## ☑ T5 — Workspace panel persistence (no code)
**Status:** SC-2 already satisfied. Julia WORKSPACE panel visible on 2nd+ launch
by VSCodium default. Spike E finding confirmed; no code change made.

## ↩ T-trust — Workspace trust via Machine settings.json
**Commit reverted:** `Revert "T-trust: disable workspace trust to remove launch prompt (ADR-016, KI-6)"`
**Reason:** Machine-scope key ignored by serve-web (VSCode #210965, as-designed).

## ↩ T-trust-B — Workspace trust via detect-deps User settings seed
**Commit reverted:** `Revert "T-trust-B: seed workspace-trust disable into User settings via detect-deps (ADR-016)"`
**Reason:** User-scope key also ignored; trust state lives in browser IndexedDB,
not on-disk settings.

## ☑ KI-6 — Workspace trust dialog (closed via T-port-fix-A)
Trust dialog absent after first-session "Yes, I trust" click — IndexedDB now
persists across sessions because origin is stable (fixed port).

## ☑ T6 — Expose launchPluto on contextBridge (preload.js)
**Commit:** `T6: expose launchPluto on contextBridge (ADR-013)`

## ☑ T7 — Pluto spawn handler (main.js)
**Commit:** `T7: Pluto spawn handler (ADR-013)`
**Note:** `getJuliaExe()` reads detected Julia path from Machine settings.json.
Stdout readiness: first line containing `localhost`. Error dialog on non-zero
pre-ready exit.

## ☑ T8 — Wire LIVE EDITOR ribbon tab (index.html)
**Commit:** `T8: wire LIVE EDITOR tab to ipc dispatch (ADR-013)`

## ☑ T9 — Route LIVE EDITOR click to Pluto launch (renderer.js)
**Commit:** `T9: route LIVE EDITOR click to Pluto launch (ADR-013)`
**Verified (SC-4):** (a) Pluto opened in browser ✅ (b) REPL usable alongside ✅
(c) Zero julia.exe after quit ✅

---

## Additional commits this sprint
- `docs: add project documentation (Test Phase, Sprints 1-4)` — docs/ tree committed for first time
- `docs: add Antigravity standing instruction for verification` — `.antigravity/rules.md`
- `chore: commit current machine settings (Wolfram 15.0)` — settings.json tracked

---

## Definition of done — ACHIEVED
SC-1 ✅ SC-2 ✅ SC-3 ✅ SC-4 (a/b/c) ✅ SC-5 ✅ SC-6 ✅
Tag: `sprint4-complete`
