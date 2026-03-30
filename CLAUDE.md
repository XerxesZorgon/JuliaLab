# JuliaLab — Next Development Sprint (Tasks 1–7)

## Context

Phases 0–5 are complete. This sprint implements the next 7 tasks:
sysimage startup verification, splitpanes CSS fixes, Plots ribbon tab, Apps gallery,
Live Editor / Pluto integration, contextual Insert tab, and two backend fixes
(async Revise loading, Pkg.instantiate staleness check).

This plan incorporates all 6 critical fixes identified in `plan_review.md`.

Read `spec/SKILLS.md` alongside this file. Generate all listed test files
in the same commit as the implementation they cover.

**Execute in strict order. Compile + smoke-test before advancing.**

**Read before touching anything:**
```
app/internals/src/actors/process_actor/lifecycle.rs      ← read before Task 7A
app/app/src/components/layouts/MainLayout.vue            ← read before Task 2
app/app/src/components/layouts/RibbonBar.vue             ← read before Task 3b
app/app/src/styles/theme.css                             ← read before Task 2
app/internals/scripts/core/packages.jl                   ← read before Task 7B
```

---

## Task 1 — Verify Sysimage Loading (Measure Only)

**Status:** Sysimage wiring is **already implemented** in `lifecycle.rs` (lines 84–121).
The code checks `app_data_dir/org.julialab.ide/julialab.{dll|dylib|so}` then the
bundled resources directory before falling back gracefully.

