# JuliaLab Sprint Tasks — Next Development Phase

**Contracts:** `CLAUDE.md` (build) · `spec/SKILLS.md` (verification)
**Rule:** Each checkbox must be completed and smoke-tested before the next is started.
**Test rule:** Every implementation checkbox that generates test files must be committed together with those files.

---

## Pre-flight

- [ ] Confirm Vitest is configured: `cat app/app/package.json | grep vitest`
  - If missing: `cd app/app && npm install -D vitest @vue/test-utils @vitejs/plugin-vue happy-dom`
  - Add `"test": "vitest run"` script to `package.json`
  - Add `vitest` config to `vitest.config.ts` with `environment: 'happy-dom'`
- [ ] Confirm Julia binary path works: `C:\Users\johnx\AppData\Local\org.julialab.ide\julia\julia-1.12.1\bin\julia.exe --version`
- [ ] Create test directories if missing: `tests/manual/` and `tests/julia/`

---

## Task 1 — Verify Sysimage Loading

- [ ] Read `app/internals/src/actors/process_actor/lifecycle.rs` lines 84–121 to confirm sysimage wiring is present
- [ ] Run `npm run tauri dev` from repo root
- [ ] Locate log line `"ProcessActor: Loading sysimage from..."` in console output
- [ ] Record elapsed time from `"Julia process started successfully"` → `"ALL_PIPES_READY"`
- [ ] Report startup time (no code changes needed if sysimage log line appears)

**Expected sysimage:** `C:\Users\johnx\AppData\Local\org.julialab.ide\julialab.dll`
**Smoke test pass:** log line present AND elapsed time recorded

---

## Task 2 — Splitpanes Splitter CSS

- [ ] Read `app/app/src/styles/theme.css` in full
- [ ] Read `app/app/src/components/layouts/MainLayout.vue` in full
- [ ] Add splitter CSS block to `theme.css` (after dark theme block):
  - `.splitpanes__splitter` with `background: var(--jl-border)`, `z-index: 50`, `position: relative`
  - `.splitpanes--horizontal > .splitpanes__splitter` with `height: 6px; cursor: row-resize`
  - `.splitpanes--vertical > .splitpanes__splitter` with `width: 6px; cursor: col-resize`
  - `.splitpanes__splitter:hover` with `background: var(--jl-accent-green)`
- [ ] Update `.jl-theme` scoped rules in `MainLayout.vue` global `<style>` block:
  - `width: 6px; min-width: 6px; z-index: 50; cursor: col-resize` for vertical
  - `height: 6px; min-height: 6px; z-index: 50; cursor: row-resize` for horizontal
- [ ] Verify `.panels-area` has `height: 100%` (not just `flex: 1`)
- [ ] Check no parent element (except `.julialab-root`) has `overflow: hidden` clipping the splitter
- [ ] **Generate** `tests/manual/T2_splitpanes.md` (content from `SKILLS.md`)
- [ ] **Smoke test:** Drag all four splitter handles — all resize before proceeding

---

## Task 3a — Create Ribbon Primitives (BLOCKER)

*Do not begin 3b until all three components exist and compile.*

- [ ] Read `app/app/src/components/ribbon/` to check what already exists
- [ ] Create `app/app/src/components/ribbon/RibbonGroup.vue` if missing:
  - Props: `label: String`
  - Slot for button content
  - Bottom label, right-side border, uses `--jl-border` and `--jl-text-muted`
- [ ] Create `app/app/src/components/ribbon/RibbonButton.vue` if missing:
  - Props: `label: String`, `icon: Object` (lucide component ref), `size: 'large'|'small'` (default `'large'`)
  - Emits: `'click'`
  - Uses `<component :is="icon">` — NOT a string iconMap lookup
- [ ] Create `app/app/src/components/ribbon/RibbonToggle.vue` if missing:
  - Props: `label`, `icon: Object`, `size`, `modelValue: Boolean`
  - Emits: `'update:modelValue'`
  - Wraps `RibbonButton`, applies `ribbon-btn--active` class when `modelValue` is true
- [ ] **Generate** `app/app/src/components/ribbon/__tests__/RibbonButton.test.ts` (5 tests from `SKILLS.md`)
- [ ] **Generate** `app/app/src/components/ribbon/__tests__/RibbonToggle.test.ts` (4 tests from `SKILLS.md`)
- [ ] **Generate** `app/app/src/components/ribbon/__tests__/RibbonGroup.test.ts` (3 tests from `SKILLS.md`)
- [ ] **Run:** `cd app/app && npm test` — must show **11 tests, 0 failures** before proceeding to 3b
  (12 tests total once PlotsToolbar import test is added in Task 3b)

