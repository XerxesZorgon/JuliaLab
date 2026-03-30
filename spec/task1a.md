# Task 1a — Layout Control and Pane Repositioning

**Insert after Task 2 in `tasks.md`. Do before Task 7A.**

**Context:** The current splitpanes implementation supports resizing only.
Panes cannot be repositioned — dragging a panel header to a new location
has no effect. This task adds:
1. A **layout preset picker** (MATLAB-style visual grid of named layouts)
2. **Panel swap** via drag-and-drop on panel headers
3. **Layout persistence** (save/restore pane sizes and positions across sessions)

---

## Background: What MATLAB Does

MATLAB's desktop layout system has two layers:

**Layer 1 — Preset picker** (View → Layout): A grid of named layout thumbnails.
Click one and all four panes snap to a predefined size/position configuration.
Examples: "Default", "Command Window Only", "History and Files", "All but Command History".

**Layer 2 — Drag-to-dock**: Any panel can be dragged by its title bar to a new
docking zone. A visual drop target highlights when the pane is over a valid zone.

For JuliaLab, implement Layer 1 first (preset picker — low risk, high value),
then Layer 2 (drag-to-dock — higher complexity).

---

## Read Before Touching Anything

```
app/app/src/components/layouts/MainLayout.vue     ← splitpanes structure
app/app/src/store/layoutStore.ts                  ← where to persist layout state
app/app/src/components/layouts/RibbonBar.vue      ← VIEW tab wires the picker
app/app/src/styles/theme.css                      ← drag/drop visual styles
```

---

## Step 1a-1 — Layout State in layoutStore.ts

Read `layoutStore.ts` first. Add the following to the existing store
(do not duplicate existing refs):

```ts
// Pane size percentages — these drive splitpanes :size props
const layout = reactive({
  leftWidth:    20,   // file tree width %
  rightWidth:   25,   // workspace/plots panel width %
  bottomHeight: 30,   // command window height %
})

// Named panel slot assignments — which component lives in which zone
// Zones: 'left' | 'center' | 'right' | 'bottom'
const panelSlots = reactive<Record<string, string>>({
  left:   'FileTree',
  center: 'Editor',
  right:  'Workspace',
  bottom: 'CommandWindow',
})

function applyPreset(preset: LayoutPreset) {
  Object.assign(layout, preset.sizes)
  Object.assign(panelSlots, preset.slots)
  saveLayout()
}

function saveLayout() {
  localStorage.setItem('julialab-layout', JSON.stringify({
    sizes: { ...layout },
    slots: { ...panelSlots },
  }))
}

function loadLayout() {
  const saved = localStorage.getItem('julialab-layout')
  if (!saved) return
  try {
    const { sizes, slots } = JSON.parse(saved)
    if (sizes) Object.assign(layout, sizes)
    if (slots) Object.assign(panelSlots, slots)
  } catch {}
}

// Call on store init
loadLayout()
```

Export: `layout`, `panelSlots`, `applyPreset`, `saveLayout`.

---

## Step 1a-2 — Wire Pane Sizes to Splitpanes in MainLayout.vue

Read `MainLayout.vue` in full. Find every `<pane>` element.
Bind `:size` props to `layoutStore.layout` values and emit
`@resize` events to keep the store in sync.

```vue
<!-- Outer horizontal split: left | center+bottom | right -->
<splitpanes @resize="onOuterResize">
  <pane :size="layoutStore.layout.leftWidth"   min-size="10" max-size="40">
    <!-- file tree -->
  </pane>
  <pane :size="100 - layoutStore.layout.leftWidth - layoutStore.layout.rightWidth">
    <!-- inner vertical split: editor top, command bottom -->
    <splitpanes horizontal @resize="onInnerResize">
      <pane :size="100 - layoutStore.layout.bottomHeight">
        <!-- editor / center panel -->
      </pane>
      <pane :size="layoutStore.layout.bottomHeight" min-size="10" max-size="60">
        <!-- command window -->
      </pane>
    </splitpanes>
  </pane>
  <pane :size="layoutStore.layout.rightWidth" min-size="10" max-size="40">
    <!-- workspace / plots -->
  </pane>
</splitpanes>
```

