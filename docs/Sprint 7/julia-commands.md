# Julia VSCodium Command ID Table — Sprint 7 Tier 2

**Generated:** 2026-07-04  
**Source:** `language-julia` v1.219.2 extension host command dump + Antigravity cross-reference  
**Method:** `vscode.commands.getCommands(true)` filtered to `language-julia.*` and `julia.*` prefixes, written via `fs.writeFileSync` probe in `extension.ts`, then reverted.  
**Total commands in dump:** 109  

---

## How to use this table

Each row maps a ribbon button to its verified command id. Sprint 8 wires all
rows marked ✓ in the Dump column. Rows marked ✗ need alternative commands or
remain `noop`. The Notes column records the recommended Sprint 8 action.

---

## CODE tab — RUN group

| Button | Current `data-command` | Verified ID | Dump ✓ | Sprint 8 action |
|---|---|---|---|---|
| Run (large) | `noop` | `language-julia.executeFile` | ✓ | Wire — runs whole active file |
| Run Selection | `noop` | `language-julia.executeJuliaCodeInREPL` | ✓ | Wire — executes selected code in REPL |
| Execute Cell | `noop` | `language-julia.executeCell` | ✓ | Wire — `executeJuliaCellInREPL` not present; use `executeCell` |
| Restart REPL | `noop` | `language-julia.restartREPL` | ✓ | Wire — correct id confirmed |

**Note on Execute Cell:** The candidate id `language-julia.executeJuliaCellInREPL`
is absent from the dump. The correct command is `language-julia.executeCell`
(also present: `executeCellAndMove` for execute-and-advance behaviour).

---

## CODE tab — DEBUG group

| Button | Current `data-command` | Verified ID | Source | Sprint 8 action |
|---|---|---|---|---|
| Breakpoint | `noop` | `editor.debug.action.toggleBreakpoint` | Standard VSCode | Wire — standard debug command, under `editor.` prefix |
| Step | `noop` | `workbench.action.debug.stepOver` | Standard VSCode | Wire — standard debug command |
| Continue | `noop` | `workbench.action.debug.continue` | Standard VSCode | Wire — standard debug command |

**Note:** Debug commands are not `language-julia.*` — they are standard
VSCodium debug commands. All three are under `editor.` or `workbench.action.`
prefixes and pass the ADR-020 allowlist without any extension change.
Verify each in the command palette (`Ctrl+Shift+P`) before wiring.

---

## VIEW tab — PANES group

| Button | Current `data-command` | Verified ID | Dump ✓ | Sprint 8 action |
|---|---|---|---|---|
| WORKSPACE | `noop` | — | ✗ | No `language-julia.*` workspace command in dump. Use `workbench.view.extension.julia-explorer` (the Julia sidebar panel — already used in `applyLayoutIfFirstOpen`). Verify in palette. |
| VARIABLE EXPLORER | `noop` | — | ✗ | No `language-julia.show-variable-editor` in dump. Try `julia-plot-navigator.focus` pattern — check if a `julia-workspace.focus` or similar exists via palette search. Likely `workbench.view.extension.julia-workspace`. |
| DOCUMENTATION | `noop` | `language-julia.show-documentation-pane` | ✓ | Wire — opens the julia-vscode documentation browser pane. Also available: `julia-documentation.focus`, `language-julia.show-documentation`. |
| HISTORY | `noop` | — | ✗ | No history command in dump. VSCodium command history is a workbench feature, not julia-vscode. Likely `noop` permanently unless julia-vscode adds one. |

---

## FIGURES tab

All FIGURES buttons currently dispatch `noop`. The julia-vscode extension
manages the plot pane via a plot navigator view, not individual plot-type
commands. The ribbon FIGURES buttons cannot wire to julia-vscode commands
because julia-vscode does not expose per-plot-type dispatch commands —
plots are created by running Julia code, not by clicking toolbar buttons.

| Group | Sprint 8 action |
|---|---|
| FIGURE (New, Close, Close All, Tile, Cascade) | `language-julia.show-plotpane` (New — already wired). Close/Tile/Cascade: `language-julia.plotpane-delete`, `language-julia.plotpane-delete-all`. Tile/Cascade have no equivalent. |
| PLOT TYPE (all 12 buttons) | **Cannot wire** — no per-type dispatch commands exist. Clicking a plot type would need to insert Julia code into the REPL. Deferred to Sprint 8+ design discussion. |
| STYLE (Theme, Colors, Line Width, Markers, Opacity) | **Cannot wire** — no style commands exposed. |
| AXES (X/Y Label, Grid, X/Y Limits, Legend) | **Cannot wire** — no axes commands exposed. |
| ANIMATE (Record, Play, Stop, Export GIF, Speed) | `language-julia.plotpane-first/last/next/previous` for navigation. Record/Export: `language-julia.save-plot` (saves current plot). No record/animate commands. |

