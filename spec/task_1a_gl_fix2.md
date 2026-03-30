# Task 1a-gl-fix2 — Three Remaining GoldenLayout Bugs

Content is rendering in all four panels — that's the major win from the last
fix. Three specific bugs remain. Fix in order.

---

## Bug 1 — GoldenLayout Config Size Format (parseSize crash)

**Console message:**
```
[DockLayout] failed to restore saved layout, using default:
TypeError: value.trimStart is not a function
  at splitStringAtFirstNonNumericChar (utils.ts:22:19)
  at parseSize (config.ts:1250:85)
```

**Root cause:** GoldenLayout's `parseSize` function calls `.trimStart()` on the
`width`/`height` values in the layout config, expecting strings. The config
passed to `loadLayout` uses plain JS numbers (`width: 20`). Numbers don't have
`.trimStart()` — hence the crash. This affects both the saved layout
(localStorage) AND the `DEFAULT_CONFIG` fallback, which is why even the default
crashes.

**Fix — two steps:**

### Step 1a: Clear the corrupted localStorage entry

The saved layout (which has the wrong numeric format) is persisted in
`localStorage`. It must be cleared once so the fixed default can take over.

In `DockLayout.vue` (or wherever GoldenLayout is initialized), add a one-time
migration before `loadLayout` is called:

```ts
// Clear any saved layout with the old numeric-size format
// Remove this migration block after one release cycle
const saved = localStorage.getItem('julialab-gl-layout')
if (saved) {
  try {
    const parsed = JSON.parse(saved)
    // If sizes are numbers, this is the old broken format — discard it
    const root = parsed?.root
    if (root && typeof root.content?.[0]?.width === 'number') {
      localStorage.removeItem('julialab-gl-layout')
      console.log('[DockLayout] cleared old numeric-size layout from localStorage')
    }
  } catch {
    localStorage.removeItem('julialab-gl-layout')
  }
}
```

### Step 1b: Fix DEFAULT_CONFIG size format

Read `DockLayout.vue`. Find `DEFAULT_CONFIG`. GoldenLayout 2.x `loadLayout`
accepts a `LayoutConfig` where sizes are expressed as **numbers representing
percentages** — but the internal `parseSize` utility expects them to arrive as
**strings** in some code paths.

The safest cross-version fix is to use GoldenLayout's typed config builder
rather than a raw object. Replace the raw config object with this pattern,
which uses explicit typed values that bypass the string-parsing path:

```ts
import {
  LayoutConfig,
  ItemType,
} from 'golden-layout'

const DEFAULT_CONFIG: LayoutConfig = {
  settings: {
    showPopoutIcon:     false,
    showMaximiseIcon:   true,
    showCloseIcon:      false,
  },
  root: {
    type: ItemType.row,
    content: [
      {
        type:    ItemType.column,
        width:   20,
        content: [{
          type:          ItemType.component,
          componentType: 'FileTree',
          title:         'Files',
        }],
      },
      {
        type:   ItemType.column,
        width:  55,
        content: [
          {
            type:    ItemType.row,
            height:  70,
            content: [{
              type:          ItemType.component,
              componentType: 'Editor',
              title:         'Editor',
            }],
          },
          {
            type:    ItemType.row,
            height:  30,
            content: [{
              type:          ItemType.component,
              componentType: 'CommandWindow',
              title:         'Command Window',
            }],
          },
        ],
      },
      {
        type:    ItemType.column,
        width:   25,
        content: [{
          type:          ItemType.component,
          componentType: 'Workspace',
          title:         'Workspace',
        }],
      },
    ],
  },
}
```

If `ItemType` is not exported from the installed version of `golden-layout`,
use plain string literals (`type: 'row'`, `type: 'column'`, `type: 'component'`)
— check the installed version's exports first:

```bash
node -e "const gl = require('golden-layout'); console.log(Object.keys(gl))"
```

**Smoke test:** Console shows `[DockLayout] container at mount: 963 x 619`
with NO `failed to restore saved layout` error after this fix.

---

## Bug 2 — GoldenLayout CSS Not Enabling Drag

**Symptom:** Panels show content but cannot be dragged.

**Root cause:** GoldenLayout drag-and-drop requires its own CSS classes to
function. Specifically, the drag proxy (`lm_dragProxy`) and drop target
highlighting require styles from GoldenLayout's CSS file. If those styles are
absent or overridden, the drag system initialises but the visual feedback
breaks, and in some cases the drag handler silently aborts.

Additionally, GoldenLayout requires the tab element (`lm_tab`) to have
`cursor: pointer` and must NOT have `pointer-events: none` on any ancestor.

**Fix — three sub-steps:**

### Step 2a: Confirm GoldenLayout base CSS is imported

Read `DockLayout.vue` (or `main.ts`). Confirm this import exists:

```ts
import 'golden-layout/dist/css/goldenlayout-base.css'
```

If it is missing, add it to `main.ts` (not the component) so it loads once
globally:

```ts
// main.ts
import 'golden-layout/dist/css/goldenlayout-base.css'
```

Check the installed package to confirm the correct CSS path:

```bash
ls node_modules/golden-layout/dist/css/
```

Use whatever `.css` file is present there (name may vary by version).

### Step 2b: Add missing drag-and-drop CSS to theme.css

GoldenLayout's base CSS only provides structure. Add these rules to
`app/app/src/styles/theme.css` to enable the drag proxy and drop zone
highlight:

