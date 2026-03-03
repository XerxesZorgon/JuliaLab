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

    <div class="statusbar-right">
      <span class="statusbar-item statusbar-filepath" v-if="currentFile">{{ currentFile }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { useAppStore } from '../../store/appStore';

const appStore = useAppStore();
const juliaVersion = ref('...');

// Revise state: only true after julia:revise-status event fires with true
const reviseActive = ref(false);
let unlistenRevise: UnlistenFn | null = null;

// Reset Revise status when Julia restarts
const juliaRunning = computed(() => appStore.juliaDaemonReady);
watch(juliaRunning, (running) => {
  if (!running) reviseActive.value = false;
});
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
  // Listen for Revise load confirmation from backend
  unlistenRevise = await listen<boolean>('julia:revise-status', (event) => {
    reviseActive.value = event.payload;
  });

  // Fetch Julia version
  try {
    const version = await invoke('get_julia_version');
    if (version && typeof version === 'string') juliaVersion.value = version;
  } catch {
    juliaVersion.value = 'not found';
  }
});

onUnmounted(() => {
  unlistenRevise?.();
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
</style>
