<template>
  <div ref="glContainer" class="gl-container" />
</template>

<script setup>
import { ref, shallowRef, onMounted, onUnmounted, nextTick, createApp, getCurrentInstance, h, defineComponent } from 'vue'
import { GoldenLayout }   from 'golden-layout'
import {
  NConfigProvider,
  NMessageProvider,
  NNotificationProvider,
  NDialogProvider,
} from 'naive-ui'
import { themeOverrides } from '../../theme'
import 'golden-layout/dist/css/goldenlayout-base.css'
import 'golden-layout/dist/css/themes/goldenlayout-dark-theme.css'

// ─── Panel components ─────────────────────────────────────────────────────────
import FileTreePanel      from './FileTreePanel.vue'
import EditorView         from '../HomeView/EditorView.vue'
import BottomPanel        from '../HomeView/BottomPanel.vue'
import WorkspaceTabsPanel from './WorkspaceTabsPanel.vue'

// ─── Step 4 gate ──────────────────────────────────────────────────────────────
// Set PLACEHOLDER_MODE = true to verify GL renders before real components.
// When four colored panels are visible and draggable, flip to false.
// ─────────────────────────────────────────────────────────────────────────────
const PLACEHOLDER_MODE = false

const PANEL_MAP = PLACEHOLDER_MODE
  ? {
      FileTree:      { template: '<div style="padding:16px;background:#1a3a1a;color:#88cc88;height:100%">Files (placeholder)</div>' },
      Editor:        { template: '<div style="padding:16px;background:#1a1a3a;color:#8888cc;height:100%">Editor (placeholder)</div>' },
      CommandWindow: { template: '<div style="padding:16px;background:#3a3a1a;color:#cccc88;height:100%">Command Window (placeholder)</div>' },
      Workspace:     { template: '<div style="padding:16px;background:#3a1a1a;color:#cc8888;height:100%">Workspace (placeholder)</div>' },
    }
  : {
      FileTree:      FileTreePanel,
      Editor:        EditorView,
      CommandWindow: BottomPanel,
      Workspace:     WorkspaceTabsPanel,
    }

// ─── Default layout config ────────────────────────────────────────────────────
const DEFAULT_CONFIG = {
  settings: {
    reorderEnabled: true,
    constrainDragToContainer: true,
  },
  root: {
    type: 'row',
    content: [
      {
        type: 'column',
        content: [{ type: 'component', componentType: 'FileTree', title: 'Files', isClosable: true }],
      },
      {
        type: 'column',
        content: [
          { type: 'component', componentType: 'Editor',        title: 'Editor',         isClosable: true },
          { type: 'component', componentType: 'CommandWindow', title: 'Command Window', isClosable: true },
        ],
      },
      {
        type: 'column',
        content: [{ type: 'component', componentType: 'Workspace', title: 'Workspace', isClosable: true }],
      },
    ],
  },
}

function forceReorderEnabled(config) {
  if (!config || typeof config !== 'object') return config

  const walk = (node) => {
    if (!node || typeof node !== 'object') return

    if (node.type === 'component') {
      node.reorderEnabled = true
      node.isClosable = true
    }

    if (Array.isArray(node.content)) {
      node.content.forEach(walk)
    }
  }

  const next = JSON.parse(JSON.stringify(config))
  next.settings = {
    ...(next.settings || {}),
    reorderEnabled: true,
    constrainDragToContainer: true,
  }

  walk(next.root)
  return next
}

function hasInvalidSizeValues(value) {
  if (!value || typeof value !== 'object') return false

  if (Array.isArray(value)) {
    return value.some((item) => hasInvalidSizeValues(item))
  }

  const obj = value
  for (const [key, child] of Object.entries(obj)) {
    if (key === 'width' || key === 'height' || key === 'size') {
      if (typeof child !== 'string') return true
    }
    if (hasInvalidSizeValues(child)) {
      return true
    }
  }

  return false
}

const instance = getCurrentInstance()
const mountedComponents = new Map()

function mountPanel(component, containerEl) {
  const wrapped = defineComponent({
    render() {
      return h(
        NConfigProvider,
        { themeOverrides },
        {
          default: () =>
            h(NMessageProvider, {}, {
              default: () =>
                h(NNotificationProvider, {}, {
                  default: () =>
                    h(NDialogProvider, {}, {
                      default: () => h(component),
                    }),
                }),
            }),
        }
      )
    },
  })

  const app = createApp(wrapped)

  // Inherit parent app provides so stores/router/composables continue to resolve.
  if (instance?.appContext?.provides) {
    Object.assign(app._context.provides, instance.appContext.provides)
  }

  app.mount(containerEl)
  return app
}

// ─── Register panels with GoldenLayout ───────────────────────────────────────
function registerPanels(layout) {
  for (const [name, component] of Object.entries(PANEL_MAP)) {
    layout.registerComponentFactoryFunction(name, (container) => {
      const el = container.element
      if (mountedComponents.has(el)) return

      const app = mountPanel(component, el)
      mountedComponents.set(el, app)

      // Use GoldenLayout's item lifecycle event (not a DOM "destroy" event).
      container.addEventListener('beforeItemDestroyed', () => {
        const mounted = mountedComponents.get(el)
        if (mounted) {
          mounted.unmount()
          mountedComponents.delete(el)
        }
      })
    })
  }
}

