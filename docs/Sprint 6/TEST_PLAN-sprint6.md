# Test Plan — Sprint 6

**Project:** JuliaLabApp
**Sprint:** 6 — MATLAB-style ribbon redesign
**Version:** 0.1
**Date:** 2026-06-27
**Author:** John Peach / eurAIka
**Decisions in force:** ADR-020, ADR-021, ADR-022

---

## 1. Test Strategy

Sprint 6 changes are Electron UI (HTML/CSS/JS) and a single TypeScript edit
(`extension.ts`). There is no back-end logic, no data model, and no algorithm
that warrants a unit or integration test harness. The appropriate test type
is **structured manual acceptance tests** with binary pass/fail criteria,
run by John after each milestone commit.

Automated testing is explicitly out of scope for this sprint. The correct
gate for each task is the acceptance criterion in `tasks.md`, not a test
runner. Introducing Jest or a Playwright harness for a UI restyle sprint
would add infrastructure cost with no testing benefit over visual + console
verification.

---

## 2. Test Types

| Type | Method | Tool | Who Runs It |
|---|---|---|---|
| Acceptance (visual) | Launch app, observe DOM/layout | `npm run start:fast` + DevTools | John |
| Acceptance (functional) | Click button, observe workbench response | App UI | John |
| Regression (teardown) | ✕-quit + process-diff audit | PowerShell `Get-CimInstance` | John |
| Static (dispatch safety) | Read `extension.ts` prefix-allowlist diff | `git diff` in Antigravity Ask mode | John (diff review) |
| Build smoke | `npm run build:ext` exits 0 | Terminal | Antigravity (reported) |

---

## 3. Milestone Structure

Tests are grouped by milestone, matching the task sequence in `tasks.md`.
A milestone is green only when **all** tests in it pass.

| Milestone | Scope | Gate |
|---|---|---|
| M1 — Foundation | Spike revert, icon extraction, ADR-020 extension edit | Build smoke + static diff review |
| M2 — Strip & height | Tab strip markup + RIBBON_HEIGHT SSOT | Visual: strip renders correctly, workbench aligns |
| M3 — HOME body | FILE / CODE / VARIABLES / NAVIGATE groups with icons | Visual: groups, labels, icons correct |
| M4 — Placeholder bodies | EDIT / PLOTS / APPS / VIEW / PLUTO / LEAN / WOLFRAM | Visual: each body renders; tab switch works |
| M5 — Live buttons | PLOTS Show Plot Pane + PLUTO Launch Pluto wired | Functional: commands execute |
| M6 — Regression | Full teardown + drag + resize + all S5 green states | Teardown audit; prior sprint criteria hold |

---

## 4. Test Cases

### M1 — Foundation

**T-101: Spike revert clean**
- Run: `git status`
- Pass: no modified files listed; `index.html` unchanged from `sprint5-complete`

**T-102: Icon assets present**
- Run: `dir assets\icons\` (or equivalent)
- Pass: all 15 SVG files from `docs/Compute42 images/icons/` present under
  `assets/icons/`; `JuliaLab-icon.svg` present

**T-103: ADR-020 prefix-allowlist builds**
- Run: `npm run build:ext`
- Pass: exits 0; no TypeScript errors in terminal
- Verify: `git diff extensions/julialab/src/extension.ts` shows `RIBBON_COMMANDS`
  map replaced by prefix-check logic; no other logic removed

**T-104: ADR-020 prefix-allowlist rejects unknown prefix (static)**
- Read the diff from T-103
- Pass: the bridge handler contains an explicit guard that rejects any command id
  that does not start with `julialab.`, `workbench.action.`, `editor.action.`,
  or `language-julia.`; the guard is a positive check, not a blacklist

---

### M2 — Strip & Height

**T-201: Tab strip renders**
- Run: `npm run start:fast`
- Pass: ribbon strip is `#00589C` blue; all 8 tabs visible —
  HOME · EDIT · PLOTS · APPS · VIEW · PLUTO · LEAN · WOLFRAM — left to right;
  no tab is truncated or wrapped

**T-202: All tab labels are white**
- Pass: all tab labels render in `#FFFFFF`; no tab has gray, dark, or
  semi-transparent text (confirm in DevTools computed style if in doubt)

**T-203: Active tab highlighted**
- Pass: HOME tab (default active) shows a white 2 px bottom border and slightly
  lighter panel background; inactive tabs do not

