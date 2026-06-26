# ADR-012: Process Teardown Strategy
**Date:** 2026-06-25
**Status:** Accepted

## Context
`killServer()` escalates SIGTERM → 2 s → SIGKILL, but on Windows Node's `kill()`
(even SIGKILL) targets only the parent PID, so the codium serve-web node children
(extension host, file watcher, ptyHost) and any spawned Julia orphan on quit and
accumulate across the relaunch-heavy dev loop. A full process-tree reap is
required. Naive `taskkill /F` force-kills ungracefully, risking a dirty VSCodium
workspace store (SQLite).

Grounding note: the server is spawned as `cmd.exe /c codium.cmd …`, so
`state.serverProcess.pid` is the **cmd.exe** PID; `taskkill /F /T /PID <that>`
reaps the whole tree from the top in one call.

## Decision
Graceful-first tree kill: signal the parent to terminate, wait a bounded grace
window (~2 s, reuse the existing timeout), then `taskkill /F /T /PID
<cmd.exe-pid>` to sweep survivors. Maintain a tracked-PID list (server + any
Pluto child from ADR-013) so all spawned trees are reaped, not just one.

## Rationale
- Signal-first lets codium flush state and close SQLite cleanly.
- `/T` reaps the node children Windows will not signal.
- `/F` is the final sweep on whatever remains, not the first action.
- PID-list structure avoids a second teardown path for Pluto.

## Alternatives Considered
| Option | Rejected Because |
|---|---|
| `taskkill /F /T` immediately, no grace | Ungraceful; SQLite-dirty risk |
| SIGTERM/SIGKILL parent only (status quo) | Leaks children — this is the bug |
| Enumerate and kill each child individually | Fragile; races with new children |
| POSIX process-group kill | Not available on Windows |

## Consequences
- Quit is marginally slower by the grace window.
- `taskkill` on an already-dead PID errors — caught/ignored.
- The Pluto child (ADR-013) registers with the same reaper.

## Footnote — possible secondary benefit (trust persistence, H2)
Session forensics suggest VSCodium serve-web may flush global state
(`globalStorage/state.vscdb`, where the workspace-trust list lives) only on a
clean shutdown. Because this session's launches were repeatedly force-killed,
that state may never have been flushed — which would explain the every-launch
trust prompt (KI-6). If hypothesis H2 holds, this clean-teardown change may fix
trust persistence as a side effect. This is unconfirmed (see SDD §8) and does not
change the decision, but it is a second motivation for clean teardown beyond
orphan-reaping.
