<template>
  <div class="plot-panel">
    <!-- Figure Toolbar -->
    <div class="plot-toolbar">
      <div class="toolbar-left">
        <n-button-group size="small">
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button @click="handleResetView" quaternary circle>
                <template #icon>
                  <n-icon><RefreshOutline /></n-icon>
                </template>
              </n-button>
            </template>
            Reset View
          </n-tooltip>

          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button @click="handleToggleGrid" quaternary circle>
                <template #icon>
                  <n-icon><GridOutline /></n-icon>
                </template>
              </n-button>
            </template>
            Toggle Grid
          </n-tooltip>
        </n-button-group>

        <n-divider vertical />

        <n-button-group size="small">
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button @click="handleExportPdf" type="primary" secondary>
                <template #icon>
                  <n-icon><DocumentTextOutline /></n-icon>
                </template>
                Export PDF
              </n-button>
            </template>
            Export to Journal-Quality PDF (MakiePublication)
          </n-tooltip>
        </n-button-group>
      </div>

      <div class="toolbar-right">
        <n-button-group size="small" v-if="plotStore.plotCount > 1">
          <n-button @click="plotStore.getPreviousPlot" :disabled="!hasPrevious">
            <template #icon><n-icon><ChevronBackOutline /></n-icon></template>
          </n-button>
          <div class="plot-counter">
            {{ currentIndex + 1 }} / {{ plotStore.plotCount }}
          </div>
          <n-button @click="plotStore.getNextPlot" :disabled="!hasNext">
            <template #icon><n-icon><ChevronForwardOutline /></n-icon></template>
          </n-button>
        </n-button-group>
      </div>
    </div>

    <!-- Plot Content -->
    <div class="plot-content" ref="contentRef">
      <div v-if="!currentPlot" class="empty-state">
        <n-empty description="No plots to display">
          <template #icon>
            <n-icon><TrendingUpOutline /></n-icon>
          </template>
          <n-button size="small" @click="addTestPlot"> Generate Test Plot </n-button>
        </n-empty>
      </div>

      <div v-else class="plot-viewer">
        <!-- WGLMakie Interactive View -->
        <div v-if="isInteractive" class="interactive-container">
          <n-spin v-if="loadingInteractive" description="Initializing WGLMakie Server..." class="plot-spinner">
             <template #icon>
               <n-icon size="48"><TrendingUpOutline /></n-icon>
             </template>
          </n-spin>
          <iframe 
            v-show="!loadingInteractive"
            :src="interactiveUrl" 
            class="makie-iframe" 
            frameborder="0"
            @load="handleInteractiveLoad"
          ></iframe>
        </div>

        <!-- Static Image View -->
        <div v-else class="image-container">
          <img 
            :src="imageSrc" 
            :alt="currentPlot.title || 'Julia Plot'"
            class="plot-image"
            @error="handleImageError"
          />
        </div>

        <!-- Plot Metadata Overlays -->
        <div class="plot-metadata" v-if="showMetadata">
           <n-text depth="3" class="source-info">
             {{ currentPlot.source_file ? `${basename(currentPlot.source_file)}:${currentPlot.line_number || ''}` : 'REPL' }}
           </n-text>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { 
  NButton, NButtonGroup, NIcon, NTooltip, NDivider, NEmpty, NText, NSpin, useMessage 
} from 'naive-ui';
import { 
  RefreshOutline, 
  GridOutline, 
  DocumentTextOutline, 
  ChevronBackOutline, 
  ChevronForwardOutline,
  TrendingUpOutline,
  ExpandOutline
} from '@vicons/ionicons5';
import { usePlotStore } from '../../store/plotStore';
import { useTerminalStore } from '../../store/terminalStore';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { debug, error } from '../../utils/logger';

const plotStore = usePlotStore();
const terminalStore = useTerminalStore();
const message = useMessage();

const currentPlot = computed(() => plotStore.currentPlot);
const currentIndex = computed(() => {
  if (!currentPlot.value) return -1;
  return plotStore.plots.findIndex(p => p.id === currentPlot.value?.id);
});

