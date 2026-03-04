<template>
  <div class="ribbon-group">
    <div class="ribbon-group-buttons">
      <slot />
    </div>
    <div class="ribbon-group-label">{{ title }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<style scoped>
.ribbon-group {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.ribbon-group-buttons {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1px;
  flex: 1;
  padding: 4px 6px 2px;
}

.ribbon-group-label {
  font-size: 9.5px;
  color: var(--jl-text-muted);
  text-align: center;
  padding: 1px 6px 3px;
  font-family: var(--jl-font-ui);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-top: 1px solid var(--jl-border-light);
}
</style>
