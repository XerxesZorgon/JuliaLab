# ADR-008: Default Workspace Folder Strategy

**Date:** 2026-06-24  
**Status:** Accepted  
**Sprint:** 3  
**Deciders:** John Peach, Claude (eurAIka)

---

## Context

julia-vscode activates on three events: `onLanguage:julia`, `onNotebook:jupyter-notebook`,
and `workspaceContains:Project.toml`. In the Sprint 2 baseline, VSCodium launches with
no folder open ("NO FOLDER OPENED"). In that state none of these activation events fire,
so julia-vscode does not activate, the REPL cannot be started, and the workspace panel
and plot pane are unavailable. SC-1 and SC-2 are blocked unless a workspace folder is
open at launch.

Two mechanisms are available to open a folder:

**Option A — CLI flag to `codium serve-web`:**  
Pass a folder path argument when spawning the server process in `main.js`. The flag
syntax is unconfirmed for serve-web (candidates: `--default-folder <path>`,
`--folder-uri vscode-remote://...`, or a bare path argument). Spike A must determine
the correct syntax. If the flag exists, the folder is open before the browser tab
loads — zero extension code required.

**Option B — Extension API on activate:**  
The `julialab` extension calls `vscode.commands.executeCommand('vscode.openFolder', uri)`
in its `activate()` function. This requires the extension to be in a state where it can
activate without a folder (i.e., registered with an unconditional `activationEvent`
such as `*` or `onStartupFinished`). It also causes the workbench to reload after
opening the folder, introducing a visible flash and a second activation cycle.

---

## Decision

**Primary: Option A.** Spike A will determine the correct CLI flag syntax for
`codium serve-web`. If a working flag is found, `main.js` is amended to:

1. Resolve `%USERPROFILE%\JuliaLab` (Windows) at startup.
2. Create the directory if it does not exist (`fs.mkdirSync(path, { recursive: true })`).
3. Pass the confirmed flag to the `codium serve-web` spawn arguments.

**Fallback: Option B**, activated only if Spike A finds no working CLI flag.
In that case, `julialab` extension uses `activationEvents: ["onStartupFinished"]`
and calls `vscode.openFolder` once, accepting the reload cycle as a one-time
first-launch cost. A workspace state key (`julialab.folderOpened`) prevents
re-triggering on subsequent launches.

**Workspace directory:** `%USERPROFILE%\JuliaLab` (`os.homedir() + '/JuliaLab'`
in Node.js). This mirrors MATLAB's `%USERPROFILE%\Documents\MATLAB` convention:
a durable, user-owned location that survives JuliaLab reinstalls and is the
natural home for user Julia scripts.

---

## Consequences

- `main.js` gains ~10 lines: path resolution, `mkdirSync`, and one additional
  spawn argument. This is a Sprint 3 Task 002 change to an existing Sprint 1/2 file.
- The `%USERPROFILE%\JuliaLab` directory is created on first launch and persists.
  Users who prefer a different working directory can change it via VSCodium's
  standard "Open Folder" command; JuliaLab does not override subsequent opens.
- Spike A result is the gate for Task 002. If Option B fallback is needed, the
  extension design gains an `onStartupFinished` activation event and a reload cycle.
