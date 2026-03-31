<template>
  <div class="julialab-root">
    <!-- Left Navigation Rail -->
    <div class="nav-rail">
      <NavigationRail @navigate="handleNavigate" />
    </div>
    
    <!-- Main content area -->
    <div class="main-content">
    <!-- Ribbon Bar -->
    <RibbonBar @tab-change="handleRibbonTabChange" />

    <!-- Main 4-panel area -->
    <div class="panels-area" v-if="route.name === 'Home' && activeRibbonTab !== 'APPS'">
      <!-- DOCK LAYOUT (GoldenLayout) — replaces splitpanes -->
      <DockLayout ref="dockLayoutRef" />
      <!-- OLD SPLITPANES — kept below for reference, not mounted -->
      <div v-if="false" style="display:none">
      <Splitpanes class="jl-theme" :horizontal="false" @resized="onOuterResized">
        <!-- LEFT PANE: File Explorer (only when filesZone === 'left') -->
        <Pane v-if="layoutStore.showFilesPanel && layoutStore.filesZone === 'left'" :size="layoutStore.paneSizes.left" :min-size="leftMinPct" :max-size="leftMaxPct">
          <div class="panel panel--left">
            <PanelHeader zone="left" :title="panelTitle('left')">
              <template #actions>
                <NButton quaternary circle size="tiny" @click="layoutStore.toggleFilesPanel()">
                  <template #icon><NIcon><ChevronBackOutline /></NIcon></template>
                </NButton>
              </template>
            </PanelHeader>
            <div class="panel-body">
              <component :is="panelComponents[layoutStore.panelSlots['left']]" />
            </div>
          </div>
        </Pane>

        <!-- CENTER: Editor (top) + Terminal (bottom) -->
        <Pane :size="layoutStore.paneSizes.center" min-size="20">
          <Splitpanes class="jl-theme" :horizontal="true" @resized="onCenterResized">
            <!-- CENTER-TOP: Editor -->
            <Pane :size="layoutStore.paneSizes.editor" min-size="20">
              <div class="panel panel--editor">
                <PanelHeader zone="center" :title="panelTitle('center')" />
                <div class="panel-body panel-body--editor">
                  <component :is="panelComponents[layoutStore.panelSlots['center']]" />
                </div>
              </div>
            </Pane>
            
            <!-- CENTER-BOTTOM: Terminal/REPL -->
            <Pane v-if="layoutStore.showTerminalPanel" :size="layoutStore.paneSizes.terminal" :min-size="termBottomMinPct" :max-size="termBottomMaxPct">
              <div class="panel panel--terminal">
                <PanelHeader zone="bottom" :title="panelTitle('bottom')">
                  <template #actions>
                    <NButton quaternary circle size="tiny" @click="handleClearTerminal" title="Clear terminal">
                      <template #icon><NIcon><TrashOutline /></NIcon></template>
                    </NButton>
                    <NButton quaternary circle size="tiny" @click="handleRestartJulia" title="Restart Julia">
                      <template #icon><NIcon><RefreshOutline /></NIcon></template>
                    </NButton>
                    <NButton quaternary circle size="tiny" @click="layoutStore.toggleTerminalPanel()">
                      <template #icon><NIcon><RemoveOutline /></NIcon></template>
                    </NButton>
                  </template>
                </PanelHeader>
                <div class="terminal-body">
                  <component :is="panelComponents[layoutStore.panelSlots['bottom']]" />
                </div>
              </div>
            </Pane>

            <!-- WORKSPACE AT BOTTOM (when dragged from right to bottom) -->
            <Pane
              v-if="layoutStore.showWorkspacePanel && layoutStore.workspaceZone === 'bottom'"
              :size="layoutStore.paneSizes.workspaceBottom"
              min-size="15"
            >
              <div class="panel panel--right">
                <div
                  class="panel-drag-handle"
                  @mousedown.prevent="onPanelMouseDown('workspace', $event)"
                  title="Drag to reposition"
                >
                  <span class="drag-grip">⠿</span>
                </div>
                <n-tabs type="card" size="small" animated class="right-tabs" v-model:value="layoutStore.activeRightTab">
                  <n-tab-pane name="workspace" tab="Workspace">
                    <div class="panel-body"><VariablesPanel /></div>
                  </n-tab-pane>
                  <n-tab-pane name="plots" tab="Plots">
                    <div class="panel-body"><PlotPanel /></div>
                  </n-tab-pane>
                  <n-tab-pane name="methods" tab="Methods">
                    <div class="panel-body"><MethodsBrowser /></div>
                  </n-tab-pane>
                </n-tabs>
                <div class="panel-header-actions absolute-header-actions">
                  <NButton quaternary circle size="tiny" @click="layoutStore.toggleWorkspacePanel()">
                    <template #icon><NIcon><ChevronForwardOutline /></NIcon></template>
                  </NButton>
                </div>
              </div>
            </Pane>
            <!-- FILES AT BOTTOM (when dragged from left to bottom) -->
            <Pane
              v-if="layoutStore.showFilesPanel && layoutStore.filesZone === 'bottom'"
              :size="layoutStore.paneSizes.filesBottom"
              min-size="15"
            >
              <div class="panel panel--left">
                <div class="panel-header">
                  <span class="panel-drag-label" @mousedown.prevent="onPanelMouseDown('files', $event)" title="Drag to reposition">
                    <span class="drag-grip">⠿</span> Files</span>
                  <div class="panel-header-actions">
                    <NButton quaternary circle size="tiny" @click="layoutStore.toggleFilesPanel()">
                      <template #icon><NIcon><ChevronBackOutline /></NIcon></template>
                    </NButton>
                  </div>
                </div>
                <div class="panel-body">
                  <LeftPanelAccordion
                    @open-file="handleOpenFile"
                    @open-package-settings="handleOpenPackageSettings"
                    @project-root-changed="handleProjectRootChanged"
                  />
                </div>
              </div>
            </Pane>
          </Splitpanes>
        </Pane>

        <!-- RIGHT PANE: Workspace & Plots (default position) -->
        <Pane v-if="layoutStore.showWorkspacePanel && layoutStore.workspaceZone === 'right'" :size="layoutStore.paneSizes.right" :min-size="rightMinPct" :max-size="rightMaxPct">
          <div class="panel panel--right">
            <PanelHeader zone="right" :title="panelTitle('right')">
              <template #actions>
                <NButton quaternary circle size="tiny" @click="layoutStore.toggleWorkspacePanel()">
                  <template #icon><NIcon><ChevronForwardOutline /></NIcon></template>
                </NButton>
              </template>
            </PanelHeader>
            <component :is="panelComponents[layoutStore.panelSlots['right']]" class="panel-body" />
          </div>
        </Pane>

        <!-- FAR RIGHT PANE: AI Assistant -->
        <Pane v-if="layoutStore.showAiPanel" :size="layoutStore.paneSizes.ai" :min-size="aiMinPct" :max-size="aiMaxPct">
          <AiSidebar />
        </Pane>
      </Splitpanes>
      </div><!-- end display:none -->
    </div>

    <!-- Non-Home routes (About, Settings, PackageManagement) -->
        <!-- Apps overlay — shown when APPS ribbon tab is active -->
    <div
      v-if="route.name === 'Home' && activeRibbonTab === 'APPS'"
      class="fullscreen-route"
      style="flex:1; min-height:0; overflow:hidden;"
    >
      <AppsGallery @close="handleRibbonTabChange('HOME')" />
    </div>

    <div class="fullscreen-route" v-else-if="route.name !== 'Home'">
      <router-view />
    </div>

    <!-- Welcome screen when no project is selected on Home route -->
    <div
      v-if="route.name === 'Home' && !appStore.projectPath && appStore.initialProjectLoadAttempted"
      class="welcome-overlay"
    >
      <div class="welcome-content">
        <img src="/julialab.png" alt="JuliaLab" class="welcome-splash" draggable="false" />
        <div class="welcome-actions">
          <NButton type="primary" size="large" @click="handleOpenFolder" class="welcome-btn">
            <template #icon><NIcon><FolderOpenOutline /></NIcon></template>
            Open Julia Project
          </NButton>
          <NButton size="large" @click="handleCreateProject" class="welcome-btn">
            <template #icon><NIcon><AddOutline /></NIcon></template>
            New Project
          </NButton>
        </div>
      </div>
    </div>

    <!-- Project change status chip -->
    <div
      v-if="projectChangeStatus && (projectChangeStatus.message || projectChangeStatus.progress_percentage !== undefined)"
      class="status-chip"
    >
      <span>{{ projectChangeStatus.message || 'Working…' }}</span>
      <span v-if="projectChangeStatus.progress_percentage !== undefined">
        &nbsp;({{ projectChangeStatus.progress_percentage }}%)
      </span>
    </div>

      <!-- Panel drag-and-drop overlay — appears while dragging a panel header -->
      <transition name="fade">
        <div v-if="isDraggingPanel" class="panel-drag-overlay">
          <div
            v-if="canDropLeft"
            class="drop-zone drop-zone--left"
            :class="{ 'drop-zone--active': activeDragZone === 'left' }"
          >
            <div class="drop-zone-inner">
              <NIcon size="28"><ChevronBackOutline /></NIcon>
              <span>Move Left</span>
            </div>
          </div>
          <div
            v-if="canDropRight"
            class="drop-zone drop-zone--right"
            :class="{ 'drop-zone--active': activeDragZone === 'right' }"
          >
            <div class="drop-zone-inner">
              <NIcon size="28"><ChevronForwardOutline /></NIcon>
              <span>Move Right</span>
            </div>
          </div>
          <div
            v-if="canDropBottom"
            class="drop-zone drop-zone--bottom"
            :class="{ 'drop-zone--active': activeDragZone === 'bottom' }"
          >
            <div class="drop-zone-inner">
              <NIcon size="28"><ChevronDownOutline /></NIcon>
              <span>Move to Bottom</span>
            </div>
          </div>
        </div>
      </transition>

      <!-- MATLAB→Julia Cheat Sheet slide-in panel -->
      <transition name="slide-cheatsheet">
        <div v-if="layoutStore.showCheatSheet" class="cheatsheet-overlay">
          <div class="cheatsheet-overlay-header">
            <span class="cheatsheet-overlay-title">MATLAB → Julia</span>
            <NButton quaternary circle size="tiny" @click="layoutStore.toggleCheatSheet()" id="cheatsheet-close-btn">
              <template #icon><NIcon><CloseOutline /></NIcon></template>
            </NButton>
          </div>
          <CheatSheetPanel />
        </div>
      </transition>

      <!-- Status Bar (bottom of window) -->
      <StatusBar />

      <!-- Startup tip toast -->
      <TipToast />
    </div>
    <AiAssistantPanel
      :show="layoutStore.showAiPanel"
      @close="layoutStore.showAiPanel = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, h, provide } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AppsGallery from '../AppsView/AppsGallery.vue';
