# ADR-015: Dynamic Server Port
**Date:** 2026-06-25
**Status:** Accepted & DELIVERED (commit `T-port: acquire dynamic free server port (ADR-015)`)
**Supersedes:** T1b (startup port pre-flight, never implemented)

## Context
`main.js` hardcoded `SERVER_PORT = 3456`. Across one dev session this produced
repeated `os error 10048` launch failures from two distinct causes:
1. Orphaned serve-web processes surviving quit and holding the port.
2. A **winnat ghost socket** — 3456 stuck in `LISTENING` with a dead owner PID
   (74616), unclearable by `taskkill` or a `winnat` service restart, cleared only
   by reboot. 3456 was confirmed NOT in the OS excluded-port ranges, so this was
   a stuck-binding problem, not a reservation.

A fixed port is structurally fragile: every forced teardown (including the
deliberate force-kill in T1) can mint a new ghost, and a reclaim-by-PID
pre-flight (T1b) cannot reclaim a socket whose owner is already dead.

## Decision
`main.js` acquires a free OS-assigned TCP port at startup instead of a constant:
bind a throwaway server to port 0 on 127.0.0.1, read the assigned port, close it,
and immediately spawn `serve-web --port <that>`. The workbench `loadURL` already
reads `state.serverPort`, so it picks up the dynamic value automatically.

```js
function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}
```

## Rationale
- A stuck/ghosted prior port is simply never requested again — the failure class
  disappears rather than being patched per-instance.
- Strictly smaller and more robust than T1b's detect-identify-reclaim pre-flight.
- No user-facing cost: the workbench URL is internal; nobody types it.

## Alternatives Considered
| Option | Rejected Because |
|---|---|
| Fixed port + T1b reclaim pre-flight | Cannot reclaim a ghost socket with a dead owner; reboot-only worst case |
| Bump to a different fixed port (3457) | Relocates the curse; next forced kill ghosts the new port |
| Fixed port + winnat restart on failure | Did not clear the ghost here; flushes all NAT (breaks WSL/Docker/Hyper-V) |

## Consequences
- T1b removed from scope; ADR-012's pre-flight reclaim unnecessary.
- The workbench port differs each launch (logged as `[server] using dynamic
  port N`) — expected, not a bug.
- Tiny theoretical free-then-rebind race; negligible on localhost single-user;
  mitigated by spawning immediately after `close()`.
- `findFreePort()` rejection (no free ports) is not given a dedicated dialog;
  trivial follow-up if ever needed.

## Verification (delivered green)
- `npm start` → `[server] using dynamic port 52529`, `Web UI available`,
  workbench rendered. No `10048`.
- Quit + relaunch → second launch on the extension host with no `10048`
  (relaunch scenario that previously failed all session).
