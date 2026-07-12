# tasks.md — Sprint 11

## Task 001: Ribbon buttons + Grid mutual-exclusion + live update wiring
**Status:** [ ] Pending
**Depends on:** —
**Files:** `index.html`, `ribbon.css`, `renderer.js`

Add Subtitle/Colorbar/X-Grid/Y-Grid buttons; implement the nested
radio-group exclusion for Grid/X-Grid/Y-Grid per DESIGN §2; wire live
updates via existing `julialab.updatePlotConfig`.

**Acceptance:** per TEST_PLAN §3 — grid triad behaves correctly, other
AXES toggles unaffected.

## Task 002: Code generation kwargs
**Status:** [ ] Pending
**Depends on:** Task 001
**Files:** `extensions/julialab/src/extension.ts`

Add subtitle/colorbar/grid-triad kwargs to `generatePlotCode()` per
DESIGN §3.

**Acceptance:** per TEST_PLAN §1, §2 — correct kwargs generated, correct
rendering.

## Task 003: Regression + teardown + tag `sprint11-complete`
**Status:** [ ] Pending
**Depends on:** Task 002
**Files:** none (verification + tag)

Per TEST_PLAN §4-5.
