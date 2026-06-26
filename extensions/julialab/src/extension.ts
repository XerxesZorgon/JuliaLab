// extension.ts — julialab VSCodium extension
// Sprint 3: auto-start REPL, layout preset, WebSocket ribbon bridge

import * as vscode from 'vscode';

// ── Constants ────────────────────────────────────────────────────────────────

const JULIA_EXT_ID    = 'julialang.language-julia';
const LAYOUT_DONE_KEY = 'julialab.layoutApplied';
const RIBBON_WS_PORT  = 2999;

const RIBBON_COMMANDS: Record<string, string> = {
  'julialab.focusEditor': 'workbench.action.focusActiveEditorGroup',
  'julialab.showPlots':   'language-julia.show-plotpane',
};

// ── Activation ───────────────────────────────────────────────────────────────

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  registerRibbonCommands(context);
  registerWebSocketBridge(context);
  await ensureJuliaExtension();
  await applyLayoutIfFirstOpen(context);

  // KI-3: bounded delay to clear julia-vscode async init before REPL start.
  // 2000 ms is machine-speed-dependent; a readiness probe via juliaExt.exports
  // is the correct long-term fix (Sprint 5 / Spike J).
  await new Promise(resolve => setTimeout(resolve, 2000));
  await startJuliaRepl();
}

export function deactivate(): void {}

// ── Ribbon command registration ───────────────────────────────────────────────

function registerRibbonCommands(context: vscode.ExtensionContext): void {
  for (const [commandId, vsCodeCommand] of Object.entries(RIBBON_COMMANDS)) {
    const disposable = vscode.commands.registerCommand(commandId, async () => {
      try {
        await vscode.commands.executeCommand(vsCodeCommand);
      } catch (err) {
        console.error(`[julialab] command ${commandId} failed:`, err);
      }
    });
    context.subscriptions.push(disposable);
  }
}

// ── WebSocket ribbon bridge ───────────────────────────────────────────────────

function registerWebSocketBridge(context: vscode.ExtensionContext): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { WebSocketServer } = require('ws') as typeof import('ws');

  const wss = new WebSocketServer({ host: '127.0.0.1', port: RIBBON_WS_PORT });

  wss.on('connection', ws => {
    console.log('[julialab] ribbon WebSocket client connected');
    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as { command?: string };
        const command = msg.command;
        if (command && command in RIBBON_COMMANDS) {
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
