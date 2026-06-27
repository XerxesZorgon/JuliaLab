// main.js — JuliaLabApp
// Sprint 1 — Task 003: BaseWindow skeleton

'use strict';

const { app, BaseWindow, WebContentsView, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { detectDeps } = require('./scripts/detect-deps');

const os = require('os');
const fs = require('fs');
const net = require('net');
const { WebSocket } = require('ws');

function getJuliaExe() {
  try {
    const s = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, 'server-data', 'Machine', 'settings.json'),
        'utf8'
      )
    );
    return s['julia.executablePath'] || 'julia';
  } catch (_) {
    return 'julia';
  }
}

const DEFAULT_WORKSPACE = path.join(os.homedir(), 'JuliaLab');
const RIBBON_WS_PORT    = 2999;

const state = {
  win:           null,
  ribbonView:    null,
  workbenchView: null,
  serverProcess: null,
  serverPort:    null,
  shuttingDown:  false,
  ribbonWs:      null,
  childPids:     new Set(),   // extra spawned trees to reap on quit (e.g. Pluto)
};

let plutoProcess = null;

const CODIUM_BIN     = 'C:\\Program Files\\VSCodium\\bin\\codium';
const SERVER_PORT    = 41000;
const SERVER_DATA_DIR = path.join(__dirname, 'server-data');
const READY_RE       = /Web UI available at/;
const TIMEOUT_MS     = 30000;


async function preflightPort() {
  console.log('[preflight] checking port ' + SERVER_PORT);
  await killServerDataTree();   // reap any stale serve-web on our server-data
  await new Promise(r => setTimeout(r, 300));  // let the OS release the socket
  console.log('[preflight] port clear');
}

function spawnServer() {
  fs.mkdirSync(DEFAULT_WORKSPACE, { recursive: true });
  state.serverPort = SERVER_PORT;
  state.serverProcess = spawn('cmd.exe', [
    '/c', CODIUM_BIN + '.cmd',
    'serve-web',
    '--host',            '127.0.0.1',
    '--port',            String(state.serverPort),
    '--server-data-dir', SERVER_DATA_DIR,
    '--without-connection-token',
    '--default-folder',  DEFAULT_WORKSPACE,
  ], { stdio: ['ignore', 'pipe', 'pipe'], shell: false });

  state.serverProcess.stderr.on('data', d => process.stderr.write(d));
  return state.serverProcess;
}

function waitForReady(proc) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Server timeout after 30s')), TIMEOUT_MS
    );
    proc.stdout.on('data', chunk => {
      const line = chunk.toString();
      process.stdout.write('[server] ' + line);
      if (READY_RE.test(line)) { clearTimeout(timer); resolve(line.trim()); }
    });
    proc.on('error', err  => { clearTimeout(timer); reject(err); });
    proc.on('exit',  code => {
      if (code !== 0) {
        clearTimeout(timer);
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });
}

function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

function setViewBounds() {
  if (!state.win || !state.ribbonView) return;
  const [w, h] = state.win.getContentSize();
  const ribbonH = 52;
  state.ribbonView.setBounds({ x: 0, y: 0, width: w, height: ribbonH });
  if (state.workbenchView) {
    state.workbenchView.setBounds({ x: 0, y: ribbonH, width: w, height: h - ribbonH });
  }
}

function killTree(pid) {
  return new Promise(resolve => {
    if (!pid) { resolve(); return; }
    const tk = spawn('taskkill', ['/F', '/T', '/PID', String(pid)],
                     { stdio: 'ignore', shell: false });
    tk.on('exit',  () => resolve());   // non-zero (already dead) is fine
    tk.on('error', () => resolve());   // taskkill missing — give up quietly
  });
}

// Kill every process whose command line references OUR server-data dir.
// Catches the detached codium-tunnel / codium-server trees that are not
// descendants of the spawned cmd.exe PID. Safe: single-instance, and the
// absolute server-data path is unique to this checkout.
function killServerDataTree() {
  return new Promise(resolve => {
    const psCmd =
      "Get-CimInstance Win32_Process | " +
      "Where-Object { $_.CommandLine -match 'serve-web' -and " +
      "$_.CommandLine -match 'server-data' } | " +
      "ForEach-Object { taskkill /F /T /PID $_.ProcessId 2>$null }";
    const ps = spawn('powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', psCmd],
      { stdio: 'ignore', shell: false });
    ps.on('exit',  () => resolve());
    ps.on('error', () => resolve());
  });
}

async function killServer() {
  if (!state.serverProcess) return;
  state.shuttingDown = true;
  console.log('[killServer] starting teardown');

  const serverPid = state.serverProcess.pid;

  // Graceful first: ask codium to exit and flush its state.
  state.serverProcess.kill('SIGTERM');
  await new Promise(resolve => {
    const t = setTimeout(resolve, 1500);
    state.serverProcess.on('exit', () => { clearTimeout(t); resolve(); });
  });

  // Sweep the whole tree (parent is cmd.exe; /T reaps node children).
  await killTree(serverPid);

  // Catch-all: reap the detached tunnel/server trees by server-data path.
  await killServerDataTree();

  // Reap any other tracked trees (e.g. Pluto — registered by later tasks).
  for (const pid of state.childPids) {
    await killTree(pid);
  }
  state.childPids.clear();

  console.log('[killServer] teardown complete');
  state.ribbonWs?.close();
  state.ribbonWs = null;
  state.serverProcess = null;
}

