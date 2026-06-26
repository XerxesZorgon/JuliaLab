# JuliaLab Rewrite — Sprint 3 Handoff
**Date:** 2026-06-24
**From:** Sprint 2 completion thread
**To:** Sprint 3 planning thread

---

## What Has Been Built (Sprints 1 and 2)

**Repo:** `C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp`
**Sprint 1 tag:** `sprint1-complete` at `70c04cc`
**Sprint 2 tag:** `sprint2-complete` at `ae7bb5a`

### Architecture (locked)

A single Electron 39.8.8 OS window containing:
- MATLAB R2023b+-style ribbon (HOME / PLOTS / APPS / LIVE EDITOR /
  INSERT / VIEW) with working window controls
- VSCodium workbench embedded via `WebContentsView` served by
  `codium serve-web` on `127.0.0.1:3456`
- Activity bar enabled (left icon strip)
- Four pre-installed extensions: `julialang.language-julia`,
  `leanprover.lean4`, `wolfbook.wolfbook`, `Anthropic.claude-code`
- `detect-deps.js` runs before server spawn — discovers Julia, Wolfram
  Engine, Lean4 paths; writes to `settings.json`; warns if missing

### Key Technical Facts

| Fact | Value |
|---|---|
| Electron | 39.8.8 |
| VSCodium | 1.121.03429 |
| Node.js | 22.22.1 |
| Spawn pattern | `cmd.exe /c codium.cmd serve-web` with `shell: false` |
| Ready signal | `Web UI available at` on stdout |
| Extension dir | `server-data/extensions/` |
| Settings dir | `server-data/Machine/settings.json` |
| Julia settings key | `julia.executablePath` |
| Lean4 settings key | `lean4.toolchainPath` |
| Wolfbook settings key | `wolfbook.wolframKernelPath` |
| Wolfram kernel | `WolframKernel.exe` (not `wolframscript.exe`) |
| elan detection | Check `~/.elan/toolchains/` directly — elan not on PATH |
| Julia path | `C:\Users\johnx\.julia\juliaup\julia-1.12.1+0.x64.w64.mingw32\bin\julia.exe` |
| Wolfram kernel path | `C:\Program Files\Wolfram Research\Wolfram Engine\14.1\WolframKernel.exe` |
| Lean4 toolchain | `C:\Users\johnx\.elan\toolchains\leanprover--lean4---stable` |

### Project File Structure

```
JuliaLabApp/
├── main.js                        — Electron main process
├── preload.js                     — contextBridge for window controls
├── index.html                     — Ribbon HTML
├── ribbon.css                     — MATLAB R2023b+ ribbon styles
├── renderer.js                    — Window control button wiring
├── package.json                   — Electron 39.8.8 pinned
├── scripts/
│   ├── detect-deps.js             — Tool path discovery (run at launch)
│   └── install-extensions.js     — One-time extension setup
├── server-data/
│   ├── Machine/settings.json      — VSCodium machine settings + tool paths
│   └── extensions/                — Pre-installed extensions (gitignored runtime)
└── docs/
    ├── SDD.md                     — Sprint 1 SDD
    ├── SDD-sprint2.md             — Sprint 2 SDD
    ├── DESIGN.md                  — Sprint 1 design
    ├── DESIGN-sprint2.md          — Sprint 2 design
    ├── TEST_PLAN.md               — Sprint 1 test plan
    ├── TEST_PLAN-sprint2.md       — Sprint 2 test plan
    ├── PLAN.md                    — Sprint 1 plan
    ├── PLAN-sprint2.md            — Sprint 2 plan
    └── adr/
        ├── ADR-001-embedding.md
        ├── ADR-002-server.md
        ├── ADR-003-ribbon.md
        ├── ADR-004-chrome-suppression.md
        ├── ADR-005-activity-bar.md
        ├── ADR-006-extensions.md
        └── ADR-007-dep-detection.md
```

---

## Development Discipline (carry forward unchanged)

- **One file per Antigravity task** — flag and refuse multi-file tasks
- **One Antigravity instruction per message** — single fenced block,
  gated on prior result
- **Mandatory diff review before any build or run** — Ask mode only
- **Commit after every verified green task**
- **Revert, don't patch** — if something breaks, revert and escalate
- Sprint tasks tracked in `tasks-sprint3.md`; build contract inherited
  from Sprint 1 `CLAUDE.md` pattern

---

## Sprint 3 — What Needs to Be Built

Sprint 3 is the custom `julialab` VSCodium extension — a TypeScript
extension that runs inside the embedded VSCodium workbench and provides
JuliaLab-specific functionality.

### Sprint 3 Scope

**3A — Workspace variable panel**
A VSCodium WebviewPanel that polls the Julia REPL and displays
workspace variables (name, type, size) in a MATLAB-style table.
Julia-side: a script that serializes `Base.workspace()` to JSON.
Extension-side: a WebviewPanel that calls the Julia script via the
julia-vscode extension API or via REPL polling, and renders results.

**3B — Plot routing**
Register a Julia display hook that intercepts CairoMakie/Plots output
and routes it to a VSCodium WebviewPanel (the PLOTS tab).
Julia-side scripts from the old Compute42 fork port directly here
(located at `C:\Users\johnx\AppData\Local\org.julialab.ide\scripts\`).

**3C — Ribbon command wiring**
Ribbon tab clicks (HOME, PLOTS, APPS, etc.) dispatch
`vscode.commands.executeCommand` calls into the workbench via
`webContentsView.webContents.executeJavaScript()`.
This requires a command registry in the extension that maps ribbon
tab names to VSCodium commands.

**3D — MATLAB-style layout preset**
On first open, apply a layout: editor centre, file tree left,
terminal bottom, workspace variable panel right.
Use VSCodium's layout API or the `workbench.action.` command family.

### Assets That Port from Compute42

| Asset | Location | Destination |
|---|---|---|
| Workspace variable polling (Julia) | `C:\Users\johnx\AppData\Local\org.julialab.ide\scripts\` | JuliaLab extension `scripts/` |
| Plot routing / display hook (Julia) | Same scripts dir | JuliaLab extension `scripts/` |
| Ribbon Vue components | `JuliaLabShell\index.html`, `ribbon.css` | Already ported in Sprint 1 |

### Key Unknowns for Sprint 3 Phase 0

1. Does the julia-vscode extension expose a public API for REPL
   interaction, or must we poll via a Julia server script?
2. Does CairoMakie's display hook work in a headless serve-web context,
   or does it require a display backend?
3. Which VSCodium command family is stable for layout management?
4. Should the julialab extension be a separate repo or a subdirectory
   of JuliaLabApp?

---

## How to Open the Sprint 3 Thread

Start a new Claude Projects chat and paste:

```
/software-project — JuliaLab Sprint 3: custom julialab VSCodium extension.

Context:
- Active repo: C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp
- Sprint 1 tag: sprint1-complete (70c04cc) — Electron shell + serve-web embedding
- Sprint 2 tag: sprint2-complete (ae7bb5a) — extensions + detect-deps
- Sprint 3 goal: custom julialab VSCodium extension (workspace panel,
  plot routing, ribbon command wiring, MATLAB layout preset)
- Reference scripts (Compute42 port):
  C:\Users\johnx\AppData\Local\org.julialab.ide\scripts\
- MATLAB reference images:
  C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabShell\docs\Matlab1.png through Matlab5.png

Read the handoff document before starting Phase 0:
C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp\docs\HANDOFF-sprint3.md
```
