# ADR-013: Pluto Live Editor Launch Model
**Date:** 2026-06-25
**Status:** Accepted — validated by Spike B (PASS-qualified)

## Context
SC-4 requires launching a Pluto notebook from a ribbon click. `Pluto.run()`
blocks the Julia session it runs in (confirmed) and opens the system browser
itself. JuliaLab has a single julia-vscode-owned REPL that must stay usable.
Launching a process is an OS-level concern, not a VSCodium command.

Spike B finding: manual launch forms are non-deterministic. `Pluto.run()` in the
REPL blocks it; `& julia -e "…Pluto.run()"` foreground sometimes self-exits and
sometimes holds; `Start-Process julia -e` detached likewise. None of these is the
production launch path, so manual SC-4c reap testing is unreliable and was
deferred to T7.

## Decision
Launch Pluto as a dedicated Julia child process spawned by Electron `main.js`:
ribbon → `preload` → `ipcMain` → `child_process.spawn(<detected juliaExe>,
['-e','using Pluto; Pluto.run()'], { stdio:['ignore','pipe','pipe'],
detached:false })`. Register the PID with the ADR-012 reaper. This path does NOT
use the WebSocket/extension bridge (which HOME and PLOTS use).

**Readiness via stdout (Spike B refinement):** `main.js` reads the child's piped
stdout and treats the launch as successful only on the `localhost:1234` ready
line; if the child exits before that line, surface an error dialog (covers the
Pluto-not-installed and self-exit cases). Piped stdio with `detached:false` also
keeps the child deterministically alive, avoiding the manual `-e` flakiness.

## Rationale
- Long-lived OS process lifecycle belongs in `main.js`, which already owns codium
  and its teardown — one reaper, one place.
- A separate process bypasses the REPL → REPL stays free (SC-4b, proven).
- The detected `julia.executablePath` is a real `julia.exe` (not a juliaup shim),
  so `-e` works directly.
- `Pluto.run()` performs the browser open — no URL/token plumbing.

## Alternatives Considered
| Option | Rejected Because |
|---|---|
| `Pluto.run()` in the REPL (sendText) | Blocks the only REPL (SC-4b fail) |
| `@async Pluto.run()` in the REPL | Murky interrupt/teardown; ties up the session |
| Spawn from the extension host over WS | Extension-host lifecycle owned by codium; child leaks with codium's tree; splits teardown ownership |
| PowerShell `Start-Process`/`-e` proxy in production | Non-deterministic self-exit (Spike B) |

## Consequences
- Two ribbon dispatch paths coexist: WS-bridge → VSCodium command (HOME, PLOTS)
  and ipcMain → process spawn (LIVE EDITOR). Flagged in markup via
  `data-dispatch="ipc"`; documented in DESIGN.
- `main.js` reads `julia.executablePath` from `server-data/Machine/settings.json`.
- Default port 1234, auto-incrementing if busy — acceptable.
- Pluto server + per-notebook workers register with the ADR-012 reaper;
  SC-4c verified in T7 (open a notebook, quit, expect zero Pluto-tree `julia.exe`).
