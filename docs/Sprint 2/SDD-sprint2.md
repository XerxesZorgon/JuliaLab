# Software Description Document — Sprint 2
**Project:** JuliaLabApp
**Version:** 0.2
**Date:** 2026-06-23
**Updated:** 2026-06-23 — added detect-deps.js; dependency management architecture

---

## 1. Purpose

Sprint 2 pre-installs four VSCodium extensions into JuliaLabApp's
isolated `server-data/extensions/` directory and adds a dependency
detection system that discovers installed tools (Julia, Wolfram Engine,
Lean4/elan), configures their paths in the workbench settings, and warns
the user with actionable guidance if a dependency is missing.

The activity bar is re-enabled to surface extension UIs (Julia REPL,
Wolfbook kernel panel, Claude Code panel, Lean4 infoview).

---

## 2. Extensions

| Extension ID | Publisher | Purpose | Prerequisite |
|---|---|---|---|
| `julialang.language-julia` | julialang | Julia LSP, REPL, debugger, plot gallery | Julia via juliaup |
| `leanprover.lean4` | leanprover | Lean4 LSP, infoview | elan toolchain on PATH |
| `wolfbook.wolfbook` | wolfbook | Live Wolfram kernel via WSTP, notebooks | Wolfram Engine (free personal license) |
| `Anthropic.claude-code` | Anthropic | Claude Code AI assistant panel | Paid Claude subscription or Console account |

---

## 3. Dependency Management Architecture

JuliaLabApp delegates version management to existing tools rather than
building a parallel update system:

| Dependency | Manager | JuliaLabApp role |
|---|---|---|
| Julia runtime | juliaup | Detect via `juliaup which release`; configure path |
| Lean4 toolchain | elan | Detect via `elan which leanprover/lean4:stable`; configure path |
| Wolfram Engine | Wolfram installer | Detect via Windows registry; configure kernel path |
| VSCodium | User-managed | Detect at known install path; warn if missing |
| VSCodium extensions | codium CLI | Install once via `install-extensions.js` |

**Design principle:** Delegate, don't manage. JuliaLabApp discovers
what is installed and configures paths. It does not download or update
tools that have their own version managers.

**Missing dependency behaviour (Sprint 2):**
If a dependency is not found, show an Electron dialog that names the
missing tool, explains why it is needed, and provides the install URL.
The app continues to launch — missing tools are warnings, not hard
failures (except VSCodium, which is required).

**Sprint 4 scope (deferred):**
First-launch setup wizard, auto-update notifications for extensions,
NSIS installer that installs juliaup and elan as prerequisites.

---

## 4. Key Changes from Sprint 1

| Item | Sprint 1 | Sprint 2 |
|---|---|---|
| Activity bar | Suppressed | Re-enabled |
| Extensions | None | Four pre-installed via `install-extensions.js` |
| Dependency detection | None | `detect-deps.js` runs before server spawns |
| settings.json | Static, written once | Updated at each launch by `detect-deps.js` |

---

## 5. Success Criteria

| # | Criterion | Verification |
|---|---|---|
| SC-1 | Activity bar visible | Left icon strip present on cold launch |
| SC-2 | Julia extension active | `.jl` file → syntax highlighting; Julia REPL panel available |
| SC-3 | Lean4 extension active | `.lean` file → syntax highlighting; infoview accessible |
| SC-4 | Wolfbook active | `.wb` file → Wolfbook UI; Wolfram kernel connects |
| SC-5 | Claude Code active | Claude Code panel in activity bar; sign-in or session UI |
| SC-6 | detect-deps runs | Console shows dependency detection output on launch |
| SC-7 | Missing dep warning | Temporarily rename a dependency binary; confirm dialog appears |
| SC-8 | No Sprint 1 regressions | Window controls, resize, shutdown all still pass |

---

## 6. Non-Goals (Sprint 2)

- No first-launch setup wizard (Sprint 4)
- No auto-update for extensions or tools (Sprint 4)
- No NSIS installer (Sprint 4)
- No ribbon command wiring to extension commands (Sprint 3)
- No custom JuliaLab VSCodium extension (Sprint 3)
- No bundled Julia, Wolfram Engine, or elan (Sprint 4)

---

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `codium --install-extension --extensions-dir` not respected by serve-web | Medium | High | Task 001 spike |
| Wolfram Engine registry key differs across versions | Low | Medium | Try multiple known registry paths; fall back to PATH search |
| Claude Code browser auth blocked in WebContentsView | Low | Medium | Auth opens external browser; should work; verify in SC-5 |
| juliaup not on PATH in Electron app environment | Medium | Medium | Also check `%LOCALAPPDATA%\juliaup\bin\juliaup.exe` directly |
| elan not on PATH in Electron app environment | Medium | Low | Check `%USERPROFILE%\.elan\bin\elan.exe` directly |
