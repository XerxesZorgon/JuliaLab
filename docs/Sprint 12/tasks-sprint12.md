# tasks.md — Sprint 12

## Task 001: Fix Pluto launcher (port/secret parsing, always-open behavior)
**Status:** [ ] Pending
**Depends on:** —
**Files:** `main.js`

Per SDD §3: add `plutoUrl` state, pass `autoopen=false`, regex-parse the
real URL (including `?secret=...`) from stdout, always call
`shell.openExternal(plutoUrl)` on both first launch and repeat clicks
against an already-running server. Reset `plutoUrl = null` in the exit
handler.

**Acceptance:** click-equivalent test (can be triggered via existing
`pluto:launch` IPC channel, no UI needed yet) — first launch opens
browser to the correct secret-bearing URL; a second trigger while still
running reopens the browser to the SAME URL without restarting the
server.

---

## Task 002: HOME tab APPS group — buttons + dispatch wiring
**Status:** [ ] Pending
**Depends on:** Task 001
**Files:** `index.html`, `renderer.js`

Add new "APPS" group to HOME tab with 4 buttons: Pluto, Wolfram, Lean,
Claude (icons already provided by John in `assets/icons/figures/`). Wire
dispatch:
- Pluto → `window.electronAPI.launchPluto()` directly (existing IPC
  channel from Task 001, NOT the WS bridge — different mechanism,
  intentional per SDD §2.1)
- Wolfram/Lean/Claude → `julialab.launchWolfram`/`julialab.openLeanMenu`/
  `julialab.launchClaude` via the existing WS bridge pattern
  (`window.electronAPI.ribbonCommand({command: '...'})`)

**Acceptance:** all 4 buttons appear correctly grouped; clicking each
sends the correct dispatch (verify via `ws-dispatch-probe.txt` for the
3 WS-routed ones; Pluto's IPC call can be confirmed via its own console
logging).

---

## Task 003: New extension.ts commands — Wolfram/Claude wrappers + Lean QuickPick
**Status:** [ ] Pending
**Depends on:** Task 002
**Files:** `extensions/julialab/src/extension.ts`, `extensions/julialab/package.json`

Register `julialab.launchWolfram` (wraps `executeCommand('wolfbook.launchKernel')`),
`julialab.launchClaude` (wraps `executeCommand('claude-vscode.sidebar.open')`),
and `julialab.openLeanMenu` (flat `QuickPick`, 14 items per SDD §2.2 —
items 1-13 dispatch to their exact confirmed `lean4.*` command IDs, item
14 opens `https://lean-lang.org/` via `vscode.env.openExternal`).

**Acceptance:** Wolfram button opens Wolfram kernel/terminal (matches
what you saw clicking its own Activity Bar icon). Claude button opens
its sidebar. Lean button shows the 14-item QuickPick; selecting each of
items 1-13 triggers the correct real Lean4 behavior; item 14 opens the
homepage in the system browser.

---

## Task 004: HELP group additions — Wolfbook + Pluto external links
**Status:** [ ] Pending
**Depends on:** —
**Files:** `index.html`, `extensions/julialab/src/extension.ts`, `extensions/julialab/package.json`

Two new commands (`julialab.openWolfbookHelp`, `julialab.openPlutoHelp`),
same `vscode.env.openExternal` pattern as existing
`julialab.openJuliaDocs`. Two new HELP group buttons.

**Acceptance:** both buttons open the correct URLs in the system browser.

---

## Task 005: Regression + teardown + tag `sprint12-complete`
**Status:** [ ] Pending
**Depends on:** Task 001-004, all green
**Files:** none (verification + tag)

Full regression pass (Sprint 9-11 feature tables, spot check), teardown
verification (John-only, single controlled cycle), then tag.
