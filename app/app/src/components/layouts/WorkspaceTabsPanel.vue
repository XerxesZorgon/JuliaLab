<template>
  <div class="workspace-tabs-panel">
    <n-tabs type="card" size="small" animated class="workspace-tabs" v-model:value="layoutStore.activeRightTab">
      <n-tab-pane name="workspace" tab="Workspace">
        <div class="tab-body"><VariablesPanel /></div>
      </n-tab-pane>
      <n-tab-pane name="plots" tab="Plots">
        <div class="tab-body"><PlotPanel /></div>
      </n-tab-pane>
      <n-tab-pane name="methods" tab="Methods">
        <div class="tab-body"><MethodsBrowser /></div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup>
import { NTabs, NTabPane } from 'naive-ui'
import { useLayoutStore } from '../../store/layoutStore'
import VariablesPanel from '../HomeView/VariablesPanel.vue'
import PlotPanel from '../HomeView/PlotPanel.vue'
import MethodsBrowser from '../../features/methods/MethodsBrowser.vue'

const layoutStore = useLayoutStore()
</script>

<style scoped>
.workspace-tabs-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.workspace-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
:deep(.workspace-tabs .n-tabs-pane-wrapper) {
  flex: 1;
  overflow: hidden;
}
:deep(.workspace-tabs .n-tab-pane) {
  height: 100%;
  padding: 0 !important;
}
.tab-body {
  height: 100%;
  overflow: auto;
}
</style>
