# Test Plan
**Project:** JuliaLabShell — Electron/VSCodium Chrome Proof-of-Concept
**Version:** 0.1
**Date:** 2026-06-22
**Author:** John Peach / eurAIka

---

## Test Types

| Type | Tool | Who Runs It | When |
|---|---|---|---|
| Smoke (manual) | Eyes + screenshot | John | After each task |
| Integration (manual) | Eyes + interaction | John | At milestone boundary |
| No automated tests | — | — | Out of scope for PoC |

Automated testing is explicitly out of scope. The PoC's goal is architectural
validation, not production hardening. Every acceptance criterion is manually
verifiable in under two minutes.

---

## Per-Task Smoke Test Protocol

After every Antigravity task, before confirming green:

1. Run `npm run dev` from `JuliaLabShell/`
2. Observe console output for errors
3. Verify the specific acceptance criterion stated in the task
4. If criterion passes: confirm green, commit
5. If criterion fails: do NOT patch — report back verbatim per On Failure format, revert

---

## Milestone Integration Test (run once, after all tasks pass)

This is the formal PoC pass/fail gate. All four Success Criteria from the SDD
must pass in a single uninterrupted session.

### SC-1: Single Header

**Steps:**
1. Launch `npm run dev`
2. Observe the Electron window

**Pass:** Exactly one header bar visible — the custom ribbon with tabs
HOME / PLOTS / APPS / LIVE EDITOR / INSERT / VIEW and window controls.
No VSCodium title bar visible. No VSCodium menu bar visible.

**Fail:** Any of the following are visible — VSCodium title bar, VSCodium
menu bar (File / Edit / Selection…), or a second horizontal bar of any kind.

---

### SC-2: VSCodium Functional

**Steps:**
1. In the VSCodium window, open a file (File → Open File or Ctrl+O)
2. Open the integrated terminal (Ctrl+` )
3. Confirm the Explorer file tree is visible in the left sidebar

**Pass:** File opens in editor, terminal launches and accepts input,
file tree is visible. All three in the same session.

**Fail:** Any one of the three does not work, or VSCodium window does not
appear within 10 seconds of `npm run dev`.

---

### SC-3: Window Controls

**Steps:**
1. Click the minimize button in the ribbon
2. Restore the window
3. Click the maximize button in the ribbon
4. Click maximize again to restore
5. Click the close button in the ribbon

**Pass:** Each control operates the Electron window correctly. Close
terminates both the Electron window and the VSCodium process (verify in
Task Manager — no orphaned `VSCodium.exe` process).

**Fail:** Any button does not respond, or VSCodium process remains in
Task Manager after close.

---

### SC-4: No Double Chrome

**Steps:**
1. Launch `npm run dev`
2. Take a screenshot (Win+Shift+S)
3. Switch focus to VSCodium window and back to Electron window
4. Take a second screenshot after focus cycle

**Pass:** Both screenshots show ribbon → VSCodium editor content with no
gap, no duplicate bar, no VSCodium menu visible. VSCodium window stays
positioned below the ribbon after focus cycle.

**Fail:** VSCodium menu bar appears after focus switch, or VSCodium window
drifts out of alignment with ribbon on focus cycle or resize.

---

## Definition of Pass

All four SC checks pass in a single session, documented with at least one
screenshot showing SC-1 and SC-4 simultaneously.

**PoC verdict:**
- All four pass → Option C architecture is viable → proceed to full JuliaLab rewrite planning
- Any single fail → diagnose root cause → decide whether failure is fixable within PoC scope or requires architectural revision

---

## Failure Protocol

If any task acceptance criterion is not met, Antigravity reports back:

```
TASK [NNN] FAILED
Criterion: [copy of acceptance criterion]
Observed: [exact output or description of what happened]
Console errors: [paste any relevant lines]
Action taken: none — awaiting instruction
```

Do not attempt a fix. Escalate to this chat for diagnosis before writing
a new task.
