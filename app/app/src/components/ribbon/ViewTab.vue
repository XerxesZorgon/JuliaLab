<template>
  <div class="ribbon-tab-content">
    <!-- PANELS group -->
    <RibbonGroup title="Panels">
      <div class="ribbon-col">
        <RibbonBtn
          icon="open"
          label="File Browser"
          :active="layoutStore.showFilesPanel"
          @click="layoutStore.toggleFilesPanel()"
        />
        <RibbonBtn
          icon="terminal"
          label="Command Window"
          :active="layoutStore.showTerminalPanel"
          @click="layoutStore.toggleTerminalPanel()"
        />
        <RibbonBtn
          icon="workspace"
          label="Workspace"
          :active="layoutStore.showWorkspacePanel"
          @click="layoutStore.toggleWorkspacePanel()"
        />
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <!-- THEME group -->
    <RibbonGroup title="Theme">
      <div class="ribbon-col">
        <RibbonBtn icon="eye" label="Dark (default)" :active="true" />
        <RibbonBtn icon="eye" label="Light" />
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <!-- RIBBON group -->
    <RibbonGroup title="Ribbon">
      <div class="ribbon-col">
        <RibbonBtn icon="collapse" label="Hide Ribbon (F2)" @click="layoutStore.toggleRibbon()" />
        <RibbonBtn
          icon="expand"
          label="Pin Ribbon"
          :active="layoutStore.ribbonPinned"
          @click="layoutStore.ribbonPinned = !layoutStore.ribbonPinned"
        />
      </div>
    </RibbonGroup>
  </div>
</template>

<script setup lang="ts">
import { useLayoutStore } from '../../store/layoutStore';
import RibbonGroup from './RibbonGroup.vue';
import RibbonBtn from './RibbonBtn.vue';
import RibbonDivider from './RibbonDivider.vue';

const layoutStore = useLayoutStore();
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
