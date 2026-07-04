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
    if (!btn.dataset.sync) {
      btn.classList.toggle('active');
    }
    if (command && command !== 'noop') {
      // For state-aware commands, append the new state as a suffix
      const isActive = btn.classList.contains('active');
      const payload = btn.dataset.sync
        ? command
        : command + '|' + (isActive ? 'show' : 'hide');
      window.electronAPI.ribbonCommand(payload);
    }
    return;
  }

  // Standard WS dispatch — skip noop
  if (!command || command === 'noop') return;
  window.electronAPI.ribbonCommand(command);
});

// ── Ribbon hide / pin ─────────────────────────────────────────────────────────

function hideRibbon() {
  document.getElementById('ribbon-strip').classList.add('ribbon-tabs-hidden');
  const hideBtn = document.getElementById('btn-hide-ribbon');
  const pinBtn  = document.getElementById('btn-pin-ribbon');
  if (hideBtn) hideBtn.classList.add('active');
  if (pinBtn)  pinBtn.classList.remove('active');
  window.electronAPI.hideRibbon();
}

function pinRibbon() {
  document.getElementById('ribbon-strip').classList.remove('ribbon-tabs-hidden');
  const hideBtn = document.getElementById('btn-hide-ribbon');
  const pinBtn  = document.getElementById('btn-pin-ribbon');
  if (hideBtn) hideBtn.classList.remove('active');
  if (pinBtn)  pinBtn.classList.add('active');
  window.electronAPI.pinRibbon();
}

// ── Event receiver — extension → renderer (ADR-023) ──────────────────────────

function connectEventReceiver() {
  const ws = new WebSocket('ws://127.0.0.1:2999');

  ws.addEventListener('open', () => {
    // Request initial panel state sync
    ws.send(JSON.stringify({ command: 'julialab.syncPanelState' }));
  });

  ws.addEventListener('message', e => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.event === 'panelState' && msg.panel === 'terminal') {
        const btn = document.querySelector(
          '[data-command="workbench.action.terminal.toggleTerminal"]'
        );
        if (btn) btn.classList.toggle('active', msg.open);
      }
    } catch (_) { /* ignore malformed messages */ }
  });

  ws.addEventListener('close', () => {
    // Reconnect after 3s if connection drops
    setTimeout(connectEventReceiver, 3000);
  });

  ws.addEventListener('error', () => {
    // error always precedes close; reconnect handled by close handler
  });
}

// Wait 6s for extension host WS server to start before connecting
setTimeout(connectEventReceiver, 6000);
