# Project Plan
**Project:** JuliaLabShell — Electron/VSCodium Chrome Proof-of-Concept
**Version:** 0.1
**Date:** 2026-06-22
**Author:** John Peach / eurAIka

---

## Milestones

| # | Milestone | Gate Criterion | Depends On |
|---|---|---|---|
| M1 | Project scaffold | `npm run dev` launches a blank Electron window without errors | — |
| M2 | Ribbon chrome | Frameless Electron window shows MATLAB-style ribbon with window controls functional | M1 |
| M3 | VSCodium subprocess | VSCodium launches as child process with chrome suppressed (no title bar, no menu bar) | M2 |
| M4 | Window alignment | VSCodium window positions and stays locked below ribbon on launch, resize, and focus cycle | M3 |
| M5 | PoC gate | All four SC checks pass in a single session; screenshot taken; verdict recorded | M4 |

---

## Dependency Lock

All versions pinned before any task touches dependencies.

| Library | Pinned Version | Purpose |
|---|---|---|
| electron | 39.8.8 | Shell runtime — matches VSCodium's bundled Electron |
| electron-builder | 25.1.8 | Provides `npm run dev` via `electron .` wrapper |
| Node.js | 22.22.1 | Runtime (system-installed, not npm dependency) |
| VSCodium | 1.121.03429 | Editor subprocess — do not update during PoC |

No other runtime npm dependencies permitted during the PoC.
Any proposed addition requires escalation to this chat before a task is written.

---

## Integration Checkpoints

| After Milestone | Checkpoint Action |
|---|---|
| M2 | Screenshot of ribbon in Electron window — confirm geometry matches MATLAB before VSCodium work begins |
| M4 | Full SC-1 + SC-4 pre-check — confirm chrome suppression and alignment before running complete gate |
| M5 | Final integration test per TEST_PLAN.md — all four SCs, single session, screenshot |

---

## Task Sequencing

```
M1: Scaffold
  T001  package.json + main.js skeleton (Electron window, no content)
  T002  preload.js + contextBridge skeleton
  T003  index.html + renderer.js skeleton

M2: Ribbon
  T004  ribbon.css (MATLAB geometry, tab labels, window control buttons)
  T005  Wire window controls (minimize/maximize/close) via IPC

M3: VSCodium subprocess
  T006  Write vscodium-data/User/settings.json (chrome suppression settings)
  T007  Spawn VSCodium subprocess in main.js with correct args
  T008  Emit vscodium:status IPC events; display status in renderer

M4: Window alignment
  T009  PowerShell SetWindowPos call — initial positioning on spawn
  T010  Re-position VSCodium on Electron window move and resize events

M5: PoC gate
  T011  README.md (launch instructions, PoC verdict template)
        → Run full integration test per TEST_PLAN.md
        → Record verdict + screenshot
        → Commit final state
```

---

## Definition of Done (Project)

The PoC is done when:

1. `npm run dev` launches cleanly from `JuliaLabShell/` on John's machine
2. All four Success Criteria (SC-1 through SC-4) pass in a single session
3. A screenshot is committed to `docs/poc-screenshot.png` showing SC-1 and SC-4
4. A one-paragraph verdict is appended to `README.md` stating pass or fail
   and the recommendation for next steps

A passing verdict triggers planning for the full JuliaLab rewrite.
A failing verdict triggers a root-cause analysis in this chat before any
further work proceeds.
