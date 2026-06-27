# Software Description Document — Sprint 5
**Project:** JuliaLabApp — investigation + hardening
**Version:** 0.1
**Date:** 2026-06-27
**Author:** John Peach / eurAIka
**Repo:** `C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp`
**Prior sprint:** `sprint4-complete`
**Docs:** `JuliaLabApp\docs\Sprint 5\`

---

## 1. Purpose

Sprint 5 is an investigation and hardening sprint. No new user-facing features are
added. Three open questions from Sprint 4 are resolved via directed spikes (A, B,
J); two persistent known issues are fixed (KI-2 resize flash, KI-3 REPL start
delay); and the GitHub remote is configured (KI-5).

The ribbon redesign (MATLAB-style grouped buttons) and Windows packaging are
explicitly deferred to Sprint 6.

---

## 2. What This Sprint Delivers

| ID | Deliverable | Type | Success Criterion |
|---|---|---|---|
| Spike A | `--cli-data-dir` behavior characterized | Investigation | SC-3 |
| Spike B | H1/H2 telemetry persistence discriminated | Investigation | SC-4 |
| Spike J | `juliaExt.exports` API surface documented | Investigation | SC-2 (gates T-KI3) |
| KI-2 | Resize black flash eliminated or root-cause documented | Fix | SC-1 |
| KI-3 | REPL start delay replaced with probe, or closed as infeasible | Fix/Close | SC-2 |
| KI-5 | GitHub remote configured | Chore | SC-5 |

---

## 3. Explicitly Deferred

- **Ribbon redesign** — MATLAB-style grouped buttons (Compute42 reference version
  available); Sprint 6.
- **INSERT / APPS / VIEW tab wiring** — Sprint 6.
- **Windows distribution packaging** — gated behind detect-deps absolute-path fix;
  Sprint 6 or later.
- **Pluto restart UI** — no mid-session stop/restart; Sprint 6+.

---

## 4. Success Criteria

**SC-1 — KI-2 resolved:** Drag-resize the JuliaLab window rapidly ten times in
succession. No black flash is visible between the ribbon pane and the workbench
pane at any point. *(Visual pass/fail by John.)*

If flash persists after debounce removal, SC-1 is marked partial (⚠️) with a
root-cause note in ADR-018; the task is not re-attempted within Sprint 5.

**SC-2 — KI-3 resolved or closed:** Either:
- (a) The 2000 ms hard-coded delay is removed from `extension.ts` and the REPL
  starts reliably without it (verified by 3 consecutive cold launches, no
  crash-reporter dialog), **or**
- (b) KI-3 is documented as permanently infeasible in ADR-019 with rationale,
  and the delay remains.

Binary: the 2000 ms `setTimeout` in `extension.ts::activate()` is either gone
or there is an accepted ADR-019 explaining why it must stay.

**SC-3 — Spike A documented:** ADR-017 records: (i) whether a `state.vscdb` or
other trust-state file appears in `server-data/` when `--cli-data-dir` is passed,
and (ii) the decision to adopt or permanently reject the flag.

**SC-4 — Spike B documented:** H1 vs H2 is discriminated. A written finding
records: H2 = the julia-vscode telemetry notification stays dismissed across
clean quit/relaunch cycles; or H1 = it does not. Next action is recorded.

**SC-5 — KI-5 resolved:** `git remote -v` from the project root shows `origin`
pointing to the correct GitHub URL. `git push --dry-run origin main` exits 0.

---

## 5. Non-Goals (this sprint)

- No new ribbon tabs (INSERT, APPS, VIEW)
- No ribbon visual redesign
- No Windows installer / electron-builder packaging
- No additional serve-web spawn flags beyond the spike-A probe
- No Pluto multi-notebook or restart UI

---

## 6. Spike Methodology (Sprint 5)

Antigravity runs investigation tasks (code changes, file reads, script output) in
Ask mode. John executes any required manual UI steps (launch, click, observe) and
reports results back to this planning thread. If Antigravity's reported result
appears inconsistent with John's observation, the spike reverts to fully manual
execution.

Every spike modification to source files (main.js, extension.ts) is followed by
an explicit revert task. Spike modifications are never committed.

---

## 7. Key Files

| File | Role this sprint |
|---|---|
| `main.js` | Spike A (temp `--cli-data-dir` flag); KI-2 (resize handler) |
| `extensions/julialab/src/extension.ts` | Spike J (temp exports log + rebuild); KI-3 (delay replacement or rationale) |
| `server-data/data/User/globalStorage/julialang.language-julia/` | Spike B (pre/post file inspection) |
| `docs/Sprint 5/ADR-017-*.md` | `--cli-data-dir` decision record |
| `docs/Sprint 5/ADR-018-*.md` | Resize debounce removal decision record |
| `docs/Sprint 5/ADR-019-*.md` | REPL readiness probe decision record |
| `.antigravity/rules.md` | Standing verification rules (append new rules as earned) |

---

## 8. Architecture Notes

### Spike A — `--cli-data-dir`
`codium serve-web --cli-data-dir <DIR>` (env `VSCODE_CLI_DATA_DIR`) controls
where CLI metadata is stored. The question is whether this includes the workspace
trust `state.vscdb`, which would persist trust on disk independently of the
browser's IndexedDB origin. Investigation adds the flag temporarily, launches,
performs a trust click, quits, relaunches, then inspects `server-data/` for new
files. If a `state.vscdb` appears and trust persists, the flag may be worth
adopting permanently — decoupling trust from port choice.

### Spike B — H1/H2 discriminator
The julia-vscode telemetry notification fires once per browser origin. With the
dynamic port era (Sprint 1–3), a new origin each session meant the notification
re-fired every launch. With fixed port 41000 (Sprint 4), the origin is stable and
the notification's IndexedDB dismissal record should persist. Spike B tests this:
dismiss → clean-quit → relaunch → observe. Result H2 (persists) closes the issue
implicitly; result H1 (does not persist) indicates structural non-persistence in
serve-web's storage layer for this notification type.

Note: `server-data/data/User/globalStorage/julialang.language-julia/` currently
contains only `lsdepot/` and `symbolstorev6/`. No telemetry-state file is
visible. The dismissal state is therefore stored in the browser-side IndexedDB
(Electron userData, keyed to `http://127.0.0.1:41000`) rather than on disk in
server-data. This is consistent with H2 being likely — but the discriminator test
is the confirmation.

