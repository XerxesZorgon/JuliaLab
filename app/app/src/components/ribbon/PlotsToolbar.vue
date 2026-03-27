<template>
  <div class="ribbon-tab-content">
    <RibbonGroup title="New">
      <RibbonBtn icon="plot" label="New Figure" :large="true" @click="handleNewFigure">
        <template #icon><span class="ci" v-html="coloredIcons.newFigure" /></template>
      </RibbonBtn>
    </RibbonGroup>

    <RibbonDivider />

    <RibbonGroup title="Plot">
      <RibbonBtn
        v-for="item in plotTypes"
        :key="item.name"
        :icon="item.colorIcon"
        :label="item.label"
        :large="true"
        @click="runPlot(item.code, item.label)"
      >
        <template #icon><span class="ci" v-html="coloredIcons[item.colorIcon]" /></template>
      </RibbonBtn>
    </RibbonGroup>

    <RibbonDivider />

    <RibbonGroup title="Zoom">
      <div class="ribbon-col">
        <RibbonBtn icon="find" label="Zoom In" @click="stubAction('Zoom In')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.zoomIn" /></template>
        </RibbonBtn>
        <RibbonBtn icon="find" label="Zoom Out" @click="stubAction('Zoom Out')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.zoomOut" /></template>
        </RibbonBtn>
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <RibbonGroup title="Pan">
      <RibbonBtn icon="layout" label="Pan" :large="true" @click="stubAction('Pan')">
        <template #icon><span class="ci" v-html="coloredIcons.pan" /></template>
      </RibbonBtn>
    </RibbonGroup>

    <RibbonDivider />

    <RibbonGroup title="Annotate">
      <div class="ribbon-col">
        <RibbonBtn icon="newFile" label="Add Label" @click="stubAction('Add Label')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.addLabel" /></template>
        </RibbonBtn>
        <RibbonBtn icon="settings" label="Style" @click="stubAction('Style')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.style" /></template>
        </RibbonBtn>
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <RibbonGroup title="Export">
      <div class="ribbon-col">
        <RibbonBtn icon="save" label="PNG" @click="handleExport('png')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.exportImg" /></template>
        </RibbonBtn>
        <RibbonBtn icon="save" label="SVG" @click="handleExport('svg')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.exportImg" /></template>
        </RibbonBtn>
        <RibbonBtn icon="save" label="PDF" @click="handleExport('pdf')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.exportImg" /></template>
        </RibbonBtn>
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <RibbonGroup title="Figure">
      <div class="ribbon-col">
        <RibbonBtn icon="newFile" label="Copy Code" @click="copyLastCode">
          <template #icon><span class="ci-sm" v-html="coloredIcons.copyCode" /></template>
        </RibbonBtn>
        <RibbonBtn icon="settings" label="Figure Settings" @click="stubAction('Figure Settings')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.style" /></template>
        </RibbonBtn>
      </div>
    </RibbonGroup>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { useMessage } from 'naive-ui';
import { useLayoutStore } from '../../store/layoutStore';
import { useAppStore } from '../../store/appStore';
import RibbonGroup from './RibbonGroup.vue';
import RibbonBtn from './RibbonBtn.vue';
import RibbonDivider from './RibbonDivider.vue';
import { coloredIcons } from './ribbon-icons-colored';

const message = useMessage();
const layoutStore = useLayoutStore();
const appStore = useAppStore();
const lastExecutedCode = ref('');

const executePlotSnippet = async (plotExpr: string) => {
  const code = `using CairoMakie; display(${plotExpr})`;

  await invoke('execute_julia_code', { code });

  return code;
};

const plotTypes = [
  { name: 'line',     label: 'Line',     colorIcon: 'linePlot',    code: 'begin f = Figure(); ax = Axis(f[1, 1], title="Line Plot"); lines!(ax, 1:10, rand(10)); f end' },
  { name: 'scatter',  label: 'Scatter',  colorIcon: 'scatterPlot', code: 'begin f = Figure(); ax = Axis(f[1, 1], title="Scatter Plot"); scatter!(ax, 1:10, rand(10)); f end' },
  { name: 'bar',      label: 'Bar',      colorIcon: 'barPlot',     code: 'begin f = Figure(); ax = Axis(f[1, 1], title="Bar Plot"); barplot!(ax, 1:5, rand(5)); f end' },
  { name: 'heatmap',  label: 'Heatmap',  colorIcon: 'heatmapPlot', code: 'begin f = Figure(); ax = Axis(f[1, 1], title="Heatmap"); heatmap!(ax, rand(20, 20)); f end' },
  { name: 'surface',  label: 'Surface',  colorIcon: 'surfacePlot', code: 'begin f = Figure(); ax = Axis3(f[1, 1], title="Surface"); surface!(ax, rand(20, 20)); f end' },
  { name: 'contour',  label: 'Contour',  colorIcon: 'contourPlot', code: 'begin f = Figure(); ax = Axis(f[1, 1], title="Contour"); contour!(ax, rand(20, 20)); f end' },
];

const handleNewFigure = async () => {
  if (appStore.getBackendBusyStatus()) {
    message.info('Julia is busy starting up. Please wait a moment and try again.');
    return;
  }

  layoutStore.activeRightTab = 'plots';
  const plotExpr = 'Figure()';
  try {
    const code = await executePlotSnippet(plotExpr);
    lastExecutedCode.value = code;
  } catch (err) {
    console.error('PlotsToolbar: Failed to create new figure:', err);
    message.error('Failed to create new figure');
  }
};

const runPlot = async (plotCode: string, label: string) => {
  if (appStore.getBackendBusyStatus()) {
    message.info('Julia is busy starting up. Please wait a moment and try again.');
    return;
  }

  layoutStore.activeRightTab = 'plots';
  try {
    const code = await executePlotSnippet(plotCode);
    lastExecutedCode.value = code;
    message.success(`${label} plot sent to Julia`);
  } catch (retryErr) {
    console.error(`PlotsToolbar: Failed to run ${label} plot:`, retryErr);
    message.error(`Failed to run ${label} plot`);
  }
};

const handleExport = async (format: 'png' | 'svg' | 'pdf') => {
  try {
    const result = await invoke<string | null>('plot_export', { format });
    if (result) {
      message.success(`Export ready (${format.toUpperCase()}): ${result}`);
    } else {
      message.info(`Export ${format.toUpperCase()} cancelled`);
    }
  } catch (err) {
    console.error(`PlotsToolbar: Failed to export ${format}:`, err);
    message.error(`Failed to export ${format.toUpperCase()}`);
  }
};

const copyLastCode = async () => {
  if (!lastExecutedCode.value) {
    message.warning('No recent plot command to copy');
    return;
  }
  try {
    await navigator.clipboard.writeText(lastExecutedCode.value);
    message.success('Plot command copied');
  } catch (err) {
    console.error('PlotsToolbar: Failed to copy plot code:', err);
    message.error('Failed to copy plot code');
  }
};

const stubAction = (action: string) => {
  console.log(`PlotsToolbar: ${action} clicked (stub)`);
  message.info(`${action} is coming soon`);
};
</script>

<style scoped>
.ribbon-tab-content {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  min-height: 68px;
  width: 100%;
}

.ribbon-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ci {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  line-height: 0;
}
.ci-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  line-height: 0;
}
.ci :deep(svg) { width: 28px; height: 28px; }
.ci-sm :deep(svg) { width: 16px; height: 16px; }
</style>