---

## Task 3b — Create PlotsToolbar.vue

- [ ] Run lucide name check before writing any import:
  ```bash
  node -e "const l = require('lucide-vue-next'); console.log(Object.keys(l).filter(k => k.startsWith('File')))"
  ```
- [ ] Verify `Wind`, `TrendingUp`, `Circle`, `BarChart2`, `Layers`, `Grid`, `ZoomIn`, `ZoomOut`, `RefreshCw`, `Move`, `Tag`, `Palette`, `Download`, `Copy`, `Settings` are valid exports
- [ ] Create `app/app/src/components/ribbon/PlotsToolbar.vue`:
  - Import all lucide icons as component refs (no string-based lookup)
  - `plotTypes` array uses concrete component refs: `{ name, label, icon: TrendingUp, code }`
  - Groups: NEW | PLOT gallery | ZOOM | PAN | ANNOTATE | EXPORT | FIGURE
  - Wire actions via `invoke('run_julia_command', { code })` for plot gallery buttons
  - Wire `invoke('plot_export', { format })` for export buttons
  - Pan button uses `<RibbonToggle v-model="panActive">`
  - Zoom/Annotate buttons are stubs that `console.log`
- [ ] **Generate** `tests/julia/T3_plot_gallery.jl` (6 plot smoke scripts from `SKILLS.md`)
- [ ] **Generate** `tests/julia/T3_plot_export.jl` (PNG export test from `SKILLS.md`)
- [ ] Add a minimal Vitest import check to `app/app/src/components/ribbon/__tests__/PlotsToolbar.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest'
  import PlotsToolbar from '../PlotsToolbar.vue'
  describe('PlotsToolbar', () => {
    it('imports without error', () => { expect(PlotsToolbar).toBeDefined() })
  })
  ```
  This catches broken lucide imports before the Tauri build step.
- [ ] **Run:** `cd app/app && npm test` — PlotsToolbar import test must be green before proceeding to 3c-d

---

## Task 3c-d — Plot Tauri Commands + Wire RibbonBar

- [ ] Read the existing commands directory: `app/app/src-tauri/src/commands/`
- [ ] Add `plot_export(format: String, app_handle: AppHandle)` command — open native save dialog, log stub
- [ ] Add `new_figure()` stub command (log only)
- [ ] Register both in `lib.rs` `generate_handler!`
- [ ] Read `app/app/src/components/layouts/RibbonBar.vue` in full
- [ ] Import `PlotsToolbar` and wire it to the PLOTS tab in `RibbonBar.vue`
- [ ] Emit `tab-change` event from `RibbonBar` to `MainLayout` (needed for Task 5)
- [ ] **Smoke test:** `npm run tauri dev` compiles, PLOTS tab shows full toolbar, "Line" button executes Julia, plot appears in Plots panel
- [ ] **Run:** `julia tests/julia/T3_plot_export.jl` — must print **PASS**

---

## Task 4 — Apps Tab

### 4a — Store + Toolbar

- [ ] Read `app/app/src/store/layoutStore.ts`
- [ ] Add `showAppsPanel = ref(false)` and `toggleAppsPanel()` to `layoutStore.ts`; export both
- [ ] Create `app/app/src/components/ribbon/AppsToolbar.vue`:
  - Groups: FIND APPS | MY APPS | FILE
  - App Gallery button: `layoutStore.showAppsPanel = true`
  - Design App: `invoke('app_design_new')`
  - Open App: `invoke('app_open_file')`
  - Package App: stub
- [ ] Wire AppsToolbar in `RibbonBar.vue` (APPS tab)

### 4b — Apps Panel + Tauri Commands

- [ ] Create `app/app/src/features/apps/` directory if missing
- [ ] Create `app/app/src/features/apps/AppsPanel.vue`:
  - Gallery view: grid of 7 app cards with concrete lucide icon imports
  - **Do NOT use Interact.jl** (unmaintained on Julia 1.12)
  - Each card: name, icon, description, Run button
  - Run → `invoke('run_julia_command', { code })`; on error, show inline Install prompt
  - My Apps view: `invoke('list_user_apps')` → cards with Run / Open buttons
