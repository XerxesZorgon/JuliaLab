// renderer.js — JuliaLabApp
// Sprint 6 — Task 009: tab→body switching, button dispatch, toggle, hide/pin

'use strict';

// ── Window controls ───────────────────────────────────────────────────────────

document.getElementById('btn-minimize')
  .addEventListener('click', () => window.electronAPI.minimize());
document.getElementById('btn-maximize')
  .addEventListener('click', () => window.electronAPI.maximize());
document.getElementById('btn-close')
  .addEventListener('click', () => window.electronAPI.close());

// ── Tab → body switching ──────────────────────────────────────────────────────

function activateTab(tabEl) {
  document.querySelectorAll('.ribbon-tab')
    .forEach(t => t.classList.remove('active'));
  tabEl.classList.add('active');

  const target = tabEl.dataset.tab;
  document.querySelectorAll('.ribbon-body')
    .forEach(b => b.classList.toggle('active', b.dataset.tab === target));
}

const defaultTab = document.querySelector('.ribbon-tab.active');
if (defaultTab) activateTab(defaultTab);

document.querySelectorAll('.ribbon-tab').forEach(tab => {
  tab.addEventListener('click', () => activateTab(tab));
});

// ── Button dispatch (event delegation) ───────────────────────────────────────

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-command]');
  if (!btn) return;

  const command = btn.dataset.command;

  // Ribbon hide/pin (ipc to main process) — always before noop guard
  if (btn.dataset.dispatch === 'ipc') {
    if (command === 'ribbon:hide') {
      hideRibbon();
    } else if (command === 'ribbon:pin') {
      pinRibbon();
    } else if (command === 'pluto:launch') {
      window.electronAPI.launchPluto();
    }
    return;
  }

  // Theme radio toggle — visual only, fires even for noop command
  if (btn.dataset.toggle === 'theme') {
    document.querySelectorAll('[data-toggle="theme"]')
      .forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (command && command !== 'noop') {
      window.electronAPI.ribbonCommand(command);
    }
    return;
  }

  // Generic toggle — visual only, fires even for noop command
  if (btn.dataset.toggle === 'true') {
    btn.classList.toggle('active');
    if (command && command !== 'noop') {
      window.electronAPI.ribbonCommand(command);
    }
    return;
  }

  // Standard WS dispatch — skip noop
  if (!command || command === 'noop') return;
  window.electronAPI.ribbonCommand(command);
});

// ── Ribbon hide / pin ─────────────────────────────────────────────────────────

function hideRibbon() {
  const hideBtn = document.getElementById('btn-hide-ribbon');
  const pinBtn  = document.getElementById('btn-pin-ribbon');
  if (hideBtn) hideBtn.classList.add('active');
  if (pinBtn)  pinBtn.classList.remove('active');
  window.electronAPI.hideRibbon();
}

function pinRibbon() {
  const hideBtn = document.getElementById('btn-hide-ribbon');
  const pinBtn  = document.getElementById('btn-pin-ribbon');
  if (hideBtn) hideBtn.classList.remove('active');
  if (pinBtn)  pinBtn.classList.add('active');
  window.electronAPI.pinRibbon();
}


