# JuliaLab — Pre-Flight Checklist & Claude Code Command Guide

---

## Part 1: Things to Settle Before Writing a Single Line of Code

Work through every item in this list. Skipping any one of them is likely to cause
expensive backtracking later.

---

### 1.1 — Dev Environment Verification (Do This First)

Before forking Compute42, confirm you can actually build a Tauri 2 app on your machine.
This is often the biggest time sink and should be de-risked immediately.

**Checklist:**

- [ ] **Rust toolchain**: `rustup show` returns stable ≥ 1.75. If not: `rustup update stable`
- [ ] **Node.js**: `node --version` returns 18.x or 20.x LTS. (Tauri 2 requires ≥ 18)
- [ ] **pnpm or npm**: Compute42 uses `npm`. Check `package.json` for the package manager.
- [ ] **Tauri CLI**: `cargo install tauri-cli` or `npm install -g @tauri-apps/cli`
- [ ] **Platform-specific Tauri prereqs** verified:
  - Windows: WebView2 runtime installed (ships with Windows 11; manual install on Win 10)
  - macOS: Xcode Command Line Tools (`xcode-select --install`)
  - Linux: `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev` (check Tauri docs for distro)
- [ ] **Julia 1.10+**: `julia --version` works from the terminal Claude Code will use
- [ ] **Git**: `git --version` works
- [ ] **Gemini CLI** (optional at this stage): `gemini --version` or defer to Phase 6

**The smoke test**: Clone Compute42, run `npm install && npm run tauri dev`, confirm
a window opens. If this fails, fix it before creating JuliaLab.

---

### 1.2 — Repository Setup

- [ ] Fork `https://github.com/elan8/compute42` to your GitHub account as `julialab`
- [ ] Clone locally: `git clone https://github.com/YOUR_USERNAME/julialab.git`
- [ ] Create `CLAUDE.md` in the repo root (see Section 3 below for contents)
- [ ] Place `constitution.md` at `.specify/constitution.md`
- [ ] Run Spec Kit init (see Part 2, Step 1)
- [ ] Create initial branch: `git checkout -b phase-1-foundation`
- [ ] Confirm `.github/workflows/` directory exists or plan to create CI (see 1.5)

---

### 1.3 — Understand the Compute42 Codebase Before Changing Anything

This is the single most important pre-flight item. Many expensive mistakes come
from agents (and humans) starting to modify code they don't yet understand.

**Questions to answer before writing any code:**

1. How is the Julia subprocess spawned? Which Rust file/actor handles it?
2. How does Vue communicate with Tauri? List the 10 most-used `invoke()` call names.
3. Which Vue component controls the main layout? What are its child components?
4. How does the existing variable/workspace viewer work? What data does it receive?
5. How does the plot viewer work? What format does Julia send plot data in?
6. Where does LanguageServer.jl get started and how does Monaco connect to it?
7. What is the existing REPL terminal component? xterm.js or custom?
8. What Pinia stores already exist? What state do they manage?

Claude Code command to answer all of this: see Part 2, Step 2.

---

### 1.4 — Key Technical Decisions to Make Upfront

These are not obvious and affect a lot of downstream code. Decide them now.

**A) Inline plot format: WGLMakie WebSocket vs. PNG stream**

WGLMakie renders Julia plots as an interactive HTML canvas via a local WebSocket.
This gives mouse interaction (zoom, pan, rotate) but requires a running WebSocket
server from Julia. The simpler alternative is to have Julia export PNG/SVG and
display it as an `<img>` tag.

*Recommendation*: Use PNG/SVG for Phase 1–2 (simpler, already partially in Compute42),
add WGLMakie WebSocket for Phase 3 when you build the figure system.

**B) Workspace variable serialization format**

When Julia sends variable data to the Vue workspace panel, what format?
Options: JSON (simple but loses type nuance), MessagePack (efficient), custom protocol.

*Recommendation*: JSON for Phase 1–2. Variables are serialized by Julia as
`{name, type_str, size_str, value_preview}`. Full array data (for the array editor)
fetched on-demand as a separate call.

**C) Revise.jl startup injection method**

Option 1: Modify `~/.julia/config/startup.jl` globally (invasive, affects all Julia)
Option 2: Pass a custom `--startup-file` that JuliaLab manages in its config directory
Option 3: Send `using Revise` as the first REPL command after Julia starts

*Recommendation*: Option 3 for Phase 1 (zero-risk). Upgrade to Option 2 in Phase 2
for reliability. Never use Option 1.

**D) Monaco Julia grammar source**

Julia's TextMate grammar is maintained at:
`https://github.com/julia-vscode/julia-vscode/blob/master/syntaxes/julia.json`

Compute42 likely already bundles this. Verify which version and plan for updates.

**E) App identity (name, bundle ID, window title)**

