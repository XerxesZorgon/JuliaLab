# Task 1a-gl — GoldenLayout Diagnostic + Correct Vue 3 Integration

**STOP patching. Diagnose first, then rewrite using the correct integration pattern.**

The repeated fix attempts indicate the wrong integration approach is being used.
This task replaces all previous GoldenLayout wiring with a single correct pattern.

---

## Step 0 — Diagnose Before Writing Any Code

### 0a — Read the browser console

Run `npm run tauri dev`. Open DevTools (F12). Go to the **Console** tab.
Copy every error and warning message. Report them verbatim before doing anything else.

Look specifically for:
- `GoldenLayout` instantiation errors
- `Cannot read properties of null` (missing container element)
- `bindComponent` or `registerComponent` errors
- Vue warnings about missing template refs
- Any `undefined is not a function` on GoldenLayout methods

### 0b — Read all current GoldenLayout-related files in full

```
app/app/src/components/layouts/MainLayout.vue   ← the GoldenLayout host
app/app/src/store/layoutStore.ts                ← layout state
```

Report exactly:
1. How the GoldenLayout instance is being created
2. How components are being registered (which API: `registerComponent`,
   `registerComponentFactoryFunction`, or `bindComponent`/`unbindComponent`)
3. Where `loadLayout()` is called relative to component registration
4. Whether the root container `<div>` has a fixed height at mount time

Do not write any fix until 0a and 0b are complete and reported.

---

## Step 1 — The Correct Vue 3 + GoldenLayout 2.x Integration Pattern

The reliable integration approach for Vue 3 is
**`registerComponentFactoryFunction`** — not `bindComponent`, not template refs
on host divs. `bindComponent` is designed for React and is the source of the
ref issues. Discard any code using `bindComponent`.

### How it works

GoldenLayout calls your factory function when it needs to create a panel.
The factory receives a `container` object whose `.element` is a real DOM node.
You mount a Vue app into that DOM node directly.

```ts
import { createApp, defineComponent, h } from 'vue'
import { GoldenLayout } from 'golden-layout'

// The factory function approach — one per panel type
layout.registerComponentFactoryFunction('FileTree', (container, state) => {
  const app = createApp(FileTreeComponent)
  // Pass any props via state
  app.mount(container.element)
  // Store app reference so we can unmount it later
  container.stateRequestEvent = () => state
  container.element._vueApp = app
})
```

For unmounting (to prevent memory leaks), listen to the container's close event:

```ts
layout.registerComponentFactoryFunction('FileTree', (container, state) => {
  const app = createApp(FileTreeComponent)
  app.mount(container.element)

  container.addEventListener('destroy', () => {
    app.unmount()
  })
})
```

---

## Step 2 — Rewrite MainLayout.vue GoldenLayout Integration

**Discard all previous GoldenLayout wiring in this file. Replace it with the
pattern below. Do not preserve any bindComponent / hostRefs code.**

