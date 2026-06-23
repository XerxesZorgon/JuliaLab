// main.js — JuliaLabApp
// Sprint 1 — Task 003: BaseWindow skeleton

'use strict';

const { app, BaseWindow, WebContentsView, ipcMain, dialog } = require('electron');
const path = require('path');

const state = {
  win:           null,
  ribbonView:    null,
  workbenchView: null,
  serverProcess: null,
  serverPort:    null,
  shuttingDown:  false,
};

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

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