// ─── Refs & state ─────────────────────────────────────────────────────────────
const glContainer    = ref(null)
const gl             = shallowRef(null)
let   resizeObserver = null

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  // nextTick ensures Vue has rendered the template and assigned glContainer.
  // requestAnimationFrame defers until after the browser's layout pass so
  // getBoundingClientRect() returns real dimensions (not 0×0).
  await nextTick()

  requestAnimationFrame(() => {
    const el = glContainer.value
    if (!el) {
      console.error('[DockLayout] glContainer ref is null — cannot init GoldenLayout')
      return
    }

    const rect = el.getBoundingClientRect()
    if (rect.height === 0) {
      console.error('[DockLayout] container has ZERO height — GoldenLayout will be blank. Fix flex sizing in parent.')
    }

    const layout = new GoldenLayout(el)
    gl.value = layout

    registerPanels(layout)

    // Clear any saved layout from incompatible config versions.
    const LAYOUT_VERSION = 'v7'
    if (localStorage.getItem('julialab-gl-layout-version') !== LAYOUT_VERSION) {
      localStorage.removeItem('julialab-gl-layout')
      localStorage.setItem('julialab-gl-layout-version', LAYOUT_VERSION)
    }

    const savedRaw = localStorage.getItem('julialab-gl-layout')
    let saved = null
    if (savedRaw) {
      try {
        const parsed = JSON.parse(savedRaw)
        if (hasInvalidSizeValues(parsed)) {
          localStorage.removeItem('julialab-gl-layout')
          console.log('[DockLayout] cleared invalid-size layout from localStorage')
        } else {
          saved = parsed
        }
      } catch {
        localStorage.removeItem('julialab-gl-layout')
      }
    }

    try {
      const configToLoad = forceReorderEnabled(saved || DEFAULT_CONFIG)
      layout.loadLayout(configToLoad)
    } catch (e) {
      console.warn('[DockLayout] failed to restore saved layout, using default:', e)
      localStorage.removeItem('julialab-gl-layout')
      layout.loadLayout(forceReorderEnabled(DEFAULT_CONFIG))
    }

    layout.addEventListener('stateChanged', () => {
      try {
        localStorage.setItem('julialab-gl-layout', JSON.stringify(layout.saveLayout()))
      } catch { /* quota exceeded */ }
    })

    resizeObserver = new ResizeObserver(() => {
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        layout.updateSize(el.clientWidth, el.clientHeight)
      }
    })
    resizeObserver.observe(el)
  })
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  mountedComponents.forEach((app) => app.unmount())
  mountedComponents.clear()
  gl.value?.destroy()
  gl.value = null
})

defineExpose({
  gl,
  saveLayout: () => gl.value?.saveLayout(),
  loadLayout: (config) => gl.value?.loadLayout(config),
})
</script>

<style scoped>
.gl-container {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: visible;
  position: relative;
}
</style>

<style>
/* GoldenLayout chrome — themed to JuliaLab dark palette */
.lm_goldenlayout {
  background: var(--jl-bg, #1e1e1e);
}
.lm_content {
  background: var(--jl-panel-bg, #252526);
  overflow: hidden;
}
.lm_header {
  background: var(--jl-panel-bg-alt, #2d2d2d) !important;
  height: 28px !important;
}
.lm_tab {
  background: var(--jl-panel-bg-alt, #2d2d2d) !important;
  color: var(--jl-text-muted, #888) !important;
  border: 1px solid var(--jl-border, #3a3a3a) !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 4px 12px !important;
  height: 28px !important;
  cursor: grab;
}
.lm_tab.lm_active {
  background: var(--jl-panel-bg, #252526) !important;
  color: var(--jl-text-primary, #d4d4d4) !important;
  border-bottom-color: transparent !important;
}
.lm_tab:hover:not(.lm_active) {
  background: color-mix(in srgb, var(--jl-accent-green, #4ec94e) 12%,
              var(--jl-panel-bg-alt, #2d2d2d)) !important;
}
.lm_splitter {
  background: var(--jl-border, #3a3a3a) !important;
  z-index: 50;
  transition: background 0.15s;
}
.lm_splitter:hover,
.lm_splitter.lm_dragging {
  background: var(--jl-accent-green, #4ec94e) !important;
}
.lm_vertical .lm_splitter {
  height: 6px !important;
  cursor: row-resize;
}
.lm_horizontal .lm_splitter {
  width: 6px !important;
  cursor: col-resize;
}
.lm_dragProxy .lm_content {
  opacity: 0.7;
  border: 2px solid var(--jl-accent-green, #4ec94e);
  border-radius: 3px;
}
.lm_dropTargetIndicator {
  background: color-mix(in srgb, var(--jl-accent-green, #4ec94e) 15%, transparent);
  border: 2px dashed var(--jl-accent-green, #4ec94e);
  border-radius: 3px;
}
</style>