Add resize handlers that write back to the store and debounce `saveLayout()`:

```ts
import { useDebounceFn } from '@vueuse/core'   // or implement manually
const debouncedSave = useDebounceFn(() => layoutStore.saveLayout(), 500)

function onOuterResize(panes: { size: number }[]) {
  layoutStore.layout.leftWidth  = panes[0].size
  layoutStore.layout.rightWidth = panes[2].size
  debouncedSave()
}

function onInnerResize(panes: { size: number }[]) {
  layoutStore.layout.bottomHeight = panes[1].size
  debouncedSave()
}
```

If `@vueuse/core` is not installed:
```bash
cd app/app && npm install @vueuse/core
```

**Smoke test:** Drag a splitter → resize is reflected in `layoutStore.layout`.
Close and reopen app → pane sizes are restored to last session values.

---

## Step 1a-3 — Define Layout Presets

Create `app/app/src/layouts/presets.ts`:

```ts
export interface LayoutPreset {
  id:    string
  label: string
  icon:  string   // SVG thumbnail path or inline — see Step 1a-4
  sizes: {
    leftWidth:    number
    rightWidth:   number
    bottomHeight: number
  }
  slots: Record<string, string>
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: 'default',
    label: 'Default',
    sizes: { leftWidth: 20, rightWidth: 25, bottomHeight: 30 },
    slots: { left: 'FileTree', center: 'Editor', right: 'Workspace', bottom: 'CommandWindow' },
  },
  {
    id: 'wide-editor',
    label: 'Wide Editor',
    sizes: { leftWidth: 15, rightWidth: 15, bottomHeight: 25 },
    slots: { left: 'FileTree', center: 'Editor', right: 'Workspace', bottom: 'CommandWindow' },
  },
  {
    id: 'command-focus',
    label: 'Command Focus',
    sizes: { leftWidth: 20, rightWidth: 25, bottomHeight: 55 },
    slots: { left: 'FileTree', center: 'Editor', right: 'Workspace', bottom: 'CommandWindow' },
  },
  {
    id: 'plots-focus',
    label: 'Plots Focus',
    sizes: { leftWidth: 15, rightWidth: 45, bottomHeight: 30 },
    slots: { left: 'FileTree', center: 'Editor', right: 'Workspace', bottom: 'CommandWindow' },
  },
  {
    id: 'no-sidebar',
    label: 'No Sidebar',
    sizes: { leftWidth: 0, rightWidth: 25, bottomHeight: 30 },
    slots: { left: 'FileTree', center: 'Editor', right: 'Workspace', bottom: 'CommandWindow' },
  },
  {
    id: 'wide-workspace',
    label: 'Wide Workspace',
    sizes: { leftWidth: 15, rightWidth: 40, bottomHeight: 30 },
    slots: { left: 'FileTree', center: 'Editor', right: 'Workspace', bottom: 'CommandWindow' },
  },
]
```

---

## Step 1a-4 — Layout Preset Picker Component

Create `app/app/src/components/layouts/LayoutPicker.vue`:

This renders a popover grid of preset thumbnails. Each thumbnail is a small
inline SVG that schematically shows the pane proportions for that preset.
Clicking a thumbnail calls `layoutStore.applyPreset(preset)` and closes
the popover.

