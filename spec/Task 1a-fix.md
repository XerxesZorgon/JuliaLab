# Task 1a-fix — Layout Picker and Drag-to-Swap Bug Fixes

**Do before Task 7A. Three specific bugs to fix.**

---

## Read Before Touching Anything

```
app/app/src/components/layouts/LayoutPicker.vue
app/app/src/components/layouts/PanelHeader.vue
app/app/src/components/layouts/MainLayout.vue
app/app/src/styles/theme.css
app/app/src/store/layoutStore.ts
```

Read every file listed above in full before writing any fix.

---

## Bug 1 — Layout Picker Popover Is Inaccessible

**Symptom:** Clicking "Layout" shows a dropdown just below the ribbon bar,
but nothing in the popover is clickable or reachable.

**Root cause:** The popover is being clipped or covered. Two likely causes,
check both:

**A — Overflow clipping.** The ribbon bar container (or a parent of
`LayoutPicker`) has `overflow: hidden` which clips the absolutely-positioned
popover. Read `ViewTab.vue` (or wherever `LayoutPicker` is mounted) and trace
every ancestor element. Any `overflow: hidden` on an ancestor of the
`layout-picker-wrapper` will clip the popover even if `z-index` is high.

Fix: the popover must escape the overflow context. The cleanest approach is
to **teleport** the popover to `<body>` so it is never clipped:

```vue
<!-- In LayoutPicker.vue, wrap the popover in a Teleport -->
<Teleport to="body">
  <div
    v-if="open"
    class="layout-picker-popover"
    :style="popoverStyle"
  >
    <div class="layout-picker-title">Desktop Layout</div>
    <div class="layout-grid">
      <!-- preset cards -->
    </div>
  </div>
</Teleport>
```

Because the popover is teleported, it can no longer rely on CSS `position:
absolute` relative to the trigger. Use a `popoverStyle` computed property
that positions it absolutely relative to the viewport using the trigger
element's `getBoundingClientRect()`:

```ts
const triggerRef = ref<HTMLElement | null>(null)
const popoverStyle = ref({})

function updatePopoverPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  popoverStyle.value = {
    position:  'fixed',
    top:       `${rect.bottom + 4}px`,
    left:      `${rect.left}px`,
    zIndex:    1000,
    minWidth:  '280px',
  }
}

// Call before opening
async function toggleOpen() {
  if (!open.value) {
    updatePopoverPosition()
    await nextTick()
  }
  open.value = !open.value
}
```

Add `ref="triggerRef"` to the trigger button. Replace `@click="open = !open"`
with `@click="toggleOpen()"`.

**B — Z-index stacking context.** If teleport is already used or overflow is
not the issue, check that no ancestor creates a stacking context with a higher
`z-index`. The ribbon bar itself may have `z-index: 100` or similar. Ensure
the popover's `z-index` (set in `popoverStyle`) is higher than any ribbon
element. Use `z-index: 1000`.

**Also fix `onClickOutside`:** With a teleported popover, `onClickOutside`
must watch the wrapper ref AND the popover ref together. Update:

```ts
const popoverRef = ref<HTMLElement | null>(null)

onClickOutside(
  triggerRef,
  () => { open.value = false },
  { ignore: [popoverRef] }
)
```

Add `ref="popoverRef"` to the teleported popover div.

**Smoke test for Bug 1:** Click "Layout" in the VIEW tab → popover appears
below the trigger button. All 6 preset cards are visible and clickable.
Clicking a card changes the pane sizes and closes the popover. Clicking
outside closes the popover.

---

## Bug 2 — Side Panels Only Drag to Bottom; Editor/Command Window Not Draggable

**Symptom:** Side panels can be dragged but only land in the bottom zone.
Editor and Command Window panels cannot be dragged at all.

**Root cause:** Step 1a-6 (wiring `PanelHeader` into `MainLayout.vue` and
rendering panels via `panelSlots`) was explicitly deferred. The drag behavior
seen is the browser's native image-drag fallback, not the custom DnD system.

**Fix: Complete Step 1a-6 now.**

### 1a-6a — Wire PanelHeader into every panel zone in MainLayout.vue

Read `MainLayout.vue` in full. Identify the four panel zones: left (file tree),
center-top (editor), center-bottom (command window), right (workspace/plots).

Each zone's existing title bar or header element must be replaced with
`<PanelHeader>`. If a zone has no title bar, add one.

