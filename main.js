// main.js — JuliaLabApp
// Sprint 1 — Task 003: BaseWindow skeleton

'use strict';

const { app, BaseWindow, ipcMain } = require('electron');
const path = require('path');

const state = {
  win:           null,
  ribbonView:    null,
  workbenchView: null,
  serverProcess: null,
  serverPort:    null,
  shuttingDown:  false,
};

function createWindow() {
  state.win = new BaseWindow({
    width:           1280,
    height:          800,
    frame:           false,
    show:            false,
    backgroundColor: '#1e1e1e',
  });

  state.win.show();
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
