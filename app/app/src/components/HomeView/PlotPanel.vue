<template>
  <div class="plot-panel">
    <div class="plot-toolbar">
      <div class="toolbar-left">
        <!-- Navigation -->
        <n-button-group size="tiny">
          <n-button @click="back" :disabled="!canGoBack" title="Previous plot">
            <template #icon><n-icon><ChevronBack /></n-icon></template>
          </n-button>
          <n-button @click="forward" :disabled="!canGoForward" title="Next plot">
            <template #icon><n-icon><ChevronForward /></n-icon></template>
          </n-button>
        </n-button-group>
        <span class="plot-count" v-if="plotCount > 0">
          Plot {{ currentPlotIndex + 1 }} of {{ plotCount }}
        </span>

        <n-divider vertical v-if="plotCount > 0" />

        <!-- Makie toolbar: only meaningful when a plot is shown -->
        <n-button-group size="tiny" v-if="plotCount > 0">
          <n-tooltip trigger="hover" placement="bottom">
            <template #trigger>
              <n-button quaternary @click="handleResetView" title="Reset view">
                <template #icon><n-icon><ExpandOutline /></n-icon></template>
              </n-button>
            </template>
            Reset View
          </n-tooltip>
          <n-tooltip trigger="hover" placement="bottom">
            <template #trigger>
              <n-button quaternary @click="handleToggleGrid" title="Toggle grid">
                <template #icon><n-icon><GridOutline /></n-icon></template>
              </n-button>
            </template>
            Toggle Grid
          </n-tooltip>
        </n-button-group>

        <n-divider vertical v-if="plotCount > 0" />

        <!-- Export -->
        <n-button size="tiny" secondary v-if="plotCount > 0" @click="handleExportPdf">
          <template #icon><n-icon><DownloadOutline /></n-icon></template>
          Export PDF
        </n-button>
      </div>

      <div class="toolbar-right">
        <n-button quaternary circle size="tiny" @click="refresh" title="Refresh">
          <template #icon><n-icon><RefreshOutline /></n-icon></template>
        </n-button>
        <n-button quaternary circle size="tiny" @click="clearAll" title="Clear all plots" :disabled="plotCount === 0">
          <template #icon><n-icon><TrashOutline /></n-icon></template>
        </n-button>
        <n-divider vertical />
        <n-button quaternary circle size="tiny" @click="popOut" title="Open in browser" :disabled="!canPopOut">
          <template #icon><n-icon><OpenOutline /></n-icon></template>
        </n-button>
      </div>
    </div>

    <div class="plot-viewport">
      <div v-if="plotCount === 0" class="empty-plots">
        <n-icon size="48" color="var(--jl-text-muted)">
          <BarChartOutline />
        </n-icon>
        <p>No plots to display</p>
        <p class="hint">Plots generated from Julia will appear here</p>
      </div>

      <div v-else class="plot-container">
        <!-- WGLMakie / Interactive Output -->
        <iframe
          v-if="isInteractive"
          :src="interactiveUrl"
          class="plot-iframe"
          frameborder="0"
          @load="onIframeLoad"
        ></iframe>

        <!-- Static Image Output -->
        <div v-else-if="currentPlot?.imageSrc" class="static-plot">
          <img :src="currentPlot.imageSrc" :alt="currentPlot.title || 'Julia Plot'" />
        </div>

        <div v-else class="plot-loading">
          <n-spin size="medium" />
          <span>Loading plot...</span>
        </div>
      </div>
    </div>

    <div class="plot-footer" v-if="currentPlot">
      <span class="plot-name">{{ currentPlot.title || 'Figure ' + (currentPlotIndex + 1) }}</span>
      <span class="plot-meta">{{ currentPlot.mime_type }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  NButton, NButtonGroup, NIcon, NDivider, NSpin, NTooltip, useMessage
} from 'naive-ui';
import {
  ChevronBack, ChevronForward, RefreshOutline, TrashOutline,
  OpenOutline, BarChartOutline, ExpandOutline, GridOutline, DownloadOutline,
} from '@vicons/ionicons5';
import { usePlotStore } from '../../store/plotStore';
import { useTerminalStore } from '../../store/terminalStore';
import { open as openExternal } from '@tauri-apps/plugin-shell';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';

const plotStore = usePlotStore();
const terminalStore = useTerminalStore();
const message = useMessage();

// Constants
const WGL_MAKIE_PORT = 8081;

