# tasks.md — Sprint 9

**Note on numbering:** SDD-plot-builder.md §4 sketched 9 tasks covering only
the Plot Builder core. SPRINT9-HANDOFF.md's sketch adds the two secondary
goals (activity bar launchers, KI-8) as independent tasks and a final
regression/tag task, for 11 total. This file uses the handoff's fuller
numbering as canonical.

---

## Task 001: Spike — variable discovery via terminal shell integration
**Status:** [ ] Pending
**Milestone:** M1 (Foundation)
**Depends on:** —

### What to do
Add a temporary diagnostic command `julialab.spikeVarDiscovery` to
`extension.ts` that tests whether the extension host can capture Julia
REPL output using VS Code's Terminal Shell Integration API
(`terminal.shellIntegration.executeCommand(...).read()`), which is the
leading candidate approach — **Unverified** whether julia-vscode's REPL
terminal has shell integration enabled; this task exists to find out. If
shell integration is unavailable or unreadable, this task's output will
show that clearly, and DESIGN §4.5's file-based fallback becomes the
implementation path instead.

### Files touched
- `extensions/julialab/src/extension.ts` — add temporary spike command
  (to be removed or promoted to `getWorkspaceVars()` after this task closes)

### Acceptance Criterion
John defines at least 2 variables of different types in the Julia REPL
(e.g. `x = 1.0`, `y = "hello"`), runs `julialab.spikeVarDiscovery` from the
command palette, and inspects the `fs.writeFileSync` probe output file.
**Binary pass:** probe file contains both variable names and types,
correctly captured. **Binary fail:** probe file is empty, errors, or
missing — triggers fallback design, not a retry loop.

### On Failure
Report the exact probe file contents (or absence) verbatim to this
thread. Do not attempt the file-based fallback as a fix — that's a
separate design path requiring its own task, written after this result
is confirmed.

---

## Task 002: ADR-024 — WS bridge argument passing
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** Task 001 (confirmed, either outcome)

### What to do
Implement ADR-024: extend the WS dispatch handler in `extension.ts` to
destructure `args` from incoming messages (default `[]`) and spread them
into `executeCommand`.

### Files touched
- `extensions/julialab/src/extension.ts` — WS message dispatch handler

### Acceptance Criterion
Per TEST_PLAN-sprint9.md S9-002: an existing Sprint 8 button (e.g. Undo)
still works unchanged, AND a manually sent WS message with non-empty
`args` results in the extra arguments reaching `executeCommand` (confirmed
via `fs.writeFileSync` probe).

### On Failure
Revert to last verified commit. Report exact probe output and which half
(backward-compat or new-args) failed.

---

## Task 003: `julialab.openPlotBuilder` command + webview panel
**Status:** [ ] Pending
**Milestone:** M2 (Plot Builder core)
**Depends on:** Task 002

### What to do
Register `julialab.openPlotBuilder` per DESIGN §4.2–4.3: creates/reveals a
webview panel, calls `getWorkspaceVars()` (implementation now fixed per
Task 001's result), posts the `init` message.

### Files touched
- `extensions/julialab/src/extension.ts` — command registration, panel
  lifecycle functions

### Acceptance Criterion
Per TEST_PLAN S9-003: clicking Plot (once S9-006 dispatch exists — see
note) opens exactly one "Plot Builder" panel; repeated clicks reveal
rather than duplicate. **Interim verification for this task alone**
(before S9-006 exists): trigger via command palette instead of ribbon.

### On Failure
Revert. Report whether panel opened at all, duplicated, or errored.

---

## Task 004: `plot-builder.html` webview UI
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** Task 003

### What to do
Create `plot-builder.html` per DESIGN §3, §4.4 — dropdowns, config
summary, Run button, and **CSP meta tag + nonce'd script tag** (DESIGN
§4.4 — this is the part most likely to be silently skipped).

### Files touched
- `extensions/julialab/src/plot-builder.html` — new file

### Acceptance Criterion
Panel renders dropdowns and Run button. Per DESIGN §4.4's explicit flag:
this task is not complete on "HTML renders" alone — proceed to Task 005
before declaring this done, since CSP correctness can only be confirmed
once the script actually needs to execute.

### On Failure
Report rendered HTML state and any visible layout issues.

---

## Task 005: Code generation + webview messaging
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** Task 004

### What to do
Create `plot-builder.js` implementing `generatePlotCode()` /
`buildCallArgs()` per DESIGN §5.1 (including the StatsPlots preamble,
corrected theme-as-statement handling, and Q4/Q5 dropdown visibility
logic), and the `postMessage('runPlot', ...)` call to the extension host.

