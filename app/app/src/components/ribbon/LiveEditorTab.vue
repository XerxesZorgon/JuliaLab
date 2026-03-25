<template>
  <div class="ribbon-group-row">
    <!-- Pluto Launch Group -->
    <div class="ribbon-group">
      <div class="ribbon-group-buttons">
        <button
          class="ribbon-btn ribbon-btn--large"
          :disabled="launching"
          :title="launching ? 'Starting Pluto...' : 'Open Pluto notebook server in browser'"
          @click="handleLaunchPluto"
        >
          <span class="ribbon-btn-icon">
            <!-- Pluto logo: stylised red circle -->
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="14" cy="14" r="11" fill="#E6192A" opacity="0.15"/>
              <circle cx="14" cy="14" r="7" fill="#E6192A" opacity="0.35"/>
              <circle cx="14" cy="14" r="4" fill="#E6192A"/>
              <circle cx="20" cy="8"  r="2" fill="#E6192A" opacity="0.6"/>
            </svg>
          </span>
          <span class="ribbon-btn-label">{{ launching ? 'Starting…' : 'Launch Pluto' }}</span>
        </button>
      </div>
      <div class="ribbon-group-label">NOTEBOOKS</div>
    </div>

    <div class="ribbon-group-divider" />

    <!-- Info Group -->
    <div class="ribbon-group">
      <div class="ribbon-group-buttons">
        <div class="ribbon-info-block">
          <p class="ribbon-info-title">Pluto.jl</p>
          <p class="ribbon-info-desc">Reactive Julia notebooks.<br>Opens in your default browser.</p>
          <p v-if="lastError" class="ribbon-info-error">{{ lastError }}</p>
        </div>
      </div>
      <div class="ribbon-group-label">INFO</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';

const launching = ref(false);
const lastError = ref<string | null>(null);

async function handleLaunchPluto() {
  launching.value = true;
  lastError.value = null;
  try {
    await invoke('launch_pluto');
  } catch (e: unknown) {
    lastError.value = e instanceof Error ? e.message : String(e);
  } finally {
    // Keep button disabled briefly so user gets feedback
    setTimeout(() => { launching.value = false; }, 3000);
  }
}
</script>

<style scoped>
.ribbon-group-row {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  height: 100%;
  gap: 0;
}

.ribbon-group {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 4px 8px 0;
  min-width: 80px;
}

.ribbon-group-buttons {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
}

.ribbon-group-label {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--jl-text-muted);
  text-align: center;
  padding: 2px 0 3px;
  text-transform: uppercase;
}

.ribbon-group-divider {
  width: 1px;
  background: var(--jl-border);
  margin: 6px 4px;
  align-self: stretch;
}

/* ─── Large button (icon + label stacked) ───────────────────────── */
.ribbon-btn--large {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 56px;
  height: 66px;
  padding: 4px 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--jl-text-primary);
  transition: all 0.15s ease;
  font-family: var(--jl-font-ui);
}

.ribbon-btn--large:hover:not(:disabled) {
  background: var(--jl-panel-hover, rgba(255,255,255,0.08));
  border-color: var(--jl-border);
}

.ribbon-btn--large:active:not(:disabled) {
  background: var(--jl-panel-active, rgba(255,255,255,0.15));
}

.ribbon-btn--large:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ribbon-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}

.ribbon-btn-label {
  font-size: 10px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  color: var(--jl-text-secondary, var(--jl-text-primary));
}

/* ─── Info block ───────────────────────────────────────────────── */
.ribbon-info-block {
  padding: 2px 4px;
  max-width: 180px;
}

.ribbon-info-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--jl-text-primary);
  margin: 0 0 2px;
}

.ribbon-info-desc {
  font-size: 10px;
  color: var(--jl-text-muted);
  margin: 0;
  line-height: 1.4;
}

.ribbon-info-error {
  font-size: 10px;
  color: var(--jl-accent-red, #e6192a);
  margin: 4px 0 0;
}
</style>