import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLayoutStore = defineStore('layout', () => {
  // Panel visibility
  const showFilesPanel = ref(true);
  const showTerminalPanel = ref(true);
  const showWorkspacePanel = ref(true);

  // Ribbon state
  const ribbonVisible = ref(true);
  const ribbonPinned = ref(true);

  function toggleFilesPanel() {
    showFilesPanel.value = !showFilesPanel.value;
  }

  function toggleTerminalPanel() {
    showTerminalPanel.value = !showTerminalPanel.value;
  }

  function toggleWorkspacePanel() {
    showWorkspacePanel.value = !showWorkspacePanel.value;
  }

  function toggleRibbon() {
    ribbonVisible.value = !ribbonVisible.value;
  }

  return {
    showFilesPanel,
    showTerminalPanel,
    showWorkspacePanel,
    ribbonVisible,
    ribbonPinned,
    toggleFilesPanel,
    toggleTerminalPanel,
    toggleWorkspacePanel,
    toggleRibbon,
  };
});
