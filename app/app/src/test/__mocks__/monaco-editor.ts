/**
 * Minimal monaco-editor stub for Vitest.
 *
 * The real monaco-editor has no resolvable package entry in Vite's dev
 * resolver, so we alias all test-time imports to this file.
 */
import { vi } from 'vitest';

export class Range {
  constructor(
    public startLineNumber: number,
    public startColumn: number,
    public endLineNumber: number,
    public endColumn: number,
  ) {}
}

export const editor = {
  OverviewRulerLane: { Left: 1 },
};

export const languages = {
  registerCompletionItemProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  CompletionItemKind: { Variable: 4 },
};

export const KeyMod = { CtrlCmd: 2048 };
export const KeyCode = { Enter: 3 };
