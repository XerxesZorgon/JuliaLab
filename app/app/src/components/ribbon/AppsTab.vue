<template>
  <div class="ribbon-group-row">

    <!-- ── No app open: gallery launcher bar ─────────────────────────── -->
    <template v-if="!appsStore.activeApp">
      <!-- FILE group -->
      <div class="ribbon-group">
        <div class="ribbon-group-buttons">
          <button class="ribbon-btn ribbon-btn--large" title="Browse all apps" @click="scrollToGallery">
            <span class="ribbon-btn-icon">🗂️</span>
            <span class="ribbon-btn-label">Get More<br>Apps</span>
          </button>
        </div>
        <div class="ribbon-group-label">FILE</div>
      </div>

      <div class="ribbon-group-divider" />

      <!-- Quick-launch shortcuts -->
      <div class="ribbon-group">
        <div class="ribbon-group-buttons">
          <button
            v-for="app in quickLaunchApps"
            :key="app.id"
            class="ribbon-btn ribbon-btn--large"
            :title="app.description"
            @click="emitLaunch(app.id)"
          >
            <span class="ribbon-btn-icon ribbon-btn-icon--emoji">{{ app.icon }}</span>
            <span class="ribbon-btn-label">{{ app.name }}</span>
          </button>
        </div>
        <div class="ribbon-group-label">APPS</div>
      </div>
    </template>

    <!-- ── App open: context-sensitive toolbar ────────────────────────── -->
    <template v-else>
      <!-- Active app name -->
      <div class="ribbon-group ribbon-group--app-id">
        <div class="ribbon-group-buttons">
          <div class="ribbon-app-badge ribbon-app-badge--clickable"
               title="Back to Apps gallery"
               @click="appsStore.setActiveApp(null)">
            <span class="ribbon-app-back">← Apps</span>
            <span class="ribbon-app-icon">{{ appsStore.activeApp.icon }}</span>
            <span class="ribbon-app-name">{{ appsStore.activeApp.name }}</span>
          </div>
        </div>
        <div class="ribbon-group-label">ACTIVE APP</div>
      </div>

      <div class="ribbon-group-divider" />

      <!-- Curve Fitting toolbar -->
      <template v-if="appsStore.activeApp.id === 'curve-fitting'">
        <!-- FILE -->
        <div class="ribbon-group">
          <div class="ribbon-group-buttons">
            <button class="ribbon-btn ribbon-btn--large" title="New fit session"
              @click="fire('curve-fitting:new')">
              <span class="ribbon-btn-icon">📄</span>
              <span class="ribbon-btn-label">New</span>
            </button>
            <div class="ribbon-btn-stack">
              <button class="ribbon-btn ribbon-btn--small" title="Open saved fit"
                @click="fire('curve-fitting:open')">📂 Open</button>
              <button class="ribbon-btn ribbon-btn--small" title="Save current fit"
                @click="fire('curve-fitting:save')">💾 Save</button>
            </div>
          </div>
          <div class="ribbon-group-label">FILE</div>
        </div>

        <div class="ribbon-group-divider" />

        <!-- FIT TYPE -->
        <div class="ribbon-group">
          <div class="ribbon-group-buttons">
            <button
              v-for="m in FIT_MODELS"
              :key="m.id"
              class="ribbon-btn ribbon-btn--medium"
              :class="{ active: activeFitModel === m.id }"
              :title="m.equation"
              @click="setFitModel(m.id)"
            >
              <span class="ribbon-btn-icon ribbon-btn-icon--emoji">{{ m.icon }}</span>
              <span class="ribbon-btn-label">{{ m.label }}</span>
            </button>
          </div>
          <div class="ribbon-group-label">FIT TYPE</div>
        </div>

        <div class="ribbon-group-divider" />

        <!-- VISUALIZATION -->
        <div class="ribbon-group">
          <div class="ribbon-group-buttons">
            <button class="ribbon-btn ribbon-btn--large"
              :class="{ active: cfShowFitPlot }"
              title="Show fit plot"
              @click="fire('curve-fitting:toggle-fit-plot')">
              <span class="ribbon-btn-icon">📈</span>
              <span class="ribbon-btn-label">Fit Plot</span>
            </button>
            <button class="ribbon-btn ribbon-btn--large"
              :class="{ active: cfShowResiduals }"
              title="Show residuals plot"
              @click="fire('curve-fitting:toggle-residuals')">
              <span class="ribbon-btn-icon">📉</span>
              <span class="ribbon-btn-label">Residuals<br>Plot</span>
            </button>
            <button class="ribbon-btn ribbon-btn--large"
              :class="{ active: cfShowConfidence }"
              title="Show 95% confidence bounds"
              @click="fire('curve-fitting:toggle-confidence')">
              <span class="ribbon-btn-icon">🎯</span>
              <span class="ribbon-btn-label">Confidence<br>Bounds</span>
            </button>
          </div>
          <div class="ribbon-group-label">VISUALIZATION</div>
        </div>

        <div class="ribbon-group-divider" />

        <!-- EXPORT -->
        <div class="ribbon-group">
          <div class="ribbon-group-buttons">
            <button class="ribbon-btn ribbon-btn--large" title="Export fit results to workspace"
              @click="fire('curve-fitting:export')">
              <span class="ribbon-btn-icon">📤</span>
              <span class="ribbon-btn-label">Export</span>
            </button>
          </div>
          <div class="ribbon-group-label">EXPORT</div>
        </div>
      </template>

      <!-- Fallback for other apps -->
      <template v-else>
        <div class="ribbon-group">
          <div class="ribbon-group-buttons">
            <div class="ribbon-info-block">
              <p class="ribbon-info-desc">{{ appsStore.activeApp.name }} toolbar coming soon.</p>
            </div>
          </div>
          <div class="ribbon-group-label">INFO</div>
        </div>
      </template>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAppsStore } from '../../store/appsStore';