**Action:** Run `npm run tauri dev` from the repo root. In the console output, find:
- The log line `"ProcessActor: Loading sysimage from..."` (confirms it's loading)
- The timestamp of `"Julia process started successfully"` and the `"ALL_PIPES_READY"` signal

Report the elapsed time. No code changes needed unless the sysimage log line is absent
(which would mean the .dll doesn't exist at the expected path).

**Expected sysimage path:** `C:\Users\johnx\AppData\Local\org.julialab.ide\julialab.dll`

---

## Task 2 — Splitpanes Splitter CSS

**Problem:** Splitter handles are 3px with no explicit cursor or z-index, making them
hard to grab in Tauri's WebView.

**Files to modify:**
- `app/app/src/styles/theme.css` — add global splitter rules
- `app/app/src/components/layouts/MainLayout.vue` — update `.jl-theme` scoped rules

### 2a — Add to `theme.css` (at the bottom, after dark theme block)

```css
/* === Splitpanes splitter handles === */
.splitpanes__splitter {
  background: var(--jl-border);
  z-index: 50;
  position: relative;
}
.splitpanes--horizontal > .splitpanes__splitter {
  height: 6px;
  cursor: row-resize;
}
.splitpanes--vertical > .splitpanes__splitter {
  width: 6px;
  cursor: col-resize;
}
.splitpanes__splitter:hover {
  background: var(--jl-accent-green);
}
```

### 2b — Update `.jl-theme` rules in `MainLayout.vue` (global `<style>` block)

Change splitter widths from 3px → 6px and add `cursor` + `z-index` to match theme.css:

```css
.jl-theme.splitpanes--vertical > .splitpanes__splitter {
  width: 6px; min-width: 6px; z-index: 50; cursor: col-resize;
}
.jl-theme.splitpanes--horizontal > .splitpanes__splitter {
  height: 6px; min-height: 6px; z-index: 50; cursor: row-resize;
}
```

### 2c — Verify container heights

Confirm the `.panels-area` div has `height: 100%` (not just `flex: 1`) and no child
element has `overflow: hidden` clipping the splitter hit-area except the outermost
`.julialab-root`. Fix any that do.

**Smoke test:** Drag each of the four splitter handles. All must resize before proceeding.

---

## Task 3 — Plots Ribbon Tab

**FIX applied (plan_review.md #1 and #2):** Ribbon primitives must exist before any
toolbar is created. Icon components must use concrete lucide imports, not phantom strings.

### 3a — Create Ribbon Primitives First (BLOCKER — do this before 3b)

Read `app/app/src/components/ribbon/` first to check what already exists.
Create any of the following that are missing:

**`RibbonGroup.vue`** — labeled group container with slot for buttons:
```vue
<template>
  <div class="ribbon-group">
    <div class="ribbon-group-content"><slot /></div>
    <div class="ribbon-group-label">{{ label }}</div>
  </div>
</template>
<script setup>
defineProps({ label: String })
</script>
<style scoped>
.ribbon-group { display:flex; flex-direction:column; align-items:stretch;
                border-right:1px solid var(--jl-border); padding:0 6px; min-width:40px; }
.ribbon-group-content { display:flex; flex-direction:row; align-items:center;
                         gap:2px; flex:1; }
.ribbon-group-label { font-size:9px; text-align:center; color:var(--jl-text-muted);
                       padding:2px 0; text-transform:uppercase; }
</style>
```

**`RibbonButton.vue`** — button that accepts `label`, `icon` (lucide component ref), `size` (`large`|`small`):
```vue
<template>
  <button class="ribbon-btn" :class="[`ribbon-btn--${size}`]" @click="$emit('click')">
    <component :is="icon" :size="size === 'large' ? 24 : 16" />
    <span class="ribbon-btn-label">{{ label }}</span>
  </button>
</template>
<script setup>
defineProps({ label: String, icon: Object, size: { type: String, default: 'large' } })
defineEmits(['click'])
</script>
<style scoped>
.ribbon-btn { display:flex; flex-direction:column; align-items:center; gap:2px;
              padding:4px 6px; border:none; background:none; cursor:pointer;
              border-radius:3px; min-width:40px; }
.ribbon-btn:hover { background:var(--jl-panel-bg-alt); }
.ribbon-btn-label { font-size:10px; color:var(--jl-text-primary); white-space:nowrap; }
.ribbon-btn--small { flex-direction:row; min-width:unset; }
</style>
```

**`RibbonToggle.vue`** — wraps RibbonButton with v-model boolean for toggle state:
```vue
<template>
  <RibbonButton
    :label="label"
    :icon="icon"
    :size="size"
    :class="{ 'ribbon-btn--active': modelValue }"
    @click="$emit('update:modelValue', !modelValue)"
  />
</template>
<script setup>
import RibbonButton from './RibbonButton.vue'
defineProps({ label: String, icon: Object, size: { type: String, default: 'large' }, modelValue: Boolean })
defineEmits(['update:modelValue'])
</script>
<style scoped>
.ribbon-btn--active { background: var(--jl-accent-green) !important; color: #fff; }
</style>
```

**Smoke test:** All three components compile without errors before proceeding to 3b.

### 3b — Create `PlotsToolbar.vue`

**File:** `app/app/src/components/ribbon/PlotsToolbar.vue`

**FIX (#2):** Use concrete lucide component refs — NOT dynamic string names.

**Before writing any import:** verify every icon name against the installed version:
```bash
node -e "const l = require('lucide-vue-next'); console.log(Object.keys(l).filter(k => k.startsWith('File')))"
```
`FileSvg` does not exist in lucide-vue-next; use `Download` or `FileCode` instead.
`FileText` was removed from newer versions — verify before using. Use only names
confirmed by the check above.

```ts
import { TrendingUp, Circle, BarChart2, Layers, Grid, Wind,
         ZoomIn, ZoomOut, RefreshCw, Move, Tag, Type, Palette,
         Download, Copy, Settings } from 'lucide-vue-next'

const plotTypes = [
  { name: 'lines',     label: 'Line',      icon: TrendingUp, code: 'lines(rand(10))'       },
  { name: 'scatter',   label: 'Scatter',   icon: Circle,     code: 'scatter(rand(10), rand(10))' },
  { name: 'bar',       label: 'Bar',       icon: BarChart2,  code: 'barplot(1:5, rand(5))' },
  { name: 'heatmap',   label: 'Heatmap',   icon: Grid,       code: 'heatmap(rand(10,10))'  },
  { name: 'surface',   label: 'Surface',   icon: Layers,     code: 'surface(rand(20,20))'  },
  { name: 'contour',   label: 'Contour',   icon: Wind,       code: 'contour(rand(20,20))'  },
]
```

Groups (left to right): NEW | PLOT gallery | ZOOM | PAN | ANNOTATE | EXPORT | FIGURE

Wire actions via `invoke` (same pattern as `useJuliaActions.ts`):
- `New Figure` → `invoke('run_julia_command', { code: 'display(Figure())' })`
- Plot gallery buttons → `invoke('run_julia_command', { code: 'using CairoMakie; fig,ax,_=' + item.code + '; display(fig)' })`
- Export → `invoke('plot_export', { format: 'png'|'svg'|'pdf' })` (see 3c)
- Zoom/Pan/Annotate → stubs that log to console

### 3c — Add Tauri plot commands

**File:** `app/app/src-tauri/src/commands/` — add to an existing plot command file or
create `plot.rs`. Read the existing file first.

Register these stub commands in `lib.rs` `generate_handler!`:
- `plot_export(format: String)` — open native save dialog, log for now
- `new_figure()` — stub (Julia side handles it via run_julia_command)

### 3d — Wire PlotsToolbar in `RibbonBar.vue`

Read `RibbonBar.vue` first. Find the `tabComponents` map or equivalent.
Replace the PLOTS stub:
```ts
import PlotsToolbar from '../ribbon/PlotsToolbar.vue'
// PLOTS: PlotsToolbar
```

**Smoke test:** Click PLOTS tab → full toolbar appears. Click "Line" gallery button →
Julia executes and plot appears in Plots panel.

---

## Task 4 — Apps Tab Gallery + Custom Launcher

### 4a — Create `AppsToolbar.vue`

**File:** `app/app/src/components/ribbon/AppsToolbar.vue`

Groups: FIND APPS | MY APPS | FILE

- `App Gallery` → `layoutStore.showAppsPanel = true`
- `Design App` → `invoke('app_design_new')`
- `Open App` → `invoke('app_open_file')`
- `Package App` → stub

### 4b — Add `showAppsPanel` to `layoutStore.ts`

```ts
const showAppsPanel = ref(false)
function toggleAppsPanel() { showAppsPanel.value = !showAppsPanel.value }
```

### 4c — Create `AppsPanel.vue`

**File:** `app/app/src/features/apps/AppsPanel.vue`

Two views: **Gallery** | **My Apps** (toggle via segmented control)

**Gallery view:** Grid of cards, one per built-in app. **Do NOT use Interact.jl** —
it is unmaintained on Julia 1.12. Use `PlutoUI.jl` widgets in Pluto notebooks as the
interactive fallback.

Use concrete lucide imports for icons (same pattern as Task 3):
```ts
import { BarChart2, Table, Activity, TrendingUp, Cpu, Minimize2, Image } from 'lucide-vue-next'
```

App list with run code:
| Name | Package | Icon |
|---|---|---|
| Statistics Explorer | StatsBase | BarChart2 |
| DataFrame Viewer | DataFrames | Table |
| Signal Analyzer | DSP + CairoMakie | Activity |
| Curve Fitter | LsqFit | TrendingUp |
| ODE Solver | OrdinaryDiffEq | Cpu |
| Optimization | Optim | Minimize2 |
| Image Viewer | Images | Image |

Each card: `Run` button → `invoke('run_julia_command', { code })`. If package missing,
show inline alert with "Install?" button → `invoke('run_julia_command', { code: 'import Pkg; Pkg.add("X")' })`.

**My Apps view:** `invoke('list_user_apps')` → array of `{ name, path, modified }` → cards.

### 4d — Add Tauri commands for Apps

**File:** `app/app/src-tauri/src/commands/generic.rs` (or new `apps.rs`)

```rust
#[tauri::command]
fn app_design_new(app_handle: tauri::AppHandle) { /* write template .jl to AppData/org.julialab.ide/apps/ */ }

#[tauri::command]
fn app_open_file(app_handle: tauri::AppHandle) { /* native file picker filtered to .jl */ }

#[tauri::command]
fn app_package() { log::info!("AppsCmd: package_app (stub)"); }

#[tauri::command]
fn list_user_apps(app_handle: tauri::AppHandle) -> Vec<serde_json::Value> { /* scan apps dir */ }
```

Register all in `lib.rs`.

### 4e — Show AppsPanel in `MainLayout.vue`

Add `v-if="layoutStore.showAppsPanel"` overlay above panels-area with close button.

### 4f — Wire AppsToolbar in `RibbonBar.vue`

```ts
import AppsToolbar from '../ribbon/AppsToolbar.vue'
// APPS: AppsToolbar
```

**Smoke test:** APPS tab → toolbar. App Gallery button → grid with 7 cards. Run → output in Command Window.

---

## Task 5 — Live Editor (Pluto.jl Integration)

### 5a — Fix tauri.conf.json CSP FIRST (CRITICAL — before any Pluto code)

**FIX applied (plan_review.md #4):** Tauri 2 default CSP blocks all localhost iframes.
Do this before writing any Pluto code or the iframe will silently fail.

Open `app/app/src-tauri/tauri.conf.json`. Find the `"security"` block under `"app"`.
Add/update the CSP:

```json
"security": {
  "csp": "default-src 'self'; frame-src http://localhost:* http://127.0.0.1:*; connect-src http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*; script-src 'self' 'unsafe-inline' http://localhost:*; style-src 'self' 'unsafe-inline' http://localhost:*; img-src 'self' data: http://localhost:*"
}
```

Run `npm run tauri dev` and confirm the app still builds before continuing.

### 5b — Create `start_pluto.jl`

**Path note:** Existing Julia scripts for this project live at
`app/internals/scripts/core/`. Check where the Julia process actor resolves its
scripts at runtime (search for `scripts` path in `lifecycle.rs`) and place
`start_pluto.jl` in the same directory. The actor in step 5c must use that same
resolved path.

**File:** `app/internals/scripts/core/start_pluto.jl` (or wherever lifecycle.rs resolves scripts)

**FIX applied (plan_review.md #3):** Do NOT hardcode `require_secret_for_access` or
`secret` — introspect `methods(Pluto.run)` at runtime to handle any installed version:

```julia
import Pluto
using Sockets

function find_free_port()
    server = listen(0)
    port   = Sockets.getsockname(server)[2]
    close(server)
    return Int(port)
end

port = find_free_port()
println("PLUTO_PORT=$(port)")
flush(stdout)

kw = Dict{Symbol,Any}(:port => port, :launch_browser => false)

all_kws = reduce(union, Symbol.(Base.kwarg_decl.(methods(Pluto.run))))

if :secret in all_kws
    kw[:secret] = ""                            # Pluto >= 0.19
elseif :require_secret_for_access in all_kws
    kw[:require_secret_for_access]     = false  # Pluto <= 0.18
    kw[:require_secret_for_open_links] = false
end

@info "JuliaLab: starting Pluto on port $(port)"
Pluto.run(; kw...)
```

### 5c — Create `pluto_actor.rs`

**File:** `app/internals/src/actors/pluto_actor.rs`

Read the existing Julia process actor first and follow its conventions exactly.
Use `Arc<Mutex<Option<...>>>` for shared state (no Actix messages needed — simpler):

```rust
use std::process::{Child, Command, Stdio};
use std::io::{BufRead, BufReader};
use std::sync::{Arc, Mutex};

pub struct PlutoActor {
    pub port:    Arc<Mutex<Option<u16>>>,
    pub process: Arc<Mutex<Option<Child>>>,
}

impl PlutoActor {
    pub fn new() -> Self {
        Self { port: Arc::new(Mutex::new(None)), process: Arc::new(Mutex::new(None)) }
    }

    pub fn start(&self, julia_bin: &str, script_path: &str) {
        let port_arc = self.port.clone();
        let process_arc = self.process.clone();
        let julia = julia_bin.to_owned();
        let script = script_path.to_owned();
        std::thread::spawn(move || {
            let mut child = match Command::new(&julia).arg(&script)
                .stdout(Stdio::piped()).stderr(Stdio::inherit()).spawn() {
                Ok(c) => c,
                Err(e) => { log::error!("PlutoActor: spawn failed: {}", e); return; }
            };
            let stdout = child.stdout.take().unwrap();
            *process_arc.lock().unwrap() = Some(child);
            for line in BufReader::new(stdout).lines().flatten() {
                log::info!("Pluto stdout: {}", line);
                if let Some(rest) = line.strip_prefix("PLUTO_PORT=") {
                    if let Ok(p) = rest.trim().parse::<u16>() {
                        *port_arc.lock().unwrap() = Some(p);
                        log::info!("PlutoActor: ready on port {}", p);
                        break;
                    }
                }
            }
        });
    }

    pub fn get_url(&self) -> Option<String> {
        self.port.lock().unwrap().map(|p| format!("http://localhost:{}", p))
    }

    pub fn shutdown(&self) {
        if let Some(mut child) = self.process.lock().unwrap().take() {
            child.kill().ok();
        }
    }
}
```

Register `pub mod pluto_actor;` in `app/internals/src/actors/mod.rs`.
Add `PlutoState { actor: PlutoActor }` to app state in `lib.rs`.

### 5d — Add `get_pluto_url` Tauri command

```rust
#[tauri::command]
fn get_pluto_url(state: tauri::State<'_, PlutoState>) -> Option<String> {
    state.actor.get_url()
}
```

Register in `lib.rs`. Also wire `actor.start(julia_bin, script_path)` during app setup
using the same path resolution already used for the Julia process actor.

### 5e — Create `LiveEditorPanel.vue`

**File:** `app/app/src/components/panels/LiveEditorPanel.vue`

Poll `get_pluto_url` every 1 second (max 60 tries). Show spinner while loading.
Show iframe when URL is ready. Show error state on timeout with Retry button.

```vue
<template>
  <div class="live-editor-panel">
    <div v-if="state === 'loading'" class="pluto-status">
      <div class="spinner" />
      <p>Starting Pluto server…</p>
    </div>
    <div v-else-if="state === 'timeout'" class="pluto-status">
      <p>Pluto server did not start within 60 s.</p>
      <button @click="retry">Retry</button>
    </div>
    <iframe v-else-if="state === 'ready'" :src="plutoUrl"
            class="pluto-frame" allow="clipboard-read; clipboard-write" />
  </div>
</template>
```

### 5f — Wire in `MainLayout.vue`

Import `LiveEditorPanel`. Receive `@tab-change` event from `RibbonBar`.
In the center pane: `<LiveEditorPanel v-if="activeTab === 'LIVE EDITOR'" />` else show FileEditor.

Wire LIVE EDITOR in `RibbonBar.vue` `tabComponents` with a stub `LiveEditorToolbar.vue`.

**Smoke test:** Click LIVE EDITOR tab → spinner appears → Pluto loads in iframe within 60s.

---

## Task 6 — INSERT Tab (Contextual)

**Prerequisite:** Task 5 must be fully working before starting this task.

### 6a — Disable INSERT unless LIVE EDITOR is active

In `RibbonBar.vue`, track contextual tabs:
```ts
const contextualTabs = { 'INSERT': 'LIVE EDITOR' }
function isTabDisabled(tab) {
  return tab in contextualTabs && activeTab.value !== contextualTabs[tab]
}
```

**FIX (plan_review.md #3):** The app uses plain CSS ribbon tabs, NOT Naive UI `n-tabs`.
The selector `.n-tabs-tab--disabled` will silently do nothing. Use the correct class
that matches the existing ribbon tab markup — read `RibbonBar.vue` first to confirm
the exact class name, then add to `theme.css`:
```css
.ribbon-tab.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}
```
(Adapt the selector to match whatever class the ribbon tab elements actually have.)

### 6b — Create `InsertToolbar.vue`

**File:** `app/app/src/components/ribbon/InsertToolbar.vue`

**FIX applied (plan_review.md #5):** Cell insertion uses `postMessage` to the Pluto
iframe — NOT a REST API. Pluto uses a WebSocket protocol internally; there is no
stable REST endpoint for cell creation.

**Before implementing:** Read the Pluto.jl WebSocket message source at:
`~/.julia/packages/Pluto/<version>/src/webserver/`
and open Pluto in a browser → inspect Network → WS to see the exact `type` field
name used for adding a cell. The helper below uses approximate format for Pluto ~0.19.x.
**Verify the exact `type` field before shipping.**

```ts
async function insertCell(code: string) {
  const origin = await invoke('get_pluto_url')
  if (!origin) { console.warn('InsertToolbar: Pluto not ready'); return }
  const iframe = document.querySelector('.pluto-frame') as HTMLIFrameElement
  if (!iframe?.contentWindow) { console.warn('InsertToolbar: iframe not found'); return }
  // Verify message format against Pluto WebSocket source before shipping
  iframe.contentWindow.postMessage(
    { type: 'cell_input', cell_id: crypto.randomUUID(), code, is_new: true },
    origin
  )
}
```

Groups: CODE | CONTROLS (Slider, Checkbox, Dropdown, Button) | CONTENT (Equation, Image, Hyperlink, Table) | STRUCTURE (Section Break, Table of Contents)

Wire in `RibbonBar.vue`:
```ts
import InsertToolbar from '../ribbon/InsertToolbar.vue'
// INSERT: InsertToolbar
```

Add stub Tauri command `pick_image_file` that returns `Option<String>` (native file picker).

**Smoke test:** With LIVE EDITOR active, INSERT tab is enabled and clickable.
Without LIVE EDITOR, INSERT tab is greyed out.

---

## Task 7A — Async Revise Loading

**File:** `app/internals/src/actors/process_actor/lifecycle.rs`

**FIX applied (plan_review.md #6):** Read the file first. Identify the channel sender
type and variable name. Execute in this exact order to avoid a double-load:

**Step 1 — Find the blocking Revise send.** Search for `using Revise` in the file.
Note its exact line range.

**Step 2 — Delete the blocking send** (the entire block, not just the function call).
This must happen before adding the spawn, or Revise loads twice.

**Step 3 — Add the async spawn** immediately before the ready-signal emit. Clone
the sender BEFORE the spawn — do not move `tx` if it is used after the spawn:

```rust
// Read the actual sender variable name from the file before implementing
let tx_revise = tx.clone();  // MUST clone before spawn

tokio::spawn(async move {
    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
    // Use tx_revise (not tx) inside the spawn
    // Adapt to actual send function used in the file
    send_julia_command(&tx_revise, "using Revise").await;
    log::info!("ProcessActor: Revise loaded asynchronously");
});

// Return immediately — do not wait for spawn to complete
emit_ready_signal();  // adapt to actual function name
```

Do NOT guess function or variable names — read the file first.

**Smoke test:** Julia reaches Ready state faster (~2s). Revise loads a moment later.
No regression in Revise-watching functionality.

---

## Task 7B — Pkg.instantiate() Staleness Check

**File:** `app/internals/scripts/core/packages.jl`

Read the file first. Wrap the existing `Pkg.instantiate()` call in a staleness guard:

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

`@__DIR__` resolves to the scripts directory inside AppData at runtime.
The `.pkg_stamp` file is created there after the first successful instantiation.

**Smoke test:** Restart JuliaLab twice. Second startup logs "skipping Pkg.instantiate()"
and starts measurably faster.

---

## Execution Order

| Step | Task | Smoke test |
|---|---|---|
| 1 | Sysimage wiring | Sysimage log line appears; startup time reported |
| 2 | Splitpanes fix | All four pane handles drag and resize with 6px handles |
| 3a | Ribbon primitives | RibbonGroup / RibbonButton / RibbonToggle compile |
| 3b | PlotsToolbar | PLOTS tab shows toolbar; gallery buttons send Julia code |
| 3c-d | Plot Tauri commands | Compiles; plot commands log correctly |
| 4 | Apps tab | Gallery renders 7 cards; My Apps scans apps dir |
| 5a | CSP fix | `npm run tauri dev` still builds |
| 5b-f | Pluto integration | LIVE EDITOR shows spinner then Pluto UI in iframe |
| 6 | Insert tab | INSERT greyed out except when LIVE EDITOR active |
| 7A | Async Revise | Ready fires within ~2s; Revise loads async after |
| 7B | Pkg staleness | Second launch skips Pkg.instantiate() |

---

## Files Created (Net New)

| File | Task |
|---|---|
| `app/app/src/components/ribbon/RibbonGroup.vue` | 3a |
| `app/app/src/components/ribbon/RibbonButton.vue` | 3a |
| `app/app/src/components/ribbon/RibbonToggle.vue` | 3a |
| `app/app/src/components/ribbon/PlotsToolbar.vue` | 3b |
| `app/app/src/components/ribbon/AppsToolbar.vue` | 4a |
| `app/app/src/features/apps/AppsPanel.vue` | 4c |
| `app/app/src/components/panels/LiveEditorPanel.vue` | 5e |
| `app/app/src/components/ribbon/LiveEditorToolbar.vue` (stub) | 5f |
| `app/app/src/components/ribbon/InsertToolbar.vue` | 6b |
| `app/internals/scripts/core/start_pluto.jl` (verify path with lifecycle.rs) | 5b |
| `app/internals/src/actors/pluto_actor.rs` | 5c |

## Files Modified

| File | Tasks |
|---|---|
| `app/app/src/styles/theme.css` | 2, 6 |
| `app/app/src/components/layouts/MainLayout.vue` | 2, 4, 5 |
| `app/app/src/components/layouts/RibbonBar.vue` | 3, 4, 5, 6 |
| `app/app/src/store/layoutStore.ts` | 4 |
| `app/app/src-tauri/src/commands/` (plot/apps/pluto) | 3, 4, 5, 6 |
| `app/app/src-tauri/src/lib.rs` | 3, 4, 5, 6 |
| `app/app/src-tauri/tauri.conf.json` | 5a |
| `app/internals/src/actors/mod.rs` | 5c |
| `app/internals/src/actors/process_actor/lifecycle.rs` | 7A |
| `app/internals/scripts/core/packages.jl` | 7B |

---

## Verification Checklist (Definition of Done)

- [ ] **T1** — `"ProcessActor: Loading sysimage"` log line present; startup time reported
- [ ] **T2** — All four pane splitters drag and resize with 6px handles
- [ ] **T3** — PLOTS tab shows full toolbar; gallery buttons send Julia code and produce plots
- [ ] **T3** — Export opens native save dialog (stub is fine)
- [ ] **T4** — APPS tab shows toolbar; App Gallery grid shows 7 cards; Run executes Julia
- [ ] **T5a** — tauri.conf.json CSP updated; app still builds
- [ ] **T5** — LIVE EDITOR tab starts Pluto and embeds it in an iframe within 60s
- [ ] **T6** — INSERT tab is greyed out on all tabs except LIVE EDITOR
- [ ] **T6** — INSERT buttons post message to Pluto iframe (verify exact format first)
- [ ] **T7A** — Ready signal fires within ~2s; Revise loads async after
- [ ] **T7B** — Second startup logs "skipping Pkg.instantiate()" and is measurably faster
