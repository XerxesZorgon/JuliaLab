# Test Plan — Sprint 2
**Project:** JuliaLabApp
**Date:** 2026-06-23

---

## Spike Acceptance Criteria (Task 001)

| SC | Criterion |
|---|---|
| SPIKE-1 | `codium --install-extension julialang.language-julia --extensions-dir server-data/extensions --force` completes without error and places files in `server-data/extensions/` |
| SPIKE-2 | Cold launch after install shows Julia extension listed as installed in workbench Extensions panel |
| SPIKE-3 | Activity bar visible after removing `workbench.activityBar.visible: false` from settings.json |

---

## Sprint 2 Acceptance Criteria

All eight must pass (SC-3, SC-4 may be ADVISORY FAIL with documented reason).

| SC | Criterion | Pass Definition |
|---|---|---|
| SC-1 | Activity bar visible | Left icon strip present on cold launch |
| SC-2 | Julia extension active | `.jl` file → syntax highlighting; Julia panel in activity bar |
| SC-3 | Lean4 extension active | `.lean` file → syntax highlighting; infoview accessible. Advisory if elan absent. |
| SC-4 | Wolfbook active | `.wb` file → Wolfbook UI renders; kernel connects. Advisory if Wolfram Engine absent. |
| SC-5 | Claude Code active | Claude Code icon in activity bar; clicking opens panel with sign-in or session UI |
| SC-6 | detect-deps runs | Terminal shows dependency detection log lines on launch; `server-data/Machine/settings.json` contains discovered paths |
| SC-7 | Missing dep warning | Rename `julia.exe` temporarily; relaunch; confirm warning dialog names Julia and provides install URL; rename back |
| SC-8 | No Sprint 1 regressions | Window controls, resize tracking, clean shutdown all pass |

---

## Failure Protocol

1. `FAIL: [SC-N] — [exact observation]`
2. Do NOT fix inline.
3. Revert last change.
4. Escalate to planning thread.

SC-3 and SC-4 may be ADVISORY FAIL if prerequisites not installed —
document as known gap, does not block sprint2-complete tag.
