# tasks.md — Sprint 10

---

## Task 001: Feasibility spike — reactive triggering end-to-end
**Status:** [ ] Pending
**Milestone:** M1 (Foundation — gates everything)
**Depends on:** —

### What to do
Prove the core ADR-026 bet before building anything else: a minimal path
where selecting variables (any working mechanism, doesn't need to be the
final TreeView) and changing plot type produces immediate REPL execution
with no manual trigger. This is the single biggest unknown in this
sprint's design — same spike-first discipline as Sprint 9 Task 001.

### Files touched
- `extensions/julialab/src/extension.ts` — temporary diagnostic wiring

### Acceptance Criterion
Per TEST_PLAN-sprint10 §0: demonstrate the reactive path at least once,
end to end. **Binary pass/fail, with ADR-026's fallback pre-authorized on
fail** — report back either way, do not silently substitute the fallback.

### On Failure
Report exact observed behavior (REPL output, errors, timing issues).
Invoke ADR-026's fallback clause explicitly — update that ADR's
Consequences section — rather than quietly reverting.

---

## Task 002: TreeView registration + container placement
**Status:** [ ] Pending
**Milestone:** M2 (Selection surface)
**Depends on:** Task 001 (confirmed, either outcome)

### What to do
Register the `PlotVariablesProvider` and `createTreeView` call (DESIGN
§4.1). Test the unverified assumption that contributing into
julia-vscode's `julia-explorer` container works as expected.

### Files touched
- `extensions/julialab/src/extension.ts`
- `extensions/julialab/package.json` (`contributes.views`)

### Acceptance Criterion
Per TEST_PLAN §1: view appears somewhere, report exactly where. If the
`julia-explorer` container rejects the contribution, that's a real
finding requiring a fallback container decision — report back, don't
guess at a fix.

### On Failure
Report exact error or placement outcome.

---

## Task 003: TreeView data population
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** Task 002

### What to do
Wire `getWorkspaceVars()` (Sprint 9, unchanged) into
`PlotVariablesProvider.refresh()`. Confirm filtering (`Base`/`Core`/
`Main`/self-reference) still applies — decide whether it lives here or
stays in `getWorkspaceVars()` itself.

### Files touched
- `extensions/julialab/src/extension.ts`

### Acceptance Criterion
Per TEST_PLAN §2: real variables appear in the view, noise filtered out.

### On Failure
Report what appeared (or didn't) in the tree.

---

## Task 004: Selection-order tracking
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** Task 003

### What to do
Implement the diff-based ordered-selection algorithm (DESIGN §5.1) —
NOT trusting raw `.selection` order.

### Files touched
- `extensions/julialab/src/extension.ts`

### Acceptance Criterion
Per TEST_PLAN §3: click-order and reselect-after-deselect edge case both
verified via temporary probe file, matching the exact sequences described
in the test plan.

### On Failure
Report exact click sequence and observed vs. expected order.

---

## Task 005: `PersistentPlotState` + `regeneratePlot()` chokepoint
**Status:** [ ] Pending
**Milestone:** M3 (Regeneration engine)
**Depends on:** Task 004

### What to do
Implement the module-level state object and `regeneratePlot()`/
`minVarsNeeded()` per DESIGN §5.2. At this point `regeneratePlot()` can
be a no-op stub for the actual code-gen call (Task 006 not done yet) —
verify the guard logic and chokepoint wiring in isolation first.

### Files touched
- `extensions/julialab/src/extension.ts`

### Acceptance Criterion
Per TEST_PLAN §4: guard correctly no-ops below `minVarsNeeded`, correctly
proceeds (to the stub) once enough variables are selected.

### On Failure
Report guard behavior at each variable-count threshold.

---

## Task 006: Port `generatePlotCode()`/`buildCallArgs()` to TypeScript
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** Task 005

### What to do
Direct port from `plot-builder.js` (Sprint 9) to `extension.ts`,
per DESIGN §5.3. Mechanical translation, not a redesign — same StatsPlots
preamble logic, same theme-as-statement handling, same Q4/Q5 dispatch.

### Files touched
- `extensions/julialab/src/extension.ts`

### Acceptance Criterion
Per TEST_PLAN §5: re-run Sprint 9's own S9-005 table — every row's
generated code must match exactly what Sprint 9 produced for the same
inputs.

### On Failure
Report which row(s) mismatch, actual vs. expected code.

---

## Task 007: Wire TreeView selection → `regeneratePlot()`
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** Task 004, Task 006

### What to do
Connect Task 004's selection tracking to Task 005/006's regeneration
chokepoint — replace the stub from Task 005 with the real call.

### Files touched
- `extensions/julialab/src/extension.ts`

### Acceptance Criterion
Selecting enough variables triggers real REPL execution and a rendered
plot, using whatever default `plotConfig` exists at this point (ribbon
wiring is Task 008, not done yet — acceptable to test with a hardcoded
default type for this task alone).

### On Failure
Report REPL output, including any errors.

---

## Task 008: Live ribbon updates — `julialab.updatePlotConfig` + `renderer.js`
**Status:** [ ] Pending
**Milestone:** M4 (Ribbon integration)
**Depends on:** Task 007

### What to do
New WS command receiving live `plotConfig` updates on EVERY FIGURES
ribbon interaction (not just a Plot-button click) — real behavior change
from Sprint 9's `renderer.js`. Wire the handler to call
`regeneratePlot()` after updating `plotState.plotConfig`.

### Files touched
- `extensions/julialab/src/extension.ts`
- `renderer.js`

### Acceptance Criterion
Per TEST_PLAN §6: toggling STYLE/AXES with variables already selected
triggers immediate regeneration; changing plot type after style/axes are
set preserves those options in the new generated code (the actual
backlog #6 fix).

### On Failure
Report which specific interaction failed to trigger regeneration or lost
previously-set options.

---

## Task 009: Full integration test
**Status:** [ ] Pending
**Milestone:** M4
**Depends on:** Task 001-008, all green

### What to do
No code change — John runs TEST_PLAN §7's three flows (scatter,
histogram, boxplot) using the complete new interaction model.

### Files touched
- None (verification only)

### Acceptance Criterion
All 3 flows succeed per TEST_PLAN §7.

### On Failure
Report which flow failed and at which step.

---

## Task 010: Regression + teardown + tag `sprint10-complete`
**Status:** [ ] Pending
**Milestone:** M5 (Close)
**Depends on:** Task 009 green

### What to do
Full regression pass per TEST_PLAN §8 (Sprint 9 feature table + backlog
#6 non-reproduction check), teardown verification (John-only, single
controlled cycle — no force-killing before inspecting, per Sprint 9's own
mistake).

### Files touched
- None (verification + git tag)

### Acceptance Criterion
Sprint 9 feature table fully ✓, backlog #6 confirmed non-reproducible,
teardown clean. Tag pushed to `origin/main`.

### On Failure
Report which regression row failed or what remained after teardown.
