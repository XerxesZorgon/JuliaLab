<template>
  <div style="display:contents">
  <div class="ribbon-tab-content">
    <!-- FILE group -->
    <RibbonGroup title="File">
      <RibbonBtn icon="newFile" label="New Script" :large="true" @click="handleNew">
        <template #icon><span class="ci" v-html="coloredIcons.newFile" /></template>
      </RibbonBtn>
      <div class="ribbon-col">
        <RibbonBtn icon="newDropdown" label="New ▾" @click="showNewMenu = !showNewMenu">
          <template #icon><span class="ci-sm" v-html="coloredIcons.newDropdown" /></template>
        </RibbonBtn>
        <RibbonBtn icon="open" label="Open" @click="handleOpen">
          <template #icon><span class="ci-sm" v-html="coloredIcons.open" /></template>
        </RibbonBtn>
      </div>
      <div class="ribbon-col">
        <RibbonBtn icon="goToFile" label="Go to File" @click="showGoToFile = true">
          <template #icon><span class="ci-sm" v-html="coloredIcons.goToFile" /></template>
        </RibbonBtn>
        <RibbonBtn icon="findFiles" label="Find Files" @click="showFindFiles = true">
          <template #icon><span class="ci-sm" v-html="coloredIcons.findFiles" /></template>
        </RibbonBtn>
      </div>
    </RibbonGroup>

    <!-- New ▾ dropdown menu -->
    <div v-if="showNewMenu" class="new-dropdown-menu" @mouseleave="showNewMenu = false">
      <button class="new-menu-item" @click="handleNewScript">
        <span class="ci-sm" v-html="coloredIcons.newFile" /> New Script (.jl)
      </button>
      <button class="new-menu-item" @click="handleNewFunction">
        <span class="ci-sm" v-html="coloredIcons.newFile" /> New Function
      </button>
      <button class="new-menu-item" @click="handleNewModule">
        <span class="ci-sm" v-html="coloredIcons.newFile" /> New Module
      </button>
    </div>

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
        <RibbonBtn icon="findFiles" label="Find Files" @click="showFindFiles = true">
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

    <RibbonDivider />

    <!-- ENVIRONMENT group -->
    <RibbonGroup title="Environment">
      <div class="ribbon-col">
        <RibbonBtn label="Add Julia Version" @click="openJuliaupInstall">
          <template #icon>
            <n-icon size="20"><DownloadOutline /></n-icon>
          </template>
        </RibbonBtn>
        <RibbonBtn label="Manage Versions" @click="openJuliaupManage">
          <template #icon>
            <n-icon size="20"><LayersOutline /></n-icon>
          </template>
        </RibbonBtn>
      </div>
      <div class="ribbon-col">
        <RibbonBtn label="Restart Julia" @click="restartJulia">
          <template #icon>
            <n-icon size="20"><RefreshOutline /></n-icon>
          </template>
        </RibbonBtn>
      </div>
    </RibbonGroup>
  </div>

  <!-- Go to File modal -->
  <n-modal v-model:show="showGoToFile" title="Go to File" preset="card"
    style="width:480px; max-width:90vw">
    <n-input
      v-model:value="goToFileQuery"
      placeholder="Type a filename to search…"
      autofocus
      @input="searchFiles"
      @keydown="handleGoToFileKeydown"
    />
    <div class="go-to-file-results">
      <button
        v-for="f in goToFileResults"
        :key="f.path"
        class="go-to-file-item"
        @click="openFileFromSearch(f.path)"
      >
        <span class="go-to-file-name">{{ f.name }}</span>
        <span class="go-to-file-path">{{ f.relativePath }}</span>
      </button>
      <div v-if="goToFileResults.length === 0 && goToFileQuery" class="go-to-file-empty">
        No files match "{{ goToFileQuery }}"
      </div>
    </div>
  </n-modal>

  <!-- Find in Files modal -->
  <n-modal v-model:show="showFindFiles" title="Find in Files" preset="card"
    style="width:560px; max-width:90vw">
    <div class="find-files-row">
      <n-input
        v-model:value="findFilesQuery"
        placeholder="Search text…"
        autofocus
        @keydown="handleFindFilesKeydown"
      />
      <n-button type="primary" @click="runFindInFiles" :loading="findFilesRunning">
        Search
      </n-button>
    </div>
    <div class="find-files-results">
      <div v-for="result in findFilesResults" :key="result.path" class="find-files-file">
        <button class="find-files-filename" @click="openFileFromSearch(result.path)">
          {{ result.relativePath }}
        </button>
        <div v-for="(match, i) in result.matches" :key="i" class="find-files-match"
          @click="openFileFromSearch(result.path)">
          <span class="find-files-line">{{ match.line }}</span>
          <span class="find-files-text">{{ match.text }}</span>
        </div>
      </div>
      <div v-if="findFilesResults.length === 0 && !findFilesRunning && findFilesSearched"
        class="find-files-empty">No results found</div>
    </div>
  </n-modal>

  <!-- New file name dialog -->
  <n-modal v-model:show="showNewDialog" :title="newDialogTitle" preset="dialog"
    style="width:380px"
    positive-text="Create"
    negative-text="Cancel"
    :positive-button-props="{ disabled: !newFileName.trim() }"
    @positive-click="confirmNewFile"
    @negative-click="showNewDialog = false">
    <n-input
      v-model:value="newFileName"
      :placeholder="newFileNamePlaceholder"
      autofocus
      @keydown.enter="confirmNewFile"
    />
  </n-modal>

  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { open as openExternal } from '@tauri-apps/plugin-shell';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { NModal, NInput, NButton, NIcon, useMessage } from 'naive-ui';