Set these in `tauri.conf.json` before Phase 1. Changing them later requires
re-signing installers.

```json
{
  "package": { "productName": "JuliaLab", "version": "0.1.0" },
  "tauri": {
    "bundle": {
      "identifier": "org.julialab.ide",
      "icon": ["icons/julia-3dots.png"]
    }
  }
}
```

Create a JuliaLab icon using Julia's three colored dots (red #cb3c33, green #389826,
purple #9558b2) before the first build.

---

### 1.5 — CI Pipeline (Set Up on Day 1, Not Later)

Setting up CI after you have 500 lines of code is painful. Do it before Phase 1 work.

Minimal GitHub Actions workflow (`.github/workflows/ci.yml`):

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - uses: dtolnay/rust-toolchain@stable
      - name: Install Linux deps
        if: matrix.os == 'ubuntu-latest'
        run: sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev
      - run: npm install
      - run: npm run build   # or tauri build --ci
      - run: npm test        # Vitest
      - run: cargo test      # Rust unit tests
```

---

### 1.6 — License & Attribution

- Compute42 is MIT licensed. JuliaLab must keep the MIT license and attribution.
- Add a `NOTICE` file crediting Compute42 and its contributors.
- All added dependencies must be MIT, Apache-2.0, or BSD-compatible.
- Verify: `npm install --global license-checker && license-checker --production`

---

### 1.7 — The MATLAB→Julia Cheat Sheet (Collect Content Now)

This panel is unique to JuliaLab and extremely high-value for the target audience.
It takes time to write well and should be drafted as a data file (`cheatsheet.json`
or Markdown) in parallel with Phase 1, not as a last-minute addition.

Start with these categories:
- Matrix creation (zeros, ones, eye, rand, linspace)
- Indexing (1-based, end, colon, logical indexing)
- Linear algebra (A\b, inv, det, eig, svd, norm)
- Control flow (for, while, if — syntax differences)
- Function definition (function vs anonymous)
- Plotting (plot → lines!, figure → Figure, subplot → layout)
- String operations
- File I/O (load/save → CSV.jl, JLD2.jl)
- Common MATLAB functions and their Julia equivalents

---

## Part 2: Claude Code Command Sequence

Run these commands in Claude Code in order. Do not skip ahead.

---

### Step 1 — Initialize Spec Kit

```
Read .specify/constitution.md carefully. Then run:

  specify init julialab

Review the generated spec.md template and confirm it was created at
.specify/specs/001-julialab-core/spec.md before proceeding.
```

---

### Step 2 — Codebase Orientation (CRITICAL — Do This Before Any Changes)

```
Read the entire Compute42 project structure thoroughly. I need you to produce a
written report covering exactly these questions, with file paths for every answer:

1. How is the Julia subprocess spawned and managed? Which Rust file and which Actix
   actor is responsible? Show me the spawn command.

2. How does Vue communicate with Tauri? List every invoke() call in the frontend,
   grouped by which Rust command they call.

3. Which Vue component is the top-level layout container? What are its immediate
   child components and what panel does each one represent?

4. How does the existing workspace/variable viewer work? What Julia code sends the
   variable data and what format does it use?

5. How does the existing plot viewer work? What does Julia send and how does Vue
   render it?

6. Where and how is LanguageServer.jl started? How does Monaco connect to it?

7. What is the REPL terminal component? Is it xterm.js or a custom component?

8. List every Pinia store that exists, what state each manages, and what actions
   each exposes.

9. Which files would need to change to implement the 4-panel MATLAB-style layout
   described in the constitution? Give me a ranked list from "most work" to
   "least work".

10. Are there any known issues, TODOs, or unfinished features in Compute42 that
    would affect JuliaLab's Phase 1 work?

Format your report as a markdown document and save it to .specify/codebase-audit.md.
Do not make any code changes during this step.
```

---

### Step 3 — Generate the Specification

```
Using the codebase audit in .specify/codebase-audit.md and the constitution in
.specify/constitution.md, run:

  specify specify 001-julialab-core

This should generate .specify/specs/001-julialab-core/spec.md. After it generates,
open that file and expand the following sections with JuliaLab-specific content:

1. User Stories — add at least one story for each of the three personas
   (MATLAB Migrant, Julia Developer, Data Scientist) for Phase 1 features only.

2. Acceptance Criteria — for each user story, write testable "given/when/then"
   criteria that map to the Phase 1 success criteria in the constitution.

3. UI Behavior — describe the 4-panel layout, ribbon structure, F2 toggle behavior,
   and path bar in enough detail that a developer could implement it without
   looking at MATLAB screenshots.

4. Out of Scope — list everything from Phases 2–10 explicitly.

Save the expanded spec and show me the diff before doing anything else.
```

---

### Step 4 — Generate the Technical Plan

```
Using the spec at .specify/specs/001-julialab-core/spec.md and the codebase audit,
run:

  specify plan 001-julialab-core

