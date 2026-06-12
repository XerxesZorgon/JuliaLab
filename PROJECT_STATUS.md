---
{
  "id": "file_juvuzvy9",
  "filetype": "document",
  "filename": "PROJECT_STATUS",
  "created_at": "2026-06-12T13:49:15.502Z",
  "updated_at": "2026-06-12T13:49:15.502Z",
  "meta": {
    "location": "/",
    "tags": [],
    "categories": [],
    "description": "",
    "source": "markdown"
  }
}
---
# PROJECT_STATUS.md
Generated: 2026-06-12

---

## 1. GIT

### `git log --oneline -30`

```
bf8002e Feature: Source Control view with git status, stage, commit, push, pull
4f6b67b Fix: disable Restart Julia button (hangs OS), add juliaup/help ribbon buttons, AI assistant panel
7846c16 Fix: Replace C42 icon with JuliaLab icon, inline Julia Environment in About page
4207798 Feature: AI Assistant panel with Claude API, file context, code review suggestions
64a57d1 Fix: workspace refresh no longer blocks Run button (suppress_busy_events: true)
f29d5ea Fix: clear workspace error resolved
07e3abe Fix: LSP and Revise now active - correct project path, SetLspProject on activation
8e87f6b Fix: terminal clear timing, panel toggles via GL loadLayout
3521f65 Fix: Revise active status - store in appStore, listen in App.vue
32da49b Style: light theme editor, MATLAB-style tabs, remove cell highlight green, fix overview ruler
ae9f751 Style: MATLAB Command Window blue titlebar, white terminal, bar cursor
2df5992 CSS batch: hide GL panel tabs, shrink ribbon, fix logo size, white explorer bg, E6E6E6 left bar, clear REPL on startup
099f7a3 Fix: clear startup noise from REPL, show clean julia> prompt on startup
960e71b Fix: Monaco editor renders in GoldenLayout panels (force root element to fill container)
f69b354 FILE group: New Script dialog, Go to File modal, Find in Files modal
5a37f7c Ribbon: FIGURE tab icons, remove INSERT tab, rename to PLUTO NOTEBOOK
58aece0 Ribbon: remove INSERT tab, rename LIVE EDITOR to PLUTO NOTEBOOK, complete FIGURE tab
0a3056e Ribbon: add FIGURE tab between PLOTS and APPS
4c2d972 Ribbon: colored icons for PLOTS and VIEW tabs; add FIGURE tab
ecacbb1 Ribbon: MATLAB-style colored icons for HOME tab
d621b59 Ribbon: JuliaLab logo, MATLAB-style FILE group, title bar update, Pluto Notebook tab
310f92e Fix: bump GL layout version to clear corrupt localStorage state
d05bfd2 Phase 5b: Curve fitting app with SVG chart; fix ribbon stubs
0c4a1bb Phase 5: Add Live Editor tab with Launch Pluto button
aecea6e Phase 4 complete — plot pipeline, GLMakie confirmed working
246e8f1 Phase 3 complete.
4a6343f Phase 2 of JuliaLab
ce39f3b JuliaLab initial commit.
a4eee60 feat: Phase 1 complete — rebrand, 4-panel layout, Revise.jl, status bar
6730a09 feat: initial JuliaLab project structure
```

### `git status`

```
On branch main
Your branch is ahead of 'origin/main' by 24 commits.

Untracked files:
  .codex/
  .cursor/
  .mcp.json
  JuliaLab modifications.mdx
  docs/JuliaLab.pptx
  docs/Matlab.pptx
  docs/~$Matlab.pptx
  img/

nothing added to commit but untracked files present
```

---

## 2. TREE

### `app/app/src` (3 levels deep)

