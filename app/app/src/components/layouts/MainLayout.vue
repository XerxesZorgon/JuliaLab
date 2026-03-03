<template>
  <div class="julialab-root">
    <!-- TopBar: breadcrumb + action buttons -->
    <div class="topbar">
      <div class="topbar-left">
        <span class="topbar-breadcrumb">{{ breadcrumb }}</span>
      </div>
      <div class="topbar-right">
        <NTooltip trigger="hover" placement="bottom">
          <template #trigger>
            <NButton
              size="tiny"
              quaternary
              class="topbar-btn topbar-btn--run"
              @click="handleRunFile"
              :disabled="!appStore.projectPath"
            >
              <template #icon><NIcon size="14"><PlayOutline /></NIcon></template>
              Run
            </NButton>
          </template>
          Run current file (F5)
        </NTooltip>
        <NTooltip trigger="hover" placement="bottom">
          <template #trigger>
            <NButton
              size="tiny"
              quaternary
              class="topbar-btn"
              @click="handleSaveFile"
            >
              <template #icon><NIcon size="14"><SaveOutline /></NIcon></template>
              Save
            </NButton>
          </template>
          Save current file (Ctrl+S)
        </NTooltip>
      </div>
    </div>

    <!-- Main 4-panel area -->
    <div class="panels-area" v-if="route.name === 'Home'">
      <Splitpanes class="jl-theme" :horizontal="false" @resized="onOuterResized">
        <!-- LEFT PANE: File Explorer -->
        <Pane :size="leftPaneSize" :min-size="leftMinPct" :max-size="leftMaxPct">
          <div class="panel panel--left">
            <div class="panel-header">Files</div>
            <div class="panel-body">
              <LeftPanelAccordion
                @open-file="handleOpenFile"
                @open-package-settings="handleOpenPackageSettings"
                @project-root-changed="handleProjectRootChanged"
              />
            </div>
          </div>
        </Pane>

        <!-- CENTER: Editor (top) + Terminal (bottom) -->
        <Pane :size="centerPaneSize" min-size="20">
          <Splitpanes class="jl-theme" :horizontal="true" @resized="onCenterResized">
            <!-- CENTER-TOP: Editor -->
            <Pane :size="editorPaneSize" min-size="20">
              <div class="panel panel--editor">
                <EditorView />
              </div>
            </Pane>
            <!-- CENTER-BOTTOM: Terminal/REPL -->
            <Pane :size="terminalPaneSize" :min-size="termBottomMinPct" :max-size="termBottomMaxPct">
              <div class="panel panel--terminal">
                <TerminalMenuBar />
                <div class="terminal-body">
                  <BottomPanel />
                </div>
              </div>
            </Pane>
          </Splitpanes>
        </Pane>

        <!-- RIGHT PANE: Workspace Variables -->
        <Pane :size="rightPaneSize" :min-size="rightMinPct" :max-size="rightMaxPct">
          <div class="panel panel--right">
            <div class="panel-header">Workspace</div>
            <div class="panel-body">
              <VariablesPanel />
            </div>
          </div>
        </Pane>
      </Splitpanes>
    </div>

    <!-- Non-Home routes (About, Settings, PackageManagement) -->
    <div class="fullscreen-route" v-else>
      <router-view />
    </div>

    <!-- Welcome screen when no project is selected on Home route -->
    <div
      v-if="route.name === 'Home' && !appStore.projectPath && appStore.initialProjectLoadAttempted"
      class="welcome-overlay"
    >
      <div class="welcome-content">
        <div class="welcome-icon">
          <NIcon size="64" :color="'var(--jl-accent-green)'">
            <FolderOpenOutline />
          </NIcon>
        </div>
        <h1 class="welcome-title">Welcome to JuliaLab</h1>
        <p class="welcome-subtitle">Your MATLAB-style Julia Development Environment</p>
        <div class="welcome-actions">
          <NSpace vertical size="large">
            <NCard title="Get Started" size="small">
              <template #default>
                <p>Choose one of the following options to begin:</p>
                <NSpace vertical size="medium" style="margin-top: 16px">
                  <NButton type="primary" size="large" @click="handleOpenFolder" style="width: 100%">
                    <template #icon><NIcon><FolderOpenOutline /></NIcon></template>
                    Open Existing Julia Project
                  </NButton>
                  <NButton type="info" size="large" @click="handleCreateProject" style="width: 100%">
                    <template #icon><NIcon><AddOutline /></NIcon></template>
                    Create New Julia Project
                  </NButton>
                </NSpace>
              </template>
            </NCard>
          </NSpace>
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

    <!-- Status Bar (bottom of window) -->
    <StatusBar />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMessage, NIcon, NSpace, NCard, NButton, NTooltip } from 'naive-ui';
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
  PlayOutline,
  SaveOutline,
} from '@vicons/ionicons5';

