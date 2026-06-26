# Project Plan
**Project:** JuliaLabApp — Sprint 1
**Date:** 2026-06-22
**Updated:** 2026-06-23 — versions pinned after spike

---

## Milestones

| # | Milestone | Gate Criterion | Depends On |
|---|---|---|---|
| M0 | Spike passed | All 4 SPIKE criteria green; versions pinned | — |
| M1 | Shell skeleton | `npm start` opens a frameless BaseWindow; ribbon visible; window controls work | M0 |
| M2 | Server integration | codium serve-web spawns, reaches ready, workbench loads in WebContentsView at correct bounds | M1 |
| M3 | Sprint 1 complete | All 5 SC criteria pass on cold launch; no orphan processes | M2 |

---

## Dependency Lock (pinned 2026-06-23 after Task 001b spike)

| Dependency | Pinned Version | Notes |
|---|---|---|
| Node.js | 22.22.1 | Already installed |
| Electron | 39.8.8 | Confirmed working; `npx electron` used in spike |
| VSCodium | 1.121.03429 | Already installed on dev machine |
| codium serve-web | bundled with VSCodium 1.121.03429 | No separate binary needed |

No `^` or `~` version ranges. All versions exact in `package.json`.

---

## Key Spawn Pattern (locked from spike)

```js
// Correct Windows spawn for codium serve-web
const CODIUM_BIN = 'C:\\Program Files\\VSCodium\\bin\\codium';

spawn('cmd.exe', [
  '/c', CODIUM_BIN + '.cmd',
  'serve-web',
  '--host',            '127.0.0.1',
  '--port',            String(PORT),
  '--server-data-dir', DATA_DIR,
  '--without-connection-token',
], { stdio: ['ignore', 'pipe', 'pipe'], shell: false });
```

**Ready signal:** `/Web UI available at/` on stdout (first line emitted).
`Extension host agent started` appears ~2s later via CLI wrapper prefix —
do NOT use as ready signal; it is not directly on stdout.

**Orphan prevention:** Always call `serverProcess?.kill('SIGTERM')` before
any `app.exit()` call, including error paths.

---

## Task Sequence

```
Task 001b  Spike (M0) ✅ PASS 2026-06-23
Task 002   package.json + .gitignore (M1)
Task 003   main.js skeleton — BaseWindow, frameless, no content (M1)
Task 004   preload.js — contextBridge for window controls (M1)
Task 005   index.html + ribbon.css — MATLAB ribbon layout (M1)
Task 006   renderer.js — window control button wiring (M1)
Task 007   server-data/Machine/settings.json — activity bar suppression (M2)
Task 008   main.js: spawnServer() + waitForReady() (M2)
Task 009   main.js: create workbenchView, loadURL, setBounds() (M2)
Task 010   main.js: resize handler + debounce (M2)
Task 011   main.js: clean shutdown + orphan prevention (M2)
Task 012   Integration smoke test + SC verification (M3)
```

One file per task. Tasks 008–011 all touch `main.js` — each is a single
additive concern within that file.

---

## Integration Checkpoints

| After task | Checkpoint |
|---|---|
| Task 001b | ✅ Versions pinned. Proceed to Task 002. |
| Task 006 | M1 gate: `npm start` opens frameless window with ribbon; window controls work. Commit before Task 007. |
| Task 009 | M2 gate: workbench loads in correct position; Julia terminal works. Commit before Task 010. |
| Task 012 | M3 gate: all 5 SC criteria verified. Tag commit `sprint1-complete`. |

---

## Definition of Done (Sprint 1)

`npm start` on a clean clone opens a single frameless Electron window.
The MATLAB-style ribbon occupies the top. The VSCodium workbench fills
the remainder with no VSCodium chrome visible (no title bar, no menu bar,
no activity bar). Julia runs in the integrated terminal with subjectively
imperceptible echo latency. Window controls and resize work correctly.
Closing the app leaves no orphan processes. All 5 SC criteria in
TEST_PLAN.md are verified green and committed as `sprint1-complete`.