import { useMessage, useNotification, NIcon, NSpace, NCard, NButton, NTabs, NTabPane, NDivider } from 'naive-ui';
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { debug, error } from '../../utils/logger';
import { useProjectChangeStatus } from '../../features/orchestrator/useProjectChangeStatus';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import {
  FolderOpenOutline,
  AddOutline,
  ChevronDownOutline,
  ChevronUpOutline,
  ChevronForwardOutline,
  ChevronBackOutline,
  CloseOutline,
  RemoveOutline,
  TrashOutline,
  RefreshOutline,
} from '@vicons/ionicons5';

// --- Panel drag-and-drop (mouse-event based, reliable in Tauri WebView) ---
const isDraggingPanel = ref(false);
const draggingPanel = ref(null);
const activeDragZone = ref(null);

const canDropLeft = computed(() =>
  draggingPanel.value === 'files' && layoutStore.filesZone !== 'left'
);
const canDropRight = computed(() =>
  draggingPanel.value === 'workspace' && layoutStore.workspaceZone !== 'right'
);
const canDropBottom = computed(() =>
  (draggingPanel.value === 'workspace' && layoutStore.workspaceZone !== 'bottom') ||
  (draggingPanel.value === 'files' && layoutStore.filesZone !== 'bottom')
);

function onDragMouseMove(event) {
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  if (draggingPanel.value === 'workspace') {
    if (event.clientX > winW * 0.74) {
      activeDragZone.value = 'right';
    } else if (event.clientY > winH * 0.72) {
      activeDragZone.value = 'bottom';
    } else {
      activeDragZone.value = null;
    }
  } else if (draggingPanel.value === 'files') {
    if (event.clientX < winW * 0.26) {
      activeDragZone.value = 'left';
    } else if (event.clientY > winH * 0.72) {
      activeDragZone.value = 'bottom';
    } else {
      activeDragZone.value = null;
    }
  }
}

