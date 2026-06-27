# ADR-017: `--cli-data-dir` Investigation for Trust-State Persistence
**Date:** 2026-06-27
**Status:** Under Investigation (result to be recorded after Spike A)
**Sprint:** 5

---

## Context

Sprint 4 established that workspace trust state lives in browser-side IndexedDB,
keyed by the serve-web origin (`http://127.0.0.1:<port>`). Fixing the port to
41000 makes the origin stable and trust state persists across sessions (ADR-015
amendment, ADR-016). This is the current baseline.

`codium serve-web --help` reveals a `--cli-data-dir <DIR>` flag (env:
`VSCODE_CLI_DATA_DIR`). Documentation suggests this controls where CLI metadata
is stored, which may include a `state.vscdb` SQLite file containing trust and
other persistent state. If trust is stored in `state.vscdb` rather than in the
browser's IndexedDB, trust persistence would become independent of browser origin
— decoupling it from port choice.

This distinction matters for two future scenarios:
1. If dynamic ports are ever re-introduced, trust would survive port changes.
2. If a zero-install or clean-machine scenario requires pre-seeding trust without
   a first-launch click, a disk-based trust file could be pre-populated.

---

## Decision

Run a directed spike (T-spike-A-1 through T-spike-A-revert in tasks-sprint5.md)
to determine if passing `--cli-data-dir SERVER_DATA_DIR` causes VSCodium
serve-web to write a `state.vscdb` or equivalent trust-state file to the target
directory.

The spike is temporary: the flag is added, tested, and reverted. Permanent
adoption requires an explicit decision recorded in §Outcome below.

---

## Rationale

The investigation is cheap (one-line arg change, one launch cycle) and the
potential benefit (decoupled trust persistence) is worth characterizing. The risk
is near-zero: if the flag does nothing useful, it is removed and nothing changes.

Adopting the flag without evidence that it works is not warranted — it adds a
non-standard argument to the spawn call and could have unintended side-effects on
other CLI metadata paths.

---

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Skip the spike; keep fixed-port trust as-is | Fixed port already works; spike is informational only — both paths are valid |
| Permanently add the flag without testing | Unknown side effects; not justified without evidence |
| Read VSCode source to understand the flag | Fragile; behavior may differ between codium-tunnel and upstream |

---

## Consequences if Adopted

- Easier: Trust state persists even if port changes; clean-machine onboarding
  could seed trust via a pre-built `state.vscdb`.
- Harder: One more non-standard flag in the spawn call to document and maintain.
- Locked in: `SERVER_DATA_DIR` path must remain stable (already true).

## Consequences if Rejected

- Easier: Spawn call remains minimal.
- Locked in: Trust persistence continues to depend on fixed port.

---

## Outcome (fill in after Spike A completes)

**Date completed:** _____

**Did a `state.vscdb` appear in `server-data/`?** [ ] Yes / [ ] No

**Files created/modified (list):**
```
(paste Antigravity's T-spike-A-2 report here)
```

**Trust persisted across relaunch with the flag?** [ ] Yes / [ ] No / [ ] Not tested

**Decision:** [ ] Adopt (add to `spawnServer` permanently) / [ ] Reject (discard spike)

**Rationale for decision:**
```
Finding: H2 confirmed. Telemetry dismissal state lives exclusively in
browser-side IndexedDB (Electron userData, origin http://127.0.0.1:41000).
No telemetry state file appeared in server-data across multiple launch/quit
cycles. Fixed port resolves this entirely — the dismissal persists because
the origin is stable. No further investigation required.
```

Did a state.vscdb appear in server-data/? No

Files created by the flag:
  server-data\serve-web-key-half  (46 bytes) — connection token key half
  server-data\serve-web\lru.json  (44 bytes) — recently-opened workspace list

Trust persisted across relaunch with the flag? N/A — trust was already
persisting via fixed-port IndexedDB before the flag was applied.

Decision: Reject — the flag controls only connection-token and LRU metadata.
It does not move trust state to disk. No benefit over fixed-port architecture.

Rationale: The hypothesised state.vscdb does not materialise. Trust persistence
is fully solved by fixed port (ADR-015 amendment). The flag adds two files to
server-data/ with no architectural value and caused a broken session when
Electron cache locks were held by stale processes. Permanently excluded.
