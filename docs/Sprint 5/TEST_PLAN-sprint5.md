# Test Plan — Sprint 5
**Project:** JuliaLabApp
**Version:** 0.1
**Date:** 2026-06-27
**Depends on:** SDD-sprint5 v0.1, ADR-017/018/019

All tests are manual (Windows 10 x64) unless noted as Antigravity-executable.
"Clean quit" means window-control ✕ close — never `taskkill`. Process checks use:

```powershell
Get-CimInstance Win32_Process -Filter "name='node.exe' or name='codium.exe' or name='julia.exe'" |
  Select-Object ProcessId, ParentProcessId, Name, CommandLine | Format-Table -Wrap
```

---

## Regression suite (run before any Sprint 5 task is committed)

Verify that `sprint4-complete` baseline still holds. These tests are not
reimplemented — they are the Sprint 4 test cases, re-run on the current HEAD.

| Regression | Sprint 4 Test | Expected result |
|---|---|---|
| R-1 Clean teardown | TC-1 | Zero spawned-tree processes after ✕-quit |
| R-2 Port stability | TC-5 | Two consecutive launches, no 10048 error |
| R-3 Trust persistence | TC-6 | No trust dialog on 2nd+ launch |
| R-4 REPL start (no crash) | TC-3 | 3 cold launches, no crash-reporter dialog |
| R-5 Pluto launch | TC-4(a)(b) | Pluto opens in browser, REPL usable alongside |

Regression failures block all Sprint 5 tasks.

---

## Spike A Tests — `--cli-data-dir` (SC-3)

### TC-A1 — Flag addition (Antigravity-executable, T-spike-A-1 gate)
1. Antigravity shows diff of main.js after adding `--cli-data-dir` arg.
**Pass:** Diff adds exactly two lines (`'--cli-data-dir',` and `SERVER_DATA_DIR,`)
in the `spawnServer` args array; no other changes.
**Fail:** Any other lines changed.

### TC-A2 — Runtime launch with flag (manual — John)
1. `npm start`; wait for workbench.
2. If workspace-trust dialog appears, click "Yes, I trust."
3. Clean-quit (✕). Run process check.
**Pass:** Launch succeeds; no crash; zero spawned-tree processes after quit.
**Fail:** 10048 port error, crash, or stale processes after quit.

### TC-A3 — File inspection post-launch (Antigravity-executable, T-spike-A-2 gate)
1. Antigravity lists all files in `server-data/` modified or created since
   T-spike-A-1 was applied.
**Pass:** Report produced; any `state.vscdb`, `trust.json`, or similar files
are identified and noted.

### TC-A4 — Revert (Antigravity-executable, T-spike-A-revert gate)
1. Antigravity shows diff of reverted main.js.
**Pass:** Diff removes exactly the two lines added in TC-A1; result matches
`sprint4-complete` for `spawnServer`.

---

## Spike B Tests — H1/H2 Discriminator (SC-4)

### TC-B1 — Pre-test globalStorage baseline (Antigravity-executable, T-spike-B-pre gate)
1. Antigravity lists `server-data/data/User/globalStorage/julialang.language-julia/`
   with full paths, sizes, and modification timestamps.
**Pass:** Listing produced; baseline recorded.

### TC-B2 — Telemetry dismissal test (manual — John)
1. `npm start`. Wait for julia-vscode to activate.
2. If a telemetry notification appears in the notification area or the julia-vscode
   panel, click "No" (or equivalent dismissal).
3. If no notification appears, note that it is already dismissed (possible H2
   evidence) and proceed.
4. Clean-quit (✕).
5. `npm start`. Observe whether the telemetry notification reappears.
6. Clean-quit.
7. Report: H2 (notification stays dismissed) or H1 (notification reappears).
**Pass:** Unambiguous H1 or H2 result is reported and recorded in ADR-017.

### TC-B3 — Post-test globalStorage comparison (Antigravity-executable, T-spike-B-post gate)
1. Antigravity lists the same directory as TC-B1.
2. Antigravity diffs pre/post listings.
**Pass:** Delta report produced; any new or modified files noted.

