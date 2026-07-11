# Test Plan — Sprint 9 Plot Builder
**Project:** JuliaLabApp
**Date:** 2026-07-09
**Depends on:** DESIGN-sprint9.md, ADR-024

---

## Test Types

| Type | Tool | Coverage Target | Who Runs It |
|---|---|---|---|
| Manual functional verification | John, in running app | Every acceptance criterion below | John |
| Spike verification (S9-001) | John, manual REPL/file inspection | Confirms which `getWorkspaceVars()` implementation branch to build | John |
| Teardown verification | John, PowerShell `Get-CimInstance` per existing procedure | No orphaned `codium-tunnel.exe` / `serve-web` processes after ✕-quit | John (never Antigravity — per Antigravity rules) |
| Regression | John, manual pass over Sprint 6–8 feature table | No prior functionality broken by Sprint 9 changes | John |

No automated test runner introduced this sprint — consistent with
Sprints 6–8. `generatePlotCode()`/`buildCallArgs()` are pure functions and
remain reasonable automated-test candidates for a future sprint if the
project ever adds a JS test harness; not in scope now.

---

## Definition of Pass — per task

### S9-001 (Spike): Variable discovery
**Pass:** John executes the chosen probe code in the Julia REPL with at
least 2 workspace variables of different types defined, and confirms
whether `executeJuliaCodeInREPL` output is readable by the extension host
directly, or whether the file-based fallback is required. Result reported
back to this thread verbatim (console output or file contents observed).
**This is a go/no-go gate** — DESIGN §4.5's `getWorkspaceVars()` body is
not written until this is confirmed.

### S9-002: ADR-024 WS bridge args
**Pass:** An existing Sprint 8 ribbon button (e.g. Undo, which currently
sends `{command}` with no args) still functions identically after the
change — confirms backward compatibility claimed in ADR-024. Additionally,
a manual WS message with a non-empty `args` array (e.g. sent via browser
DevTools console against `ws://localhost:2999` if accessible, or a
temporary debug button) results in `executeCommand` receiving the spread
arguments — confirmed via a `fs.writeFileSync` probe (per existing
console.log-invisibility workaround) logging `command` and `args` on
receipt.

### S9-003: `julialab.openPlotBuilder` + webview panel
**Pass:** Clicking the Plot button opens a new webview panel titled "Plot
Builder" beside the workbench. Panel does not duplicate on repeated
clicks (reveals existing panel instead — DESIGN §4.3).

### S9-004: `plot-builder.html` webview UI
**Pass:** Panel displays X and Y dropdowns populated with real workspace
variable names (requires S9-001 + S9-003 already green). Run button is
visible. **Explicit CSP check (DESIGN §4.4):** clicking Run visibly does
something (see S9-005/S9-007 criteria) — a silent no-op indicates the CSP
nonce was not wired correctly, and this task is not passable until it does.

### S9-005: Code generation + webview messaging
**Pass, checked per plot type** — for each row, John selects the type,
relevant style/axes options, X/Y(/Z) variables, and inspects the code sent
to the REPL (visible in the terminal panel as the executed command) before
confirming it matches the expected shape:

| Plot type | Expected call shape (example vars: `data1`, `data2`) |
|---|---|
| line (default) | `plot(data1, data2)` |
| scatter | `plot(data1, data2, seriestype=:scatter)` |
| histogram | `histogram(data1)` — **Y dropdown must be hidden** (Q5) |
| surface | `plot(data1, data2, data3, seriestype=:surface)` — **Z dropdown must be visible and required** (Q4) |
| boxplot | `using StatsPlots\nboxplot(data1, data2)` — **preamble present** (Decision 1A) |
| pie | `using StatsPlots\npie(data1, data2)` |
| any type + theme style | `theme(:default)\nplot(...)` — **statement, not kwarg** (DESIGN §5.1 correction) |
| any type + colors/opacity style | fixed `color=:auto` / `alpha=0.7` present; **"coming soon" note visible** in webview (Decision 2B) |

**Pass criterion is binary per row:** generated code matches the expected
shape exactly, or it doesn't. Any mismatch is a fail for that row
specifically — does not block other rows from being verified.

### S9-006: `renderer.js` dispatch branch
**Pass:** `window.plotConfig` at time of Plot click is what arrives in the
webview's `init` message — verified by comparing ribbon selection state
(STYLE/AXES buttons highlighted green per Sprint 8 state model) against
the plotConfig summary rendered in the webview panel.

### S9-007: REPL execution via ADR-024
**Pass:** Clicking Run in the webview causes the generated code to execute
in the Julia REPL (visible in terminal) and a plot to render in the
julia-vscode plot pane, for at least one plot type end-to-end (scatter
recommended as simplest case).

### S9-008: Full integration test
**Pass:** Complete user flow — select plot type + style + axes on ribbon →
click Plot → webview opens with real vars → select X/Y → click Run → plot
appears in plot pane — succeeds without manual intervention beyond the
described clicks, for 3 representative plot types: one 2-arg (scatter),
one 1-arg (histogram), one StatsPlots-dependent (boxplot).

### S9-009: Regression + tag `sprint9-complete`
**Pass:** Full pass over the Sprint 8 feature table in SPRINT9-HANDOFF.md
("What works as of sprint8-complete") — every row still ✓. Teardown
verified clean (no orphaned processes) per existing PowerShell procedure.
Only after both are confirmed does John tag and push `sprint9-complete`.

---

## Out of Scope for Sprint 9 Testing

- Automated/unit test coverage (not introduced this sprint)
- Type-checking validation for mismatched variable/plot-type combinations
  (SDD §5 Q6 — accepted Julia REPL error is the Sprint 9 behavior, not a
  bug to test against)
- Interactive color/opacity/theme controls (Decision 2B — backlogged)
- ANIMATE group, Activity bar launchers, KI-8 dirty indicator — separate
  Sprint 9 tasks (S9-009+/secondary goals per SPRINT9-HANDOFF.md), not
  covered by this Plot Builder test plan; will need their own pass
  criteria if scoped into tasks.md.

---

## Failure Protocol

If a manual verification step fails, John reports the exact observed
behavior back to this thread (not "it didn't work" — the actual terminal
output, error message, or visual state). Per the Antigravity rules already
in force: no fix-attempt loops by Antigravity — revert to last verified
commit and escalate to this planning thread for diagnosis before any
retry task is generated.
