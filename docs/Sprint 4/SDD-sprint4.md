# Software Description Document — Sprint 4
**Project:** JuliaLabApp — robustness pass + Pluto Live Editor
**Version:** 0.2  (supersedes 0.1)
**Date:** 2026-06-25
**Author:** John Peach / eurAIka
**Repo:** `C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp`
**Prior sprint:** `sprint3-complete` (28c141b)

## Changelog 0.1 → 0.2
- **T-port (dynamic server port) added and DELIVERED** mid-planning — ADR-015.
  Hardcoded port 3456 caused repeated `os error 10048` launch failures from
  orphaned and winnat-ghosted sockets. Now resolved.
- **T1b (startup port pre-flight) removed** — superseded by ADR-015. A free-port
  finder makes reclaim-by-PID unnecessary.
- **SC-1 revised** to include `julia.exe` and scope to the spawned process tree.
- **SC-2 reclassified as already-satisfied** — Spike E showed the workspace panel
  persists across launches via VSCodium's own behaviour. T5 demoted to a
  verification checkpoint.
- **KI-6 (workspace-trust dialog every launch) added** — new task T-trust.
- **Spike B resolved PASS-qualified**; SC-4c deferred to T7 implementation.
- **Spike J skipped**; T4 ships as a documented bounded delay.
- **Serve-web state-persistence anomaly** flagged for Sprint 5 (H1/H2, §8).

---

## 1. Purpose

Sprint 3 delivered a self-configuring, MATLAB-familiar JuliaLab workbench.
Sprint 4 hardens launch and teardown, removes startup friction, and promotes the
Pluto Live Editor from spike to shipped feature.

The robustness gaps: (1) quitting leaks orphaned `node.exe`/`julia.exe` children
of the codium server; (2) a hardcoded server port produced relaunch-blocking
`10048` failures; (3) julia-vscode's crash reporter fires on cold launch from an
unguarded REPL-start race; (4) the workspace-trust dialog interrupts every launch
and drops the window into Restricted Mode.

The promotion: a LIVE EDITOR ribbon button launching a Pluto.jl reactive notebook
in the system browser, as a dedicated child process — validated by Spike B.

---

## 2. Users and Use Cases

| User | Use Case | Priority |
|---|---|---|
| Scientist migrating from MATLAB | Opens JuliaLab; Workspace panel visible, no trust prompt, full (non-restricted) mode | High |
| Scientist migrating from MATLAB | Clicks LIVE EDITOR; a Pluto notebook opens in the browser while the REPL stays usable | High |
| Scientist migrating from MATLAB | Cold-launches with no crash-reporter dialog | Med |
| Developer iterating on JuliaLab | Quits and relaunches repeatedly with no orphaned processes and no port collisions | High |

---

## 3. Key Features

1. **Dynamic server port (DELIVERED).** `main.js` acquires a free OS-assigned
   port each launch; eliminates `10048` collisions and ghost-socket lockouts.
2. **Clean process-tree teardown.** `killServer()` reaps the full codium tree
   (node children + any spawned Julia) via `taskkill /T`.
3. **Race-free REPL auto-start.** A bounded delay precedes `startJuliaRepl()`,
   removing the crash-reporter race. (Readiness-probe deferred — see §8.)
4. **No workspace-trust prompt.** Trust disabled for the single-user default
   workspace; launches in full mode.
5. **LIVE EDITOR ribbon button.** Ribbon click → `main.js` spawns Pluto as a
   dedicated Julia child process that opens the browser and is reaped on quit.
6. **Cosmetic ride-alongs.** Resize black-flash fix; build-copy skip list.

---

## 4. Non-Goals

- Embedding Pluto inside the workbench (browser-external by design).
- Installing/bundling Pluto.jl — assumed user-installed; absence handled.
- Root-causing the serve-web state-persistence anomaly (Sprint 5 — §8).
- Windows distribution packaging (Candidate D — own sprint).
- Ribbon APPS / INSERT / VIEW completion (Candidate C — deferred).

---

## 5. Success Criteria