function onDragMouseUp() {
  if (activeDragZone.value) {
    onPanelDrop(activeDragZone.value);
  } else {
    isDraggingPanel.value = false;
    draggingPanel.value = null;
    activeDragZone.value = null;
  }
  window.removeEventListener('mousemove', onDragMouseMove);
  window.removeEventListener('mouseup', onDragMouseUp);
}

function onPanelMouseDown(panelId, event) {
  if (event.button !== 0) return;
  isDraggingPanel.value = true;
  draggingPanel.value = panelId;
  window.addEventListener('mousemove', onDragMouseMove);
  window.addEventListener('mouseup', onDragMouseUp);
}

function onPanelDrop(zone) {
  if (draggingPanel.value === 'workspace') {
    layoutStore.workspaceZone = zone;
    if (zone === 'bottom' && layoutStore.paneSizes.workspaceBottom < 15) {
      layoutStore.paneSizes.workspaceBottom = 30;
    }
  } else if (draggingPanel.value === 'files') {
    layoutStore.filesZone = zone;
    if (zone === 'bottom' && layoutStore.paneSizes.filesBottom < 15) {
      layoutStore.paneSizes.filesBottom = 25;
    }
  }
  isDraggingPanel.value = false;
  draggingPanel.value = null;
  activeDragZone.value = null;
}

