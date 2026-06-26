# Software Description Document — Sprint 3
**Project:** JuliaLabApp — `julialab` VSCodium extension  
**Version:** 0.1  
**Date:** 2026-06-24  
**Author:** John Peach / eurAIka  
**Repo:** `C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp`  
**Prior sprints:** `sprint1-complete` (70c04cc), `sprint2-complete` (ae7bb5a)

---

## 1. Purpose

JuliaLab's embedded VSCodium workbench ships with `julialang.language-julia`
(julia-vscode) installed, which already provides a Julia REPL, workspace
variable panel, and plot pane. However, on each launch the user faces a
blank "NO FOLDER OPENED" workbench with no REPL running and no panels
visible — the opposite of MATLAB's out-of-box experience.

Sprint 3 makes JuliaLab self-configuring: a thin custom `julialab` VSCodium
extension opens a default workspace folder, auto-starts the Julia REPL,
applies a MATLAB-style default layout, and wires the Electron ribbon tabs to
julia-vscode's existing commands. No new Julia runtime code is written; all
Julia execution, workspace introspection, and plot display is delegated to
julia-vscode.

---

## 2. Users and Use Cases

| User | Use Case | Priority |
|---|---|---|
| Scientist migrating from MATLAB | Opens JuliaLab, sees Julia REPL ready, types code, sees variables in workspace panel | High |
| Scientist migrating from MATLAB | Generates a CairoMakie plot, clicks PLOTS ribbon tab, sees rendered figure | High |
| Scientist migrating from MATLAB | Clicks HOME ribbon tab to return to the editor from any panel | High |
| Developer evaluating JuliaLab | Launches for the first time, sees MATLAB-familiar layout without manual setup | High |

---

## 3. Key Features

1. **Default workspace folder.** On launch, `main.js` opens (or creates)
   `%USERPROFILE%\JuliaLab` as the VSCodium workspace folder, passed to
   `codium serve-web` via the appropriate CLI flag. This satisfies the
   julia-vscode activation condition and gives the user a durable home
   directory for Julia scripts.

2. **Auto-start Julia REPL.** The `julialab` extension runs
   `language-julia.startREPL` in its `activate()` function, bringing up
   the Julia REPL in the integrated terminal within 5 seconds of launch,
   without user action.

3. **MATLAB-style default layout.** On first open of the default workspace,
   the `julialab` extension applies a layout: editor centre, Julia sidebar
   (Workspace / Plot Navigator / Documentation) visible on the left via
   the Julia activity bar icon, integrated terminal bottom. Applied via
   VSCodium's `workbench.action.*` command family and/or `settings.json`
   defaults. Layout is not re-applied on subsequent launches (one-shot via
   a workspace state flag).

4. **Ribbon → VSCodium command bridge.** Electron ribbon tab clicks (HOME,
   PLOTS) are routed through `ipcMain` → `webContentsView.executeJavaScript`
   → `vscode.commands.executeCommand` into the workbench. The `julialab`
   extension registers the target commands that the ribbon calls. PLOTS tab
   invokes `language-julia.show-plotpane`. HOME tab focuses the editor group.

5. **Spike gates.** Two spikes precede any wiring work:
   - Spike A: confirm `codium serve-web` CLI flag for opening a default
     folder (`--default-folder` or `--folder-uri`), and confirm the flag
     causes julia-vscode to activate.
   - Spike B: confirm julia-vscode's plot pane is accessible as a
     WebviewPanel in the serve-web browser context (i.e., CairoMakie
     output renders in the pane, not in a popup or nowhere).

---

## 4. Non-Goals

- Building a custom workspace variable panel UI (julia-vscode's
  `REPLVariables` tree view is used as-is).
- Building a custom plot display pipeline (julia-vscode's plot pane is
  used as-is; the Compute42 named-pipe / `JuliaLabDisplay` architecture
  is not ported).
- Wolfram Engine or Lean4 panel integration.
- Pluto.jl Live Editor tab.
- Extension marketplace publication or VSIX packaging for distribution.
- Panel size or ratio control.
- Wiring ribbon tabs other than HOME and PLOTS (APPS, LIVE EDITOR, INSERT,
  VIEW are deferred to future sprints).

---

## 5. Success Criteria

**SC-1 — Default workspace + REPL auto-start:**  
On launch, JuliaLab opens (or creates) `%USERPROFILE%\JuliaLab` as the
default workspace folder. The Julia REPL starts automatically in the
integrated terminal within 5 seconds, without any user action.

**SC-2 — Workspace panel visible:**  
The Julia workspace panel (`REPLVariables`) is visible in the primary
sidebar on launch. After the user types `x = rand(3,3)` in the REPL,
`x` appears in the panel within 3 seconds.

**SC-3 — Plot pane accessible (spike gate):**  
julia-vscode's plot pane is confirmed accessible as a WebviewPanel in
the serve-web browser context. Spike must pass before ribbon wiring is
attempted. After the spike: clicking the PLOTS ribbon tab brings the
plot pane to focus, and a CairoMakie figure renders there.

**SC-4 — HOME tab wired:**  
Clicking the HOME ribbon tab focuses the active editor group.

---

## 6. Constraints

| Dimension | Constraint |
|---|---|
| Language | TypeScript (VSCodium extension); JavaScript (Electron `main.js` amendment) |
| Platform | Windows 10 x64; serve-web context (browser renderer, no Node.js in extension host) |
| Electron | 39.8.8 (pinned) |
| VSCodium | 1.121.03429 (pinned) |
| julia-vscode | 1.219.2 (pre-installed in `server-data/extensions/`) |
| Extension location | `JuliaLabApp/extensions/julialab/` — served from `server-data/extensions/` via build copy |
| No new Julia runtime | Julia process management fully delegated to julia-vscode; no `julialab-server.jl` |
| One file per task | Atomic development discipline inherited from Sprints 1–2 |
| Spike-gated | SC-3 ribbon wiring may not proceed until Spike B passes |
| Timeline | Sprint 3 complete before Sprint 4 (Pluto.jl Live Editor) begins |

---

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `codium serve-web` does not accept `--default-folder` or equivalent flag | Medium | High — blocks SC-1 and SC-2 | Spike A resolves this; fallback: open folder via extension API on activate |
| julia-vscode plot pane not accessible as WebviewPanel in serve-web context | Low | High — blocks SC-3 | Spike B resolves this; fallback: defer SC-3 to Sprint 4 |
| julia-vscode does not activate without an explicit `.jl` file open | Medium | Medium — auto-REPL may not fire | Force activate via `julialab` extension calling `vscode.extensions.getExtension('julialang.language-julia').activate()` |
| `workbench.action.*` layout commands differ between VSCodium 1.121 and upstream VS Code docs | Medium | Low — layout preset may need manual command discovery | Use DevTools console in serve-web to enumerate available commands at spike time |
| `webContentsView.executeJavaScript` cannot reach VSCodium extension host API | Low | High — blocks ribbon wiring entirely | Confirmed working in Sprint 1 POC for window controls; same mechanism |
