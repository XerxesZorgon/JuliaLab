<template>
  <div class="ag-shell">
    <!-- ── Individual app view ─────────────────────────────────────── -->
    <component
      v-if="activeApp"
      :is="activeAppComponent"
      @close="closeApp"
    />

    <!-- ── Gallery view ───────────────────────────────────────────── -->
    <template v-else>
      <!-- Header -->
      <div class="ag-header">
        <div class="ag-header-left">
          <span class="ag-title">Apps</span>
          <span class="ag-subtitle">Interactive tools for technical computing</span>
        </div>
        <button class="ag-close" title="Close Apps" @click="$emit('close')">✕</button>
      </div>

      <!-- Search + filter -->
      <div class="ag-toolbar">
        <div class="ag-search-wrap">
          <span class="ag-search-icon">🔍</span>
          <input
            v-model="search"
            class="ag-search"
            placeholder="Search apps…"
            spellcheck="false"
          />
        </div>
        <div class="ag-categories">
          <button
            v-for="cat in CATEGORIES"
            :key="cat"
            class="ag-cat-btn"
            :class="{ active: activeCat === cat }"
            @click="activeCat = cat"
          >{{ cat }}</button>
        </div>
      </div>

      <!-- Card grid -->
      <div class="ag-grid-wrap">
        <div class="ag-grid">
          <button
            v-for="app in filteredApps"
            :key="app.id"
            class="ag-card"
            :class="{ 'ag-card--coming-soon': app.comingSoon }"
            @click="!app.comingSoon && launch(app.id)"
          >
            <div class="ag-card-icon">{{ app.icon }}</div>
            <div class="ag-card-body">
              <div class="ag-card-name">{{ app.name }}</div>
              <div class="ag-card-desc">{{ app.description }}</div>
              <div class="ag-card-tags">
                <span v-for="tag in app.tags" :key="tag" class="ag-tag">{{ tag }}</span>
                <span v-if="app.comingSoon" class="ag-tag ag-tag--soon">coming soon</span>
              </div>
            </div>
            <div class="ag-card-category">{{ app.category }}</div>
          </button>

          <div v-if="filteredApps.length === 0" class="ag-empty">
            No apps match "{{ search }}"
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Component } from 'vue'
import CurveFittingApp from './CurveFittingApp.vue'
import { useAppsStore } from '../../store/appsStore'

defineEmits<{ close: [] }>()

// ── App registry ──────────────────────────────────────────────────────────────
interface AppEntry {
  id: string
  name: string
  icon: string
  description: string
  category: string
  tags: string[]
  component?: Component
  comingSoon?: boolean
}

const appsStore = useAppsStore()