import NavigationRail from './NavigationRail.vue';
import LeftPanelAccordion from './LeftPanelAccordion.vue';
import StatusBar from './StatusBar.vue';
import EditorView from '../HomeView/EditorView.vue';
import BottomPanel from '../HomeView/BottomPanel.vue';
import VariablesPanel from '../HomeView/VariablesPanel.vue';
import PlotPanel from '../HomeView/PlotPanel.vue';
import MethodsBrowser from '../../features/methods/MethodsBrowser.vue';
import AiSidebar from '../../features/ai/AiSidebar.vue';
import CheatSheetPanel from '../../features/cheatsheet/CheatSheetPanel.vue';
import TipToast from '../../features/tips/TipToast.vue';
import RibbonBar from './RibbonBar.vue';
import PanelHeader from './PanelHeader.vue';
import FileTreePanel from './FileTreePanel.vue';
import WorkspaceTabsPanel from './WorkspaceTabsPanel.vue';
import DockLayout from './DockLayout.vue';
import AiAssistantPanel from './AiAssistantPanel.vue';
import { useAppStore } from '../../store/appStore';
import { useLayoutStore } from '../../store/layoutStore';
import { usePlotStore } from '../../store/plotStore';
import { storeToRefs } from 'pinia';
import { useTerminalStore } from '../../store/terminalStore';

const dockLayoutRef = ref(null);

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function pct(n, fallback) {
  const value = Number.isFinite(n) ? n : fallback;
  return `${Math.round(clamp(value, 5, 90))}%`;
}

function buildDockLayoutConfigFromPreset(preset) {
  const showFiles = !!preset?.visibility?.files;
  const showWorkspace = !!preset?.visibility?.workspace;
  const showTerminal = !!preset?.visibility?.terminal;

  const left = showFiles ? clamp(preset?.sizes?.left ?? 18, 10, 40) : 0;
  const right = showWorkspace ? clamp(preset?.sizes?.right ?? 22, 10, 45) : 0;
  const center = clamp(100 - left - right, 15, 80);

  const editorPct = showTerminal
    ? clamp(100 - (preset?.sizes?.terminal ?? 35), 20, 85)
    : 100;
  const terminalPct = showTerminal
    ? clamp(preset?.sizes?.terminal ?? 35, 15, 80)
    : 0;

  const content = [];

  if (showFiles) {
    content.push({
      type: 'column',
      size: pct(left, 18),
      content: [{ type: 'component', componentType: 'FileTree', title: 'Files', isClosable: true, reorderEnabled: true }],
    });
  }

  const centerColumn = {
    type: 'column',
    size: pct(center, 60),
    content: [
      { type: 'component', componentType: 'Editor', title: 'Editor', size: pct(editorPct, 65), isClosable: true, reorderEnabled: true },
    ],
  };
  if (showTerminal) {
    centerColumn.content.push({
      type: 'component',
      componentType: 'CommandWindow',
      title: 'Command Window',
      size: pct(terminalPct, 35),
      isClosable: true,
      reorderEnabled: true,
    });
  }
  content.push(centerColumn);

  if (showWorkspace) {
    content.push({
      type: 'column',
      size: pct(right, 22),
      content: [{ type: 'component', componentType: 'Workspace', title: 'Workspace', isClosable: true, reorderEnabled: true }],
    });
  }

  return {
    settings: {
      reorderEnabled: true,
      constrainDragToContainer: true,
    },
    root: {
      type: 'row',
      content,
    },
  };
}

