# ADR-012: Process Teardown Strategy
**Date:** 2026-06-25 (amended 2026-06-26)
**Status:** Accepted — implemented and verified

## Context
`killServer()` sent SIGTERM/SIGKILL to the spawned `cmd.exe` parent only. On
Windows, Node's `kill()` does not propagate to child processes, so the serve-web
node children (extension host, file-watcher, ptyHost, and their descendants
including the Julia REPL) orphaned on every quit.

Investigation revealed that `codium serve-web` daemonizes under `codium-tunnel.exe`
in a detached subtree that is NOT a descendant of the spawned `cmd.exe` PID.
`taskkill /T` on the cmd.exe PID cannot reach the real server tree. The `cmd.exe`
wrapper may itself self-exit immediately after launching codium, leaving the tree
reparented to Windows system PIDs.

## Decision
Two-layer teardown:
1. **SIGTERM the cmd.exe parent** (graceful first; lets codium flush SQLite state).
2. **`taskkill /F /T /PID <cmd-pid>`** — sweeps any cmd.exe descendants.
3. **Server-data path sweep** — kills every process whose command line matches
   both `serve-web` AND `server-data` (the app's unique absolute path), using
   PowerShell `Get-CimInstance` + `taskkill /F /T /PID`. This is the catch-all
   that actually reaps the detached codium-tunnel tree.
4. **`state.childPids` loop** — kills any additionally tracked trees (e.g. Pluto).

The sweep predicate uses `-match 'serve-web' -and -match 'server-data'` (regex,
not `-like`). A `-like` predicate with a doubled-backslash escaped absolute path
silently matches nothing on Windows — this was the original bug in T1-fix and
T1-fix-2 before T1-fix-3 corrected it.

## Verification
Process-diff audit (snapshot before launch, snapshot after ✕-quit): zero
`node.exe`/`codium.exe`/`julia.exe`/`cmd.exe`/`OpenConsole.exe`/`pwsh.exe` from
the JuliaLab-spawned tree survived a clean quit. Verified 2026-06-26.

## Consequences
- Quit takes ~2 s (SIGTERM grace window) — acceptable, better than orphans.
- Pre-flight (`preflightPort()`) reuses `killServerDataTree()` to reap any stale
  serve-web before binding port 41000 on launch.
- Pluto child (ADR-013) registers in `state.childPids`; reaped by the loop.
- `taskkill` on an already-dead PID errors — caught/ignored (resolve on both
  `exit` and `error` events in `killTree`).
- A `-match 'serve-web' -and -match 'server-data'` predicate is safe for
  single-instance use; `server-data` path is unique to this checkout.

## Dead ends documented
- SIGTERM/SIGKILL parent-only: leaks children (Windows does not propagate).
- `taskkill /T` on cmd.exe PID: misses detached codium-tunnel tree.
- `-like '*C:\\\\Users\\\\...\\\\server-data*'` predicate: doubled backslashes
  never match real command lines; silently kills nothing.
