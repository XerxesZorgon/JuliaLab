<template>
  <div class="bottom-panel">
    <div class="command-window-titlebar">
      <span class="command-window-title">Command Window</span>
    </div>
    <n-tabs v-model:value="activeTab" type="line" animated>
      <n-tab-pane name="terminal" :tab="'Terminal'">
        <div class="pane-body"><TerminalView /></div>
      </n-tab-pane>
      <n-tab-pane name="diagnostics" :tab="diagnosticsTabTitle">
        <div class="pane-body">
          <DiagnosticsPanel :activeFilePath="activeFilePath" @count="onDiagCount" />
        </div>
      </n-tab-pane>
      <n-tab-pane name="history" tab="History">
        <div class="pane-body">
          <PlotLibrary />
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NTabs, NTabPane } from 'naive-ui';
import TerminalView from './TerminalView.vue';
import DiagnosticsPanel from './DiagnosticsPanel.vue';
import PlotLibrary from '../shared/PlotLibrary.vue';

const activeTab = ref<'terminal' | 'diagnostics' | 'history'>('terminal');
const activeFilePath = ref<string | null>(null);
const diagCount = ref<number>(0);

const diagnosticsTabTitle = computed(() =>
  diagCount.value > 0 ? `Diagnostics (${diagCount.value})` : 'Diagnostics'
);

function onDiagCount(n: number) {
  diagCount.value = n;
}

// Listen for active file change events from EditorView
window.addEventListener('active-file-changed', (e: any) => {
  if (e?.detail?.filePath) {
    activeFilePath.value = e.detail.filePath;
  }
});
</script>

<style scoped>
.bottom-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}
/* Keep Naive UI defaults; constrain the pane ourselves */
.pane-body {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}
/* Ensure tab pane content can size to its container */
.bottom-panel :deep(.n-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.bottom-panel :deep(.n-tabs .n-tabs-nav) {
  flex: 0 0 auto;
}
.bottom-panel :deep(.n-tabs .n-tabs-content) {
  flex: 1 1 auto;
  display: flex;
  min-height: 0;
}
.bottom-panel :deep(.n-tabs .n-tabs-pane-wrapper) {
  flex: 1 1 auto;
  display: flex;
  min-height: 0;
}
.bottom-panel :deep(.n-tabs .n-tab-pane) {
  flex: 1 1 auto;
  display: flex;
  min-height: 0;
  padding: 0;
}

.command-window-titlebar {
  background: #005A9C;
  color: #ffffff;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--jl-font-ui);
  letter-spacing: 0.04em;
  flex-shrink: 0;
  user-select: none;
}

.command-window-title {
  opacity: 0.95;
}
</style>
