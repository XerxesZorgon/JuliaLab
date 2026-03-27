<template>
  <div class="ribbon-tab-content">
    <!-- PANELS group -->
    <RibbonGroup title="Panels">
      <div class="ribbon-col">
        <RibbonBtn icon="open" label="File Browser"
          :active="layoutStore.showFilesPanel"
          @click="layoutStore.toggleFilesPanel()">
          <template #icon><span class="ci-sm" v-html="coloredIcons.fileBrowser" /></template>
        </RibbonBtn>
        <RibbonBtn icon="terminal" label="Command Window"
          :active="layoutStore.showTerminalPanel"
          @click="layoutStore.toggleTerminalPanel()">
          <template #icon><span class="ci-sm" v-html="coloredIcons.commandWindow" /></template>
        </RibbonBtn>
        <RibbonBtn icon="workspace" label="Workspace"
          :active="layoutStore.showWorkspacePanel"
          @click="layoutStore.toggleWorkspacePanel()">
          <template #icon><span class="ci-sm" v-html="coloredIcons.workspace" /></template>
        </RibbonBtn>
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <!-- LAYOUT group -->
    <RibbonGroup title="Layout">
      <div class="ribbon-col layout-col">
        <LayoutPicker />
        <n-select
          :value="null"
          :options="allLayoutOptions"
          size="tiny"
          class="layout-select"
          placeholder="Load layout…"
          :show-checkmark="false"
          :consistent-menu-width="false"
          @update:value="handleLoadLayout"
        />
        <div class="layout-btns">
          <n-button size="tiny" class="layout-btn" @click="showSaveDialog = true">
            Save Layout…
          </n-button>
          <n-button size="tiny" class="layout-btn" @click="showManager = true">
            Manage…
          </n-button>
        </div>
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <!-- THEME group -->
    <RibbonGroup title="Theme">
      <div class="ribbon-col">
        <RibbonBtn icon="eye" label="Light (default)"
          :active="themeStore.currentTheme === 'light'"
          @click="themeStore.setTheme('light')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.lightTheme" /></template>
        </RibbonBtn>
        <RibbonBtn icon="eye" label="Dark"
          :active="themeStore.currentTheme === 'dark'"
          @click="themeStore.setTheme('dark')">
          <template #icon><span class="ci-sm" v-html="coloredIcons.darkTheme" /></template>
        </RibbonBtn>
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <!-- RIBBON group -->
    <RibbonGroup title="Ribbon">
      <div class="ribbon-col">
        <RibbonBtn icon="collapse" label="Hide Ribbon (F2)" @click="layoutStore.toggleRibbon()">
          <template #icon><span class="ci-sm" v-html="coloredIcons.hideRibbon" /></template>
        </RibbonBtn>
        <RibbonBtn icon="expand" label="Pin Ribbon"
          :active="layoutStore.ribbonPinned"
          @click="layoutStore.ribbonPinned = !layoutStore.ribbonPinned">
          <template #icon><span class="ci-sm" v-html="coloredIcons.pinRibbon" /></template>
        </RibbonBtn>
      </div>
    </RibbonGroup>

    <RibbonDivider />

    <!-- HELP group -->
    <RibbonGroup title="Help">
      <div class="ribbon-col">
        <RibbonBtn icon="find" label="MATLAB→Julia"
          :active="layoutStore.showCheatSheet"
          @click="layoutStore.toggleCheatSheet()">
          <template #icon><span class="ci-sm" v-html="coloredIcons.cheatSheet" /></template>
        </RibbonBtn>
      </div>
      <div class="ribbon-col">
        <RibbonBtn icon="undo" label="Prev Tip" @click="prevTip()" />
        <RibbonBtn icon="redo" label="Next Tip" @click="nextTip()" />
      </div>
    </RibbonGroup>
  </div>

  <!-- Save Layout dialog -->
  <n-modal
    v-model:show="showSaveDialog"
    title="Save Layout"
    preset="dialog"
    style="width: 340px"
    positive-text="Save"
    negative-text="Cancel"
    :positive-button-props="{ disabled: !saveName.trim() }"
    @positive-click="handleSaveLayout"
    @negative-click="showSaveDialog = false"
  >
    <n-input
      v-model:value="saveName"
      placeholder="Enter a name for this layout…"
      size="small"
      style="margin-top: 8px"
      @keydown.enter="handleSaveLayout"
    />
  </n-modal>

  <!-- Full layout manager -->
  <LayoutManagerDialog v-model:show="showManager" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NSelect, NButton, NModal, NInput } from 'naive-ui';
import { useLayoutStore, BUILTIN_LAYOUTS, type SavedLayout } from '../../store/layoutStore';
import { useThemeStore } from '../../store/themeStore';
import { useTips } from '../../features/tips/useTips';
import RibbonGroup from './RibbonGroup.vue';
import RibbonBtn from './RibbonBtn.vue';
import RibbonDivider from './RibbonDivider.vue';
import { coloredIcons } from './ribbon-icons-colored';
import LayoutManagerDialog from '../../features/layouts/LayoutManagerDialog.vue';
import LayoutPicker from '../layouts/LayoutPicker.vue';

const layoutStore = useLayoutStore();
const themeStore = useThemeStore();
const { nextTip, prevTip } = useTips();

const showSaveDialog = ref(false);
const showManager = ref(false);
const saveName = ref('');

const allLayoutOptions = computed(() => {
  const builtins = BUILTIN_LAYOUTS.map(l => ({ label: l.name, value: l.id, layout: l }));
  const saved = layoutStore.userLayouts.map(l => ({ label: `★ ${l.name}`, value: l.id, layout: l }));
  if (saved.length === 0) return builtins;
  return [
    { type: 'group', label: 'My Layouts', key: 'user', children: saved },
    { type: 'group', label: 'Built-in', key: 'builtin', children: builtins },
  ];
});

function handleLoadLayout(id: string) {
  const all: SavedLayout[] = [...BUILTIN_LAYOUTS, ...layoutStore.userLayouts];
  const layout = all.find(l => l.id === id);
  if (layout) layoutStore.applyLayout(layout);
}

function handleSaveLayout() {
  if (!saveName.value.trim()) return;
  layoutStore.saveCurrentLayout(saveName.value);
  saveName.value = '';
  showSaveDialog.value = false;
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

/* Layout group */
.layout-col {
  width: 148px;
  justify-content: center;
  gap: 4px;
  padding: 4px 0;
}

.layout-select {
  width: 100%;
  font-size: 11px;
}

.layout-btns {
  display: flex;
  gap: 4px;
}

.layout-btn {
  flex: 1;
  font-size: 10px;
}

.ci-sm {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  line-height: 0;
}
.ci-sm :deep(svg) { width: 16px; height: 16px; }
</style>