- [ ] Read `app/app/src-tauri/src/commands/generic.rs`
- [ ] Add `app_design_new(app_handle)` — writes template `.jl` to `AppData/org.julialab.ide/apps/`
- [ ] Add `app_open_file(app_handle)` — native file picker filtered to `.jl`
- [ ] Add `app_package()` — log stub
- [ ] Add `list_user_apps(app_handle) -> Vec<serde_json::Value>` — scan apps dir
  - Consider using a concrete `#[derive(Serialize)] struct AppEntry` instead of `serde_json::Value` to avoid Clippy warnings
- [ ] Register all four commands in `lib.rs`

### 4c — Wire Panel in MainLayout

**Architecture decision:** AppsPanel uses the **center pane replacement** pattern (same as LiveEditorPanel),
not a floating overlay. When `layoutStore.showAppsPanel` is true, the editor area is replaced by AppsPanel.
This keeps the splitpanes layout intact and is consistent with how LIVE EDITOR works.

- [ ] Read `app/app/src/components/layouts/MainLayout.vue`
- [ ] In the center pane area, add: `<AppsPanel v-else-if="layoutStore.showAppsPanel" />`
  alongside the existing `<LiveEditorPanel>` and `<FileEditor>` conditions
- [ ] `AppsPanel` must include a close button that sets `layoutStore.showAppsPanel = false`
  to restore the editor view
- [ ] **Generate** `tests/julia/T4_apps.jl` (3 test cases from `SKILLS.md`)
- [ ] **Generate** `tests/manual/T4_apps_gallery.md` (6 manual test cases from `SKILLS.md`)
- [ ] **Run:** `julia tests/julia/T4_apps.jl` — must print **PASS**
- [ ] **Smoke test:** APPS tab → toolbar; App Gallery → 7-card grid; Run executes Julia output

---

## Task 5 — Live Editor / Pluto Integration

### 5a — CSP Fix (FIRST — before any Pluto code)

- [ ] Read `app/app/src-tauri/tauri.conf.json`
- [ ] Add/update `"security": { "csp": "..." }` block with:
  - `frame-src http://localhost:* http://127.0.0.1:*`
  - `connect-src http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*`
  - `script-src 'self' 'unsafe-inline' http://localhost:*`
  - `style-src 'self' 'unsafe-inline' http://localhost:*`
  - `img-src 'self' data: http://localhost:*`
- [ ] **Smoke test:** `npm run tauri dev` — app still builds, no CSP errors in DevTools console

### 5b — start_pluto.jl

- [ ] Search `lifecycle.rs` for where it resolves the scripts directory path at runtime
- [ ] Place `start_pluto.jl` in the same directory (likely `app/internals/scripts/core/`)
- [ ] Write `start_pluto.jl` with version-safe Pluto startup:
  - Find free port via `Sockets.listen(0)`
  - Print `PLUTO_PORT=N` to stdout, flush
  - Introspect `methods(Pluto.run)` to detect whether `secret` or `require_secret_for_access` exists
  - Call `Pluto.run(; kw...)` with the correct keyword for the installed version

### 5c — pluto_actor.rs

- [ ] Read `app/internals/src/actors/process_actor/` to understand conventions
- [ ] Create `app/internals/src/actors/pluto_actor.rs`:
  - `PlutoActor` struct with `Arc<Mutex<Option<u16>>>` port and `Arc<Mutex<Option<Child>>>` process
  - `start(julia_bin, script_path)` spawns thread, reads stdout for `PLUTO_PORT=N` line
  - Uses `strip_prefix("PLUTO_PORT=")` (no regex dependency needed)
  - `get_url()` → `Option<String>` formatted as `http://localhost:{port}`
  - `shutdown()` kills child process
- [ ] Add `pub mod pluto_actor;` to `app/internals/src/actors/mod.rs`

### 5d — Tauri command + startup wiring

- [ ] Add `PlutoState { actor: PlutoActor }` to app state in `lib.rs`
  - Adapt to actual `AppState` structure found in the file — do not guess
- [ ] Add `get_pluto_url(state) -> Option<String>` Tauri command
- [ ] Wire `actor.start(julia_bin, script_path)` during app setup, using same path resolution as Julia process actor
- [ ] Wire `actor.shutdown()` on `CloseRequested` window event
- [ ] Register `get_pluto_url` in `generate_handler!`

### 5e — LiveEditorPanel.vue

- [ ] Create `app/app/src/components/panels/LiveEditorPanel.vue`:
  - `onMounted`: begin polling `invoke('get_pluto_url')` every 1s, max 60 tries
  - Loading state: spinner + "Starting Pluto server…"
  - Timeout state: error message + Retry button that resets and restarts polling
  - Ready state: `<iframe class="pluto-frame" :src="plutoUrl" allow="clipboard-read; clipboard-write">`
  - `onUnmounted`: clear timeout to prevent memory leak

