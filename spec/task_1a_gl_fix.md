# Task 1a-gl-fix — Three Precise Fixes from DevTools Diagnosis

**Do not attempt any other changes. Fix exactly these three errors in order.**

---

## Error 1 — CRITICAL: Blank Panels (Runtime Template Compilation)

**Console message:**
```
[Vue warn]: Component provided template option but runtime compilation is not
supported in this build of Vue. Configure your bundler to alias "vue" to
"vue/dist/vue.esm-bundler.js".
```

**Root cause:** The placeholder panel components in `PANEL_MAP` use inline
template strings:
```ts
{ template: '<div style="...">Files</div>' }
```
Vite uses Vue's runtime-only build (`vue.esm-bundler.js` without compiler).
Inline `template:` strings require the full build with compiler included.
This is why all four panels are blank — the components silently fail to render.

**Fix — Two options, choose one:**

### Option A (Recommended): Replace inline templates with real SFC imports

Read `MainLayout.vue`. Find the `PANEL_MAP` object. Replace every inline
template object with the actual panel component that was used before the
GoldenLayout migration.

Read the git history or the old `MainLayout.vue` to find the exact component
names. The components that rendered content before GoldenLayout are still in
the codebase — they just need to be imported and used here.

```ts
// WRONG — causes the runtime compilation error:
const PANEL_MAP = {
  FileTree: { template: '<div>Files</div>' },
  // ...
}

// CORRECT — import actual SFC components:
import FileTreePanel      from '../panels/FileTreePanel.vue'   // adapt path
import EditorPanel        from '../panels/EditorPanel.vue'     // adapt path
import WorkspacePanel     from '../panels/WorkspacePanel.vue'  // adapt path
import CommandWindowPanel from '../panels/CommandWindowPanel.vue' // adapt path

const PANEL_MAP = {
  FileTree:      FileTreePanel,
  Editor:        EditorPanel,
  Workspace:     WorkspacePanel,
  CommandWindow: CommandWindowPanel,
}
```

**To find the correct import paths:** Run this from the repo root:
```bash
find app/app/src -name "*.vue" | grep -iE "file|tree|editor|workspace|command|terminal"
```
Use the paths returned by that command — do not invent paths.

### Option B (Quick test only): Add Vue compiler alias to vite.config.ts

Only use this to confirm the placeholder panels render. Do NOT ship with this
in production — it increases bundle size significantly.

```ts
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      'vue': 'vue/dist/vue.esm-bundler.js'
    }
  }
})
```

**Use Option A.** Option B is only listed to confirm whether blank panels are
100% caused by this error.

---

## Error 2 — EditorView crash (Temporal Dead Zone)

**Console message:**
```
Uncaught (in promise) ReferenceError: Cannot access 'isLoadingTabs'
before initialization
  at loadTabsFromService (EditorView.vue:583:3)
  at watch.immediate (EditorView.vue:311:15)
```

**Root cause:** In `EditorView.vue`, a `watch` with `{ immediate: true }` is
declared at line 311 and calls `loadTabsFromService` at line 583. That function
references `isLoadingTabs`, but `isLoadingTabs` is declared (with `const` or
`let`) somewhere **after** line 311 in the `<script setup>` block.

In `<script setup>`, `const`/`let` declarations are in a temporal dead zone
until their line is reached. An `immediate` watcher runs synchronously during
setup — before later declarations are initialized.

**Fix:** Read `EditorView.vue`. Find `isLoadingTabs`. Move its declaration to
**before** the `watch` at line 311. Do not change anything else in the file.

```ts
// WRONG order:
watch(something, () => {
  loadTabsFromService()   // line 311 — calls isLoadingTabs
}, { immediate: true })

// ... many lines later ...
const isLoadingTabs = ref(false)  // line 583 — too late

// CORRECT order:
const isLoadingTabs = ref(false)  // move this BEFORE the watch

watch(something, () => {
  loadTabsFromService()
}, { immediate: true })
```

