// extension.ts — julialab VSCodium extension
// Sprint 3: auto-start REPL, layout preset, WebSocket ribbon bridge

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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

class PlotVariablesProvider implements vscode.TreeDataProvider<WorkspaceVar> {
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private vars: WorkspaceVar[] = [];

  refresh(vars: WorkspaceVar[]): void {
    this.vars = vars;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(el: WorkspaceVar): vscode.TreeItem {
    return new vscode.TreeItem(`${el.name} (${el.type})`);
  }

  getChildren(): WorkspaceVar[] {
    return this.vars;
  }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  registerWebSocketBridge(context);
  // Doc opener commands — open URLs in system default browser
  context.subscriptions.push(
    vscode.commands.registerCommand('julialab.openJuliaDocs', () =>
      vscode.env.openExternal(
        vscode.Uri.parse('https://docs.julialang.org/en/v1/'))),
    vscode.commands.registerCommand('julialab.openJuliaExamples', () =>
      vscode.env.openExternal(
        vscode.Uri.parse('https://julialang.org/learning/'))),
    vscode.commands.registerCommand('julialab.openJuliaCommunity', () =>
      vscode.env.openExternal(
        vscode.Uri.parse('https://discourse.julialang.org/'))),
  );

  const plotVarsProvider = new PlotVariablesProvider();
  const plotVarsTreeView = vscode.window.createTreeView('julialabPlotVariables', {
    treeDataProvider: plotVarsProvider,
    canSelectMany: true
  });
  context.subscriptions.push(plotVarsTreeView);

  let orderedSelection: string[] = [];

  interface PersistentPlotState {
    selectedVarsOrdered: string[];
    plotConfig: { type: string | null; style: string[]; axes: string[] };
  }

  let plotState: PersistentPlotState = {
    selectedVarsOrdered: [],
    plotConfig: { type: null, style: [], axes: [] }
  };

  function minVarsNeeded(type: string | null): number {
    if (!type) return 2;
    if (type === 'histogram') return 1;
    if (['surface', 'contour'].includes(type)) return 3;
    return 2;
  }

  function generatePlotCode(xVar: string, yVar: string, zVar: string | null, plotConfig: PersistentPlotState['plotConfig']): string {
    const usesStatsPlots = ['boxplot', 'violin', 'pie'].includes(plotConfig.type ?? '');
    const preambleParts: string[] = [];
    preambleParts.push('using Plots'); // always, per Sprint 9 Task 007 fix
    if (usesStatsPlots) preambleParts.push('using StatsPlots');
    if (plotConfig.style.includes('theme')) preambleParts.push('theme(:default)');
    const preamble = preambleParts.join('\n') + '\n';

    const kwargs: string[] = [];
    if (plotConfig.type && !['line', 'histogram', 'boxplot', 'violin', 'pie', 'area'].includes(plotConfig.type)) {
      kwargs.push(`seriestype=:${plotConfig.type}`);
    }
    if (plotConfig.style.includes('markers'))   kwargs.push('markershape=:circle');
    if (plotConfig.style.includes('linewidth')) kwargs.push('linewidth=2');
    if (plotConfig.style.includes('colors'))    kwargs.push('color=:auto');
    if (plotConfig.style.includes('opacity'))   kwargs.push('alpha=0.7');
    if (plotConfig.axes.includes('xlabel')) kwargs.push('xlabel="X"');
    if (plotConfig.axes.includes('ylabel')) kwargs.push('ylabel="Y"');
    if (plotConfig.axes.includes('legend')) kwargs.push('legend=true');
    if (plotConfig.axes.includes('subtitle')) kwargs.push('subtitle="Subtitle"');
    if (plotConfig.axes.includes('colorbar')) kwargs.push('colorbar=true');
    if (plotConfig.axes.includes('grid')) {
      kwargs.push('grid=true');
    } else if (plotConfig.axes.includes('xgrid')) {
      kwargs.push('xgrid=true');
      kwargs.push('ygrid=false');
    } else if (plotConfig.axes.includes('ygrid')) {
      kwargs.push('ygrid=true');
      kwargs.push('xgrid=false');
    }

    return preamble + buildCallArgs(xVar, yVar, zVar, plotConfig, kwargs);
  }

  function kwargsStr(kwargs: string[]): string {
    return kwargs.length ? ', ' + kwargs.join(', ') : '';
  }

  function buildCallArgs(xVar: string, yVar: string, zVar: string | null, plotConfig: PersistentPlotState['plotConfig'], kwargs: string[]): string {
    if (plotConfig.type === 'histogram') {
      return `histogram(${xVar}${kwargsStr(kwargs)})`;
    }
    if (plotConfig.type === 'area') {
      return `areaplot(${xVar}, ${yVar}${kwargsStr(kwargs)})`;
    }
    if (['surface', 'contour'].includes(plotConfig.type ?? '') && zVar) {
      return `plot(${xVar}, ${yVar}, ${zVar}${kwargsStr(kwargs)})`;
    }
    if (plotConfig.type === 'pie') {
      return `pie(${xVar}, ${yVar}${kwargsStr(kwargs)})`;
    }
    if (['boxplot', 'violin'].includes(plotConfig.type ?? '')) {
      return `${plotConfig.type}(${xVar}, ${yVar}${kwargsStr(kwargs)})`;
    }
    return `plot(${xVar}, ${yVar}${kwargsStr(kwargs)})`;
  }

  function regeneratePlot(): void {
    plotState.selectedVarsOrdered = orderedSelection;
    const needed = minVarsNeeded(plotState.plotConfig.type);

    // Temporary probe — always write current state + guard result, for this task's verification
    fs.writeFileSync(
      path.join(context.extensionPath, 'regenerate-probe.txt'),
      JSON.stringify({
        selectedVarsOrdered: plotState.selectedVarsOrdered,
        needed,
        guardPassed: plotState.selectedVarsOrdered.length >= needed
      }, null, 2)
    );

    if (plotState.selectedVarsOrdered.length < needed) return; // silent no-op

    const [xVar, yVar, zVar] = plotState.selectedVarsOrdered;
    const code = generatePlotCode(xVar, yVar, zVar ?? null, plotState.plotConfig);

    const terminal = vscode.window.terminals.find(t => t.name.includes('Julia'));
    if (!terminal) {
      vscode.window.showWarningMessage('JuliaLab: Julia REPL terminal not found — cannot update plot.');
      return;
    }
    terminal.sendText(code, true);
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('julialab.updatePlotConfig', (config?: PersistentPlotState['plotConfig']) => {
      if (config) {
        plotState.plotConfig = config;
        regeneratePlot();
      }
    }),
    vscode.commands.registerCommand('julialab.regeneratePlot', () => {
      regeneratePlot();
    })
  );

  plotVarsTreeView.onDidChangeSelection(e => {
    const newSet = new Set(e.selection.map(v => v.name));
    const oldSet = new Set(orderedSelection);

    // Remove deselected items, preserving order of what remains
    orderedSelection = orderedSelection.filter(name => newSet.has(name));

    // Append newly-selected items (order VS Code reports them in this event)
    for (const item of e.selection) {
      if (!oldSet.has(item.name)) {
        orderedSelection.push(item.name);
      }
    }

    // Temporary probe for this task's verification only
    fs.writeFileSync(
      path.join(context.extensionPath, 'selection-order-probe.txt'),
      JSON.stringify(orderedSelection, null, 2)
    );

    regeneratePlot();
  });

  // Refresh on view visibility change — simplest starting point per DESIGN §4.2
  plotVarsTreeView.onDidChangeVisibility(async e => {
    if (e.visible) {
      try {
        const EXCLUDED_NAMES = ['Base', 'Core', 'Main', 'vars'];
        const vars = (await getWorkspaceVars()).filter(v => !EXCLUDED_NAMES.includes(v.name));
        plotVarsProvider.refresh(vars);
      } catch (err) {
        console.warn('[julialab] PlotVariablesProvider visibility refresh failed:', err);
      }
    }
  });

  // Also refresh once immediately at activation, in case the view is
  // already visible when the extension loads
  (async () => {
    try {
      const EXCLUDED_NAMES = ['Base', 'Core', 'Main', 'vars'];
      const vars = (await getWorkspaceVars()).filter(v => !EXCLUDED_NAMES.includes(v.name));
      plotVarsProvider.refresh(vars);
    } catch (err) {
      console.warn('[julialab] PlotVariablesProvider initial refresh failed:', err);
    }
  })();

  let spikeToggle = false;
  context.subscriptions.push(
    vscode.commands.registerCommand('julialab.spikeReactiveTrigger', () => {
      const terminal = vscode.window.terminals.find(t => t.name.includes('Julia'));
      if (!terminal) {
        vscode.window.showWarningMessage('JuliaLab: Julia REPL terminal not found.');
        return;
      }
      spikeToggle = !spikeToggle;
      const code = spikeToggle
        ? 'plot(θ, y, seriestype=:scatter)'
        : 'plot(θ, y, seriestype=:line)';
      terminal.sendText(code, true);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('julialab.openPlotBuilder', async (config?: PlotConfig) => {
      await openPlotBuilderPanel(context, config ?? { type: null, style: [], axes: [] });
    })
  );

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
        const msg = JSON.parse(data.toString()) as { command?: string; args?: any[] };
        const command = msg.command;

        fs.writeFileSync(
          path.join(context.extensionPath, 'ws-dispatch-probe.txt'),
          JSON.stringify({ command, args: msg.args ?? null }, null, 2)
        );

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
          const args: any[] = Array.isArray(msg.args) ? msg.args : [];
          vscode.commands.executeCommand(command, ...args).then(undefined, err => {
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

// ── Plot Builder (Task 003) ───────────────────────────────────────────────────

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function getPlotBuilderHtml(
  webview: vscode.Webview,
  context: vscode.ExtensionContext
): string {
  const htmlPath = path.join(context.extensionPath, 'media', 'plot-builder.html');
  const jsPath = path.join(context.extensionPath, 'media', 'plot-builder.js');
  let html = fs.readFileSync(htmlPath, 'utf-8');
  const scriptContent = fs.readFileSync(jsPath, 'utf-8');

  const nonce = getNonce();
  html = html
    .replace(/__NONCE__/g, nonce)
    .replace('__SCRIPT_CONTENT__', () => scriptContent);


  return html;
}

interface PlotConfig {
  type: string | null;
  style: string[];
  axes: string[];
}

let plotBuilderPanel: vscode.WebviewPanel | undefined;

async function openPlotBuilderPanel(context: vscode.ExtensionContext, config: PlotConfig): Promise<void> {
  if (plotBuilderPanel) {
    plotBuilderPanel.reveal();
  } else {
    plotBuilderPanel = vscode.window.createWebviewPanel(
      'julialabPlotBuilder',
      'Plot Builder',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
      }
    );
    // Real UI (CSP, dropdowns, Run button) is Task 004
    plotBuilderPanel.webview.html = getPlotBuilderHtml(plotBuilderPanel.webview, context);
    plotBuilderPanel.onDidDispose(() => { plotBuilderPanel = undefined; });
    plotBuilderPanel.webview.onDidReceiveMessage(msg => {
      // Keep the probe write — still useful for future debugging, low cost
      fs.writeFileSync(
        path.join(context.extensionPath, 'panel-message-probe.txt'),
        JSON.stringify(msg, null, 2)
      );

      if (msg.command === 'runPlot') {
        const terminal = vscode.window.terminals.find(t => t.name.includes('Julia'));
        if (!terminal) {
          vscode.window.showWarningMessage(
            'JuliaLab: Julia REPL terminal not found — cannot run plot.'
          );
          return;
        }
        terminal.sendText(msg.code, true);
      }
    });
  }

  const vars = await getWorkspaceVars();
  const initMessage = { command: 'init', vars, plotConfig: config };
  plotBuilderPanel.webview.postMessage(initMessage);
  // Also probe it, since the placeholder HTML has no script to display it yet
  fs.writeFileSync(
    path.join(context.extensionPath, 'init-message-probe.txt'),
    JSON.stringify(initMessage, null, 2)
  );
}

// ── File-based Workspace Variables (Task 003) ─────────────────────────────────

interface WorkspaceVar { name: string; type: string; }

async function getWorkspaceVars(): Promise<WorkspaceVar[]> {
  const outputPath = path.join(os.tmpdir(), 'julialab-workspace-vars.json');

  // Clear any stale output from a previous run so we don't read a false
  // positive before Julia has written fresh data.
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  const juliaPath = outputPath.replace(/\\/g, '/');
  const dumpCode = `begin
vars = filter(x -> x != :ans, names(Main))
result = [(name=string(v), type=string(typeof(getfield(Main, v)))) for v in vars if isdefined(Main, v)]
tmp_path = "${juliaPath}.tmp"
open(tmp_path, "w") do io
    write(io, "[" * join(["{\\"name\\":\\"$(r.name)\\",\\"type\\":\\"$(r.type)\\"}" for r in result], ",") * "]")
end
mv(tmp_path, "${juliaPath}", force=true)
end`;

  const waitForFile = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      watcher.close();
      reject(new Error('TIMEOUT: workspace vars file was not written within 10s'));
    }, 10000);

    const watcher = fs.watch(os.tmpdir(), (eventType, filename) => {
      if (filename === 'julialab-workspace-vars.json') {
        clearTimeout(timeout);
        watcher.close();
        resolve();
      }
    });
  });

  const terminal = vscode.window.terminals.find(t => t.name.includes('Julia'));
  if (!terminal) {
    throw new Error('NO_JULIA_TERMINAL: Julia REPL terminal not found — is it running?');
  }
  terminal.sendText(dumpCode, true);

  await waitForFile;

  const raw = fs.readFileSync(outputPath, 'utf-8');
  return JSON.parse(raw) as WorkspaceVar[];
}