```vue
<!-- Left zone -->
<pane :size="layoutStore.layout.leftWidth" min-size="5" max-size="40">
  <PanelHeader zone="left" :title="panelTitle('left')" />
  <component :is="panelComponents[layoutStore.panelSlots['left']]" />
</pane>

<!-- Center-top zone (editor) -->
<pane :size="100 - layoutStore.layout.bottomHeight">
  <PanelHeader zone="center" :title="panelTitle('center')" />
  <component :is="panelComponents[layoutStore.panelSlots['center']]" />
</pane>

<!-- Center-bottom zone (command window) -->
<pane :size="layoutStore.layout.bottomHeight" min-size="10" max-size="60">
  <PanelHeader zone="bottom" :title="panelTitle('bottom')" />
  <component :is="panelComponents[layoutStore.panelSlots['bottom']]" />
</pane>

<!-- Right zone -->
<pane :size="layoutStore.layout.rightWidth" min-size="5" max-size="40">
  <PanelHeader zone="right" :title="panelTitle('right')" />
  <component :is="panelComponents[layoutStore.panelSlots['right']]" />
</pane>
```

### 1a-6b — panelComponents map and panelTitle helper

In `MainLayout.vue` `<script setup>`, add:

```ts
import { useLayoutStore } from '../../store/layoutStore'
import PanelHeader from './PanelHeader.vue'

// Import all panel components that can occupy a zone
// Read MainLayout.vue to find the actual component names already imported
// Map slot names to component definitions
const panelComponents: Record<string, Component> = {
  FileTree:      FileTreeComponent,      // use actual name from file
  Editor:        EditorComponent,        // use actual name from file
  Workspace:     WorkspaceComponent,     // use actual name from file
  CommandWindow: CommandWindowComponent, // use actual name from file
  Plots:         PlotsComponent,         // use actual name from file
}

// Human-readable title for each slot name
const panelTitles: Record<string, string> = {
  FileTree:      'Files',
  Editor:        'Editor',
  Workspace:     'Workspace',
  CommandWindow: 'Command Window',
  Plots:         'Plots',
}

function panelTitle(zone: string): string {
  return panelTitles[layoutStore.panelSlots[zone]] ?? zone
}
```

**IMPORTANT:** Do not invent component names. Read `MainLayout.vue` first and
use the exact import names and variables already present in that file.

### 1a-6c — Fix the drag-and-drop in PanelHeader.vue

Read `PanelHeader.vue`. The HTML5 DnD API requires `dragover` to call
`preventDefault()` or the `drop` event will never fire. Verify the template
has `.prevent` on `@dragover`:

```vue
@dragover.prevent="isDragOver = true"
```

Without `.prevent`, the drop zone highlights but drops silently fail.
This is the most likely reason drops only worked partially.

Also verify the `dragstart` handler sets `dataTransfer` data — some browsers
require at least one `setData` call for DnD to activate:

```ts
function onDragStart(e: DragEvent) {
  layoutStore.draggedPanel = props.zone
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', props.zone)  // required by some browsers
}
```

### 1a-6d — Prevent splitpanes from intercepting drag events

Splitpanes listens to `mousedown` and `mousemove` on the pane content area,
which can conflict with `dragstart` on child elements. Add this to the
`PanelHeader` style to ensure drag events originate from the header only:

```css
.panel-header {
  /* existing styles */
  position: relative;
  z-index: 10;   /* above splitpanes drag layer */
}
```

Also add `@mousedown.stop` to the panel header to prevent splitpanes from
treating a header drag as a splitter drag:

```vue
<div
  class="panel-header"
  draggable="true"
  @mousedown.stop
  @dragstart="onDragStart"
  @dragover.prevent="isDragOver = true"
  @dragleave="isDragOver = false"
  @drop="onDrop"
>
```

**Smoke test for Bug 2:**
1. Hover over the FILES panel header → cursor shows `grab`
2. Drag FILES header over the WORKSPACE header → dashed green border appears
3. Release → FILES and WORKSPACE swap positions
4. Drag EDITOR header over COMMAND WINDOW header → they swap
5. Apply "Default" preset → all panels return to canonical positions

---

## Bug 3 — Verify: Are All Four Zones Draggable?

After completing 1a-6a through 1a-6d, manually confirm each zone:

| Zone | Can drag from | Can receive drop |
|---|---|---|
| Left (Files) | ✓ | ✓ |
| Center-top (Editor) | ✓ | ✓ |
| Center-bottom (Command) | ✓ | ✓ |
| Right (Workspace) | ✓ | ✓ |

Any zone that cannot drag: check that `<PanelHeader>` is wired with the
correct `zone` prop and that `draggable="true"` is on the root element.

Any zone that cannot receive drops: check `@dragover.prevent` is present.

---

## Execution Order

Do in this exact sequence:

1. Fix Bug 1 (popover teleport) — smoke-test popover before touching DnD
2. Fix Bug 2 steps 1a-6a and 1a-6b — wire PanelHeader into MainLayout
3. Fix Bug 2 step 1a-6c — verify `@dragover.prevent` and `setData`
4. Fix Bug 2 step 1a-6d — add `@mousedown.stop` and z-index
5. Run TC-1a.2 through TC-1a.8 from `tests/manual/T1a_layout_control.md`

Do not proceed to Task 7A until all 8 TC-1a.x cases pass.