**SC-1 — Clean teardown (revised):** After a **clean quit** (window control),
zero `node.exe`, `codium.exe`, and `julia.exe` processes *descended from the
JuliaLab-spawned tree* remain, verified ~2 s post-quit. Pre-existing unrelated
processes (e.g. stale `org.julialab.ide\julia` cruft) are explicitly excluded.

**SC-2 — Persistent workspace panel (satisfied):** On 2nd+ cold launches the
Julia Workspace panel is visible without a click. **Confirmed satisfied via
Spike E**; retained as a regression check, not a code task.

**SC-3 — Race-free start:** julia-vscode's crash reporter does not appear on cold
launch across 3 consecutive launches.

**SC-4 — Pluto Live Editor (PASS-qualified):**
- (a) Ribbon click opens a working Pluto notebook in the external browser. ✅ proven (Spike B)
- (b) The julia-vscode REPL stays usable alongside Pluto. ✅ proven (Spike B)
- (c) On JuliaLab quit, the Pluto process tree (server + notebook workers) is
  fully reaped. **Deferred to T7 implementation verification** — manual launch
  forms cannot reproduce the Node-spawned process tree.

**SC-5 — Dynamic port (DELIVERED):** Two consecutive launches succeed on
OS-assigned ports with no `10048`. ✅ proven.

**SC-6 — No trust prompt:** Cold launch shows no workspace-trust dialog and no
Restricted-Mode badge; holds across a relaunch.

---

## 6. Constraints

| Dimension | Constraint |
|---|---|
| Language | TypeScript (extension); JavaScript (Electron main) |
| Platform | Windows 10 x64; serve-web context |
| Electron / VSCodium / julia-vscode | 39.8.8 / 1.121.03429 / 1.219.2 (pinned) |
| Pluto launch | Dedicated child process from `main.js` (ADR-013); never in the REPL |
| Pluto spawn form | Node `child_process.spawn` with piped stdio — NOT PowerShell `-e`, which is non-deterministic (Spike B finding) |
| detect-deps | Merges into settings.json; `security.workspace.trust.enabled` is preserved (not in its managed key set) |
| Discipline | One file per atomic task; diff review before build; commit per verified state; revert (not patch) on failure |
| Appetite | Medium; promotion + KI-6 place the count at the upper edge (~10 tasks incl. Pluto) |

---

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `taskkill /F /T` leaves VSCodium SQLite dirty | Med | Med | SIGTERM → grace wait → `/T` sweep (ADR-012) |
| Pluto worker processes orphan if `/T` misses them | Med | Med | T7 verification opens a notebook then quits; if workers survive, enumerate worker PIDs |
| Non-deterministic `-e` Pluto launch | Confirmed | Med | T7 uses Node spawn with piped stdout; treat launched only on the `localhost:1234` ready line; error dialog if the child exits first |
| Free-port race (port freed then re-bound) | Low | Low | Spawn immediately after `srv.close()`; localhost single-user (ADR-015) |
| Disabling trust removes a security boundary | Low | Low | Acceptable for single-user IDE on a trusted-by-construction default folder (ADR-016) |
| Bounded REPL delay too short on a slow machine | Low | Low | Tunable constant; readiness-probe noted for Sprint 5 |

---

## 8. Open Investigations (Sprint 5 candidates)

**Serve-web state-persistence anomaly.** Forensics of `server-data/data/User`
found no top-level `globalStorage/state.vscdb` and several empty
`workspaceStorage` dirs, correlating with the every-launch trust prompt. Two
competing hypotheses, unresolved:
- **H1 (structural):** serve-web does not persist global state in this config;
  the persistence gap is real and broad.
- **H2 (shutdown-induced):** global state flushes only on clean shutdown, and
  this session's force-kills prevented it; **KI-1 clean teardown may fix it
  incidentally.**
Discriminator (run after KI-1 lands): launch → trust → clean quit → relaunch →
check whether trust persists. T-trust (disable) makes SC-6 pass under both, so
this does not block Sprint 4.

**KI-3 readiness probe.** T4 ships a bounded delay; a proper readiness signal
from `juliaExt.exports` (Spike J, deferred) is the durable fix.