const hasPrevious = computed(() => currentIndex.value > 0);
const hasNext = computed(() => currentIndex.value < plotStore.plotCount - 1);

const isInteractive = computed(() => {
  // Logic to determine if it's a WGLMakie interactive plot
  // Usually these have a specific MIME or we flag them
  return currentPlot.value?.mime_type === 'text/html' || currentPlot.value?.mime_type === 'application/vnd.julia.wglmakie.v1+html';
});

const interactiveUrl = computed(() => {
  // Use the reserved WGLMakie port (default 8081)
  return `http://127.0.0.1:8081`;
});

const imageSrc = computed(() => {
  if (!currentPlot.value) return '';
  return currentPlot.value.imageSrc || currentPlot.value.image_url || '';
});

const showMetadata = ref(true);
const loadingInteractive = ref(false);

// Reset loading state when plot changes
watch(() => currentPlot.value?.id, (newId) => {
  if (isInteractive.value && newId) {
    loadingInteractive.value = true;
  }
});

const handleInteractiveLoad = () => {
  debug('PlotPanel: Interactive plot loaded');
  loadingInteractive.value = false;
};

// --- Toolbar Actions ---

const handleResetView = async () => {
  try {
    debug('PlotPanel: Resetting view...');
    await terminalStore.executeJuliaCode('JuliaLab.reset_current_view()');
    message.info('View reset');
  } catch (err) {
    error('Failed to reset view', err);
    message.error('Failed to reset view');
  }
};

const handleToggleGrid = async () => {
  try {
    debug('PlotPanel: Toggling grid...');
    const result = await terminalStore.executeJuliaCode('JuliaLab.toggle_current_grid()');
    message.info('Grid toggled');
  } catch (err) {
    error('Failed to toggle grid', err);
    message.error('Failed to toggle grid');
  }
};

const handleExportPdf = async () => {
  if (!currentPlot.value) return;

  try {
    const filePath = await saveDialog({
      title: 'Export Figure to PDF',
      defaultPath: `figure_${currentPlot.value.id}.pdf`,
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
    });

    if (filePath) {
      debug(`PlotPanel: Exporting to PDF: ${filePath}`);
      // Use double backslashes for Windows paths in Julia string
      const escapedPath = filePath.replace(/\\/g, '\\\\');
      await terminalStore.executeJuliaCode(`JuliaLab.export_current_plot("${escapedPath}", format="pdf")`);
      message.success('Figure exported to PDF using MakiePublication');
    }
  } catch (err) {
    error('Failed to export PDF', err);
    message.error('Failed to export PDF');
  }
};

const addTestPlot = () => {
  plotStore.addTestPlot();
};

const handleImageError = () => {
  debug('PlotPanel: Image failed to load, trying store reload');
  if (currentPlot.value) {
    plotStore.getPlot(currentPlot.value.id);
  }
};

const basename = (path: string) => {
  return path.split(/[\\/]/).pop() || path;
};
</script>

<style scoped>
.plot-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--jl-bg);
  overflow: hidden;
}

.plot-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--jl-panel-bg-alt);
  border-bottom: 1px solid var(--jl-border);
  z-index: 10;
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plot-counter {
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-size: 11px;
  color: var(--jl-text-secondary);
  font-family: var(--jl-font-mono);
}

.plot-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 0;
  position: relative;
  background-image: 
    radial-gradient(var(--jl-border) 1px, transparent 1px);
  background-size: 20px 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.plot-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.interactive-container, .image-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.makie-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white; /* Makie usually has white bg */
}

.plot-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  background-color: white; /* Consistent with Makie defaults */
}

.plot-metadata {
  position: absolute;
  bottom: 8px;
  right: 12px;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  padding: 2px 8px;
  border-radius: 4px;
  pointer-events: none;
}

.source-info {
  font-size: 10px;
  font-family: var(--jl-font-mono);
}
</style>
