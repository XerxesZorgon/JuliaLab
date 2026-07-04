# Software Design Document — Sprint 7

**Project:** JuliaLabApp
**Sprint:** 7 — Ribbon button wiring (Tier 1) + COMMAND WINDOW sync + DevTools
**Version:** 0.1
**Date:** 2026-07-02
**Author:** John Peach / eurAIka
**ADRs in force:** ADR-020, ADR-021, ADR-022, ADR-023

---

## 1. Architecture Overview

No new architectural components. Three existing files change:

```
index.html      ← command id corrections + Tier 1 wiring
extension.ts    ← terminal event publisher (ADR-023) + build:ext
renderer.js     ← WS client for events + tab-text hide on collapse
main.js         ← globalShortcut Ctrl+Shift+I for DevTools
```

The WS bridge already supports bidirectional JSON. Sprint 7 adds the reverse
direction: extension host → ribbon renderer via the existing port 2999.

---

## 2. Command ID Table — Tier 1 (wire this sprint)

All commands below are verified by prefix (`workbench.action.*` or
`editor.action.*`) and require no additional verification.

### HOME tab

| Button | Current `data-command` | Sprint 7 `data-command` | Change? |
|---|---|---|---|
| Find in Files | `workbench.action.findInFiles` | same | — |
| Replace | `workbench.action.replaceInFiles` | same | — |
| Symbols | `workbench.action.showAllSymbols` | same | — |
| Go to File | `workbench.action.quickOpen` | same | — |
| Preferences | `workbench.action.openSettings` | same | — |
| Keybindings | `workbench.action.openGlobalKeybindings` | same | — |
| Theme (SETTINGS) | `workbench.action.selectTheme` | `noop` | Change — opens picker without args, confusing |
| All DIRECTORY buttons | `noop` | `noop` | — (Julia process, Sprint 8+) |
| All PACKAGE MANAGER buttons | `noop` | `noop` | — (Julia process, Sprint 8+) |
| All UPDATE buttons | `noop` | `noop` | — (JuliaUp, Sprint 8+) |
| All HELP buttons | `noop` | `noop` | — (URLs, Sprint 8+) |
| Extensions | `noop` | `noop` | — (activity bar, Sprint 8) |

**Net HOME changes:** 1 change (Theme → noop). SEARCH and SETTINGS/Preferences
and SETTINGS/Keybindings already have correct ids from Sprint 6.

### CODE tab

| Button | Current `data-command` | Sprint 7 `data-command` | Change? |
|---|---|---|---|
| New | `workbench.action.files.newUntitledFile` | same | — |
| Open | `workbench.action.files.openFile` | same | — |
| Save | `workbench.action.files.save` | same | — |
| Undo | `undo` | `editor.action.undo` | Fix — bare `undo` fails prefix check |
| Redo | `redo` | `editor.action.redo` | Fix — bare `redo` fails prefix check |
| Paste | `editor.action.clipboardPasteAction` | same | — |
| Multicursor | `noop` | `noop` | — (no single command, Sprint 8) |
| Cut | `editor.action.clipboardCutAction` | same | — |
| Copy | `editor.action.clipboardCopyAction` | same | — |
| Go to Def | `editor.action.revealDefinition` | same | — |
| Find | `editor.action.startFindReplaceAction` | same | — |
| Forward | `workbench.action.navigateForward` | same | — |
| Back | `workbench.action.navigateBack` | same | — |
| Refactor | `noop` | `noop` | — (language server, Tier 2) |
| Indent | `editor.action.indentLines` | same | — |
| Comment | `editor.action.commentLine` | same | — |
| Run (large) | `language-julia.executeJuliaCodeInREPL` | `noop` `<!-- Tier 2: language-julia.executeJuliaCodeInREPL -->` | Change — Tier 2 pending verification |
| Run Selection | `language-julia.executeJuliaCodeInREPL` | `noop` `<!-- Tier 2 -->` | Change |
| Execute Cell | `language-julia.executeJuliaCellInREPL` | `noop` `<!-- Tier 2 -->` | Change |
| Restart REPL | `language-julia.restartLanguageServer` | `noop` `<!-- Tier 2: likely language-julia.restartREPL -->` | Change |
| Breakpoint | `noop` | `noop` `<!-- Tier 2: workbench.debug.* -->` | — |
| Step | `noop` | `noop` `<!-- Tier 2 -->` | — |
| Continue | `noop` | `noop` `<!-- Tier 2 -->` | — |

