<template>
  <button
    class="ribbon-btn"
    :class="{ large, active, disabled }"
    :disabled="disabled"
    @click="!disabled && $emit('click')"
  >
    <!-- Colored icon slot — overrides default SVG when provided -->
    <slot name="icon">
      <svg
        :width="large ? 28 : 16"
        :height="large ? 28 : 16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="ribbon-btn-icon"
      >
        <template v-if="Array.isArray(iconPaths)">
          <path v-for="(d, i) in iconPaths" :key="i" :d="d" />
        </template>
        <template v-else>
          <path :d="iconPaths" />
        </template>
      </svg>
    </slot>
    <span class="ribbon-btn-label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ribbonIcons } from './ribbon-icons';

const props = defineProps<{
  icon: string;
  label: string;
  large?: boolean;
  active?: boolean;
  disabled?: boolean;
}>();

defineEmits<{
  click: [];
}>();

const iconPaths = computed(() => ribbonIcons[props.icon] || '');
</script>

<style scoped>
.ribbon-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 7px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.12s ease;
  white-space: nowrap;
  color: var(--jl-text-secondary);
}

/* Large mode: icon stacked above label */
.ribbon-btn.large {
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 4px 8px;
  min-width: 56px;
}

/* Hover */
.ribbon-btn:not(.disabled):hover {
  background: rgba(0, 90, 156, 0.10);
  border-color: rgba(0, 90, 156, 0.25);
  color: var(--jl-text-primary);
}

/* Active state */
.ribbon-btn.active {
  background: rgba(56, 152, 38, 0.18);
  border-color: rgba(56, 152, 38, 0.4);
  color: #4ec832;
}
.ribbon-btn.active:hover {
  background: rgba(56, 152, 38, 0.25);
}

/* Disabled */
.ribbon-btn.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Label */
.ribbon-btn-label {
  font-size: 10.5px;
  font-family: var(--jl-font-ui);
  letter-spacing: 0.01em;
  line-height: 1;
}
.ribbon-btn.large .ribbon-btn-label {
  font-size: 10px;
}

/* Icon inherits color */
.ribbon-btn-icon {
  flex-shrink: 0;
}
</style>
