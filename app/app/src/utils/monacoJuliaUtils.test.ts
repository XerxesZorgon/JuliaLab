import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  getCellBounds,
  JULIA_UNICODE_SYMBOLS,
  setupRunCellCommand,
  setupCellHighlighting,
} from './monacoJuliaUtils';

// monaco-editor is aliased to src/test/__mocks__/monaco-editor.ts in vitest.config.ts
// — no vi.mock() needed here.

// ── Editor factory ───────────────────────────────────────────────────────────
function createMockEditor(lines: string[], cursorLine = 1) {
  let cursorCallback: (() => void) | null = null;

  const editor = {
    getPosition: vi.fn().mockReturnValue({ lineNumber: cursorLine, column: 1 }),
    getModel: vi.fn().mockReturnValue({
      getLinesContent: vi.fn().mockReturnValue(lines),
      getLineMaxColumn: vi.fn().mockImplementation((line: number) =>
        (lines[line - 1]?.length ?? 0) + 1,
      ),
    }),
    addAction: vi.fn(),
    deltaDecorations: vi.fn().mockReturnValue([]),
    onDidChangeCursorPosition: vi.fn().mockImplementation((cb: () => void) => {
      cursorCallback = cb;
      return { dispose: vi.fn() };
    }),
    // Helper to simulate a cursor move in tests
    _triggerCursorChange: () => cursorCallback?.(),
  };

  return editor;
}

