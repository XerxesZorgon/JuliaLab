// main.js — JuliaLabApp
// Sprint 1 — Task 003: BaseWindow skeleton

'use strict';

const { app, BaseWindow, WebContentsView, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const state = {
  win:           null,
  ribbonView:    null,
  workbenchView: null,
  serverProcess: null,
  serverPort:    null,
  shuttingDown:  false,
};

const CODIUM_BIN     = 'C:\\Program Files\\VSCodium\\bin\\codium';
const SERVER_PORT    = 3456;
const SERVER_DATA_DIR = path.join(__dirname, 'server-data');
const READY_RE       = /Web UI available at/;
const TIMEOUT_MS     = 30000;

function spawnServer() {
  state.serverPort = SERVER_PORT;
  state.serverProcess = spawn('cmd.exe', [
    '/c', CODIUM_BIN + '.cmd',
    'serve-web',
    '--host',            '127.0.0.1',
    '--port',            String(SERVER_PORT),
    '--server-data-dir', SERVER_DATA_DIR,
    '--without-connection-token',
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

  state.ribbonView = new WebContentsView({
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  });
  state.win.contentView.addChildView(state.ribbonView);
  state.ribbonView.setBounds({
    x: 0, y: 0,
    width:  1280,
    height: 800,
  });
  state.ribbonView.webContents.loadFile(path.join(__dirname, 'index.html'));
  state.win.on('resize', debounce(setViewBounds, 16));
  state.win.show();
}

app.whenReady().then(async () => {
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
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
