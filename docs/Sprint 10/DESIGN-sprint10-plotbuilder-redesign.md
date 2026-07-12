# Software Design Document — Sprint 10 Plot Builder Redesign
**Project:** JuliaLabApp
**Version:** 0.1
**Date:** 2026-07-11
**Author:** John Peach / eurAIka
**Depends on:** SDD-plotbuilder-redesign.md, ADR-025, ADR-026, Sprint 9 code (`getWorkspaceVars`, `generatePlotCode`/`buildCallArgs`)

---

## 1. Architecture Overview

```
TreeView (ADR-025)                    Ribbon (FIGURES tab)
"Plot Variables"                       renderer.js
      |                                     |
      |  onDidChangeSelection                |  EVERY plot-type/style/axes
      |  (diff-tracked, ordered)             |  interaction now sends live
      |                                      |  (not just on old Plot click)
      v                                      v
           Extension Host (extension.ts)
           - PersistentPlotState (module-level, survives all of the above)
           - regeneratePlot() — single chokepoint, called from BOTH
             selection changes and ribbon changes
                 |
                 v
           generatePlotCode()/buildCallArgs()
           — PORTED from plot-builder.js (TypeScript now, no webview)
                 |
                 v
           terminal.sendText(code, true)   [ADR from Sprint 9 errata]
                 |
                 v
              Julia REPL → plot pane
```

