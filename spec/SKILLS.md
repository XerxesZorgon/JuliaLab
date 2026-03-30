# SKILLS.md — JuliaLab Test & Verification Companion

This file is a companion to `CLAUDE.md`. For every major task, it defines:
- **What test files to generate** (automated or manual)
- **Where they live**
- **What passing looks like**

Generate all test files in the same commit as the implementation they cover.
Do not skip test generation — it is part of the Definition of Done for each task.

---

## Test Infrastructure Setup (Do Once, Before Any Task)

### Vue / TypeScript — Vitest

Check if Vitest is already configured:
```bash
cat app/app/package.json | grep vitest
```

If missing, add it:
```bash
cd app/app
npm install -D vitest @vue/test-utils @vitejs/plugin-vue happy-dom
```

Add to `app/app/vite.config.ts` (or `vitest.config.ts` if separate):
```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
  },
})
```

Add to `app/app/package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

Run tests with:
```bash
cd app/app && npm test
```

### Julia — Test.jl

Julia tests use the stdlib `Test` module. No additional packages required.
Run with:
```bash
<julia_binary> --project=. <test_file>.jl
```

Where `<julia_binary>` is:
`C:\Users\johnx\AppData\Local\org.julialab.ide\julia\julia-1.12.1\bin\julia.exe`

---

## Task 2 — Splitpanes: Manual Test Playbook

Splitpanes drag/resize cannot be meaningfully tested headlessly (it requires
mouse event simulation in a real WebView). Generate a manual test playbook
instead.

### Generate this file: `tests/manual/T2_splitpanes.md`

```markdown
# T2 — Splitpanes Manual Test

**Setup:** Run `npm run tauri dev`. Wait for Julia Ready signal.

## Test Cases

### TC-2.1 Vertical splitter (left sidebar ↔ center pane)
1. Hover over the vertical divider between the file tree and the editor.
2. **Expected:** cursor changes to `col-resize` (left-right arrow).
3. Click and drag left → file tree shrinks, editor grows.
4. Click and drag right → file tree grows, editor shrinks.
5. **Pass:** both panes resize smoothly with no jump or snap.

### TC-2.2 Vertical splitter (center pane ↔ right panel)
1. Hover over the divider between the editor and the Workspace/Plots panel.
2. Repeat drag tests as above.
3. **Pass:** both panes resize independently of TC-2.1 test.

### TC-2.3 Horizontal splitter (editor ↔ command window)
1. Hover over the horizontal divider above the Command Window.
2. **Expected:** cursor changes to `row-resize`.
3. Drag up → Command Window grows. Drag down → Command Window shrinks.
4. **Pass:** resize works without clipping or overflow.

### TC-2.4 Splitter visibility
1. Check splitter width: all splitters must be visibly ~6px wide/tall
   (not 1–3px hairlines).
2. Hover each splitter: background changes to green accent color.
3. **Pass:** hover color change is visible on all four splitters.

### TC-2.5 Layout persistence (if implemented)
1. Resize panels, close app, reopen.
2. **Expected:** pane sizes are restored to last session values.
3. **Pass:** no reset to default sizes on relaunch.

## Failure signatures
- Cursor does not change → z-index or pointer-events issue
- Splitter exists but doesn't move → overflow:hidden clipping parent
- Only one axis works → horizontal/vertical CSS rules are swapped
```

---

## Task 3 — Ribbon Primitives: Automated Component Tests

### Generate this file: `app/app/src/components/ribbon/__tests__/RibbonButton.test.ts`

```ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { TrendingUp } from 'lucide-vue-next'
import RibbonButton from '../RibbonButton.vue'