Move ALL refs and variables that `loadTabsFromService` depends on to above
the watch — not just `isLoadingTabs`. Read the function body to find every
variable it references, then check each one is declared before line 311.

---

## Error 3 — onUnmounted lifecycle warning

**Console message:**
```
[Vue warn]: onUnmounted is called when there is no active component instance.
Lifecycle injection APIs can only be used during execution of setup().
```

**Root cause:** The GoldenLayout `registerComponentFactoryFunction` callback
calls `createApp(component).mount(el)`. This creates a new Vue app instance,
but it runs *outside* any Vue component's `setup()` context. Any `onUnmounted`
call inside the panel component's setup runs in this detached context and Vue
cannot associate it with an app instance.

This is a known limitation of the `createApp` approach for GoldenLayout
integration. The panel component itself is fine — the issue is how cleanup
is wired.

**Fix:** Do not use `onUnmounted` in the `registerComponentFactoryFunction`
callback directly. Instead, listen to GoldenLayout's own container destroy
event and call `app.unmount()` from there:

```ts
// In MainLayout.vue registerPanels():
layout.registerComponentFactoryFunction(name, (container) => {
  const app = createApp(component)
  app.mount(container.element)

  // CORRECT cleanup — uses GL's event, not Vue lifecycle hook:
  container.addEventListener('destroy', () => {
    app.unmount()
  })

  // WRONG — do not do this:
  // onUnmounted(() => app.unmount())  ← not in setup() context, warns
})
```

Read `MainLayout.vue`. Find the `registerComponentFactoryFunction` callback.
Check whether it uses `onUnmounted` directly. If it does, replace it with
the `container.addEventListener('destroy', ...)` pattern above.

---

## Also: Xorg_libXext_jll Version Conflict (Julia — Separate Issue)

**Console message:**
```
Error: Unsatisfiable requirements detected for package Xorg_libXext_jll:
├─possible versions are: 1.3.8 or uninstalled (package in sysimage!)
└─restricted to versions 1.3.7 by an explicit requirement
```

**This is unrelated to the layout panels but will cause startup warnings
on every launch.** The sysimage was compiled with `Xorg_libXext_jll` 1.3.8,
but the project's `Manifest.toml` pins it to 1.3.7.

**Fix (do after layout is working — do not block on this):**

```julia
# Run in the JuliaLab Command Window:
import Pkg
Pkg.update("Xorg_libXext_jll")
```

If that fails (pin conflict), find what package requires 1.3.7:
```julia
Pkg.why("Xorg_libXext_jll")
```
Update the constraining package, or remove the explicit pin from `Manifest.toml`.

---

## Execution Order

1. **Fix Error 2 first** (EditorView.vue temporal dead zone) — it is a hard
   crash that prevents EditorView from mounting at all, which means even a
   correct GoldenLayout integration will show a blank Editor panel.

2. **Fix Error 1** (replace inline template strings with SFC imports).
   After this fix, run `npm run tauri dev` — panels should show content.

3. **Fix Error 3** (onUnmounted → container destroy event).
   This is a warning, not a crash, but fix it now while the file is open.

4. Run `npm run tauri dev`. Confirm in DevTools Console:
   - No "runtime compilation" warnings
   - No "Cannot access before initialization" error
   - No "onUnmounted" lifecycle warning
   - All four panels show content
   - Panels are draggable to new positions

5. Fix the Xorg version conflict last — separate Julia session, does not
   require a Tauri restart.

---

## Smoke Test

After all three fixes:

| Check | Expected |
|---|---|
| Console: runtime compilation warning | Gone |
| Console: isLoadingTabs ReferenceError | Gone |
| Console: onUnmounted warning | Gone |
| FILES panel | Shows file tree |
| EDITOR panel | Shows editor (no crash) |
| WORKSPACE panel | Shows workspace variables |
| COMMAND WINDOW panel | Shows terminal |
| Drag FILES header | Panel moves to new zone |
| Drag EDITOR header | Panel moves to new zone |