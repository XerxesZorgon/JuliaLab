# Software Design Document — Sprint 9 Plot Builder
**Project:** JuliaLabApp
**Version:** 0.1
**Date:** 2026-07-09
**Author:** John Peach / eurAIka
**Depends on:** SDD-plot-builder.md, ADR-024, Sprint 8 FIGURES state model
**Resolves:** SDD-plot-builder.md §5 open questions (Q2–Q5; Q1 spike-gated, Q6 accepted-as-is)

---

## 1. Architecture Overview

```
Ribbon (WebContentsView)                  Extension Host                  Julia REPL
 index.html Plot button                    extension.ts                  (terminal)
 renderer.js                                 |
      |  data-dispatch="plot-builder"        |
      |-- WS {command:'julialab.openPlotBuilder',
      |        args:[window.plotConfig]}     |
      |-------------------------------------->|
      |                                       |-- getWorkspaceVars() [S9-001 spike]
      |                                       |     -> WorkspaceVar[]
      |                                       |-- vscode.window.createWebviewPanel()
      |                                       |-- panel.webview.postMessage(
      |                                       |     {command:'init', vars, plotConfig})
      |                                       |
      |                              Webview Panel (plot-builder.html)
      |                                       |-- renders dropdowns from `vars`
      |                                       |-- renders read-only plotConfig summary
      |                                       |-- user selects X/Y(/Z), clicks Run
      |                                       |-- generatePlotCode() [plot-builder.js]
      |                                       |-- panel.webview.postMessage(
      |                                       |     {command:'runPlot', code})
      |                                       |         (webview -> extension host,
      |                                       |          NOT the WS bridge)
      |                                       |-- onDidReceiveMessage(msg)
      |                                       |     vscode.commands.executeCommand(
      |                                       |       'language-julia.executeJuliaCodeInREPL',
      |                                       |       msg.code)   [ADR-024 path,
      |                                       |        but invoked directly in-process,
      |                                       |        not re-routed through WS]
      |                                       |------------------------------------------->|
      |                                       |                                    plot renders
      |                                       |                                    in plot pane
```

**Two distinct IPC channels, not one — this must not be conflated:**
1. **Ribbon → Extension Host:** WS bridge, port 2999 (ADR-023/024). Used once,
   to open the webview and hand it `plotConfig`.
2. **Webview → Extension Host:** VSCodium's native `postMessage` /
   `onDidReceiveMessage` webview API. Used for variable list delivery and
   the Run command. This is a *separate* channel from the WS bridge and
   does not pass through the ADR-020 prefix allowlist — it's already
   confined to the extension's own webview panel object.

## 2. Module / Component Breakdown