```
app/app/src
├── App.vue
├── main.ts
├── shims-vue.d.ts
├── components/
│   ├── AppsView/
│   │   ├── AppsGallery.vue
│   │   └── CurveFittingApp.vue
│   ├── FileExplorer/
│   │   ├── FileExplorer.vue
│   │   ├── components/
│   │   └── index.ts
│   ├── HomeView/
│   │   ├── BottomPanel.vue
│   │   ├── CodeMirrorNotebookEditor.vue
│   │   ├── CsvViewer.vue
│   │   ├── DiagnosticsPanel.vue
│   │   ├── EditorLayout.vue
│   │   ├── EditorTabMenu.vue
│   │   ├── EditorView.vue
│   │   ├── FileExplorer.vue
│   │   ├── ImageViewer.vue
│   │   ├── JuliaLspFeatures.ts
│   │   ├── MonacoEditorInstance.vue
│   │   ├── NotebookCodeCell.vue
│   │   ├── NotebookMarkdownCell.vue
│   │   ├── NotebookOutput.vue
│   │   ├── NotebookViewer.vue
│   │   ├── PlotPanel.vue
│   │   ├── TerminalMenuBar.vue
│   │   ├── TerminalView.vue
│   │   └── VariablesPanel.vue
│   ├── SettingsView/
│   │   ├── MonacoEditorPreview.vue
│   │   └── TerminalPreview.vue
│   ├── help/
│   │   └── HelpContentRenderer.vue
│   ├── layouts/
│   │   ├── AiAssistantPanel.vue
│   │   ├── DockLayout.vue
│   │   ├── FileTreePanel.vue
│   │   ├── LayoutPicker.vue
│   │   ├── LeftPanelAccordion.vue
│   │   ├── MainLayout.vue
│   │   ├── NavigationRail.vue
│   │   ├── PanelHeader.vue
│   │   ├── RibbonBar.vue
│   │   ├── RightNavigationRail.vue
│   │   ├── StatusBar.vue
│   │   └── WorkspaceTabsPanel.vue
│   ├── ribbon/
│   │   ├── AppsTab.vue
│   │   ├── FigureTab.vue
│   │   ├── HomeTab.vue
│   │   ├── LiveEditorTab.vue
│   │   ├── PlotsToolbar.vue
│   │   ├── RibbonBtn.vue
│   │   ├── RibbonButton.vue
│   │   ├── RibbonDivider.vue
│   │   ├── RibbonGroup.vue
│   │   ├── RibbonToggle.vue
│   │   ├── ViewTab.vue
│   │   ├── __tests__/
│   │   ├── julialab-ribbon.jsx
│   │   ├── ribbon-icons-colored.ts
│   │   └── ribbon-icons.ts
│   └── shared/
│       ├── CommandLineOutput.vue
│       ├── DataGrid.vue
│       ├── EnvironmentInfo.vue
│       ├── ErrorScreen.test.ts
│       ├── ErrorScreen.vue
│       ├── GenericModal.test.ts
│       ├── GenericModal.vue
│       ├── JuliaInfoModal.vue
│       ├── JuliaSettingsModal.vue
│       ├── LspStatusModal.vue
│       ├── NewJuliaProjectDialog.vue
│       ├── NonJuliaProjectWarning.vue
│       ├── NotificationToast.test.ts
│       ├── NotificationToast.vue
│       ├── PackageCard.vue
│       ├── PipeErrorScreen.vue
│       ├── PkgOperationsDialog.vue
│       ├── PlotLibrary.vue
│       ├── ProjectSwitchModal.vue
│       ├── ProjectTomlConfigDialog.vue
│       ├── ReferencesPanel.vue
│       ├── StartupModal.vue
│       ├── WelcomeModal.vue
│       └── icons/
├── composables/
│   ├── fileTree/
│   │   ├── index.ts
│   │   ├── useFileOperations.test.ts
│   │   ├── useFileOperations.ts
│   │   ├── useFileSearch.test.ts
│   │   ├── useFileSearch.ts
│   │   ├── useFileTree.test.ts
│   │   ├── useFileTree.ts
│   │   ├── useFileWatching.test.ts
│   │   └── useFileWatching.ts
│   ├── useJuliaActions.test.ts
│   └── useJuliaActions.ts
├── features/
│   ├── ai/
│   │   └── AiSidebar.vue
│   ├── cheatsheet/
│   │   ├── CheatSheetPanel.vue
│   │   └── cheatsheet-data.ts
│   ├── files/
│   │   └── useSelectedDirectory.ts
│   ├── layouts/
│   │   └── LayoutManagerDialog.vue
│   ├── lsp/
│   │   ├── useLspStatus.test.ts
│   │   └── useLspStatus.ts
│   ├── methods/
│   │   └── MethodsBrowser.vue
│   ├── orchestrator/
│   │   ├── useProjectChangeStatus.test.ts
│   │   └── useProjectChangeStatus.ts
│   ├── plots/
│   │   ├── PlotPanel.vue
│   │   ├── usePlotEvents.test.ts
│   │   └── usePlotEvents.ts
│   └── tips/
│       ├── TipToast.vue
│       ├── tips-data.ts
│       └── useTips.ts
├── router/
│   └── index.ts
├── services/
│   ├── aiContext.ts
│   ├── applicationService.ts
│   ├── eventBus.test.ts
│   ├── eventBus.ts
│   ├── helpService.ts
│   ├── httpClient.ts
│   ├── lspEventsBridge.ts
│   ├── lspService.ts
│   ├── notebookExecutionService.ts
│   ├── orchestratorEventsBridge.ts
│   ├── plotEventsBridge.ts
│   ├── syntaxService.ts
│   ├── tabService.test.ts
│   ├── tabService.ts
│   └── unifiedEventService.ts
├── store/
│   ├── appStore.test.ts
│   ├── appStore.ts
│   ├── appsStore.ts
│   ├── layoutStore.ts
│   ├── plotStore.test.ts
│   ├── plotStore.ts
│   ├── settingsStore.test.ts
│   ├── settingsStore.ts
│   ├── terminalStore.test.ts
│   ├── terminalStore.ts
│   └── themeStore.ts
├── styles/
│   └── theme.css
├── test/
│   ├── __mocks__/
│   │   └── monaco-editor.ts
│   ├── mocks/
│   │   └── tauri.ts
│   ├── setup-localstorage.ts
│   ├── setup.ts
│   └── utils/
│       └── testHelpers.ts
├── theme/
│   └── index.ts
├── types/
│   ├── bindings/
│   │   └── .gitkeep
│   ├── fileTree.ts
│   ├── lsp.ts
│   ├── notebook.ts
│   └── packageTypes.ts
├── utils/
│   ├── debugMonacoColors.ts
│   ├── fileTypeUtils.test.ts
│   ├── fileTypeUtils.ts
│   ├── iconMapping.test.ts
│   ├── iconMapping.ts
│   ├── inspectMonacoColors.md
│   ├── ioniconsFileIconUtils.ts
│   ├── juliaColorScheme.ts
│   ├── logger.ts
│   ├── monacoJuliaUtils.test.ts
│   ├── monacoJuliaUtils.ts
│   ├── monacoThemeUtils.ts
│   ├── notebookImageEmbedder.ts
│   ├── notebookUtils.test.ts
│   └── notebookUtils.ts
└── views/
    ├── AboutView.vue
    ├── PackageManagement.vue
    ├── SettingsView.vue
    └── SourceControlView.vue
```

