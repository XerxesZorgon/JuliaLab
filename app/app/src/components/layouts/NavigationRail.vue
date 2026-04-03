<template>
  <n-space
    vertical
    align="center"
    justify="start"
    style="padding-top: 10px; height: 100%; background-color: var(--jl-nav-rail-bg)"
  >
    <n-tooltip placement="right" trigger="hover">
      <template #trigger>
        <n-button
          quaternary
          :type="selectedView === 'explorer' ? 'primary' : 'default'"
          @click="selectView('explorer')"
          style="width: 48px; height: 48px"
        >
          <n-icon size="24">
            <FolderOpenOutline />
          </n-icon>
        </n-button>
      </template>
      Explorer
    </n-tooltip>

    <n-tooltip placement="right" trigger="hover">
      <template #trigger>
        <n-button
          quaternary
          :type="selectedView === 'packages' ? 'primary' : 'default'"
          @click="selectView('packages')"
          style="width: 48px; height: 48px"
        >
          <n-icon size="24">
            <CubeOutline />
          </n-icon>
        </n-button>
      </template>
      Package Management
    </n-tooltip>

    <n-tooltip placement="right" trigger="hover">
      <template #trigger>
        <n-button
          quaternary
          :type="selectedView === 'source-control' ? 'primary' : 'default'"
          @click="selectView('source-control')"
          style="width: 48px; height: 48px"
        >
          <n-icon size="24">
            <GitBranchOutline />
          </n-icon>
        </n-button>
      </template>
      Source Control
    </n-tooltip>

    <n-tooltip placement="right" trigger="hover">
      <template #trigger>
        <n-button
          quaternary
          :type="selectedView === 'settings' ? 'primary' : 'default'"
          @click="selectView('settings')"
          style="width: 48px; height: 48px"
        >
          <n-icon size="24">
            <SettingsOutline />
          </n-icon>
        </n-button>
      </template>
      Settings
    </n-tooltip>

    <n-tooltip placement="right" trigger="hover">
      <template #trigger>
        <n-button
          quaternary
          :type="selectedView === 'about' ? 'primary' : 'default'"
          @click="selectView('about')"
          style="width: 48px; height: 48px"
        >
          <n-icon size="24">
            <InformationCircleOutline />
          </n-icon>
        </n-button>
      </template>
      Help & About
    </n-tooltip>

    <!-- Add more icons later -->
    <div style="margin-top: auto; padding-bottom: 10px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
      <n-tooltip placement="right" trigger="hover">
        <template #trigger>
          <n-button
            quaternary
            :type="layoutStore.showTerminalPanel ? 'primary' : 'default'"
            @click="toggleBottom()"
            style="width: 48px; height: 48px"
          >
            <n-icon size="24">
              <TerminalOutline />
            </n-icon>
          </n-button>
        </template>
        Toggle Command Window
      </n-tooltip>

      <n-tooltip placement="right" trigger="hover">
        <template #trigger>
          <n-button
            quaternary
            :type="layoutStore.showWorkspacePanel ? 'primary' : 'default'"
            @click="toggleRight()"
            style="width: 48px; height: 48px"
          >
            <n-icon size="24">
              <FileTrayFullOutline />
            </n-icon>
          </n-button>
        </template>
        Toggle Workspace
      </n-tooltip>

      <n-tooltip placement="right" trigger="hover">
        <template #trigger>
          <n-button
            quaternary
            :type="layoutStore.showAiPanel ? 'primary' : 'default'"
            @click="layoutStore.toggleAiPanel()"
            style="width: 48px; height: 48px"
          >
            <n-icon size="24">
              <SparklesOutline />
            </n-icon>
          </n-button>
        </template>
        Toggle AI Assistant
      </n-tooltip>
    </div>
  </n-space>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { NButton, NSpace, NTooltip, NIcon } from 'naive-ui';
import {
  FolderOpenOutline,
  InformationCircleOutline,
  CubeOutline,
  SettingsOutline,
  TerminalOutline,
  FileTrayFullOutline,
  SparklesOutline,
  GitBranchOutline,
} from '@vicons/ionicons5';
import { useLayoutStore } from '../../store/layoutStore';
import { useAppStore } from '../../store/appStore';
import { debug, info, warn } from '../../utils/logger';
import { primaryColor, primaryColorHover } from '../../theme';

const router = useRouter();
const route = useRoute();
const appStore = useAppStore();
const layoutStore = useLayoutStore();
const emit = defineEmits(['navigate']);

// Compute selected view based on current route
const selectedView = computed(() => {
  switch (route.name) {
    case 'Home':
      return 'explorer';
    case 'PackageManagement':
      return 'packages';
    case 'SourceControl':
      return 'source-control';
    case 'Settings':
      return 'settings';
    case 'About':
      return 'about';
    default:
      return 'explorer';
  }
});

const selectView = (view) => {
  debug(`NavigationRail: Selecting view: ${view}`);
  console.log(`NavigationRail: Selecting view: ${view}`);
  emit('navigate', view);
};

function toggleBottom() {
  window.dispatchEvent(new CustomEvent('dock:toggle-bottom'));
}

function toggleRight() {
  window.dispatchEvent(new CustomEvent('dock:toggle-right'));
}

// Expose the selectView method to parent components
defineExpose({
  selectView,
});
</script>

<style scoped>
/* Scoped styles if needed */
.n-button {
  margin-bottom: 8px; /* Spacing between icons */
}
.n-button .n-icon {
  color: v-bind(primaryColor) !important; /* Use theme color */
}

.n-button:hover .n-icon {
  color: v-bind(primaryColorHover) !important; /* Use theme hover color */
}
</style>