```vue
<template>
  <div class="julialab-root">
    <RibbonBar @tab-change="activeTab = $event" />
    <!-- GoldenLayout mounts here — must have explicit height -->
    <div ref="glContainer" class="gl-container" />
    <StatusBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import { createApp }    from 'vue'
import { GoldenLayout } from 'golden-layout'
import 'golden-layout/dist/css/goldenlayout-base.css'

// Import panel components — use exact names already in this file
// DO NOT invent names. Read the current file and use what is there.
import FileTreePanel      from '../panels/FileTreePanel.vue'        // adapt path
import EditorPanel        from '../panels/EditorPanel.vue'          // adapt path
import WorkspacePanel     from '../panels/WorkspacePanel.vue'       // adapt path
import CommandWindowPanel from '../panels/CommandWindowPanel.vue'   // adapt path

import RibbonBar  from './RibbonBar.vue'
import StatusBar  from './StatusBar.vue'

const glContainer = ref<HTMLElement | null>(null)
const gl          = shallowRef<GoldenLayout | null>(null)
const activeTab   = ref('HOME')

// Map component name strings to Vue components
const PANEL_MAP: Record<string, any> = {
  FileTree:      FileTreePanel,
  Editor:        EditorPanel,
  Workspace:     WorkspacePanel,
  CommandWindow: CommandWindowPanel,
}

function registerPanels(layout: GoldenLayout) {
  for (const [name, component] of Object.entries(PANEL_MAP)) {
    layout.registerComponentFactoryFunction(name, (container) => {
      // Mount the Vue component into GoldenLayout's container element
      const app = createApp(component)
      app.mount(container.element)

      // Clean up when the panel is closed/destroyed
      container.element.addEventListener('gl-destroy', () => app.unmount(), { once: true })
    })
  }
}

// Default layout config — 4-panel MATLAB-style arrangement
const DEFAULT_CONFIG = {
  root: {
    type: 'row',
    content: [
      {
        type: 'column',
        width: 20,
        content: [{ type: 'component', componentType: 'FileTree', title: 'Files' }],
      },
      {
        type: 'column',
        width: 55,
        content: [
          {
            type: 'row',
            height: 70,
            content: [{ type: 'component', componentType: 'Editor', title: 'Editor' }],
          },
          {
            type: 'row',
            height: 30,
            content: [{ type: 'component', componentType: 'CommandWindow', title: 'Command Window' }],
          },
        ],
      },
      {
        type: 'column',
        width: 25,
        content: [{ type: 'component', componentType: 'Workspace', title: 'Workspace' }],
      },
    ],
  },
}

onMounted(() => {
  if (!glContainer.value) {
    console.error('GoldenLayout: container ref is null at mount time')
    return
  }

  // Container MUST have an explicit pixel height for GoldenLayout to render
  // If .gl-container height comes from flex, GoldenLayout may get 0px at mount.
  // Force a layout after mount to ensure correct dimensions.
  const layout = new GoldenLayout(glContainer.value)
  gl.value = layout

  registerPanels(layout)

  // Try to restore saved layout; fall back to default
  const saved = localStorage.getItem('julialab-gl-layout')
  try {
    if (saved) {
      layout.loadLayout(JSON.parse(saved))
    } else {
      layout.loadLayout(DEFAULT_CONFIG)
    }
  } catch (e) {
    console.warn('GoldenLayout: failed to restore saved layout, using default', e)
    localStorage.removeItem('julialab-gl-layout')
    layout.loadLayout(DEFAULT_CONFIG)
  }

  // Save layout on every change
  layout.addEventListener('stateChanged', () => {
    try {
      localStorage.setItem('julialab-gl-layout', JSON.stringify(layout.saveLayout()))
    } catch {}
  })
})

onUnmounted(() => {
  gl.value?.destroy()
})
</script>

<style scoped>
.julialab-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.gl-container {
  flex: 1;
  /* GoldenLayout requires an explicit height — flex:1 alone may resolve to 0
     at mount time before the browser has laid out the flex container.
     overflow:hidden prevents scroll artifacts. */
  overflow: hidden;
  min-height: 0;   /* required for flex children to shrink below content height */
}
</style>

<!-- GoldenLayout theme overrides — must be global (not scoped) -->
<style>
/* Override GoldenLayout's default colors to match JuliaLab theme */
.lm_goldenlayout {
  background: var(--jl-bg, #f5f5f5);
}
.lm_header {
  background: var(--jl-panel-bg-alt, #e8e8e8);
  height: 28px !important;
}
.lm_tab {
  background: var(--jl-panel-bg-alt, #e8e8e8);
  color: var(--jl-text-muted, #666);
  border-color: var(--jl-border, #ccc);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 4px 12px;
}
.lm_tab.lm_active {
  background: var(--jl-panel-bg, #fff);
  color: var(--jl-text-primary, #222);
  border-bottom-color: var(--jl-panel-bg, #fff);
}
.lm_splitter {
  background: var(--jl-border, #ccc);
}
.lm_splitter:hover,
.lm_splitter.lm_dragging {
  background: var(--jl-accent-green, #39a84a);
}
.lm_controls .lm_close {
  /* Style the panel close button */
  opacity: 0.5;
}
.lm_controls .lm_close:hover { opacity: 1; }
</style>
```

---

## Step 3 — Critical: Container Height at Mount Time

The most common reason GoldenLayout renders blank is that the container
element has zero height when `new GoldenLayout(container)` is called.

**Verify this is not happening:**

In `onMounted`, before creating the GoldenLayout instance, add:

