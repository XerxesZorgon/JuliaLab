# Test Plan — Sprint 10 Plot Builder Redesign
**Project:** JuliaLabApp
**Date:** 2026-07-11
**Depends on:** DESIGN-sprint10-plotbuilder-redesign.md, ADR-025, ADR-026

---

## Test Types

Manual verification only, consistent with Sprints 6-9 — no automated test
runner introduced. John runs all verification personally; teardown is
always John-verified, never Antigravity-declared, per established rules.

---

## Definition of Pass — by DESIGN component

### 0. Feasibility spike (DESIGN §7.3 — must run FIRST, gates everything else)
**Pass:** A minimal end-to-end path — select 2 variables via ANY working
selection mechanism (doesn't need to be the final TreeView yet if that's
not built), trigger a plot-type change, observe immediate REPL execution
with no manual Run click — is demonstrated at least once.
**Fail (informative, triggers ADR-026's fallback, not a bug to chase):**
reactive triggering produces REPL errors from overlapping/out-of-order
`sendText()` calls, or any other concrete obstacle. If this happens,
report back to the planning thread per ADR-026's explicit requirement —
do not silently fall back without updating that ADR's Consequences
section.

### 1. TreeView container placement (DESIGN §4.1)
**Pass:** A "Plot Variables" view appears, either inside julia-vscode's
`julia-explorer` container (preferred, per DESIGN's stated assumption) or
in a fallback location if that assumption doesn't hold. **Binary check:**
does the view appear at all, and where — report exactly, since this was
flagged as unverified.

### 2. TreeView data population
**Pass:** With real variables defined in the Julia REPL (e.g. `x`/`y` or
`θ`/`y`), the Plot Variables view lists them, using the same
`getWorkspaceVars()` mechanism already proven in Sprint 9 — `Base`/
`Core`/`Main`/self-reference noise should still be filtered (carrying
forward the same filtering Sprint 9's webview did, now needs to live in
`PlotVariablesProvider` or `getWorkspaceVars()` itself — confirm which,
report if filtering was dropped in the port).

### 3. Selection-order tracking (DESIGN §5.1)
**Pass:** Select variable A, then variable B (one at a time, ctrl-click
or equivalent) — confirm via whatever debug visibility is available
(e.g. a temporary probe file, same pattern as Sprint 9) that
`selectedVarsOrdered` is `[A, B]`, not `[B, A]` or unordered. Deselect A,
reselect it — confirm it's appended to the end (`[B, A]`), not
reinserted at its original position — this is the specific edge case the
diff-tracking algorithm needs to get right.
**Fail:** if order doesn't match click sequence, this is a real bug in
§5.1's diff logic, not a VS Code API limitation to route around — report
exact click sequence and observed order.

### 4. `regeneratePlot()` chokepoint + `minVarsNeeded` guard (DESIGN §5.2)
**Pass, two sub-cases:**
- With 0 or 1 variables selected (below `minVarsNeeded` for the current
  type), no REPL execution occurs — confirmed silent no-op, no error
  spam.
- Once enough variables are selected, REPL execution fires immediately
  without any additional click.

### 5. Code-gen port correctness (DESIGN §5.3)
**Pass:** Reuse Sprint 9's own TEST_PLAN S9-005 table exactly — same
plot-type/option combinations, same expected code shapes. This is a
regression check on the port, not new logic — if any row's generated
code differs from what Sprint 9 produced for the same inputs, that's a
porting bug (TS translation error), not a design problem.

### 6. Live ribbon updates (replaces Sprint 9's manual Plot-button flow)
**Pass:** With variables already selected (from step 3/4), toggle a
STYLE or AXES option on the ribbon — confirm the plot regenerates
immediately, incorporating the new option, WITHOUT losing the previously
selected variables or previously-set options (this is the actual fix for
backlog #6 — the core deliverable of this sprint).
**Specifically test:** change plot type after style/axes are already set
— confirm the new plot type's generated code still includes the
previously-set style/axes kwargs (formatting persistence across type
changes, per the agreed success criterion).

### 7. Full integration test
Repeat Sprint 9's TEST_PLAN S9-008 three flows (scatter, histogram,
boxplot) but using the NEW interaction model end-to-end: select variables
in TreeView first, then plot type, then style/axes — confirm each step
produces immediate visible results with no Run button anywhere in the
flow (unless ADR-026's fallback was invoked, in which case confirm the
Plot button still works as the trigger instead).

### 8. Regression
Full pass over Sprint 9's feature table (Tasks 001-008, all previously
✓) — confirm nothing broke. Also confirm Sprint 9 backlog #6 (the
original reset bug) is specifically no longer reproducible: open/close
whatever replaced the webview flow (or the TreeView panel) repeatedly,
confirm selections survive.

### Teardown
Same procedure as Sprint 9 Task 011 — John-only, close via ✕, run the
`Get-CimInstance` process check, confirm clean, single controlled cycle
(no force-killing processes before inspecting them — Sprint 9's own
teardown mistake, worth remembering not to repeat).

---

## Out of Scope for Sprint 10 Testing

- MATLAB-parity feature additions (backlog #8)
- Sprint 8 regressions unrelated to Plot Builder (backlog #7)
- New Figure vs. Reuse Figure toggle (explicitly out of scope per SDD §5)
- Automated test coverage

---

## Failure Protocol

Same as Sprint 9: report exact observed behavior (terminal output, error
text, visual state) — not characterizations. No fix-attempt loops by
Antigravity; revert to last verified commit and escalate to the planning
thread for diagnosis. ADR-026's fallback clause is the one pre-authorized
exception — but even that requires reporting back before being invoked,
not silent substitution.