**Net CODE changes:** 2 fixes (undo/redo), 4 demotions to noop with Tier 2
comments (RUN group).

### FIGURES tab

| Button | Current `data-command` | Sprint 7 `data-command` | Change? |
|---|---|---|---|
| New (FIGURE) | `language-julia.show-plotpane` | `noop` `<!-- Tier 2: language-julia.show-plotpane — verified Sprint 6 but belongs in Tier 2 table -->` | Note: this was working; keep as-is |
| All other FIGURES buttons | `noop` | `noop` `<!-- Tier 2 -->` | — |

**Net FIGURES changes:** 0. FIGURE/New stays wired (already verified). All
PLOT TYPE, STYLE, AXES, ANIMATE buttons remain `noop` — all are
`language-julia.*` (Tier 2).

### VIEW tab

| Button | Current `data-command` | Sprint 7 `data-command` | Change? |
|---|---|---|---|
| FILE BROWSER | `workbench.view.explorer` | same | — |
| COMMAND WINDOW | `workbench.action.terminal.toggleTerminal` | same + sync | ADR-023 sync added |
| WORKSPACE | `language-julia.show-workspace` | `noop` `<!-- Tier 2 -->` | Change |
| VARIABLE EXPLORER | `workbench.action.focusActiveEditorGroup` | `noop` `<!-- Tier 2 -->` | Change (placeholder was wrong) |
| DOCUMENTATION | `workbench.action.focusActiveEditorGroup` | `noop` `<!-- Tier 2 -->` | Change |
| HISTORY | `workbench.action.focusActiveEditorGroup` | `noop` `<!-- Tier 2 -->` | Change |
| Load layout | `workbench.action.editorLayoutTwoColumns` | same | — |
| Theme LIGHT | `noop` | same | — |
| Theme DARK | `noop` | same | — |
| Hide Ribbon | `ribbon:hide` (ipc) | same | — |
| Pin Ribbon | `ribbon:pin` (ipc) | same | — |

**Net VIEW changes:** 4 changes (WORKSPACE, VARIABLE EXPLORER, DOCUMENTATION,
HISTORY → noop with Tier 2 comments). FILE BROWSER already wired.

---

## 3. COMMAND WINDOW Sync (ADR-023)

### extension.ts additions

A module-level `Set<WebSocket>` tracks connected clients so the event handler
can broadcast:

```typescript
const connectedClients = new Set<import('ws').WebSocket>();
```

Inside `wss.on('connection', ws => { ... })`, add:
```typescript
connectedClients.add(ws);
ws.on('close', () => connectedClients.delete(ws));
```

Terminal event subscriptions (in `activate()`, after `registerWebSocketBridge`):
```typescript
vscode.window.onDidOpenTerminal(() => broadcastPanelState('terminal', true), null, context.subscriptions);
vscode.window.onDidCloseTerminal(() => {
  const stillOpen = vscode.window.terminals.length > 0;
  broadcastPanelState('terminal', stillOpen);
}, null, context.subscriptions);
```

Broadcast helper:
```typescript
function broadcastPanelState(panel: string, open: boolean): void {
  const msg = JSON.stringify({ event: 'panelState', panel, open });
  connectedClients.forEach(ws => {
    if (ws.readyState === 1 /* OPEN */) ws.send(msg);
  });
}
```

### renderer.js additions

The ribbon renderer opens its own WebSocket client on port 2999 to receive
events. CSP allows `ws://127.0.0.1` (localhost, `default-src 'self'`).

Add after the existing dispatch block:

```javascript
// ── Event receiver (extension → renderer) ────────────────────────────────────

function connectEventReceiver() {
  const ws = new WebSocket('ws://127.0.0.1:2999');
  ws.addEventListener('message', e => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.event === 'panelState' && msg.panel === 'terminal') {
        const btn = document.querySelector(
          '[data-command="workbench.action.terminal.toggleTerminal"]'
        );
        if (btn) btn.classList.toggle('active', msg.open);
      }
    } catch (_) {}
  });
  ws.addEventListener('close', () => setTimeout(connectEventReceiver, 3000));
}

setTimeout(connectEventReceiver, 6000); // wait for extension host to be ready
```