### Spike J — juliaExt.exports
The julia-vscode extension (v1.219.2) ships as a minified bundle
(`dist/extension.js`) with no readable exports. Static analysis is infeasible.
The spike adds a single `console.log(Object.keys(juliaExt?.exports ?? {}))` to
`extension.ts::activate()` after `await ensureJuliaExtension()`, rebuilds, and
captures the console output. This reveals at runtime what the extension surfaces.
If the exports include a ready Promise or event targeting language-server init,
T-KI3 replaces the delay. Otherwise, KI-3 is closed as infeasible.

Note: `juliaExt.activate()` is already awaited in `ensureJuliaExtension()`.
`juliaExt.isActive` becomes `true` immediately; it is not a readiness signal for
the language server's async init. The probe must target the exports object, not
`isActive`.

### KI-2 — Resize flash
Current code: `state.win.on('resize', debounce(setViewBounds, 16))`. The 16 ms
debounce creates a frame gap where the BaseWindow background (`#1e1e1e`) is
visible before the views catch up. Removing the debounce and calling
`setViewBounds` synchronously on every resize event should close the gap. If the
flash persists, the root cause is a BaseWindow-level repaint cycle that cannot be
fixed at the application layer without Electron-internal hooks.

### KI-3 — REPL readiness probe
`await juliaExt.activate()` resolves when the extension host activates; it does
not await the Julia language server's async init. `isActive` becomes true at the
same point — it is a no-op as a readiness signal. The proper fix is to await a
signal from `juliaExt.exports`. If no such signal exists, the 2000 ms delay is
the best available option and KI-3 is closed permanently with that rationale.

### KI-5 — GitHub remote
The repo has a clean `main` branch and all sprint tags (`sprint1-complete` through
`sprint4-complete`) but no remote. John must create the GitHub repo before T-KI5
executes. The task is: `git remote add origin <URL>` then
`git push --set-upstream origin main` then `git push --tags`.

---

## 9. Sprint 5 Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Spike J finds no exports API (KI-3 infeasible) | High | Low | SC-2(b) path; document rationale; delay stays |
| KI-2 flash persists after debounce removal | Medium | Low | Root cause documented in ADR-018; defer to Sprint 6 |
| Spike A finds `--cli-data-dir` changes nothing | Medium | Low | ADR-017 records rejection; no adoption |
| GitHub repo not created before T-KI5 | High | Low | John prerequisite; task gated on confirmation |
| Spike B UI step not automatable by Antigravity | Certain | None | John performs click; Antigravity does pre/post file diff |
| Spike A `state.vscdb` file not created | Medium | Low | ADR-017 records finding; spike concludes |

---

## 10. Carry-Forward Rules for Sprint 6

Items not resolved in Sprint 5 join the Sprint 6 candidate list:
- KI-2 (if flash persists after debounce removal) — root cause investigation
- KI-3 (if Spike J confirms infeasible) — closed, no carry
- Spike A result → ADR-017 decision feeds Sprint 6 if adoption is warranted
- Ribbon redesign — committed to Sprint 6 scope