### `app/internals/src` (3 levels deep)

```
app/internals/src
├── actor_error_handling.rs
├── actor_system.rs
├── app_time.rs
├── config.rs
├── lib.rs
├── service_traits.rs
├── types.rs
├── version.rs
├── actors/
│   ├── mod.rs
│   ├── workspace_actor.rs
│   ├── communication_actor/
│   │   ├── connection.rs
│   │   ├── execution.rs
│   │   ├── io_operations.rs
│   │   ├── message_handler.rs
│   │   ├── mod.rs
│   │   └── state.rs
│   ├── configuration_actor/
│   │   ├── mod.rs
│   │   └── persistence.rs
│   ├── execution_actor/
│   │   └── mod.rs
│   ├── file_server_actor/
│   │   ├── csv.rs
│   │   ├── handlers.rs
│   │   ├── mod.rs
│   │   └── server.rs
│   ├── file_watcher_actor/
│   │   └── mod.rs
│   ├── filesystem_actor/
│   │   └── mod.rs
│   ├── installation_actor/
│   │   ├── cleanup.rs
│   │   ├── discovery.rs
│   │   ├── download.rs
│   │   ├── extraction.rs
│   │   ├── handlers.rs
│   │   ├── installation.rs
│   │   ├── mod.rs
│   │   ├── types.rs
│   │   └── version_info.rs
│   ├── lsp_actor/
│   │   ├── handlers_documents.rs
│   │   ├── handlers_features.rs
│   │   ├── handlers_lifecycle.rs
│   │   ├── lifecycle.rs
│   │   ├── mod.rs
│   │   ├── service_impl.rs
│   │   ├── state.rs
│   │   ├── type_conversions.rs
│   │   └── utils.rs
│   ├── orchestrator_actor/
│   │   ├── handlers.rs
│   │   ├── mod.rs
│   │   ├── startup_phases.rs
│   │   ├── startup_state.rs
│   │   ├── startup_state_machine.rs
│   │   └── work_handlers.rs
│   ├── plot_actor/
│   │   ├── filters.rs
│   │   ├── handlers.rs
│   │   ├── mod.rs
│   │   ├── server.rs
│   │   └── storage.rs
│   ├── process_actor/
│   │   ├── file_creation.rs
│   │   ├── lifecycle.rs
│   │   ├── mod.rs
│   │   ├── output_monitoring.rs
│   │   ├── session.rs
│   │   ├── setup.rs
│   │   └── state.rs
│   └── project_actor/
│       └── mod.rs
├── messages/
│   ├── communication.rs
│   ├── configuration.rs
│   ├── coordination.rs
│   ├── execution.rs
│   ├── file_server.rs
│   ├── filesystem.rs
│   ├── installation.rs
│   ├── lsp.rs
│   ├── mod.rs
│   ├── orchestrator.rs
│   ├── plot.rs
│   ├── process.rs
│   ├── state.rs
│   └── workspace.rs
├── mocks/
│   ├── auth_service.rs
│   ├── core.rs
│   ├── features.rs
│   ├── mod.rs
│   ├── process.rs
│   └── services.rs
└── services/
    ├── mod.rs
    ├── base/
    │   ├── error_handling.rs
    │   ├── file_utils.rs
    │   ├── logging.rs
    │   ├── mod.rs
    │   ├── service_adapter.rs
    │   ├── service_trait.rs
    │   └── variable_utils.rs
    ├── events/
    │   ├── event_service.rs
    │   └── mod.rs
    ├── factory/
    │   ├── actor_system_builder.rs
    │   └── mod.rs
    └── persistence/
        ├── mod.rs
        └── persistence_service.rs
```