const APP_REGISTRY: AppEntry[] = [
  // ── Mathematics ──────────────────────────────────────────────────────────
  {
    id: 'curve-fitting',
    name: 'Curve Fitting',
    icon: '📈',
    description: 'Fit linear, polynomial, exponential, power, and logarithmic models to data.',
    category: 'Mathematics',
    tags: ['regression', 'statistics', 'LsqFit'],
    component: CurveFittingApp,
  },
  {
    id: 'optimization',
    name: 'Optimization',
    icon: '🎯',
    description: 'Solve linear and nonlinear optimization problems with JuMP.jl.',
    category: 'Mathematics',
    tags: ['JuMP', 'linear', 'nonlinear'],
    comingSoon: true,
  },
  {
    id: 'polynomial-roots',
    name: 'Polynomial Roots',
    icon: '🔢',
    description: 'Find roots and factor polynomials using Polynomials.jl.',
    category: 'Mathematics',
    tags: ['Polynomials', 'algebra'],
    comingSoon: true,
  },

  // ── Signal Processing ─────────────────────────────────────────────────────
  {
    id: 'signal-analyzer',
    name: 'Signal Analyzer',
    icon: '📡',
    description: 'Visualize signals in time and frequency domains. Apply FFT and filters.',
    category: 'Signal Processing',
    tags: ['DSP', 'FFT', 'filter'],
    comingSoon: true,
  },
  {
    id: 'filter-designer',
    name: 'Filter Designer',
    icon: '🎛️',
    description: 'Design FIR and IIR filters and inspect their frequency response.',
    category: 'Signal Processing',
    tags: ['DSP', 'FIR', 'IIR'],
    comingSoon: true,
  },

  // ── Data ─────────────────────────────────────────────────────────────────
  {
    id: 'data-cleaner',
    name: 'Data Cleaner',
    icon: '🧹',
    description: 'Import CSV data, preview, filter, rename columns, and export.',
    category: 'Data',
    tags: ['DataFrames', 'CSV', 'tidy'],
    comingSoon: true,
  },
  {
    id: 'statistics',
    name: 'Statistics',
    icon: '📊',
    description: 'Descriptive statistics, histograms, and distribution fitting.',
    category: 'Data',
    tags: ['Statistics', 'distributions'],
    comingSoon: true,
  },

  // ── Control Systems ───────────────────────────────────────────────────────
  {
    id: 'pid-tuner',
    name: 'PID Tuner',
    icon: '⚙️',
    description: 'Define a plant model and interactively tune PID gains. View step response and Bode plot.',
    category: 'Control Systems',
    tags: ['ControlSystems', 'PID', 'Bode'],
    comingSoon: true,
  },

  // ── Machine Learning ──────────────────────────────────────────────────────
  {
    id: 'classification',
    name: 'Classification',
    icon: '🤖',
    description: 'Train and evaluate classifiers with MLJ.jl. Compare models side-by-side.',
    category: 'Machine Learning',
    tags: ['MLJ', 'classification'],
    comingSoon: true,
  },
]

const CATEGORIES = ['All', ...Array.from(new Set(APP_REGISTRY.map(a => a.category)))]

// ── State ─────────────────────────────────────────────────────────────────────
const search    = ref('')
const activeCat = ref('All')
const activeApp = computed(() => appsStore.activeApp?.id ?? null)

// ── Filtering ─────────────────────────────────────────────────────────────────
const filteredApps = computed(() => {
  const q   = search.value.toLowerCase()
  const cat = activeCat.value
  return APP_REGISTRY.filter(app => {
    const matchesCat  = cat === 'All' || app.category === cat
    const matchesText = !q ||
      app.name.toLowerCase().includes(q) ||
      app.description.toLowerCase().includes(q) ||
      app.tags.some(t => t.toLowerCase().includes(q))
    return matchesCat && matchesText
  })
})

// ── Navigation ────────────────────────────────────────────────────────────────
const activeAppComponent = computed<Component | undefined>(() =>
  APP_REGISTRY.find(a => a.id === activeApp.value)?.component
)

function launch(id: string) {
  const entry = APP_REGISTRY.find(a => a.id === id)
  if (entry) appsStore.setActiveApp({ id: entry.id, name: entry.name, icon: entry.icon })
}

function closeApp() {
  appsStore.setActiveApp(null)
}

// Wire up toolbar quick-launch buttons
let _cleanups: Array<() => void> = []

onMounted(() => {
  APP_REGISTRY.forEach(app => {
    if (!app.comingSoon) {
      _cleanups.push(
        appsStore.onAction(`gallery:launch:${app.id}`, () => launch(app.id))
      )
    }
  })
  _cleanups.push(
    appsStore.onAction('gallery:home', () => closeApp())
  )
})

onUnmounted(() => {
  _cleanups.forEach(fn => fn())
  _cleanups = []
})
</script>

<style scoped>
/* ── Shell ───────────────────────────────────────────────────────────────── */
.ag-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--jl-panel-bg);
  color: var(--jl-text-primary);
  font-family: var(--jl-font-ui);
  overflow: hidden;
}