const appsStore = useAppsStore();

// ── Quick-launch app list (shown when no app is open) ─────────────────────
const quickLaunchApps = [
  { id: 'curve-fitting', name: 'Curve Fitting',   icon: '📈', description: 'Fit models to data' },
  { id: 'signal-analyzer', name: 'Signal Analyzer', icon: '📡', description: 'Coming soon' },
  { id: 'data-cleaner',    name: 'Data Cleaner',    icon: '🧹', description: 'Coming soon' },
  { id: 'optimization',    name: 'Optimization',    icon: '🎯', description: 'Coming soon' },
];

// ── Fit model definitions ─────────────────────────────────────────────────
const FIT_MODELS = [
  { id: 'linear',      label: 'Linear',      icon: '📏', equation: 'y = a + b·x' },
  { id: 'poly',        label: 'Polynomial',  icon: '〰️',  equation: 'y = Σ aₙxⁿ' },
  { id: 'exponential', label: 'Exponential', icon: '🚀', equation: 'y = a·eᵇˣ' },
  { id: 'power',       label: 'Power',       icon: '⚡', equation: 'y = a·xᵇ' },
  { id: 'logarithmic', label: 'Logarithmic', icon: '🌀', equation: 'y = a + b·ln(x)' },
];

// ── Curve fitting toolbar state (synced with CurveFittingApp via store) ───
const activeFitModel  = ref('linear');
const cfShowFitPlot   = ref(true);
const cfShowResiduals = ref(false);
const cfShowConfidence = ref(false);

// ── Actions ───────────────────────────────────────────────────────────────
function fire(action: string) {
  appsStore.fireAction(action);
}

function setFitModel(id: string) {
  activeFitModel.value = id;
  appsStore.fireAction(`curve-fitting:set-model:${id}`);
}

function emitLaunch(id: string) {
  // The gallery listens for this to open an app
  appsStore.fireAction(`gallery:launch:${id}`);
}

