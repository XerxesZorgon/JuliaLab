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
[Update this as you progress through phases]
Phase 1: Familiarization complete
Phase 2: MATLAB-style 4-panel layout — IN PROGRESS

## Design Principles
- Layout must feel immediately familiar to MATLAB users
- Default panels: File Browser (left), Editor (center-top), 
  Command Window (bottom), Workspace/Variables (right)
- All panels must be resizable
- Julia-green accent color: #389826
- Do NOT change the Tauri/Vue/Rust stack without discussion

## Key Files
- app/src/App.vue — main layout
- app/src/components/ — UI components
- app/src-tauri/src/ — Rust/Tauri backend commands
- internals/src/ — actor system and Julia process management
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