```vue
<template>
  <div class="layout-picker-wrapper" ref="wrapper">
    <button class="layout-picker-trigger" @click="open = !open" title="Choose Layout">
      <LayoutPanelLeft :size="16" />
      <span>Layout</span>
      <ChevronDown :size="12" />
    </button>

    <div v-if="open" class="layout-picker-popover">
      <div class="layout-picker-title">Desktop Layout</div>
      <div class="layout-grid">
        <button
          v-for="preset in presets"
          :key="preset.id"
          class="layout-card"
          :class="{ active: currentPresetId === preset.id }"
          @click="apply(preset)"
          :title="preset.label"
        >
          <!-- Inline SVG thumbnail — schematic of pane layout -->
          <svg viewBox="0 0 48 36" class="layout-thumb">
            <!-- Left pane -->
            <rect
              :x="0" y="0"
              :width="preset.sizes.leftWidth / 100 * 48"
              height="36"
              fill="var(--jl-panel-bg-alt)" stroke="var(--jl-border)" stroke-width="1"
            />
            <!-- Right pane -->
            <rect
              :x="(1 - preset.sizes.rightWidth / 100) * 48" y="0"
              :width="preset.sizes.rightWidth / 100 * 48"
              height="36"
              fill="var(--jl-panel-bg-alt)" stroke="var(--jl-border)" stroke-width="1"
            />
            <!-- Bottom pane -->
            <rect
              :x="preset.sizes.leftWidth / 100 * 48"
              :y="(1 - preset.sizes.bottomHeight / 100) * 36"
              :width="(1 - preset.sizes.leftWidth / 100 - preset.sizes.rightWidth / 100) * 48"
              :height="preset.sizes.bottomHeight / 100 * 36"
              fill="var(--jl-panel-bg-alt)" stroke="var(--jl-border)" stroke-width="1"
            />
            <!-- Center (editor) pane — fills remaining space -->
            <rect
              :x="preset.sizes.leftWidth / 100 * 48"
              y="0"
              :width="(1 - preset.sizes.leftWidth / 100 - preset.sizes.rightWidth / 100) * 48"
              :height="(1 - preset.sizes.bottomHeight / 100) * 36"
              fill="var(--jl-accent-blue, #1a73e8)" opacity="0.15"
              stroke="var(--jl-border)" stroke-width="1"
            />
          </svg>
          <span class="layout-card-label">{{ preset.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { LayoutPanelLeft, ChevronDown } from 'lucide-vue-next'
import { LAYOUT_PRESETS } from '../../layouts/presets'
import { useLayoutStore } from '../../store/layoutStore'

const layoutStore = useLayoutStore()
const open   = ref(false)
const wrapper = ref(null)

onClickOutside(wrapper, () => { open.value = false })

const presets = LAYOUT_PRESETS

const currentPresetId = computed(() => {
  // Identify active preset by matching sizes (approximate match within 2%)
  return presets.find(p =>
    Math.abs(p.sizes.leftWidth    - layoutStore.layout.leftWidth)    < 2 &&
    Math.abs(p.sizes.rightWidth   - layoutStore.layout.rightWidth)   < 2 &&
    Math.abs(p.sizes.bottomHeight - layoutStore.layout.bottomHeight) < 2
  )?.id ?? null
})

function apply(preset) {
  layoutStore.applyPreset(preset)
  open.value = false
}
</script>

<style scoped>
.layout-picker-wrapper { position: relative; }

.layout-picker-trigger {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 8px; border: 1px solid var(--jl-border);
  background: none; border-radius: 3px; cursor: pointer;
  font-size: 12px; color: var(--jl-text-primary);
}
.layout-picker-trigger:hover { background: var(--jl-panel-bg-alt); }

.layout-picker-popover {
  position: absolute; top: calc(100% + 4px); right: 0;
  background: var(--jl-panel-bg); border: 1px solid var(--jl-border);
  border-radius: 6px; padding: 12px; z-index: 200;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  min-width: 280px;
}

.layout-picker-title {
  font-size: 11px; font-weight: 600; color: var(--jl-text-muted);
  text-transform: uppercase; letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.layout-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
}

.layout-card {
  display: flex; flex-direction: column; align-items: center;
  gap: 4px; padding: 6px; border: 1px solid var(--jl-border);
  border-radius: 4px; background: none; cursor: pointer;
  transition: border-color 0.1s, background 0.1s;
}
.layout-card:hover { background: var(--jl-panel-bg-alt); }
.layout-card.active {
  border-color: var(--jl-accent-green);
  background: color-mix(in srgb, var(--jl-accent-green) 10%, transparent);
}

.layout-thumb { width: 72px; height: 54px; }

.layout-card-label {
  font-size: 10px; color: var(--jl-text-muted); white-space: nowrap;
}
</style>
```

---

## Step 1a-5 — Wire Picker into VIEW Tab Ribbon

The layout picker button belongs in the VIEW tab toolbar, consistent with
where MATLAB puts it (View → Layout). It should also be accessible from
the status bar for quick access.

**In `RibbonBar.vue`:** Ensure the VIEW tab (or `ViewToolbar.vue` stub)
includes `<LayoutPicker />`.