---

## Spike J Tests — juliaExt.exports API (gates SC-2 path)

### TC-J1 — Log addition + build (Antigravity-executable, T-spike-J-1 gate)
1. Antigravity shows diff of extension.ts adding the exports console.log.
2. Build succeeds (`npm run build:ext`).
**Pass:** Diff adds exactly one `console.log` line after `await ensureJuliaExtension()`;
`npm run build:ext` exits 0.

### TC-J2 — Runtime exports capture (manual — John)
1. `npm start`.
2. In the Electron DevTools (or terminal stdout), find lines starting with
   `[spike-j]`.
3. Copy and report the logged exports keys.
**Pass:** At least one `[spike-j]` line appears in the output; keys are reported.
**Null result (acceptable):** `[spike-j] []` — empty exports, confirming Path B.

### TC-J3 — Revert (Antigravity-executable, T-spike-J-revert gate)
**Pass:** Diff removes exactly the one console.log line added in TC-J1; build
succeeds after revert.

---

## KI-2 Test — Resize Flash (SC-1)

### TC-KI2 — Resize smoke (manual — John, gates T-KI2)
1. Launch JuliaLab (`npm start`).
2. Drag-resize the window rapidly: pull the right edge left and right at least
   10 times in ~3 seconds; drag the bottom edge up and down 5 times.
**Pass (SC-1):** No black flash visible between the ribbon and workbench panes
at any point during the resize sequence.
**Partial (SC-1 ⚠️):** Black flash visible on any resize event. Root cause
recorded in ADR-018 as H2 (BaseWindow repaint); no further fix attempted in
Sprint 5.

### TC-KI2-reg — Regression (run after T-KI2)
Re-run R-1 through R-5. All must still pass.

---

## KI-3 Test — REPL Start (SC-2)

*Only run if Spike J (SC-2 path A) yields a ready signal. Skip if Path B.*

### TC-KI3 — Race-free REPL start (manual — John, gates T-KI3)
1. Cold-launch three times in succession (clean-quit between).
**Pass:** No julia-vscode crash-reporter dialog on any of the three launches;
REPL is interactive (type `1+1`, get `2`) without additional user intervention.
**Fail:** Any crash-reporter dialog appears.

### TC-KI3-reg — Regression (run after T-KI3)
Re-run R-1, R-4. Both must still pass.

---

## KI-5 Test — GitHub Remote (SC-5)

### TC-KI5 — Remote verification (Antigravity-executable, T-KI5 gate)

```powershell
cd 'C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp'
git remote -v
git push --dry-run origin main
```

**Pass (SC-5):** `git remote -v` shows `origin` pointing to the expected GitHub
URL; `git push --dry-run` exits 0.
**Fail:** No `origin` remote, wrong URL, or push dry-run error.

---

## Sprint 5 Exit Criteria

All of the following must be true before the sprint is tagged:

| Criterion | Test(s) | Required result |
|---|---|---|
| SC-1 | TC-KI2 | Pass or documented ⚠️ with H2 rationale |
| SC-2 | TC-J1/J2/J3 + TC-KI3 (if Path A) | Path A green or Path B documented |
| SC-3 | TC-A1/A2/A3/A4 | ADR-017 outcome section filled |
| SC-4 | TC-B1/B2/B3 | ADR finding section filled |
| SC-5 | TC-KI5 | Pass |
| Regressions | R-1 through R-5 | All pass |

Sprint exit tag: `sprint5-complete`

---

## Notes on Verification Discipline

Per `.antigravity/rules.md`: never quit JuliaLab via `taskkill /IM electron.exe`
during verification. Use the window ✕ control. The `before-quit → killServer()`
code path is what is under test; bypassing it invalidates teardown verification.

For spike tasks: Antigravity reports diffs and file listings; John confirms before
apply. Revert tasks are always the final step of every spike, regardless of
outcome.