After generation, open .specify/plans/001-julialab-core/plan.md and verify it
addresses these JuliaLab-specific technical decisions:

1. Which Vue component becomes the layout root and how will panels be made resizable?
   (Recommend: CSS grid with drag handles, or a Vue resize library — specify which)

2. How will the ribbon tab content be structured? (Recommend: a single RibbonBar.vue
   component with a `currentTab` prop that conditionally renders group components)

3. How will the F2 ribbon toggle be implemented? (CSS transition on height,
   keyboard listener in App.vue)

4. How will Revise.jl be injected? (Recommend: send "using Revise\n" as the first
   stdin write after Julia process starts, then poll for the "julia>" prompt)

5. How will the current folder breadcrumb get and update its path? (Tauri fs API or
   Julia `pwd()` call?)

6. What changes are needed in tauri.conf.json for JuliaLab branding?

If the plan is missing any of these, add them before approving the plan.
```

---

### Step 5 — Generate the Task Breakdown

```
Using the plan, run:

  specify tasks 001-julialab-core

After generation, open .specify/tasks/001-julialab-core/tasks.md and verify:

1. Tasks are ordered correctly — no task depends on another task that appears
   later in the list.

2. Each task has a clear "done when" condition that maps to a Phase 1 success
   criterion from the constitution.

3. The first 3 tasks should be:
   - Task 1: Rename/rebrand Compute42 → JuliaLab in tauri.conf.json, package.json,
     window title, and create the JuliaLab icon
   - Task 2: Implement the 4-panel layout in the main Vue component
   - Task 3: Implement the ribbon tab bar and the HOME tab button groups

   If the generated tasks differ significantly from this order, reorder them and
   explain why before proceeding.

4. Confirm there are no Phase 2+ tasks in this list.

Show me the final task list and wait for my approval before starting any implementation.
```

---

### Step 6 — Create CLAUDE.md

```
Create a CLAUDE.md file in the project root with the following content:

---
# CLAUDE.md — JuliaLab Session Memory

## Project
JuliaLab: MATLAB-inspired Julia IDE. Fork of Compute42 (Tauri 2 + Vue 3 + Actix).

## Current Phase
Phase 1 — Foundation

## Current Task
[AGENT: update this line each time you start a new task]

## Architecture (Non-Negotiable)
- Tauri 2 (Rust backend, Actix actors). DO NOT suggest Electron.
- Vue 3 Composition API (<script setup>). DO NOT use Options API.
- Monaco Editor. DO NOT suggest CodeMirror.
- Pinia for state. DO NOT use Vuex.
- Naive UI base components. May add AG Grid for workspace table.
- Julia is ALWAYS a subprocess. Never bundled. Never FFI.
- AI pane = Gemini CLI subprocess. Never direct API calls.
- Revise.jl ALWAYS loads at Julia session start. Never disable.

## Color Variables (never hardcode hex)
- --jl-accent-green: #389826  (Julia green — primary accent)
- --jl-accent-red:   #cb3c33  (Julia red — errors, stop button)
- --jl-accent-purple:#9558b2  (Julia purple — secondary accent)
- --jl-bg:           #1a1a1a  (main background)
- --jl-panel-bg:     #1e1e1e  (panel background)
- --jl-border:       #222222  (panel borders)
- --jl-font-mono:    'IBM Plex Mono', monospace
- --jl-font-ui:      'IBM Plex Sans', sans-serif

## Fonts
IBM Plex Mono (code), IBM Plex Sans (UI). Import from Google Fonts.
DO NOT use Inter, Roboto, system-ui as the primary fonts.

## Key Files (update if structure changes)
- Main layout component: [AGENT: fill in after codebase audit]
- Julia process actor: [AGENT: fill in after codebase audit]
- Workspace store: [AGENT: fill in after codebase audit]
- Theme CSS: app/src/styles/theme.css (create if missing)

## Spec Kit
- Constitution: .specify/constitution.md
- Codebase audit: .specify/codebase-audit.md
- Active spec: .specify/specs/001-julialab-core/spec.md
- Active plan: .specify/plans/001-julialab-core/plan.md
- Active tasks: .specify/tasks/001-julialab-core/tasks.md

## Rules
1. One task at a time. Complete + test + confirm before moving on.
2. No Phase 2+ work until Phase 1 tasks are all done.
3. All colors via CSS variables. No hardcoded hex in Vue/TS files.
4. Conventional Commits: feat:, fix:, refactor:, docs:, test:
5. All new Tauri commands need Rust unit tests.
6. All new Pinia stores need Vitest unit tests.
7. Before implementing anything ambiguous, ask — don't guess.
---

