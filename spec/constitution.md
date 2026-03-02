# JuliaLab - Project Constitution

**Version**: 1.0
**Created**: 2026-03-02
**Type**: desktop-application

---

## Purpose

JuliaLab is an open-source, cross-platform desktop IDE for the Julia programming language,
designed to feel immediately familiar to scientists and engineers migrating from MATLAB.

It provides a MATLAB R2025a-inspired interface — a 6-tab ribbon toolbar, 4-panel layout,
publication-quality plotting via Makie.jl, a Live Editor powered by Pluto.jl, and an
AI assistant pane powered by Gemini CLI — while being Julia-native, free, and fast.

JuliaLab is built by forking Compute42 (https://github.com/elan8/compute42), which
provides the Tauri 2 + Vue 3 + Actix actor system foundation. JuliaLab is NOT a MATLAB
clone; it is a Julia-first IDE that borrows MATLAB's best UX patterns and adapts them
to Julia's unique strengths (multiple dispatch, Revise.jl live reloading, rich type
system, Unicode identifiers, and a world-class package ecosystem).

---

## Goals

### Primary Goals

1. **MATLAB-familiar UX**: The 4-panel layout (File Browser · Editor · Command Window ·
   Workspace), 6-tab ribbon (Home / Plots / Apps / Live Editor / Insert / View), and
   figure toolbar must be recognizable to any MATLAB user within 60 seconds of opening.

2. **Julia-native workflows**: Revise.jl loads automatically in every Julia session,
   enabling live code reloading without restart. Unicode tab-completion (\alpha → α),
   multiple dispatch method inspection, and Project.toml environment management are
   first-class features.

3. **Publication-quality plotting**: The figure system is built on Makie.jl (GLMakie
   for interactive 3D, CairoMakie for vector/print export, WGLMakie for inline IDE
   display). A Figure Style Panel exposes journal themes (ACS, APS, Nature), colormaps,
   DPI, and a "Copy Plot Code" button.

4. **Integrated AI assistant**: A Gemini CLI-powered AI pane provides context-aware
   help using the current file, workspace variables, and selected code as context.
   Quick actions include Explain, Fix Error, Write Tests, and Translate from MATLAB.

5. **Cross-platform desktop**: Windows, macOS, and Linux, distributed as a single
   installer via Tauri 2 (Rust backend + Vue 3 frontend). No Electron. No cloud account
   required for core IDE features.

### Non-Goals

- JuliaLab will NOT build a Simulink-style drag-and-drop block diagram GUI.
  That is Dyad's (JuliaHub) responsibility. JuliaLab integrates with Dyad via
  an "Open in Dyad" button for ModelingToolkit.jl model files.

- JuliaLab will NOT implement its own Julia runtime, parser, or compiler.
  Julia is always a subprocess; JuliaLab never bundles or embeds a Julia binary.

- JuliaLab will NOT support executing Python, R, MATLAB, or any language other than Julia.

- JuliaLab will NOT replace Tauri 2 with Electron or any other desktop shell.

- JuliaLab will NOT require a cloud account or internet connection for core features.
  The AI pane is fully opt-in and requires separate Gemini CLI setup by the user.

- JuliaLab will NOT replicate MATLAB toolboxes. Julia packages are the toolbox system.
  The APPS tab surfaces the Julia package ecosystem and Genie/Stipple app framework,
  not MathWorks-style compiled toolboxes.

---

## User Personas

### Primary User — The MATLAB Migrant

- **Role**: Research scientist, engineer, or graduate student transitioning from MATLAB
- **Needs**: Familiar 4-panel layout; inline plots; workspace variable inspection;
  easy package management; live script / notebook workflow (Pluto.jl); publication-quality
  figure export (SVG, PDF, EPS); a built-in MATLAB→Julia cheat sheet for syntax reference
- **Constraints**: May not know Julia well yet; frustrated by unfamiliar tooling;
  values stability and predictability over bleeding-edge features; time-poor
- **Success signal**: Opens JuliaLab, recognizes the layout within 60 seconds,
  runs a script, inspects variables in the workspace, generates and exports a plot,
  all without consulting documentation

### Secondary User — The Julia Developer

- **Role**: Experienced Julia developer who wants a dedicated IDE, not a VS Code extension
- **Needs**: Revise.jl integration with status bar feedback; Debugger.jl visual UI (DAP);
  LSP completions/hover/go-to-definition; JuliaFormatter.jl; Test Browser; Git panel;
  profiler flame graph; Code Issues panel
