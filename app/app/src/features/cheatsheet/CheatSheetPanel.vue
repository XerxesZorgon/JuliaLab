<template>
  <div class="cheatsheet-panel">

    <!-- Header -->
    <div class="cs-header">
      <div class="cs-header-top">
        <div class="cs-title">
          <span class="cs-logo matlab">M</span>
          <span class="cs-arrow">→</span>
          <span class="cs-logo julia">jl</span>
          <h2 class="cs-heading">MATLAB → Julia</h2>
        </div>
        <n-input
          v-model:value="searchQuery"
          placeholder="Search syntax…"
          clearable
          round
          size="small"
          class="cs-search"
          id="cheatsheet-search-input"
        >
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>
      </div>

      <!-- Category pills -->
      <div class="cs-pills">
        <n-button
          v-for="cat in allCategories"
          :key="cat"
          :type="activeCategory === cat ? 'primary' : 'default'"
          size="tiny"
          round
          secondary
          :class="{ 'pill-active': activeCategory === cat }"
          @click="toggleCategory(cat)"
          :id="`cs-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`"
        >
          {{ cat }}
        </n-button>
      </div>
    </div>

    <!-- Results count -->
    <div class="cs-results-bar">
      <span class="cs-count">{{ filteredEntries.length }} result{{ filteredEntries.length === 1 ? '' : 's' }}</span>
      <n-button v-if="searchQuery || activeCategory" text size="tiny" @click="resetFilters">
        Clear filters
      </n-button>
    </div>

    <!-- Column headers -->
    <div class="cs-col-headers">
      <div class="cs-col-label matlab-col">MATLAB</div>
      <div class="cs-col-label julia-col">Julia</div>
    </div>

    <!-- Entry list -->
    <div class="cs-entries" ref="entriesEl">
      <template v-if="filteredEntries.length === 0">
        <div class="cs-empty">
          <n-empty description="No matching entries" size="small" />
        </div>
      </template>

      <template v-for="(entry, idx) in filteredEntries" :key="`${entry.category}-${entry.description}-${idx}`">
        <!-- Category divider (only when not filtering) -->
        <div
          v-if="!isFiltering && (idx === 0 || filteredEntries[idx - 1].category !== entry.category)"
          class="cs-category-header"
        >
          <span class="cs-category-name">{{ entry.category }}</span>
        </div>

        <div class="cs-entry" :class="{ 'cs-entry--highlighted': entry._highlighted }">
          <!-- Description row -->
          <div class="cs-entry-desc">
            <n-tag size="tiny" type="default" round class="cs-tag">{{ entry.category }}</n-tag>
            <span class="cs-desc-text">{{ entry.description }}</span>
          </div>

          <!-- Code row -->
          <div class="cs-code-row">
            <!-- MATLAB column -->
            <div class="cs-code-block matlab-code">
              <div class="cs-lang-badge matlab-badge">MATLAB</div>
              <pre class="cs-pre" v-html="highlight(entry.matlab, 'matlab')"></pre>
              <n-button
                text
                size="tiny"
                class="cs-copy-btn"
                :id="`cs-copy-matlab-${idx}`"
                @click="copyCode(entry.matlab)"
                title="Copy MATLAB code"
              >
                <template #icon><n-icon size="12"><CopyOutline /></n-icon></template>
              </n-button>
            </div>

            <!-- Arrow -->
            <div class="cs-row-arrow">→</div>

            <!-- Julia column -->
            <div class="cs-code-block julia-code">
              <div class="cs-lang-badge julia-badge">Julia</div>
              <pre class="cs-pre" v-html="highlight(entry.julia, 'julia')"></pre>
              <n-button
                text
                size="tiny"
                class="cs-copy-btn"
                :id="`cs-copy-julia-${idx}`"
                @click="copyCode(entry.julia)"
                title="Copy Julia code"
              >
                <template #icon><n-icon size="12"><CopyOutline /></n-icon></template>
              </n-button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NInput, NButton, NIcon, NTag, NEmpty, useMessage } from 'naive-ui';