// Computed
const plots = computed(() => plotStore.plots);
const plotCount = computed(() => plotStore.plotCount);
const currentPlot = computed(() => plotStore.currentPlot);

const currentPlotIndex = computed(() => {
  if (!currentPlot.value) return -1;
  return plots.value.findIndex(p => p.id === currentPlot.value?.id);
});

const canGoBack = computed(() => currentPlotIndex.value > 0);
const canGoForward = computed(() => currentPlotIndex.value < plotCount.value - 1);

const isInteractive = computed(() => {
  if (plotStore.isInteractive) return true;
  if (!currentPlot.value) return false;
  return currentPlot.value.mime_type === 'text/html' ||
    currentPlot.value.mime_type.includes('interactive') ||
    currentPlot.value.mime_type.includes('makie');
});

const interactiveUrl = computed(() => `http://localhost:${WGL_MAKIE_PORT}`);

const canPopOut = computed(() => {
  if (isInteractive.value) return true;
  return !!(currentPlot.value?.image_url);
});

// Navigation
const back = () => {
  if (canGoBack.value) plotStore.setCurrentPlot(plots.value[currentPlotIndex.value - 1].id);
};
const forward = () => {
  if (canGoForward.value) plotStore.setCurrentPlot(plots.value[currentPlotIndex.value + 1].id);
};
const refresh = () => plotStore.loadAllPlots();
const clearAll = async () => { await plotStore.clearAllPlots(); };

// ── Makie toolbar ────────────────────────────────────────────────────────────

const handleResetView = async () => {
  try {
    await terminalStore.executeJuliaCode('JuliaLab.reset_current_view()');
  } catch {
    message.error('Reset view failed — is a Makie figure active?');
  }
};

const handleToggleGrid = async () => {
  try {
    await terminalStore.executeJuliaCode('JuliaLab.toggle_current_grid()');
  } catch {
    message.error('Toggle grid failed — is a Makie figure active?');
  }
};

const handleExportPdf = async () => {
  if (!currentPlot.value) return;

  const filePath = await saveDialog({
    title: 'Export Figure',
    defaultPath: `figure_${currentPlotIndex.value + 1}.pdf`,
    filters: [
      { name: 'PDF Document', extensions: ['pdf'] },
      { name: 'PNG Image', extensions: ['png'] },
      { name: 'SVG Vector', extensions: ['svg'] },
    ],
  });

  if (!filePath) return;

  try {
    const escaped = filePath.replace(/\\/g, '\\\\');
    await terminalStore.executeJuliaCode(`JuliaLab.export_current_plot("${escaped}")`);
    message.success('Figure exported successfully');
  } catch {
    message.error('Export failed — see REPL for details');
  }
};

// ── Pop-out ──────────────────────────────────────────────────────────────────

const popOut = async () => {
  if (isInteractive.value) {
    await openExternal(interactiveUrl.value);
  } else if (currentPlot.value?.image_url) {
    await openExternal(currentPlot.value.image_url);
  }
};

const onIframeLoad = () => {
  console.log('PlotPanel: iframe loaded');
};

onMounted(() => {
  if (plotCount.value === 0) plotStore.loadAllPlots();
});
</script>

<style scoped>
.plot-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--jl-panel-bg);
  overflow: hidden;
}

.plot-toolbar {
  height: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  background-color: var(--jl-panel-bg-alt);
  border-bottom: 1px solid var(--jl-border);
  gap: 6px;
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.plot-count {
  font-size: 11px;
  color: var(--jl-text-secondary);
  font-family: var(--jl-font-ui);
  white-space: nowrap;
}

.plot-viewport {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
}

:global([data-theme='dark']) .plot-viewport {
  background-color: #121212;
}

.empty-plots {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--jl-text-muted);
  text-align: center;
  padding: 20px;
}
.empty-plots p {
  margin: 8px 0 0;
  font-size: 14px;
  font-weight: 500;
}
.empty-plots .hint {
  font-size: 11px;
  margin-top: 4px;
}

.plot-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plot-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.static-plot {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
}
.static-plot img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.plot-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--jl-text-secondary);
}

.plot-footer {
  height: 24px;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  background-color: var(--jl-panel-bg-alt);
  border-top: 1px solid var(--jl-border);
  font-size: 11px;
}
.plot-name {
  color: var(--jl-text-primary);
  font-weight: 500;
}
.plot-meta {
  color: var(--jl-text-muted);
  font-family: var(--jl-font-mono);
}
</style>
