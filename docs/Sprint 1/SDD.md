# Software Description Document
**Project:** JuliaLabApp
**Version:** 0.1
**Date:** 2026-06-22
**Author:** John Peach / eurAIka

---

## 1. Purpose

JuliaLabApp is a desktop IDE for Windows that gives scientists transitioning
from MATLAB to Julia a familiar working environment. It wraps the full
VSCodium workbench in a single Electron window topped by a MATLAB R2023b+-style
ribbon bar, replacing VSCodium's own chrome entirely. The workbench is served
by a locally-bundled `openvscode-server` process and embedded via Electron's
`WebContentsView` API, giving users a native-feeling single-window experience
with no subprocess positioning hacks and no two-window Z-order problems.

## 2. Users and Use Cases

| User | Use Case | Priority |
|---|---|---|
| MATLAB user switching to Julia | Opens JuliaLabApp and finds a ribbon-and-panel layout they already know; runs Julia code immediately without learning a new IDE chrome | High |
| Julia researcher | Uses the integrated terminal, Julia LSP, and plot output in a single window; switches AI coding assistant (Claude Code, Copilot, Codeium, Continue) without leaving the IDE | High |
| Multi-language scientist | Works across Julia, Lean4, and Wolfram Language in the same IDE session, using the language's own VSCodium extension | Medium |
| Power user | Installs additional VSCodium extensions from Open VSX; customises the layout; uses the ribbon APPS tab to launch tools | Low |

## 3. Key Features (Sprint 1 scope)

1. **Single OS window** — one Electron window owns all chrome; no VSCodium title bar, menu bar, or activity bar visible.
2. **MATLAB-style ribbon bar** — six tabs (HOME / PLOTS / APPS / LIVE EDITOR / INSERT / VIEW) with window controls (minimise, maximise, close), styled to MATLAB R2023b+.
3. **VSCodium workbench embedded below the ribbon** — file tree, editor, integrated terminal, status bar, all functional.
4. **Responsive layout** — resize and move the Electron window; ribbon and workbench stay aligned with zero external positioning calls.
5. **Clean startup** — `openvscode-server` starts before the window opens; the workbench URL loads only when the server is ready; no blank-flash or connection-refused screen.
6. **Clean shutdown** — closing the Electron window kills the server process; no orphan Node processes.

## 4. Non-Goals (Sprint 1)

- No pre-installed Julia, Lean4, Wolfram, or AI assistant extensions (Sprint 2).
- No custom JuliaLab VSCodium extension — workspace variable panel, plot routing, ribbon command wiring (Sprint 3).
- No distribution packaging, installer, or auto-update (Sprint 4).
- No macOS or Linux support.
- No bundled Julia runtime or sysimage (Sprint 4).
- No ribbon button functionality beyond window controls (minimise/maximise/close). Tab clicks are visual-only in Sprint 1.
- Not a fork of VSCodium internals — JuliaLabApp never modifies VSCodium source.

## 5. Success Criteria (Sprint 1)

| # | Criterion | Verification |
|---|---|---|
| SC-1 | Single header — no VSCodium title bar, menu bar, or activity bar visible | Visual inspection |
| SC-2 | VSCodium functional — file open, editor, integrated terminal work | Run `julia -e 'println("hello")'` in terminal; see output |
| SC-3 | Terminal latency — Julia REPL echo is subjectively imperceptible | Type 10 commands in sequence; no visible input lag |
| SC-4 | Window controls — minimise, maximise, close work; no orphan processes | Check Task Manager after close |
| SC-5 | Resize alignment — ribbon and workbench stay flush after drag-resize | Resize window to three different sizes; no gap or overlap |

## 6. Constraints

| Dimension | Constraint |
|---|---|
| Language / runtime | Node.js 22.22.1; Electron (version pinned in PLAN.md) |
| VSCodium version | 1.121.03429 (same as PoC; do not upgrade during Sprint 1) |
| openvscode-server | Must match VSCodium version; pinned in PLAN.md |
| Platform | Windows 10 x64 first; macOS/Linux deferred |
| Repo location | `C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp` |
| App identifier | `org.julialab.ide` |
| Development discipline | One file per Antigravity task; mandatory diff review; commit after every green task; revert not patch on failure |
| AI assistant | No specific AI assistant is bundled or endorsed; users install their preferred extension |

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `openvscode-server` workbench does not load correctly in `WebContentsView` (CSP, protocol, missing Node integration) | Medium | High | Task 001 is an explicit feasibility spike before any implementation; fall back to Path A (subprocess) if spike fails |
| localhost WebSocket terminal latency is subjectively noticeable vs native | Medium | High | SC-3 measured in spike; if unacceptable, evaluate node-pty direct integration in Electron main process |
| `openvscode-server` version that matches VSCodium 1.121.03429 is not available as a pre-built binary | Low | Medium | Build from source or use code-server equivalent; spike task verifies this |
| openvscode-server startup time adds to cold-start latency | Low | Low | Measure in spike; mitigate with server-ready event before showing window |
| Antigravity agent makes unrequested multi-file edits | High (documented pattern) | Medium | Enforce Ask mode; one-file-per-task discipline; escalate to this thread on violation |