**T-204: Window controls present and positioned**
- Pass: minimize (−), maximize (□), close (×) buttons are right-aligned on the
  strip; clicking × initiates `before-quit` (app begins to close)

**T-205: Workbench aligns to ribbon — no gap, no overlap**
- Pass: the VSCodium workbench top edge is flush with the ribbon body bottom
  edge; no blue strip bleeds into the workbench; no white gap between them.
  Verify at both default window size and after maximising.

**T-206: RIBBON_HEIGHT single source confirmed (static)**
- Read `main.js` diff
- Pass: exactly one constant (`RIBBON_HEIGHT`) controls ribbon height; it is
  used in `setViewBounds()`; `--ribbon-height` CSS variable is injected from
  this constant via `insertCSS`; no second hard-coded `52` (or any other height
  literal) survives in `main.js` or `ribbon.css`

---

### M3 — HOME Body

**T-301: JuliaLab icon tile renders at left end**
- Pass: the JuliaLab icon (`JuliaLab-icon.svg`) appears at the far left of the
  ribbon body, visually separated from the FILE group by a `#DCDCDC` vertical
  divider; icon is not stretched or clipped

**T-302: HOME group structure correct**
- Pass: four groups are visible in order — FILE, CODE, VARIABLES, NAVIGATE —
  each with its label centred below the buttons in `#8A8A8A` uppercase text;
  `#DCDCDC` vertical separators between groups

**T-303: FILE group icons render from local assets**
- Pass: New Script (large), New, Open, Go to File, Find Files all display their
  icons from `assets/icons/`; no broken-image placeholder; icons match the
  designs in `docs/Compute42 images/icons/`

**T-304: CODE group icons render**
- Pass: Run Section (large), Format Code, Run File icons all render correctly

**T-305: VARIABLES group icons render**
- Pass: Clear Workspace, Workspace, Packages icons all render; four-color
  Workspace squares appear correctly

**T-306: NAVIGATE group icons render**
- Pass: Find, Find Files, Undo, Redo icons all render correctly

**T-307: Body height matches strip — no scroll, no clip**
- Pass: ribbon body does not show a scrollbar; no button is clipped at the
  bottom; body height is visually ~94 px (strip 30 + body 94 = 124 total);
  `document.querySelector('.ribbon-body').offsetHeight` in DevTools returns
  a value between 90 and 98

**T-308: Button hover states active**
- Pass: hovering any HOME button produces a visible highlight (blue tint
  background and/or border); no button stays permanently highlighted

---

### M4 — Placeholder Bodies

**T-401: Tab switching works for all 8 tabs**
- For each tab in HOME · EDIT · PLOTS · APPS · VIEW · PLUTO · LEAN · WOLFRAM:
  - Click the tab
  - Pass: that tab becomes visually active (white bottom border); its body
    `<div>` becomes visible; the previously active body is hidden; the
    workbench view does not shift or resize

**T-402: Active tab state is exclusive**
- Pass: after clicking any tab, exactly one tab has the active highlight;
  no two tabs are simultaneously active

**T-403: Placeholder bodies contain group scaffolding**
- Click EDIT, APPS, VIEW, LEAN, WOLFRAM in turn
- Pass: each body shows at least one visible group label (even if buttons are
  greyed out / disabled); no body is blank white; no JavaScript error appears
  in DevTools console

**T-404: PLUTO body renders Launch Pluto button**
- Click PLUTO tab
- Pass: a "Launch Pluto" button is visible with the notebook icon; it is not
  disabled; no other buttons in the PLUTO body are wired (they may be present
  as disabled placeholders)

**T-405: PLOTS body renders Show Plot Pane button**
- Click PLOTS tab
- Pass: a "Show Plot Pane" button is visible; it is not disabled

---

### M5 — Live Buttons

**T-501: PLOTS — Show Plot Pane fires**
- Pre-condition: a Julia file is open in the workbench; julia-vscode is active
- Click PLOTS tab → click Show Plot Pane
- Pass: the julia-vscode plot pane opens or comes to focus in the workbench;
  no error dialog appears

**T-502: HOME — focusEditor fires (regression)**
- Click HOME tab (triggers `julialab.focusEditor` on body activation)
- Pass: the editor panel in the workbench receives focus (cursor visible in
  editor); no error in DevTools console

**T-503: PLUTO — Launch Pluto fires**
- Click PLUTO tab → click Launch Pluto
- Pass: Pluto server process spawns; browser tab opens to Pluto UI (or the
  existing Pluto launch behaviour from Sprint 4 completes successfully);
  PID appears in `state.childPids` (verify via ✕-quit process-diff audit)