---

## 3. RIBBON

### `app/app/src/components/layouts/RibbonBar.vue`

```vue
<template>
  <div class="ribbon-bar">
    <!-- Tab bar row using Naive UI n-tabs -->
    <div class="ribbon-tabs-container">
      <n-tabs
        v-model:value="activeTab"
        type="card"
        size="small"
        @update:value="handleTabChange"
        class="ribbon-n-tabs"
      >
        <n-tab v-for="tab in TABS" :key="tab" :name="tab" :label="tab">
          <template #default>
            {{ tab }}
            <span v-if="tab === 'PLOTS' && plotStore.plotCount > 0" class="ribbon-tab-badge">
              {{ plotStore.plotCount > 99 ? '99+' : plotStore.plotCount }}
            </span>
          </template>
        </n-tab>
      </n-tabs>
      <n-tooltip trigger="hover" placement="bottom">
        <template #trigger>
          <n-button
            text
            class="ribbon-help-btn"
            @click="openJuliaDocs"
          >
            <n-icon size="18"><HelpCircleOutline /></n-icon>
          </n-button>
        </template>
        Julia Documentation
      </n-tooltip>

      <!-- Pin toggle -->
      <div class="ribbon-actions">
        <button
          class="ribbon-pin"
          :class="{ pinned: layoutStore.ribbonPinned }"
          :title="layoutStore.ribbonPinned ? 'Unpin ribbon' : 'Pin ribbon'"
          @click="layoutStore.ribbonPinned = !layoutStore.ribbonPinned"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path v-if="layoutStore.ribbonPinned" d="M15 3h6v6 M9 21H3v-6 M21 3l-7 7 M3 21l7-7" />
            <path v-else d="M4 14h6v6 M20 10h-6V4 M14 10l7-7 M3 21l7-7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Ribbon content row (collapsible via max-height) -->
    <div class="ribbon-content" :class="{ collapsed: !showRibbon }">
      <div class="ribbon-content-inner">
        <div class="ribbon-logo">
          <img src="/JuliaLab_icon.png" alt="JuliaLab" class="ribbon-logo-img" />
        </div>
        <component :is="tabComponent" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type Component } from 'vue';
import { NButton, NTabs, NTab, NIcon, NTooltip } from 'naive-ui';
import { HelpCircleOutline } from '@vicons/ionicons5';
import { open as openExternal } from '@tauri-apps/plugin-shell';
import { useLayoutStore } from '../../store/layoutStore';
import { usePlotStore } from '../../store/plotStore';
import HomeTab from '../ribbon/HomeTab.vue';
import PlotsToolbar from '../ribbon/PlotsToolbar.vue';
import ViewTab from '../ribbon/ViewTab.vue';
import LiveEditorTab from '../ribbon/LiveEditorTab.vue';
import AppsTab from '../ribbon/AppsTab.vue';
import FigureTab from '../ribbon/FigureTab.vue';

const layoutStore = useLayoutStore();
const plotStore = usePlotStore();

const TABS = ['HOME', 'PLOTS', 'FIGURE', 'APPS', 'PLUTO NOTEBOOK', 'VIEW'] as const;
type TabName = (typeof TABS)[number];
const emit = defineEmits(['tab-change']);

const activeTab = ref<TabName>('HOME');

const showRibbon = computed(() => layoutStore.ribbonVisible || layoutStore.ribbonPinned);

const handleTabChange = (value: string) => {
  activeTab.value = value as TabName;
  layoutStore.ribbonVisible = true;
  emit('tab-change', activeTab.value);
};

async function openJuliaDocs() {
  await openExternal('https://docs.julialang.org/en/v1/');
}

const tabComponents: Record<TabName, Component> = {
  HOME: HomeTab,
  PLOTS: PlotsToolbar,
  FIGURE: FigureTab,
  APPS: AppsTab,
  'PLUTO NOTEBOOK': LiveEditorTab,
  VIEW: ViewTab,
};

const tabComponent = computed(() => tabComponents[activeTab.value]);

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'F2') {
    e.preventDefault();
    layoutStore.toggleRibbon();
  }
};

onMounted(() => { window.addEventListener('keydown', handleKeydown); });
onUnmounted(() => { window.removeEventListener('keydown', handleKeydown); });
</script>
```

