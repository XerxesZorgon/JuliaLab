import { invoke } from '@tauri-apps/api/core';
import { useMessage } from 'naive-ui';
import { useAppStore } from '../store/appStore';

export function useJuliaActions() {
  const appStore = useAppStore();
  const message = useMessage();

  const runFile = async () => {
    const filePath = appStore.activeTab;
    if (!filePath) {
      message.warning('No file is currently open');
      return;
    }
    try {
      await invoke('execute_julia_file', { filePath, fileContent: '' });
    } catch (err) {
      console.error('useJuliaActions: Failed to run file:', err);
      message.error('Failed to run file');
    }
  };

  const saveFile = () => {
    window.dispatchEvent(new CustomEvent('save-current-file'));
  };

  const formatFile = async () => {
    const filePath = appStore.activeTab;
    if (!filePath) {
      message.warning('No file is currently open');
      return;
    }

    try {
      // Get the current content directly from the Monaco editor model so that
      // unsaved in-memory edits are also formatted (not just the on-disk file).
      let sourceText: string | null = null;

      // Monaco exposes its models on the global window.__monaco object when
      // EditorView mounts it. We query by uri to get the active model.
      const monacoGlobal = (window as any).__monaco;
      if (monacoGlobal) {
        const uri = monacoGlobal.Uri.file(filePath);
        const model = monacoGlobal.editor.getModel(uri);
        if (model) {
          sourceText = model.getValue();
        }
      }

      if (sourceText === null) {
        message.warning('Could not read editor content – save the file first');
        return;
      }

      const loading = message.loading('Formatting with JuliaFormatter…', { duration: 0 });

      const formatted: string = await invoke('format_code', { sourceText });

      loading.destroy();

      if (!formatted || formatted.trim() === '') {
        message.warning('Formatter returned empty result – source unchanged');
        return;
      }

      // Push the formatted result back into the Monaco model.
      // EditorView listens for this custom event and applies it as a
      // single undoable edit so Ctrl+Z works correctly.
      window.dispatchEvent(
        new CustomEvent('editor:apply-formatted-content', {
          detail: { filePath, content: formatted },
        }),
      );

      message.success('Code formatted');
    } catch (err: any) {
      console.error('useJuliaActions: format_code failed:', err);
      const detail = typeof err === 'string' ? err : (err?.message ?? String(err));
      message.error(`Format failed: ${detail}`);
    }
  };

  const runCell = () => {
    window.dispatchEvent(new CustomEvent('julia:run-cell'));
  };

  const clearWorkspace = async () => {
    try {
      await invoke('restart_julia');
      message.success('Workspace cleared (Julia restarted)');
    } catch (err) {
      console.error('useJuliaActions: Failed to clear workspace:', err);
      message.error('Failed to clear workspace');
    }
  };

  return { runFile, runCell, saveFile, formatFile, clearWorkspace };
}
