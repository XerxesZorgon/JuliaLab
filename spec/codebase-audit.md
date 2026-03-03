# JuliaLab Codebase Audit — Compute42 Fork Analysis

**Date:** 2026-03-02
**Auditor:** Claude Code (Sonnet 4.5)
**Source:** Compute42 (https://github.com/elan8/compute42)
**Purpose:** Pre-implementation architectural analysis for JuliaLab MATLAB-style IDE

---

## Executive Summary

Compute42 is a **Tauri 2.x** desktop application with a Vue 3 frontend, Rust Actix backend, and Julia subprocess integration. It provides a functional Julia IDE with LSP support, xterm.js REPL, variable inspection, and plot rendering. The architecture is well-suited for extension into a MATLAB-inspired 4-panel layout.

**Key Findings:**
- ✅ Tauri 2.x confirmed (no migration needed)
- ✅ ProcessActor manages Julia subprocess spawning and communication
- ✅ 50+ invoke() calls provide comprehensive frontend-backend API
- ✅ xterm.js-based REPL is production-ready
- ✅ LanguageServer.jl integration via JSON-RPC over pipes
- ⚠️ Current layout is 3-pane (left sidebar, center, right panel) — needs restructuring for 4-panel MATLAB layout
- ⚠️ LSP signature help and document symbols not yet implemented
- ⚠️ Variable pagination for large arrays not implemented

---

## 1. Critical Version Check: Tauri 2.x Confirmed

**File:** `app/app/src-tauri/Cargo.toml` (lines 21, 28-35)

```toml
[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-log = "2"
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
tauri-plugin-shell = "2"
tauri-plugin-process = "2"
```

**Frontend:** `@tauri-apps/api: ^2.7.0` in `package.json`

**Conclusion:** This is **Tauri 2.x**. No migration required. All Phase 1 work can proceed directly.

---

## 2. Julia Subprocess Spawning & Management

### Responsible Rust Actor: ProcessActor

**Primary Files:**
- **Process lifecycle:** `app/internals/src/actors/process_actor/lifecycle.rs` (lines 15-138)
- **Actor definition:** `app/internals/src/actors/process_actor/mod.rs`
- **Output monitoring:** `app/internals/src/actors/process_actor/output_monitoring.rs`

### Exact Spawn Command (lifecycle.rs lines 42-93)

```rust
let mut command = Command::new(&julia_path);

// Windows-specific: prevent console window
#[cfg(target_os = "windows")]
command.creation_flags(0x08000000); // CREATE_NO_WINDOW

// Environment setup
command.env("COMPUTE42_DATA_DIR", &data_dir);
command.env("GKSwstype", "nul"); // Prevent GR graphics window
command.env("JULIA_DEPOT_PATH", julia_depot_path);
command.env("JULIA_PROJECT", julia_project_path);

// Optional: auto-detect and activate Julia project
if let Some(project_path) = state.find_julia_project() {
    command.arg(format!("--project={}", project_path));
}

// Julia arguments
command
    .arg("--startup-file=no")
    .arg("-t1")
    .arg("--history-file=no");

// Stdio setup
command
    .stdin(Stdio::piped())
    .stdout(Stdio::piped())
    .stderr(Stdio::piped());

// Spawn
let julia_process = command.spawn()?;
```

### Process Communication Flow

1. **ProcessActor** creates named pipes (`to_julia`, `from_julia`)
2. Spawns Julia with `tokio::process::Command::spawn()`
3. Creates `PersistentJuliaSession` wrapper with stdout/stderr monitors
4. Executes setup code via pipes to establish communication channel
5. Forwards Julia messages to **CommunicationActor** via **EventManager**
6. Frontend listens for events like `julia-output`, `workspace:variables-updated`, `plot-added`

### Key Actors Involved

- **ProcessActor** — manages Julia process lifecycle
- **CommunicationActor** — handles bidirectional communication with Julia
- **EventManager** — broadcasts events to frontend via Tauri's event system
- **PlotActor** — stores and manages plot data

---

## 3. Frontend-Tauri Communication: Complete invoke() Call Inventory

All Vue components use `invoke()` from `@tauri-apps/api/core`. Below is the complete list grouped by functional category.

### 3.1 Startup & Orchestration

| invoke() Call | Vue Component | Rust Command File |
|---------------|---------------|-------------------|
| `continue_orchestrator_startup` | App.vue (line 174) | generic.rs |
| `frontend_ready_handshake` | App.vue (lines 211, 217) | generic.rs |
| `get_orchestrator_startup_phase` | App.vue (line 191) | generic.rs |
| `restart_julia_orchestrator` | TerminalMenuBar.vue | orchestrator_tauri.rs |

### 3.2 Julia Code Execution

| invoke() Call | Parameters | Vue Component | Rust Command File |
|---------------|------------|---------------|-------------------|
| `execute_julia_code` | `{ code, command_type }` | App.vue (line 624), TerminalView.vue | generic.rs |
| `execute_julia_file` | `{ filePath, fileContent }` | EditorView.vue | generic.rs |
| `get_session_status` | — | TerminalView.vue | generic.rs |
| `is_backend_ready` | — | TerminalView.vue | generic.rs |

### 3.3 File Operations

| invoke() Call | Parameters | Vue Component | Rust Command File |
|---------------|------------|---------------|-------------------|
| `write_file_content` | `{ path, content }` | EditorView.vue | commands/files.rs |
| `read_file_content` | `{ path }` | ReferencesPanel.vue | commands/files.rs |
| `get_file_tree` | `{ rootPath }` | FileExplorer.vue | commands/files.rs |
| `load_directory_contents` | `{ path }` | FileExplorer.vue | commands/files.rs |
| `create_file_item` | `{ path }` | FileExplorer.vue | commands/files.rs |
| `create_folder_item` | `{ path }` | FileExplorer.vue | commands/files.rs |
| `rename_item` | `{ oldPath, newPath }` | FileExplorer.vue | commands/files.rs |
| `delete_item` | `{ path }` | FileExplorer.vue | commands/files.rs |
| `set_last_opened_folder` | `{ path }` | FileExplorer.vue | commands/files.rs |
| `start_file_watcher` | `{ path }` | FileExplorer.vue | commands/files.rs |
| `stop_file_watcher` | — | FileExplorer.vue | commands/files.rs |

### 3.4 LSP (Language Server Protocol)

| invoke() Call | Parameters | Vue Component | Rust Command File |
|---------------|------------|---------------|-------------------|
| `lsp_initialize` | `{ project_path }` | — | commands/lsp.rs |
| `lsp_shutdown` | — | — | commands/lsp.rs |
| `lsp_restart` | `{ project_path }` | — | commands/lsp.rs |
| `lsp_notify_did_open` | `{ uri, language }` | MonacoEditorInstance.vue, EditorView.vue | commands/lsp.rs |
| `lsp_notify_did_close` | `{ uri }` | — | commands/lsp.rs |
| `lsp_notify_did_change` | `{ uri, changes }` | — | commands/lsp.rs |
| `lsp_notify_did_save` | `{ uri }` | EditorView.vue | commands/lsp.rs |
| `lsp_hover` | `{ uri, line, character }` | — | commands/lsp.rs |
| `lsp_completions` | `{ uri, line, character }` | — | commands/lsp.rs |
| `lsp_signature_help` | `{ uri, line, character }` | — | commands/lsp.rs |
| `lsp_definition` | `{ uri, line, character }` | — | commands/lsp.rs |
| `lsp_references` | `{ uri, line, character }` | — | commands/lsp.rs |
| `lsp_document_symbols` | `{ uri }` | — | commands/lsp.rs |
| `lsp_diagnostics` | `{ uri }` | — | commands/lsp.rs |
| `lsp_is_running` | — | — | commands/lsp.rs |

**Note:** `lsp_signature_help` and `lsp_document_symbols` are defined but return "not yet implemented" errors (commands/lsp.rs lines 140-141, 207).

### 3.5 Plots

| invoke() Call | Parameters | Vue Component | Rust Command File |
|---------------|------------|---------------|-------------------|
| `get_plot` | `{ plot_id }` | plotStore.ts | commands/plot.rs |
| `get_all_plots` | — | plotStore.ts | commands/plot.rs |
| `get_plots_by_source_file` | `{ source_file }` | plotStore.ts | commands/plot.rs |
| `delete_plot` | `{ plot_id }` | plotStore.ts | commands/plot.rs |
| `clear_all_plots` | — | plotStore.ts | commands/plot.rs |

### 3.6 Workspace Variables

| invoke() Call | Parameters | Vue Component | Rust Command File |
|---------------|------------|---------------|-------------------|
| `get_variable_value` | `{ variableName }` | VariablesPanel.vue | commands/generic.rs (line 584) |
| `refresh_workspace_variables` | — | VariablesPanel.vue | commands/generic.rs (line 557) |

### 3.7 Project & Terminal Management

| invoke() Call | Parameters | Vue Component | Rust Command File |
|---------------|------------|---------------|-------------------|
| `init_terminal_session` | `{ cwd }` | MainLayout.vue | commands/process.rs |
| `close_terminal_session` | `{ session_id }` | MainLayout.vue | commands/process.rs |
| `instantiate_julia_project` | — | FileExplorer.vue | commands/projects.rs |

### 3.8 Julia Version & Info

| invoke() Call | Parameters | Vue Component | Rust Command File |
|---------------|------------|---------------|-------------------|
| `get_julia_version` | — | JuliaInfoModal.vue, JuliaSettingsModal.vue | commands/utils.rs |
| `get_julia_storage_paths` | — | JuliaInfoModal.vue, JuliaSettingsModal.vue | commands/utils.rs |
| `get_depot_size_info` | — | JuliaInfoModal.vue, JuliaSettingsModal.vue | commands/utils.rs |

### 3.9 Package Management

| invoke() Call | Parameters | Vue Component | Rust Command File |
|---------------|------------|---------------|-------------------|
| `create_new_julia_project` | `{ project_name, location }` | NewJuliaProjectDialog.vue | commands/projects.rs |
| `run_julia_pkg_command` | `{ command, package_name }` | PkgOperationsDialog.vue | commands/packages.rs |
| `get_julia_package_status` | — | PkgOperationsDialog.vue | commands/packages.rs |
| `clean_transitive_dependencies` | — | PkgOperationsDialog.vue | commands/packages.rs |

### 3.10 Project Configuration

| invoke() Call | Parameters | Vue Component | Rust Command File |
|---------------|------------|---------------|-------------------|
| `read_project_toml` | `{ projectPath }` | ProjectTomlConfigDialog.vue | commands/projects.rs |
| `write_project_toml` | `{ config }` | ProjectTomlConfigDialog.vue | commands/projects.rs |
| `generate_uuid` | — | ProjectTomlConfigDialog.vue | commands/projects.rs |

### 3.11 Notebooks

| invoke() Call | Parameters | Vue Component | Rust Command File |
|---------------|------------|---------------|-------------------|
| `write_notebook` | `{ path, content }` | NotebookViewer.vue | commands/notebook.rs |

### 3.12 Other

| invoke() Call | Parameters | Vue Component | Rust Command File |
|---------------|------------|---------------|-------------------|
| `get_app_version` | — | StartupModal.vue | commands/generic.rs |

**Total:** 50+ invoke() calls providing comprehensive backend API coverage.

---

## 4. Top-Level Layout Component

### Component Hierarchy

```
App.vue (root component)
├─ ErrorScreen (conditional: system errors)
├─ WelcomeModal (conditional: first-time setup)
├─ StartupModal (conditional: backend initialization)
├─ ProjectSwitchModal (conditional: project activation)
└─ router-view → MainLayout.vue
    ├─ NavigationRail (left: 60px) — sidebar navigation
    ├─ Splitpanes (main area: 3-pane horizontal layout)
    │  ├─ Pane 1 (left, ~200px default, resizable)
    │  │  └─ LeftPanelAccordion
    │  │     ├─ FileExplorer
    │  │     └─ Other panels (variables, project info, etc.)
    │  ├─ Pane 2 (center, flex grow)
    │  │  └─ router-view → EditorLayout
    │  │     ├─ EditorView (Monaco editor)
    │  │     └─ TerminalView (xterm.js REPL)
    │  └─ Pane 3 (right, ~280px, conditional)
    │     └─ ReferencesPanel (when LSP references active)
    └─ RightNavigationRail (right: 60px) — right sidebar
```

### Key Files

| Component | File Path | Lines | Purpose |
|-----------|-----------|-------|---------|
| **App.vue** | `app/app/src/App.vue` | 1-816 | Root component, orchestrates startup and error states |
| **MainLayout.vue** | `app/app/src/components/layouts/MainLayout.vue` | 1-145 | Primary layout container with 3-pane splitpanes |
| **LeftPanelAccordion.vue** | `app/app/src/components/layouts/LeftPanelAccordion.vue` | 1-200+ | File browser + project panels accordion |
| **EditorLayout.vue** | `app/app/src/components/HomeView/EditorLayout.vue` | 1-100+ | Splits editor and terminal vertically |
| **EditorView.vue** | `app/app/src/components/HomeView/EditorView.vue` | 1-400+ | Monaco editor with LSP integration |
| **TerminalView.vue** | `app/app/src/components/HomeView/TerminalView.vue` | 1-500+ | xterm.js-based Julia REPL |
| **NavigationRail** | `app/app/src/components/layouts/NavigationRail.vue` | 1-100+ | Left sidebar navigation |
| **RightNavigationRail** | `app/app/src/components/layouts/RightNavigationRail.vue` | 1-100+ | Right sidebar navigation |

### Current Layout vs. MATLAB Target

**Current (Compute42):**
```
┌──┬─────────────────────┬──┐
│  │ File Explorer       │  │
│  ├─────────────────────┤  │
│N │ Monaco Editor       │R │
│a ├─────────────────────┤a │
│v │ Terminal (xterm.js) │i │
│  │                     │l │
└──┴─────────────────────┴──┘
```

**Target (MATLAB 4-panel):**
```
┌─────────────┬───────────────────┬────────────┐
│             │                   │            │
│ File        │ Monaco Editor     │ Workspace  │
│ Explorer    │ (center-top)      │ Variables  │
│             │                   │            │
│ (200px)     ├───────────────────┤ (280px)    │
│             │ Terminal/REPL     │            │
│             │ (center-bottom)   │            │
└─────────────┴───────────────────┴────────────┘
```

**Required Changes:** See Section 10 for detailed file modification plan.

---

## 5. Workspace/Variable Viewer

### Architecture

**Backend (Rust) → Frontend (Vue) Data Flow:**

1. **Julia Process** introspects workspace → sends variable data to ProcessActor
2. **CommunicationActor** receives variable data from Julia message loop
3. **EventManager** emits unified event: `workspace:variables-updated`
4. **App.vue** listens (lines 161-165) and updates appStore
5. **VariablesPanel.vue** reads from appStore and displays

### Implementation Files

| Component | File Path | Lines | Purpose |
|-----------|-----------|-------|---------|
| **Event listener** | `app/app/src/App.vue` | 161-165 | Listens for `workspace:variables-updated` |
| **Pinia store** | `app/app/src/store/appStore.ts` | 44-100 | State: `workspaceVariables` ref |
| **UI Component** | `app/app/src/components/HomeView/VariablesPanel.vue` | 1-400+ | Displays variable list + details modal |
| **Backend commands** | `app/app/src-tauri/src/commands/generic.rs` | 557-610 | `get_variable_value()`, `refresh_workspace_variables()` |

### Variable Data Format

**From Backend (Rust):**
```rust
Record<string, any>  // Variable name → variable object
```

**Variable Object Structure (inferred from frontend):**
```typescript
{
  name: string,
  type: string,          // Julia type (e.g., "Vector{Float64}")
  value: any,            // Serialized value or preview
  dimensions?: string,   // e.g., "3×4"
  is_expandable?: boolean,
  size_bytes?: number,
  ...
}
```

### Current Features

- **List View:** Displays all workspace variables in expandable list
- **Detail Modal:** Shows type, size, value preview with metadata
- **Array Display:** Renders arrays/matrices as HTML tables (lines 96-130)
- **DataFrame Support:** Displays DataFrame columns
- **On-Demand Fetch:** `invoke('get_variable_value', { variableName })` for full data

### Known Limitations

- **No Pagination:** Large arrays show first 10,000 characters with truncation warning (line 88)
- **No Editable Cells:** Array viewer is read-only (MATLAB-style array editor needed for Phase 3)

---

## 6. Plot Viewer

### Architecture

**Julia → Rust → Vue Data Flow:**

1. **Julia** calls Plots.jl/Makie.jl backend → generates plot image (PNG/SVG)
2. **Julia** sends plot data to Rust via named pipes
3. **PlotActor** (`app/internals/src/actors/plot_actor/mod.rs`) stores plot data
4. **EventManager** emits unified event: `plot-added`, `plot-updated`, `plot-deleted`
5. **plotStore.ts** listens and updates plot map
6. **Frontend** displays plot via Base64-encoded image URL

### Implementation Files

| Component | File Path | Lines | Purpose |
|-----------|-----------|-------|---------|
| **Backend actor** | `app/internals/src/actors/plot_actor/mod.rs` | 1-200+ | Manages plot storage |
| **Tauri commands** | `app/app/src-tauri/src/commands/plot.rs` | 1-100+ | `get_plot()`, `get_all_plots()`, etc. |
| **Pinia store** | `app/app/src/store/plotStore.ts` | 1-300+ | State: `plots` Map, `currentPlotId` |
| **Event listeners** | `app/app/src/store/plotStore.ts` | 69-120 | Listens for `plot-*` events |

### Plot Data Structure (Rust)

```rust
struct PlotData {
    id: String,
    source_file: Option<String>,
    data: Vec<u8>,        // Binary image data
    mime_type: String,    // "image/png", "image/svg+xml"
    created_at: DateTime,
    ...
}
```

### Frontend Plot Store (Pinia)

**State:**
- `plots: Map<string, PlotData>` — all plots indexed by ID
- `currentPlotId: Ref<string | null>` — selected plot
- `plotServerPort: number` — plot server port (if using WebSocket)

**Actions:**
- `addPlot(plot)` — add new plot to map
- `updatePlot(plot)` — update existing plot
- `deletePlot(id)` — remove plot
- `setCurrentPlot(id)` — select plot for display

**Events:**
- `plot-added` → `addPlot()`
- `plot-updated` → `updatePlot()`
- `plot-deleted` → `deletePlot()`

### Current Implementation

- **Format:** PNG/SVG images as Base64 data URIs
- **Rendering:** `<img>` tags in Vue components
- **Storage:** In-memory plot map (PlotActor)
- **Display:** Modal or inline image viewers

### Future Enhancement (Phase 3+)

- **WGLMakie WebSocket:** Interactive 3D plots with mouse controls
- **Figure System:** MATLAB-style figure windows with toolbar (zoom, pan, export)

---

## 7. LanguageServer.jl Integration

### LSP Architecture

**Backend (Rust):**

| Component | File Path | Purpose |
|-----------|-----------|---------|
| **LspActor** | `app/internals/src/actors/lsp_actor/mod.rs` | Manages LSP server lifecycle |
| **Tauri Commands** | `app/app/src-tauri/src/commands/lsp.rs` | 280 lines of LSP request handlers |

**Protocol:** JSON-RPC over stdin/stdout pipes (same mechanism as Julia subprocess)

**LSP Server:** LanguageServer.jl package spawned as subprocess

### LSP Lifecycle

1. **Initialization:** `invoke('lsp_initialize', { project_path })`
   - Spawns `julia --startup-file=no -e 'using LanguageServer; ...'`
   - Sends LSP `initialize` request with project root
   - Waits for `initialized` notification

2. **Document Sync:** Monaco editor notifies LSP of file changes
   - `lsp_notify_did_open` — file opened
   - `lsp_notify_did_change` — content changed
   - `lsp_notify_did_save` — file saved

3. **Feature Requests:** Synchronous invoke() calls
   - `lsp_hover` → hover information
   - `lsp_completions` → autocomplete suggestions
   - `lsp_definition` → go to definition
   - `lsp_references` → find all references
   - `lsp_diagnostics` → syntax/type errors

4. **Shutdown:** `invoke('lsp_shutdown')` or `invoke('lsp_restart', { project_path })`

### Frontend Integration

**File:** `app/app/src/components/HomeView/MonacoEditorInstance.vue`

**Monaco Editor Setup:**
- Registers Julia language definition
- Configures TextMate grammar for syntax highlighting
- Sets up LSP request hooks (completions, hover, diagnostics)
- Notifies LSP of document open/close via Tauri commands

**Connection Method:**
- **NOT** a persistent WebSocket/TCP LSP connection
- **invoke()-based request/response model** — each LSP action is a separate Tauri command
- Simpler than native LSP client, but slightly higher latency

### Implemented LSP Features

✅ **Working:**
- Code completions (autocomplete menu)
- Diagnostics (red squiggles for errors)
- Go to definition
- Find references
- Hover information
- Document open/close/change tracking

⚠️ **Not Yet Implemented (commands/lsp.rs):**
- `lsp_signature_help` (line 140-141) — "not yet implemented in Rust LSP"
- `lsp_document_symbols` (line 207) — "not yet implemented"

### Known Issues

- LSP startup can be slow (Julia JIT warmup)
- No status indicator for LSP readiness (Phase 2 feature: "LSP ready ●" in status bar)

---

## 8. REPL/Terminal Component

### Technology: xterm.js

**Package:** `@xterm/xterm: ^5.5.0` (package.json)

**File:** `app/app/src/components/HomeView/TerminalView.vue` (500+ lines)

### xterm.js Configuration

**Addons Used:**
- **FitAddon** — responsive terminal sizing (fits to container)
- **SerializeAddon** — state serialization (for session persistence)

**Features Implemented:**
- Full terminal emulation (ANSI colors, cursor control, escape sequences)
- Custom key handlers for Julia REPL (Enter, Backspace, Ctrl+C)
- Input buffer management
- Prompt detection (tracks `julia>` prompt state)
- Multi-line input support
- Command history (via xterm's built-in history)

### Input/Output Flow

**Input (User → Julia):**
1. User types in terminal → xterm captures keypress
2. Input buffered in `inputBuffer` (TerminalView.vue line 54)
3. On Enter → `invoke('execute_julia_code', { code: inputBuffer })`
4. Input buffer cleared, awaiting Julia response

**Output (Julia → Terminal):**
1. Julia process stdout → ProcessActor monitors
2. ProcessActor emits event: `julia-output` or `julia-daemon-error`
3. TerminalStore listens (`app/app/src/store/terminalStore.ts` lines 74-100)
4. TerminalStore updates `juliaOutputBuffer`
5. TerminalView writes to xterm: `terminal.write(output)`

### Session Management

**Pinia Store:** `app/app/src/store/terminalStore.ts`

**State:**
- `activeTerminalId` — current terminal session ID
- `globalStreamInitialized` — Julia event listener ready
- `juliaOutputBuffer` — accumulated output
- `isBusy` — code execution in progress
- `hasShownInitialPrompt` — tracks initial `julia>` prompt

**Actions:**
- `initializeGlobalStream()` — start listening to Julia events
- `startGlobalStreamListening()` — setup event listeners for `julia-output`, `julia-daemon-error`
- `setBusy(bool)` — update execution status

### Terminal Features

- ✅ ANSI color support (syntax highlighting, error messages)
- ✅ Cursor positioning and control sequences
- ✅ Multi-line input (backspace, arrow keys)
- ✅ Responsive sizing (auto-fits to container)
- ✅ Prompt detection (knows when Julia is ready)

### Known Limitations

- No terminal session persistence across app restarts
- Single terminal session (no multiple REPL tabs)
- No terminal scrollback limit control

---

## 9. Pinia Stores (State Management)

All stores located in: `app/app/src/store/`

### Store 1: appStore.ts

**File:** `app/app/src/store/appStore.ts`

**State:**
```typescript
{
  projectPath: Ref<string>,               // Current Julia project directory
  fileToOpen: Ref<string | null>,         // Pending file to open in editor
  isJuliaProject: Ref<boolean>,           // Is current folder a Julia project?
  workspaceVariables: Ref<Record<string, any>>, // Variable name → variable data
  openFiles: Ref<string[]>,               // Currently open file tabs
  activeTab: Ref<string>,                 // Current active editor tab
  juliaDaemonReady: Ref<boolean>,         // Backend initialization status
  backendBusy: Ref<boolean>,              // Is Julia executing code?
  fileServerPort: Ref<number>,            // Port of file server
  lspStatus: Ref<{ status: string, error?: string }> // LSP status
}
```

**Actions:**
- `setProjectPath(path: string)` — update project directory
- `setWorkspaceVariables(vars: Record<string, any>)` — update variable map
- `setJuliaDaemonReady(ready: boolean)` — update backend status
- `setLspStatus(status: { status: string, error?: string })` — update LSP state
- `setBackendBusy(busy: boolean)` — update execution status
- `addOpenFile(path: string)` — add file tab
- `removeOpenFile(path: string)` — close file tab
- `setActiveTab(path: string)` — switch active tab

---

### Store 2: terminalStore.ts

**File:** `app/app/src/store/terminalStore.ts`

**State:**
```typescript
{
  activeTerminalId: Ref<string>,          // Current terminal session ID
  globalStreamInitialized: Ref<boolean>,  // Julia stream listener ready?
  juliaOutputBuffer: Ref<string>,         // Accumulated output
  isBusy: Ref<boolean>,                   // Code execution in progress?
  hasShownInitialPrompt: Ref<boolean>     // Has shown first `julia>` prompt?
}
```

**Actions:**
- `initializeGlobalStream()` — start listening to Julia output events
- `startGlobalStreamListening()` — setup event listeners (`julia-output`, `julia-daemon-error`)
- `setBusy(busy: boolean)` — update execution status
- `appendOutput(output: string)` — add text to output buffer
- `clearOutput()` — clear output buffer

---

### Store 3: plotStore.ts

**File:** `app/app/src/store/plotStore.ts`

**State:**
```typescript
{
  plots: Map<string, PlotData>,           // Plot ID → plot data
  currentPlotId: Ref<string | null>,      // Selected plot
  isListening: Ref<boolean>,              // Event listener active?
  plotServerPort: Ref<number>             // Plot server port (WebSocket)
}
```

**Actions:**
- `handlePlotEvent(event: PlotEvent)` — process `plot-added`, `plot-updated`, `plot-deleted`
- `setCurrentPlot(id: string)` — select plot for display
- `getPlot(id: string)` — fetch plot details via invoke()
- `getAllPlots()` — fetch all plots
- `deletePlot(id: string)` — delete plot
- `clearAllPlots()` — clear all plots

**Event Listeners (lines 69-120):**
- `plot-added` → add plot to map
- `plot-updated` → update existing plot
- `plot-deleted` → remove plot from map

---

### Store 4: settingsStore.ts

**File:** `app/app/src/store/settingsStore.ts`

**State:**
```typescript
{
  // Editor settings
  editor_font_family: Ref<string>,        // e.g., "JetBrains Mono"
  editor_font_size: Ref<number>,          // e.g., 14
  editor_word_wrap: Ref<boolean>,
  editor_tab_size: Ref<number>,           // e.g., 4
  editor_line_numbers: Ref<boolean>,
  editor_minimap: Ref<boolean>,
  editor_color_scheme: Ref<string>,       // e.g., "vs-dark"

  // Terminal settings
  terminal_font_family: Ref<string>,
  terminal_font_size: Ref<number>
}
```

**Actions:**
- `loadSettings()` — fetch settings from backend (localStorage or config file)
- `saveSettings()` — persist settings to backend
- Getter functions with defaults (e.g., `getEditorFontSize()` returns 14 if not set)

---

## 10. Files Requiring Modification for 4-Panel MATLAB Layout

**Ranked by Implementation Effort (Most → Least Work):**

### TIER 1: Critical — Major Refactoring Required

#### 1. MainLayout.vue (150-200 lines of changes)
**File:** `app/app/src/components/layouts/MainLayout.vue`

**Current Structure:**
- 3-pane horizontal layout: Left sidebar | Center | Right panel (conditional)
- Uses `vue-splitpanes` library
- Center pane contains router-view → EditorLayout → (Editor + Terminal vertically stacked)

**Required Changes:**
- Redesign to 4-pane MATLAB layout:
  ```
  LEFT (200px, resizable) | CENTER-TOP (flex) | RIGHT (280px, resizable)
                          | CENTER-BOTTOM (250px, resizable) |
  ```
- Restructure Splitpanes: nested horizontal and vertical splits
- Move TerminalView OUT of EditorLayout INTO MainLayout's bottom-center pane
- Move VariablesPanel OUT of LeftPanelAccordion INTO MainLayout's right pane
- Add resize handles for all 4 panels

**Lines to Modify:** 1-145 (entire component structure)

---

#### 2. EditorLayout.vue (100-150 lines of changes)
**File:** `app/app/src/components/HomeView/EditorLayout.vue`

**Current Structure:**
- Vertical split: Editor (top) + Terminal (bottom)

**Required Changes:**
- REMOVE TerminalView from this component (move to MainLayout)
- Convert to single-pane EditorView container
- Simplify to just editor panel management
- Update router-view integration

**Lines to Modify:** Most of component logic (exact lines unknown without full file read)

---

### TIER 2: High — Component Restructuring

#### 3. TerminalView.vue (50-100 lines of changes)
**File:** `app/app/src/components/HomeView/TerminalView.vue`

**Current Structure:**
- Self-contained xterm.js terminal component
- Manages own sizing and event listeners

**Required Changes:**
- Make fully resizable via parent props (accept height from MainLayout)
- Remove standalone sizing logic (defer to MainLayout's Splitpanes)
- Ensure xterm FitAddon works with parent-controlled sizing
- Add MATLAB-style terminal toolbar (clear, font size controls)

**Lines to Modify:** 1-100+ (styling and sizing logic)

---

#### 4. VariablesPanel.vue (50-100 lines of changes)
**File:** `app/app/src/components/HomeView/VariablesPanel.vue`

**Current Structure:**
- Accordion item in LeftPanelAccordion
- Displays variables in expandable list with modal details

**Required Changes:**
- Extract from accordion, make standalone right panel
- Add resizable handle integration
- Convert to MATLAB-style table layout (columns: Name | Type | Size | Value)
- Use Naive UI DataTable component (recommended in constitution)
- Add sortable columns
- Preserve modal for detailed variable inspection

**Lines to Modify:** 1-200+ (entire component restructure)

---

#### 5. LeftPanelAccordion.vue (50-100 lines of changes)
**File:** `app/app/src/components/layouts/LeftPanelAccordion.vue`

**Current Structure:**
- Accordion with multiple panels: FileExplorer, VariablesPanel, ProjectInfo, etc.

**Required Changes:**
- REMOVE VariablesPanel (moved to right panel)
- Keep ONLY FileExplorer in left panel
- Simplify to single-pane file browser
- Remove accordion logic (no longer needed)
- Rename to `FileExplorerPanel.vue` for clarity

**Lines to Modify:** 1-200+ (simplification)

---

### TIER 3: Medium — New Component Creation

#### 6. TopToolbar.vue (NEW FILE — 100-150 lines)
**File:** `app/app/src/components/layouts/TopToolbar.vue` (to be created)

**Required Content:**
- **Left section:** Current folder breadcrumb (clickable path segments)
- **Right section:** Button group
  - ▶ Run (F5) — execute current file
  - ▶▶ Run Section (Ctrl+Enter) — execute current cell (Phase 4 feature, add placeholder)
  - 💾 Save (Ctrl+S)
  - 📄 New File (Ctrl+N)

**Data Sources:**
- Current folder: from appStore.projectPath
- Button actions: invoke appropriate Tauri commands

**Styling:**
- MATLAB-style toolbar (light gray background, ~40px height)
- Icons + text labels
- Julia green accent color for Run button

**Estimated Lines:** 100-150

---

#### 7. RibbonBar.vue (NEW FILE — 200-300 lines)
**File:** `app/app/src/components/layouts/RibbonBar.vue` (to be created)

**Required Content:**
- Tab bar: HOME | PLOTS | APPS | LIVE EDITOR | INSERT | VIEW
- Tab content area (conditional rendering based on active tab)
- F2 toggle functionality (collapse/expand ribbon)
- Pin button (keep expanded)

**Phase 1 Requirement:**
- All 6 tabs render correctly
- F2 toggles visibility
- HOME tab shows basic button groups (New, Open, Save, Run)
- Other tabs show placeholder content

**Styling:**
- MATLAB R2025a ribbon aesthetic
- Julia green accent for active tab
- ~120px height when expanded, 30px when collapsed

**Estimated Lines:** 200-300

---

### TIER 4: Low — Styling & CSS Updates

#### 8. App.vue Global Styles (20-50 lines)
**File:** `app/app/src/App.vue` (lines 704-816)

**Required Changes:**
- Update splitpane colors to MATLAB-style grays
- Add CSS variables for panel backgrounds (`--jl-panel-bg`, `--jl-border`)
- Update scrollbar styling
- Add resize handle styling (Julia green accent on hover)

**Lines to Modify:** 704-816 (existing global styles section)

---

#### 9. theme.css (NEW FILE — 50-100 lines)
**File:** `app/app/src/styles/theme.css` (to be created as per CLAUDE.md)

**Required Content:**
```css
:root {
  /* Julia brand colors */
  --jl-accent-green: #389826;
  --jl-accent-red:   #cb3c33;
  --jl-accent-purple:#9558b2;

  /* Background colors */
  --jl-bg:           #1a1a1a;
  --jl-panel-bg:     #1e1e1e;
  --jl-border:       #222222;

  /* Fonts */
  --jl-font-mono:    'IBM Plex Mono', monospace;
  --jl-font-ui:      'IBM Plex Sans', sans-serif;
}
```

Import in `app/app/src/main.ts`.

---

### Summary: File Modification Ranking

| Rank | File | Effort | Lines Changed | Type |
|------|------|--------|---------------|------|
| 1 | MainLayout.vue | ⭐⭐⭐⭐⭐ | 150-200 | Major refactor |
| 2 | EditorLayout.vue | ⭐⭐⭐⭐ | 100-150 | Major refactor |
| 3 | TerminalView.vue | ⭐⭐⭐ | 50-100 | Restructure |
| 4 | VariablesPanel.vue | ⭐⭐⭐ | 50-100 | Restructure |
| 5 | LeftPanelAccordion.vue | ⭐⭐⭐ | 50-100 | Simplify |
| 6 | TopToolbar.vue | ⭐⭐ | 100-150 | New file |
| 7 | RibbonBar.vue | ⭐⭐ | 200-300 | New file |
| 8 | App.vue (styles) | ⭐ | 20-50 | CSS updates |
| 9 | theme.css | ⭐ | 50-100 | New file |

**Total Estimated Lines:** 800-1,200 lines of code changes/additions for Phase 2 (MATLAB layout implementation).

---

## 11. Known Issues, TODOs, and Unfinished Features

### Backend (Rust) TODOs

**File:** `app/app/src-tauri/src/commands/generic.rs`

| Line | TODO | Impact |
|------|------|--------|
| 238 | "Implement using orchestrator state service" | State persistence not implemented |
| 249 | "Implement using orchestrator file service" | File operations incomplete |
| 884 | Generic comment (unspecified TODO) | Unknown impact |

**File:** `app/app/src-tauri/src/lib.rs`

| Line | TODO | Impact |
|------|------|--------|
| 419 | "Implement proper shutdown for ActorSystem" | Graceful shutdown missing (may cause resource leaks on app close) |

---

### Frontend (Vue) TODOs

**File:** `app/app/src/components/shared/PkgOperationsDialog.vue`

| Line | TODO | Impact |
|------|------|--------|
| 659 | "Implement package details modal" | Package management UI incomplete |

---

### LSP Features Not Implemented

**File:** `app/app/src-tauri/src/commands/lsp.rs`

| Line | Feature | Status |
|------|---------|--------|
| 140-141 | `lsp_signature_help` | Returns "not yet implemented in Rust LSP" error |
| 207 | `lsp_document_symbols` | Returns "not yet implemented" error |

**Impact:**
- No signature help popup (function parameter hints) in Monaco editor
- No document outline/symbol tree in sidebar

---

### Variable Viewer Limitations

**File:** `app/app/src/components/HomeView/VariablesPanel.vue`

| Line | Limitation | Impact |
|------|------------|--------|
| 88 | "Large variable - showing first 10,000 characters. Full pagination support coming soon!" | Large arrays truncated, no pagination |

**Impact:**
- Cannot fully inspect large matrices (>10,000 chars)
- No spreadsheet-style array editor (required for Phase 3)

---

### Logger Configuration

**File:** `app/internals/src/services/logger.rs`

| Line | Issue | Impact |
|------|-------|--------|
| 45 | HTTP/stream debug logs suppressed | Less visibility for debugging networking issues |
| 80 | DEBUG level temporarily enabled for LSP debugging | Higher log volume in production |

**Impact:** Minor — these are intentional debug settings, not bugs.

---

### Other Known Limitations

1. **No Revise.jl auto-loading:** Julia sessions do NOT currently auto-load Revise.jl at startup (constitution requirement for Phase 1).
   - **Fix Required:** Add `using Revise\n` as first stdin write after Julia process starts (preflight.md recommendation).

2. **No status bar:** Missing MATLAB-style status bar showing:
   - "Revise active ●"
   - "LSP ready ●"
   - Current Julia version
   - Workspace memory usage

3. **Single terminal session:** Only one REPL session supported (no multi-terminal tabs).

4. **No ribbon UI:** Current UI is developer-focused, not MATLAB-familiar (Phase 2 work).

5. **Plot interactions limited:** No zoom/pan/rotate controls (requires WGLMakie WebSocket integration, Phase 3+).

---

## 12. Critical Findings for Phase 1 Work

### ✅ Green Lights (No Blockers)

1. **Tauri 2.x confirmed** — no migration required
2. **ProcessActor architecture solid** — Julia subprocess management is production-ready
3. **xterm.js REPL functional** — can use as-is for MATLAB Command Window
4. **LSP integration working** — code completions and diagnostics functional
5. **Pinia stores well-organized** — clean state management for variables, plots, terminal

### ⚠️ Yellow Lights (Minor Adjustments Needed)

1. **Layout restructuring required** — 3-pane → 4-pane refactor is straightforward but non-trivial
2. **Revise.jl not auto-loading** — easy fix (add stdin write on Julia startup)
3. **No status bar** — new component needed (50-100 lines)
4. **Variable viewer needs table view** — current list view works but not MATLAB-familiar

### 🔴 Red Lights (Blockers for Future Phases)

1. **LSP signature help missing** — Phase 5 feature (code intelligence), not Phase 1 blocker
2. **WGLMakie integration missing** — Phase 3+ (figure system), not Phase 1 blocker

---

## 13. Recommendations for Phase 1 Implementation

### High Priority (Do First)

1. **Update tauri.conf.json and package.json** — rebrand to JuliaLab
2. **Create theme.css** — establish CSS variables for Julia brand colors
3. **Refactor MainLayout.vue** — implement 4-panel MATLAB layout
4. **Add Revise.jl auto-loading** — modify Julia startup sequence in lifecycle.rs
5. **Create TopToolbar.vue** — add breadcrumb + Run/Save buttons
6. **Create RibbonBar.vue** — implement 6-tab ribbon with F2 toggle

### Medium Priority (Do After Layout)

1. **Restructure VariablesPanel.vue** — convert to DataTable in right panel
2. **Add status bar component** — show Revise/LSP status
3. **Update terminal styling** — MATLAB-style Command Window appearance
4. **Add keyboard shortcuts** — F5 (Run), Ctrl+S (Save), F2 (toggle ribbon)

### Low Priority (Defer to Phase 2+)

1. **Implement package details modal** — finish PkgOperationsDialog.vue
2. **Add variable pagination** — handle large arrays gracefully
3. **Implement LSP signature help** — requires Rust LSP library updates
4. **Add WGLMakie integration** — interactive plot system

---

## 14. Architecture Quality Assessment

### Strengths

- ✅ Clean separation of concerns (Rust actors, Pinia stores, Vue components)
- ✅ Unified event system for Julia → frontend communication
- ✅ Well-structured Tauri command API (50+ commands)
- ✅ Production-quality xterm.js integration
- ✅ LSP integration via JSON-RPC (standard protocol)
- ✅ TypeScript throughout frontend (type safety)

### Weaknesses

- ⚠️ Some TODOs in critical paths (orchestrator state service, actor shutdown)
- ⚠️ LSP features incomplete (signature help, document symbols)
- ⚠️ No automated tests (Vitest/Playwright setup needed)
- ⚠️ Hard-coded styling (no CSS variables for theming)

### Overall Grade: **B+ (Very Good Foundation)**

Compute42 provides a **solid, production-ready foundation** for JuliaLab. The architecture is clean, extensible, and well-aligned with the MATLAB-style IDE requirements. Phase 1 work (layout refactoring, branding, Revise.jl integration) is **straightforward with no major technical risks**.

---

## Appendix A: Key File Paths Reference

### Frontend (Vue 3)

| Component Type | File Path |
|----------------|-----------|
| **Root Component** | `app/app/src/App.vue` |
| **Main Layout** | `app/app/src/components/layouts/MainLayout.vue` |
| **Editor View** | `app/app/src/components/HomeView/EditorView.vue` |
| **Terminal View** | `app/app/src/components/HomeView/TerminalView.vue` |
| **Variables Panel** | `app/app/src/components/HomeView/VariablesPanel.vue` |
| **File Explorer** | `app/app/src/components/shared/FileExplorer.vue` |
| **Monaco Editor** | `app/app/src/components/HomeView/MonacoEditorInstance.vue` |
| **Pinia Stores** | `app/app/src/store/*.ts` |
| **Router** | `app/app/src/router/index.ts` |
| **Main Entry** | `app/app/src/main.ts` |

### Backend (Rust/Tauri)

| Component Type | File Path |
|----------------|-----------|
| **Process Actor** | `app/internals/src/actors/process_actor/mod.rs` |
| **Julia Lifecycle** | `app/internals/src/actors/process_actor/lifecycle.rs` |
| **LSP Actor** | `app/internals/src/actors/lsp_actor/mod.rs` |
| **Plot Actor** | `app/internals/src/actors/plot_actor/mod.rs` |
| **Tauri Commands** | `app/app/src-tauri/src/commands/*.rs` |
| **Main Tauri Entry** | `app/app/src-tauri/src/lib.rs` |
| **Cargo Config** | `app/app/src-tauri/Cargo.toml` |

### Configuration

| File Type | File Path |
|-----------|-----------|
| **Tauri Config** | `app/app/src-tauri/tauri.conf.json` |
| **Package.json** | `app/app/package.json` |
| **TypeScript Config** | `app/app/tsconfig.json` |
| **Vite Config** | `app/app/vite.config.ts` |

---

## Appendix B: Dependency Versions

### Frontend (package.json)

| Package | Version | Purpose |
|---------|---------|---------|
| vue | ^3.5.13 | Core framework |
| @tauri-apps/api | ^2.7.0 | Tauri frontend bindings |
| pinia | ^2.3.1 | State management |
| naive-ui | ^2.40.1 | UI component library |
| monaco-editor | ^0.52.2 | Code editor |
| @xterm/xterm | ^5.5.0 | Terminal emulator |
| splitpanes | ^3.1.5 | Resizable split panels |
| typescript | ^5.7.2 | Type system |
| vite | ^6.0.11 | Build tool |

### Backend (Cargo.toml)

| Crate | Version | Purpose |
|-------|---------|---------|
| tauri | 2 | Desktop shell |
| actix | 0.13 | Actor system |
| tokio | 1.41 | Async runtime |
| serde | 1.0 | Serialization |
| serde_json | 1.0 | JSON handling |

---

**End of Codebase Audit**

This document provides the foundation for all Phase 1-10 implementation work. Update this audit as the architecture evolves.