/* ── Header ──────────────────────────────────────────────────────────────── */
.ag-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--jl-panel-bg-alt);
  border-bottom: 1px solid var(--jl-border);
  flex-shrink: 0;
}
.ag-header-left { display: flex; align-items: baseline; gap: 12px; }
.ag-title       { font-size: 15px; font-weight: 700; }
.ag-subtitle    { font-size: 11px; color: var(--jl-text-muted); }
.ag-close {
  background: none; border: none;
  color: var(--jl-text-muted); font-size: 16px;
  cursor: pointer; padding: 2px 6px; border-radius: 4px;
  transition: background 0.15s, color 0.15s;
}
.ag-close:hover { background: var(--jl-panel-hover, rgba(255,255,255,0.08)); color: var(--jl-text-primary); }

/* ── Toolbar ─────────────────────────────────────────────────────────────── */
.ag-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--jl-border);
  flex-shrink: 0;
  flex-wrap: wrap;
}
.ag-search-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--jl-terminal-bg, #1e1e1e);
  border: 1px solid var(--jl-border);
  border-radius: 6px;
  padding: 4px 10px;
  min-width: 200px;
}
.ag-search-icon { font-size: 12px; opacity: 0.6; }
.ag-search {
  background: none; border: none; outline: none;
  color: var(--jl-text-primary);
  font-size: 12px; width: 160px;
  font-family: var(--jl-font-ui);
}
.ag-categories { display: flex; gap: 4px; flex-wrap: wrap; }
.ag-cat-btn {
  padding: 3px 10px;
  font-size: 11px; font-weight: 500;
  border: 1px solid var(--jl-border);
  border-radius: 12px;
  background: none;
  color: var(--jl-text-muted);
  cursor: pointer;
  transition: all 0.12s;
  white-space: nowrap;
  font-family: var(--jl-font-ui);
}
.ag-cat-btn:hover    { background: var(--jl-panel-hover, rgba(255,255,255,0.06)); color: var(--jl-text-primary); }
.ag-cat-btn.active   { background: var(--jl-matlab-blue); color: #fff; border-color: var(--jl-matlab-blue); }

/* ── Grid ────────────────────────────────────────────────────────────────── */
.ag-grid-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.ag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

/* ── Card ────────────────────────────────────────────────────────────────── */
.ag-card {
  display: grid;
  grid-template-rows: auto 1fr auto;
  text-align: left;
  background: var(--jl-panel-bg-alt);
  border: 1px solid var(--jl-border);
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
  font-family: var(--jl-font-ui);
  position: relative;
  overflow: hidden;
}
.ag-card:hover:not(.ag-card--coming-soon) {
  border-color: var(--jl-matlab-blue);
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
  transform: translateY(-1px);
}
.ag-card--coming-soon {
  cursor: default;
  opacity: 0.55;
}

.ag-card-icon {
  font-size: 28px;
  margin-bottom: 8px;
  line-height: 1;
}
.ag-card-body   { display: flex; flex-direction: column; gap: 4px; }
.ag-card-name   { font-size: 13px; font-weight: 700; color: var(--jl-text-primary); }
.ag-card-desc   { font-size: 11px; color: var(--jl-text-muted); line-height: 1.45; }
.ag-card-tags   { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.ag-tag {
  font-size: 9px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.06em;
  padding: 2px 6px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--jl-accent-green) 12%, transparent);
  color: var(--jl-accent-green);
  border: 1px solid color-mix(in srgb, var(--jl-accent-green) 25%, transparent);
}
.ag-tag--soon {
  background: color-mix(in srgb, var(--jl-text-muted) 12%, transparent);
  color: var(--jl-text-muted);
  border-color: color-mix(in srgb, var(--jl-text-muted) 25%, transparent);
}
.ag-card-category {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--jl-matlab-blue);
  margin-top: 10px;
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
.ag-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 48px;
  color: var(--jl-text-muted);
  font-size: 13px;
  font-style: italic;
}

/* ── Scrollbar ───────────────────────────────────────────────────────────── */
.ag-grid-wrap::-webkit-scrollbar       { width: 6px; background: transparent; }
.ag-grid-wrap::-webkit-scrollbar-thumb { background: var(--jl-border); border-radius: 3px; }
</style>