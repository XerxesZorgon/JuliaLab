// Composable: useTips
// Manages the current tip, cycling, and the startup toast.
// Persists the current tip index to localStorage so each app start
// shows a fresh tip rather than always showing tip #1.

import { ref, computed } from 'vue';
import { tips } from './tips-data';
import type { JuliaLabTip } from './tips-data';

const STORAGE_KEY = 'julialab.tip-index';

function loadIndex(): number {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw !== null) {
            const idx = parseInt(raw, 10);
            if (!isNaN(idx) && idx >= 0 && idx < tips.length) return idx;
        }
    } catch {
        // localStorage may not be available in tests
    }
    return Math.floor(Math.random() * tips.length);
}

function saveIndex(idx: number) {
    try {
        localStorage.setItem(STORAGE_KEY, String(idx));
    } catch { }
}

// Module-level singleton state so all consumers share the same tip.
const currentIndex = ref<number>(loadIndex());

export function useTips() {
    const currentTip = computed<JuliaLabTip>(() => tips[currentIndex.value]);

    function nextTip() {
        currentIndex.value = (currentIndex.value + 1) % tips.length;
        saveIndex(currentIndex.value);
    }

    function prevTip() {
        currentIndex.value = (currentIndex.value - 1 + tips.length) % tips.length;
        saveIndex(currentIndex.value);
    }

    function randomTip() {
        let next = Math.floor(Math.random() * tips.length);
        // Avoid showing the same tip twice in a row
        if (next === currentIndex.value) next = (next + 1) % tips.length;
        currentIndex.value = next;
        saveIndex(currentIndex.value);
    }

    const categoryEmoji: Record<string, string> = {
        syntax: '📝',
        performance: '⚡',
        workflow: '🔧',
        packages: '📦',
        idioms: '💡',
    };

    function tipEmoji(tip: JuliaLabTip): string {
        return categoryEmoji[tip.category] ?? '💡';
    }

    return { currentTip, currentIndex, nextTip, prevTip, randomTip, tipEmoji, totalTips: tips.length };
}
