<template>
  <div class="ribbon-tab-content">
    <!-- FILE group -->
    <RibbonGroup title="File">
      <RibbonBtn icon="newFile" label="New Script" :large="true" @click="handleNew">
        <template #icon><span class="ci" v-html="coloredIcons.newFile" /></template>
      </RibbonBtn>
      <div class="ribbon-col">
        <RibbonBtn icon="newDropdown" label="New ▾" @click="handleNewDropdown">
          <template #icon><span class="ci-sm" v-html="coloredIcons.newDropdown" /></template>
        </RibbonBtn>
        <RibbonBtn icon="open" label="Open" @click="handleOpen">
          <template #icon><span class="ci-sm" v-html="coloredIcons.open" /></template>
        </RibbonBtn>
        <RibbonBtn icon="goToFile" label="Go to File" @click="handleGoToFile">
          <template #icon><span class="ci-sm" v-html="coloredIcons.goToFile" /></template>
        </RibbonBtn>
        <RibbonBtn icon="findFiles" label="Find Files" @click="handleFindFiles">
          <template #icon><span class="ci-sm" v-html="coloredIcons.findFiles" /></template>
        </RibbonBtn>
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <!-- CODE group -->
    <RibbonGroup title="Code">
      <RibbonBtn icon="section" label="Run Section" :large="true" @click="runCell">
        <template #icon><span class="ci" v-html="coloredIcons.section" /></template>
      </RibbonBtn>
      <div class="ribbon-col">
        <RibbonBtn icon="format" label="Format Code" @click="formatFile">
          <template #icon><span class="ci-sm" v-html="coloredIcons.format" /></template>
        </RibbonBtn>
        <RibbonBtn icon="run" label="Run File" @click="runFile">
          <template #icon><span class="ci-sm" v-html="coloredIcons.run" /></template>
        </RibbonBtn>
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <!-- MODELING group -->
    <RibbonGroup title="Modeling">
      <RibbonBtn icon="dyad" label="Open in Dyad" :large="true" @click="handleOpenDyad">
        <template #icon><span class="ci" v-html="coloredIcons.dyad" /></template>
      </RibbonBtn>
    </RibbonGroup>

    <RibbonDivider />

    <!-- VARIABLE group -->
    <RibbonGroup title="Variables">
      <RibbonBtn icon="trash" label="Clear Workspace" :large="true" @click="clearWorkspace">
        <template #icon><span class="ci" v-html="coloredIcons.trash" /></template>
      </RibbonBtn>
      <div class="ribbon-col">
        <RibbonBtn icon="workspace" label="Workspace">
          <template #icon><span class="ci-sm" v-html="coloredIcons.workspace" /></template>
        </RibbonBtn>
        <RibbonBtn icon="pkg" label="Packages" @click="handlePackages">
          <template #icon><span class="ci-sm" v-html="coloredIcons.pkg" /></template>
        </RibbonBtn>
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <!-- NAVIGATE group -->
    <RibbonGroup title="Navigate">
      <div class="ribbon-col">
        <RibbonBtn icon="find" label="Find">
          <template #icon><span class="ci-sm" v-html="coloredIcons.find" /></template>
        </RibbonBtn>
        <RibbonBtn icon="findFiles" label="Find Files">
          <template #icon><span class="ci-sm" v-html="coloredIcons.findFiles" /></template>
        </RibbonBtn>
      </div>
      <div class="ribbon-col">
        <RibbonBtn icon="undo" label="Undo">
          <template #icon><span class="ci-sm" v-html="coloredIcons.undo" /></template>
        </RibbonBtn>
        <RibbonBtn icon="redo" label="Redo">
          <template #icon><span class="ci-sm" v-html="coloredIcons.redo" /></template>
        </RibbonBtn>
      </div>
    </RibbonGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { open as openExternal } from '@tauri-apps/plugin-shell';
import { listen } from '@tauri-apps/api/event';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { useAppStore } from '../../store/appStore';
import { useJuliaActions } from '../../composables/useJuliaActions';
import RibbonGroup from './RibbonGroup.vue';
import RibbonBtn from './RibbonBtn.vue';
import RibbonDivider from './RibbonDivider.vue';
import { coloredIcons } from './ribbon-icons-colored';

const appStore = useAppStore();
const { runFile, runCell, saveFile, formatFile, clearWorkspace } = useJuliaActions();

// Revise status (event-driven, same pattern as StatusBar)
const reviseActive = ref(false);
let unlistenRevise: UnlistenFn | null = null;

onMounted(async () => {
  unlistenRevise = await listen<boolean>('julia:revise-status', (event) => {
    reviseActive.value = event.payload;
  });
});

onUnmounted(() => {
  if (unlistenRevise) unlistenRevise();
});

// --- Actions ---
const handleNew = () => {
  window.dispatchEvent(new CustomEvent('ribbon:new-file'));
};

const handleOpen = async () => {
  try {
    const result = await openDialog({ directory: true, multiple: false });
    if (result && !Array.isArray(result)) {
      appStore.setProjectPath(result);
    } else if (Array.isArray(result) && result.length > 0) {
      appStore.setProjectPath(result[0]);
    }
  } catch (err) {
    console.error('HomeTab: Failed to open folder:', err);
  }
};

const handleNewDropdown = () => {
  window.dispatchEvent(new CustomEvent('ribbon:new-dropdown'));
};

const handleGoToFile = () => {
  window.dispatchEvent(new CustomEvent('ribbon:go-to-file'));
};

const handleFindFiles = () => {
  window.dispatchEvent(new CustomEvent('ribbon:find-files'));
};

const handlePackages = () => {
  window.dispatchEvent(new CustomEvent('ribbon:navigate', { detail: 'PackageManagement' }));
};

const handleOpenDyad = async () => {
  await openExternal('https://juliahub.com/products/dyad/');
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