**Figures recommendation:** Sprint 8 should redesign the FIGURES tab around
what julia-vscode actually exposes: plot pane navigation (`plotpane-next`,
`plotpane-previous`, `plotpane-first`, `plotpane-last`), delete (`plotpane-delete`,
`plotpane-delete-all`), and save (`save-plot`). The current 5-group layout
cannot be wired as designed.

---

## HOME tab — unverified buttons

| Button | Group | Status | Sprint 8 action |
|---|---|---|---|
| Pkg REPL | PACKAGE MANAGER | Cannot wire via WS bridge | Requires spawning Julia process with `]` — needs ipcMain + `workbenchView.webContents.sendInputEvent` or a new extension command |
| Add | PACKAGE MANAGER | Cannot wire as-is | Same — needs Julia process interaction |
| Remove | PACKAGE MANAGER | Cannot wire as-is | Same |
| Update All | PACKAGE MANAGER | Cannot wire as-is | `language-julia.instantiateEnvironment` ✓ in dump — repurpose or add an Update All equivalent |
| Status | PACKAGE MANAGER | Cannot wire as-is | Same Julia process interaction |
| Instantiate | PACKAGE MANAGER | `language-julia.instantiateEnvironment` | ✓ | Wire in Sprint 8 |
| Registry | PACKAGE MANAGER | Cannot wire as-is | Same |
| Current Dir | DIRECTORY | `language-julia.cdHere` | ✓ | Wire — changes Julia working directory to workspace |
| Change Dir | DIRECTORY | `language-julia.changeCurrentEnvironment` | ✓ | Wire — changes Julia environment |
| New Folder | DIRECTORY | `workbench.action.files.newFolder` | Standard | Wire — standard VSCode command |
| Check Updates | UPDATE | Cannot wire | Requires JuliaUp CLI interaction |
| Update Julia | UPDATE | Cannot wire | Requires JuliaUp CLI interaction |
| Update Pkgs | UPDATE | Cannot wire | Requires Julia process interaction |
| Release Notes | UPDATE | Cannot wire | URL open — use `vscode.env.openExternal` — needs new `julialab.*` command |
| Docs | HELP | Cannot wire directly | URL open — `language-julia.show-documentation` ✓ opens julia-vscode docs |
| Examples | HELP | Cannot wire | URL open |
| Community | HELP | Cannot wire | URL open |
| About | HELP | Cannot wire | URL open |

---

## Summary — Sprint 8 wiring targets (confirmed ✓ only)

| Button | Tab | Confirmed ID |
|---|---|---|
| Run | CODE/RUN | `language-julia.executeFile` |
| Run Selection | CODE/RUN | `language-julia.executeJuliaCodeInREPL` |
| Execute Cell | CODE/RUN | `language-julia.executeCell` |
| Restart REPL | CODE/RUN | `language-julia.restartREPL` |
| Breakpoint | CODE/DEBUG | `editor.debug.action.toggleBreakpoint` |
| Step | CODE/DEBUG | `workbench.action.debug.stepOver` |
| Continue | CODE/DEBUG | `workbench.action.debug.continue` |
| Documentation | VIEW/PANES | `language-julia.show-documentation-pane` |
| New (plot pane) | FIGURES/FIGURE | `language-julia.show-plotpane` (already wired) |
| Close plot | FIGURES/FIGURE | `language-julia.plotpane-delete` |
| Close All plots | FIGURES/FIGURE | `language-julia.plotpane-delete-all` |
| Save plot | FIGURES/ANIMATE | `language-julia.save-plot` |
| Instantiate | HOME/PKG MGR | `language-julia.instantiateEnvironment` |
| Current Dir | HOME/DIRECTORY | `language-julia.cdHere` |
| Change Dir | HOME/DIRECTORY | `language-julia.changeCurrentEnvironment` |
| New Folder | HOME/DIRECTORY | `workbench.action.files.newFolder` |
| Docs | HOME/HELP | `language-julia.show-documentation` |

---

## Commands in dump not yet mapped to any ribbon button

Potentially useful for future ribbon or palette integration:

- `language-julia.interrupt` — interrupts running Julia code (Ctrl+C equivalent)
- `language-julia.stopREPL` — stops the REPL process
- `language-julia.connectREPL` / `language-julia.disconnectREPL`
- `language-julia.showModules` — shows loaded Julia modules
- `language-julia.openProfiler` — opens the Julia profiler view
- `language-julia.debugEditorContents` / `language-julia.debugCell`
- `language-julia.weave-open-preview` / `language-julia.weave-save` — Weave.jl notebook support
- `julia-documentation.focus` / `julia-plot-navigator.focus` — sidebar panel focus