```css
/* === GoldenLayout drag and drop === */

/* Drag proxy — the floating thumbnail when dragging a panel */
.lm_dragProxy {
  opacity: 0.8;
  z-index: 1000;
}

.lm_dragProxy .lm_header {
  background: var(--jl-panel-bg-alt);
}

/* Drop target zones — highlighted when a panel is dragged over */
.lm_dropTargetIndicator {
  outline: 3px solid var(--jl-accent-green);
  outline-offset: -3px;
  background: color-mix(in srgb, var(--jl-accent-green) 15%, transparent);
  transition: opacity 0.1s;
  z-index: 999;
  pointer-events: none;
}

/* Tabs must be grabbable */
.lm_tab {
  cursor: pointer !important;
  user-select: none;
}

/* Ensure no ancestor blocks pointer events on GL elements */
.lm_goldenlayout,
.lm_goldenlayout * {
  box-sizing: border-box;
}

.lm_content {
  overflow: hidden;
}
```

### Step 2c: Check for pointer-events override on .gl-container

Read the `<style>` section of `DockLayout.vue` (or wherever `.gl-container`
is defined). Confirm there is NO `pointer-events: none` on `.gl-container`
or any of its descendants. If present, remove it.

Also confirm the container has no `overflow: hidden` that would clip the
drag proxy (which renders outside the panel bounds during drag). The
outermost GoldenLayout wrapper should have `overflow: visible` during drag.
GoldenLayout handles this internally, but a forced `overflow: hidden` on
`.gl-container` will break it.

**Correct `.gl-container` style:**
```css
.gl-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;   /* hidden is OK here — GL manages overflow internally */
  position: relative; /* required for drop target positioning */
}
```

**Smoke test:** Drag a panel tab header → a semi-transparent drag proxy
follows the cursor. A green highlighted drop zone appears when hovering over
another panel. Releasing drops the panel in the new position.

---

## Bug 3 — Double-Mounted TerminalView (Two Julia Instances)

**Console evidence:**
```
TerminalView: Setting up restart event listeners   ← appears TWICE
TerminalView: Julia output received ...            ← every message appears TWICE
```

**Root cause:** The `CommandWindow` GoldenLayout component factory is being
called twice, creating two Vue app instances each mounting `TerminalView`.

The two most likely causes:

**Cause A:** The `registerComponentFactoryFunction` callback for `CommandWindow`
is being registered twice — once from initial setup and once from a reactive
update in `onMounted` that re-runs.

**Cause B:** The DEFAULT_CONFIG has `CommandWindow` listed in two places, or
`loadLayout` is called twice (once with the saved layout that fails, and once
with the default — if the factory creates components on both attempts).

**Fix:**

### Step 3a: Check how many times registerPanels is called

In `DockLayout.vue`, add a log at the top of `registerPanels`:

```ts
function registerPanels(layout: GoldenLayout) {
  console.log('[DockLayout] registerPanels called')  // should appear exactly once
  for (const [name, component] of Object.entries(PANEL_MAP)) {
    // ...
  }
}
```

Run the app. If `registerPanels called` appears more than once → a reactive
watcher or effect is calling it repeatedly. Move the call outside any
`watch`/`watchEffect` — it must only run inside `onMounted`, once.

### Step 3b: Guard against double factory calls

GoldenLayout may call the component factory twice if `loadLayout` is called
while a previous layout is partially initialised. Add a guard:

```ts
const mountedComponents = new Map<HTMLElement, ReturnType<typeof createApp>>()

function registerPanels(layout: GoldenLayout) {
  for (const [name, component] of Object.entries(PANEL_MAP)) {
    layout.registerComponentFactoryFunction(name, (container) => {
      const el = container.element

      // Guard: do not double-mount into the same element
      if (mountedComponents.has(el)) {
        console.warn(`[DockLayout] ${name} already mounted in this element — skipping`)
        return
      }

      const app = createApp(component)
      app.mount(el)
      mountedComponents.set(el, app)

      container.addEventListener('destroy', () => {
        app.unmount()
        mountedComponents.delete(el)
      })
    })
  }
}
```

### Step 3c: Ensure destroy events clean up

Also confirm the `onUnmounted` warning from the previous fix is resolved.
Read `DockLayout.vue`. Search for `onUnmounted`. If it still appears inside
the `registerComponentFactoryFunction` callback, replace it with the
`container.addEventListener('destroy', ...)` pattern shown in Step 3b above.

**Smoke test:** Each Julia output message appears exactly once in the terminal.
`TerminalView: Setting up restart event listeners` appears exactly once.

---

## Execution Order

1. **Bug 1** — Clear localStorage and fix DEFAULT_CONFIG format.
   Run app. Confirm no `failed to restore saved layout` error in console.

2. **Bug 2** — Confirm base CSS import, add drag CSS, check pointer-events.
   Run app. Confirm panels are draggable (drag proxy follows cursor).

3. **Bug 3** — Add registerPanels log, identify double-call cause, add guard.
   Run app. Confirm each Julia message appears exactly once.

4. Final smoke test — all four panels show content, panels are draggable,
   preset layouts work, no console errors remain.

---

## Do Not Touch

- `EditorView.vue` — the temporal dead zone bug from the previous fix should
  already be resolved. Do not re-open this file unless a new EditorView error
  appears in the console.
- `RibbonBar.vue` — tab styling is a separate concern from layout. Do not
  adjust ribbon styling in this task.
- Julia startup / Xorg error — separate issue, address after layout is working.