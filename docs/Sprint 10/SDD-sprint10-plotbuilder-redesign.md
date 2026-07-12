# Software Description Document — Plot Builder Interaction Redesign
**Project:** JuliaLabApp
**Sprint:** 10
**Version:** 0.1
**Date:** 2026-07-11
**Author:** John Peach / eurAIka
**Depends on:** SDD-plot-builder.md (Sprint 8/9), ADR-024, DESIGN-sprint9.md, Sprint 9 backlog #6

---

## 1. Purpose

Sprint 9 shipped a working Plot Builder with a ribbon-config-first,
webview-variables-second, manual-Run-triggered flow. Manual testing
surfaced a real usability problem (backlog #6): reopening the webview
resets in-progress variable selections, and more broadly, the sequencing
felt backwards compared to how MATLAB users expect plotting to work.

This sprint redesigns the interaction model, informed directly by
MATLAB's own Workspace→Plots→Figure sequence (see prior-art discussion,
2026-07-11 chat), adapted — not copied — to this app's single-FIGURES-tab
structure and to a genuine architectural advantage this app has over
MATLAB: because plots are generated as Julia source code from a
persistent state object rather than mutating a live figure, formatting
can be preserved across plot-type changes in a way MATLAB itself doesn't
attempt.

## 2. Target User Flow

```
User selects variable(s) from a workspace-variable source
  (source TBD — see Open Question 1)
  → User selects a PLOT TYPE on the ribbon
    → Plot renders IMMEDIATELY — no separate Run click
  → User toggles STYLE/AXES options on the ribbon
    → Plot regenerates, incorporating the new option
      (exact trigger mechanism TBD — see Open Question 2)
  → User selects a DIFFERENT plot type
    → Plot regenerates with the new type
      AND retains all previously-set STYLE/AXES formatting
      (this is the core fix for backlog #6, and the explicit
      divergence from MATLAB's own behavior, which clears
      formatting on plot-type change when reusing a figure)
```

## 3. Architecture

### 3.1 Persistent plot state (core change from Sprint 9)

Sprint 9's `plotConfig` was read once per Run click and discarded —
effectively transient, owned by the webview's local JS state for the
duration of one panel session. This redesign requires plot state to
**persist across multiple regenerations**, which means it can no longer
live solely in a webview that might not even exist for the full session
(see Open Question 3).

Proposed: a persistent state object owned by the **extension host**
(survives ribbon dispatch calls, independent of any webview lifecycle):
```typescript
interface PersistentPlotState {
  selectedVars: { x: string | null; y: string | null; z: string | null };
  plotConfig: { type: string | null; style: string[]; axes: string[] };
}
```
Every ribbon interaction (plot type, style toggle, axes toggle) updates
this state and triggers regeneration from the **full accumulated state**,
not just the single new selection — this is what makes formatting
persistence "free" architecturally: we're not preserving old figure
state, we're just not forgetting to include it in the next generated
expression.

### 3.2 Variable selection source — see Open Question 1

Two real options, not yet decided:

**(a) Reuse julia-vscode's existing workspace variable panel.** Per this
project's own Sprint 6 learnings (already documented): "julia-vscode
(v1.219.2) already provides workspace variable panels... no need to
reimplement." If that panel exposes a selection API or event we can hook
into, this eliminates the need for Sprint 9's custom file-based
`getWorkspaceVars()` polling mechanism entirely for the purposes of *this*
feature (it may still be needed elsewhere) and gets us MATLAB's actual
click-to-select-in-Workspace-pane behavior for free.

**(b) Keep a custom variable-selection surface** (could still be a
webview, but variables-first instead of variables-last) if julia-vscode's
panel doesn't expose what we need programmatically.

This determines a meaningful amount of downstream design and should be
resolved via a spike before the rest of this SDD's remaining sections are
finalized — see Open Question 1.

### 3.3 Regeneration trigger

Plot-type selection triggering immediate render is explicit in the agreed
success criterion. Less clear: does *every* STYLE/AXES toggle also
immediately regenerate and re-execute in the REPL? Real UX tradeoff, not
just an implementation detail — see Open Question 2.

## 4. Open Questions (must resolve before DESIGN doc)

1. **Variable selection source — DECIDED (2026-07-11).** Build a custom
   VS Code `TreeView` (via `vscode.window.createTreeView()` +
   `onDidChangeSelection` — officially documented VS Code API, not
   dependent on julia-vscode internals), populated by Sprint 9's already-
   proven `getWorkspaceVars()`. Rejected: relying on julia-vscode's own
   Workspace panel exposing a selection API — research found no
   confirmed evidence this is exported for third-party consumption (the
   only documented julia-vscode extension API exports `getJuliaPath()`/
   `getEnvironment()`, nothing selection-related), and betting Sprint 10
   on an unverified internal API was judged too risky given this
   project's repeated experience this cycle with incorrect API
   assumptions.

   **X/Y/Z role-assignment — DECIDED (2026-07-11).** Selection order
   determines role (first selected = X, second = Y, third = Z if needed).
   Confirmed against MATLAB's actual behavior via direct testing: John
   selected `y` then `theta` in MATLAB's Workspace pane, and MATLAB
   plotted `y` on the X-axis, `theta` on the Y-axis — exactly the
   selection-order convention proposed here.

2. **Regeneration trigger granularity — DECIDED (2026-07-11), pending
   feasibility spike.** Target: every STYLE/AXES ribbon toggle immediately
   regenerates and re-executes in the REPL, matching MATLAB's own
   immediate-update behavior. **Explicit fallback, pre-agreed:** if this
   proves difficult to implement cleanly (e.g. REPL/terminal churn from
   rapid clicking, or timing issues echoing Sprint 9's own debugging
   history), drop back to the existing manual **Plot** button as the
   trigger instead of fully reactive updates. This is not a decision to
   revisit mid-implementation without flagging it back to this thread —
   if the fallback is needed, that's worth a note in this SDD, not a
   silent scope-narrowing.

3. **Does the Plot Builder webview panel still exist — LIKELY RESOLVED
   (2026-07-11), pending DESIGN doc confirmation.** With variable
   selection moved to a TreeView and regeneration triggered immediately
   by ribbon interaction (Question 2), the original webview's three jobs
   (variable dropdowns, config summary, Run button) all appear to be
   subsumed elsewhere. Current expectation: **the webview panel is
   eliminated entirely.** Flagging as "likely" rather than fully decided
   since the DESIGN doc may surface a reason to keep a minimal panel
   (e.g. if the config summary display turns out to be useful feedback
   the ribbon itself can't easily show) — but the default assumption
   going into DESIGN is no webview.

4. **New Figure vs. Reuse Figure — DECIDED (2026-07-11).** Reuse-only for
   Sprint 10. A New Figure toggle (as MATLAB has) is out of scope; not
   scheduled, not backlogged separately unless it becomes relevant later.

**Next step:** confirm the X/Y/Z role-assignment default (above), then
write ADR(s) for the TreeView architecture and the reactive-update
mechanism before the DESIGN doc.

## 5. Explicitly Out of Scope (per agreed scope, 2026-07-11)

- MATLAB-parity feature additions (Subtitle, Colorbar, X/Y-Grid split,
  text arrow) — backlog #8, separate future sprint
- Sprint 8 regressions (Instantiate, Go to Def, Forward/Back) — backlog
  #7, separate future sprint
- Any change to the underlying `Plots.jl` code-generation logic itself
  (`generatePlotCode`/`buildCallArgs`) beyond what's needed to support
  persistent state — Sprint 9's code-gen is proven correct and is being
  reused, not rewritten