| Component | Responsibility | Interface |
|---|---|---|
| `extension.ts` — WS handler (existing, ADR-024) | Route `julialab.openPlotBuilder` to a new handler function | `{command, args: [PlotConfig]}` in |
| `extension.ts` — `openPlotBuilderPanel(config: PlotConfig)` | Create/reveal webview panel, fetch vars, post init message | `(PlotConfig) => void` |
| `extension.ts` — `getWorkspaceVars()` | Query Julia REPL for variable names/types (impl TBD by S9-001 spike, interface fixed here) | `() => Promise<WorkspaceVar[]>` |
| `extension.ts` — panel message handler | Receive `runPlot`, execute generated code in REPL | `(msg: RunPlotMessage) => void` |
| `plot-builder.html` | Static webview markup: dropdowns, config summary, Run button, CSP meta tag | — |
| `plot-builder.js` (webview-side, loaded via nonce'd `<script>`) | `generatePlotCode()`, dropdown population, postMessage to extension | `(xVar, yVar, zVar, plotConfig) => string` |
| `renderer.js` — `plot-builder` dispatch branch | Send `window.plotConfig` as WS args | existing dispatch pattern, extended |

## 3. Data Model

```typescript
interface WorkspaceVar {
  name: string;   // e.g. "data1"
  type: string;   // e.g. "Vector{Float64}" — informational only in Sprint 9,
                   // not used for type-checking (see §6 Error Handling)
}

interface PlotConfig {
  type: string | null;   // 'scatter' | 'line' | 'bar' | 'area' | 'histogram'
                          // | 'boxplot' | 'violin' | 'contour' | 'surface'
                          // | 'heatmap' | 'pie' | 'stem' | null
  style: string[];        // subset of ['markers','colors','linewidth','opacity','theme']
  axes: string[];          // subset of ['xlabel','ylabel','legend','grid','xlims','ylims']
}

// Extension host -> webview
interface InitMessage {
  command: 'init';
  vars: WorkspaceVar[];
  plotConfig: PlotConfig;
}

// Webview -> extension host
interface RunPlotMessage {
  command: 'runPlot';
  code: string;   // fully-formed Julia source, ready for executeJuliaCodeInREPL
}
```

## 4. API / Interface Specification

### 4.1 `renderer.js` — dispatch (supersedes SDD §3.6 pipe-encoding sketch)

```javascript
if (btn.dataset.dispatch === 'plot-builder') {
  window.electronAPI.ribbonCommand({
    command: 'julialab.openPlotBuilder',
    args: [window.plotConfig]   // ADR-024 structured args, not pipe+encodeURIComponent
  });
  return;
}
```
**Deviation from SDD §3.6, documented:** the SDD's original sketch used
`julialab.openPlotBuilder|<encodeURIComponent(JSON)>`, mirroring the
terminal toggle's `|show|hide` suffix pattern. ADR-024 (written after the
SDD) makes this unnecessary — `plotConfig` travels as a proper JSON value
in `args[0]`, no manual encoding/decoding required on either end. The
`|show|hide` suffix pattern remains scoped only to
`workbench.action.terminal.toggleTerminal` per existing convention;
`julialab.openPlotBuilder` does not use it.

### 4.2 `extension.ts` — command registration

```typescript
// Registered once at activation, alongside existing julialab.* commands
vscode.commands.registerCommand(
  'julialab.openPlotBuilder',
  async (config: PlotConfig) => {
    await openPlotBuilderPanel(config);
  }
);
```
Reached via the existing ADR-024 dispatch: `command.startsWith('julialab.')`
matches the ADR-020 allowlist, `args` is `[config]`, so
`executeCommand('julialab.openPlotBuilder', config)` invokes this handler
with `config` bound to the first (only) parameter.

### 4.3 `extension.ts` — panel lifecycle

```typescript
let plotBuilderPanel: vscode.WebviewPanel | undefined;

async function openPlotBuilderPanel(config: PlotConfig): Promise<void> {
  if (plotBuilderPanel) {
    plotBuilderPanel.reveal();
  } else {
    plotBuilderPanel = vscode.window.createWebviewPanel(
      'julialabPlotBuilder',
      'Plot Builder',
      vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    plotBuilderPanel.webview.html = getPlotBuilderHtml(plotBuilderPanel.webview);
    plotBuilderPanel.onDidDispose(() => { plotBuilderPanel = undefined; });
    plotBuilderPanel.webview.onDidReceiveMessage(handlePlotBuilderMessage);
  }

  const vars = await getWorkspaceVars();
  plotBuilderPanel.webview.postMessage({
    command: 'init', vars, plotConfig: config
  } satisfies InitMessage);
}

function handlePlotBuilderMessage(msg: RunPlotMessage): void {
  if (msg.command === 'runPlot') {
    vscode.commands.executeCommand(
      'language-julia.executeJuliaCodeInREPL', msg.code
    ).then(undefined, err => {
      console.error('[julialab] plot exec failed:', err);
      // fs.writeFileSync probe if console.log proves invisible here too —
      // confirm during S9-007 whether this handler runs in the same
      // detached process as the WS dispatch handler (SPRINT9-HANDOFF.md
      // "Critical constraints" — console.log invisibility applies to the
      // whole extension host, not just the WS path).
    });
  }
}
```

