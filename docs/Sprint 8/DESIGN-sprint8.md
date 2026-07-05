# Software Design Document — Sprint 8

**Project:** JuliaLabApp
**Sprint:** 8 — Tier 2 wiring + Undo/Redo/Clipboard + FIGURES state model + Plot Builder SDD
**Version:** 0.1
**Date:** 2026-07-04
**Author:** John Peach / eurAIka
**ADRs in force:** ADR-020, ADR-021, ADR-022, ADR-023

---

## 1. Architecture Overview

No new architectural components. Four existing files change for wiring and
keyboard injection; two files change for FIGURES state model:

```
index.html      ← Tier 2 command ids; KB dispatch attrs; FIGURES select attrs + Plot button
preload.js      ← expose sendKey() via ipcRenderer
main.js         ← ipcMain 'workbench-key' handler → sendInputEvent
renderer.js     ← KB dispatch branch; FIGURES radio/toggle; window.plotConfig
ribbon.css      ← .ribbon-btn-select (FIGURES radio); .ribbon-btn-plot (Plot button)
```

---

## 2. Feature 1 — Tier 2 Button Wiring

### 2.1 Spike S8-1 — Palette verification of CODE/DEBUG ids (John-run, first)

Before any `index.html` edit, verify three candidate ids in the running app:

| Button | Candidate id | Verify by |
|---|---|---|
| Breakpoint | `editor.debug.action.toggleBreakpoint` | `Ctrl+Shift+P` → search "toggle breakpoint" |
| Step | `workbench.action.debug.stepOver` | `Ctrl+Shift+P` → search "step over" |
| Continue | `workbench.action.debug.continue` | `Ctrl+Shift+P` → search "continue" |

Report exact ids as shown in the palette. Corrections go into the wiring
task before any commit.

### 2.2 Command id changes in index.html

**CODE/RUN group** — replace four `noop` values:

| Button | New `data-command` |
|---|---|
| Run (large) | `language-julia.executeFile` |
| Run Selection | `language-julia.executeJuliaCodeInREPL` |
| Execute Cell | `language-julia.executeCell` |
| Restart REPL | `language-julia.restartREPL` |

Remove the `<!-- Tier 2: ... -->` comments above each button when wiring.

**CODE/DEBUG group** — replace three `noop` values with palette-verified ids.

**HOME/DIRECTORY group** — replace three `noop` values:

| Button | New `data-command` |
|---|---|
| Current Dir | `language-julia.cdHere` |
| Change Dir | `language-julia.changeCurrentEnvironment` |
| New Folder | `workbench.action.files.newFolder` |

**HOME/PACKAGE MANAGER** — replace one `noop`:

| Button | New `data-command` |
|---|---|
| Instantiate | `language-julia.instantiateEnvironment` |

**VIEW/PANES** — replace one `noop`:

| Button | New `data-command` |
|---|---|
| DOCUMENTATION | `language-julia.show-documentation-pane` |

**FIGURES/FIGURE** — replace two `noop` values:

| Button | New `data-command` |
|---|---|
| Close | `language-julia.plotpane-delete` |
| Close All | `language-julia.plotpane-delete-all` |

All 12 wiring changes are in `index.html` only. No `extension.ts` change
needed — all ids are under allowed prefixes (ADR-020).

---

## 3. Feature 2 — Undo/Redo/Clipboard via Keyboard Injection

### 3.1 Spike S8-2 — Verify sendInputEvent works (John-run, second)

Before building the full chain, verify the mechanism works with a single
temporary button. Add a test button to the HOME ribbon, launch with
`npm run start:fast`, open ribbon DevTools, and run:

```javascript
// In ribbon DevTools console — tests sendInputEvent path
window.electronAPI.sendKey('ctrl+z');
```

If the workbench editor undoes the last action: PASS → proceed to full
implementation. If nothing happens: report here before implementing.

### 3.2 Architecture

```
ribbon button click
  → renderer.js dispatch (data-dispatch="kb")
  → window.electronAPI.sendKey(key)
  → preload.js ipcRenderer.send('workbench-key', key)
  → main.js ipcMain.on('workbench-key', ...)
  → state.workbenchView.webContents.sendInputEvent(keyDownEvent)
  → state.workbenchView.webContents.sendInputEvent(keyUpEvent)
```

Both keyDown and keyUp events are required — sending only keyDown leaves
the key in a pressed state in Chromium's internal model.

### 3.3 index.html changes

Five buttons in CODE/EDIT get new dispatch attributes. Replace each button's
`data-command="noop"` with `data-command="noop"` (kept for CSP safety)
and add `data-dispatch="kb"` + `data-key`:

| Button | `data-dispatch` | `data-key` |
|---|---|---|
| Undo | `kb` | `ctrl+z` |
| Redo | `kb` | `ctrl+y` |
| Cut | `kb` | `ctrl+x` |
| Copy | `kb` | `ctrl+c` |
| Paste | `kb` | `ctrl+v` |

The `data-command` value is irrelevant for `kb` dispatch (the key is what
matters) but keep `noop` to avoid accidental WS dispatch if the KB handler
is absent.

### 3.4 preload.js addition

Add one entry to `contextBridge.exposeInMainWorld('electronAPI', { ... })`:

```javascript
sendKey: (key) => ipcRenderer.send('workbench-key', key),
```

### 3.5 main.js addition

Add one ipcMain handler after the existing `ribbon:pin` handler:

```javascript
ipcMain.on('workbench-key', (_event, key) => {
  if (!state.workbenchView) return;
  const wc = state.workbenchView.webContents;
  const parts = key.toLowerCase().split('+');
  const keyCode = parts[parts.length - 1].toUpperCase();
  const modifiers = parts.slice(0, -1).map(m =>
    m === 'ctrl' ? 'ctrl' : m === 'shift' ? 'shift' : m === 'alt' ? 'alt' : m
  );
  wc.sendInputEvent({ type: 'keyDown', keyCode, modifiers });
  wc.sendInputEvent({ type: 'keyUp',   keyCode, modifiers });
});
```

### 3.6 renderer.js addition

Add a new dispatch branch before the standard WS dispatch, after the
generic toggle branch:

```javascript
  // Keyboard injection — sends key event directly to workbench view
  if (btn.dataset.dispatch === 'kb') {
    const key = btn.dataset.key;
    if (key) window.electronAPI.sendKey(key);
    return;
  }
```

---

## 4. Feature 3 — FIGURES Selection State Model

### 4.1 CSS additions (ribbon.css)

**`.ribbon-btn-select`** — radio-style selector for PLOT TYPE:
Same base style as `.ribbon-btn-small` but with a distinct active state
(blue border + light blue background instead of green) to distinguish
"plot option selected" from "panel toggle active":

```css
/* ── FIGURES selection buttons ─────────────────────────────────────────── */

.ribbon-btn-select {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 5px;
  font-size: 10.5px;
  font-family: 'Segoe UI', sans-serif;
  color: #333333;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  -webkit-app-region: no-drag;
  white-space: nowrap;
  justify-content: flex-start;
}

.ribbon-btn-select:hover {
  background: rgba(0, 88, 156, 0.09);
  border-color: rgba(0, 88, 156, 0.2);
}

.ribbon-btn-select.active {
  background: #DDEEFF;
  border-color: #00589C;
  color: #003366;
}

/* ── FIGURES Plot button ────────────────────────────────────────────────── */

.ribbon-btn-plot {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 4px 10px;
  min-width: 52px;
  font-size: 10px;
  font-family: 'Segoe UI', sans-serif;
  font-weight: 600;
  color: #ffffff;
  background: #2E8B3D;
  border: 1px solid #1a5c27;
  border-radius: 4px;
  cursor: pointer;
  -webkit-app-region: no-drag;
}

.ribbon-btn-plot:hover {
  background: #3aaa4d;
  border-color: #1a5c27;
}

.ribbon-btn-plot:active {
  background: #1a5c27;
}
```

### 4.2 index.html changes — FIGURES tab

**PLOT TYPE group** — change all 12 buttons from `ribbon-btn-small` to
`ribbon-btn-select`, add `data-group="plot-type"` and `data-value`:

| Button | `data-value` | Plots.jl seriestype |
|---|---|---|
| Line | `line` | `:line` |
| Bar | `bar` | `:bar` |
| Scatter | `scatter` | `:scatter` |
| Area | `area` | `:area` |
| Histogram | `histogram` | `:histogram` |
| Boxplot | `boxplot` | `:boxplot` |
| Violin | `violin` | `:violin` |
| Contour | `contour` | `:contour` |
| Surface | `surface` | `:surface` |
| Heatmap | `heatmap` | `:heatmap` |
| Pie Chart | `pie` | `:pie` |
| Stem | `stem` | `:stem` |

Example button markup:
```html
<span class="ribbon-btn-select" data-group="plot-type" data-value="scatter" data-command="noop">
  <span class="ribbon-icon"><img src="assets/icons/figures/scatter.svg" width="22" height="18" alt="" /></span>
  <span>Scatter</span>
</span>
```

**STYLE group** — change 5 buttons from `ribbon-btn-small` to
`ribbon-btn-select`, add `data-group="plot-style"` and `data-value`:

| Button | `data-value` |
|---|---|
| Theme | `theme` |
| Colors | `colors` |
| Line Width | `linewidth` |
| Markers | `markers` |
| Opacity | `opacity` |

**AXES group** — change 6 buttons from `ribbon-btn-small` to
`ribbon-btn-select`, add `data-group="plot-axes"` and `data-value`:

| Button | `data-value` |
|---|---|
| X Label | `xlabel` |
| Grid | `grid` |
| X Limits | `xlims` |
| Y Label | `ylabel` |
| Legend | `legend` |
| Y Limits | `ylims` |

**ANIMATE group** — unchanged this sprint (noop, `ribbon-btn-small`).

**FIGURE group** — wire Close and Close All (section 2.2); keep New and Tile/Cascade as-is.

**Plot button** — append as the last group after ANIMATE, before the
closing `</div><!-- FIGURES -->`:

```html
        <!-- PLOT — executes the assembled plot configuration (Sprint 9) -->
        <div class="ribbon-group" style="border-right:none;">
          <div class="ribbon-group-inner" style="align-items:center;">
            <span class="ribbon-btn-plot" data-command="noop" data-dispatch="plot-builder">
              <span class="ribbon-icon">
                <img src="assets/icons/figures/new.svg" width="26" height="26" alt="" />
              </span>
              <span>Plot</span>
            </span>
          </div>
          <div class="ribbon-group-label">PLOT</div>
        </div>
```

### 4.3 renderer.js additions

**`window.plotConfig` initialisation** — add near the top of `renderer.js`
after `'use strict'`:

```javascript
// ── FIGURES plot configuration accumulator ────────────────────────────────────
window.plotConfig = {
  type:  null,   // string: selected plot type ('scatter', 'line', etc.)
  style: [],     // array: active style options
  axes:  [],     // array: active axes options
};
```

**FIGURES selection dispatch** — add a new branch in the click handler
before the standard WS dispatch:

```javascript
  // FIGURES selection — radio group (plot-type) or multi-toggle (style/axes)
  if (btn.dataset.group) {
    const group = btn.dataset.group;
    const value = btn.dataset.value;
    if (group === 'plot-type') {
      // Radio: deselect all others in group
      document.querySelectorAll('[data-group="plot-type"]')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      window.plotConfig.type = value;
    } else if (group === 'plot-style') {
      btn.classList.toggle('active');
      const idx = window.plotConfig.style.indexOf(value);
      if (idx === -1) window.plotConfig.style.push(value);
      else window.plotConfig.style.splice(idx, 1);
    } else if (group === 'plot-axes') {
      btn.classList.toggle('active');
      const idx = window.plotConfig.axes.indexOf(value);
      if (idx === -1) window.plotConfig.axes.push(value);
      else window.plotConfig.axes.splice(idx, 1);
    }
    return;
  }
```

The `plot-builder` dispatch (`data-dispatch="plot-builder"`) falls through
to the noop guard this sprint — no handler needed until Sprint 9.

---

## 5. Feature 4 — Plot Builder SDD (document deliverable)

`docs/Sprint 8/SDD-plot-builder.md` covers:

- **Variable discovery:** execute `filter(x -> x != :ans, names(Main))`
  in the REPL via a new `julialab.getWorkspaceVariables` extension command;
  return variable names + types over the WS bridge using ADR-024 argument
  extension.

- **ADR-024 design:** extend WS message format to `{ command, args?: any[] }`
  so `extension.ts` can call `vscode.commands.executeCommand(command, ...args)`.
  Backward compatible — messages without `args` continue to work as before.

- **Webview:** a VSCodium webview panel opened by the Plot button. Shows
  dropdowns for x/y/z variables (populated from workspace), reads
  `window.plotConfig` for type/style/axes, and has a Run button that
  generates the Plots.jl call and sends it to the REPL.

- **Code generation:** produce valid Julia code from selections:
  ```julia
  plot(x, y, seriestype=:scatter, markers=true, xlabel="x", ylabel="y")
  ```

- **Execution:** send generated code via `executeJuliaCodeInREPL` with the
  code string as argument (requires ADR-024).

---

## 6. Files Changed Summary

| File | Changes |
|---|---|
| `index.html` | 12 command id wires; 5 KB dispatch attrs; 23 FIGURES select attrs; Plot button |
| `preload.js` | +1 line: `sendKey` |
| `main.js` | +1 ipcMain handler: `workbench-key` |
| `renderer.js` | +1 dispatch branch: `kb`; +1 dispatch branch: `group`; `window.plotConfig` init |
| `ribbon.css` | +`.ribbon-btn-select` style; +`.ribbon-btn-plot` style |
| `docs/Sprint 8/SDD-plot-builder.md` | New document |
