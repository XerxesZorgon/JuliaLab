// renderer.js — JuliaLabApp
// Sprint 1 — Task 006: window control button wiring
// Sprint 3 — Task 007: ribbon tab command dispatch

'use strict';

// Window controls
document.getElementById('btn-minimize')
  .addEventListener('click', () => window.electronAPI.minimize());
document.getElementById('btn-maximize')
  .addEventListener('click', () => window.electronAPI.maximize());
document.getElementById('btn-close')
  .addEventListener('click', () => window.electronAPI.close());

// Ribbon tab clicks
document.querySelectorAll('.ribbon-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ribbon-tab')
      .forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const command = tab.dataset.command;
    if (command && command !== 'noop') {
      window.electronAPI.ribbonCommand(command);
    }
  });
});