// ────────────────────────────────────────────────────────────────────────────
describe('getCellBounds', () => {
  // ── No markers ────────────────────────────────────────────────────────────
  describe('when there are no ## markers', () => {
    it('returns the whole document for a single-line file', () => {
      expect(getCellBounds(['x = 1'], 0)).toEqual({ startLine: 1, endLine: 1 });
    });

    it('returns the whole document for a multi-line file', () => {
      const lines = ['x = 1', 'y = 2', 'z = 3'];
      expect(getCellBounds(lines, 0)).toEqual({ startLine: 1, endLine: 3 });
      expect(getCellBounds(lines, 1)).toEqual({ startLine: 1, endLine: 3 });
      expect(getCellBounds(lines, 2)).toEqual({ startLine: 1, endLine: 3 });
    });
  });

  // ── Single ## divider ─────────────────────────────────────────────────────
  describe('with one ## divider', () => {
    const lines = ['x = 1', 'y = 2', '## Section 2', 'z = 3', 'w = 4'];

    it('cursor in first cell returns lines before the divider', () => {
      expect(getCellBounds(lines, 0)).toEqual({ startLine: 1, endLine: 2 });
      expect(getCellBounds(lines, 1)).toEqual({ startLine: 1, endLine: 2 });
    });

    it('cursor in second cell returns lines after the divider', () => {
      expect(getCellBounds(lines, 3)).toEqual({ startLine: 4, endLine: 5 });
      expect(getCellBounds(lines, 4)).toEqual({ startLine: 4, endLine: 5 });
    });

    it('cursor on the ## line itself produces an empty cell (startLine > endLine)', () => {
      const { startLine, endLine } = getCellBounds(lines, 2);
      expect(startLine).toBeGreaterThan(endLine);
    });
  });

  // ── Multiple ## dividers ──────────────────────────────────────────────────
  describe('with multiple ## dividers', () => {
    const lines = [
      '## Cell 1',  // 0
      'a = 1',      // 1
      'b = 2',      // 2
      '## Cell 2',  // 3
      'c = 3',      // 4
      '## Cell 3',  // 5
      'd = 4',      // 6
    ];

    it('correctly identifies the first cell (opens at line 1)', () => {
      // Cursor after the opening ## (line index 1 or 2)
      expect(getCellBounds(lines, 1)).toEqual({ startLine: 2, endLine: 3 });
      expect(getCellBounds(lines, 2)).toEqual({ startLine: 2, endLine: 3 });
    });

    it('correctly identifies the middle cell', () => {
      expect(getCellBounds(lines, 4)).toEqual({ startLine: 5, endLine: 5 });
    });

    it('correctly identifies the last cell (no closing ##)', () => {
      expect(getCellBounds(lines, 6)).toEqual({ startLine: 7, endLine: 7 });
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('handles a file that starts with a ## marker', () => {
      const lines = ['## Header', 'x = 1'];
      // cursor at index 1 ("x = 1") — cell starts after the ##
      expect(getCellBounds(lines, 1)).toEqual({ startLine: 2, endLine: 2 });
    });

    it('handles a file that ends with a ## marker', () => {
      const lines = ['x = 1', '##'];
      // cursor at index 0 — cell ends before the ##
      expect(getCellBounds(lines, 0)).toEqual({ startLine: 1, endLine: 1 });
    });

    it('handles ## with extra spaces or text after the marker', () => {
      const lines = ['## Cell title', 'x = 1', '##   Another', 'y = 2'];
      expect(getCellBounds(lines, 1)).toEqual({ startLine: 2, endLine: 2 });
      expect(getCellBounds(lines, 3)).toEqual({ startLine: 4, endLine: 4 });
    });

    it('ignores single # comments — they are not cell delimiters', () => {
      const lines = ['# regular comment', 'x = 1'];
      // Without a ## marker the whole file is one cell
      expect(getCellBounds(lines, 0)).toEqual({ startLine: 1, endLine: 2 });
      expect(getCellBounds(lines, 1)).toEqual({ startLine: 1, endLine: 2 });
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe('JULIA_UNICODE_SYMBOLS', () => {
  it('maps common Greek lowercase letters', () => {
    expect(JULIA_UNICODE_SYMBOLS['alpha']).toBe('α');
    expect(JULIA_UNICODE_SYMBOLS['beta']).toBe('β');
    expect(JULIA_UNICODE_SYMBOLS['gamma']).toBe('γ');
    expect(JULIA_UNICODE_SYMBOLS['delta']).toBe('δ');
    expect(JULIA_UNICODE_SYMBOLS['omega']).toBe('ω');
    expect(JULIA_UNICODE_SYMBOLS['pi']).toBe('π');
    expect(JULIA_UNICODE_SYMBOLS['sigma']).toBe('σ');
  });

  it('maps common Greek uppercase letters', () => {
    expect(JULIA_UNICODE_SYMBOLS['Gamma']).toBe('Γ');
    expect(JULIA_UNICODE_SYMBOLS['Delta']).toBe('Δ');
    expect(JULIA_UNICODE_SYMBOLS['Omega']).toBe('Ω');
    expect(JULIA_UNICODE_SYMBOLS['Sigma']).toBe('Σ');
  });

  it('maps math symbols', () => {
    expect(JULIA_UNICODE_SYMBOLS['sqrt']).toBe('√');
    expect(JULIA_UNICODE_SYMBOLS['approx']).toBe('≈');
    expect(JULIA_UNICODE_SYMBOLS['infty']).toBe('∞');
    expect(JULIA_UNICODE_SYMBOLS['sum']).toBe('∑');
    expect(JULIA_UNICODE_SYMBOLS['nabla']).toBe('∇');
    expect(JULIA_UNICODE_SYMBOLS['partial']).toBe('∂');
    expect(JULIA_UNICODE_SYMBOLS['in']).toBe('∈');
    expect(JULIA_UNICODE_SYMBOLS['forall']).toBe('∀');
    expect(JULIA_UNICODE_SYMBOLS['exists']).toBe('∃');
  });

  it('maps arrow symbols', () => {
    expect(JULIA_UNICODE_SYMBOLS['rightarrow']).toBe('→');
    expect(JULIA_UNICODE_SYMBOLS['leftarrow']).toBe('←');
    expect(JULIA_UNICODE_SYMBOLS['leftrightarrow']).toBe('↔');
  });

  it('maps comparison / arithmetic operators', () => {
    expect(JULIA_UNICODE_SYMBOLS['le']).toBe('≤');
    expect(JULIA_UNICODE_SYMBOLS['ge']).toBe('≥');
    expect(JULIA_UNICODE_SYMBOLS['neq']).toBe('≠');
    expect(JULIA_UNICODE_SYMBOLS['pm']).toBe('±');
    expect(JULIA_UNICODE_SYMBOLS['times']).toBe('×');
    expect(JULIA_UNICODE_SYMBOLS['div']).toBe('÷');
  });

  it('all values are non-empty single Unicode characters or symbols', () => {
    for (const [key, value] of Object.entries(JULIA_UNICODE_SYMBOLS)) {
      expect(value.length, `Symbol '${key}' should be at least 1 char`).toBeGreaterThanOrEqual(1);
      expect(typeof value, `Symbol '${key}' value should be a string`).toBe('string');
    }
  });

  it('contains at least 40 symbols', () => {
    expect(Object.keys(JULIA_UNICODE_SYMBOLS).length).toBeGreaterThanOrEqual(40);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe('setupRunCellCommand', () => {
  let activeCleanup: (() => void) | null = null;

  beforeEach(() => { vi.clearAllMocks(); activeCleanup = null; });
  afterEach(() => { activeCleanup?.(); activeCleanup = null; });

  it('registers the julia-run-cell editor action', async () => {
    const { setupRunCellCommand } = await import('./monacoJuliaUtils');
    const editor = createMockEditor(['x = 1']);

    activeCleanup = setupRunCellCommand(editor as any, '/test.jl');

    expect(editor.addAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'julia-run-cell' }),
    );
  });

  it('returns a cleanup function that removes the window event listener', async () => {
    const { setupRunCellCommand } = await import('./monacoJuliaUtils');
    const editor = createMockEditor(['x = 1']);

    const cleanup = setupRunCellCommand(editor as any, '/test.jl');
    expect(typeof cleanup).toBe('function');

    // After cleanup, dispatching the event should NOT trigger invoke
    cleanup();
    vi.clearAllMocks();
    window.dispatchEvent(new CustomEvent('julia:run-cell'));
    await new Promise((r) => setTimeout(r, 0)); // flush microtasks
    expect(invoke).not.toHaveBeenCalled();
  });

  it('dispatching julia:run-cell calls invoke execute_code with cell content', async () => {
    const { setupRunCellCommand } = await import('./monacoJuliaUtils');
    (invoke as any).mockResolvedValue(undefined);

    const lines = ['## Cell 1', 'x = 42', 'y = x + 1', '## Cell 2', 'z = 0'];
    const editor = createMockEditor(lines, 2); // cursor on "x = 42" (line 2)

    const cleanup = setupRunCellCommand(editor as any, '/test.jl');
    window.dispatchEvent(new CustomEvent('julia:run-cell'));
    await new Promise((r) => setTimeout(r, 0));

    expect(invoke).toHaveBeenCalledWith('execute_code', {
      code: 'x = 42\ny = x + 1',
      executionType: 'repl_execution',
      filePath: '/test.jl',
    });

    cleanup();
  });

  it('does nothing when the cell is empty', async () => {
    const { setupRunCellCommand } = await import('./monacoJuliaUtils');
    (invoke as any).mockResolvedValue(undefined);

    // Cursor sitting directly on a ## marker — empty cell
    const lines = ['## Only marker'];
    const editor = createMockEditor(lines, 1);

    const cleanup = setupRunCellCommand(editor as any);
    window.dispatchEvent(new CustomEvent('julia:run-cell'));
    await new Promise((r) => setTimeout(r, 0));

    expect(invoke).not.toHaveBeenCalled();
    cleanup();
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe('setupCellHighlighting', () => {
  it('calls onDidChangeCursorPosition to register a listener', async () => {
    const { setupCellHighlighting } = await import('./monacoJuliaUtils');
    const editor = createMockEditor(['x = 1', 'y = 2']);

    setupCellHighlighting(editor as any);

    expect(editor.onDidChangeCursorPosition).toHaveBeenCalledTimes(1);
  });

  it('returns a disposable object', async () => {
    const { setupCellHighlighting } = await import('./monacoJuliaUtils');
    const editor = createMockEditor(['x = 1']);

    const disposable = setupCellHighlighting(editor as any);

    expect(disposable).toBeDefined();
    expect(typeof disposable.dispose).toBe('function');
  });

  it('applies decorations immediately on setup', async () => {
    const { setupCellHighlighting } = await import('./monacoJuliaUtils');
    const editor = createMockEditor(['x = 1', 'y = 2']);

    setupCellHighlighting(editor as any);

    // deltaDecorations is called once on setup (initial highlight)
    expect(editor.deltaDecorations).toHaveBeenCalled();
  });

  it('updates decorations when cursor moves', async () => {
    const { setupCellHighlighting } = await import('./monacoJuliaUtils');
    const editor = createMockEditor(['## A', 'x = 1', '## B', 'y = 2']);

    setupCellHighlighting(editor as any);
    const callsBefore = (editor.deltaDecorations as any).mock.calls.length;

    editor._triggerCursorChange();

    expect((editor.deltaDecorations as any).mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('clears decorations when model is unavailable', async () => {
    const { setupCellHighlighting } = await import('./monacoJuliaUtils');

    const editor = {
      getPosition: vi.fn().mockReturnValue(null),
      getModel: vi.fn().mockReturnValue(null),
      deltaDecorations: vi.fn().mockReturnValue([]),
      onDidChangeCursorPosition: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    };

    setupCellHighlighting(editor as any);

    // deltaDecorations called with empty new-decorations array (clear)
    expect(editor.deltaDecorations).toHaveBeenCalledWith(expect.anything(), []);
  });
});
