<template>
  <div
    class="panel-header"
    :class="{ 'drag-over': isDropTarget }"
    :data-panel-header="zone"
    @mousedown.stop.prevent="startDrag"
  >
    <span class="panel-header-title">{{ title }}</span>
    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import { useLayoutStore } from '../../store/layoutStore'

const props = defineProps<{
  zone: string   // 'left' | 'center' | 'right' | 'bottom'
  title: string
}>()

const layoutStore = useLayoutStore()

const isDropTarget = computed(() =>
  layoutStore.dropTargetZone === props.zone && layoutStore.draggedPanel !== null
)

function startDrag(e: MouseEvent) {
  if (e.button !== 0) return
  // Don't start a drag when clicking action buttons
  const target = e.target as HTMLElement
  if (target.closest('button, input, select, [role="button"]')) return

  layoutStore.draggedPanel = props.zone
  document.body.style.cursor = 'grabbing'
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  const el = document.elementFromPoint(e.clientX, e.clientY)
  const header = el?.closest('[data-panel-header]') as HTMLElement | null
  const targetZone = header?.dataset.panelHeader ?? null
  layoutStore.dropTargetZone = (targetZone && targetZone !== props.zone) ? targetZone : null
}

function onMouseUp(e: MouseEvent) {
  const el = document.elementFromPoint(e.clientX, e.clientY)
  const header = el?.closest('[data-panel-header]') as HTMLElement | null
  const targetZone = header?.dataset.panelHeader
  if (targetZone && targetZone !== layoutStore.draggedPanel) {
    layoutStore.swapPanels(layoutStore.draggedPanel!, targetZone)
  }
  cleanup()
}

function cleanup() {
  layoutStore.draggedPanel = null
  layoutStore.dropTargetZone = null
  document.body.style.cursor = ''
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

onUnmounted(cleanup)
</script>

<style scoped>
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  height: 28px;
  position: relative;
  z-index: 10;
  background: var(--jl-panel-bg-alt);
  border-bottom: 1px solid var(--jl-border);
  cursor: grab;
  user-select: none;
  transition: background 0.1s;
  flex-shrink: 0;
}
.panel-header.drag-over {
  background: color-mix(in srgb, var(--jl-accent-green) 20%, var(--jl-panel-bg-alt));
  outline: 2px dashed var(--jl-accent-green);
  outline-offset: -2px;
}
.panel-header-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--jl-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
