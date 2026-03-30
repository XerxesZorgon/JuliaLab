
# JuliaLab Project Tasks

**Project Status**: Phase 0 complete. Ready for Phase 1 (Layout & UI Shell).
**Primary Objective**: Transform Compute42 fork into a 4-panel MATLAB-style Julia IDE.

---

## Phase 0: Performance & Core Infrastructure ✓ COMPLETE

* [x] **Optimize Package Instantiation**: Implement modification time check for `Manifest.toml` to skip `Pkg.instantiate()` on startup (~97% speed improvement).
* [x] **Lazy Load Language Server**: Delay LSP initialization until a `.jl` file is opened to save ~26s on initial startup.
* [x] **Custom Sysimage Generation**: Build script created (`build_sysimage.jl`) with core packages for ~3-5s startup improvement.
* [x] **Font Bundling**: IBM Plex Mono/Sans bundled via `@fontsource` packages for offline use.

## Phase 1: Layout & UI Shell (MATLAB Parity) ✓ COMPLETE

* [x] **4-Panel Layout Restructuring**: Transition from Compute42's 3-pane layout to the 4-panel standard: File Browser (Left), Editor (Center-Top), Command Window (Bottom), Workspace (Right).
* [x] **Ribbon Toolbar Implementation**: Create a 6-tab functional ribbon (Home, Plots, Apps, Live Editor, Insert, View) with F2 toggle support.
* [x] **MATLAB Light Theme**: Implement light theme as default with MATLAB-style colors (light gray ribbon #f0f0f0, white panels, blue accents).
* [x] **Workspace Inspector**: Develop a rich data grid for viewing Julia variables with support for large array pagination.
* [x] **Theme Engine**: Implement Dark/Light/System theme switching via Naive UI.

## Phase 2: Editor & Language Integration

* [x] **Julia Cell Execution**: `##` cell detection with Ctrl+Enter, cell highlighting decoration, and ribbon "Run Section" button.
* [x] **Unicode Autocomplete**: `\` + Tab completion for Greek letters and math symbols (e.g., `\alpha` → `α`).
* [ ] **Advanced LSP Support**: Implement missing signature help and document symbols for the forked LanguageServer.jl integration. *(requires backend LSP changes)*
* [x] **JuliaFormatter Integration**: "Format Code" ribbon button wired to `JuliaFormatter.jl` via `format_code` Tauri command.

## Phase 3: Graphics & Visualization ✓ COMPLETE

* [x] **Integrated Figure Container**: Plots tab in right panel (tabbed with Workspace), auto-focuses when a new plot is generated. Supports both static images and WGLMakie iframe.
* [x] **Makie Toolbar**: Reset View, Toggle Grid, and Export (PDF/PNG/SVG) buttons wired to `JuliaLab` Julia module via `terminalStore.executeJuliaCode`.
* [x] **WGLMakie Port Management**: Port 8081 reserved in `plotting.jl`; `plotStore` tracks port dynamically and updates all plot URLs on `server-started`/`server-restarted` events.
* [x] **Export Workflow**: Native save dialog (PDF/PNG/SVG) calls `JuliaLab.export_current_plot()` which uses CairoMakie for vector formats and falls back to standard `Makie.save`.

## Phase 4: AI & Modeling Tools ✓ COMPLETE

* [x] **Gemini AI Pane**: Implement the chat-style sidebar that communicates with the Gemini CLI via Tauri subprocess.
* [x] **ModelingToolkit (MTK) Integration**: Purple left-border decoration on `@mtkmodel`/`@variables`/`@equations` etc. lines via `applyMtkDecorations`; "Open in Dyad" button in HOME ribbon MODELING group opens JuliaHub Dyad Studio.
* [x] **Method Browser**: `browse_methods(func)` Julia function sends `MethodInfo` message → Rust emits `methods:info` event → `MethodsBrowser.vue` in right-panel Methods tab displays signature/module/location table.

## Phase 5: Distribution & DevOps ✓ COMPLETE

* [x] **Tauri 2 Allowlist Audit**: Replaced broad `*:default` permissions with specific `fs:allow-*`, `dialog:allow-*`, `process:allow-exit/restart`, and `shell:allow-open` in `capabilities/default.json`; scoped HTTP plugin to `127.0.0.1:*` and `localhost:*` only.
* [x] **Multi-Platform CI/CD**: `.github/workflows/build.yml` builds NSIS installer (Windows), universal DMG (macOS), and AppImage + deb (Linux) on each push to `main` and on version tags; auto-publishes a GitHub Release on `v*` tags.
* [x] **MATLAB Migration Guide**: `CheatSheetPanel.vue` (780px slide-in overlay) is integrated in `MainLayout.vue` and toggled from the View tab ribbon "MATLAB→Julia" button via `layoutStore.toggleCheatSheet()`.

