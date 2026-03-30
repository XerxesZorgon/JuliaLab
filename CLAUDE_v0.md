# Julia IDE Project (forked from Compute42)

## Project Goal
Build a MATLAB-style Julia IDE by extending Compute42. The target users are 
scientists and engineers migrating from MATLAB to Julia who want a familiar interface.

## Tech Stack
- Frontend: Vue 3 + TypeScript + Naive UI + Monaco Editor
- Desktop shell: Tauri 2 (Rust backend)
- Julia integration: LanguageServer.jl via LSP, direct process management
- State management: Pinia
- Build: Vite + npm

## Architecture Overview
- /app — Tauri app with Vue 3 frontend (npm run tauri dev to launch)
- /internals — Rust backend actor system (Actix)
- /languageserver — Embedded Julia language server
- /shared — Shared types between frontend and backend

## Development Commands
- Start dev server: cd app && npm run tauri dev
- Build: cd app && npm run tauri build
- Prerequisites: Rust (stable), Node.js 18+, Julia installed and on PATH

## Current Phase
Phase 1 complete — ready for Phase 2

## Design Principles
- Layout must feel immediately familiar to MATLAB users
- Default panels: File Browser (left), Editor (center-top), 
  Command Window (bottom), Workspace/Variables (right)
- All panels must be resizable
- Julia-green accent color: #389826
- Do NOT change the Tauri/Vue/Rust stack without discussion

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

## Key Files (from codebase audit)
### Frontend (Vue 3)
- Main layout component: app/app/src/components/layouts/MainLayout.vue
- Root component: app/app/src/App.vue
- Editor view: app/app/src/components/HomeView/EditorView.vue
- Terminal view: app/app/src/components/HomeView/TerminalView.vue
- Variables panel: app/app/src/components/HomeView/VariablesPanel.vue
- Monaco editor: app/app/src/components/HomeView/MonacoEditorInstance.vue
- File explorer: app/app/src/components/shared/FileExplorer.vue
- Router: app/app/src/router/index.ts
- Main entry: app/app/src/main.ts

### Pinia Stores
- Workspace store: app/app/src/store/appStore.ts
- Terminal store: app/app/src/store/terminalStore.ts
- Plot store: app/app/src/store/plotStore.ts
- Settings store: app/app/src/store/settingsStore.ts

### Backend (Rust/Actix)
- Julia process actor: app/internals/src/actors/process_actor/mod.rs
- Julia lifecycle (spawning): app/internals/src/actors/process_actor/lifecycle.rs
- LSP actor: app/internals/src/actors/lsp_actor/mod.rs
- Plot actor: app/internals/src/actors/plot_actor/mod.rs
- Tauri commands (generic): app/app/src-tauri/src/commands/generic.rs
- Tauri commands (LSP): app/app/src-tauri/src/commands/lsp.rs
- Tauri commands (files): app/app/src-tauri/src/commands/files.rs
- Main Tauri entry: app/app/src-tauri/src/lib.rs

### Configuration
- Tauri config: app/app/src-tauri/tauri.conf.json
- Package.json: app/app/package.json
- Cargo manifest: app/app/src-tauri/Cargo.toml
- Theme CSS: app/app/src/styles/theme.css (create if missing)

## Spec Kit Files
- Constitution: spec/constitution.md
- Codebase audit: spec/codebase-audit.md
- Preflight checklist: spec/julialab-preflight.md

## Architecture Rules (Non-Negotiable)
- Tauri 2 (Rust backend, Actix actors). DO NOT suggest Electron.
- Vue 3 Composition API (<script setup>). DO NOT use Options API.
- Monaco Editor. DO NOT suggest CodeMirror.
- Pinia for state. DO NOT use Vuex.
- Naive UI base components. May add AG Grid for workspace table.
- Julia is ALWAYS a subprocess. Never bundled. Never FFI.
- Revise.jl ALWAYS loads at Julia session start. Never disable.

## Development Rules
1. One task at a time. Complete + test + confirm before moving on.
2. All colors via CSS variables. No hardcoded hex in Vue/TS files.
3. Conventional Commits: feat:, fix:, refactor:, docs:, test:
4. All new Tauri commands need Rust unit tests.
5. All new Pinia stores need Vitest unit tests.
6. Before implementing anything ambiguous, ask — don't guess.
```

---

## Prompting Strategy for Claude Code

Because you have limited prompts per session, **one big, well-specified prompt beats five small ones**. Here are the prompts to use for each phase:

### Phase 1 — Orientation (1–2 prompts)
```
Read the entire project structure and summarize:
1. How the Julia process is spawned and managed in the Rust backend
2. How frontend Vue components communicate with Tauri via invoke() calls  
3. Which Vue component currently controls the main layout
4. How the variable viewer currently works
Give me a file map of the 10 most important files I'll need to modify.
```

### Phase 2 — MATLAB Layout (3–5 prompts)
```
Redesign App.vue and the main layout to implement a classic 4-panel 
MATLAB-style interface:
- Left panel (200px default): File explorer (already exists, relocate here)
- Center-top panel (flex grow): Monaco editor
- Bottom panel (250px default): Julia REPL/Command Window  
- Right panel (280px default): Workspace variable viewer
All panels must be resizable using CSS resize or a Vue drag-resize library.
Add a top toolbar bar with: current directory breadcrumb, Run (▶), 
Run Section, Save, and New File buttons.
Preserve all existing Tauri invoke() calls and component logic.
```

### Phase 3 — Workspace Panel (2–3 prompts)
```
Enhance the variable viewer component into a full MATLAB-style Workspace panel.
It should display a table with columns: Name, Type, Size, Value (preview).
Use Naive UI's DataTable component. Data should come from the existing 
variable inspection mechanism in the Julia backend.
Double-clicking a variable should open a modal array editor showing a 
spreadsheet grid of the variable's contents (use a simple HTML table 
for the grid, editable cells for scalar/vector/matrix types).
```

### Phase 4 — Cell Mode (1–2 prompts)
```
Add MATLAB-style cell mode to the Monaco Editor:
1. Detect lines starting with `##` as cell delimiters (Julia convention)
2. Highlight the current cell with a subtle background color in Monaco
3. Add "Run Cell" and "Run Cell and Advance" to the toolbar
4. Wire these to execute only the current cell's code in the Julia REPL

In `lifecycle.rs`, notice this line near the top of the function:
command.env("COMPUTE42_DATA_DIR", &data_dir);
And the Julia depot path still uses com.compute42.dev. These will need updating to org.julialab.ide in a follow-up — but don't do it now, it could break the Julia environment path and is a separate rebrand task. 