**In `StatusBar.vue`:** Read the file first. Add `<LayoutPicker />` as a
compact trigger on the right side of the status bar, so it's accessible
from any tab — not just VIEW.

---

## Step 1a-6 — Panel Drag-to-Swap (Header Drag)

This step implements dragging a panel by its title bar to swap its position
with another panel. This is distinct from resizing — it changes *which*
component occupies which zone.

**Approach:** Use the HTML5 Drag and Drop API on panel header elements.
Track `draggedPanel` in `layoutStore`. On drop, swap the two slot
assignments in `panelSlots`.

Add to `layoutStore.ts`:

```ts
const draggedPanel = ref<string | null>(null)

function swapPanels(zoneA: string, zoneB: string) {
  const tmp = panelSlots[zoneA]
  panelSlots[zoneA] = panelSlots[zoneB]
  panelSlots[zoneB] = tmp
  saveLayout()
}
```

Create `app/app/src/components/layouts/PanelHeader.vue` —
a shared header bar used at the top of each panel zone:

```vue
<template>
  <div
    class="panel-header"
    :class="{ 'drag-over': isDragOver }"
    draggable="true"
    @dragstart="onDragStart"
    @dragover.prevent="isDragOver = true"
    @dragleave="isDragOver = false"
    @drop="onDrop"
  >
    <span class="panel-header-title">{{ title }}</span>
    <slot name="actions" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useLayoutStore } from '../../store/layoutStore'

const props = defineProps({
  zone:  { type: String, required: true },  // 'left' | 'center' | 'right' | 'bottom'
  title: { type: String, required: true },
})

const layoutStore = useLayoutStore()
const isDragOver  = ref(false)

function onDragStart(e: DragEvent) {
  layoutStore.draggedPanel = props.zone
  e.dataTransfer!.effectAllowed = 'move'
}

function onDrop() {
  isDragOver.value = false
  if (layoutStore.draggedPanel && layoutStore.draggedPanel !== props.zone) {
    layoutStore.swapPanels(layoutStore.draggedPanel, props.zone)
  }
  layoutStore.draggedPanel = null
}
</script>

<style scoped>
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 4px 8px; height: 28px;
  background: var(--jl-panel-bg-alt);
  border-bottom: 1px solid var(--jl-border);
  cursor: grab; user-select: none;
  transition: background 0.1s;
}
.panel-header:active { cursor: grabbing; }
.panel-header.drag-over {
  background: color-mix(in srgb, var(--jl-accent-green) 20%, var(--jl-panel-bg-alt));
  border: 2px dashed var(--jl-accent-green);
}
.panel-header-title {
  font-size: 11px; font-weight: 600;
  color: var(--jl-text-muted); text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
```

**Wire `PanelHeader` into each panel zone in `MainLayout.vue`.**
Each panel zone's title bar must use `<PanelHeader :zone="'left'" title="Files" />` etc.

**Panel zone component map** — `MainLayout.vue` must render the component
indicated by `layoutStore.panelSlots[zone]` for each zone:

```ts
const panelComponents = {
  FileTree:      FileTreePanel,
  Editor:        EditorPanel,
  Workspace:     WorkspacePanel,
  CommandWindow: CommandWindowPanel,
  Plots:         PlotsPanel,
}
```

Each zone renders `<component :is="panelComponents[layoutStore.panelSlots[zone]]" />`.

---

## Step 1a-7 — Add to theme.css

```css
/* === Layout drag-and-drop === */
.panel-header[draggable="true"] { cursor: grab; }
.panel-header[draggable="true"]:active { cursor: grabbing; }

/* Drop zone highlight — applied via .drag-over class */
.drag-over {
  outline: 2px dashed var(--jl-accent-green);
  outline-offset: -2px;
}
```

---

## Tests to Generate

### Generate `tests/manual/T1a_layout_control.md`