The 6-second delay matches the existing WS bridge reconnect timing in `main.js`
(`connectRibbonWebSocket` uses 5 seconds; 6 gives the extension host time to
start its server first).

---

## 4. F2 Collapse — Hide Tab Text

### ribbon.css addition

When the ribbon view is collapsed to 30px (hiddenH), only the strip is visible.
The tab text should disappear so only the blue strip shows.

Add a new rule:

```css
/* ── Collapsed ribbon — hide tab labels ─────────────────────────────────── */
#ribbon-strip.ribbon-tabs-hidden .ribbon-tab {
  color: transparent;
  pointer-events: none;
}
```

### renderer.js changes

`hideRibbon()` adds `ribbon-tabs-hidden` class to `#ribbon-strip`.
`pinRibbon()` removes it.

```javascript
function hideRibbon() {
  document.getElementById('ribbon-strip').classList.add('ribbon-tabs-hidden');
  // ... existing button state updates and electronAPI.hideRibbon() call
}

function pinRibbon() {
  document.getElementById('ribbon-strip').classList.remove('ribbon-tabs-hidden');
  // ... existing button state updates and electronAPI.pinRibbon() call
}
```

The `main.js` F2 global shortcut already calls
`executeJavaScript('hideRibbon && hideRibbon()')` /
`executeJavaScript('pinRibbon && pinRibbon()')` so the CSS class change
happens automatically via F2 as well.

---

## 5. DevTools Shortcut

### main.js addition

In `app.whenReady()`, after the existing `globalShortcut.register('F2', ...)`:

```javascript
globalShortcut.register('CommandOrControl+Shift+I', () => {
  if (state.ribbonView) {
    state.ribbonView.webContents.toggleDevTools();
  }
});
```

`toggleDevTools()` opens the inspector if closed, closes it if open —
standard Electron pattern. No separate close shortcut needed.

---

## 6. Tier 2 Command ID Table (deliverable document)

Sprint 7 produces `docs/Sprint 7/julia-commands.md` via triangulation:

**Triangulation method (John-run):**
1. Command palette (`Ctrl+Shift+P`) — search for each command by name; note
   the exact id shown.
2. Terminal output — run `julia -e 'using VSCodeServer'` and observe registered
   commands.
3. Extension host log probe — `fs.writeFileSync` in `extension.ts` to dump
   `vscode.commands.getCommands()` filtered by `language-julia`.

**Table format:**
```markdown
| Button | Candidate id | Palette confirmed | Log confirmed | Notes |
|---|---|---|---|---|
| Run Section | language-julia.executeJuliaCodeInREPL | ✓/✗ | ✓/✗ | ... |
```

This table is a Sprint 7 deliverable, not a gate. Sprint 8 wires confirmed ids.

---

## 7. Files Changed This Sprint

| File | Change |
|---|---|
| `index.html` | 2 command id fixes (undo/redo), 5 noop demotions with Tier 2 comments, 1 Theme noop, 4 VIEW placeholder corrections |
| `extension.ts` | `connectedClients` Set, terminal event subscriptions, `broadcastPanelState()` + `npm run build:ext` |
| `renderer.js` | `connectEventReceiver()` WS client, tab-text hide/show in `hideRibbon()`/`pinRibbon()` |
| `main.js` | `Ctrl+Shift+I` DevTools shortcut |
| `ribbon.css` | `.ribbon-tabs-hidden` rule |
| `docs/Sprint 7/julia-commands.md` | Tier 2 command id table (John-produced) |

---

## 8. Open Questions

None blocking implementation. One to track:

**CSP and renderer WebSocket:** The CSP is `default-src 'self'`. WebSocket
connections to `ws://127.0.0.1:2999` from a `file://` origin — does Electron's
CSP treat `ws://127.0.0.1` as `'self'`? Spike S7-1 (first task) confirms this
before committing the `connectEventReceiver` implementation. If CSP blocks it,
the alternative is exposing an ipcRenderer event from `main.js` that relays WS
messages from the ribbon WS client — one more `preload.js` entry.
