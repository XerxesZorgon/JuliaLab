# ADR-013: Pluto Live Editor Launch Model
**Date:** 2026-06-25 (verified 2026-06-26)
**Status:** Accepted — implemented and verified (SC-4 a/b/c)

## Context
The LIVE EDITOR ribbon tab should launch a Pluto.jl reactive notebook. `Pluto.run()`
blocks the Julia session it runs in. JuliaLab has a single julia-vscode-owned REPL
that must remain usable alongside Pluto.

Spike B finding: manual PowerShell launch forms (`& julia -e`, `Start-Process`)
are non-deterministic — the process sometimes self-exits before the server is
ready. Node `child_process.spawn` with piped stdio and `detached: false` is the
correct production form.

## Decision
Ribbon click → `preload.js` → `ipcMain` → `main.js` spawns:
```
spawn(juliaExe, ['-e', 'using Pluto; Pluto.run()'],
      { stdio: ['ignore','pipe','pipe'], detached: false })
```
The child's PID is registered in `state.childPids` (ADR-012 reaper).
`main.js` reads stdout and treats the launch as successful on the first line
containing `localhost`. If the child exits before that, `dialog.showErrorBox`
surfaces a "install Pluto" message.

Two ribbon dispatch paths coexist:
- WS-bridge → VSCodium command (HOME, PLOTS): `data-command="…"`, no `data-dispatch`
- ipcMain → process spawn (LIVE EDITOR): `data-command="pluto:launch" data-dispatch="ipc"`

The `renderer.js` click handler branches on `tab.dataset.dispatch === 'ipc'`.

Julia executable path is read from `server-data/Machine/settings.json`
(`julia.executablePath`), the same value detect-deps writes. Fallback: `'julia'`.

## Verification (SC-4)
- (a) Ribbon click opened working Pluto notebook in external browser. ✅
- (b) `1+1` in the julia-vscode REPL returned `2` while Pluto was running. ✅
- (c) After ✕-quit, `Get-CimInstance Win32_Process -Filter "name='julia.exe'"`
  returned empty — Pluto server and notebook worker fully reaped. ✅

## Consequences
- Double-launch guard: if `plutoProcess && !plutoProcess.killed`, the IPC handler
  no-ops. Click LIVE EDITOR twice → no second Pluto.
- Multi-notebook management is not implemented — one Pluto server per session.
- Pluto must be installed in the active Julia environment; absence surfaces a
  clear error dialog.
- Default Pluto port: 1234 (auto-increments if busy).
