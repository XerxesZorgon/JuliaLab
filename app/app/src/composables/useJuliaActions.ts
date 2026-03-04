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
      await invoke('execute_julia_code', {
        code: `using JuliaFormatter; format_file(raw"${filePath}")`,
        command_type: 'silent',
      });
    } catch (err) {
      console.error('useJuliaActions: Failed to format file:', err);
      message.error('Failed to format file');
    }
  };

  return { runFile, saveFile, formatFile };
}
