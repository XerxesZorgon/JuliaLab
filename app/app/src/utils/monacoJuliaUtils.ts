import * as monaco from 'monaco-editor';
import { invoke } from '@tauri-apps/api/core';

/**
 * Julia Unicode Symbols Mapping
 * A subset of common LaTeX-style symbols used in Julia
 */
export const JULIA_UNICODE_SYMBOLS: Record<string, string> = {
    'alpha': 'α',
    'beta': 'β',
    'gamma': 'γ',
    'delta': 'δ',
    'epsilon': 'ε',
    'zeta': 'ζ',
    'eta': 'η',
    'theta': 'θ',
    'iota': 'ι',
    'kappa': 'κ',
    'lambda': 'λ',
    'mu': 'μ',
    'nu': 'ν',
    'xi': 'ξ',
    'pi': 'π',
    'rho': 'ρ',
    'sigma': 'σ',
    'tau': 'τ',
    'upsilon': 'υ',
    'phi': 'φ',
    'chi': 'χ',
    'psi': 'ψ',
    'omega': 'ω',
    'Gamma': 'Γ',
    'Delta': 'Δ',
    'Theta': 'Θ',
    'Lambda': 'Λ',
    'Xi': 'Ξ',
    'Pi': 'Π',
    'Sigma': 'Σ',
    'Upsilon': 'Υ',
    'Phi': 'Φ',
    'Psi': 'Ψ',
    'Omega': 'Ω',
    'sqrt': '√',
    'approx': '≈',
    'neq': '≠',
    'le': '≤',
    'ge': '≥',
    'pm': '±',
    'times': '×',
    'div': '÷',
    'infty': '∞',
    'nabla': '∇',
    'partial': '∂',
    'sum': '∑',
    'prod': '∏',
    'int': '∫',
    'in': '∈',
    'notin': '∉',
    'ni': '∋',
    'subseteq': '⊆',
    'supseteq': '⊇',
    'cap': '∩',
    'cup': '∪',
    'forall': '∀',
    'exists': '∃',
    'rightarrow': '→',
    'leftarrow': '←',
    'uparrow': '↑',
    'downarrow': '↓',
    'leftrightarrow': '↔',
    'cdot': '⋅',
    'circ': '∘',
    'wedge': '∧',
    'vee': '∨',
};

let completionsRegistered = false;

/**
 * Registers a custom completion provider for Julia Unicode symbols
 */
export function registerJuliaUnicodeProvider() {
    if (completionsRegistered) return;

    monaco.languages.registerCompletionItemProvider('julia', {
        triggerCharacters: ['\\'],
        provideCompletionItems: (model, position) => {
            const textUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
            });

            const match = textUntilPosition.match(/\\([a-zA-Z]*)$/);
            if (!match) {
                return { suggestions: [] };
            }

            const word = match[1];
            const suggestions: monaco.languages.CompletionItem[] = [];

            for (const [key, value] of Object.entries(JULIA_UNICODE_SYMBOLS)) {
                if (key.startsWith(word)) {
                    suggestions.push({
                        label: `\\${key} (${value})`,
                        kind: monaco.languages.CompletionItemKind.Variable,
                        insertText: value,
                        detail: `Unicode symbol: ${value}`,
                        range: {
                            startLineNumber: position.lineNumber,
                            startColumn: position.column - word.length - 1,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column,
                        },
                        // Sort to ensure best matches at top
                        sortText: key,
                    });
                }
            }

            return { suggestions };
        },
    });

    completionsRegistered = true;
}

/**
 * Finds the line boundaries (1-based, inclusive) of the cell containing the given line.
 * A cell is the region between two ## marker lines.
 * Exported for unit testing.
 */
export function getCellBounds(lines: string[], currentLineIdx: number): { startLine: number; endLine: number } {
    // Cursor sitting directly on a ## marker → between cells, return empty sentinel
    if (lines[currentLineIdx]?.trim().startsWith('##')) {
        return { startLine: currentLineIdx + 2, endLine: currentLineIdx + 1 };
    }

    // Find start of cell (search backwards for ##, exclusive of the ## line itself)
    let startLine = 1; // 1-based
    for (let i = currentLineIdx; i >= 0; i--) {
        if (lines[i].trim().startsWith('##')) {
            startLine = i + 2; // line after ##, 1-based
            break;
        }
    }

    // Find end of cell (search forwards for ##, exclusive of the ## line itself)
    let endLine = lines.length; // 1-based
    for (let i = currentLineIdx + 1; i < lines.length; i++) {
        if (lines[i].trim().startsWith('##')) {
            endLine = i; // line before next ##, 1-based
            break;
        }
    }

    return { startLine, endLine };
}

