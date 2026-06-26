# ADR-014: Workspace-Panel Persistence Mechanism
**Date:** 2026-06-25
**Status:** Resolved — Spike E shows SC-2 already satisfied; no code change

## Context
SC-2 required the Julia Workspace panel visible on every cold launch. The
suspected cause was the one-shot `applyLayoutIfFirstOpen()` running its
`julia-explorer` open only once.

## Spike E Result
Manual spike (2026-06-25):
- On 2nd+ cold launches the WORKSPACE panel is visible without a click.
- The integrated terminal does **not** auto-open on relaunch and the editor has
  focus — i.e. the one-shot preset is correctly NOT re-running. The panel's
  visibility therefore comes from VSCodium's own view-restoration/default
  behaviour, not from the preset re-firing.
- Manual sidebar changes (e.g. switching to Search) do not persist across
  launches; the sidebar returns to the Julia view container.

## Decision
**No code change.** SC-2 is satisfied as-is. T5 is demoted from an
implementation task to a regression-verification checkpoint in the Test Plan
(TC-2). The previously proposed un-gating of the `julia-explorer` command is
unnecessary and is NOT applied (re-running it every launch would risk overriding
user layout changes — the regression ADR-014 originally warned about).

## Note on the non-persistence of manual sidebar changes
That manual changes do not persist is the same serve-web state-persistence
anomaly tracked in SDD §8 (H1/H2). It is benign for SC-2 (the default IS the
Julia view) and is not addressed here; it is a Sprint 5 investigation flag.
