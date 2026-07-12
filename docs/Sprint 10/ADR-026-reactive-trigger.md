# ADR-026: Reactive Regeneration Trigger (with Pre-Agreed Fallback)
**Date:** 2026-07-11
**Status:** Accepted (conditional — see Fallback clause)

## Context

Sprint 9's Plot Builder required an explicit Run click to generate and
execute Julia code. SDD-plotbuilder-redesign.md's agreed success
criterion targets MATLAB's immediate-update behavior: selecting a plot
type renders immediately; changing STYLE/AXES options regenerates the
plot live, without a manual trigger.

This is a genuine feasibility unknown, not a settled design — Sprint 9's
own history (the shell-integration dead end, the service-worker webview
bug) showed that plausible-sounding VS Code/julia-vscode integration
approaches can fail in ways that aren't discoverable without building and
testing them.

## Decision

Implement reactive regeneration: every ribbon interaction on the FIGURES
tab (plot type, STYLE toggle, AXES toggle) — once at least the minimum
required variables are selected in the TreeView (ADR-025) — triggers
`generatePlotCode()` + `terminal.sendText()` immediately, using the full
persistent `PlotState` (SDD §3.1), not just the single changed option.

**Fallback clause, pre-agreed and binding:** if this proves difficult to
implement cleanly — e.g. REPL/terminal spam from rapid sequential
toggles, race conditions between overlapping `sendText()` calls, or any
other concrete technical obstacle — the fallback is reverting to the
existing manual **Plot** button as the explicit trigger, keeping the
persistent-state architecture (ADR-025, `PlotState`) but not the
fully-reactive UX. This fallback requires no further design discussion to
invoke — it was agreed as acceptable in advance (2026-07-11) — but MUST
be explicitly noted back to this thread and recorded in this ADR's
Consequences section if used, not silently substituted.

## Rationale

- Matches the agreed success criterion and MATLAB's own behavior as
  closely as this app's architecture allows.
- The persistent `PlotState` (ADR-025's companion architecture) makes
  this comparatively low-risk to attempt: every regeneration already
  needs to read full accumulated state regardless of trigger mechanism,
  so reactive triggering is "call the same regeneration function more
  often," not a fundamentally different code path from the manual-button
  version.
- Pre-agreeing the fallback avoids a repeat of this sprint's pattern of
  multi-round debugging before acknowledging a dead end — if reactive
  triggering hits a real wall, there's already a sanctioned way out that
  doesn't require renegotiating scope mid-implementation.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Debounced regeneration (e.g. regenerate 300ms after last change) | Not requested; adds complexity (timer management, cancellation) for a problem (REPL spam) that may not materialize — premature optimization ahead of actually testing the naive immediate-trigger approach |
| Manual trigger only (status quo from Sprint 9) | Doesn't meet the agreed success criterion; only acceptable as the pre-agreed fallback, not the starting design |

## Consequences

**Easier:**
- No new "when do I regenerate" decision logic needed beyond "on any
  FIGURES ribbon interaction" — simple to reason about.

**Harder / risk, explicitly acknowledged:**
- Real risk of REPL/terminal noise if a user rapidly clicks through
  several STYLE/AXES toggles — each becomes a separate `sendText()` call
  and a separate REPL execution. Untested; this is exactly the kind of
  thing the fallback clause exists for.
- No debounce/queue means overlapping rapid triggers could produce
  out-of-order REPL execution if `sendText()` calls interleave badly —
  needs real testing, not just code review, before this ADR's Status can
  be considered fully validated rather than "accepted pending
  implementation."

**If the fallback is invoked:** this section must be updated to record
that reactive triggering was attempted and specifically why it was
abandoned, for the benefit of any future sprint reconsidering it.

## Spike Result (Task 001, 2026-07-11)

**Mechanism-level feasibility: confirmed.** Six rapid successive
`sendText()` calls (via repeated command palette invocation, alternating
between two plot variants) executed cleanly and in strict order
(`REPL[3]` through `REPL[8]`, no scrambling, no dropped calls, no visible
queuing lag), and the plot pane updated correctly for each. The core risk
this ADR flagged — overlapping/out-of-order execution under rapid
triggering — did not materialize at the mechanism level.

**Not yet fully validated:** this spike used repeated palette-command
invocation as a proxy for rapid ribbon interaction, not actual ribbon
click-toggling, which may have different timing characteristics (faster,
or bursty in a different pattern). Full validation continues through
Task 008 (live ribbon wiring) and Task 009 (integration test). Status
remains **Accepted**, upgraded from "pending feasibility spike" to
"mechanism validated, UX-level validation pending" — the fallback clause
remains available if Task 008 surfaces a problem this spike didn't.