import { DownloadOutline, LayersOutline, RefreshOutline } from '@vicons/ionicons5';
import { useAppStore } from '../../store/appStore';
import { useJuliaActions } from '../../composables/useJuliaActions';
import RibbonGroup from './RibbonGroup.vue';
import RibbonBtn from './RibbonBtn.vue';
import RibbonDivider from './RibbonDivider.vue';
import { coloredIcons } from './ribbon-icons-colored';

const appStore = useAppStore();
const message = useMessage();
const { runFile, runCell, saveFile, formatFile, clearWorkspace } = useJuliaActions();

// ── Revise status ──────────────────────────────────────────────────────────
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

// ── New ▾ dropdown ─────────────────────────────────────────────────────────
const showNewMenu = ref(false);

// ── New file dialog ────────────────────────────────────────────────────────
const showNewDialog = ref(false);
const newFileName = ref('');
const newDialogTitle = ref('New Script');
const newFileNamePlaceholder = ref('untitled.jl');
const newFileTemplate = ref('');

function handleNew() { handleNewScript(); }

function handleNewScript() {
  showNewMenu.value = false;
  newDialogTitle.value = 'New Script';
  newFileNamePlaceholder.value = 'untitled.jl';
  newFileTemplate.value = '# New Julia script\n';
  newFileName.value = '';
  showNewDialog.value = true;
}
function handleNewFunction() {
  showNewMenu.value = false;
  newDialogTitle.value = 'New Function';
  newFileNamePlaceholder.value = 'myfunction.jl';
  newFileTemplate.value = 'function myfunction()\n    # TODO\nend\n';
  newFileName.value = '';
  showNewDialog.value = true;
}
function handleNewModule() {
  showNewMenu.value = false;
  newDialogTitle.value = 'New Module';
  newFileNamePlaceholder.value = 'MyModule.jl';
  newFileTemplate.value = 'module MyModule\n\n# exports\n\nend # module\n';
  newFileName.value = '';
  showNewDialog.value = true;
}

