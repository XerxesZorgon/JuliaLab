# ADR-015: Server Port Strategy
**Date:** 2026-06-25 (amended 2026-06-26)
**Status:** Accepted — amended; dynamic port reverted to fixed port 41000

## History
**Original decision (T-port):** Acquire a free OS-assigned port at startup via
`findFreePort()` (bind to port 0, read assigned port, close, spawn serve-web on
it). Rationale: eliminates `os error 10048` ghost-socket lockouts from a fixed port.

**Amendment (T-port-fix-A/B, 2026-06-26):** Reverted to fixed port 41000.

## Why the amendment was necessary
Browser storage (IndexedDB, localStorage) is strictly partitioned by origin:
`http://127.0.0.1:<port>`. Each dynamic-port launch creates a new origin with
isolated storage. This caused:
- Workspace trust dialog on every launch (trust decision stored per-origin).
- julia-vscode telemetry prompt on every launch.
- Sidebar state not persisting across sessions.
- Any other browser-stored VSCodium state resetting each session.

These were initially diagnosed as a serve-web state-persistence anomaly (H1/H2).
The correct diagnosis is browser-origin partitioning by dynamic port.

## Decision (amended)
Fixed port **41000** (outside all excluded-port ranges; confirmed via
`netsh int ipv4 show excludedportrange protocol=tcp`). Port-collision risk from
stale serve-web processes is handled by:

1. **T1 teardown** (ADR-012): clean quit reaps the entire serve-web tree.
   Zero orphans on normal quit = zero ghost sockets.
2. **Pre-flight sweep** (`preflightPort()` in `main.js`): on every launch,
   `killServerDataTree()` runs before `spawnServer()`, reaping any stale
   serve-web from a prior crash or force-kill. Followed by 300 ms wait for
   socket release.

## Port choice rationale
- 41000 is not in the Windows excluded ranges (50000–59999 and above were excluded).
- Not a well-known service port.
- Low contention on a single-user dev machine.
- If 41000 is somehow occupied by an unrelated app, the pre-flight will detect
  this (the serve-web spawn will fail with 10048 after the sweep no-ops on a
  non-server-data process) and the 30 s timeout dialog surfaces it.

## Consequences
- Browser-origin state persists across sessions: trust decisions, telemetry
  dismissals, sidebar state, MRU files — all now stable.
- `findFreePort()` function removed; `net` require retained (unused, harmless).
- Pre-flight adds ~300 ms to launch time — imperceptible.
- Ghost-socket risk remains for the crash case; pre-flight handles it.
- The `[server] using dynamic port N` console log is gone; server always binds 41000.