function applyDockLayoutPreset(preset) {
  const cfg = buildDockLayoutConfigFromPreset(preset);
  dockLayoutRef.value?.loadLayout?.(cfg);
}

provide('applyDockLayoutPreset', applyDockLayoutPreset);

const router = useRouter();
const route = useRoute();
const message = useMessage();
const notification = useNotification();
const appStore = useAppStore();
const layoutStore = useLayoutStore();
const terminalStore = useTerminalStore();
const { activeTerminalId } = storeToRefs(terminalStore);
const { status: projectChangeStatus } = useProjectChangeStatus();
const plotStore = usePlotStore();
const activeRibbonTab = ref('HOME');

const handleRibbonTabChange = (tab) => {
  activeRibbonTab.value = tab;
};

// Panel slot component map — drives <component :is> in each zone
const panelComponents = {
  FileTree:      FileTreePanel,
  Editor:        EditorView,
  Workspace:     WorkspaceTabsPanel,
  CommandWindow: BottomPanel,
};

const panelTitles = {
  FileTree:      'Files',
  Editor:        'Editor',
  Workspace:     'Workspace',
  CommandWindow: 'Command Window',
};

function panelTitle(zone) {
  return panelTitles[layoutStore.panelSlots[zone]] ?? zone;
}

// Watch for plots to switch tab
watch(() => plotStore.plotCount, (newCount, oldCount) => {
  if (newCount > oldCount) {
    layoutStore.activeRightTab = 'plots';
  }
});

// Watch for interactive plot specifically
watch(() => plotStore.isInteractive, (isInteractive) => {
  if (isInteractive) {
    layoutStore.activeRightTab = 'plots';
  }
});

// --- Pane size min/max constraints (percentages) ---
const leftMinPct = 10;  // ~150px
const leftMaxPct = 33;  // ~400px
const rightMinPct = 13; // ~200px
const rightMaxPct = 40; // ~500px
const aiMinPct = 15;
const aiMaxPct = 40;
const termBottomMinPct = 12; // ~120px of center height
const termBottomMaxPct = 65; // ~500px of center height

// Splitpane resize handlers — write back to layoutStore so sizes persist and layouts can be saved
const onOuterResized = (panes) => {
  if (panes.length === 3 && layoutStore.showFilesPanel && layoutStore.showWorkspacePanel && !layoutStore.showAiPanel) {
    layoutStore.paneSizes.left = panes[0].size;
    layoutStore.paneSizes.center = panes[1].size;
    layoutStore.paneSizes.right = panes[2].size;
  } else if (panes.length === 4 && layoutStore.showFilesPanel && layoutStore.showWorkspacePanel && layoutStore.showAiPanel) {
    layoutStore.paneSizes.left = panes[0].size;
    layoutStore.paneSizes.center = panes[1].size;
    layoutStore.paneSizes.right = panes[2].size;
    layoutStore.paneSizes.ai = panes[3].size;
  } else if (panes.length === 2) {
    // Only center + one side panel visible
    if (layoutStore.showFilesPanel && !layoutStore.showWorkspacePanel) {
      layoutStore.paneSizes.left = panes[0].size;
      layoutStore.paneSizes.center = panes[1].size;
    } else if (!layoutStore.showFilesPanel && layoutStore.showWorkspacePanel) {
      layoutStore.paneSizes.center = panes[0].size;
      layoutStore.paneSizes.right = panes[1].size;
    }
  }
};