/**
 * Executes the Julia cell at the current cursor position.
 */
async function executeCurrentCell(editor: monaco.editor.IStandaloneCodeEditor, filePath?: string) {
    const position = editor.getPosition();
    const model = editor.getModel();
    if (!position || !model) return;

    const lines = model.getLinesContent();
    const { startLine, endLine } = getCellBounds(lines, position.lineNumber - 1);

    const cellCode = lines.slice(startLine - 1, endLine).join('\n').trim();
    if (!cellCode) return;

    try {
        await invoke('execute_code', {
            code: cellCode,
            executionType: 'repl_execution',
            filePath: filePath || null,
        });
    } catch (err) {
        console.error('Failed to execute Julia cell:', err);
    }
}

/**
 * Adds a subtle background highlight to the current ## cell as the cursor moves.
 * Returns a disposable to clean up the listener.
 */
export function setupCellHighlighting(editor: monaco.editor.IStandaloneCodeEditor): monaco.IDisposable {
    let decorationIds: string[] = [];

    const updateHighlight = () => {
        const position = editor.getPosition();
        const model = editor.getModel();
        if (!position || !model) {
            decorationIds = editor.deltaDecorations(decorationIds, []);
            return;
        }

        const lines = model.getLinesContent();
        const { startLine, endLine } = getCellBounds(lines, position.lineNumber - 1);

        if (startLine > endLine) {
            decorationIds = editor.deltaDecorations(decorationIds, []);
            return;
        }

        decorationIds = editor.deltaDecorations(decorationIds, [
            {
                range: new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine)),
                options: {
                    isWholeLine: true,
                    className: 'julia-cell-highlight',
                    overviewRuler: {
                        color: 'rgba(56, 152, 38, 0.4)',
                        position: monaco.editor.OverviewRulerLane.Left,
                    },
                },
            },
        ]);
    };

    const disposable = editor.onDidChangeCursorPosition(updateHighlight);
    updateHighlight(); // apply immediately
    return disposable;
}

/**
 * Implements the 'Run Cell' command for the Monaco Editor.
 * Detects ## markers and executes the current block via Ctrl+Enter.
 * Also bridges the 'julia:run-cell' window event for the ribbon button.
 * Returns a cleanup function to remove the window event listener.
 */
export function setupRunCellCommand(
    editor: monaco.editor.IStandaloneCodeEditor,
    filePath?: string
): () => void {
    editor.addAction({
        id: 'julia-run-cell',
        label: 'Run Current Cell',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
        contextMenuGroupId: 'execution',
        contextMenuOrder: 0.5,
        run: (ed) => executeCurrentCell(ed, filePath),
    });

    // Bridge for the ribbon "Run Section" button
    const handler = () => executeCurrentCell(editor, filePath);
    window.addEventListener('julia:run-cell', handler);
    return () => window.removeEventListener('julia:run-cell', handler);
}

// ── ModelingToolkit (MTK) Highlighting ───────────────────────────────────────

const MTK_MACROS = [
    '@mtkmodel', '@variables', '@parameters', '@equations',
    '@components', '@extend', '@structural_parameters',
    '@named', '@unpack',
];

/**
 * Applies subtle left-border decorations to lines containing MTK macros.
 * Call once per editor instance; returns a disposable.
 */
export function applyMtkDecorations(
    editor: monaco.editor.IStandaloneCodeEditor,
): monaco.IDisposable {
    let decorationIds: string[] = [];

    const update = () => {
        const model = editor.getModel();
        if (!model) {
            decorationIds = editor.deltaDecorations(decorationIds, []);
            return;
        }
        const lines = model.getLinesContent();
        const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];
        lines.forEach((line, idx) => {
            if (MTK_MACROS.some(kw => line.includes(kw))) {
                newDecorations.push({
                    range: new monaco.Range(idx + 1, 1, idx + 1, 1),
                    options: {
                        isWholeLine: true,
                        className: 'mtk-macro-line',
                        glyphMarginClassName: 'mtk-macro-glyph',
                    },
                });
            }
        });
        decorationIds = editor.deltaDecorations(decorationIds, newDecorations);
    };

    update();
    return editor.onDidChangeModelContent(update);
}
