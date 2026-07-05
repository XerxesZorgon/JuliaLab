# Software Description Document — Plot Builder

**Project:** JuliaLabApp
**Feature:** FIGURES tab Plot Builder — variable picker, code generation, REPL execution
**Sprint:** 8 (document) / 9 (implementation)
**Version:** 0.1
**Date:** 2026-07-04
**Author:** John Peach / eurAIka
**Depends on:** ADR-024 (WS argument passing), Sprint 8 FIGURES state model

---

## 1. Purpose

The Plot Builder is the implementation target for the green **Plot** button
on the FIGURES ribbon tab. When clicked, it:

1. Queries the Julia REPL for workspace variable names and types
2. Presents a variable picker UI for x, y (and optional z) axis selection
3. Reads `window.plotConfig` (type, style options, axes options) from the
   ribbon state accumulated by the FIGURES selection buttons
4. Generates a valid `Plots.jl` Julia code string from the selections
5. Executes the generated code in the Julia REPL

The result is a plot rendered in the julia-vscode plot pane.

---

## 2. User Flow

```
User selects PLOT TYPE (e.g. Scatter)
  → User selects STYLE options (e.g. Markers, Colors)
  → User selects AXES options (e.g. X Label, Y Label)
  → User clicks Plot button
    → Variable picker panel opens
      → User selects X variable from dropdown (workspace vars)
      → User selects Y variable from dropdown
      → User clicks Run
        → Julia code generated and sent to REPL
        → Plot appears in julia-vscode plot pane
```

---

## 3. Architecture

### 3.1 ADR-024 — WS Bridge Argument Passing

The current WS bridge sends `{ command: string }` only. Executing
`language-julia.executeJuliaCodeInREPL` with a code string argument requires
extending the message format.

**ADR-024 decision:** Extend WS message to `{ command, args?: any[] }`.
In `extension.ts`, update the dispatch handler:

```typescript
const command = msg.command;
const args: any[] = Array.isArray(msg.args) ? msg.args : [];

if (command === 'julialab.syncPanelState') {
  // ... existing handler
} else if (command && command.startsWith('workbench.action.terminal.toggleTerminal')) {
  // ... existing handler
} else if (command && ALLOWED_PREFIXES.some(p => command.startsWith(p))) {
  vscode.commands.executeCommand(command, ...args).then(undefined, err => {
    console.error('[julialab] ws command failed:', err);
  });
}
```

This is **backward compatible** — existing messages without `args` continue
to work since `args` defaults to `[]` and spreading an empty array has no
effect.

### 3.2 Variable Discovery

The extension host queries the Julia REPL for workspace variables and returns
them to the renderer via the WS reverse channel (ADR-023 pattern).

**New `julialab.getWorkspaceVars` command in `extension.ts`:**

```typescript
vscode.commands.registerCommand('julialab.getWorkspaceVars', async () => {
  // Execute Julia code to get workspace variable names and types
  const code = `
    let vars = filter(x -> x != :ans, names(Main))
    result = [(name=string(v), type=string(typeof(getfield(Main, v))))
              for v in vars
              if isdefined(Main, v)]
    println(join(["$(r.name):$(r.type)" for r in result], ","))
  `;
  await vscode.commands.executeCommand(
    'language-julia.executeJuliaCodeInREPL', code
  );
  // Result is captured via REPL output listener (see section 3.3)
})
```

**Alternative (simpler) approach:** Execute the query code directly in the
REPL and capture output via a WebSocket message. Since REPL output goes to
the terminal panel (not the extension host), the simplest path is to execute
a Julia expression that formats the variable list as JSON and writes it to
a temp file, then read the file from `extension.ts`.

**Recommended approach (Sprint 9 spike):** Run the spike before committing
to an implementation — test whether `executeJuliaCodeInREPL` output can be
captured by the extension host, or whether a file-based approach is needed.

### 3.3 Variable Picker Webview

A VSCodium webview panel opened by the Plot button click. The webview:

- Receives the workspace variable list from the extension host
- Displays dropdowns for X variable, Y variable, optional Z variable
- Displays the current `window.plotConfig` selections (read-only summary)
- Has a **Run** button that generates and executes the plot code

**Opening the webview:** The Plot button dispatches `data-dispatch="plot-builder"`.
`renderer.js` sends `julialab.openPlotBuilder` via the WS bridge. The
extension host opens the webview panel.

**Message passing between webview and extension host:**
VSCodium webview panels communicate via `panel.webview.postMessage()` and
`panel.webview.onDidReceiveMessage()`. The extension sends the variable list
to the webview; the webview sends the Run command back with the selected
variables.

**Webview HTML structure (minimal):**
```html
<select id="x-var"><option>-- select X --</option></select>
<select id="y-var"><option>-- select Y --</option></select>
<select id="z-var"><option>-- none --</option></select>
<div id="plot-config-summary"><!-- filled from postMessage --></div>
<button id="run-btn">Run</button>
```

### 3.4 Code Generation

Assemble a Plots.jl call from `window.plotConfig` and the selected variables.
Code generation runs in the webview's JavaScript before sending the Run message.

**Mapping from `window.plotConfig` to Plots.jl arguments:**

| `plotConfig.type` | Plots.jl `seriestype` |
|---|---|
| `line` | `:line` (default, omit) |
| `scatter` | `:scatter` |
| `bar` | `:bar` |
| `area` | `:steppre` or `fillrange=0` |
| `histogram` | `histogram(x)` (different function) |
| `boxplot` | `boxplot(x, y)` (StatsPlots.jl) |
| `violin` | `violin(x, y)` (StatsPlots.jl) |
| `contour` | `:contour` |
| `surface` | `:surface` |
| `heatmap` | `:heatmap` |
| `pie` | `pie(x, y)` (different function) |
| `stem` | `:stem` |

**Note on StatsPlots.jl:** `boxplot`, `violin`, and `pie` require
`StatsPlots.jl` to be loaded. The generated code should include
`using StatsPlots` for these types. Sprint 9 should verify whether
julia-vscode auto-loads StatsPlots or whether the user must install it.

| `plotConfig.style` value | Plots.jl argument |
|---|---|
| `markers` | `markershape=:circle` |
| `colors` | `color=:auto` (opens color picker — Sprint 9 design decision) |
| `linewidth` | `linewidth=2` (opens width picker — Sprint 9 design decision) |
| `opacity` | `alpha=0.7` (opens slider — Sprint 9 design decision) |
| `theme` | `theme(:default)` (opens theme picker — Sprint 9 design decision) |

**Simple options** (markers, linewidth) can be included as fixed defaults
in Sprint 9. **Complex options** (colors, opacity, theme) that require
user input should open secondary controls in the webview.

| `plotConfig.axes` value | Plots.jl argument |
|---|---|
| `xlabel` | `xlabel="X"` (text field in webview) |
| `ylabel` | `ylabel="Y"` (text field in webview) |
| `legend` | `legend=true` |
| `grid` | `grid=true` |
| `xlims` | `xlims=(min, max)` (two number fields) |
| `ylims` | `ylims=(min, max)` (two number fields) |

**Generated code example (Scatter, Markers, X Label, Y Label selected,
x=data1, y=data2):**
```julia
plot(data1, data2, seriestype=:scatter, markershape=:circle,
     xlabel="X", ylabel="Y")
```

