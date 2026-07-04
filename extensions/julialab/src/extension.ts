// extension.ts — julialab VSCodium extension
// Sprint 3: auto-start REPL, layout preset, WebSocket ribbon bridge

import * as vscode from 'vscode';

// ── Constants ────────────────────────────────────────────────────────────────

const JULIA_EXT_ID    = 'julialang.language-julia';
const LAYOUT_DONE_KEY = 'julialab.layoutApplied';
const RIBBON_WS_PORT  = 2999;

const ALLOWED_PREFIXES = [
  'julialab.',
  'workbench.action.',
  'editor.action.',
  'language-julia.',
];

// Connected WS clients — reverse-channel event broadcasting (ADR-023)
const connectedClients = new Set<import('ws').WebSocket>();

// ── Activation ───────────────────────────────────────────────────────────────

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  registerWebSocketBridge(context);
  // ADR-023: terminal panel state sync for COMMAND WINDOW ribbon button
  context.subscriptions.push(
    // Fires when terminal panel focus changes (show/hide approximation)
    vscode.window.onDidChangeActiveTerminal(terminal => {
      broadcastPanelState('terminal', terminal !== undefined);
    }),
    // Fires when terminal process is killed (× close)
    vscode.window.onDidCloseTerminal(() => {
      broadcastPanelState('terminal', vscode.window.terminals.length > 0);
    })
  );
  await ensureJuliaExtension();
  await applyLayoutIfFirstOpen(context);

  // KI-3: bounded delay to clear julia-vscode async init before REPL start.
  // 2000 ms is machine-speed-dependent; a readiness probe via juliaExt.exports
  // is the correct long-term fix (Sprint 5 / Spike J).
  await new Promise(resolve => setTimeout(resolve, 2000));
  await startJuliaRepl();
}

export function deactivate(): void {}


// ── WebSocket ribbon bridge ───────────────────────────────────────────────────

function registerWebSocketBridge(context: vscode.ExtensionContext): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { WebSocketServer } = require('ws') as typeof import('ws');

  const wss = new WebSocketServer({ host: '127.0.0.1', port: RIBBON_WS_PORT });

  wss.on('connection', ws => {
    console.log('[julialab] ribbon WebSocket client connected');
    connectedClients.add(ws);
    ws.on('close', () => connectedClients.delete(ws));
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as { command?: string };
        const command = msg.command;
        if (command === 'julialab.syncPanelState') {
          // Immediately broadcast current terminal state to the requesting client
          const termOpen = vscode.window.terminals.length > 0;
          const syncMsg = JSON.stringify({ event: 'panelState', panel: 'terminal', open: termOpen });
          if ((ws as any).readyState === 1) ws.send(syncMsg);
        } else if (command && command.startsWith('workbench.action.terminal.toggleTerminal')) {
          // Deterministic show/hide — avoids toggleTerminal's focus-state ambiguity
          const [, state] = command.split('|');
          if (state === 'show') {
            vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup')
              .then(() => vscode.commands.executeCommand('workbench.action.terminal.focus'))
              .then(undefined, err => {
                console.error('[julialab] terminal show failed:', err);
              });
          } else {
            vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup')
              .then(() => vscode.commands.executeCommand('workbench.action.closePanel'))
              .then(undefined, err => {
                console.error('[julialab] terminal hide failed:', err);
              });
          }
        } else if (command && ALLOWED_PREFIXES.some(p => command.startsWith(p))) {
          vscode.commands.executeCommand(command).then(undefined, err => {
            console.error('[julialab] ws command failed:', err);
          });
        }
      } catch (err) {
        console.error('[julialab] ws parse error:', err);
      }
    });
  });

  wss.on('error', (err: Error) => {
    console.error('[julialab] WebSocket server error:', err.message);
    vscode.window.showWarningMessage(
      `JuliaLab: ribbon bridge failed on port ${RIBBON_WS_PORT}. Ribbon tabs will not function.`
    );
  });

  context.subscriptions.push({ dispose: () => wss.close() });
}

// ── Panel state broadcaster (ADR-023) ────────────────────────────────────────

function broadcastPanelState(panel: string, open: boolean): void {
  const msg = JSON.stringify({ event: 'panelState', panel, open });
  connectedClients.forEach(ws => {
    if ((ws as any).readyState === 1 /* OPEN */) {
      ws.send(msg);
    }
  });
}

// ── julia-vscode activation guard ────────────────────────────────────────────

async function ensureJuliaExtension(): Promise<void> {
  const juliaExt = vscode.extensions.getExtension(JULIA_EXT_ID);
  if (!juliaExt) {
    vscode.window.showWarningMessage(
      'JuliaLab: julia-vscode extension not found. Workspace panel and plot pane unavailable.'
    );
    return;
  }
  if (!juliaExt.isActive) {
    try {
      await juliaExt.activate();
    } catch (err) {
      console.error('[julialab] failed to activate julia-vscode:', err);
    }
  }
}

// ── MATLAB layout preset (one-shot) ──────────────────────────────────────────

async function applyLayoutIfFirstOpen(
  context: vscode.ExtensionContext
): Promise<void> {
  const alreadyApplied = context.workspaceState.get<boolean>(LAYOUT_DONE_KEY);
  if (alreadyApplied) return;

  try {
    await vscode.commands.executeCommand('workbench.view.extension.julia-explorer');
    await vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal');
    await vscode.commands.executeCommand('workbench.action.focusFirstEditorGroup');
    await context.workspaceState.update(LAYOUT_DONE_KEY, true);
  } catch (err) {
    console.error('[julialab] layout preset failed (non-fatal):', err);
  }
}

// ── Auto-start Julia REPL ─────────────────────────────────────────────────────

async function startJuliaRepl(): Promise<void> {
  try {
    await vscode.commands.executeCommand('language-julia.startREPL');
  } catch (err) {
    console.error('[julialab] REPL auto-start failed (non-fatal):', err);
    vscode.window.showWarningMessage(
      'JuliaLab: Julia REPL did not start automatically. Use Ctrl+Shift+P → "Julia: Start REPL".'
    );
  }
}
