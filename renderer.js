// renderer.js — JuliaLabApp
// Sprint 1 — Task 006: window control button wiring

'use strict';

document.getElementById('btn-minimize')
  .addEventListener('click', () => window.electronAPI.minimize());

document.getElementById('btn-maximize')
  .addEventListener('click', () => window.electronAPI.maximize());

document.getElementById('btn-close')
  .addEventListener('click', () => window.electronAPI.close());