const onCenterResized = (panes) => {
  if (panes.length === 2) {
    layoutStore.paneSizes.editor = panes[0].size;
    layoutStore.paneSizes.terminal = panes[1].size;
  } else if (panes.length === 3) {
    layoutStore.paneSizes.editor = panes[0].size;
    layoutStore.paneSizes.terminal = panes[1].size;
    // Could be workspace-at-bottom or files-at-bottom
    if (layoutStore.workspaceZone === 'bottom' && layoutStore.showWorkspacePanel) {
      layoutStore.paneSizes.workspaceBottom = panes[2].size;
    } else {
      layoutStore.paneSizes.filesBottom = panes[2].size;
    }
  } else if (panes.length === 4) {
    // Both workspace and files at bottom
    layoutStore.paneSizes.editor = panes[0].size;
    layoutStore.paneSizes.terminal = panes[1].size;
    layoutStore.paneSizes.workspaceBottom = panes[2].size;
    layoutStore.paneSizes.filesBottom = panes[3].size;
  }
};

// --- Project/file management (preserved from original) ---
const handleOpenFolder = async () => {
  try {
    const result = await openDialog({ directory: true, multiple: false });
    if (result && !Array.isArray(result)) {
      appStore.setProjectPath(result);
    } else if (Array.isArray(result) && result.length > 0) {
      appStore.setProjectPath(result[0]);
    }
  } catch (err) {
    error('MainLayout: Failed to open folder:', err);
    message.error('Failed to open folder');
  }
};

const handleCreateProject = () => {
  router.push({ name: 'Home' });
  message.info('Use the "+" button in the file explorer to create a new Julia project');
};

const handleOpenFile = (filePath) => {
  appStore.setFileToOpen(filePath);
  if (route.name !== 'Home') {
    router.push({ name: 'Home' });
  }
};

const handleProjectRootChanged = async (newRoot) => {
  appStore.setProjectPath(newRoot);
  if (activeTerminalId.value && newRoot) {
    try {
      if (newRoot !== appStore.projectPath) {
        await invoke('close_terminal_session', { id: activeTerminalId.value });
        const newTerminalId = await invoke('init_terminal_session', { initialDirectory: newRoot });
        terminalStore.setActiveTerminalId(newTerminalId);
      }
    } catch (err) {
      error('Failed to initialize new terminal:', err);
      message.error(`Failed to initialize new terminal: ${err}`);
    }
  }
  appStore.setFileToOpen(null);
  router.push({ name: 'Home' });
};

const handleOpenPackageSettings = (projectPath) => {
  if (projectPath) {
    router.push({ name: 'PackageManagement' });
  } else {
    message.error('Project path is missing, cannot open package manager.');
  }
};

// Provide file handlers so FileTreePanel can inject them
provide('handleOpenFile', handleOpenFile);
provide('handleOpenPackageSettings', handleOpenPackageSettings);
provide('handleProjectRootChanged', handleProjectRootChanged);

const handleNavigate = (view) => {
  debug(`MainLayout: Navigating to view: ${view}`);
  switch (view) {
    case 'explorer':
      router.push({ name: 'Home' });
      break;
    case 'packages':
      router.push({ name: 'PackageManagement' });
      break;
    case 'settings':
      router.push({ name: 'Settings' });
      break;
    case 'about':
      router.push({ name: 'About' });
      break;
    default:
      debug(`MainLayout: Unknown view: ${view}`);
  }
};

// --- Event listeners (preserved from original) ---
const selectedDirectoryListenerSetup = ref(false);
let unlistenSelectedDirectory;

onMounted(async () => {
  appStore.setInitialProjectLoadAttempted(true);

  try {
    if (selectedDirectoryListenerSetup.value) return;
    selectedDirectoryListenerSetup.value = true;
    unlistenSelectedDirectory = await listen('orchestrator:selected-directory', (event) => {
      if (event.payload && typeof event.payload === 'object') {
        const { path, is_julia_project } = event.payload;
        if (path && typeof path === 'string') {
          appStore.setProjectPath(path);
          appStore.setIsJuliaProject(is_julia_project || false);
        }
      }
      appStore.setInitialProjectLoadAttempted(true);
    });
  } catch (err) {
    error('MainLayout.vue: Failed to set up selected-directory event listener:', err);
  }
});

onUnmounted(() => {
  if (unlistenSelectedDirectory) {
    unlistenSelectedDirectory();
    selectedDirectoryListenerSetup.value = false;
  }
  window.removeEventListener('mousemove', onDragMouseMove);
  window.removeEventListener('mouseup', onDragMouseUp);
});

