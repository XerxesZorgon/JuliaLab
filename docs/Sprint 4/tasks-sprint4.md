# tasks — Sprint 4
**Project:** JuliaLabApp
**Date:** 2026-06-25
**Discipline:** One file per task · Ask mode · diff review before run · commit on
green · `git checkout -- <file>` (revert, never patch) on red · escalate
fix-loops to the planning thread.

Legend: ☐ todo · ◑ in progress · ☑ done

---

## Sequencing / dependencies
- **T1 must precede T7** (the reaper's tracked-PID list must exist before the
  Pluto child registers).
- **T6 → T7 → T8 → T9** in order; end-to-end Pluto verification lands at **T9**.
- T2, T3, T4, T-trust are independent — any order.
- T5 is a verification checkpoint (no code).
- `main.js` is touched by T1, T2, T7 — separate atomic commits, sequential.

---

## ☑ T-port — Dynamic free server port  (DELIVERED)
**File:** `main.js` · **ADR:** 015 · **Test:** TC-5
Acquire an OS-assigned free port; spawn serve-web on it; workbench loadURL reads
`state.serverPort`. **Commit:** `T-port: acquire dynamic free server port (ADR-015)`.

---

## ☐ T1 — Clean process-tree teardown
**File:** `main.js` → `killServer()` · **ADR:** 012 · **Test:** TC-1 (SC-1)
Add `killTree(pid)` running `taskkill /F /T /PID <pid>` (spawn `taskkill`,
`shell:false`; ignore "not found"). Rewrite `killServer()`: set `shuttingDown`;
SIGTERM the parent; await `exit` OR a ~2 s grace timeout; then `killTree(state.serverProcess.pid)`;
then `killTree` each other tracked PID. Replace the single-process assumption
with a tracked-PID list (so T7's Pluto PID can register).
**Verify:** TC-1 — clean quit, ~2 s later zero spawned-tree node/codium/julia.
**Commit:** `T1: process-tree teardown via taskkill /T (ADR-012)`

## ☐ T2 — View background colour (resize black-flash)
**File:** `main.js` → `createWindow()` · **KI:** 2 · **Test:** TC-7
After constructing `ribbonView` and `workbenchView`, call
`setBackgroundColor('#1e1e1e')` on each (the inherited View method — NOT a
constructor option; confirm against Electron 39 `WebContentsView`/`View` docs).
**Verify:** TC-7 — drag-resize, no black flash.
**Commit:** `T2: view background colour eliminates resize flash (KI-2)`

## ☐ T3 — Build copy skip list
**File:** `scripts/copy-extension.js` → `copyDir()` · **KI:** 4 · **Test:** TC-8
Add `const SKIP_FILES = new Set(['tsconfig.json','package-lock.json']);` and, in
the file branch, `if (SKIP_FILES.has(entry.name)) continue;`.
**Verify:** TC-8 — `npm run build:ext`; served ext dir lacks both files.
**Commit:** `T3: skip tsconfig/package-lock in extension copy (KI-4)`

## ☐ T4 — Race-free REPL start (bounded delay)
**File:** `extensions/julialab/src/extension.ts` → `activate()` · **KI:** 3 · **Test:** TC-3
Before `await startJuliaRepl();`, insert `await new Promise(r => setTimeout(r, 1500));`
with a comment: machine-speed-dependent; readiness-probe via `juliaExt.exports`
deferred to Sprint 5 (Spike J). Rebuild required (`npm run build:ext` / `npm start`).
**Verify:** TC-3 — 3 cold launches, no crash reporter.
**Commit:** `T4: delay REPL start to clear julia-vscode init race (KI-3)`

## ☐ T-trust — Disable workspace trust
**File:** `server-data/Machine/settings.json` · **ADR:** 016 · **Test:** TC-6
Add `"security.workspace.trust.enabled": false`. (Merge-safe — detect-deps does
not manage this key.)
**Verify:** TC-6 — cold launch: no trust dialog, no Restricted-Mode badge;
relaunch holds.
**Commit:** `T-trust: disable workspace trust to remove launch prompt (ADR-016, KI-6)`

## ☐ T5 — Workspace panel persistence  (VERIFICATION ONLY — no code)
**ADR:** 014 · **Test:** TC-2 (SC-2)
Spike E showed SC-2 already satisfied. Run TC-2 as a regression check; if it
passes, close SC-2 with no code change. If it FAILS (panel closed on 2nd launch),
escalate to the planning thread — the no-code conclusion would be wrong.

---

## Pluto Live Editor  (T6–T9 — ship on Spike B PASS, which is granted)
Additive, non-breaking steps; full end-to-end verification at T9.

## ☐ T6 — Pluto IPC expose
**File:** `preload.js` · **ADR:** 013
Add to the `electronAPI` object: `launchPluto: () => ipcRenderer.send('pluto:launch')`.
**Verify:** app launches; `window.electronAPI.launchPluto` is a function (no behaviour change yet).
**Commit:** `T6: expose launchPluto on contextBridge (ADR-013)`

## ☐ T7 — Pluto spawn handler  (depends on T1)
**File:** `main.js` · **ADR:** 013 · **Test:** TC-4
Add `ipcMain.on('pluto:launch', () => launchPluto());`. `launchPluto()`:
read `julia.executablePath` from `server-data/Machine/settings.json`; if a Pluto
child is already alive, no-op; else `spawn(juliaExe, ['-e','using Pluto; Pluto.run()'],
{ stdio:['ignore','pipe','pipe'], detached:false })`; register the PID in the
tracked-PID list (T1); read stdout — on the `localhost:1234` ready line consider
it launched; if the child exits before that, `dialog.showErrorBox` with install
guidance.
**Verify:** triggered via T9; confirms TC-4(a) and the negative path.
**Commit:** `T7: spawn Pluto as tracked child process with stdout readiness (ADR-013)`

## ☐ T8 — Pluto ribbon markup
**File:** `index.html` · **ADR:** 013
Change the LIVE EDITOR span from `data-command="noop"` to
`data-command="pluto:launch" data-dispatch="ipc"`.
**Verify:** app launches; tab still renders (no dispatch yet until T9).
**Commit:** `T8: wire LIVE EDITOR tab to ipc dispatch (ADR-013)`

## ☐ T9 — Pluto dispatch routing  (END-TO-END VERIFY)
**File:** `renderer.js` · **ADR:** 013 · **Test:** TC-4
In the ribbon-tab click handler, if `tab.dataset.dispatch === 'ipc'` call
`window.electronAPI.launchPluto()`; else the existing `ribbonCommand(command)`
path.
**Verify:** TC-4 full — click LIVE EDITOR → Pluto opens (a); `1+1` in REPL → `2`
(b); open a notebook, clean-quit, zero Pluto-tree `julia.exe` (c, the deferred
SC-4c). Record whether a worker survives `/T`.
**Commit:** `T9: route LIVE EDITOR click to Pluto launch (ADR-013)`

---

## Definition of done (Sprint 4)
TC-1, TC-3, TC-4(a/b/c), TC-6 pass; TC-2/TC-5 regressions hold; TC-7/TC-8 pass.
Tag `sprint4-complete`. Carry to Sprint 5: serve-web persistence H1/H2 (run the
discriminator now that T1 gives a clean quit), KI-3 readiness probe, Candidates
C/D.