**Tab list:** `HOME | PLOTS | FIGURE | APPS | PLUTO NOTEBOOK | VIEW`

**Tab → Component map:**
| Tab | Component |
|---|---|
| HOME | HomeTab.vue |
| PLOTS | PlotsToolbar.vue |
| FIGURE | FigureTab.vue |
| APPS | AppsTab.vue |
| PLUTO NOTEBOOK | LiveEditorTab.vue |
| VIEW | ViewTab.vue |

**Notes:**
- Uses Naive UI `<n-tabs type="card">` — NOT plain CSS ribbon tabs
- `tab-change` event emitted to MainLayout
- F2 toggles ribbon collapse
- Pin button controls `layoutStore.ribbonPinned`
- No INSERT tab present (was removed, LIVE EDITOR renamed PLUTO NOTEBOOK)
- No contextual tab disabling logic present

---

## 4. LAYOUT

### `app/app/src/components/layouts/MainLayout.vue`

Key structural facts:
- Root: `.julialab-root` (flex row: nav-rail 60px + main-content flex-1)
- Active layout engine: **GoldenLayout** (`<DockLayout ref="dockLayoutRef" />`) inside `.panels-area`
- Old Splitpanes layout is present but wrapped in `v-if="false"` (dead code, kept for reference)
- `.panels-area` shown only when `route.name === 'Home' && activeRibbonTab !== 'APPS'`
- APPS tab shows `<AppsGallery>` as a fullscreen overlay replacing panels-area
- Non-Home routes render via `<router-view />` in `.fullscreen-route`
- `handleRestartJulia` calls `invoke('restart_julia_orchestrator')`
- `handleRibbonTabChange(tab)` sets `activeRibbonTab` ref — used to switch APPS view
- Provides `applyDockLayoutPreset` to children via `provide()`

**Splitpanes CSS (global `<style>` block, still active for any splitpanes instances):**
```css
.jl-theme.splitpanes--vertical > .splitpanes__splitter {
  width: 6px; min-width: 6px; z-index: 50; cursor: col-resize;
}
.jl-theme.splitpanes--horizontal > .splitpanes__splitter {
  height: 6px; min-height: 6px; z-index: 50; cursor: row-resize;
}
```

**Panel component map (used by GoldenLayout + legacy splitpanes):**
```ts
panelComponents = {
  FileTree:      FileTreePanel,
  Editor:        EditorView,
  Workspace:     WorkspaceTabsPanel,
  CommandWindow: BottomPanel,
}
```

### GoldenLayout `DEFAULT_CONFIG` (`app/app/src/components/layouts/DockLayout.vue`)

