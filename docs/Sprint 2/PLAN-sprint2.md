# Project Plan — Sprint 2
**Project:** JuliaLabApp
**Date:** 2026-06-23

---

## Milestones

| # | Milestone | Gate Criterion | Depends On |
|---|---|---|---|
| M0 | Spike passed | SPIKE-1 through SPIKE-3 green | Sprint 1 complete |
| M1 | Settings updated | Activity bar visible on cold launch | M0 |
| M2 | detect-deps wired | Dependency paths written to settings on launch; missing dep dialog works | M1 |
| M3 | Extensions installed | All four extensions active in workbench | M2 |
| M4 | Sprint 2 complete | SC-1 through SC-8 verified; `sprint2-complete` tagged | M3 |

---

## Dependency Lock

| Dependency | Version | Notes |
|---|---|---|
| Electron | 39.8.8 | Unchanged |
| VSCodium | 1.121.03429 | Unchanged |
| julialang.language-julia | TBD Task 001 | Pin after spike |
| leanprover.lean4 | TBD Task 001 | Pin after spike |
| wolfbook.wolfbook | TBD Task 001 | Pin after spike |
| Anthropic.claude-code | TBD Task 001 | Pin after spike |

---

## Task Sequence

```
Task 001  Spike — verify codium CLI install + extension directory (M0)
Task 002  server-data/Machine/settings.json — re-enable activity bar (M1)
Task 003  scripts/detect-deps.js — discover tool paths, update settings, warn if missing (M2)
Task 004  main.js — wire detectDeps() into app.whenReady() before spawnServer() (M2)
Task 005  scripts/install-extensions.js — install four extensions (M3)
Task 006  Run install script + full SC verification (M4)
```

One file per task. Tasks 003 and 004 are the most complex.
Task 003 must be fully reviewed before Task 004 begins.

---

## Wolfram Settings Key (resolve before Task 003)

Before writing detect-deps.js, verify the exact settings key wolfbook
uses for the kernel path. Check:
- wolfbook extension README on Open VSX
- wolfbook extension package.json `contributes.configuration` section

Likely key: `wolfbook.wolframExecutablePath` — confirm before Task 003.
Also confirm the lean4 extension key for toolchain path:
likely `lean4.toolchainPath` or `lean4.executablePath`.

---

## Integration Checkpoints

| After task | Checkpoint |
|---|---|
| Task 001 | Pin extension versions. Confirm wolfbook and lean4 settings keys. |
| Task 002 | Activity bar visible on cold launch. Commit. |
| Task 004 | detect-deps log visible on launch; settings.json has discovered paths. Commit. |
| Task 006 | All SC criteria verified. Tag sprint2-complete. |