function connectRibbonWebSocket() {
  const tryConnect = () => {
    const ws = new WebSocket('ws://127.0.0.1:' + RIBBON_WS_PORT);
    ws.on('open',  ()  => { state.ribbonWs = ws; console.log('[ribbon-ws] connected'); });
    ws.on('close', ()  => { state.ribbonWs = null; setTimeout(tryConnect, 2000); });
    ws.on('error', ()  => { /* retry handled by close event */ });
  };
  setTimeout(tryConnect, 5000);
}

function createWindow() {
  state.win = new BaseWindow({
    width:           1280,
    height:          800,
    frame:           false,
    show:            false,
    backgroundColor: '#1e1e1e',
  });

  ipcMain.on('window:minimize', () => state.win.minimize());
  ipcMain.on('window:maximize', () => {
    state.win.isMaximized() ? state.win.unmaximize() : state.win.maximize();
  });
  ipcMain.on('window:close',   () => app.quit());

  ipcMain.on('ribbon-command', (_event, command) => {
    if (state.ribbonWs?.readyState === WebSocket.OPEN) {
      state.ribbonWs.send(JSON.stringify({ command }));
      console.log('[ribbon-command] sent:', command);
    } else {
      console.warn('[ribbon-command] WebSocket not ready, command dropped:', command);
    }
  });

  ipcMain.on('pluto:launch', () => {
    if (plutoProcess && !plutoProcess.killed) {
      console.log('[pluto] already running');
      return;
    }
    const juliaExe = getJuliaExe();
    console.log('[pluto] spawning:', juliaExe);
    plutoProcess = spawn(juliaExe,
      ['-e', 'using Pluto; Pluto.run()'],
      { stdio: ['ignore', 'pipe', 'pipe'], detached: false }
    );
    state.childPids.add(plutoProcess.pid);

    let ready = false;
    plutoProcess.stdout.on('data', chunk => {
      const text = chunk.toString();
      process.stdout.write('[pluto] ' + text);
      if (!ready && text.includes('localhost')) {
        ready = true;
        console.log('[pluto] server ready');
      }
    });
    plutoProcess.stderr.on('data', chunk => {
      process.stderr.write('[pluto:err] ' + chunk.toString());
    });
    plutoProcess.on('exit', code => {
      console.log('[pluto] exited with code', code);
      if (plutoProcess) state.childPids.delete(plutoProcess.pid);
      plutoProcess = null;
      if (!ready && code !== 0) {
        dialog.showErrorBox(
          'Pluto.jl — Launch Failed',
          'Pluto failed to start. Make sure Pluto.jl is installed:\n\n' +
          '  julia> ] add Pluto'
        );
      }
    });
  });

  app.on('before-quit', async (e) => {
    if (state.shuttingDown) return;
    e.preventDefault();
    await killServer();
    app.exit(0);
  });

  state.ribbonView = new WebContentsView({
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  });
  state.ribbonView.setBackgroundColor('#1e1e1e');
  state.win.contentView.addChildView(state.ribbonView);
  state.ribbonView.setBounds({
    x: 0, y: 0,
    width:  1280,
    height: 800,
  });
  state.ribbonView.webContents.loadFile(path.join(__dirname, 'index.html'));
  state.workbenchView = new WebContentsView();
  state.workbenchView.setBackgroundColor('#1e1e1e');
  state.win.contentView.addChildView(state.workbenchView);
  setViewBounds();
  state.workbenchView.webContents.loadURL(
    `http://127.0.0.1:${state.serverPort}`
  );
  state.win.on('resize', debounce(setViewBounds, 16));
  state.win.show();
}

app.whenReady().then(async () => {
  const depsResult = await detectDeps(
    path.join(__dirname, 'server-data', 'Machine', 'settings.json')
  );
  if (depsResult.warnings.length > 0) {
    const choice = await dialog.showMessageBox({
      type:    'warning',
      title:   'JuliaLab — Missing Dependencies',
      message: depsResult.warnings.join('\n\n'),
      detail:  'JuliaLab will launch. Install missing tools and restart to enable full functionality.',
      buttons: ['Continue anyway', 'Open install pages'],
    });
    if (choice.response === 1) {
      for (const url of depsResult.installUrls) {
        shell.openExternal(url);
      }
    }
  }

  await preflightPort();
  const proc = spawnServer();
  try {
    await waitForReady(proc);
  } catch (err) {
    state.serverProcess?.kill('SIGTERM');
    dialog.showErrorBox('JuliaLab — Server Error',
      `codium serve-web failed to start:\n${err.message}`);
    app.exit(1);
    return;
  }
  state.serverProcess.on('exit', (code, signal) => {
    if (state.shuttingDown) return;
    dialog.showErrorBox(
      'JuliaLab — Server Crashed',
      `codium serve-web exited unexpectedly (code ${code}, signal ${signal}).\nPlease restart JuliaLab.`
    );
    app.exit(1);
  });

  createWindow();
  connectRibbonWebSocket();
});

app.on('window-all-closed', () => {
  app.quit();
});
