# Test Plan — Sprint 4
**Project:** JuliaLabApp
**Version:** 0.1
**Date:** 2026-06-25
**Depends on:** SDD-sprint4 v0.2, ADR-012/013/014/015/016

All tests are manual (Windows 10 x64). "Clean quit" = window-control close, never
a force-kill. Process checks use:
```powershell
Get-CimInstance Win32_Process -Filter "name='node.exe' or name='codium.exe' or name='julia.exe'" |
  Select-Object ProcessId, ParentProcessId, Name, CommandLine | Format-Table -Wrap
```

---

## TC-1 — Clean teardown (SC-1) — gates T1
1. Launch JuliaLab (`npm start`); wait for the workbench + REPL.
2. Clean-quit via the window close control.
3. ~2 s later, run the process check.
**Pass:** Zero `node.exe`, `codium.exe`, `julia.exe` descended from the
JuliaLab-spawned tree. Pre-existing unrelated processes (e.g. stale
`org.julialab.ide\julia`) excluded.
**Fail trigger:** any serve-web node child, codium, or REPL Julia survives.

## TC-2 — Workspace panel persistence (SC-2, regression) — verifies T5 (no code)
1. Launch; confirm the Julia WORKSPACE panel is visible.
2. Clean-quit; relaunch.
**Pass:** WORKSPACE panel visible on the 2nd launch without a click; terminal
does NOT auto-open on the 2nd launch (preset correctly one-shot).

## TC-3 — Race-free REPL start (SC-3) — gates T4
1. Cold-launch three times in succession (clean-quit between).
**Pass:** No julia-vscode crash-reporter dialog on any of the three launches.
**Note:** T4 uses a bounded delay; if a crash still appears on a slow run,
increase the delay constant (machine-speed-dependent — SDD §8).

## TC-4 — Pluto Live Editor (SC-4) — gates T6–T9
1. Launch JuliaLab.
2. Click the **LIVE EDITOR** ribbon tab.
   **(a)** A Pluto notebook opens in the system browser.
3. In the julia-vscode REPL, type `1+1` → expect `2`.
   **(b)** REPL responds normally while Pluto runs.
4. In the browser, open a notebook and run a cell (spawns a worker).
5. Clean-quit JuliaLab; run the process check.
   **(c)** Zero `julia.exe` from the Pluto tree (server + worker) remain.
**Pass:** (a) + (b) + (c). 
**Partial:** (a)+(b) pass, a worker survives (c) → T7 must enumerate and kill
worker PIDs, not rely on `/T` alone.
**Negative path:** with Pluto.jl NOT installed, the click surfaces a clear
"install Pluto" dialog (from the child's stderr / early exit), no silent failure.

## TC-5 — Dynamic port (SC-5, DELIVERED — regression)
1. `npm start`; note `[server] using dynamic port N`.
2. Clean-quit; `npm start` again; note a (typically different) port.
**Pass:** Both launches succeed, no `os error 10048`. ✅ already verified.

## TC-6 — No trust prompt (SC-6) — gates T-trust
1. Cold-launch JuliaLab.
**Pass:** No workspace-trust dialog; no "Restricted Mode" badge in the status bar.
2. Clean-quit; relaunch → still no dialog, still not restricted.

## TC-7 — Resize black-flash (KI-2, cosmetic) — gates T2
1. Launch; drag-resize the window repeatedly.
**Pass:** No black flash between the ribbon and workbench panes.

## TC-8 — Build copy skip list (KI-4, cosmetic) — gates T3
1. `npm run build:ext`.
2. Inspect `server-data/extensions/julialab/`.
**Pass:** Directory contains `dist/` and `package.json`; does NOT contain
`tsconfig.json` or `package-lock.json`.

---

## Sprint exit criteria
SC-1, SC-3, SC-4(a,b,c), SC-6 pass; SC-2 and SC-5 regressions hold; KI-2/KI-4
cosmetics pass. SC-4(c) is the one carried from spike to implementation — it is
the definitive Pluto-reap proof, tested here against the real Node-spawned tree.