- **Constraints**: High standards for correctness and performance; will immediately notice
  regressions; may contribute to the codebase directly
- **Success signal**: Full dev loop (edit → save → Revise reloads → test passes)
  works without any manual intervention

### Tertiary User — The Data Scientist

- **Role**: Jupyter/Python user exploring Julia for performance-critical numerical work
- **Needs**: Pluto notebook launcher; DataFrame inspection in workspace panel;
  interactive Makie plots; easy package install from UI; Gemini AI pane for syntax help;
  visible Julia type information in the workspace table
- **Constraints**: Unfamiliar with Julia ecosystem; needs discoverability and
  in-IDE guidance
- **Success signal**: Can install a package, load a CSV, plot a DataFrame column,
  and export a figure to PNG in a single 10-minute session

---

## Technical Constraints

### Must Have (Immutable Architecture)

- **Desktop shell**: Tauri 2 (Rust). The `src-tauri/` directory and Actix actor system
  from Compute42 must be preserved and extended, never replaced.
- **Frontend framework**: Vue 3 with Composition API (`<script setup>` syntax).
  All new components must use `<script setup>`, not Options API.
- **Editor**: Monaco Editor with Julia TextMate grammar. The editor integration from
  Compute42 is the base; it must not be replaced with CodeMirror or similar.
- **UI components**: Naive UI (already in Compute42). Additional libraries (e.g.,
  AG Grid Community for the workspace table) may be added, but Naive UI is not replaced.
- **State management**: Pinia. No Vuex. No Redux. No raw Vue reactivity for cross-component
  state that belongs in a store.
- **Build system**: Vite. No webpack migration.
- **Julia process**: Always a subprocess. Communication via stdin/stdout and a local
  WebSocket/TCP socket. Julia is never bundled, embedded, or executed via FFI.
- **Language Server**: LanguageServer.jl via LSP protocol. No substitution.
- **Plotting**: Makie.jl ecosystem (GLMakie / CairoMakie / WGLMakie). Primary target.
  Plots.jl outputs are displayed if encountered but are not the integration focus.
- **AI pane**: Gemini CLI as a subprocess. The app never calls the Gemini REST API
  directly and never stores user API keys.
- **Revise.jl**: Loaded automatically in every Julia session via startup injection.
  This is non-negotiable. No agent or developer may disable this without user instruction.

### Should Have

- Unit tests for all Tauri commands (Rust `#[cfg(test)]`)
- Unit tests for all Pinia stores (Vitest)
- Component tests for all panels (Vitest + Vue Test Utils)
- E2E tests for critical flows (Playwright via Tauri driver)
- CI pipeline (GitHub Actions) building on Windows, macOS, and Linux

### Nice to Have

- Automated benchmark tracking (plot render time, REPL latency, startup time)
- Storybook or equivalent for Vue component visual testing
- MATLAB→Julia cheat sheet panel (high priority for MATLAB Migrant persona,
  but not required for Phase 1 MVP)
- Dyad integration panel (open MTK model files in Dyad Studio)

---

## Quality Standards

### Code Quality

- All TypeScript must pass ESLint with the project's `.eslintrc`. No `any` types
  without a comment explaining why.
- All Rust must pass `rustfmt` and `clippy --deny warnings`. Zero clippy warnings
  in CI.
- All Vue components use Composition API `<script setup>`. No Options API.
- No hardcoded color hex values in Vue/TS files. All colors via CSS variables
  prefixed `--jl-` (e.g., `var(--jl-accent-green)` = `#389826`).
