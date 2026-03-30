<template>
  <div class="layout-picker-wrapper">
    <button
      ref="triggerRef"
      class="layout-picker-trigger"
      :class="{ compact: props.compact }"
      @click="toggleOpen()"
      title="Choose Layout"
    >
      <LayoutPanelLeft :size="14" />
      <span v-if="!props.compact">Layout</span>
      <ChevronDown :size="10" />
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        ref="popoverRef"
        class="layout-picker-popover"
        :style="popoverStyle"
      >
        <div class="layout-picker-title">Desktop Layout</div>
        <div class="layout-grid">
          <button
            v-for="preset in presets"
            :key="preset.id"
            class="layout-card"
            :class="{ active: activePresetId === preset.id }"
            @click="apply(preset)"
            :title="preset.name"
          >
            <svg viewBox="0 0 48 36" class="layout-thumb" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="48" height="36" fill="var(--jl-panel-bg)" stroke="var(--jl-border)" stroke-width="0.5" />
              <rect v-if="preset.sizes.left > 1" x="0.5" y="0.5" :width="Math.max(0, preset.sizes.left / 100 * 48 - 1)" height="35" fill="var(--jl-files-panel-bg)" stroke="var(--jl-border)" stroke-width="0.5" />
              <rect v-if="preset.visibility.workspace && preset.sizes.right > 1" :x="(1 - preset.sizes.right / 100) * 48 + 0.5" y="0.5" :width="Math.max(0, preset.sizes.right / 100 * 48 - 1)" height="35" fill="var(--jl-workspace-bg)" stroke="var(--jl-border)" stroke-width="0.5" />
              <rect v-if="preset.visibility.terminal" :x="preset.sizes.left / 100 * 48 + 0.5" :y="(1 - preset.sizes.terminal / 100) * 36 + 0.5" :width="Math.max(0, (preset.sizes.center / 100) * 48 - 1)" :height="Math.max(0, preset.sizes.terminal / 100 * 36 - 0.5)" fill="var(--jl-terminal-bg)" stroke="var(--jl-border)" stroke-width="0.5" />
              <rect :x="preset.sizes.left / 100 * 48 + 0.5" y="0.5" :width="Math.max(0, (preset.sizes.center / 100) * 48 - 1)" :height="Math.max(0, (1 - (preset.visibility.terminal ? preset.sizes.terminal / 100 : 0)) * 36 - 0.5)" fill="var(--jl-accent-blue)" opacity="0.18" stroke="var(--jl-border)" stroke-width="0.5" />
            </svg>
            <span class="layout-card-label">{{ preset.name }}</span>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, inject } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { LayoutPanelLeft, ChevronDown } from 'lucide-vue-next'
import { useLayoutStore, BUILTIN_LAYOUTS, type SavedLayout } from '../../store/layoutStore'

const props = defineProps<{ compact?: boolean }>()

const layoutStore = useLayoutStore()
const applyDockLayoutPreset = inject<(preset: SavedLayout) => void>('applyDockLayoutPreset')
const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)
const popoverStyle = ref<Record<string, string>>({})

onClickOutside(triggerRef, () => { open.value = false }, { ignore: [popoverRef] })

const presets = BUILTIN_LAYOUTS

const activePresetId = computed(() => {
  const s = layoutStore.paneSizes
  return presets.find(p =>
    Math.abs((p.sizes.left  ?? 0) - s.left)     < 2 &&
    Math.abs((p.sizes.right ?? 0) - s.right)    < 2 &&
    Math.abs((p.sizes.terminal ?? 0) - s.terminal) < 3
  )?.id ?? null
})

function updatePopoverPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const estimatedPopoverHeight = 240

  const style: Record<string, string> = {
    position: 'fixed',
    // Clamp left so popover doesn't overflow right edge
    left: `${Math.min(rect.left, window.innerWidth - 300)}px`,
    zIndex: '1000',
    minWidth: '280px',
  }

  if (spaceBelow < estimatedPopoverHeight) {
    // Not enough space below — open upward
    style.bottom = `${window.innerHeight - rect.top + 4}px`
  } else {
    style.top = `${rect.bottom + 4}px`
  }

  popoverStyle.value = style
}

async function toggleOpen() {
  if (!open.value) {
    updatePopoverPosition()
    await nextTick()
  }
  open.value = !open.value
}

function apply(preset: SavedLayout) {
  layoutStore.applyPreset(preset)
  applyDockLayoutPreset?.(preset)
  open.value = false
}
</script>

<!-- Global styles: teleported popover lives outside the scoped shadow -->
<style>
.layout-picker-popover {
  background: var(--jl-panel-bg);
  border: 1px solid var(--jl-border);
  border-radius: 6px;
  padding: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.20);
  font-family: var(--jl-font-ui);
}
.layout-picker-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--jl-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}
.layout-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.layout-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 5px;
  border: 1px solid var(--jl-border);
  border-radius: 4px;
  background: none;
  cursor: pointer;
  transition: border-color 0.1s, background 0.1s;
}
.layout-card:hover { background: var(--jl-panel-bg-alt); }
.layout-card.active {
  border-color: var(--jl-accent-green);
  background: color-mix(in srgb, var(--jl-accent-green) 10%, transparent);
}
.layout-thumb {
  width: 72px;
  height: 54px;
  display: block;
  border-radius: 2px;
  overflow: hidden;
}
.layout-card-label {
  font-size: 9px;
  color: var(--jl-text-muted);
  white-space: nowrap;
}
</style>

<style scoped>
.layout-picker-wrapper {
  position: relative;
  display: inline-flex;
}
.layout-picker-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid var(--jl-border);
  background: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  color: var(--jl-text-primary);
  white-space: nowrap;
}
.layout-picker-trigger:hover { background: var(--jl-panel-bg-alt); }
.layout-picker-trigger.compact { padding: 2px 5px; }
</style>