### 5f — Wire in MainLayout + RibbonBar

- [ ] Import `LiveEditorPanel` in `MainLayout.vue`
- [ ] Receive `@tab-change` event from `RibbonBar`; store `activeTab` as reactive ref
- [ ] In center pane: `<LiveEditorPanel v-if="activeTab === 'LIVE EDITOR'" />` else `<FileEditor />`
  - Note: `v-show` instead of `v-if` would preserve Pluto state between tab switches — choose and document
- [ ] Create stub `app/app/src/components/ribbon/LiveEditorToolbar.vue` (placeholder `<div>`)
- [ ] Wire LiveEditorToolbar in `RibbonBar.vue` for LIVE EDITOR tab
- [ ] **Generate** `tests/julia/T5_pluto_startup.jl` (4 test cases from `SKILLS.md`)
- [ ] **Generate** `tests/manual/T5_pluto_iframe.md` (6 manual test cases from `SKILLS.md`)
- [ ] **Run:** `julia tests/julia/T5_pluto_startup.jl` — must print **PASS**
- [ ] **Smoke test:** LIVE EDITOR tab → spinner → Pluto UI loads in iframe within 60s, no CSP errors

---

## Task 6 — INSERT Tab (Contextual)

*Prerequisite: Task 5 fully working — `get_pluto_url` returning a live URL.*

### 6a — Disable INSERT contextually

- [ ] Read `RibbonBar.vue` in full to confirm ribbon tab element class names
- [ ] Add `contextualTabs = { 'INSERT': 'LIVE EDITOR' }` map to `RibbonBar.vue`
- [ ] Add `isTabDisabled(tab)` function: returns true when tab is in `contextualTabs` and its required tab is not active
- [ ] Apply `:disabled` or `:class="{ disabled: isTabDisabled(tab) }"` to ribbon tab elements
- [ ] Add CSS to `theme.css` using the **actual** ribbon tab class found in the file (not `.n-tabs-tab--disabled`):
  ```css
  .ribbon-tab.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }
  ```
  (Verify and adapt the selector to match the real class name in RibbonBar.vue)

### 6b — InsertToolbar.vue

- [ ] **Generate** `tests/manual/T6_insert_postmessage.md` (steps + 5 test cases from `SKILLS.md`)
  This file must exist before the discovery steps below so you have somewhere to record findings.
- [ ] **Discover:** Read Pluto WebSocket source at:
  `~/.julia/packages/Pluto/<version>/src/webserver/`
  and find the correct `type` field name for cell insertion
- [ ] **Verify:** Open Pluto directly in browser, open DevTools → Network → WS, add a cell manually, inspect the WS message to confirm the `type` field and payload shape
- [ ] **Record in `tests/manual/T6_insert_postmessage.md` before continuing:**
  ```
  Pluto version: _______________
  type field:    _______________   (e.g. "cell_input", "add_cell", ...)
  payload shape: { cell_id: uuid, code: string, is_new: bool, ... }
  verified on:   (date)
  ```
  Commit this note alongside the test file so future Pluto upgrades have a baseline to diff against.
- [ ] **Gate:** Do not create `InsertToolbar.vue` until the format above is filled in.
- [ ] Create `app/app/src/components/ribbon/InsertToolbar.vue`:
  - `insertCell(code)` helper: gets origin via `invoke('get_pluto_url')`, finds `.pluto-frame` iframe, calls `iframe.contentWindow.postMessage({type, cell_id, code, is_new}, origin)`
  - Use the **verified** `type` field recorded above
  - Groups: CODE | CONTROLS (Slider, Checkbox, Dropdown, Button) | CONTENT (Equation, Image, Hyperlink, Table) | STRUCTURE (Section Break, Table of Contents)
- [ ] Add `pick_image_file(app_handle) -> Option<String>` Tauri stub (log only, return `None`)
- [ ] Register `pick_image_file` in `generate_handler!`
- [ ] Wire `InsertToolbar` in `RibbonBar.vue` for INSERT tab
- [ ] **Smoke test (T6 manual):**
  - INSERT tab is greyed out when HOME/PLOTS/APPS tab is active
  - INSERT tab becomes clickable when LIVE EDITOR is active
  - "Code" button → new cell appears in Pluto notebook
  - "Slider" button → `@bind x PlutoUI.Slider(...)` cell appears and renders slider widget

---

## Task 7A — Async Revise Loading