import LeftPanelAccordion from './LeftPanelAccordion.vue';
import StatusBar from './StatusBar.vue';
import EditorView from '../HomeView/EditorView.vue';
import BottomPanel from '../HomeView/BottomPanel.vue';
import TerminalMenuBar from '../HomeView/TerminalMenuBar.vue';
import VariablesPanel from '../HomeView/VariablesPanel.vue';
import { useAppStore } from '../../store/appStore';
import { storeToRefs } from 'pinia';
import { useTerminalStore } from '../../store/terminalStore';

const router = useRouter();
const route = useRoute();
const message = useMessage();
const appStore = useAppStore();
const terminalStore = useTerminalStore();
const { activeTerminalId } = storeToRefs(terminalStore);
const { status: projectChangeStatus } = useProjectChangeStatus();

// --- Pane sizes (percentages) ---
// Defaults: left 220px, right 280px, bottom 220px out of typical 1024 viewport
const leftPaneSize = ref(18);   // ~220px of ~1200px
const rightPaneSize = ref(22);  // ~280px of ~1200px
const centerPaneSize = ref(60); // remainder
const editorPaneSize = ref(65); // 65% of center height
const terminalPaneSize = ref(35); // 35% of center height

// Min/max as percentages (approximate pixel equivalents at 1200px wide)
const leftMinPct = 10;  // ~150px
const leftMaxPct = 33;  // ~400px
const rightMinPct = 13; // ~200px
const rightMaxPct = 40; // ~500px
const termBottomMinPct = 12; // ~120px of center height
const termBottomMaxPct = 65; // ~500px of center height

// Breadcrumb from project path
const breadcrumb = computed(() => {
  const p = appStore.projectPath;
  if (!p) return 'No project open';
  // Show last 2 segments
  const parts = p.replace(/\\/g, '/').split('/').filter(Boolean);
  return parts.length > 2
    ? '…/' + parts.slice(-2).join('/')
    : parts.join('/');
});

// Splitpane resize handlers — keep sizes in sync
const onOuterResized = (panes) => {
  if (panes.length === 3) {
    leftPaneSize.value = panes[0].size;
    centerPaneSize.value = panes[1].size;
    rightPaneSize.value = panes[2].size;
  }
};

const onCenterResized = (panes) => {
  if (panes.length === 2) {
    editorPaneSize.value = panes[0].size;
    terminalPaneSize.value = panes[1].size;
  }
};

// --- TopBar actions ---
const handleRunFile = async () => {
  try {
    const filePath = appStore.activeFilePath;
    if (!filePath) {
      message.warning('No file is currently open');
      return;
    }
    await invoke('execute_julia_file', { filePath, fileContent: '' });
  } catch (err) {
    error('MainLayout: Failed to run file:', err);
    message.error('Failed to run file');
  }
};

const handleSaveFile = () => {
  // Dispatch a save event that EditorView listens to
  window.dispatchEvent(new CustomEvent('save-current-file'));
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

// --- Event listeners (preserved from original) ---
const selectedDirectoryListenerSetup = ref(false);

onMounted(async () => {
  appStore.setInitialProjectLoadAttempted(true);

  let unlistenSelectedDirectory;
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

  onUnmounted(() => {
    if (unlistenSelectedDirectory) {
      unlistenSelectedDirectory();
      selectedDirectoryListenerSetup.value = false;
    }
  });
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
  width: 3px;
  min-width: 3px;
}
.jl-theme.splitpanes--horizontal > .splitpanes__splitter {
  height: 3px;
  min-height: 3px;
}
</style>

<style scoped>
.julialab-root {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background-color: var(--jl-bg);
  color: var(--jl-text-primary);
  font-family: var(--jl-font-ui);
  overflow: hidden;
}

/* === TopBar === */
.topbar {
  height: 28px;
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  background-color: var(--jl-panel-bg);
  border-bottom: 1px solid var(--jl-border);
  font-size: 12px;
  flex-shrink: 0;
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.topbar-breadcrumb {
  color: var(--jl-text-secondary);
  font-family: var(--jl-font-mono);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.topbar-btn {
  font-size: 11px;
  font-family: var(--jl-font-ui);
}
.topbar-btn--run {
  color: var(--jl-accent-green);
}

/* === Panels area === */
.panels-area {
  flex: 1;
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
}
.panel-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background-color: var(--jl-panel-bg);
}

/* Left panel */
.panel--left {
  background-color: var(--jl-panel-bg);
}

/* Editor panel (no header) */
.panel--editor {
  background-color: var(--jl-panel-bg);
}

/* Terminal panel */
.panel--terminal {
  background-color: var(--jl-panel-bg);
}
.terminal-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Right panel */
.panel--right {
  background-color: var(--jl-panel-bg);
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
  text-align: center;
  max-width: 500px;
  padding: 40px;
}
.welcome-icon {
  margin-bottom: 24px;
}
.welcome-title {
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--jl-text-primary);
  font-family: var(--jl-font-ui);
}
.welcome-subtitle {
  font-size: 1.1rem;
  color: var(--jl-text-secondary);
  margin: 0 0 32px 0;
}
.welcome-actions {
  max-width: 400px;
  margin: 0 auto;
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
</style>