**Code generation function (JavaScript in webview):**
```javascript
function generatePlotCode(xVar, yVar, zVar, plotConfig) {
  const args = [`${xVar}`, `${yVar}`];
  const kwargs = [];

  // Series type
  if (plotConfig.type && plotConfig.type !== 'line') {
    kwargs.push(`seriestype=:${plotConfig.type}`);
  }

  // Style options
  if (plotConfig.style.includes('markers')) kwargs.push('markershape=:circle');
  if (plotConfig.style.includes('linewidth')) kwargs.push('linewidth=2');

  // Axes options
  if (plotConfig.axes.includes('xlabel')) kwargs.push('xlabel="X"');
  if (plotConfig.axes.includes('ylabel')) kwargs.push('ylabel="Y"');
  if (plotConfig.axes.includes('legend')) kwargs.push('legend=true');
  if (plotConfig.axes.includes('grid'))   kwargs.push('grid=true');

  const allArgs = [...args, ...kwargs].join(', ');
  return `plot(${allArgs})`;
}
```

### 3.5 REPL Execution

The webview sends the generated code string to the extension host via
`panel.webview.onDidReceiveMessage`. The extension host executes it using
ADR-024 argument passing:

```typescript
panel.webview.onDidReceiveMessage(msg => {
  if (msg.command === 'runPlot') {
    vscode.commands.executeCommand(
      'language-julia.executeJuliaCodeInREPL',
      msg.code
    );
  }
});
```

### 3.6 Ribbon button dispatch

In `renderer.js`, add a handler for `data-dispatch="plot-builder"`:

```javascript
if (btn.dataset.dispatch === 'plot-builder') {
  // Send plotConfig to extension and open variable picker
  const configJson = JSON.stringify(window.plotConfig);
  window.electronAPI.ribbonCommand(
    `julialab.openPlotBuilder|${encodeURIComponent(configJson)}`
  );
  return;
}
```

The extension intercepts `julialab.openPlotBuilder` (allowed prefix `julialab.`),
decodes the config, opens the webview panel, and sends the config to it.

---

## 4. Sprint 9 Task Sketch

| Task | File(s) | What |
|---|---|---|
| S9-001 | Spike | Variable discovery — test `executeJuliaCodeInREPL` output capture |
| S9-002 | `extension.ts` | ADR-024: add `args` support to WS bridge |
| S9-003 | `extension.ts` | `julialab.openPlotBuilder` command + webview panel |
| S9-004 | `plot-builder.html` | Webview HTML/CSS/JS — variable dropdowns + Run button |
| S9-005 | `plot-builder.js` | Code generation function + webview → extension messaging |
| S9-006 | `renderer.js` | `plot-builder` dispatch branch → `julialab.openPlotBuilder` |
| S9-007 | `extension.ts` | REPL execution via ADR-024 args |
| S9-008 | — | Full integration test: select vars → click Run → plot appears |
| S9-009 | — | Regression + tag sprint9-complete |

---

## 5. Open Questions for Sprint 9

1. **Variable discovery method:** File-based output capture vs. extension
   host REPL listener — spike required before implementation.

2. **StatsPlots.jl dependency:** Should the Plot Builder auto-add
   `using StatsPlots` for boxplot/violin/pie, or warn the user?

3. **Complex style options (colors, opacity, theme):** Do these open
   secondary controls in the webview this sprint, or default to Plots.jl
   defaults with a "coming soon" note?

4. **Z variable:** When is Z used? Only for `surface` and `contour` (3D
   plots). The webview should show/hide the Z dropdown based on
   `plotConfig.type`.

5. **X-axis for histogram:** `histogram(x)` takes only one variable (the
   distribution). The Y dropdown should be hidden when Histogram is selected.

6. **Error handling:** What should happen if the user selects a variable
   that doesn't exist or is the wrong type? The generated code will fail in
   the REPL with a Julia error — this is acceptable for Sprint 9.
   Sprint 10 could add type checking before execution.

---

## 6. Files Created/Modified in Sprint 9

| File | Change |
|---|---|
| `extensions/julialab/src/extension.ts` | ADR-024 args; `julialab.openPlotBuilder`; webview panel; REPL exec |
| `extensions/julialab/src/plot-builder.html` | Webview UI — new file |
| `renderer.js` | `plot-builder` dispatch branch |
| `index.html` | No changes needed (Plot button already has `data-dispatch="plot-builder"`) |
