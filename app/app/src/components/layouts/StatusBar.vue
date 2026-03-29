<template>
  <div class="statusbar">
    <div class="statusbar-left">
      <!-- Julia version -->
      <span class="statusbar-item">Julia {{ juliaVersion }}</span>

      <!-- Revise indicator -->
      <span class="statusbar-item">
        <span class="dot" :class="reviseActive ? 'dot--green' : 'dot--grey'"></span>
        {{ reviseActive ? 'Revise active' : 'Revise inactive' }}
      </span>

      <!-- LSP indicator -->
      <span class="statusbar-item">
        <span class="dot" :class="lspReady ? 'dot--green' : 'dot--grey'"></span>
        LSP {{ lspLabel }}
      </span>
    </div>

    <!-- Center: rotating tip of the day -->
    <div class="statusbar-center">
      <button
        class="statusbar-tip"
        id="statusbar-next-tip-btn"
        @click="nextTip()"
        :title="currentTip.text"
        aria-label="Next tip"
      >
        <span class="tip-cat-icon">{{ tipEmoji(currentTip) }}</span>
        <span class="tip-snippet">{{ tipSnippet }}</span>
        <span class="tip-nav">›</span>
      </button>
    </div>

    <div class="statusbar-right">
      <LayoutPicker :compact="true" />
      <span class="statusbar-item statusbar-filepath" v-if="currentFile">{{ currentFile }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../store/appStore';
import { useTips } from '../../features/tips/useTips';
import LayoutPicker from './LayoutPicker.vue';

const appStore = useAppStore();
const juliaVersion = ref('...');

// Tips
const { currentTip, nextTip, tipEmoji } = useTips();
const tipSnippet = computed(() => {
  const text = currentTip.value.text;
  // Trim to ~55 chars so it fits the status bar at most window widths.
  return text.length > 58 ? text.slice(0, 55) + '…' : text;
});

// Revise state: sourced from global appStore (set by App.vue listener)
const reviseActive = computed(() => appStore.reviseActive);
// LSP status from appStore
const lspReady = computed(() => appStore.lspStatus.status === 'ready');
const lspLabel = computed(() => {
  const s = appStore.lspStatus.status;
  if (s === 'ready') return 'ready';
  if (s === 'starting' || s === 'started' || s === 'initialized' || s === 'loading-cache') return 'starting…';
  if (s === 'failed') return 'failed';
  if (s === 'stopped') return 'stopped';
  return 'inactive';
});

// Current file path
const currentFile = computed(() => appStore.activeTab);

// Fetch Julia version on mount
onMounted(async () => {
  // Fetch Julia version
  try {
    const version = await invoke('get_julia_version');
    if (version && typeof version === 'string') juliaVersion.value = version;
  } catch {
    juliaVersion.value = 'not found';
  }
});

</script>

<style scoped>
.statusbar {
  height: 22px;
  min-height: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  background-color: var(--jl-bg);
  border-top: 1px solid var(--jl-border);
  font-family: var(--jl-font-mono);
  font-size: 10px;
  color: var(--jl-text-secondary);
  flex-shrink: 0;
  overflow: hidden;
}

.statusbar-left,
.statusbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.statusbar-right {
  flex-shrink: 1;
  min-width: 0;
}

.statusbar-item {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.statusbar-filepath {
  overflow: hidden;
  text-overflow: ellipsis;
  direction: rtl;
  text-align: left;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.dot--green {
  background-color: var(--jl-accent-green);
}

.dot--grey {
  background-color: var(--jl-text-muted);
}

/* === Center tip strip === */
.statusbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
  padding: 0 8px;
}

.statusbar-tip {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--jl-text-secondary);
  font-family: var(--jl-font-mono);
  font-size: 10px;
  padding: 0 6px;
  border-radius: 4px;
  max-width: 480px;
  white-space: nowrap;
  overflow: hidden;
  transition: color 0.15s, background 0.15s;
}
.statusbar-tip:hover {
  color: var(--jl-accent-green);
  background: rgba(77, 191, 106, 0.08);
}

.tip-cat-icon {
  font-size: 11px;
  flex-shrink: 0;
}

.tip-snippet {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tip-nav {
  flex-shrink: 0;
  opacity: 0.5;
  font-size: 12px;
}
</style>