- [ ] Read `app/internals/src/actors/process_actor/lifecycle.rs` in full
- [ ] Search for `using Revise` — note exact line range of the blocking send block
- [ ] Identify the channel sender variable name and type (e.g., `tx`, `sender`, etc.)
- [ ] **Step 1 — Delete** the entire blocking Revise send block (not just the function call)
- [ ] **Step 2 — Clone** the sender before the spawn: `let tx_revise = tx.clone();`
- [ ] **Step 3 — Add** async spawn using `tx_revise` (not `tx`) inside the closure:
  - Sleep 500ms before sending `"using Revise"`
  - Log `"ProcessActor: Revise loaded asynchronously"` after send
- [ ] **Step 4 — Emit** the Ready signal immediately after the spawn (do not await it)
- [ ] Use actual function/variable names found in the file — do NOT guess
- [ ] **Generate** `tests/manual/T7A_revise_timing.md` (4 test cases from `SKILLS.md`)
- [ ] **Smoke test:**
  - Record baseline startup time before this change (see T7A.1 playbook)
  - Confirm Ready fires ≥ 3s faster after the change
  - Confirm Revise still activates (file change detected after a few seconds)
  - Confirm `"Revise loaded"` log appears exactly once (no double-load)

---

## Task 7B — Pkg.instantiate() Staleness Check

- [ ] Read `app/internals/scripts/core/packages.jl` in full
- [ ] Find the `Pkg.instantiate()` call
- [ ] Wrap it in the staleness guard:
  ```julia
  stamp_file = joinpath(@__DIR__, ".pkg_stamp")
  manifest   = joinpath(dirname(@__DIR__), "Manifest.toml")
  needs_update = !isfile(stamp_file) ||
                 (isfile(manifest) && mtime(manifest) > mtime(stamp_file))
  if needs_update
      @info "Packages: Manifest changed — running Pkg.instantiate()..."
      Pkg.instantiate()
      touch(stamp_file)
  else
      @info "Packages: Manifest unchanged — skipping Pkg.instantiate()"
  end
  ```
- [ ] Verify `@__DIR__` resolves correctly at runtime (same directory as script)
- [ ] Add `.pkg_stamp` to `.gitignore` if not already present
- [ ] **Generate** `tests/julia/T7B_pkg_staleness.jl` (4 test cases from `SKILLS.md`)
- [ ] **Run:** `julia tests/julia/T7B_pkg_staleness.jl` — must print **ALL PASS**
- [ ] **Smoke test:** Restart JuliaLab twice; second launch logs `"skipping Pkg.instantiate()"`

---

## Final Verification Pass

Run all automated tests:
```bash
# Vue component tests
cd app/app && npm test
# Expected: 12 tests, 0 failures (11 ribbon primitives + 1 PlotsToolbar import)

# Julia automated tests
julia tests/julia/T3_plot_export.jl
julia tests/julia/T4_apps.jl
julia tests/julia/T5_pluto_startup.jl
julia tests/julia/T7B_pkg_staleness.jl
# Expected: each prints PASS and exits 0
```

Then complete manual playbooks:
- [ ] `tests/manual/T2_splitpanes.md` — all 5 TC-2.x cases pass
- [ ] `tests/manual/T4_apps_gallery.md` — TC-4.4 through TC-4.9 pass
- [ ] `tests/manual/T5_pluto_iframe.md` — TC-5.5 through TC-5.10 pass
- [ ] `tests/manual/T6_insert_postmessage.md` — postMessage format verified; TC-6.1 through TC-6.5 pass
- [ ] `tests/manual/T7A_revise_timing.md` — TC-7A.1 through TC-7A.4 pass

---

## Definition of Done

| Task | Automated green | Manual pass |
|---|---|---|
| T1 | — | Sysimage log line present; startup time recorded |
| T2 | — | All 5 TC-2.x cases pass (6px handles, correct cursors, hover color) |
| T3a+3b | `npm test`: 12/12 | — |
| T3b | `T3_plot_export.jl`: PASS | 6 plots visible in Plots panel |
| T4 | `T4_apps.jl`: PASS | TC-4.4 through TC-4.9 pass |
| T5 | `T5_pluto_startup.jl`: PASS | TC-5.5 through TC-5.10 pass |
| T6 | — | postMessage format verified; TC-6.1 through TC-6.5 pass |
| T7A | — | TC-7A.1 through TC-7A.4 pass; Ready ≥ 3s faster |
| T7B | `T7B_pkg_staleness.jl`: ALL PASS | Second launch skips Pkg.instantiate() |
