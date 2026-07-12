// renderer.js — JuliaLabApp
// Sprint 6 — Task 009: tab→body switching, button dispatch, toggle, hide/pin

'use strict';

// ── FIGURES plot configuration accumulator (Sprint 8) ─────────────────────────
window.plotConfig = {
  type:  null,  // string: selected plot type ('scatter', 'line', etc.)
  style: [],    // array: active style options
  axes:  [],    // array: active axes options
};

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
      // Only COMMAND WINDOW uses the state-aware |show|hide suffix
      const isActive = btn.classList.contains('active');
      const needsStateSuffix = command.startsWith(
        'workbench.action.terminal.toggleTerminal'
      );
      const payload = needsStateSuffix
        ? command + '|' + (isActive ? 'show' : 'hide')
        : command;
      window.electronAPI.ribbonCommand(payload);
    }
    return;
  }

  // FIGURES selection — radio (plot-type) or multi-toggle (style/axes)
  if (btn.dataset.group) {
    const group = btn.dataset.group;
    const value = btn.dataset.value;
    if (group === 'plot-type') {
      const wasActive = btn.classList.contains('active');
      document.querySelectorAll('[data-group="plot-type"]')
        .forEach(b => b.classList.remove('active'));
      if (!wasActive) btn.classList.add('active');
      window.plotConfig.type = wasActive ? null : value;
    } else if (group === 'plot-style') {
      btn.classList.toggle('active');
      const idx = window.plotConfig.style.indexOf(value);
      if (idx === -1) window.plotConfig.style.push(value);
      else window.plotConfig.style.splice(idx, 1);
    } else if (group === 'plot-axes') {
      btn.classList.toggle('active');
      const idx = window.plotConfig.axes.indexOf(value);
      if (idx === -1) window.plotConfig.axes.push(value);
      else window.plotConfig.axes.splice(idx, 1);
    }
    
    window.electronAPI.ribbonCommand({
      command: 'julialab.updatePlotConfig',
      args: [window.plotConfig]
    });
    return;
  }

  // Keyboard injection — sends key event directly to workbench view
  if (btn.dataset.dispatch === 'kb') {
    const key = btn.dataset.key;
    if (key) window.electronAPI.sendKey(key);
    return;
  }

  // FIGURES plot builder
  if (btn.dataset.dispatch === 'plot-builder') {
    window.electronAPI.ribbonCommand({ command: 'julialab.regeneratePlot' });
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
