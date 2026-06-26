# ADR-011: Julia Process Management Delegation

**Date:** 2026-06-24  
**Status:** Accepted  
**Sprint:** 3  
**Deciders:** John Peach, Claude (eurAIka)

---

## Context

The Compute42 / JuliaLabShell architecture managed the Julia process directly
from the Rust backend: spawning Julia, communicating via Windows named pipes,
implementing a custom `JuliaLabDisplay` for plot interception, and maintaining
a `get_workspace_variables()` polling loop. This was necessary because
Compute42 had no Julia-aware IDE extension — the Rust actors *were* the IDE
layer.

JuliaLabApp embeds VSCodium with `julialang.language-julia` 1.219.2
pre-installed. This extension is a production-quality Julia IDE layer that
already implements:

- Julia process lifecycle (spawn, stop, restart, interrupt)
- REPL integration in the integrated terminal
- Workspace variable introspection (`REPLVariables` tree view)
- Plot display pipeline (intercepts `display()` calls; renders PNG, SVG,
  Vega-Lite, Plotly in a WebviewPanel plot pane)
- Language server (LSP: autocomplete, hover docs, go-to-definition,
  diagnostics)
- Debugger integration

The question is whether JuliaLabApp should continue to use the Compute42
scripts (`main.jl`, `core/display.jl`, `core/submodules/workspace.jl`, etc.)
alongside julia-vscode, or delegate entirely to julia-vscode.

---

## Decision

**Full delegation to julia-vscode. The Compute42 scripts are not ported.**

Rationale:

1. **No duplication of working software.** julia-vscode's workspace panel and
   plot pane implement the same features as the Compute42 scripts, but with
   years of production hardening, Julia 1.12 compatibility, and active
   maintenance. Rebuilding them in Sprint 3 would produce an inferior,
   unmaintained duplicate.

2. **Named pipes are gone.** The Compute42 IPC architecture (Windows named
   pipes, `ProcessActor`, `WriterActor`, `ReaderActor`) was a Tauri/Rust
   construct. JuliaLabApp has no Rust process. Porting the Julia-side scripts
   without the Rust side would require replacing the pipe transport with HTTP
   or WebSocket, recreating the same engineering effort with less reliability
   than julia-vscode already provides for free.

3. **Seamless REPL goal.** The stated goal — "Julia runs in the terminal as
   seamlessly as if running in a native VSCode terminal" — is exactly
   julia-vscode's design target. Fighting its process model to layer a
   parallel Julia server would undermine that goal.

4. **Maintenance surface.** Every line of custom Julia runtime code in
   JuliaLabApp is a maintenance liability across Julia version upgrades.
   Delegating to julia-vscode transfers that liability to the julia-vscode
   team.

**What this means concretely:**

| Compute42 script | Fate |
|---|---|
| `main.jl` — entry point, named pipe server | Not ported |
| `core/display.jl` — `JuliaLabDisplay`, plot routing | Not ported; julia-vscode plot pane used |
| `core/submodules/workspace.jl` — `get_workspace_variables()` | Not ported; `REPLVariables` tree view used |
| `core/submodules/execution.jl` — code execution handler | Not ported; julia-vscode REPL used |
| `core/submodules/communication.jl` — named pipe I/O | Not ported |
| `core/submodules/handlers.jl` — command dispatch | Not ported |
| `core/packages.jl` — `Pkg.instantiate()` staleness check | Deferred; may be revisited in Sprint 4 |
| `debugger.jl` — debugger integration | Not ported; julia-vscode debugger used |

**`julia.executablePath` in `settings.json`** (already set to
`C:\Users\johnx\.julia\juliaup\julia-1.12.1+0.x64.w64.mingw32\bin\julia.exe`
by Sprint 2's `detect-deps.js`) is the sole configuration point that
JuliaLabApp manages. julia-vscode reads this setting and uses it to spawn
the Julia process. No other Julia configuration is managed by JuliaLabApp.

---

## Consequences

- Sprint 3 contains zero new Julia code.
- The `julialab` VSCodium extension is pure TypeScript.
- Future sprints that need Julia-side customisation (e.g., a JuliaLab-specific
  startup banner, custom display types) will inject code via julia-vscode's
  `julia.additionalArgs` or `julia.initializationScript` settings, not via
  a parallel Julia server.
- If julia-vscode's plot pane is not accessible in serve-web context (Spike B
  failure), this decision must be revisited in Sprint 4. The Compute42
  `display.jl` approach remains available as a fallback but is not built in
  Sprint 3.