function scrollToGallery() {
  appsStore.fireAction('gallery:home');
}

// ── Sync toggle state back from the app ──────────────────────────────────
let cleanups: Array<() => void> = [];

onMounted(() => {
  cleanups.push(
    appsStore.onAction('curve-fitting:model-changed', () => {}),
    appsStore.onAction('curve-fitting:residuals-state', () => {
      cfShowResiduals.value = !cfShowResiduals.value;
    }),
    appsStore.onAction('curve-fitting:confidence-state', () => {
      cfShowConfidence.value = !cfShowConfidence.value;
    }),
  );
});

onUnmounted(() => {
  cleanups.forEach(fn => fn());
  cleanups = [];
});
</script>

<style scoped>
.ribbon-group-row {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  height: 100%;
  gap: 0;
}

.ribbon-group {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 4px 8px 0;
}

.ribbon-group--app-id {
  min-width: 100px;
}

.ribbon-group-buttons {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 3px;
}

.ribbon-group-label {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--jl-text-muted);
  text-align: center;
  padding: 2px 0 3px;
  text-transform: uppercase;
}

.ribbon-group-divider {
  width: 1px;
  background: var(--jl-border);
  margin: 6px 4px;
  align-self: stretch;
}

/* ── Large button ──────────────────────────────────────────────────────── */
.ribbon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--jl-text-primary);
  transition: all 0.15s ease;
  font-family: var(--jl-font-ui);
}
.ribbon-btn:hover {
  background: var(--jl-panel-hover, rgba(255,255,255,0.08));
  border-color: var(--jl-border);
}
.ribbon-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.ribbon-btn.active {
  background: color-mix(in srgb, var(--jl-matlab-blue) 20%, transparent);
  border-color: var(--jl-matlab-blue);
}

.ribbon-btn--large {
  flex-direction: column;
  gap: 3px;
  min-width: 48px;
  height: 66px;
  padding: 4px 6px;
  text-align: center;
}
.ribbon-btn--medium {
  flex-direction: column;
  gap: 2px;
  min-width: 44px;
  height: 66px;
  padding: 4px 6px;
  text-align: center;
}
.ribbon-btn--small {
  flex-direction: row;
  gap: 4px;
  height: 30px;
  padding: 0 8px;
  font-size: 11px;
  width: 80px;
  justify-content: flex-start;
}

.ribbon-btn-stack {
  display: flex;
  flex-direction: column;
  gap: 3px;
  height: 66px;
  justify-content: center;
}

.ribbon-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
}
.ribbon-btn-icon--emoji { font-size: 22px; line-height: 1; }

.ribbon-btn-label {
  font-size: 10px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  color: var(--jl-text-secondary, var(--jl-text-primary));
  line-height: 1.2;
}

/* ── Active app badge ──────────────────────────────────────────────────── */
.ribbon-app-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 8px;
  background: color-mix(in srgb, var(--jl-matlab-blue) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--jl-matlab-blue) 30%, transparent);
  border-radius: 6px;
  height: 66px;
  min-width: 72px;
}
.ribbon-app-icon { font-size: 24px; line-height: 1; }
.ribbon-app-name {
  font-size: 10px;
  font-weight: 700;
  color: var(--jl-text-primary);
  text-align: center;
  white-space: nowrap;
}

/* ── Info block ────────────────────────────────────────────────────────── */
.ribbon-info-block { padding: 2px 4px; }
.ribbon-info-desc {
  font-size: 10px;
  color: var(--jl-text-muted);
  margin: 0;
  font-style: italic;
}

.ribbon-app-badge--clickable {
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.ribbon-app-badge--clickable:hover {
  background: color-mix(in srgb, var(--jl-matlab-blue) 25%, transparent);
  border-color: var(--jl-matlab-blue);
}
.ribbon-app-back {
  font-size: 9px;
  font-weight: 600;
  color: var(--jl-matlab-blue);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
</style>