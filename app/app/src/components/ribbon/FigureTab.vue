<template>
  <div class="ribbon-tab-content">
    <!-- FILE group -->
    <RibbonGroup title="File">
      <RibbonBtn icon="save" label="Save As" :large="true" @click="handleSaveAs">
        <template #icon><span class="ci" v-html="coloredIcons.saveAs" /></template>
      </RibbonBtn>
      <div class="ribbon-col">
        <RibbonBtn icon="print" label="Print" @click="stub('Print')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.print" /></template>
        </RibbonBtn>
        <RibbonBtn icon="copy" label="Copy Figure" @click="stub('Copy Figure')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.copyFigure" /></template>
        </RibbonBtn>
        <RibbonBtn icon="code" label="Show Code" @click="stub('Show Code')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.showCode" /></template>
        </RibbonBtn>
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <!-- LABELS AND ANNOTATIONS group -->
    <RibbonGroup title="Labels and Annotations">
      <RibbonBtn icon="title" label="Title" :large="true" @click="insertLabel('title')">
        <template #icon><span class="ci" v-html="coloredIcons.figTitle" /></template>
      </RibbonBtn>
      <div class="ribbon-col">
        <RibbonBtn icon="subtitle" label="Subtitle" @click="insertLabel('subtitle')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.figSubtitle" /></template>
        </RibbonBtn>
        <RibbonBtn icon="xlabel" label="X-Label" @click="insertLabel('xlabel')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.xLabel" /></template>
        </RibbonBtn>
        <RibbonBtn icon="ylabel" label="Y-Label" @click="insertLabel('ylabel')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.yLabel" /></template>
        </RibbonBtn>
      </div>
      <div class="ribbon-col">
        <RibbonBtn icon="legend" label="Legend" @click="insertLabel('legend')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.legend" /></template>
        </RibbonBtn>
        <RibbonBtn icon="colorbar" label="Colorbar" @click="insertLabel('colorbar')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.colorbar" /></template>
        </RibbonBtn>
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <!-- GRID group -->
    <RibbonGroup title="Grid">
      <RibbonBtn icon="grid" label="Grid" :large="true"
        :active="gridState.all" @click="toggleGrid('all')">
        <template #icon><span class="ci" v-html="coloredIcons.gridIcon" /></template>
      </RibbonBtn>
      <div class="ribbon-col">
        <RibbonBtn icon="xgrid" label="X-Grid"
          :active="gridState.x" @click="toggleGrid('x')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.xGrid" /></template>
        </RibbonBtn>
        <RibbonBtn icon="ygrid" label="Y-Grid"
          :active="gridState.y" @click="toggleGrid('y')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.yGrid" /></template>
        </RibbonBtn>
      </div>
    </RibbonGroup>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { useMessage } from 'naive-ui';
import { coloredIcons } from './ribbon-icons-colored';
import RibbonGroup from './RibbonGroup.vue';
import RibbonBtn from './RibbonBtn.vue';
import RibbonDivider from './RibbonDivider.vue';

const message = useMessage();
const gridState = reactive({ all: false, x: false, y: false });

function stub(action: string) {
  message.info(`${action} coming soon`);
}

async function handleSaveAs() {
  message.info('Save As coming soon');
}

async function insertLabel(type: string) {
  const codeMap: Record<string, string> = {
    title:    'ax = current_axis(); ax.title = "My Title"',
    subtitle: 'Label(fig[0, 1], "Subtitle", fontsize=14)',
    xlabel:   'ax = current_axis(); ax.xlabel = "X Axis"',
    ylabel:   'ax = current_axis(); ax.ylabel = "Y Axis"',
    legend:   'axislegend(current_axis())',
    colorbar: 'Colorbar(fig[1, 2])',
  };
  const code = codeMap[type];
  if (code) {
    try {
      await invoke('execute_julia_code', { code });
      message.success(`${type} inserted`);
    } catch {
      message.error(`Failed to insert ${type}`);
    }
  }
}

async function toggleGrid(axis: 'all' | 'x' | 'y') {
  if (axis === 'all') {
    gridState.all = !gridState.all;
    gridState.x = gridState.all;
    gridState.y = gridState.all;
  } else {
    gridState[axis] = !gridState[axis];
  }
  const xv = gridState.x;
  const yv = gridState.y;
  const code = axis === 'all'
    ? `ax = current_axis(); ax.xgridvisible = ${gridState.all}; ax.ygridvisible = ${gridState.all}`
    : `ax = current_axis(); ax.${axis}gridvisible = ${axis === 'x' ? xv : yv}`;
  try {
    await invoke('execute_julia_code', { code });
  } catch {
    console.warn('FigureTab: grid toggle failed');
  }
}
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
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; line-height: 0;
}
.ci-sm {
  display: flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; line-height: 0;
}
.ci :deep(svg) { width: 28px; height: 28px; }
.ci-sm :deep(svg) { width: 16px; height: 16px; }
</style>