```js
const DEFAULT_CONFIG = {
  settings: {
    reorderEnabled: true,
    constrainDragToContainer: true,
  },
  root: {
    type: 'row',
    content: [
      {
        type: 'column',
        width: 20,
        content: [
          { type: 'component', componentType: 'FileTree',
            title: ' ', isClosable: false },
        ],
      },
      {
        type: 'column',
        width: 55,
        content: [
          { type: 'component', componentType: 'Editor',
            title: ' ', isClosable: false, height: 65 },
          { type: 'component', componentType: 'CommandWindow',
            title: ' ', isClosable: false, height: 35 },
        ],
      },
      {
        type: 'column',
        width: 25,
        content: [
          { type: 'component', componentType: 'Workspace',
            title: ' ', isClosable: false },
        ],
      },
    ],
  },
}
```

**Layout:** FileTree (20%) | Editor (55% top 65%) + CommandWindow (55% bottom 35%) | Workspace (25%)

**`PLACEHOLDER_MODE = false`** — real components are active.

**`buildDockLayoutConfigFromPreset(preset)`** in MainLayout.vue builds a dynamic config from visibility/size presets and calls `dockLayoutRef.value?.loadLayout?.(cfg)` via `applyDockLayoutPreset()`.

---

## 5. TERMINAL

### `app/app/src/components/HomeView/TerminalView.vue`

Full contents: xterm.js-based Julia REPL terminal.

**Key facts:**
- Uses `@xterm/xterm` Terminal + FitAddon + SerializeAddon
- Listens for Tauri events: `julia:output`, `julia:error`, `communication:session-status`, `julia-calculation-complete`, `julia-busy-state`, `orchestrator:startup-ready`, `orchestrator:julia_restart_started`, `orchestrator:julia_restart_completed`
- Input handling: custom `onData` handler buffers chars, sends on `\r`/`\n` via `invoke('execute_julia_code', { code })`
- Startup clear: triggers on `payloadStr.includes('Project activated:')`, clears terminal after 2500ms, writes `julia>` prompt
- Restart flow: `showRestartSpinner()` → overlay with `<n-spin>` → `hideRestartSpinner()` → restarts polling
- Polling: calls `invoke('is_backend_ready')` every 1s until true, then enables input
- State persistence: `SerializeAddon.serialize()` → `terminalStore.setTerminalSerializedState()`
- Theme: light (white bg, black text) vs dark toggled via `data-theme` MutationObserver
- Clipboard: Ctrl+Shift+V paste, Ctrl+Shift+C copy, right-click paste via `paste` event
- Workspace refresh: debounced 600ms after any `julia>` prompt via `invoke('refresh_workspace_variables')`
- Multi-line paste: splits on `\r?\n`, executes each line with 100ms delay

---

## 6. ACTORS

### Orchestrator: `app/internals/src/actors/orchestrator_actor/handlers.rs`

Contains `restart_julia` handler at line 104:

```rust
impl Handler<RestartJuliaOrchestrator> for OrchestratorActor {
    type Result = Result<(), String>;

    fn handle(&mut self, _msg: RestartJuliaOrchestrator, ctx: &mut Context<Self>) -> Self::Result {
        debug!("OrchestratorActor: Received RestartJuliaOrchestrator message");
        let mut actor = self.clone();
        ctx.spawn(
            async move {
                debug!("OrchestratorActor: Restarting Julia in async task");
                let result = actor.restart_julia().await;
                (result, actor.restart_pending, actor.restart_request_id.clone())
            }
            .into_actor(self)
            .map(|result, act, _ctx| {
                let (_, pending, request_id) = result;
                act.restart_pending = pending;
                act.restart_request_id = request_id;
            })
        );
        Ok(())
    }
}
```

**Other handlers present:** `GetOrchestratorState`, `GetStartupPhase`, `GetCurrentProject`, `ContinueOrchestratorStartup`, `FrontendReady`, `ShutdownOrchestrator`, `UpdateCurrentProject`, `ChangeProjectDirectory`, `SetActorAddresses`, `DependencyReady`, `DependencyFailed`, `ResourceAcquired`, `ResourceReleased`, `PerformanceMetric`, `DebugLog`, `JuliaInstallationCompleted`, `ActorError`, `JuliaPipesReady`, `JuliaMessageLoopReady`, `LspReady`, `ProjectActivationComplete`

