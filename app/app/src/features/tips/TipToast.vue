<template>
  <transition name="tip-toast" appear>
    <div v-if="visible" class="tip-toast" id="tip-toast" role="status" aria-live="polite">

      <!-- Header row -->
      <div class="tip-header">
        <span class="tip-badge">
          <span class="tip-emoji">{{ tipEmoji(currentTip) }}</span>
          <span class="tip-label">{{ tipCategoryLabel }}</span>
          <span class="tip-counter">{{ currentIndex + 1 }} / {{ totalTips }}</span>
        </span>
        <div class="tip-actions">
          <button class="tip-btn" id="tip-btn-prev" @click="onPrev" title="Previous tip" aria-label="Previous tip">‹</button>
          <button class="tip-btn" id="tip-btn-next" @click="onNext" title="Next tip" aria-label="Next tip">›</button>
          <button class="tip-btn tip-btn-close" id="tip-btn-close" @click="dismiss" title="Dismiss" aria-label="Close">✕</button>
        </div>
      </div>

      <!-- Tip text -->
      <p class="tip-text">{{ currentTip.text }}</p>

      <!-- Optional code snippet -->
      <pre v-if="currentTip.code" class="tip-code">{{ currentTip.code }}</pre>

      <!-- Progress bar (auto-dismiss countdown) -->
      <div class="tip-progress-track">
        <div
          class="tip-progress-bar"
          :style="{ animationDuration: `${AUTO_DISMISS_MS}ms`, animationPlayState: hovered ? 'paused' : 'running' }"
          :key="currentIndex"
        />
      </div>

    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useTips } from './useTips';

const { currentTip, currentIndex, totalTips, nextTip, prevTip, tipEmoji } = useTips();

// ── Constants ────────────────────────────────────────────────────────────────
const AUTO_DISMISS_MS = 12_000; // 12 seconds before auto-dismiss

// ── State ────────────────────────────────────────────────────────────────────
const visible = ref(false);
const hovered = ref(false);

let dismissTimer: ReturnType<typeof setTimeout> | null = null;

// ── Category labels ──────────────────────────────────────────────────────────
const categoryLabels: Record<string, string> = {
  syntax: 'Syntax',
  performance: 'Performance',
  workflow: 'Workflow',
  packages: 'Packages',
  idioms: 'Idiom',
};
const tipCategoryLabel = computed(() => categoryLabels[currentTip.value.category] ?? 'Tip');

// ── Lifecycle ────────────────────────────────────────────────────────────────
function startTimer() {
  clearTimer();
  dismissTimer = setTimeout(() => {
    visible.value = false;
  }, AUTO_DISMISS_MS);
}

function clearTimer() {
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
}

onMounted(() => {
  // Delay slightly so the app chrome renders before the toast pops up.
  setTimeout(() => {
    visible.value = true;
    startTimer();
  }, 1200);
});

onUnmounted(() => clearTimer());

// Restart timer when user navigates tips manually.
watch(currentIndex, () => startTimer());

// ── Actions ──────────────────────────────────────────────────────────────────
function onNext() {
  nextTip();
}

function onPrev() {
  prevTip();
}

function dismiss() {
  clearTimer();
  visible.value = false;
}
</script>

<style scoped>
/* ── Toast container ──────────────────────────────────────────────────────── */
.tip-toast {
  position: fixed;
  bottom: 32px;
  right: 20px;
  width: 380px;
  max-width: calc(100vw - 40px);
  background: var(--jl-panel-bg-alt, #1c1e26);
  border: 1px solid var(--jl-border-light, #3a3d4a);
  border-radius: 10px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset;
  overflow: hidden;
  z-index: 1000;
  cursor: default;
  user-select: none;
}
.tip-toast:hover {
  border-color: var(--jl-accent-green, #4dbf6a);
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.tip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px 4px;
  gap: 8px;
}

.tip-badge {
  display: flex;
  align-items: center;
  gap: 5px;
}

.tip-emoji {
  font-size: 13px;
  line-height: 1;
}

.tip-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--jl-accent-green, #4dbf6a);
  font-family: var(--jl-font-mono, monospace);
}

.tip-counter {
  font-size: 9px;
  color: var(--jl-text-muted, #555);
  font-family: var(--jl-font-mono, monospace);
}

.tip-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

/* ── Navigation buttons ──────────────────────────────────────────────────── */
.tip-btn {
  background: none;
  border: none;
  color: var(--jl-text-secondary, #888);
  padding: 2px 5px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1.2;
  transition: background 0.1s, color 0.1s;
}
.tip-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--jl-text-primary, #e0e0e0);
}
.tip-btn-close {
  font-size: 10px;
}

/* ── Tip text ─────────────────────────────────────────────────────────────── */
.tip-text {
  margin: 0;
  padding: 2px 12px 8px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--jl-text-primary, #d4d4d8);
  font-family: var(--jl-font-ui, sans-serif);
}

/* ── Code snippet ─────────────────────────────────────────────────────────── */
.tip-code {
  margin: 0 10px 8px;
  padding: 8px 10px;
  background: var(--jl-panel-bg, #13151f);
  border: 1px solid var(--jl-border, #2a2d3a);
  border-radius: 6px;
  font-family: var(--jl-font-mono, monospace);
  font-size: 10.5px;
  line-height: 1.6;
  color: var(--jl-text-primary, #d4d4d8);
  white-space: pre;
  overflow-x: auto;
}

/* ── Progress bar ─────────────────────────────────────────────────────────── */
.tip-progress-track {
  height: 2px;
  background: var(--jl-border, #2a2d3a);
}

.tip-progress-bar {
  height: 100%;
  background: var(--jl-accent-green, #4dbf6a);
  animation: tip-shrink linear forwards;
  transform-origin: left;
}

@keyframes tip-shrink {
  from { width: 100%; }
  to   { width: 0%;   }
}

/* ── Enter / leave transitions ───────────────────────────────────────────── */
.tip-toast-enter-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.tip-toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.tip-toast-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}
.tip-toast-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.97);
}
</style>
