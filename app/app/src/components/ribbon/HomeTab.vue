<template>
  <div class="ribbon-tab-content">
    <!-- FILE group -->
    <RibbonGroup title="File">
      <RibbonBtn icon="newFile"   label="New Script"      :large="true" @click="handleNew" />
      <div class="ribbon-col">
        <RibbonBtn icon="newDropdown" label="New ▾"     @click="handleNewDropdown" />
        <RibbonBtn icon="open"        label="Open"       @click="handleOpen" />
        <RibbonBtn icon="goToFile"    label="Go to File" @click="handleGoToFile" />
        <RibbonBtn icon="findFiles"   label="Find Files" @click="handleFindFiles" />
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <!-- CODE group -->
    <RibbonGroup title="Code">
      <RibbonBtn icon="section" label="Run Section" :large="true" @click="runCell" />
      <div class="ribbon-col">
        <RibbonBtn icon="format" label="Format Code" @click="formatFile" />
        <RibbonBtn icon="run" label="Run File" @click="runFile" />
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <!-- MODELING group -->
    <RibbonGroup title="Modeling">
      <RibbonBtn icon="dyad" label="Open in Dyad" :large="true" @click="handleOpenDyad" />
    </RibbonGroup>

    <RibbonDivider />

    <!-- VARIABLE group -->
    <RibbonGroup title="Variables">
      <RibbonBtn icon="trash" label="Clear Workspace" :large="true" @click="clearWorkspace" />
      <div class="ribbon-col">
        <RibbonBtn icon="workspace" label="Workspace" />
        <RibbonBtn icon="pkg" label="Packages" @click="handlePackages" />
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <!-- NAVIGATE group -->
    <RibbonGroup title="Navigate">
      <div class="ribbon-col">
        <RibbonBtn icon="find" label="Find" />
        <RibbonBtn icon="find" label="Find Files" />
      </div>
      <div class="ribbon-col">
        <RibbonBtn icon="undo" label="Undo" />
        <RibbonBtn icon="redo" label="Redo" />
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
</style>
