# Software Description Document — Sprint 4
**Project:** JuliaLabApp — robustness pass + Pluto Live Editor
**Version:** 0.3 (final — all SCs verified)
**Date:** 2026-06-26
**Author:** John Peach / eurAIka
**Repo:** `C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp`
**Prior sprint:** `sprint3-complete` (28c141b)
**Tag:** `sprint4-complete`

## Changelog 0.2 → 0.3
- All six success criteria verified and closed.
- ADR-015 (dynamic port) amended: dynamic port reverted to fixed port 41000
  after discovering that per-session browser-origin partitioning (IndexedDB
  keyed by port) caused trust decisions, sidebar state, and telemetry dismissals
  to reset every launch. T1's teardown makes a fixed port safe for clean quits;
  T-port-fix-B adds a pre-flight sweep for the crash/force-kill case.
- KI-6 (workspace trust dialog) closed via fixed-port browser-origin persistence,
  not settings.json. All settings-based approaches confirmed structurally blocked
  (VSCode issue #210965, as-designed; codium-tunnel has no --disable-workspace-trust
  flag; settings files ignored for trust in web context). Root cause: dynamic port.
- T-trust and T-trust-B reverted (both inert; Settings-based approaches do not work).
- SC-3 verified at 2000 ms delay (3 clean cold launches, no crash reporter).
- SC-4 fully verified: (a) Pluto opens in browser, (b) REPL usable alongside,
  (c) Pluto tree reaped on quit via childPids + killTree.
- Sprint 5 carry-list added (§8).

---

## 1. Purpose

Sprint 4 hardened JuliaLab's launch and teardown, eliminated startup friction,
and promoted the Pluto Live Editor from spike to shipped feature.

---

## 2. What Shipped

| Feature | Task | Status |
|---|---|---|
| Fixed port 41000 + pre-flight sweep | T-port-fix-A/B | ✅ |
| Process-tree teardown (serve-web + Pluto) | T1 | ✅ |
| View background colour (resize flash) | T2 | ⚠️ partial — flash persists |
| Extension copy skip list | T3 | ✅ |
| Bounded REPL start delay (2000 ms) | T4 | ✅ |
| Workspace panel persistence | T5 | ✅ already satisfied |
| No workspace-trust dialog | T-trust series | ✅ via fixed port |
| LIVE EDITOR ribbon → Pluto in browser | T6–T9 | ✅ |
| Project documentation committed to git | chore | ✅ |
| Antigravity standing rules (.antigravity/rules.md) | docs | ✅ |

---

## 3. Success Criteria — Final Verdicts

**SC-1 — Clean teardown:** ✅ After ✕-quit, zero `node.exe`/`codium.exe`/
`julia.exe` from the JuliaLab-spawned tree. Verified via process-diff audit.

**SC-2 — Persistent workspace panel:** ✅ Julia WORKSPACE panel visible on
2nd+ cold launches without a click. Satisfied by VSCodium's default view
restoration; no code change required (Spike E finding).

**SC-3 — Race-free REPL start:** ✅ No crash-reporter dialog across 3
consecutive cold launches. Verified at 2000 ms bounded delay.

**SC-4 — Pluto Live Editor:** ✅
- (a) Ribbon click opens working Pluto notebook in external browser. ✅
- (b) julia-vscode REPL stays usable alongside Pluto. ✅
- (c) Pluto process tree (server + notebook worker) fully reaped on quit. ✅

**SC-5 — Port stability:** ✅ Fixed port 41000; pre-flight reaps any stale
serve-web before binding. Two consecutive launches confirmed, no 10048 errors.

**SC-6 — No trust prompt:** ✅ Trust dialog absent on 2nd+ launch. Root cause
was dynamic port creating a new browser origin (IndexedDB partition) each
session. Fixed by fixed port.

---

## 4. Key Findings (sprint-earned, not in original SDD)

**Dynamic port breaks browser-state persistence.** Browser storage (IndexedDB,
localStorage) is origin-keyed by `http://host:port`. Each dynamic-port launch
is a new origin with no memory of prior sessions. This caused the trust dialog,
telemetry prompt, sidebar state loss, and all H1/H2 persistence symptoms.
Resolution: fixed port 41000 + pre-flight sweep.