### Files touched
- `extensions/julialab/src/plot-builder.js` — new file

### Acceptance Criterion
Per TEST_PLAN S9-005 table: for each of the 8 listed plot-type/option
combinations, the code visible in the terminal panel (once S9-007 wires
execution) matches the expected shape exactly. **Interim verification for
this task alone:** log generated code string via the CSP-approved script
(e.g. temporarily render it into the DOM) before REPL execution exists.

### On Failure
Report the mismatched row(s) from the S9-005 table with actual vs.
expected code strings.

---

## Task 006: `renderer.js` — `plot-builder` dispatch branch
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** Task 002

### What to do
Add the `plot-builder` dispatch branch per DESIGN §4.1 — sends
`window.plotConfig` as `args[0]` on `julialab.openPlotBuilder`.

### Files touched
- `renderer.js` — dispatch branch addition

### Acceptance Criterion
Per TEST_PLAN S9-006: clicking the ribbon Plot button (not command
palette) opens the panel, and the plotConfig summary in the webview
matches the ribbon's highlighted STYLE/AXES buttons at time of click.

### On Failure
Revert. Report whether the WS message was sent at all (check via
existing WS logging/probe) and what payload it carried if so.

---

## Task 007: REPL execution via ADR-024
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** Task 002, Task 005

### What to do
Implement `handlePlotBuilderMessage` per DESIGN §4.3 — receives
`runPlot`, executes the code via `language-julia.executeJuliaCodeInREPL`.

### Files touched
- `extensions/julialab/src/extension.ts` — panel message handler

### Acceptance Criterion
Per TEST_PLAN S9-007: clicking Run in the webview (scatter plot,
simplest case) causes the code to appear/execute in the REPL terminal and
a plot to render in the julia-vscode plot pane.

### On Failure
Report terminal output verbatim, including any Julia error text.

---

## Task 008: Full integration test
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** Task 003–007, all green

### What to do
No code change — John runs the full manual flow per TEST_PLAN S9-008 for
3 plot types: scatter, histogram, boxplot.

### Files touched
- None (verification only)

### Acceptance Criterion
All 3 flows succeed per TEST_PLAN S9-008 binary criteria.

### On Failure
Report which of the 3 flows failed and at which step (ribbon selection,
panel open, variable selection, Run click, REPL execution, plot render).

---

## Task 009: Activity bar launchers (Pluto, Lean, Wolfram, Claude)
**Status:** [ ] Pending
**Milestone:** M3 (Secondary — independent of M2)
**Depends on:** —

### What to do
**Not yet designed.** SPRINT9-HANDOFF.md lists this as a secondary goal
via `contributes.viewsContainers` in `extension.ts`'s package.json, but no
SDD or DESIGN section covers it. Per eurAIka phase gating, this needs at
minimum a short DESIGN addendum before a task instruction is written —
flagging here rather than skipping silently. Do not generate an
Antigravity instruction for this task until that's done.

### Files touched
- TBD

### Acceptance Criterion
TBD — pending design.

### On Failure
N/A — task not yet ready to execute.

---

## Task 010: KI-8 — dirty file indicator investigation
**Status:** [ ] Pending
**Milestone:** M3 (Secondary — independent of M2)
**Depends on:** —

### What to do
**Not yet designed** — same gap as Task 009. This is listed as an
"investigation," which suggests it may itself need a small spike before a
fix task can be written (root cause unknown — is it a julia-vscode
extension setting, a VSCodium built-in indicator not enabled, or something
JuliaLabApp's ribbon obscures?). Flagging rather than guessing.

### Files touched
- TBD

### Acceptance Criterion
TBD — pending investigation.

### On Failure
N/A — task not yet ready to execute.

---

## Task 011: Regression + tag `sprint9-complete`
**Status:** [ ] Pending
**Milestone:** M4 (Close)
**Depends on:** Task 008 green (M2); M3 tasks green or explicitly deferred
to a future sprint by John's decision

### What to do
Full regression pass per TEST_PLAN S9-009 against the Sprint 8 feature
table, plus teardown verification. John tags and pushes
`sprint9-complete` only after both pass.

### Files touched
- None (verification + git tag)

### Acceptance Criterion
Sprint 8 feature table fully ✓. Teardown clean (no orphaned processes).
Tag pushed to `origin/main`.

### On Failure
Report which regression row failed or which process remained after
teardown. No fix-attempt loop — diagnose in this thread first.
