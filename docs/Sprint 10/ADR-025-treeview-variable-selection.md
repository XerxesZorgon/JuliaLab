# ADR-025: Custom TreeView for Workspace Variable Selection
**Date:** 2026-07-11
**Status:** Accepted

## Context

Sprint 9's Plot Builder selected variables via `<select>` dropdowns
inside a webview panel, populated by `getWorkspaceVars()`. Sprint 10's
redesign (SDD-plotbuilder-redesign.md) requires variable selection to
happen *before* plot-type selection, MATLAB-Workspace-pane-style, and to
persist independently of ribbon interactions — a webview panel that gets
torn down/rebuilt doesn't fit that model well (this was in fact the
proximate cause of Sprint 9 backlog #6).

Two options were considered for the selection surface itself: reuse
julia-vscode's own built-in Workspace panel (if it exposes a selection
API), or build a custom one.

## Decision

Build a custom `vscode.TreeView` via `vscode.window.createTreeView()`,
registered as its own contributed view, populated by Sprint 9's existing
`getWorkspaceVars()` file-based discovery mechanism. Use the TreeView's
`onDidChangeSelection` event to track selected variables, with
`canSelectMany: true`. Selection order maps to plot role (X/Y/Z) per the
order variables were added to the selection.

## Rationale

- **VS Code's `TreeView` API is officially documented and stable** —
  `createTreeView`, `TreeDataProvider`, `onDidChangeSelection` are all
  part of the public extension API, unlike julia-vscode's internal
  Workspace panel implementation, which research found no evidence of
  being exposed for third-party consumption (julia-vscode's own
  documented extension API, as of the last confirmed release notes,
  exports only `getJuliaPath()`/`getEnvironment()`).
- **Reuses proven infrastructure.** `getWorkspaceVars()` is already
  built, tested, and working (Sprint 9 Task 003) — this ADR adds a
  presentation layer over existing data, not a new data-discovery
  mechanism.
- **A persistent sidebar view is a better structural match for MATLAB's
  Workspace pane** than a webview panel ever was — it doesn't get torn
  down by ribbon interaction, doesn't require CSP/nonce/inline-script
  workarounds (Sprint 9's hardest-won lesson), and is a more natural fit
  for "always visible, click to select" UX.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Reuse julia-vscode's own Workspace panel selection | No confirmed API for third-party extensions to read its selection state; betting Sprint 10 on an unverified internal API was judged too risky given this project's repeated experience this cycle with incorrect julia-vscode API assumptions (`executeJuliaCodeInREPL`, shell integration) |
| Keep variable selection in a webview (just reordered to come first) | Doesn't solve the underlying problem — a webview-based selector is still subject to the same lifecycle/reset issues that caused backlog #6 in the first place; also re-inherits the inline-script/CSP constraint for no benefit |

## Consequences

**Easier:**
- Selection state naturally persists across ribbon interactions, since
  it lives in a VS Code-managed TreeView, not a webview we control the
  lifecycle of — directly solves backlog #6.
- No CSP/nonce/service-worker concerns at all — TreeViews don't load
  arbitrary HTML/JS the way webviews do.

**Harder / now locked in:**
- Selection-order-as-role (X/Y/Z) is a UX convention that must be
  clearly communicated to the user (e.g. visual numbering or highlight
  order in the tree) — not yet designed, needed in the DESIGN doc.
- `getWorkspaceVars()`'s file-based watch-and-read cycle (Sprint 9's
  atomic-rename fix) will need to run more frequently if the TreeView is
  expected to refresh live as the workspace changes, rather than only
  on-demand — performance/UX tradeoff to address in DESIGN, not decided
  by this ADR.