**serve-web trust cannot be disabled via settings.** VSCode issue #210965
(as-designed): `security.workspace.trust.enabled` in any settings.json scope is
ignored under serve-web. The codium-tunnel binary has no `--disable-workspace-trust`
flag. Trust state is stored in browser IndexedDB, not on-disk settings.

**`codium serve-web` daemonizes under `codium-tunnel.exe`.** The serve-web
process tree is NOT a descendant of the spawned `cmd.exe` PID — it forks under
`codium-tunnel.exe` in a detached subtree. `taskkill /T` on the spawn PID cannot
reach it. The working teardown predicate: kill every process whose command line
matches `serve-web` AND `server-data` (unique to this app, single-instance safe).

**`cmd.exe /c` wrappers self-exit.** The initial hypothesis (SIGTERM the parent,
wait, sweep children) failed because the cmd.exe wrapper may exit immediately
after launching codium, leaving the serve-web tree reparented. The server-data
predicate-based sweep handles this correctly regardless.

**Manual PowerShell Pluto launch forms are non-deterministic.** `& julia -e
"using Pluto; Pluto.run()"` and `Start-Process` forms sometimes self-exit before
the server is ready. Node `child_process.spawn` with piped stdio and `detached:
false` is deterministic. SC-4c verified against the real spawn, not the manual
proxy.

**Antigravity mis-verified teardown tasks 3× via `taskkill /IM electron.exe`.**
This bypasses `before-quit → killServer()`. Teardown/lifecycle tasks must be
verified by John via ✕-quit + process-diff audit. Rule added to
`.antigravity/rules.md`.

---

## 5. Non-Goals (unchanged)

- Embedding Pluto in the workbench.
- Windows distribution packaging (Candidate D — Sprint 5+).
- Ribbon APPS / INSERT / VIEW completion (Candidate C — deferred).
- Lean4 or Wolfram panel integration.

---

## 6. Constraints (final)

| Dimension | Value |
|---|---|
| Server port | Fixed: 41000 |
| Pluto port | 1234 (Pluto default, auto-increments if busy) |
| Electron | 39.8.8 |
| VSCodium | 1.121.03429 |
| julia-vscode | 1.219.2 |
| Wolfram Engine | 15.0 (auto-detected by detect-deps) |

---

## 7. Risks — Residual

| Risk | Status |
|---|---|
| T2 resize flash persists | Open — KI-2 partial; setBackgroundColor not sufficient; BaseWindow/debounce timing |
| REPL delay is machine-speed-dependent | Mitigated — 2000 ms verified; readiness probe deferred Sprint 5 |
| Fixed port ghost on crash | Mitigated — pre-flight sweep (T-port-fix-B) reaps stale serve-web before bind |

---

## 8. Sprint 5 Carry-List

- **`--cli-data-dir` investigation:** codium-tunnel's `--help` shows
  `--cli-data-dir <CLI_DATA_DIR>` (env: `VSCODE_CLI_DATA_DIR`). This controls
  where CLI metadata (including possibly trust state) is stored. Passing it
  pointed at `server-data/` may make trust state persistent independently of
  port. Investigate before implementing.
- **KI-3 readiness probe:** Replace the 2000 ms bounded delay in `extension.ts`
  with a proper readiness signal from `juliaExt.exports` (Spike J, deferred).
- **T2 resize flash:** `setBackgroundColor` set on both views; flash persists.
  Likely cause: `debounce(setViewBounds, 16)` leaves a gap frame, or BaseWindow
  paints before views catch up. Investigate `resize` event + immediate
  `setViewBounds` call (no debounce).
- **Serve-web state persistence (H1/H2):** With fixed port, browser-origin state
  now persists across sessions. Run the H1/H2 discriminator: launch, dismiss
  telemetry prompt, clean ✕-quit, relaunch — does the telemetry prompt stay
  dismissed? If yes: H2 confirmed (unclean exits caused loss); fixed port +
  clean teardown resolves it. If no: H1 (structural non-persistence in serve-web)
  — deeper investigation needed.
- **Windows packaging (Candidate D):** Gated behind clean-machine detect-deps
  spike. `settings.json` now tracked with absolute paths (C:\Users\johnx\...) —
  must be templated for distribution.
- **Wolfram 15.0:** Auto-detected correctly by detect-deps. No action needed.
- **Ribbon APPS/INSERT/VIEW (Candidate C):** APPS = Julia package browser or
  extension marketplace; INSERT = snippet menu; VIEW = layout picker. Design
  needed before implementation.
