import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type WorkspaceZone = 'right' | 'bottom';
export type FilesZone = 'left' | 'bottom';

export interface PaneSizes {
  left: number;
  center: number;
  right: number;
  ai: number;
  editor: number;
  terminal: number;
  workspaceBottom: number;
  filesBottom: number;
}

export interface SavedLayout {
  id: string;
  name: string;
  sizes: PaneSizes;
  visibility: { files: boolean; terminal: boolean; workspace: boolean; ai: boolean };
  activeRightTab: string;
  workspaceZone?: WorkspaceZone;
  builtIn?: boolean;
  createdAt: number;
}

const DEFAULT_SIZES: PaneSizes = {
  left: 18, center: 60, right: 22, ai: 20, editor: 65, terminal: 35, workspaceBottom: 30, filesBottom: 25,
};

const ZONE_KEY = 'julialab:workspace-zone';
const FILES_ZONE_KEY = 'julialab:files-zone';

function loadWorkspaceZone(): WorkspaceZone {
  try {
    const v = localStorage.getItem(ZONE_KEY);
    if (v === 'right' || v === 'bottom') return v;
  } catch { /* ignore */ }
  return 'right';
}

function loadFilesZone(): FilesZone {
  try {
    const v = localStorage.getItem(FILES_ZONE_KEY);
    if (v === 'left' || v === 'bottom') return v;
  } catch { /* ignore */ }
  return 'left';
}

export const BUILTIN_LAYOUTS: SavedLayout[] = [
  {
    id: 'default', name: 'Default', builtIn: true, createdAt: 0,
    sizes: { left: 18, center: 60, right: 22, ai: 20, editor: 65, terminal: 35, workspaceBottom: 30, filesBottom: 25 },
    visibility: { files: true, terminal: true, workspace: true, ai: false },
    activeRightTab: 'workspace',
  },
  {
    id: 'editor-focus', name: 'Editor Focus', builtIn: true, createdAt: 0,
    sizes: { left: 18, center: 60, right: 22, ai: 20, editor: 65, terminal: 35, workspaceBottom: 30, filesBottom: 25 },
    visibility: { files: false, terminal: false, workspace: false, ai: false },
    activeRightTab: 'workspace',
  },
  {
    id: 'command-window', name: 'Command Window Focus', builtIn: true, createdAt: 0,
    sizes: { left: 18, center: 60, right: 22, ai: 20, editor: 40, terminal: 60, workspaceBottom: 30, filesBottom: 25 },
    visibility: { files: true, terminal: true, workspace: true, ai: false },
    activeRightTab: 'workspace',
  },
  {
    id: 'wide-workspace', name: 'Wide Workspace', builtIn: true, createdAt: 0,
    sizes: { left: 14, center: 50, right: 36, ai: 20, editor: 65, terminal: 35, workspaceBottom: 30, filesBottom: 25 },
    visibility: { files: true, terminal: true, workspace: true, ai: false },
    activeRightTab: 'workspace',
  },
  {
    id: 'all-panels', name: 'All Panels', builtIn: true, createdAt: 0,
    sizes: { left: 15, center: 47, right: 20, ai: 18, editor: 65, terminal: 35, workspaceBottom: 30, filesBottom: 25 },
    visibility: { files: true, terminal: true, workspace: true, ai: true },
    activeRightTab: 'workspace',
  },
];

const LAYOUTS_KEY = 'julialab:saved-layouts';
const SIZES_KEY = 'julialab:pane-sizes';