**No webview panel** (per SDD Open Question 3's resolution). Everything
lives in the extension host plus a TreeView plus the existing ribbon.

## 2. Component Breakdown

| Component | Responsibility | New or ported from Sprint 9? |
|---|---|---|
| `PlotVariablesProvider` (TreeDataProvider) | Feeds the TreeView its list of `WorkspaceVar[]` | New |
| TreeView selection tracking | Diff-based ordered selection list (see §5.1 — NOT the same as raw `.selection`) | New |
| `PersistentPlotState` | Module-level state: ordered selected vars + plotConfig | New (replaces Sprint 9's transient webview-local `currentPlotConfig`) |
| `regeneratePlot()` | Single chokepoint: reads full state, generates code, sends to REPL | New, but calls into ported logic below |
| `generatePlotCode()`/`buildCallArgs()` | Code generation | **Ported from `plot-builder.js` to TypeScript** — same logic, new home (`extension.ts`), since the webview that hosted them is gone |
| `getWorkspaceVars()` | Variable discovery | Unchanged, reused as-is from Sprint 9 |
| `renderer.js` FIGURES handlers | Now send live config on EVERY interaction, not just Plot click | Modified from Sprint 9 — this is a real behavior change, not additive |
| `julialab.updatePlotConfig` (new WS command) | Receives live plotConfig updates from ribbon | New, parallel to `julialab.openPlotBuilder` (which likely gets removed) |

## 3. Data Model

```typescript
interface PersistentPlotState {
  selectedVarsOrdered: string[];  // populated via diff-tracking, §5.1
  plotConfig: {
    type: string | null;
    style: string[];
    axes: string[];
  };
}

// module-level, extension host lifetime
let plotState: PersistentPlotState = {
  selectedVarsOrdered: [],
  plotConfig: { type: null, style: [], axes: [] }
};
```

## 4. API / Interface Specification

### 4.1 TreeView registration

```typescript
class PlotVariablesProvider implements vscode.TreeDataProvider<WorkspaceVar> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private vars: WorkspaceVar[] = [];

  refresh(vars: WorkspaceVar[]): void {
    this.vars = vars;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(el: WorkspaceVar): vscode.TreeItem {
    return new vscode.TreeItem(`${el.name} (${el.type})`);
  }

  getChildren(): WorkspaceVar[] {
    return this.vars;
  }
}

const plotVarsProvider = new PlotVariablesProvider();
const treeView = vscode.window.createTreeView('julialabPlotVariables', {
  treeDataProvider: plotVarsProvider,
  canSelectMany: true
});
```

`package.json` needs a `contributes.views` entry. **Design choice worth
flagging explicitly:** contribute this view into julia-vscode's existing
`julia-explorer` view container (ID already known from
SPRINT9-HANDOFF.md's architecture notes) rather than creating a new
container — this is a standard, supported VS Code pattern (any extension
can contribute a view into another extension's container by referencing
its ID), and co-locating "Plot Variables" next to julia-vscode's own
Workspace view is a better user experience than a separate sidebar
section. Not yet built/tested — flag as the first thing to verify when
implementation starts, since it's a reasonable but unverified assumption
about container ID stability across julia-vscode versions.

### 4.2 Refreshing the TreeView

`getWorkspaceVars()` needs to be called and `plotVarsProvider.refresh()`
invoked whenever the workspace might have changed. Options: on
`treeView.onDidChangeVisibility` (refresh when the user opens the panel),
on a timer, or on REPL output events. **Not fully resolved** — starting
point: refresh on `onDidChangeVisibility` plus a manual refresh command,
defer live-auto-refresh-on-every-REPL-execution as a nice-to-have, not a
Sprint 10 requirement (avoids unnecessary complexity/performance cost of
re-running the file-based discovery mechanism constantly).

## 5. Key Algorithms

### 5.1 Selection-order tracking (the ADR-025 sub-detail that needs care)

VS Code's `TreeView.onDidChangeSelection` event's `.selection` array is
**not guaranteed to reflect click/selection order** — it typically
reflects tree/document order. To get true "order selected" (required for
X/Y/Z role assignment per the MATLAB-verified convention), track it
manually via set-diffing on each event:

```typescript
let orderedSelection: string[] = [];

treeView.onDidChangeSelection(e => {
  const newSet = new Set(e.selection.map(v => v.name));
  const oldSet = new Set(orderedSelection);

  // Remove deselected items, preserving order of what remains
  orderedSelection = orderedSelection.filter(name => newSet.has(name));

  // Append newly-selected items in the order VS Code reports them
  // (best-effort — VS Code doesn't guarantee even THIS is click order
  // for multi-select-in-one-gesture cases like shift-click ranges;
  // acceptable limitation for Sprint 10, ctrl-click one-at-a-time is
  // the primary supported interaction, matching MATLAB's own pattern)
  for (const item of e.selection) {
    if (!oldSet.has(item.name)) {
      orderedSelection.push(item.name);
    }
  }

  plotState.selectedVarsOrdered = orderedSelection;
  regeneratePlot();
});
```

### 5.2 `regeneratePlot()` — the single chokepoint

```typescript
function minVarsNeeded(type: string | null): number {
  if (!type) return 2; // default line-plot assumption
  if (type === 'histogram') return 1;
  if (['surface', 'contour'].includes(type)) return 3;
  return 2;
}

function regeneratePlot(): void {
  const needed = minVarsNeeded(plotState.plotConfig.type);
  if (plotState.selectedVarsOrdered.length < needed) return; // not enough selected yet — silent no-op, not an error

  const [xVar, yVar, zVar] = plotState.selectedVarsOrdered;
  const code = generatePlotCode(xVar, yVar, zVar, plotState.plotConfig);

  const terminal = vscode.window.terminals.find(t => t.name.includes('Julia'));
  if (!terminal) {
    vscode.window.showWarningMessage('JuliaLab: Julia REPL terminal not found — cannot update plot.');
    return;
  }
  terminal.sendText(code, true);
}
```

Called from: TreeView selection changes (§5.1) AND the new
`julialab.updatePlotConfig` WS command handler (ribbon interactions).

### 5.3 `generatePlotCode()`/`buildCallArgs()` — ported to TypeScript

Direct port of Sprint 9's `plot-builder.js` logic (DESIGN-sprint9.md
§5.1), unchanged in behavior — same StatsPlots preamble logic (Decision
1A), same theme-as-statement handling, same Q4/Q5 type-dispatch. Only the
language changes (JS → TS) and the home (webview → extension host). Not
reproduced in full here — see DESIGN-sprint9.md §5.1 as the source of
truth for the algorithm itself; this section exists only to flag that the
port is mechanical, not a redesign of code-gen.

## 6. Error Handling

Consistent with Sprint 9's accepted stance: a `regeneratePlot()` call with
mismatched variable types/shapes produces a Julia REPL error, surfaced in
the terminal — not caught or pre-validated. New consideration specific to
this sprint: **rapid-fire reactive triggering (ADR-026) could produce a
burst of REPL errors** if a user is mid-selection (e.g. only 1 of 2
needed variables selected, then rapidly toggling plot type before
selecting the second). The `minVarsNeeded` guard in §5.2 prevents
executing anything until enough variables are selected — this is the
primary defense against error-spam, not a debounce.

## 7. Open Design Questions Remaining

1. **TreeView container placement** (§4.1) — contributing into
   `julia-explorer` is a reasonable assumption, not yet verified. First
   thing to test when implementation starts.
2. **TreeView refresh timing** (§4.2) — starting point given
   (visibility-change + manual refresh), full auto-refresh strategy
   deferred as non-blocking nice-to-have.
3. **ADR-026's core feasibility bet is still unproven** — this entire
   DESIGN doc assumes reactive triggering works cleanly. First
   implementation task should be a small end-to-end spike (variable
   select → plot type click → immediate render) before building out the
   rest, mirroring Sprint 9's own spike-first discipline.