// Listen for Julia daemon ready events (moved from EditorLayout)
onMounted(async () => {
  await listen('julia:daemon-status-changed', async (event) => {
    const payload = event.payload;
    if (payload && typeof payload === 'object') {
      appStore.setJuliaDaemonReady(
        payload.operationalStatus === 'idle' &&
          payload.currentOperationMessage &&
          payload.currentOperationMessage.toLowerCase().includes('ready')
      );
    }
  });

  // Safety net: Listen for Revise type redefinition errors
  await listen('julia:revise-redefinition-error', (event) => {
    notification.warning({
      title: 'Revise: Struct Redefinition Failed',
      content: 'Julia cannot reload changed struct definitions dynamically during a running session.',
      duration: 10000,
      keepAliveOnHover: true,
      action: () => {
        return h(
          NButton,
          {
            type: 'warning',
            size: 'small',
            onClick: async () => {
              if (activeTerminalId.value) {
                try {
                   await invoke('restart_terminal_session', { id: activeTerminalId.value });
                   message.success('Restarting Julia session...');
                } catch (e) {
                   message.error('Failed to restart terminal: ' + String(e));
                }
              }
            }
          },
          { default: () => 'Restart Julia Session' }
        );
      }
    });
  });
});

// Handle open-file-and-navigate events
const handleOpenFileAndNavigate = (event) => {
  if (route.name !== 'Home') {
    router.push({ name: 'Home' });
  }
  appStore.setFileToOpen(event.detail.filePath);
  appStore.setPendingNavigationRequest(event.detail.range);
};

window.addEventListener('open-file-and-navigate', handleOpenFileAndNavigate);

onUnmounted(() => {
  window.removeEventListener('open-file-and-navigate', handleOpenFileAndNavigate);
});

// Terminal actions (formerly in TerminalMenuBar)
const handleClearTerminal = () => {
  terminalStore.clearOutputBuffer();
  window.dispatchEvent(new CustomEvent('clear-terminal'));
};

const handleRestartJulia = async () => {
  try {
    await invoke('restart_julia_orchestrator');
  } catch (err) {
    error('MainLayout: Failed to restart Julia:', err);
  }
};

// Expose for child components
defineExpose({
  showRightPane: () => {},
  hideRightPane: () => {},
});
</script>

<style>
/* === Splitpane theme (jl-theme) === */
.jl-theme.splitpanes .splitpanes__splitter {
  background-color: var(--jl-border);
  transition: background-color 0.15s;
}
.jl-theme.splitpanes .splitpanes__splitter:hover {
  background-color: var(--jl-accent-green);
}
.jl-theme.splitpanes--vertical > .splitpanes__splitter {
  width: 6px;
  min-width: 6px;
  z-index: 50;
  cursor: col-resize;
}
.jl-theme.splitpanes--horizontal > .splitpanes__splitter {
  height: 6px;
  min-height: 6px;
  z-index: 50;
  cursor: row-resize;
}
</style>

<style scoped>
.julialab-root {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: row;
  background-color: var(--jl-bg);
  color: var(--jl-text-primary);
  font-family: var(--jl-font-ui);
  overflow: hidden;
}

/* === Navigation Rail === */
.nav-rail {
  width: 60px;
  min-width: 60px;
  height: 100vh;
  background-color: var(--jl-nav-rail-bg);
  border-right: 1px solid var(--jl-border);
  flex-shrink: 0;
  z-index: 100;
}

/* === Main Content === */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow: hidden;
}

/* === Panels area === */
.panels-area {
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/* === Panel containers === */
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.panel-header {
  height: 24px;
  min-height: 24px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--jl-text-secondary);
  background-color: var(--jl-panel-bg-alt);
  border-bottom: 1px solid var(--jl-border);
  flex-shrink: 0;
  justify-content: space-between;
}
.panel-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.panel-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background-color: var(--jl-panel-bg);
}

/* Left panel */
.panel--left {
  background-color: var(--jl-files-panel-bg);
}
.panel--left .panel-body {
  background-color: var(--jl-files-panel-bg);
}

/* Editor panel */
.panel--editor {
  background-color: var(--jl-editor-bg);
}
.panel-body--editor {
  overflow: hidden;
}

