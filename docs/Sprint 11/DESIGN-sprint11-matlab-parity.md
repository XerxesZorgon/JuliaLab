# DESIGN — Sprint 11 MATLAB-Parity FIGURES Features
**Depends on:** SDD-matlab-parity.md (all open questions resolved)

## 1. Ribbon additions (`index.html` / `ribbon.css`)
New AXES group buttons: **Subtitle**, **Colorbar**, **X-Grid**, **Y-Grid**
— added alongside existing Legend, X Label, Y Label, Grid. Follow
existing button markup/styling conventions exactly (read existing AXES
buttons first, match `data-dispatch`/`data-toggle-group` pattern).

## 2. Grid mutual-exclusion (`renderer.js`)
Grid, X-Grid, Y-Grid form a nested radio-group within the otherwise
independent AXES multi-toggle set. On click of any of these three:
1. Remove the other two from `window.plotConfig.axes` if present
2. Toggle the clicked one normally (add if absent, remove if present —
   preserves "click again to turn off" behavior)
3. Send live update via existing `julialab.updatePlotConfig` (Sprint 10
   pattern, unchanged)

Legend/X Label/Y Label buttons are NOT part of this exclusion — they
keep today's fully-independent toggle behavior.

## 3. Code generation (`extension.ts`, `generatePlotCode()`)
Add to the axes-kwargs section:
```typescript
if (plotConfig.axes.includes('subtitle')) kwargs.push('subtitle="Subtitle"');
if (plotConfig.axes.includes('colorbar')) kwargs.push('colorbar=true');
if (plotConfig.axes.includes('grid'))  kwargs.push('grid=true');
else if (plotConfig.axes.includes('xgrid')) kwargs.push('xgrid=true');
else if (plotConfig.axes.includes('ygrid')) kwargs.push('ygrid=true');
```
The `else if` chain is safe/correct specifically because §2's UI-level
mutual exclusion guarantees at most one of `grid`/`xgrid`/`ygrid` is ever
present in the array — no runtime conflict possible, so no extra
validation needed here.

## 4. Out of scope reminders
No changes to `PersistentPlotState`'s shape, no new WS commands, no
webview/TreeView changes — Sprint 10's architecture is untouched, this
sprint only adds kwargs and one UI interaction pattern.