import { SearchOutline, CopyOutline } from '@vicons/ionicons5';
import { cheatSheetData, categories } from './cheatsheet-data';
import type { CheatSheetEntry } from './cheatsheet-data';

const message = useMessage();

// ── State ───────────────────────────────────────────────────────────────────
const searchQuery = ref('');
const activeCategory = ref<string>('');
const entriesEl = ref<HTMLElement | null>(null);

const allCategories = computed(() => ['All', ...categories]);

const isFiltering = computed(() => !!searchQuery.value || (!!activeCategory.value && activeCategory.value !== 'All'));

// ── Filtered entries ─────────────────────────────────────────────────────────
const filteredEntries = computed<CheatSheetEntry[]>(() => {
  let result = cheatSheetData;

  // Category filter
  if (activeCategory.value && activeCategory.value !== 'All') {
    result = result.filter((e) => e.category === activeCategory.value);
  }

  // Text search – searches across description, MATLAB, and Julia columns
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        e.matlab.toLowerCase().includes(q) ||
        e.julia.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q),
    );
  }

  return result;
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function toggleCategory(cat: string) {
  activeCategory.value = activeCategory.value === cat ? '' : cat;
}

function resetFilters() {
  searchQuery.value = '';
  activeCategory.value = '';
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    message.success('Copied!', { duration: 1200 });
  } catch {
    message.error('Failed to copy');
  }
}

/** Minimal syntax highlighter for in-panel code blocks.
 *  We keep it dependency-free for startup performance.
 *  Just colours keywords, strings, and comments in a readable way.
 */