/* Terminal panel */
.panel--terminal {
  background-color: var(--jl-terminal-bg);
}
.panel--terminal .panel-header {
  background-color: var(--jl-terminal-header-bg);
  color: var(--jl-text-primary);
}
.terminal-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--jl-terminal-bg);
}

/* Right panel */
.panel--right {
  background-color: var(--jl-workspace-bg);
  position: relative;
}

.right-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.right-tabs .n-tabs-pane-wrapper) {
  flex: 1;
  overflow: hidden;
}

:deep(.right-tabs .n-tab-pane) {
  height: 100%;
  padding: 0 !important;
}

.absolute-header-actions {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 10;
}

/* === Fullscreen routes (non-Home) === */
.fullscreen-route {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

/* === Welcome overlay === */
.welcome-overlay {
  position: absolute;
  inset: 28px 0 0 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--jl-panel-bg);
  z-index: 10;
}
.welcome-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
}
.welcome-splash {
  width: 320px;
  height: 320px;
  object-fit: contain;
  border-radius: 32px;
  box-shadow: 0 8px 48px rgba(0, 0, 0, 0.45);
  user-select: none;
}
.welcome-actions {
  display: flex;
  gap: 12px;
}
.welcome-btn {
  min-width: 180px;
}

/* === Status chip === */
.status-chip {
  position: fixed;
  top: 36px;
  right: 12px;
  background: rgba(40, 40, 40, 0.92);
  color: var(--jl-text-secondary);
  border: 1px solid var(--jl-border-light);
  border-radius: 14px;
  padding: 4px 12px;
  font-size: 11px;
  z-index: 20;
}

/* === Panel drag handles === */
.panel-label {
  display: flex;
  align-items: center;
}
.panel-drag-label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: grab;
  user-select: none;
}
.panel-drag-label:active {
  cursor: grabbing;
}
.drag-grip {
  font-size: 13px;
  opacity: 0.45;
  line-height: 1;
  transition: opacity 0.1s;
}
.panel-drag-label:hover .drag-grip {
  opacity: 0.9;
}

.panel-drag-handle {
  position: absolute;
  top: 4px;
  left: 6px;
  z-index: 5;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  cursor: grab;
  color: var(--jl-text-secondary);
  font-size: 14px;
  opacity: 0.5;
  transition: opacity 0.1s, background 0.1s;
}
.panel-drag-handle:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.08);
}
.panel-drag-handle:active {
  cursor: grabbing;
}

/* === Panel drag-and-drop overlay === */
.panel-drag-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  pointer-events: none;
}
.drop-zone {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(56, 152, 38, 0.45);
  background: rgba(56, 152, 38, 0.07);
  pointer-events: none;
  transition: background 0.15s, border-color 0.15s;
}
.drop-zone--active {
  background: rgba(56, 152, 38, 0.22);
  border-color: var(--jl-accent-green);
}
.drop-zone--left {
  top: 56px;
  left: 0;
  bottom: 0;
  width: 26%;
}
.drop-zone--right {
  top: 56px;
  right: 0;
  bottom: 0;
  width: 26%;
}
.drop-zone--bottom {
  left: 0;
  right: 0;
  bottom: 0;
  height: 28%;
}
.drop-zone-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--jl-accent-green);
  font-size: 12px;
  font-weight: 700;
  font-family: var(--jl-font-ui);
  letter-spacing: 0.3px;
  text-transform: uppercase;
  pointer-events: none;
}
/* Fade transition for drag overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* === Cheat Sheet slide-in overlay === */
.cheatsheet-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 780px;
  max-width: 80vw;
  background: var(--jl-panel-bg);
  border-left: 1px solid var(--jl-border-light);
  display: flex;
  flex-direction: column;
  z-index: 200;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.5);
}

.cheatsheet-overlay-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--jl-panel-bg-alt);
  border-bottom: 1px solid var(--jl-border-light);
  flex-shrink: 0;
}

.cheatsheet-overlay-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--jl-accent-green);
  font-family: var(--jl-font-mono);
  letter-spacing: 0.5px;
}

/* Slide from right transition */
.slide-cheatsheet-enter-active,
.slide-cheatsheet-leave-active {
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-cheatsheet-enter-from,
.slide-cheatsheet-leave-to {
  transform: translateX(100%);
}
</style>