**T-504: ADR-020 — unknown-prefix command is silently dropped**
- Open DevTools → Console
- Manually dispatch a command with an unknown prefix via the DevTools console:
  `window.electronAPI.ribbonCommand('evil.takeOver')`
- Pass: no error dialog; workbench is unchanged; the extension host log
  (written via `fs.writeFileSync` probe if needed) shows the command was
  rejected by the prefix check; no VSCodium command was executed

**T-505: ADR-020 — allowed-prefix command is forwarded (regression)**
- Verify `julialab.showPlots` still works after the ADR-020 extension change
- Same procedure as T-501 but via the existing PLOTS dispatch path
- Pass: plot pane opens; proves the prefix allowlist did not break the
  existing `julialab.*` dispatch

---

### M6 — Regression

**T-601: Teardown — ✕-quit cleans all processes (John-verified)**
- Take `$before` snapshot: `Get-CimInstance Win32_Process | Where-Object {$_.Name -match 'node|electron|codium'} | Select-Object ProcessId,CommandLine`
- Launch app: `npm start`
- Take `$running` snapshot (same command)
- Quit via window ✕ control only (never `taskkill`)
- Wait 5 seconds
- Take `$after` snapshot
- Pass: every PID in `$running` that was not in `$before` is absent from
  `$after`; no orphaned `codium-tunnel`, `node`, or `electron` process remains.
  John verifies and reports result here; Antigravity does not declare this test.

**T-602: Window drag region preserved**
- Pass: clicking and dragging the blue tab strip (between tabs) moves the
  window; dragging a tab does not move the window (tab area is `no-drag`)

**T-603: Minimize / Maximize / Restore**
- Pass: minimize hides window to taskbar; maximize fills screen; restore
  returns to previous size; ribbon + workbench alignment holds at all sizes
  (re-run T-205 after maximise/restore)

**T-604: Resize — workbench stays flush**
- Drag window to a narrow width and back
- Pass: workbench view does not overlap or gap-separate from the ribbon at
  any intermediate size; KI-2 flash may appear (cosmetic, not a failure)

**T-605: No new console errors at startup**
- Open DevTools immediately after `npm start`
- Pass: Console shows no new red errors that were not present at
  `sprint5-complete`; existing known warnings (H2 telemetry, trust dialog)
  are not regressions

**T-606: Sprint 5 acceptance criteria still green**
- Re-run the Sprint 5 binary pass/fail criteria for REPL auto-start and
  Pluto launch (from `docs/Sprint 5/TEST_PLAN-sprint5.md`)
- Pass: all Sprint 5 criteria that were green at `sprint5-complete` are
  still green

---

## 5. Definition of Pass — Sprint 6

Sprint 6 is **green** when and only when:

1. All T-1xx tests pass (M1 — foundation and build)
2. All T-2xx tests pass (M2 — strip and height)
3. All T-3xx tests pass (M3 — HOME body with icons)
4. All T-4xx tests pass (M4 — tab switching and placeholder bodies)
5. All T-5xx tests pass (M5 — live buttons wired)
6. All T-6xx tests pass (M6 — regression)
7. `npm run build:ext` exits 0 with no TypeScript errors
8. `git log --oneline` shows a commit tagged `sprint6-complete`
9. Tag is pushed to `origin/main`

A partial green (some milestones passing, others not) is **not** sprint
completion. Each milestone is a commit gate; work does not advance to the
next milestone until all tests in the current one pass.

---

## 6. Failure Protocol

When a test fails:

1. **Antigravity stops** — does not attempt a fix; does not run the next step.
2. **Reports verbatim** the acceptance criterion that failed, the observed
   output, and any console error text.
3. **Escalates here** (this planning thread) with the failure report pasted in.
4. **No patch commits** — the file is reverted (`git checkout -- <file>`) and
   the failure is diagnosed in this thread before a corrected task is written.

Antigravity never declares T-601 (teardown) passed. John runs it and reports
the result.

---

## 7. Out of Scope

- Automated unit tests (Jest, Vitest, etc.) — not appropriate for a UI restyle
- Playwright or Spectron E2E harness — sprint scope does not justify setup cost
- Performance benchmarks — not a sprint 6 concern
- KI-2 resize flash root cause — cosmetic, tracked but not a sprint 6 failure
- KI-6 false crash popup — independent investigation, not a ribbon test
- Dropdown behaviour — deferred to Sprint 7 (ADR-022); no dropdown tests here