function loadSizes(): PaneSizes {
  try {
    const raw = localStorage.getItem(SIZES_KEY);
    if (raw) return { ...DEFAULT_SIZES, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SIZES };
}

function loadUserLayouts(): SavedLayout[] {
  try {
    const raw = localStorage.getItem(LAYOUTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export const useLayoutStore = defineStore('layout', () => {
  // Panel visibility
  const showFilesPanel = ref(true);
  const showTerminalPanel = ref(true);
  const showWorkspacePanel = ref(true);
  const showAiPanel = ref(false);
  const showCheatSheet = ref(false);

  // Ribbon state
  const ribbonVisible = ref(true);
  const ribbonPinned = ref(true);

  // Active tab in right panel — shared so plots/methods can switch it
  const activeRightTab = ref('workspace');

  // Where the workspace/plots/methods panel lives
  const workspaceZone = ref<WorkspaceZone>(loadWorkspaceZone());

  // Where the files panel lives
  const filesZone = ref<FilesZone>(loadFilesZone());

  // Pane sizes — persisted to localStorage
  const paneSizes = ref<PaneSizes>(loadSizes());

  // User-saved layouts — persisted to localStorage
  const userLayouts = ref<SavedLayout[]>(loadUserLayouts());

  // Persist sizes whenever they change
  watch(paneSizes, (s) => {
    try { localStorage.setItem(SIZES_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }, { deep: true });

  // Persist workspaceZone whenever it changes
  watch(workspaceZone, (z) => {
    try { localStorage.setItem(ZONE_KEY, z); } catch { /* ignore */ }
  });

  // Persist filesZone whenever it changes
  watch(filesZone, (z) => {
    try { localStorage.setItem(FILES_ZONE_KEY, z); } catch { /* ignore */ }
  });

  // Persist user layouts whenever they change
  watch(userLayouts, (l) => {
    try { localStorage.setItem(LAYOUTS_KEY, JSON.stringify(l)); } catch { /* ignore */ }
  }, { deep: true });

  function toggleFilesPanel() { showFilesPanel.value = !showFilesPanel.value; }
  function toggleTerminalPanel() { showTerminalPanel.value = !showTerminalPanel.value; }
  function toggleWorkspacePanel() { showWorkspacePanel.value = !showWorkspacePanel.value; }
  function toggleAiPanel() { showAiPanel.value = !showAiPanel.value; }
  function toggleCheatSheet() { showCheatSheet.value = !showCheatSheet.value; }

  function toggleRibbon() {
    if (ribbonPinned.value) {
      ribbonPinned.value = false;
      ribbonVisible.value = false;
    } else {
      ribbonVisible.value = !ribbonVisible.value;
    }
  }

  function applyLayout(layout: SavedLayout) {
    paneSizes.value = { ...DEFAULT_SIZES, ...layout.sizes };
    showFilesPanel.value = layout.visibility.files;
    showTerminalPanel.value = layout.visibility.terminal;
    showWorkspacePanel.value = layout.visibility.workspace;
    showAiPanel.value = layout.visibility.ai;
    activeRightTab.value = layout.activeRightTab;
    if (layout.workspaceZone) workspaceZone.value = layout.workspaceZone;
  }

  function saveCurrentLayout(name: string): SavedLayout {
    const layout: SavedLayout = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      createdAt: Date.now(),
      sizes: { ...paneSizes.value },
      visibility: {
        files: showFilesPanel.value,
        terminal: showTerminalPanel.value,
        workspace: showWorkspacePanel.value,
        ai: showAiPanel.value,
      },
      activeRightTab: activeRightTab.value,
      workspaceZone: workspaceZone.value,
    };
    userLayouts.value = [...userLayouts.value, layout];
    return layout;
  }

  function deleteLayout(id: string) {
    userLayouts.value = userLayouts.value.filter(l => l.id !== id);
  }

  function updateLayoutName(id: string, newName: string) {
    const idx = userLayouts.value.findIndex(l => l.id === id);
    if (idx >= 0) {
      const layouts = [...userLayouts.value];
      layouts[idx] = { ...layouts[idx], name: newName.trim() };
      userLayouts.value = layouts;
    }
  }

  // --- Panel slot assignments (which component occupies which zone) ---
  // Used by LayoutPicker presets and Step 1a-6 drag-to-swap.
  const PANEL_SLOT_KEY = 'julialab:panel-slots';
  const DEFAULT_SLOTS: Record<string, string> = {
    left: 'FileTree',
    center: 'Editor',
    right: 'Workspace',
    bottom: 'CommandWindow',
  };

  function loadPanelSlots(): Record<string, string> {
    try {
      const raw = localStorage.getItem(PANEL_SLOT_KEY);
      if (raw) return { ...DEFAULT_SLOTS, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return { ...DEFAULT_SLOTS };
  }

  const panelSlots = ref<Record<string, string>>(loadPanelSlots());

  watch(panelSlots, (s) => {
    try { localStorage.setItem(PANEL_SLOT_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }, { deep: true });

  const draggedPanel = ref<string | null>(null);
  const dropTargetZone = ref<string | null>(null);

  function swapPanels(zoneA: string, zoneB: string) {
    const tmp = panelSlots.value[zoneA];
    panelSlots.value[zoneA] = panelSlots.value[zoneB];
    panelSlots.value[zoneB] = tmp;
  }

  // Extend applyLayout to also reset panel slots when a named preset is applied.
  // Built-in layouts use the canonical slot order; user layouts preserve current slots.
  function applyPreset(layout: SavedLayout) {
    applyLayout(layout);
    if (layout.builtIn) {
      panelSlots.value = { ...DEFAULT_SLOTS };
    }
  }

  return {
    showFilesPanel, showTerminalPanel, showWorkspacePanel, showAiPanel, showCheatSheet,
    ribbonVisible, ribbonPinned,
    activeRightTab, paneSizes, userLayouts, workspaceZone, filesZone,
    panelSlots, draggedPanel, dropTargetZone,
    toggleFilesPanel, toggleTerminalPanel, toggleWorkspacePanel, toggleAiPanel,
    toggleCheatSheet, toggleRibbon,
    applyLayout, applyPreset, saveCurrentLayout, deleteLayout, updateLayoutName, swapPanels,
  };
});
