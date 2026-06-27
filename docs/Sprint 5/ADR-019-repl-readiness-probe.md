# ADR-019: REPL Readiness Probe Strategy (KI-3 / Spike J)
**Date:** 2026-06-27
**Status:** Under Investigation (result to be recorded after Spike J)
**Sprint:** 5

---

## Context

Sprint 4 delivered T4: a 2000 ms hard-coded delay in `extension.ts::activate()`
before calling `startJuliaRepl()`. This was the minimal safe fix for a race
condition where `language-julia.startREPL` was called before the julia-vscode
extension had completed its async language-server initialisation.

The comment in `extension.ts` at the delay site reads:
```
// KI-3: bounded delay to clear julia-vscode async init before REPL start.
// 2000 ms is machine-speed-dependent; a readiness probe via juliaExt.exports
// is the correct long-term fix (Sprint 5 / Spike J).
```

Known constraints:
- `await juliaExt.activate()` (in `ensureJuliaExtension`) resolves when the
  extension host activates; it does NOT await the Julia language server's async
  init.
- `juliaExt.isActive` becomes `true` immediately when `activate()` resolves;
  polling it is a no-op.
- The language server init is asynchronous within the julia-vscode extension;
  no VSCode public API surfaces its completion.

Spike J determines whether `juliaExt.exports` — the object returned by the julia-
vscode extension's `activate()` function — exposes a readiness signal (Promise,
event, or status flag) that targets language-server completion.

The julia-vscode extension ships as a minified bundle (`dist/extension.js`);
static analysis is impractical. The probe must be runtime: a temporary
`console.log(Object.keys(juliaExt?.exports ?? {}))` added to
`extension.ts::activate()` after `await ensureJuliaExtension()` reveals the
exports at runtime.

---

## Decision

**Path A (Spike J succeeds — exports expose a ready signal):**

Replace the `setTimeout` delay with an await on the ready signal from
`juliaExt.exports`. The exact form depends on the signal type:

- If it is a `Promise<void>`: `await juliaExt.exports.ready;`
- If it is a VSCode `Event<void>`: wrap in a Promise:
  ```typescript
  await new Promise<void>(resolve =>
    juliaExt.exports.onREPLReady(resolve)
  );
  ```
- If it is a boolean status flag with an associated event: await the event if
  the flag is false, resolve immediately if the flag is true.

Acceptance: 3 consecutive cold launches, no crash-reporter dialog, REPL
interactive within ≤ (actual language-server start time + 200 ms overhead).

**Path B (Spike J fails — no ready signal in exports):**

The 2000 ms delay stays. KI-3 is closed as permanently infeasible. ADR-019 is
updated with the export surface found (empty, or unrelated API) and the rationale
for keeping the delay. No further investigation is planned; the delay may be tuned
downward empirically on a per-machine basis if needed.

---

## Rationale

A proper readiness probe is strictly better than a fixed delay if one exists:
- **Correctness:** The delay is machine-speed-dependent. On a fast machine it
  wastes time; on a slow machine it may be insufficient.
- **Simplicity:** A single `await` is clearer than a comment explaining why an
  arbitrary timeout exists.

If the probe is unavailable, the delay is the only safe option given the public
VSCode extension API. Wrapping in a polling loop (`setInterval` on `isActive`)
has been confirmed to be a no-op and is explicitly rejected.

---

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Poll `juliaExt.isActive` | No-op: `isActive` is true immediately after `activate()` resolves |
| Use `vscode.languages.getDiagnostics()` as readiness proxy | Unreliable; diagnostics may be absent for unrelated reasons |
| Increase delay to 3000 ms | Increases cold-start latency; still machine-dependent |
| Hook `language-julia.startREPL` command availability | Command may register before language server is ready |

---

## Consequences if Path A (probe adopted)

- Easier: Reliable REPL start on all machines; cold-start time reduced to actual
  language-server init time.
- Harder: Dependency on an undocumented `juliaExt.exports` API; may break on
  future julia-vscode updates.
- Mitigation: Wrap in a try/catch with fallback to the 2000 ms delay.

## Consequences if Path B (delay retained)

- Easier: No dependency on julia-vscode internals.
- Harder: 2000 ms fixed overhead on every launch; insufficient on very slow
  machines.
- Locked in: KI-3 closed. Revisit only if julia-vscode publishes a formal API.

---

## Outcome (fill in after Spike J completes)

**Exports keys found:**
```
(paste T-spike-J console output here)
```

**Is a readiness signal present?** [ ] Yes (name: _____) / [ ] No

**Path taken:** [ ] A — probe implemented / [ ] B — delay retained, KI-3 closed

**If Path B, rationale:**
```
(fill in if no signal found)
```

**SC-2 satisfied via:** [ ] (a) delay removed / [ ] (b) delay retained with rationale

Exports keys found: version, getEnvironment, getJuliaupExecutable,
getJuliaExecutable, getJuliaPath, getPkgServer, installJuliaOrJuliaup, executeInREPL

Is a readiness signal present? No

Path taken: B — delay retained, KI-3 closed

Rationale: juliaExt.exports exposes only environment-query and REPL-execution
utilities. No Promise, Event, or status flag targeting language-server init is
present. The 2000 ms setTimeout delay remains the only available mechanism.
Revisit only if julia-vscode publishes a formal readiness API.

SC-2 satisfied via: (b) delay retained with rationale
