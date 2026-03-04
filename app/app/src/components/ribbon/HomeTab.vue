<template>
  <div class="ribbon-tab-content">
    <!-- FILE group -->
    <RibbonGroup title="File">
      <RibbonBtn icon="newFile" label="New" :large="true" @click="handleNew" />
      <RibbonBtn icon="open" label="Open" :large="true" @click="handleOpen" />
      <RibbonBtn icon="save" label="Save" :large="true" @click="saveFile" />
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

    <RibbonDivider />

    <!-- CODE group -->
    <RibbonGroup title="Code">
      <div class="ribbon-col">
        <RibbonBtn icon="format" label="Format Code" @click="formatFile" />
        <RibbonBtn icon="section" label="Run Section" />
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <!-- RUN group -->
    <RibbonGroup title="Run">
      <RibbonBtn
        icon="run"
        label="Run"
        :large="true"
        :active="true"
        :disabled="!appStore.projectPath"
        @click="runFile"
      />
      <RibbonBtn icon="stop" label="Stop" :large="true" :disabled="true" />
    </RibbonGroup>

    <RibbonDivider />

    <!-- ENVIRONMENT group -->
    <RibbonGroup title="Environment">
      <div class="ribbon-col">
        <RibbonBtn icon="pkg" label="Packages" @click="handlePackages" />
        <RibbonBtn icon="workspace" label="Workspace" />
      </div>
      <RibbonBtn icon="revise" label="Revise" :large="true" :active="reviseActive" />
    </RibbonGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { useAppStore } from '../../store/appStore';
import { useJuliaActions } from '../../composables/useJuliaActions';
import RibbonGroup from './RibbonGroup.vue';
import RibbonBtn from './RibbonBtn.vue';
import RibbonDivider from './RibbonDivider.vue';

const appStore = useAppStore();
const { runFile, saveFile, formatFile } = useJuliaActions();

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

const handlePackages = () => {
  window.dispatchEvent(new CustomEvent('ribbon:navigate', { detail: 'PackageManagement' }));
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