### 4.4 CSP requirement for `plot-builder.html` — not in the SDD, required for the webview to function

VSCodium webviews block inline scripts and remote resources by default.
`plot-builder.html`'s `<head>` must include:

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
<script nonce="${nonce}" src="${scriptUri}"></script>
```

where `nonce` is a per-render random string and `scriptUri` is
`webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'plot-builder.js'))`,
both computed in `getPlotBuilderHtml(webview)`. Without this, S9-004/S9-005
will produce a webview where the Run button silently does nothing — no
console error visible in the normal DevTools-inaccessible extension host
context (same class of debugging trap as the `console.log` issue already
logged in SPRINT9-HANDOFF.md). Flagging explicitly so S9-004's acceptance
criterion includes "script executes" not just "HTML renders."

### 4.5 `getWorkspaceVars()` — interface fixed, implementation spike-gated

```typescript
async function getWorkspaceVars(): Promise<WorkspaceVar[]> {
  // Implementation depends on Spike S9-001 result:
  //   (a) if executeJuliaCodeInREPL output is capturable by the extension
  //       host directly -> parse it here
  //   (b) if not -> write to a temp file from Julia, read it here
  // Interface and all callers are stable regardless of which branch wins.
}
```
Per software-project skill's spike-gate rule, this function body is not
written until S9-001 reports its result to this thread.

## 5. Key Algorithms

### 5.1 `generatePlotCode()` (webview-side, `plot-builder.js`)

Updated from SDD §3.4 with decisions 1A and 2B applied:

```javascript
function generatePlotCode(xVar, yVar, zVar, plotConfig) {
  const usesStatsPlots = ['boxplot', 'violin', 'pie'].includes(plotConfig.type);
  const preamble = usesStatsPlots ? 'using StatsPlots\n' : '';   // Decision 1A

  const kwargs = [];

  // Series type
  if (plotConfig.type && !['line', 'histogram', 'boxplot', 'violin', 'pie']
        .includes(plotConfig.type)) {
    kwargs.push(`seriestype=:${plotConfig.type}`);
  }

  // Style — simple options as before; complex options now ALWAYS emit
  // fixed defaults (Decision 2B) rather than branching on future UI state
  if (plotConfig.style.includes('markers'))   kwargs.push('markershape=:circle');
  if (plotConfig.style.includes('linewidth')) kwargs.push('linewidth=2');
  if (plotConfig.style.includes('colors'))    kwargs.push('color=:auto');      // fixed default
  if (plotConfig.style.includes('opacity'))   kwargs.push('alpha=0.7');        // fixed default
  if (plotConfig.style.includes('theme'))     kwargs.push('');                 // see note below

  // Axes
  if (plotConfig.axes.includes('xlabel')) kwargs.push('xlabel="X"');
  if (plotConfig.axes.includes('ylabel')) kwargs.push('ylabel="Y"');
  if (plotConfig.axes.includes('legend')) kwargs.push('legend=true');
  if (plotConfig.axes.includes('grid'))   kwargs.push('grid=true');

  const callArgs = buildCallArgs(xVar, yVar, zVar, plotConfig, kwargs);
  return preamble + callArgs;
}
```

**Theme is a special case, not a kwarg** — `theme(:default)` in Plots.jl is
a *separate statement* that sets global plot theme, not an argument to
`plot(...)`. Decision 2B's "fixed default" for theme means: if `'theme'` is
in `plotConfig.style`, prepend `theme(:default)\n` to the generated code
(alongside the StatsPlots preamble), not push an empty string into kwargs.
Corrected in the actual S9-005 implementation; noted here because SDD §3.4's
table listed it as if it were a kwarg, which is incorrect Plots.jl usage.

**Type-dispatch for call shape** (SDD §5 Q4/Q5, resolved mechanically):

```javascript
function buildCallArgs(xVar, yVar, zVar, plotConfig, kwargs) {
  const all = [...kwargs];
  if (plotConfig.type === 'histogram') {
    return `histogram(${xVar}${kwargsStr(all)})`;              // Y hidden, Q5
  }
  if (['surface', 'contour'].includes(plotConfig.type) && zVar) {
    return `plot(${xVar}, ${yVar}, ${zVar}${kwargsStr(all)})`; // Z shown, Q4
  }
  if (plotConfig.type === 'pie') {
    return `pie(${xVar}, ${yVar}${kwargsStr(all)})`;
  }
  if (['boxplot', 'violin'].includes(plotConfig.type)) {
    return `${plotConfig.type}(${xVar}, ${yVar}${kwargsStr(all)})`;
  }
  return `plot(${xVar}, ${yVar}${kwargsStr(all)})`;
}
```

**Webview dropdown visibility** (Q4/Q5, HTML/JS side): on receiving `init`,
`plot-builder.js` shows/hides the Z and Y `<select>` elements based on
`plotConfig.type` using the same predicate logic as `buildCallArgs` above —
`surface`/`contour` show Z, `histogram` hides Y. Single source of truth for
this predicate should live in one shared function, not be duplicated
between the visibility logic and the code-gen logic.

### 5.2 "Coming soon" affordance for complex style options (Decision 2B)

`plot-builder.html`'s plotConfig summary section (SDD §3.3) renders a note
when `plotConfig.style` contains `colors`, `opacity`, or `theme`:

```html
<div id="plot-config-summary">
  <!-- existing summary content -->
  <p class="coming-soon" hidden>
    Using default color/opacity/theme settings — custom controls coming
    in a future release.
  </p>