```ts
onMounted(() => {
  if (!glContainer.value) { /* ... */ return }

  // Log the container dimensions at mount time
  const rect = glContainer.value.getBoundingClientRect()
  console.log('GoldenLayout container dimensions at mount:', rect.width, 'x', rect.height)

  if (rect.height === 0) {
    console.error('GoldenLayout: container has zero height — panels will not render')
    // Fix: use nextTick + requestAnimationFrame to defer until layout is complete
  }
  // ... rest of init
})
```

If height is 0, wrap the GoldenLayout init in:

```ts
import { nextTick } from 'vue'

onMounted(async () => {
  await nextTick()
  requestAnimationFrame(() => {
    // GoldenLayout init here — browser has now completed layout
    const layout = new GoldenLayout(glContainer.value!)
    // ...
  })
})
```

---

## Step 4 — Proof-of-Concept Gate

Before wiring any panel content, verify GoldenLayout renders with
placeholder content. Replace the `PANEL_MAP` with simple placeholder
components:

```ts
// Temporary — replace actual panel components with placeholders
const PANEL_MAP: Record<string, any> = {
  FileTree:      { template: '<div style="padding:16px;background:#f0f8f0">Files</div>' },
  Editor:        { template: '<div style="padding:16px;background:#f0f0f8">Editor</div>' },
  Workspace:     { template: '<div style="padding:16px;background:#f8f0f0">Workspace</div>' },
  CommandWindow: { template: '<div style="padding:16px;background:#f8f8f0">Command</div>' },
}
```

**Run `npm run tauri dev`.** You must see four colored placeholder panels
arranged in the 4-pane layout with drag-to-reposition working before
substituting real panel components.

**If the placeholders appear and are draggable** → proceed to Step 5.

**If the container is still blank** → report the console output from Step 0a
and the logged container dimensions from Step 3 before doing anything else.

---

## Step 5 — Substitute Real Panel Components

Only after the proof-of-concept passes: replace the placeholder `PANEL_MAP`
entries with the actual panel component imports.

Read `MainLayout.vue` (the version before GoldenLayout migration) to find the
exact component names and import paths that were used. Do not invent paths.

If a panel component does not exist as a standalone file (e.g., if it was
rendered inline in the old MainLayout), extract it to its own file first, then
import it.

---

## Step 6 — Wire LayoutPicker to GoldenLayout

The `LayoutPicker.vue` presets no longer drive `layoutStore.layout.leftWidth`
etc. — GoldenLayout owns the layout state now. Update `applyPreset` in
`layoutStore.ts` to call `gl.value.loadLayout(preset.glConfig)` instead.

Each preset in `presets.ts` needs a `glConfig` field containing the
GoldenLayout layout JSON for that arrangement. Add a `glConfig` to each:

```ts
export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'default',
    label: 'Default',
    glConfig: {
      root: {
        type: 'row',
        content: [
          { type: 'column', width: 20, content: [{ type: 'component', componentType: 'FileTree',      title: 'Files'          }] },
          { type: 'column', width: 55, content: [
            { type: 'row',    height: 70, content: [{ type: 'component', componentType: 'Editor',        title: 'Editor'         }] },
            { type: 'row',    height: 30, content: [{ type: 'component', componentType: 'CommandWindow', title: 'Command Window' }] },
          ]},
          { type: 'column', width: 25, content: [{ type: 'component', componentType: 'Workspace',     title: 'Workspace'      }] },
        ],
      },
    },
  },
  {
    id: 'wide-editor',
    label: 'Wide Editor',
    glConfig: {
      root: {
        type: 'row',
        content: [
          { type: 'column', width: 15, content: [{ type: 'component', componentType: 'FileTree',      title: 'Files'          }] },
          { type: 'column', width: 70, content: [
            { type: 'row',    height: 70, content: [{ type: 'component', componentType: 'Editor',        title: 'Editor'         }] },
            { type: 'row',    height: 30, content: [{ type: 'component', componentType: 'CommandWindow', title: 'Command Window' }] },
          ]},
          { type: 'column', width: 15, content: [{ type: 'component', componentType: 'Workspace',     title: 'Workspace'      }] },
        ],
      },
    },
  },
  {
    id: 'command-focus',
    label: 'Command Focus',
    glConfig: {
      root: {
        type: 'row',
        content: [
          { type: 'column', width: 20, content: [{ type: 'component', componentType: 'FileTree',      title: 'Files'          }] },
          { type: 'column', width: 55, content: [
            { type: 'row',    height: 40, content: [{ type: 'component', componentType: 'Editor',        title: 'Editor'         }] },
            { type: 'row',    height: 60, content: [{ type: 'component', componentType: 'CommandWindow', title: 'Command Window' }] },
          ]},
          { type: 'column', width: 25, content: [{ type: 'component', componentType: 'Workspace',     title: 'Workspace'      }] },
        ],
      },
    },
  },
  {
    id: 'plots-focus',
    label: 'Plots Focus',
    glConfig: {
      root: {
        type: 'row',
        content: [
          { type: 'column', width: 15, content: [{ type: 'component', componentType: 'FileTree',      title: 'Files'          }] },
          { type: 'column', width: 40, content: [
            { type: 'row',    height: 70, content: [{ type: 'component', componentType: 'Editor',        title: 'Editor'         }] },
            { type: 'row',    height: 30, content: [{ type: 'component', componentType: 'CommandWindow', title: 'Command Window' }] },
          ]},
          { type: 'column', width: 45, content: [{ type: 'component', componentType: 'Workspace',     title: 'Workspace'      }] },
        ],
      },
    },
  },
  {
    id: 'wide-workspace',
    label: 'Wide Workspace',
    glConfig: {
      root: {
        type: 'row',
        content: [
          { type: 'column', width: 15, content: [{ type: 'component', componentType: 'FileTree',      title: 'Files'          }] },
          { type: 'column', width: 45, content: [
            { type: 'row',    height: 70, content: [{ type: 'component', componentType: 'Editor',        title: 'Editor'         }] },
            { type: 'row',    height: 30, content: [{ type: 'component', componentType: 'CommandWindow', title: 'Command Window' }] },
          ]},
          { type: 'column', width: 40, content: [{ type: 'component', componentType: 'Workspace',     title: 'Workspace'      }] },
        ],
      },
    },
  },
  {
    id: 'no-sidebar',
    label: 'No Sidebar',
    glConfig: {
      root: {
        type: 'row',
        content: [
          { type: 'column', width: 75, content: [
            { type: 'row',    height: 70, content: [{ type: 'component', componentType: 'Editor',        title: 'Editor'         }] },
            { type: 'row',    height: 30, content: [{ type: 'component', componentType: 'CommandWindow', title: 'Command Window' }] },
          ]},
          { type: 'column', width: 25, content: [{ type: 'component', componentType: 'Workspace',     title: 'Workspace'      }] },
        ],
      },
    },
  },
]
```

The `LayoutPicker` needs a reference to the GoldenLayout instance to call
`loadLayout`. Pass it via a prop or expose `gl` from `MainLayout` via
`provide`/`inject`:

```ts
// In MainLayout.vue
provide('goldenLayout', gl)

// In LayoutPicker.vue
const gl = inject<Ref<GoldenLayout | null>>('goldenLayout')

function apply(preset) {
  gl?.value?.loadLayout(preset.glConfig)
  open.value = false
}
```

Remove all `layoutStore.layout.leftWidth` / `rightWidth` / `bottomHeight`
bindings from `LayoutPicker` — GoldenLayout owns those values now.

---

## Execution Order

1. **Step 0** — Read console errors and current file structure. Report before proceeding.
2. **Step 2** — Replace MainLayout GoldenLayout wiring with `registerComponentFactoryFunction` pattern.
3. **Step 3** — Add container dimension logging. If height is 0, add `nextTick` + `requestAnimationFrame` wrapper.
4. **Step 4** — Run with placeholder components. **Gate: all four placeholder panels must be visible and draggable before Step 5.**
5. **Step 5** — Substitute real panel components.
6. **Step 6** — Wire LayoutPicker presets to `gl.loadLayout()`.
7. Run TC-1a.2 through TC-1a.8 from `tests/manual/T1a_layout_control.md`.

---

## If Step 4 Still Shows Blank Panels

Report these specific values before doing anything further:

```
Container rect at mount:  width=___  height=___
GoldenLayout version:     (npm show golden-layout version)
Console errors:           (paste verbatim)
Current MainLayout.vue:   (paste the onMounted block)
```

Do not attempt further fixes until these are reported.