- No direct DOM manipulation from Vue components. Use reactive state and template refs.
- Git: Conventional Commits format (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`).
  No direct commits to `main`. All work via feature branches and PRs.

### UX Quality

- Cold start (app launch to REPL ready): target < 5 seconds on modern hardware
- Julia subprocess ready (after JIT warmup): target < 15 seconds
- Revise reload after file save: < 2 seconds for typical function changes
- Workspace refresh after REPL execution: < 500 ms
- Monaco editor keypress latency: < 16 ms (must not block at 60 fps)
- Inline WGLMakie plot render: < 3 seconds for standard 2D plots

### Julia Package Standards

All Julia packages auto-installed by JuliaLab at first launch must:
- Be registered in Julia General registry (no unregistered packages)
- Install into the user's default Julia depot (never a hidden, JuliaLab-managed depot
  unless the user explicitly opts in to an isolated environment)
- Display installation progress in a non-blocking notification, not a modal dialog
- Be skipped gracefully (with a warning, not a crash) if installation fails

---

## Epistemic Standards

### Decision Confidence Levels

When implementing or proposing features, contributors and AI agents must label
decisions with one of:

- **Verified**: Behavior confirmed by running the code or by Compute42 codebase inspection
- **Confirmed**: Behavior documented in official Tauri 2 / Vue 3 / Julia / Makie docs
- **Assumed**: Reasonable inference from related documentation; must be tested before merge
- **Speculative**: Untested approach proposed for review; must not be merged without
  a corresponding test or user confirmation

All "Speculative" decisions in PR descriptions require an explicit user sign-off
before the PR is merged.

---

## Decision Authority

- **User**: Final authority on all architectural decisions, feature scope changes,
  dependency additions, and deviations from this constitution.
- **Claude Code / AI agents**: Propose implementations; execute tasks from Spec Kit
  task files; flag ambiguities before writing code rather than guessing.
- **This constitution**: Governs day-to-day decisions that do not require user input.
  If a coding decision is covered here, agents follow it without asking.
- **CLAUDE.md**: Takes precedence over this constitution for session-specific overrides.
  If CLAUDE.md contradicts this file, CLAUDE.md wins.

### Agent Behavior Rules

1. **Spec-first**: No implementation begins until the relevant `.specify/` spec, plan,
   and task files exist and the user has reviewed them.

2. **Phase gating**: Do not start Phase N+1 tasks until all Phase N tasks are marked
   complete in the task file and confirmed by the user.

3. **No silent architecture changes**: Never propose replacing Tauri with Electron,
   Vue with React, Monaco with CodeMirror, or restructuring the Actix backend without
   an explicit user request. Raise it as a suggestion in a comment, not a code change.

4. **One task at a time**: Work on one Spec Kit task, complete it with tests,
   confirm with the user, then move to the next.

5. **Never bundle Julia**: JuliaLab always uses the user's installed Julia.
   Never add a Julia JLL, bundled runtime, or hermetic Julia environment without
   explicit user request and documented justification.

6. **Preserve Compute42 backend**: The Rust Actix actor system in `/internals` is
   foundational. Extend it; do not rewrite it from scratch.

7. **Test before PR**: All new Tauri commands and Pinia stores require tests.
   A PR without tests for new backend/store code will not be merged.

8. **Revise.jl is always on**: Never disable Revise.jl auto-loading or suggest
   a workaround that bypasses it. If Revise causes an issue, surface it to the user.

---

## Success Criteria

### Phase 1 — Foundation (Target: Week 4)

1. `npm run tauri dev` launches a window with the correct 4-panel MATLAB-style layout
   on Windows, macOS, and Linux.
2. All 6 ribbon tabs (Home / Plots / Apps / Live Editor / Insert / View) render
   the correct button groups; F2 toggles ribbon; pin button keeps it expanded.
3. Julia REPL launches in the Command Window and accepts input.
4. "Revise active ●" appears in the status bar when a Julia session is running.
5. Current folder breadcrumb is visible and updates when the working directory changes.

### MVP — Phases 1–5 (Target: Month 3)

1. A MATLAB user can open JuliaLab, run a Julia script, inspect variables in the
   workspace panel, generate a publication-quality Makie plot, export it as PDF,
   and step through code with the visual debugger — without consulting documentation.
2. The MATLAB→Julia cheat sheet is accessible from the Help menu or ribbon.
3. JuliaFormatter.jl "Format" button works in the ribbon.
4. All CI tests pass on Windows, macOS, and Linux.

### v1.0 — All Phases (Target: Month 6)

1. Installable binaries exist for Windows (.msi), macOS (.dmg), and Linux (.AppImage).
2. Auto-updater works via Tauri updater.
3. All 10 development phases are complete and tested.
4. Documentation covers installation, first-run setup, and the 5 core workflows.
5. JuliaLab has been used and reviewed by at least 3 MATLAB-migrant users
   who were not involved in building it.

---

## Revision History

- v1.0 (2026-03-02): Initial constitution — forked from Compute42 (MIT).
  Replaces default Spec Kit research template. Authored during JuliaLab planning session.
