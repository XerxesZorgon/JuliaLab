import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAppStore } from '../store/appStore';
import { invoke } from '@tauri-apps/api/core';
import { useJuliaActions } from './useJuliaActions';

// ── Naive UI mock ────────────────────────────────────────────────────────────
const mockMessage = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  loading: vi.fn().mockReturnValue({ destroy: vi.fn() }),
};

vi.mock('naive-ui', () => ({
  useMessage: () => mockMessage,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────
function makeMonacoGlobal(sourceText: string | null) {
  if (sourceText === null) {
    (window as any).__monaco = {
      Uri: { file: vi.fn().mockReturnValue({}) },
      editor: { getModel: vi.fn().mockReturnValue(null) },
    };
    return;
  }
  const model = { getValue: vi.fn().mockReturnValue(sourceText) };
  (window as any).__monaco = {
    Uri: { file: vi.fn().mockReturnValue({}) },
    editor: { getModel: vi.fn().mockReturnValue(model) },
  };
}

function clearMonacoGlobal() {
  delete (window as any).__monaco;
}

// ────────────────────────────────────────────────────────────────────────────
describe('useJuliaActions', () => {
  let appStore: ReturnType<typeof useAppStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    appStore = useAppStore();
    vi.clearAllMocks();
    // Reset message.loading mock (clearAllMocks resets its implementation too)
    mockMessage.loading.mockReturnValue({ destroy: vi.fn() });
  });

  afterEach(() => {
    clearMonacoGlobal();
  });

  // ── runCell ───────────────────────────────────────────────────────────────
  describe('runCell', () => {
    it('dispatches the julia:run-cell custom event on window', () => {
      const { runCell } = useJuliaActions();

      const listener = vi.fn();
      window.addEventListener('julia:run-cell', listener);
      runCell();
      window.removeEventListener('julia:run-cell', listener);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('dispatches a CustomEvent (not a plain Event)', () => {
      const { runCell } = useJuliaActions();

      let received: Event | null = null;
      window.addEventListener('julia:run-cell', (e) => { received = e; }, { once: true });
      runCell();

      expect(received).toBeInstanceOf(CustomEvent);
    });

    it('does not call invoke', () => {
      const { runCell } = useJuliaActions();
      runCell();
      expect(invoke).not.toHaveBeenCalled();
    });
  });

  // ── runFile ───────────────────────────────────────────────────────────────
  describe('runFile', () => {
    it('calls execute_julia_file with the active tab path', async () => {
      (invoke as any).mockResolvedValue(undefined);
      appStore.setActiveTab('/home/user/project/main.jl');

      const { runFile } = useJuliaActions();
      await runFile();

      expect(invoke).toHaveBeenCalledWith('execute_julia_file', {
        filePath: '/home/user/project/main.jl',
        fileContent: '',
      });
    });

    it('shows a warning and does not invoke when no file is open', async () => {
      appStore.setActiveTab(null);

      const { runFile } = useJuliaActions();
      await runFile();

      expect(invoke).not.toHaveBeenCalled();
      expect(mockMessage.warning).toHaveBeenCalledWith('No file is currently open');
    });

    it('shows an error message when invoke rejects', async () => {
      (invoke as any).mockRejectedValue(new Error('Julia process not ready'));
      appStore.setActiveTab('/home/user/project/main.jl');

      const { runFile } = useJuliaActions();
      await runFile();

      expect(mockMessage.error).toHaveBeenCalledWith('Failed to run file');
    });
  });

  // ── saveFile ──────────────────────────────────────────────────────────────
  describe('saveFile', () => {
    it('dispatches the save-current-file custom event', () => {
      const { saveFile } = useJuliaActions();

      const listener = vi.fn();
      window.addEventListener('save-current-file', listener);
      saveFile();
      window.removeEventListener('save-current-file', listener);

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  // ── formatFile ────────────────────────────────────────────────────────────
  describe('formatFile', () => {
    it('calls format_code with the current editor content', async () => {
      (invoke as any).mockResolvedValue('formatted code\n');
      appStore.setActiveTab('/home/user/project/script.jl');
      makeMonacoGlobal('x=1\ny=2');

      const { formatFile } = useJuliaActions();
      await formatFile();

      expect(invoke).toHaveBeenCalledWith('format_code', { sourceText: 'x=1\ny=2' });
    });

    it('dispatches editor:apply-formatted-content with the formatted text', async () => {
      (invoke as any).mockResolvedValue('x = 1\ny = 2\n');
      appStore.setActiveTab('/home/user/project/script.jl');
      makeMonacoGlobal('x=1\ny=2');

      const events: CustomEvent[] = [];
      const handler = (e: Event) => events.push(e as CustomEvent);
      window.addEventListener('editor:apply-formatted-content', handler);

      const { formatFile } = useJuliaActions();
      await formatFile();

      window.removeEventListener('editor:apply-formatted-content', handler);

      expect(events).toHaveLength(1);
      expect(events[0].detail.content).toBe('x = 1\ny = 2\n');
      expect(events[0].detail.filePath).toBe('/home/user/project/script.jl');
    });

    it('shows a warning when no file is open', async () => {
      appStore.setActiveTab(null);

      const { formatFile } = useJuliaActions();
      await formatFile();

      expect(invoke).not.toHaveBeenCalledWith('format_code', expect.anything());
      expect(mockMessage.warning).toHaveBeenCalledWith('No file is currently open');
    });

    it('shows a warning when the editor model is not available', async () => {
      appStore.setActiveTab('/home/user/project/script.jl');
      makeMonacoGlobal(null);

      const { formatFile } = useJuliaActions();
      await formatFile();

      expect(invoke).not.toHaveBeenCalledWith('format_code', expect.anything());
      expect(mockMessage.warning).toHaveBeenCalledWith(
        'Could not read editor content – save the file first',
      );
    });

    it('shows a warning when formatter returns empty result', async () => {
      (invoke as any).mockResolvedValue('');
      appStore.setActiveTab('/home/user/project/script.jl');
      makeMonacoGlobal('x = 1');

      const { formatFile } = useJuliaActions();
      await formatFile();

      expect(mockMessage.warning).toHaveBeenCalledWith(
        'Formatter returned empty result – source unchanged',
      );
    });

    it('shows an error when format_code invoke rejects', async () => {
      (invoke as any).mockRejectedValue(new Error('JuliaFormatter not available'));
      appStore.setActiveTab('/home/user/project/script.jl');
      makeMonacoGlobal('x = 1');

      const { formatFile } = useJuliaActions();
      await formatFile();

      expect(mockMessage.error).toHaveBeenCalledWith(
        expect.stringContaining('Format failed'),
      );
    });
  });

  // ── clearWorkspace ────────────────────────────────────────────────────────
  describe('clearWorkspace', () => {
    it('calls restart_julia to clear the workspace', async () => {
      (invoke as any).mockResolvedValue(undefined);

      const { clearWorkspace } = useJuliaActions();
      await clearWorkspace();

      expect(invoke).toHaveBeenCalledWith('restart_julia');
      expect(mockMessage.success).toHaveBeenCalledWith('Workspace cleared (Julia restarted)');
    });

    it('shows an error when restart_julia rejects', async () => {
      (invoke as any).mockRejectedValue(new Error('Process not running'));

      const { clearWorkspace } = useJuliaActions();
      await clearWorkspace();

      expect(mockMessage.error).toHaveBeenCalledWith('Failed to clear workspace');
    });
  });
});