async function confirmNewFile() {
  const name = newFileName.value.trim();
  if (!name) return;
  const projectPath = appStore.projectPath;
  if (!projectPath) { message.error('No project open — open a folder first'); return; }
  const sep = projectPath.includes('\\') ? '\\' : '/';
  const fileName = name.endsWith('.jl') ? name : name + '.jl';
  const fullPath = projectPath + sep + fileName;
  try {
    await invoke('create_file_item', { path: fullPath });
    await invoke('write_file_content', { path: fullPath, content: newFileTemplate.value });
    window.dispatchEvent(new CustomEvent('ribbon:open-file', { detail: fullPath }));
    message.success(`Created ${fileName}`);
    showNewDialog.value = false;
    newFileName.value = '';
  } catch (e: unknown) {
    message.error(`Failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ── Open folder ────────────────────────────────────────────────────────────
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

// ── Go to File ─────────────────────────────────────────────────────────────
const showGoToFile = ref(false);
const goToFileQuery = ref('');

interface FileResult {
  name: string;
  path: string;
  relativePath: string;
}

const goToFileResults = ref<FileResult[]>([]);
let allProjectFiles: FileResult[] = [];

async function loadProjectFiles() {
  const projectPath = appStore.projectPath;
  if (!projectPath) return;
  try {
    const tree = await invoke<any>('get_file_tree', { rootPath: projectPath });
    if (tree && tree.is_directory && tree.children) {
      allProjectFiles = flattenTree(tree.children, projectPath);
    } else {
      allProjectFiles = flattenTree(tree, projectPath);
    }
  } catch (e) {
    console.warn('HomeTab: loadProjectFiles failed', e);
  }
}

watch(
  () => appStore.projectPath,
  async (newPath) => {
    if (newPath) await loadProjectFiles();
  },
  { immediate: true }
);

function flattenTree(node: any, root: string): FileResult[] {
  const results: FileResult[] = [];
  if (!node) return results;
  const items = Array.isArray(node) ? node : (node.children || []);
  for (const item of items) {
    if (!item) continue;
    if (!item.is_directory && item.path) {
      results.push({
        name: item.name || item.path.split(/[\\/]/).pop() || '',
        path: item.path,
        relativePath: item.path.replace(root, '').replace(/^[\\/]/, ''),
      });
    }
    if (item.is_directory && item.children) {
      results.push(...flattenTree(item.children, root));
    }
  }
  return results;
}

function searchFiles() {
  const q = goToFileQuery.value.toLowerCase();
  if (!q) { goToFileResults.value = []; return; }
  goToFileResults.value = allProjectFiles
    .filter(f => f.name.toLowerCase().includes(q) || f.relativePath.toLowerCase().includes(q))
    .slice(0, 20);
}

function handleGoToFileKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') openFirstMatch();
  if (e.key === 'Escape') showGoToFile.value = false;
}

function handleFindFilesKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') runFindInFiles();
  if (e.key === 'Escape') showFindFiles.value = false;
}

function openFirstMatch() {
  if (goToFileResults.value.length > 0) {
    openFileFromSearch(goToFileResults.value[0].path);
  }
}

function openFileFromSearch(path: string) {
  window.dispatchEvent(new CustomEvent('ribbon:open-file', { detail: path }));
  showGoToFile.value = false;
  showFindFiles.value = false;
  goToFileQuery.value = '';
}

// ── Find in Files ──────────────────────────────────────────────────────────
const showFindFiles = ref(false);
const findFilesQuery = ref('');
const findFilesRunning = ref(false);
const findFilesSearched = ref(false);

interface FindResult {
  path: string;
  relativePath: string;
  matches: { line: number; text: string }[];
}

const findFilesResults = ref<FindResult[]>([]);

async function runFindInFiles() {
  const q = findFilesQuery.value.trim();
  if (!q) return;
  const projectPath = appStore.projectPath;
  if (!projectPath) { message.error('No project open'); return; }

  findFilesRunning.value = true;
  findFilesSearched.value = false;
  findFilesResults.value = [];

  try {
    const results: FindResult[] = [];
    for (const file of allProjectFiles.filter(f => f.name.endsWith('.jl'))) {
      try {
        const content = await invoke<string>('read_file_content', { path: file.path });
        const lines = content.split('\n');
        const matches = lines
          .map((text, i) => ({ line: i + 1, text: text.trim() }))
          .filter(m => m.text.toLowerCase().includes(q.toLowerCase()));
        if (matches.length > 0) {
          results.push({ path: file.path, relativePath: file.relativePath, matches: matches.slice(0, 5) });
        }
      } catch { /* skip unreadable files */ }
    }
    findFilesResults.value = results;
  } finally {
    findFilesRunning.value = false;
    findFilesSearched.value = true;
  }
}

// ── Other handlers ─────────────────────────────────────────────────────────
const handlePackages = () => {
  window.dispatchEvent(new CustomEvent('ribbon:navigate', { detail: 'PackageManagement' }));
};

const handleOpenDyad = async () => {
  await openExternal('https://juliahub.com/products/dyad/');
};

async function restartJulia() {
  try {
    await invoke('restart_julia');
  } catch (e) {
    console.error('Failed to restart Julia:', e);
  }
}

async function openJuliaupInstall() {
  // Open Julia downloads page
  await openExternal('https://julialang.org/downloads/');
}
async function openJuliaupManage() {
  // Open juliaup documentation
  await openExternal('https://github.com/JuliaLang/juliaup#using-juliaup');
}
</script>

<style scoped>
.ribbon-tab-content {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  min-height: 68px;
  width: 100%;
  position: relative;
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

/* ── New dropdown menu ── */
.new-dropdown-menu {
  position: absolute;
  top: 72px;
  left: 152px;
  background: var(--jl-panel-bg);
  border: 1px solid var(--jl-border);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  z-index: 200;
  min-width: 180px;
  padding: 4px;
}
.new-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 10px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-family: var(--jl-font-ui);
  color: var(--jl-text-primary);
  text-align: left;
}
.new-menu-item:hover {
  background: var(--jl-panel-hover, rgba(0,90,156,0.08));
}

/* ── Go to File modal ── */
.go-to-file-results {
  margin-top: 8px;
  max-height: 300px;
  overflow-y: auto;
}
.go-to-file-item {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 6px 8px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
}
.go-to-file-item:hover { background: var(--jl-panel-hover, rgba(0,90,156,0.08)); }
.go-to-file-name { font-size: 13px; font-weight: 600; color: var(--jl-text-primary); }
.go-to-file-path { font-size: 10px; color: var(--jl-text-muted); font-family: var(--jl-font-mono); }
.go-to-file-empty { padding: 16px; text-align: center; color: var(--jl-text-muted); font-size: 12px; }

/* ── Find in Files modal ── */
.find-files-row { display: flex; gap: 8px; }
.find-files-row .n-input { flex: 1; }
.find-files-results { margin-top: 10px; max-height: 360px; overflow-y: auto; }
.find-files-file { margin-bottom: 10px; }
.find-files-filename {
  display: block; width: 100%; padding: 4px 6px;
  background: var(--jl-panel-bg-alt); border: none; border-radius: 4px;
  font-size: 11px; font-weight: 700; color: var(--jl-matlab-blue);
  font-family: var(--jl-font-mono); cursor: pointer; text-align: left;
}
.find-files-match {
  display: flex; gap: 8px; padding: 2px 8px; cursor: pointer;
  border-radius: 3px;
}
.find-files-match:hover { background: var(--jl-panel-hover, rgba(0,90,156,0.08)); }
.find-files-line { font-size: 10px; color: var(--jl-text-muted); min-width: 28px; }
.find-files-text { font-size: 11px; font-family: var(--jl-font-mono); color: var(--jl-text-secondary); }
.find-files-empty { padding: 16px; text-align: center; color: var(--jl-text-muted); font-size: 12px; }
</style>