</div>
```
`plot-builder.js` un-hides `.coming-soon` if any of those three style
values are present. This is the minimum affordance needed so a user who
toggled "Colors" on the ribbon isn't left wondering why nothing changed.

## 6. Error Handling Strategy

Unchanged from SDD §5 Q6, accepted as-is for Sprint 9: if a selected
variable doesn't exist or is the wrong type for the chosen plot function,
the generated code fails in the Julia REPL with a standard Julia error
surfaced in the terminal panel. No pre-execution type checking. No catch
in `handlePlotBuilderMessage` beyond logging the promise rejection from
`executeCommand` itself (which fires only for VSCode-level dispatch
failures, e.g. command not found — not for Julia runtime errors, which
occur inside the REPL process and are invisible to this promise).
Sprint 10 candidate: pre-execution type checking against `WorkspaceVar.type`.

## 7. Dependency List

| Library | Version (pinned) | Purpose |
|---|---|---|
| StatsPlots.jl | Not pinned by JuliaLabApp — user's Julia environment dependency | Required at REPL runtime for boxplot/violin/pie; Decision 1A assumes it errors clearly if absent, not validated in-app this sprint |
| (no new npm/extension-host packages) | — | Webview panel API is built into `vscode` — no new `package.json` dependency |

## 8. Open Design Questions

None remaining for Phase 6. Summary of resolution:

| SDD §5 Q | Resolution |
|---|---|
| Q1 (variable discovery) | Interface fixed (§4.5); implementation body deferred to S9-001 spike result, not a design gap |
| Q2 (StatsPlots) | Decision 1A — auto-prepend `using StatsPlots` |
| Q3 (complex style) | Decision 2B — fixed defaults + "coming soon" note; interactive controls backlogged |
| Q4 (Z variable) | Resolved mechanically — shown for surface/contour only (§5.1) |
| Q5 (histogram Y) | Resolved mechanically — hidden for histogram (§5.1) |
| Q6 (error handling) | Accepted as-is per SDD, unchanged (§6) |
