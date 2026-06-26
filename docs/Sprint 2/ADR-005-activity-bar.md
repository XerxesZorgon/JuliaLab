# ADR-005: Re-enable VSCodium activity bar in Sprint 2
**Date:** 2026-06-23
**Status:** Accepted

## Context

Sprint 1 suppressed the activity bar provisionally. Sprint 2 installs
extensions whose primary UIs (Claude Code panel, Wolfbook kernel panel,
Lean4 infoview, Julia REPL) are activity bar panels. The MATLAB left
strip provides analogous panel navigation.

## Decision

Remove `workbench.activityBar.visible: false` from
`server-data/Machine/settings.json`.

## Consequences

Extension UIs immediately accessible. Sprint 3 may replace the
activity bar with ribbon panel toggles; that decision is deferred.