function highlight(code: string, lang: 'matlab' | 'julia'): string {
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments
  const commentColor = 'var(--cs-comment)';
  if (lang === 'matlab') {
    escaped = escaped.replace(/(%.+)/g, `<span style="color:${commentColor}">$1</span>`);
  } else {
    escaped = escaped.replace(/(#.+)/g, `<span style="color:${commentColor}">$1</span>`);
  }

  // Strings
  escaped = escaped.replace(/(&quot;[^&]*?&quot;|'[^']*?')/g, '<span style="color:var(--cs-string)">$1</span>');

  // Numbers
  escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:var(--cs-number)">$1</span>');

  // Keywords
  const juliaKeywords = ['function', 'end', 'if', 'else', 'elseif', 'for', 'while', 'return', 'in', 'using', 'import', 'struct', 'mutable', 'abstract', 'type', 'module', 'begin', 'do', 'try', 'catch', 'finally', 'break', 'continue', 'true', 'false', 'nothing', 'let', 'local', 'global', 'const', 'typeof', 'isa'];
  const matlabKeywords = ['function', 'end', 'if', 'else', 'elseif', 'for', 'while', 'return', 'break', 'continue', 'true', 'false', 'disp', 'fprintf', 'nargin', 'nargout', 'varargin', 'class'];
  const keywords = lang === 'julia' ? juliaKeywords : matlabKeywords;

  keywords.forEach((kw) => {
    escaped = escaped.replace(
      new RegExp(`\\b(${kw})\\b`, 'g'),
      '<span style="color:var(--cs-keyword)">$1</span>',
    );
  });

  return escaped;
}
</script>

<style scoped>
/* ── CSS Custom Properties (scoped to this panel only) ── */
.cheatsheet-panel {
  --cs-keyword:   #c792ea;
  --cs-string:    #c3e88d;
  --cs-number:    #f78c6c;
  --cs-comment:   #637777;
  --cs-matlab-bg: #1a1a2e;
  --cs-julia-bg:  #0d1b17;
  --cs-matlab-border: #4a4a7a;
  --cs-julia-border:  #2a5a46;
  --cs-matlab-badge: #9558b2;
  --cs-julia-badge:  #389826;

  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--jl-panel-bg);
  overflow: hidden;
  font-family: var(--jl-font-ui);
}

/* ── Header ─────────────────────────────────────────────── */
.cs-header {
  padding: 12px 14px 8px;
  background: var(--jl-panel-bg-alt);
  border-bottom: 1px solid var(--jl-border-light);
  flex-shrink: 0;
}

.cs-header-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.cs-title {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.cs-logo {
  font-size: 11px;
  font-weight: 700;
  font-family: var(--jl-font-mono);
  padding: 2px 6px;
  border-radius: 4px;
}
.cs-logo.matlab {
  background: #4a3a6a;
  color: #d0aaff;
}
.cs-logo.julia {
  background: #1e3a2e;
  color: #6fffaa;
}

.cs-arrow {
  color: var(--jl-text-secondary);
  font-size: 13px;
}

.cs-heading {
  font-size: 12px;
  font-weight: 600;
  color: var(--jl-text-primary);
  margin: 0;
  white-space: nowrap;
}

.cs-search {
  flex: 1;
  max-width: 220px;
}

.cs-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* ── Results bar ─────────────────────────────────────────── */
.cs-results-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 14px;
  background: var(--jl-panel-bg);
  border-bottom: 1px solid var(--jl-border);
  flex-shrink: 0;
}

.cs-count {
  font-size: 10px;
  color: var(--jl-text-secondary);
  font-family: var(--jl-font-mono);
}

/* ── Column headers ──────────────────────────────────────── */
.cs-col-headers {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 6px;
  padding: 4px 14px;
  background: var(--jl-panel-bg-alt);
  border-bottom: 1px solid var(--jl-border);
  flex-shrink: 0;
}

.cs-col-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.7px;
}
.matlab-col { color: #b08ae0; }
.julia-col  { color: #4dbf6a; }

/* ── Scrollable entries ──────────────────────────────────── */
.cs-entries {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

/* ── Category header ─────────────────────────────────────── */
.cs-category-header {
  padding: 10px 14px 4px;
  position: sticky;
  top: 0;
  background: var(--jl-panel-bg);
  z-index: 1;
}

.cs-category-name {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--jl-accent-green);
}

/* ── Individual entry ────────────────────────────────────── */
.cs-entry {
  padding: 6px 14px 10px;
  border-bottom: 1px solid var(--jl-border);
  transition: background 0.1s;
}
.cs-entry:hover {
  background: rgba(255,255,255,0.02);
}

.cs-entry-desc {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.cs-tag {
  flex-shrink: 0;
  opacity: 0.7;
}

.cs-desc-text {
  font-size: 11px;
  color: var(--jl-text-secondary);
  font-style: italic;
}

/* ── Code row (two columns + arrow) ─────────────────────── */
.cs-code-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: start;
  gap: 6px;
}

.cs-row-arrow {
  color: var(--jl-text-muted);
  font-size: 14px;
  padding-top: 22px;
  align-self: start;
}

/* ── Code block ──────────────────────────────────────────── */
.cs-code-block {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid;
}

.matlab-code {
  background: var(--cs-matlab-bg);
  border-color: var(--cs-matlab-border);
}
.julia-code {
  background: var(--cs-julia-bg);
  border-color: var(--cs-julia-border);
}

.cs-lang-badge {
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 2px 6px;
}
.matlab-badge {
  background: var(--cs-matlab-badge);
  color: #fff;
}
.julia-badge {
  background: var(--cs-julia-badge);
  color: #fff;
}

.cs-pre {
  margin: 0;
  padding: 6px 8px 8px;
  font-family: var(--jl-font-mono);
  font-size: 11px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre;
  color: var(--jl-text-primary);
}

.cs-copy-btn {
  position: absolute;
  bottom: 4px;
  right: 4px;
  opacity: 0;
  transition: opacity 0.15s;
  color: var(--jl-text-secondary);
}
.cs-code-block:hover .cs-copy-btn {
  opacity: 1;
}

/* ── Empty state ─────────────────────────────────────────── */
.cs-empty {
  padding: 40px 0;
  display: flex;
  justify-content: center;
}

/* ── Scrollbar ───────────────────────────────────────────── */
.cs-entries::-webkit-scrollbar {
  width: 4px;
}
.cs-entries::-webkit-scrollbar-thumb {
  background: var(--jl-border-light);
  border-radius: 4px;
}
</style>