```markdown
# T1a — Layout Control Manual Test

**Setup:** Run `npm run tauri dev`. Wait for Julia Ready.

## TC-1a.1 Layout persistence (resize)
1. Drag the left splitter to resize the file tree to roughly 30% width.
2. Close the app and reopen.
3. **Pass:** File tree reopens at ~30% width (not reset to default 20%).

## TC-1a.2 Layout preset picker accessibility
1. Click the VIEW tab in the ribbon.
2. **Expected:** A "Layout" button with a dropdown chevron is visible.
3. Click it — a popover grid of 6 layout thumbnails appears.
4. **Pass:** All 6 presets are named, thumbnails are visible and schematically
   accurate (wider editor preset shows wider center pane in the SVG).

## TC-1a.3 Apply a preset
1. Open the layout picker.
2. Click "Wide Editor" preset.
3. **Expected:** Left and right panels narrow; center editor widens.
4. **Pass:** Pane sizes animate/snap to new values. Picker closes.

## TC-1a.4 Active preset highlight
1. Open the layout picker immediately after applying "Wide Editor".
2. **Expected:** "Wide Editor" card has a green border (active indicator).
3. **Pass:** Exactly one card is highlighted as active.

## TC-1a.5 Status bar quick access
1. Without opening the VIEW tab, locate the Layout button in the status bar.
2. Click it — same popover appears.
3. **Pass:** Layout picker accessible from any ribbon tab via the status bar.

## TC-1a.6 Panel drag-to-swap
1. Hover over the "FILES" panel header (left pane).
2. **Expected:** Cursor changes to `grab`.
3. Drag the FILES header onto the WORKSPACE panel header (right pane).
4. **Expected:** A dashed green drop target highlight appears on WORKSPACE
   as the dragged header passes over it.
5. Release.
6. **Pass:** Files panel and Workspace panel have swapped positions.
   Left zone now shows Workspace; right zone now shows Files.

## TC-1a.7 Drag-to-swap persistence
1. After completing TC-1a.6, close and reopen the app.
2. **Pass:** Swapped panel positions are restored (swap was persisted to localStorage).

## TC-1a.8 Preset resets swap
1. With panels in a swapped state, open the layout picker and apply "Default".
2. **Pass:** Panels return to their default positions
   (File Tree left, Workspace right).

## Failure signatures
- Preset picker does nothing → `applyPreset` not wired to `layoutStore`
- Sizes don't persist → `saveLayout` / `loadLayout` not called on mount
- Drop highlight doesn't appear → `@dragover.prevent` missing (default
  browser behavior blocks drop events without `.prevent`)
- Panels swap but content doesn't change → `panelSlots` not reactive or
  not bound to `<component :is="...">` in MainLayout
```

---

## Smoke Test Checklist

- [ ] Read `MainLayout.vue`, `layoutStore.ts`, `RibbonBar.vue`, `StatusBar.vue`, `theme.css`
- [ ] Add `layout`, `panelSlots`, `applyPreset`, `saveLayout`, `loadLayout`, `swapPanels`, `draggedPanel` to `layoutStore.ts`
- [ ] Bind `splitpanes` `:size` props to `layoutStore.layout` in `MainLayout.vue`
- [ ] Add `@resize` handlers that write back to store and call debounced `saveLayout()`
- [ ] Create `app/app/src/layouts/presets.ts` with 6 named presets
- [ ] Create `app/app/src/components/layouts/LayoutPicker.vue` with SVG thumbnails
- [ ] Wire `LayoutPicker` into VIEW tab toolbar and status bar
- [ ] Create `app/app/src/components/layouts/PanelHeader.vue` with drag-and-drop
- [ ] Wire `PanelHeader` into each panel zone in `MainLayout.vue`
- [ ] Render panels via `<component :is="panelComponents[layoutStore.panelSlots[zone]]" />`
- [ ] Add drag-and-drop CSS to `theme.css`
- [ ] **Generate** `tests/manual/T1a_layout_control.md`
- [ ] **Smoke test:** All 8 TC-1a.x cases pass before proceeding to Task 7A

---

## Definition of Done

| Check | Pass condition |
|---|---|
| Resize persistence | Pane sizes survive app restart |
| Preset picker | 6 presets visible; applying one resizes panes immediately |
| Active preset highlight | Correct preset highlighted after applying |
| Status bar access | Layout picker reachable without switching to VIEW tab |
| Panel drag-to-swap | Dragging panel header swaps two zones |
| Swap persistence | Swapped positions survive app restart |
| Preset resets swap | Applying a preset restores canonical slot assignments |