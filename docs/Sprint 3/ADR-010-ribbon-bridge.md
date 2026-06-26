# ADR-010: Ribbon → Workbench Command Bridge Mechanism

**Date:** 2026-06-24  
**Status:** Accepted  
**Sprint:** 3  
**Deciders:** John Peach, Claude (eurAIka)

---

## Context

The Electron ribbon (`index.html` / `renderer.js`) runs in a separate
`WebContentsView` from the VSCodium workbench. To invoke a VSCodium command
from a ribbon tab click, a cross-process communication path is required.

The current ribbon already sends window control actions (minimise, maximise,
close) via `ipcRenderer.send` → `ipcMain` → `app` API. The same pattern must
be extended to dispatch VSCodium commands.

Three mechanisms are available for the final hop (Electron main process →
VSCodium workbench):

**Option A — `webContentsView.executeJavaScript`:**  
`main.js` calls `workbenchView.webContents.executeJavaScript(script)` where
`script` invokes the VSCodium command via the browser-global `acquireVsCodeApi`
or via a custom event the `julialab` extension listens for on `window`.

**Option B — Dedicated WebSocket channel:**  
`main.js` opens a WebSocket server; the `julialab` extension connects as a
client. Ribbon events are sent as JSON messages over the socket. The extension
dispatches the corresponding `vscode.commands.executeCommand` call.

**Option C — VSCodium's `--command` CLI flag:**  
`codium serve-web` does not support `--command` injection after startup.
Ruled out.

---

## Decision

**Option A — `webContentsView.executeJavaScript`.**

Rationale:
- The mechanism is already proven in JuliaLabApp: Sprint 1 uses
  `executeJavaScript` for window control actions without issue.
- Option B (WebSocket) introduces a second server process, a port to manage,
  and connection lifecycle complexity for a problem that is already solved
  by Option A.
- `acquireVsCodeApi()` is available in the browser context of a VSCodium
  WebviewPanel but not in the main workbench frame. The correct target is
  a `window`-level custom event that the `julialab` extension registers a
  listener for in its `activate()` function.

**Mechanism in detail:**

```
Ribbon tab click (renderer.js)
  → ipcRenderer.send('ribbon-command', { command: 'julialab.showPlots' })
  → ipcMain listener (main.js)
  → workbenchView.webContents.executeJavaScript(
      `window.dispatchEvent(new CustomEvent('julialab-command',
        { detail: { command: 'julialab.showPlots' } }))`
    )
  → julialab extension (activate.ts)
      window.addEventListener('julialab-command', e => {
        vscode.commands.executeCommand(e.detail.command)
      })
```

The `julialab` extension registers a `window` event listener in `activate()`
and maps incoming command strings to `vscode.commands.executeCommand` calls.
This keeps `main.js` agnostic of VSCodium command names — it dispatches
opaque string identifiers. The extension owns the mapping from ribbon command
IDs to VSCodium commands.

**Commands wired in Sprint 3:**

| Ribbon tab | IPC command string | VSCodium command |
|---|---|---|
| HOME | `julialab.focusEditor` | `workbench.action.focusFirstEditorGroup` |
| PLOTS | `julialab.showPlots` | `language-julia.show-plotpane` |

Additional tabs (APPS, LIVE EDITOR, INSERT, VIEW) are deferred; their IPC
strings are defined but map to a no-op in Sprint 3 to avoid errors.

---

## Consequences

- `renderer.js` gains ribbon tab click handlers that call `ipcRenderer.send`.
- `main.js` gains an `ipcMain.on('ribbon-command', ...)` handler and the
  `executeJavaScript` call.
- `julialab` extension `activate()` registers the `window` event listener.
- The `julialab` extension must be active before ribbon clicks can be
  processed — activation race is mitigated by the auto-REPL start sequence
  ensuring the extension is active within 5 seconds of launch. Ribbon clicks
  before extension activation are silently dropped (no crash).
- `executeJavaScript` calls are fire-and-forget; error handling is limited to
  the DevTools console. This is acceptable for Sprint 3 scope.
