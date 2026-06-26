# Test Plan
**Project:** JuliaLabApp — Sprint 1
**Date:** 2026-06-22

---

## Test Types

| Type | Tool | Coverage Target | Who Runs It |
|---|---|---|---|
| Spike / feasibility | Manual + console inspection | Binary pass/fail on 4 spike criteria | John, Task 001 |
| Visual acceptance | Manual inspection against Matlab1–5.png | All 5 SC criteria | John, final task of milestone |
| Smoke | Manual: launch → interact → close | No crash, no orphan process | John, every task |
| Unit | None in Sprint 1 | Deferred to Sprint 2 | — |
| Automated E2E | None in Sprint 1 | Deferred to Sprint 2 | — |

Sprint 1 is validated entirely by manual acceptance criteria. Automated
tests are introduced in Sprint 2 once the architecture is locked.

---

## Spike Acceptance Criteria (Task 001)

Task 001 passes if and only if ALL of the following are true:

| SC | Criterion |
|---|---|
| SPIKE-1 | `openvscode-server` binary (matching VSCodium 1.121.03429) is available and runs on the dev machine |
| SPIKE-2 | Navigating to `http://127.0.0.1:PORT` in an Electron `WebContentsView` loads the full VSCodium workbench (file tree, editor, terminal visible) |
| SPIKE-3 | Running `julia -e 'println("hello")'` in the integrated terminal produces output; terminal echo is subjectively imperceptible during 10 consecutive commands |
| SPIKE-4 | Chrome suppression settings (`titleBarStyle: custom`, `menuBarVisibility: hidden`, `activityBar.visible: false`) take effect in the WebContentsView context |

If ANY spike criterion fails, Task 001 reports FAIL with the specific
failing criterion, the error observed, and the console output. Do not
proceed to Task 002. Escalate to the Claude Projects planning thread.

---

## Sprint 1 Acceptance Criteria (final milestone gate)

Evaluated after the last implementation task. All five must pass:

| SC | Criterion | Pass definition |
|---|---|---|
| SC-1 | Single header | No VSCodium title bar, menu bar, or activity bar visible at any window size |
| SC-2 | VSCodium functional | File open dialog works; editor opens a file; integrated terminal is present and accepts input |
| SC-3 | Terminal latency | 10 consecutive Julia commands typed at normal speed; no command lags behind input by a visible frame |
| SC-4 | Window controls | Minimise → taskbar; Maximise → full screen then restore; Close → window gone, Task Manager shows no orphan `node` or `openvscode-server` process |
| SC-5 | Resize alignment | Drag window to 3 different sizes; ribbon and workbench remain flush with no gap, no overlap, no blank strip |

---

## Definition of Pass (Sprint 1)

All five SC criteria green on a cold launch (app not previously running).
Verified on the development machine (Windows 10 x64) with VSCodium
1.121.03429 installed.

---

## Failure Protocol

If any acceptance criterion fails during a task:

1. Antigravity reports: `FAIL: [SC-N] — [exact observed behaviour] — [steps to reproduce]`
2. Do NOT attempt a fix in the same session.
3. Revert the last change (`git revert HEAD --no-edit`).
4. Report back to the Claude Projects planning thread with the failure report.
5. A new task will be written after root cause is diagnosed here.

No iterative fix-attempt loops. Revert and escalate.
