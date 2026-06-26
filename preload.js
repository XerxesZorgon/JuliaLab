// preload.js — JuliaLabApp
// Sprint 1 — Task 004: contextBridge for window controls
// Sprint 3 — Task 006: expose ribbonCommand

'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize:      () => ipcRenderer.send('window:minimize'),
  maximize:      () => ipcRenderer.send('window:maximize'),
  close:         () => ipcRenderer.send('window:close'),
  ribbonCommand: (command) => ipcRenderer.send('ribbon-command', command),
  launchPluto:   () => ipcRenderer.send('pluto:launch'),
});
