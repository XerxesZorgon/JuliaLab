# ADR-023: COMMAND WINDOW panel-state sync protocol over WS bridge

**Date:** 2026-07-02
**Status:** Accepted
**Sprint:** 7

## Context

The VIEW tab COMMAND WINDOW toggle button dispatches
`workbench.action.terminal.toggleTerminal`, which hides or shows the terminal
panel in VSCodium. In Sprint 6 this caused a visible bug: clicking the button
when the terminal was already visible correctly hid it, but the button's
`.active` state was toggled by the click handler regardless of actual panel
state — so a second click re-toggled the visual state without the terminal
coming back, leaving button and panel permanently out of sync.

To fix this, `extension.ts` (running in the extension host) must observe the
actual terminal panel state and publish it to the ribbon renderer over the
existing WS bridge. The question is what message format to use.

## Decision

The WS bridge receives messages from the ribbon renderer (renderer → extension)
for command dispatch. Sprint 7 adds a **reverse channel**: the extension can
also send messages to the renderer (extension → renderer) to publish state
events.

Message format for panel state events (extension → renderer):

```json
{ "event": "panelState", "panel": "terminal", "open": true }
```

- `event` distinguishes state-push messages from command messages (which have
  `command`).
- `panel` identifies which panel changed. Only `"terminal"` is used this
  sprint; the field is forward-compatible for future panels.
- `open` is a boolean reflecting the current visibility state.

`extension.ts` subscribes to `vscode.window.onDidOpenTerminal` and
`vscode.window.onDidCloseTerminal` to detect state changes and sends this
message to all connected WS clients.

`renderer.js` adds a `ws.onmessage` handler that reads `event === 'panelState'`
messages and sets the COMMAND WINDOW button's `.active` class accordingly.

## Rationale

- Adding an `event` field is backward-compatible — the existing command
  dispatch handler only processes messages with a `command` field and ignores
  others.
- `onDidOpenTerminal` / `onDidCloseTerminal` are the authoritative VSCode API
  events for terminal panel state; they fire reliably on
  `workbench.action.terminal.toggleTerminal` and on direct user interaction.
- A new WS message type is cleaner than a synthetic `julialab.*` command
  because it carries a payload (the `open` boolean) that the command channel
  was not designed to carry.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Synthetic `julialab.terminalState` command | Command channel has no payload; would require encoding state in the command id string |
| Separate WebSocket port for events | Unnecessary complexity; the existing bridge handles arbitrary JSON |
| Poll panel state from renderer on a timer | Fragile, adds load, wrong direction for event-driven architecture |

## Consequences

- `extension.ts` gains a reverse-send path: the WS `ws` reference must be
  stored so the event handler can send to it. The current implementation
  creates `ws` inside the `connection` callback — it must be captured in a
  module-level variable or Set for reverse sends.
- `renderer.js` gains a `message` event listener on the ribbon WS connection.
  This requires a client-side WS in the renderer — currently the ribbon
  dispatches commands via `ipcRenderer` → `main.js` → WS. For receiving events,
  the renderer needs its own WS client on port 2999.
- `preload.js` must expose a way for renderer.js to receive WS events, or
  the renderer opens its own WebSocket directly (allowed under CSP since it
  connects to `ws://127.0.0.1:2999`, same origin).
- Sprint 8 can extend this pattern to publish other panel states (workspace,
  plot pane) when those PANES buttons are wired.