**Restart finalization** (`JuliaMessageLoopReady` handler, lines 300–341): when `restart_pending == true`, reactivates project via `ActivateProject`, emits `orchestrator:julia_restart_completed`, emits backend-done event.

---

### Process Lifecycle: `app/internals/src/actors/process_actor/lifecycle.rs`

**Sysimage loading (lines 85–122):**
```rust
// Checks: AppData/org.julialab.ide/julialab.{dll|dylib|so}
// Falls back to: exe_dir/resources/julialab.{ext}
// Falls back to: exe_dir/julialab.{ext}
if sysimage_path.exists() {
    command.arg(format!("--sysimage={}", sysimage_path.to_string_lossy()));
    log::info!("ProcessActor: Loading sysimage from {:?}", sysimage_path);
} else {
    log::info!("ProcessActor: No sysimage found at {:?}, starting without it", sysimage_path);
}
```

**Async Revise + Plots loading (lines 193–244):** Already implemented — both load asynchronously after 500ms sleep:
```rust
tokio::spawn(async move {
    sleep(Duration::from_millis(500)).await;
    // loads "using Revise"
    // then loads "using Plots"
});
```

**Julia environment variables set:**
- `JULIALAB_DATA_DIR` → AppData/org.julialab.ide
- `GKSwstype` → "nul" (suppress GR popup windows)
- `JULIA_DEPOT_PATH` → AppData/org.julialab.ide/depot
- `JULIA_PROJECT` → AppData/org.julialab.ide/julia-env
- `GOOGLE_API_KEY` / `GEMINI_API_KEY` → removed from env

**Julia flags:** `--startup-file=no -t1 --history-file=no`

---

## 7. THEME

### `app/app/src/styles/theme.css`

```css
/* ===================================================================
   MATLAB-Inspired Light Theme (Default)
   =================================================================== */
:root {
  /* Accent colors (Julia branding) */
  --jl-accent-green:  #389826;
  --jl-accent-red:    #cb3c33;
  --jl-accent-purple: #9558b2;
  --jl-accent-blue:   #0076A8;

  /* MATLAB header/menu bar colors */
  --jl-matlab-blue:      #005A9C;
  --jl-matlab-blue-dark: #004578;

  /* Light theme backgrounds */
  --jl-bg:            #f5f5f5;
  --jl-panel-bg:      #ffffff;
  --jl-panel-bg-alt:  #f0f0f0;
  --jl-border:        #d0d0d0;
  --jl-border-light:  #e0e0e0;

  /* Panel-specific backgrounds */
  --jl-files-panel-bg:     #ffffff;
  --jl-editor-bg:          #ffffff;
  --jl-terminal-bg:        #ffffff;
  --jl-terminal-header-bg: #E3E3E3;
  --jl-workspace-bg:       #ffffff;

  /* Text */
  --jl-text-primary:   #000000;
  --jl-text-secondary: #505050;
  --jl-text-muted:     #909090;

  /* Fonts */
  --jl-font-mono: 'IBM Plex Mono', 'Cascadia Code', 'Consolas', monospace;
  --jl-font-ui:   'IBM Plex Sans', 'Segoe UI', sans-serif;

  /* Navigation rail */
  --jl-nav-rail-bg:    #E6E6E6;
  --jl-nav-rail-text:  #333333;
  --jl-nav-rail-hover: #B8B8B8;
}

/* === Splitpanes splitter handles === */
.splitpanes__splitter {
  background: var(--jl-border);
  z-index: 50;
  position: relative;
}
.splitpanes--horizontal > .splitpanes__splitter {
  height: 6px;
  cursor: row-resize;
}
.splitpanes--vertical > .splitpanes__splitter {
  width: 6px;
  cursor: col-resize;
}
.splitpanes__splitter:hover {
  background: var(--jl-accent-green);
}

/* === Layout drag-and-drop === */
.panel-header[draggable="true"] { cursor: grab; }
.panel-header[draggable="true"]:active { cursor: grabbing; }
.drag-over {
  outline: 2px dashed var(--jl-accent-green);
  outline-offset: -2px;
}

/* === GoldenLayout drag and drop === */
.lm_dragProxy { opacity: 0.8; z-index: 1000; }
.lm_dragProxy .lm_header { background: var(--jl-panel-bg-alt); }
.lm_dropTargetIndicator {
  outline: 3px solid var(--jl-accent-green);
  outline-offset: -3px;
  background: color-mix(in srgb, var(--jl-accent-green) 15%, transparent);
  transition: opacity 0.1s;
  z-index: 999;
  pointer-events: none;
}
.lm_tab { cursor: pointer !important; user-select: none; }
.lm_goldenlayout, .lm_goldenlayout * { box-sizing: border-box; }
.lm_content { overflow: hidden; }

/* === Dark Theme === */
:root[data-theme="dark"] {
  --jl-bg:            #1a1a1a;
  --jl-panel-bg:      #1e1e1e;
  --jl-panel-bg-alt:  #252525;
  --jl-border:        #222222;
  --jl-border-light:  #2a2a2a;
  --jl-text-primary:  #e0e0e0;
  --jl-text-secondary:#aaaaaa;
  --jl-text-muted:    #555555;
  --jl-nav-rail-bg:   #282828;
  --jl-nav-rail-text: #e0e0e0;
  --jl-nav-rail-hover:#404040;
  --jl-files-panel-bg:     #1e1e1e;
  --jl-editor-bg:          #1e1e1e;
  --jl-terminal-bg:        #1e1e1e;
  --jl-terminal-header-bg: #252525;
  --jl-workspace-bg:       #1e1e1e;
}
```