Save CLAUDE.md and confirm it was written correctly.
```

---

### Step 7 — Begin Phase 1, Task 1 (Rebrand)

```
We are ready to begin implementation. Start with Task 1 from
.specify/tasks/001-julialab-core/tasks.md: rebrand Compute42 to JuliaLab.

Before making changes, list every file that contains the string "compute42" or
"Compute42" (case-insensitive). Then:

1. Update tauri.conf.json:
   - productName: "JuliaLab"
   - identifier: "org.julialab.ide"
   - windowTitle: "JuliaLab"

2. Update package.json: name to "julialab", description to
   "A MATLAB-inspired desktop IDE for the Julia programming language"

3. Update the main window title in any Rust or Vue code that sets it explicitly.

4. Create app/src/styles/theme.css with all --jl- CSS variables listed in CLAUDE.md.
   Import this file in app/src/main.ts (or App.vue if that's the entry point).

5. Do NOT change any functional code. Rebrand only.

After changes, run `npm run tauri dev` and confirm the window title shows "JuliaLab".
Update the Current Task line in CLAUDE.md to "Task 2 — 4-panel layout".
Show me the result before proceeding.
```

---

## Part 3: Ongoing Claude Code Workflow

### Starting Each New Task

```
I've reviewed Task N and I'm ready to proceed. Start Task N:
[task description from tasks.md]

Before writing any code:
1. Tell me which files you will modify and why.
2. Tell me if anything in this task conflicts with the constitution or CLAUDE.md.
3. Tell me what test you will write to confirm the task is done.

Then implement, test, and show me the result.
```

### When Claude Code Gets Stuck or Goes Off-Track

```
Stop. Do not continue. Re-read CLAUDE.md and the constitution.
Tell me what you were trying to do, what went wrong, and what
your next proposed approach is. Wait for my confirmation before
writing any more code.
```

### Switching Tools (Gemini CLI for Large Refactors)

When a task involves reading many files at once (e.g., understanding a large
component tree), use Gemini CLI's 1M context window:

```bash
# In your terminal, not in Claude Code:
find . -name "*.vue" -o -name "*.ts" | xargs cat | gemini "Summarize the Vue component
architecture of this Tauri app. Which component is the layout root?"
```

Use Gemini for reading/understanding; use Claude Code for writing/implementing.

### Compacting Claude Code Context

When Claude Code's context gets long (watch for slower responses):

```
/compact

After compacting, re-read CLAUDE.md and tell me:
1. What phase are we in?
2. What task are we currently on?
3. What was the last thing completed?
4. What is the next step?
```

### Validating the Build After Every Task

After each task, always run this sequence:

```
Run the following and report the results:
1. npm run lint (ESLint — must be clean)
2. cargo clippy -- -D warnings (must be zero warnings)
3. npm test (Vitest — all tests pass)
4. cargo test (Rust tests — all pass)
5. npm run tauri dev (app launches and the task's acceptance criteria are met)

If anything fails, fix it before marking the task complete.
```

---

## Part 4: Gotchas & Pre-emptive Warnings

These are known issues likely to waste hours if not anticipated.

| # | Gotcha | How to Avoid |
|---|--------|-------------|
| 1 | **Tauri 2 breaking changes from v1** | Compute42 may target Tauri 1.x. Check `src-tauri/Cargo.toml`. If it's Tauri 1, upgrade to 2 as the very first task — the API changes are significant. |
| 2 | **Julia startup time** | Julia's JIT means first execution is slow. Never report "Julia is broken" until you've waited 30 seconds and tried a second command. |
| 3 | **Revise.jl type redefinition** | Revise cannot reload a changed struct definition. Build a UI notification that detects this error and offers "Restart Julia session". |
| 4 | **Monaco + Vue reactivity** | Monaco manages its own DOM. Use an editor instance ref, not v-model. The existing Compute42 integration handles this — don't re-implement it. |
| 5 | **WGLMakie WebSocket port conflicts** | WGLMakie starts its own server. If the port is in use, plots silently fail. Reserve a port range and pass it to WGLMakie via `Makie.set_window_config!(port=XXXX)`. |
| 6 | **Windows path separators** | All Julia `include()` and file paths from Tauri must use forward slashes or `joinpath()`. Backslash paths will fail on Windows inside Julia strings. |
| 7 | **Tauri allowlist** | Tauri 2 requires explicit permission for every filesystem, shell, and window operation in `tauri.conf.json`. Forgetting this causes silent failures with no error. |
| 8 | **IBM Plex fonts offline** | Google Fonts requires internet. Bundle IBM Plex Mono and Sans as local font files for offline use. |
| 9 | **Gemini CLI auth** | `gemini auth` opens a browser. In headless CI, this hangs. Ensure the AI pane is never initialized in test/CI environments. |
| 10 | **Naive UI tree shaking** | Import Naive UI components individually to avoid bundling the entire library. Check Compute42's existing import pattern first. |
