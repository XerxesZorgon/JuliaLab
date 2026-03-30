<template>
  <button
    class="ribbon-btn ribbon-toggle"
    :class="{ active: modelValue }"
    :title="label"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span class="ribbon-btn-icon">
      <component :is="resolvedIcon" :size="22" />
    </span>
    <span class="ribbon-btn-label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Move, Square } from 'lucide-vue-next'

const iconMap: Record<string, object> = {
  pan: Move,
}

const props = defineProps<{
  icon: string
  label: string
  modelValue?: boolean
}>()

defineEmits<{ 'update:modelValue': [value: boolean] }>()

const resolvedIcon = computed(() => iconMap[props.icon] ?? Square)
</script>

<style scoped>
.ribbon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background: none;
  border: 1px solid transparent;
  border-radius: 3px;
  padding: 3px 5px;
  cursor: pointer;
  min-width: 44px;
  gap: 2px;
  color: var(--jl-text-secondary, #505050);
  transition: background 0.1s, border-color 0.1s;
}
.ribbon-btn:hover {
  background: var(--jl-panel-bg-alt, rgba(0, 0, 0, 0.07));
}
.ribbon-toggle.active {
  background: rgba(56, 152, 38, 0.18);
  border-color: rgba(56, 152, 38, 0.4);
  color: var(--jl-accent-green, #389826);
}
.ribbon-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
.ribbon-btn-label {
  font-size: 10px;
  text-align: center;
  white-space: nowrap;
  font-family: var(--jl-font-ui);
}
</style>