---

## 8. TASKS

### `spec/tasks.md` — Current State

All tasks shown as unchecked `[ ]`. No tasks have been marked complete.

**Pre-flight:**
- [ ] Confirm Vitest is configured
- [ ] Confirm Julia binary path works
- [ ] Create test directories

**Task 1 — Verify Sysimage Loading** — `[ ]` 5 sub-items  
**Task 2 — Splitpanes Splitter CSS** — `[ ]` 8 sub-items  
**Task 3a — Ribbon Primitives (BLOCKER)** — `[ ]` 7 sub-items  
**Task 3b — PlotsToolbar.vue** — `[ ]` 6 sub-items  
**Task 3c-d — Plot Tauri Commands + Wire RibbonBar** — `[ ]` 7 sub-items  
**Task 4 — Apps Tab** (4a/4b/4c) — `[ ]` ~14 sub-items  
**Task 5 — Live Editor / Pluto** (5a–5f) — `[ ]` ~15 sub-items  
**Task 6 — INSERT Tab** (6a/6b) — `[ ]` ~10 sub-items  
**Task 7A — Async Revise Loading** — `[ ]` 7 sub-items  
**Task 7B — Pkg.instantiate() Staleness Check** — `[ ]` 7 sub-items  
**Final Verification Pass** — `[ ]` 10+ items

> **Note:** Several tasks in `spec/tasks.md` are already partially or fully implemented in the codebase despite remaining unchecked:
> - **T2 (Splitpanes CSS):** 6px splitter rules already present in both `theme.css` and `MainLayout.vue`
> - **T3a (Ribbon Primitives):** `RibbonGroup.vue`, `RibbonButton.vue`, `RibbonToggle.vue` all exist in `app/app/src/components/ribbon/`
> - **T3b (PlotsToolbar):** `PlotsToolbar.vue` exists in `app/app/src/components/ribbon/`
> - **T7A (Async Revise):** Already implemented in `lifecycle.rs` lines 193–244 (tokio::spawn with 500ms sleep)
> - **PLUTO NOTEBOOK tab** exists (was LIVE EDITOR); INSERT tab has been removed from TABS list

---

## 9. KNOWN ISSUES

Grep for `TODO`, `FIXME`, `HACK` across `app/app/src` and `app/internals/src`:

### Vue/TypeScript (`app/app/src`)

| File | Line | Text |
|---|---|---|
| `app/app/src/components/ribbon/HomeTab.vue` | 264 | `newFileTemplate.value = 'function myfunction()\n    # TODO\nend\n'` |
| `app/app/src/components/shared/PkgOperationsDialog.vue` | 659 | `// TODO: Implement package details modal` |

### Rust (`app/internals/src`)

No `TODO`, `FIXME`, or `HACK` comments found.

### Summary

Only 2 TODO items found, both minor:
1. `HomeTab.vue:264` — template string contains a Julia `# TODO` placeholder (intentional, part of new-file boilerplate)
2. `PkgOperationsDialog.vue:659` — package details modal not yet implemented

No FIXME or HACK markers anywhere in the codebase.