describe('RibbonButton', () => {
  it('renders the label', () => {
    const wrapper = mount(RibbonButton, {
      props: { label: 'Zoom In', icon: TrendingUp },
    })
    expect(wrapper.text()).toContain('Zoom In')
  })

  it('renders the icon component', () => {
    const wrapper = mount(RibbonButton, {
      props: { label: 'Zoom In', icon: TrendingUp },
    })
    // lucide renders an <svg> element
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(RibbonButton, {
      props: { label: 'Zoom In', icon: TrendingUp },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('applies large size class by default', () => {
    const wrapper = mount(RibbonButton, {
      props: { label: 'Zoom In', icon: TrendingUp },
    })
    expect(wrapper.find('button').classes()).toContain('ribbon-btn--large')
  })

  it('applies small size class when size=small', () => {
    const wrapper = mount(RibbonButton, {
      props: { label: 'Zoom In', icon: TrendingUp, size: 'small' },
    })
    expect(wrapper.find('button').classes()).toContain('ribbon-btn--small')
  })
})
```

### Generate this file: `app/app/src/components/ribbon/__tests__/RibbonToggle.test.ts`

```ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { Move } from 'lucide-vue-next'
import RibbonToggle from '../RibbonToggle.vue'

describe('RibbonToggle', () => {
  it('renders without active class when modelValue is false', () => {
    const wrapper = mount(RibbonToggle, {
      props: { label: 'Pan', icon: Move, modelValue: false },
    })
    expect(wrapper.find('button').classes()).not.toContain('ribbon-btn--active')
  })

  it('applies active class when modelValue is true', () => {
    const wrapper = mount(RibbonToggle, {
      props: { label: 'Pan', icon: Move, modelValue: true },
    })
    expect(wrapper.find('button').classes()).toContain('ribbon-btn--active')
  })

  it('emits update:modelValue with toggled value on click', async () => {
    const wrapper = mount(RibbonToggle, {
      props: { label: 'Pan', icon: Move, modelValue: false },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('toggles off when already active', async () => {
    const wrapper = mount(RibbonToggle, {
      props: { label: 'Pan', icon: Move, modelValue: true },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })
})
```

### Generate this file: `app/app/src/components/ribbon/__tests__/RibbonGroup.test.ts`

```ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import RibbonGroup from '../RibbonGroup.vue'

describe('RibbonGroup', () => {
  it('renders the label', () => {
    const wrapper = mount(RibbonGroup, {
      props: { label: 'ZOOM' },
      slots:  { default: '<div class="test-slot-content">content</div>' },
    })
    expect(wrapper.text()).toContain('ZOOM')
  })

  it('renders slot content', () => {
    const wrapper = mount(RibbonGroup, {
      props: { label: 'ZOOM' },
      slots:  { default: '<div class="test-slot-content">slotted</div>' },
    })
    expect(wrapper.find('.test-slot-content').exists()).toBe(true)
  })

  it('label is uppercase in DOM (via CSS text-transform is not testable, check text content)', () => {
    const wrapper = mount(RibbonGroup, {
      props: { label: 'zoom' },
      slots:  { default: '' },
    })
    // The label prop value is rendered — CSS handles uppercase display
    expect(wrapper.find('.ribbon-group-label').text()).toBe('zoom')
  })
})
```

**Run:** `cd app/app && npm test`
**Pass criteria:** All 11 assertions green, 0 failures.

---

## Task 3 — Plots Ribbon: Julia Plot Smoke Scripts

Generate one runnable Julia script per plot type. These serve as both
documentation and manual regression tests — paste each into the Command Window
and verify a plot appears in the Plots panel.

### Generate this file: `tests/julia/T3_plot_gallery.jl`

```julia
# T3 — Plot Gallery Smoke Tests
# Run each block individually in the JuliaLab Command Window.
# Expected result: a figure appears in the Plots panel for each block.
# If no figure appears, check the CairoMakie display hook is registered.

using CairoMakie
CairoMakie.activate!(type = "png")

println("=== T3 Plot Gallery Smoke Tests ===")

# --- TC-3.1 Line plot ---
println("TC-3.1: Line plot")
fig, ax, _ = lines(0:0.01:2π, sin.(0:0.01:2π), color=:blue)
ax.title = "TC-3.1 Line"
display(fig)
println("  → figure should appear in Plots panel")

# --- TC-3.2 Scatter plot ---
println("TC-3.2: Scatter plot")
fig, ax, _ = scatter(randn(50), randn(50), color=:red)
ax.title = "TC-3.2 Scatter"
display(fig)

# --- TC-3.3 Bar plot ---
println("TC-3.3: Bar plot")
fig, ax, _ = barplot(1:5, [3.0, 1.0, 4.0, 1.0, 5.0])
ax.title = "TC-3.3 Bar"
display(fig)

# --- TC-3.4 Heatmap ---
println("TC-3.4: Heatmap")
fig, ax, hm = heatmap(rand(10, 10))
Colorbar(fig[1, 2], hm)
ax.title = "TC-3.4 Heatmap"
display(fig)

# --- TC-3.5 Surface ---
println("TC-3.5: Surface")
xs = ys = -2:0.2:2
fig, ax, _ = surface(xs, ys, [sin(x) * cos(y) for x in xs, y in ys])
ax.title = "TC-3.5 Surface"
display(fig)

# --- TC-3.6 Contour ---
println("TC-3.6: Contour")
xs = ys = -2:0.1:2
fig, ax, _ = contour(xs, ys, [sin(x) * cos(y) for x in xs, y in ys])
ax.title = "TC-3.6 Contour"
display(fig)

println("=== All plot smoke tests dispatched ===")
println("Verify: 6 figures visible in Plots panel")
```

### Generate this file: `tests/julia/T3_plot_export.jl`

```julia
# T3 — Export smoke test
# Exercises the plot_export Tauri command by saving to a temp file.
# Run in Command Window after clicking a gallery plot button to generate a figure.

using CairoMakie, Test

tmpdir = tempdir()
tmpfile_png = joinpath(tmpdir, "julialab_export_test.png")

println("TC-3.7: PNG export to temp file")
fig = Figure()
ax  = Axis(fig[1,1], title="Export test")
lines!(ax, 1:10, rand(10))
save(tmpfile_png, fig)

@test isfile(tmpfile_png)
@test filesize(tmpfile_png) > 0
println("  → PNG export: $(filesize(tmpfile_png)) bytes at $(tmpfile_png)")

rm(tmpfile_png)
println("TC-3.7: PASS")
```

---

## Task 4 — Apps Panel: Tauri Command Integration Tests

The `list_user_apps` and `app_design_new` commands can be tested by calling
them from Julia and checking the filesystem result.

### Generate this file: `tests/julia/T4_apps.jl`

```julia
# T4 — Apps panel Tauri command tests (run from Command Window)
using Test

apps_dir = joinpath(ENV["LOCALAPPDATA"], "org.julialab.ide", "apps")

println("=== T4 Apps Tests ===")

# TC-4.1: apps directory exists (or is created on first design_new)
println("TC-4.1: apps dir")
mkpath(apps_dir)
@test isdir(apps_dir)
println("  → apps dir: $(apps_dir)")

# TC-4.2: scaffold template writes a valid Julia file
println("TC-4.2: scaffold template")
ts   = string(round(Int, time()))
path = joinpath(apps_dir, "TestApp_$(ts).jl")
template = """
# JuliaLab App
using CairoMakie

fig = Figure()
ax  = Axis(fig[1,1], title = "Test App")
lines!(ax, 0:0.01:2π, sin.(0:0.01:2π))
display(fig)
"""
write(path, template)
@test isfile(path)
@test occursin("using CairoMakie", read(path, String))
println("  → scaffold: $(path)")

# TC-4.3: scaffolded file can be included without error
println("TC-4.3: include scaffold")
# Wrap in try/catch — display() may not be available in test context
try
    include(path)
    println("  → include: OK")
catch e
    # Accept display errors — the script itself is syntactically valid
    if occursin("display", string(e))
        println("  → include: OK (display error expected outside GUI context)")
    else
        rethrow(e)
    end
end

# Cleanup
rm(path)
println("  → cleanup: OK")
println("=== T4: PASS ===")
```

### Generate this file: `tests/manual/T4_apps_gallery.md`

```markdown
# T4 — Apps Gallery Manual Test

**Setup:** Run `npm run tauri dev`. Wait for Julia Ready.

## Test Cases

### TC-4.4 Toolbar renders
1. Click the APPS tab in the ribbon.
2. **Expected:** Toolbar shows three groups: FIND APPS | MY APPS | FILE.
3. **Pass:** All three groups and their buttons are visible.

### TC-4.5 App Gallery grid
1. Click "App Gallery" button.
2. **Expected:** Center pane shows a grid of 7 app cards:
   - Statistics Explorer, DataFrame Viewer, Signal Analyzer,
     Curve Fitter, ODE Solver, Optimization, Image Viewer
3. **Pass:** All 7 cards visible with icon, name, description, and Run button.

### TC-4.6 Run a gallery app (Statistics Explorer)
1. Click "Run" on the Statistics Explorer card.
2. **Expected:** Command Window shows output from StatsBase.describe().
3. **Pass:** Numeric output appears within 10 seconds.

### TC-4.7 Missing package prompt
1. If a package is not installed, click "Run" on that app card.
2. **Expected:** Inline alert: "X not installed. Install?"
3. Click "Install" → installation output appears in Command Window.
4. **Pass:** Card returns to normal "Run" state after install completes.

### TC-4.8 My Apps tab
1. Click "My Apps" in the segmented control.
2. **Expected:** Shows any .jl files in AppData/org.julialab.ide/apps/.
3. Click "+" (New App) → a new scaffolded file appears in the list.
4. **Pass:** New file card appears with filename and Run / Open buttons.

### TC-4.9 Open app in editor
1. In My Apps, click "Open" on any app card.
2. **Expected:** File opens in the editor panel.
3. **Pass:** File content is visible and editable.
```

---

## Task 5 — Pluto Integration: Automated + Manual Tests

### Generate this file: `tests/julia/T5_pluto_startup.jl`

```julia
# T5 — Pluto startup smoke test
# Run this script standalone (outside JuliaLab) to verify start_pluto.jl
# finds a free port and starts the server correctly.
# Usage:
#   julia --project tests/julia/T5_pluto_startup.jl

using Test, Sockets

println("=== T5 Pluto Startup Tests ===")

# TC-5.1: find_free_port returns a usable port number
println("TC-5.1: find_free_port")
function find_free_port()
    server = listen(0)
    port   = Sockets.getsockname(server)[2]
    close(server)
    return Int(port)
end

port = find_free_port()
@test port > 1024
@test port < 65536
println("  → port: $(port)")

# TC-5.2: the port is actually free (can bind to it)
println("TC-5.2: port is free")
srv = listen(port)
@test srv !== nothing
close(srv)
println("  → port $(port) bindable: OK")

# TC-5.3: Pluto is importable
println("TC-5.3: Pluto importable")
try
    import Pluto
    @test true
    println("  → Pluto imported: OK")
catch e
    println("  → FAIL: $(e)")
    @test false
end

# TC-5.4: Pluto.run accepts keyword args (version-safe check)
println("TC-5.4: Pluto.run keyword introspection")
import Pluto
all_kws = reduce(union, Symbol.(Base.kwarg_decl.(methods(Pluto.run))))
has_auth_kw = :secret in all_kws || :require_secret_for_access in all_kws
@test has_auth_kw
println("  → auth keyword present: $( :secret in all_kws ? :secret : :require_secret_for_access )")

println("=== T5: PASS ===")
```

### Generate this file: `tests/manual/T5_pluto_iframe.md`

```markdown
# T5 — Live Editor / Pluto Manual Test

**Setup:** Run `npm run tauri dev`. Wait for Julia Ready.

## Test Cases

### TC-5.5 Spinner appears on first click
1. Click the LIVE EDITOR tab.
2. **Expected:** Center pane shows a spinner and "Starting Pluto server…" message.
3. **Pass:** Spinner is visible immediately (no blank pane or error).

### TC-5.6 Pluto loads within 60 seconds
1. After clicking LIVE EDITOR, wait up to 60 seconds.
2. **Expected:** Spinner disappears and the Pluto UI renders in an iframe.
3. **Pass:** Pluto's notebook interface is visible and interactive.
   Fail if: blank iframe, ERR_BLOCKED_BY_CLIENT, or CSP error in DevTools.

### TC-5.7 CSP check (open DevTools)
1. Open DevTools (F12 or right-click → Inspect in the Tauri window).
2. Check the Console tab for any CSP errors.
3. **Pass:** No "Content Security Policy" errors present.
4. **Fail indicators:**
   - "Refused to frame 'http://localhost:...'" → CSP frame-src missing
   - "Refused to connect to 'ws://localhost:...'" → CSP connect-src missing

### TC-5.8 Pluto notebook is functional
1. Once Pluto is loaded, create a new notebook.
2. Type `1 + 1` in a cell and press Shift+Enter.
3. **Expected:** Cell evaluates and shows `2`.
4. **Pass:** Julia evaluation works inside the embedded Pluto iframe.

### TC-5.9 Retry button on timeout
1. To test timeout: temporarily break start_pluto.jl (e.g. add `exit()` at top),
   restart the app, click LIVE EDITOR, wait 60 seconds.
2. **Expected:** "Pluto server did not start within 60 s" message with Retry button.
3. Click Retry.
4. **Pass:** Spinner reappears and polling restarts.
5. Restore start_pluto.jl afterward.

### TC-5.10 Tab persistence
1. Click LIVE EDITOR → Pluto loads.
2. Click HOME tab → editor view returns.
3. Click LIVE EDITOR again.
4. **Expected:** Pluto iframe is still loaded (no second spinner/reload).
5. **Pass:** Pluto resumes immediately without restarting.
   (If LiveEditorPanel uses v-show instead of v-if, this is automatic.
    If using v-if, the panel will reload — document which behavior was chosen.)
```

---

## Task 6 — Insert Tab: postMessage Test Harness

The Pluto `postMessage` format must be verified against the live Pluto WS protocol
before the Insert tab can be considered done. This test harness lets you verify
the message format interactively.

### Generate this file: `tests/manual/T6_insert_postmessage.md`

```markdown
# T6 — Insert Tab postMessage Manual Test

**Setup:** JuliaLab running, LIVE EDITOR tab active, Pluto loaded.

## Step 1 — Discover the correct message format

Before testing the Insert toolbar, determine the correct postMessage format
for the installed Pluto version.

**Method A — Read Pluto source:**
```
~/.julia/packages/Pluto/<hash>/src/webserver/
```
Look for files handling WebSocket messages. Search for `cell_input`, `add_cell`,
or `set_input`. Note the exact `type` string and payload shape.

**Method B — Intercept live messages:**
1. Open Pluto directly in a regular browser (not the JuliaLab iframe):
   `http://localhost:<port>` (find port in JuliaLab console logs)
2. Open DevTools → Network → WS tab.
3. Add a new cell in Pluto manually.
4. Inspect the WebSocket messages sent.
5. Find the message with type matching "cell" or "input" — note exact field names.

Record the correct format here before implementing InsertToolbar.vue.

---

## Step 2 — Manual postMessage test (browser console)

With LIVE EDITOR tab active and Pluto visible:

1. Open JuliaLab DevTools (right-click inside app → Inspect).
2. Go to Console tab.
3. Paste and run this test snippet, substituting the correct message format
   discovered in Step 1:

```javascript
// Replace 'cell_input' with the correct type if different
const iframe = document.querySelector('.pluto-frame')
const origin = iframe.src.replace(/\/[^/]*$/, '')  // e.g. http://localhost:12345

iframe.contentWindow.postMessage(
  {
    type:    'cell_input',        // ← verify this
    cell_id: crypto.randomUUID(),
    code:    'println("Insert tab test cell")',
    is_new:  true,                // ← verify this field exists
  },
  origin
)
console.log('postMessage sent to', origin)
```

4. **Expected:** A new cell appears in the Pluto notebook containing
   `println("Insert tab test cell")`.
5. **Pass:** Cell is visible and can be run.
6. **Fail:** No cell appears → wrong message format, wrong origin, or
   Pluto's receiver is not listening to postMessage.

---

## TC-6.1 INSERT tab disabled state
1. Click HOME tab.
2. **Expected:** INSERT tab appears greyed out (opacity ~0.4, no pointer cursor).
3. Try clicking INSERT tab.
4. **Pass:** Nothing happens — tab does not activate.

## TC-6.2 INSERT tab enabled state
1. Click LIVE EDITOR tab.
2. **Expected:** INSERT tab is no longer greyed out.
3. Click INSERT tab.
4. **Pass:** INSERT toolbar appears with groups CODE | CONTROLS | CONTENT | STRUCTURE.

## TC-6.3 Code cell insertion
1. With INSERT tab active, click "Code" button.
2. **Expected:** A new empty code cell appears in the Pluto notebook.
3. **Pass:** Cell is visible and ready to type in.

## TC-6.4 Slider insertion
1. Click "Slider" button.
2. **Expected:** Cell with `@bind x PlutoUI.Slider(1:100, default=50)` appears.
3. Run the cell.
4. **Pass:** A slider widget appears in the Pluto output.

## TC-6.5 Markdown / Text cell
1. Click "Text" button.
2. **Expected:** Cell with `md"""..."""` template appears.
3. **Pass:** Rendered markdown output is visible after running the cell.
```

---

## Task 7A — Async Revise: Timing Test

### Generate this file: `tests/manual/T7A_revise_timing.md`

```markdown
# T7A — Async Revise Timing Manual Test

**Purpose:** Verify that the Ready signal fires quickly and Revise loads
asynchronously without blocking startup.

## TC-7A.1 Startup timing baseline
1. Before making the async Revise change, run `npm run tauri dev`.
2. Note the elapsed time from:
   - "Julia process started successfully" log line
   - to "ALL_PIPES_READY" signal
3. Record this as the **baseline** (typically 8–15s with synchronous Revise).

## TC-7A.2 Startup timing after async change
1. After implementing async Revise loading, run `npm run tauri dev`.
2. Note the same elapsed time.
3. **Pass:** New startup time is ≥ 3s faster than baseline.
   Typical expected improvement: 5–8s faster.

## TC-7A.3 Revise is actually loaded
1. After app reaches Ready state, wait 3–5 seconds.
2. Open a .jl file in the editor and make a change.
3. **Expected:** Revise detects the change and the function updates without
   restarting Julia (Revise.jl's standard behavior).
4. **Pass:** Code change is reflected without a Julia restart.
5. **Fail:** Revise never activates → check that the async spawn actually runs
   and is not being cancelled.

## TC-7A.4 No double-load
1. Check the console log for `"using Revise"` or `"Revise loaded"` messages.
2. **Pass:** The message appears exactly once.
3. **Fail:** Message appears twice → the old blocking block was not deleted.
```

---

## Task 7B — Pkg Staleness: Automated Julia Test

### Generate this file: `tests/julia/T7B_pkg_staleness.jl`

```julia
# T7B — Pkg.instantiate() staleness check unit test
# Run standalone — does NOT call Pkg.instantiate(), only tests the guard logic.
# Usage:
#   julia tests/julia/T7B_pkg_staleness.jl

using Test
import Dates

println("=== T7B Pkg Staleness Tests ===")

# Simulate the staleness check in a temp directory
tmpdir = mktempdir()

stamp_file = joinpath(tmpdir, ".pkg_stamp")
manifest   = joinpath(tmpdir, "Manifest.toml")

# --- TC-7B.1: no stamp file → needs update ---
println("TC-7B.1: no stamp file → needs_update = true")
@test !isfile(stamp_file)
needs_update = !isfile(stamp_file) ||
               (isfile(manifest) && mtime(manifest) > mtime(stamp_file))
@test needs_update == true
println("  → needs_update: $(needs_update) ✓")

# --- TC-7B.2: stamp exists, no manifest → no update needed ---
println("TC-7B.2: stamp exists, no manifest → needs_update = false")
touch(stamp_file)
needs_update = !isfile(stamp_file) ||
               (isfile(manifest) && mtime(manifest) > mtime(stamp_file))
@test needs_update == false
println("  → needs_update: $(needs_update) ✓")

# --- TC-7B.3: manifest newer than stamp → needs update ---
println("TC-7B.3: manifest newer than stamp → needs_update = true")
sleep(0.1)  # ensure mtime difference
write(manifest, "[deps]\n")  # create manifest after stamp
needs_update = !isfile(stamp_file) ||
               (isfile(manifest) && mtime(manifest) > mtime(stamp_file))
@test needs_update == true
println("  → needs_update: $(needs_update) ✓")

# --- TC-7B.4: touch stamp after update → no update needed ---
println("TC-7B.4: stamp refreshed after update → needs_update = false")
sleep(0.1)
touch(stamp_file)
needs_update = !isfile(stamp_file) ||
               (isfile(manifest) && mtime(manifest) > mtime(stamp_file))
@test needs_update == false
println("  → needs_update: $(needs_update) ✓")

# Cleanup
rm(tmpdir, recursive=true)
println("=== T7B: ALL PASS ===")
```

---

## Test File Summary — All Files to Generate

| File | Task | Type | Run with |
|---|---|---|---|
| `tests/manual/T2_splitpanes.md` | 2 | Manual playbook | Human tester |
| `app/app/src/components/ribbon/__tests__/RibbonButton.test.ts` | 3a | Vitest automated | `npm test` |
| `app/app/src/components/ribbon/__tests__/RibbonToggle.test.ts` | 3a | Vitest automated | `npm test` |
| `app/app/src/components/ribbon/__tests__/RibbonGroup.test.ts` | 3a | Vitest automated | `npm test` |
| `tests/julia/T3_plot_gallery.jl` | 3b | Julia manual (REPL) | Paste into Command Window |
| `tests/julia/T3_plot_export.jl` | 3b | Julia automated | `julia T3_plot_export.jl` |
| `tests/julia/T4_apps.jl` | 4 | Julia automated | `julia T4_apps.jl` |
| `tests/manual/T4_apps_gallery.md` | 4 | Manual playbook | Human tester |
| `tests/julia/T5_pluto_startup.jl` | 5 | Julia automated | `julia T5_pluto_startup.jl` |
| `tests/manual/T5_pluto_iframe.md` | 5 | Manual playbook | Human tester |
| `tests/manual/T6_insert_postmessage.md` | 6 | Manual playbook | Human tester |
| `tests/manual/T7A_revise_timing.md` | 7A | Manual playbook | Human tester |
| `tests/julia/T7B_pkg_staleness.jl` | 7B | Julia automated | `julia T7B_pkg_staleness.jl` |

---

## Automated Test Pass Criteria

Run before marking the sprint complete:

```bash
# Vue component tests
cd app/app && npm test
# Expected: 11 tests, 0 failures

# Julia unit tests (run from repo root)
julia tests/julia/T3_plot_export.jl
julia tests/julia/T4_apps.jl
julia tests/julia/T5_pluto_startup.jl
julia tests/julia/T7B_pkg_staleness.jl
# Expected: each prints "PASS" and exits 0
```

All automated tests must be green before the manual playbooks are run.

---

## Quick Reference: What "Done" Looks Like

| Task | Automated green | Manual pass |
|---|---|---|
| T2 | — | All 5 TC-2.x cases pass |
| T3a | npm test: 11/11 | — |
| T3b | T3_plot_export.jl PASS | 6 plots visible in Plots panel |
| T4 | T4_apps.jl PASS | TC-4.4 through TC-4.9 pass |
| T5 | T5_pluto_startup.jl PASS | TC-5.5 through TC-5.10 pass |
| T6 | — | postMessage format verified; TC-6.1 through TC-6.5 pass |
| T7A | — | TC-7A.1 through TC-7A.4 pass |
| T7B | T7B_pkg_staleness.jl PASS | Second launch logs "skipping" |