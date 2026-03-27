<template>
  <div class="ribbon-bar">
    <!-- Tab bar row using Naive UI n-tabs -->
    <div class="ribbon-tabs-container">
      <n-tabs
        v-model:value="activeTab"
        type="card"
        size="small"
        @update:value="handleTabChange"
        class="ribbon-n-tabs"
      >
        <n-tab v-for="tab in TABS" :key="tab" :name="tab" :label="tab">
          <template #default>
            {{ tab }}
            <span v-if="tab === 'PLOTS' && plotStore.plotCount > 0" class="ribbon-tab-badge">
              {{ plotStore.plotCount > 99 ? '99+' : plotStore.plotCount }}
            </span>
          </template>
        </n-tab>
      </n-tabs>

      <!-- Pin toggle -->
      <div class="ribbon-actions">
        <button
          class="ribbon-pin"
          :class="{ pinned: layoutStore.ribbonPinned }"
          :title="layoutStore.ribbonPinned ? 'Unpin ribbon' : 'Pin ribbon'"
          @click="layoutStore.ribbonPinned = !layoutStore.ribbonPinned"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path v-if="layoutStore.ribbonPinned" d="M15 3h6v6 M9 21H3v-6 M21 3l-7 7 M3 21l7-7" />
            <path v-else d="M4 14h6v6 M20 10h-6V4 M14 10l7-7 M3 21l7-7" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Ribbon content row (collapsible via max-height) -->
    <div class="ribbon-content" :class="{ collapsed: !showRibbon }">
      <div class="ribbon-content-inner">
        <div class="ribbon-logo">
          <img src="/JuliaLab_home.png" alt="JuliaLab" class="ribbon-logo-img" />
        </div>
        <component :is="tabComponent" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type Component } from 'vue';
import { NTabs, NTab } from 'naive-ui';
import { useLayoutStore } from '../../store/layoutStore';
import { usePlotStore } from '../../store/plotStore';
import HomeTab from '../ribbon/HomeTab.vue';
import PlotsToolbar from '../ribbon/PlotsToolbar.vue';
import ViewTab from '../ribbon/ViewTab.vue';
import LiveEditorTab from '../ribbon/LiveEditorTab.vue';
import AppsTab from '../ribbon/AppsTab.vue';
import FigureTab from '../ribbon/FigureTab.vue';

const layoutStore = useLayoutStore();
const plotStore = usePlotStore();

const TABS = ['HOME', 'PLOTS', 'FIGURE', 'APPS', 'LIVE EDITOR', 'INSERT', 'VIEW'] as const;
type TabName = (typeof TABS)[number];
const emit = defineEmits(['tab-change']);

const activeTab = ref<TabName>('HOME');

// Ribbon is visible when pinned, or when explicitly toggled visible
const showRibbon = computed(() => layoutStore.ribbonVisible || layoutStore.ribbonPinned);

const handleTabChange = (value: string) => {
  activeTab.value = value as TabName;
  layoutStore.ribbonVisible = true;
  emit('tab-change', activeTab.value);
};

// Map tabs to components
const tabComponents: Record<TabName, Component> = {
  HOME: HomeTab,
  PLOTS: PlotsToolbar,
  FIGURE: FigureTab,
  APPS: AppsTab,
  'LIVE EDITOR': LiveEditorTab,
  INSERT: { render() { return null; } },
  VIEW: ViewTab,
};

const tabComponent = computed(() => tabComponents[activeTab.value]);

// F2 keyboard shortcut
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'F2') {
    e.preventDefault();
    layoutStore.toggleRibbon();
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.ribbon-bar {
  flex-shrink: 0;
  background: var(--jl-panel-bg-alt);
  border-bottom: 1px solid var(--jl-border);
  display: flex;
  flex-direction: column;
}

/* ─── Tab bar container ─────────────────────────────────────────────────── */
.ribbon-tabs-container {
  display: flex;
  align-items: center;
  height: 32px;
  background: var(--jl-matlab-blue);
  padding: 0 4px;
  position: relative;
  z-index: 10;
}

.ribbon-n-tabs {
  flex: 1;
}

/* ─── Naive UI Overrides ─────────────────────────────────────────────────── */
:deep(.n-tabs-tab-wrapper) {
  height: 32px;
}

:deep(.n-tabs-tab) {
  padding: 0 16px !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.7) !important;
  transition: all 0.2s ease !important;
  border: none !important;
  background: transparent !important;
}

:deep(.n-tabs-tab:hover) {
  color: rgba(255, 255, 255, 0.9) !important;
  background: var(--jl-matlab-blue-dark) !important;
}

:deep(.n-tabs-tab--active) {
  color: var(--jl-text-primary) !important;
  font-weight: 700 !important;
  background: var(--jl-panel-bg-alt) !important;
  border-bottom: none !important;
}

:deep(.n-tabs-bar) {
  background-color: var(--jl-accent-blue) !important;
  height: 2px !important;
  bottom: 0 !important;
}

:deep(.n-tabs-nav) {
  border-bottom: none !important;
}

:deep(.n-tabs-pad) {
  border-bottom: none !important;
}

/* ─── Ribbon Actions ─────────────────────────────────────────────────────── */
.ribbon-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 8px;
}

.ribbon-pin {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: none;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.15s ease;
}

.ribbon-pin:hover {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 1);
}

.ribbon-pin.pinned {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.2);
}

.ribbon-tab-badge {
  margin-left: 6px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--jl-accent-green);
  color: white;
  font-size: 9px;
  font-weight: 800;
  border-radius: 8px;
  line-height: 1;
  vertical-align: middle;
}

/* ─── Ribbon content ─────────────────────────────────────────────────────── */
.ribbon-content {
  max-height: 152px;
  overflow: hidden;
  background: var(--jl-panel-bg-alt);
  border-bottom: 1px solid var(--jl-border);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.ribbon-content.collapsed {
  max-height: 0;
  border-bottom: none;
  padding-bottom: 0;
}

.ribbon-content-inner {
  display: flex;
  flex-direction: row;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  min-height: 148px;
  max-height: 148px;
  padding: 2px 4px;
}

/* Scrollbar for ribbon overflow */
.ribbon-content-inner::-webkit-scrollbar {
  height: 4px;
  background: transparent;
}
.ribbon-content-inner::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}
.ribbon-content-inner::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.ribbon-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 108px;
  min-width: 108px;
  height: 148px;
  flex-shrink: 0;
  padding: 0px 6px 2px;
  border-right: 1px solid var(--jl-border);
  margin-right: 4px;
  box-sizing: border-box;
}
.ribbon-logo-img {
  width: 96px;
  height: 96px;
  object-fit: contain;
  border-radius: 8px;
  flex-shrink: 0;
  margin-bottom: 15px;
}
.ribbon-logo-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--jl-text-secondary);
  font-family: var(--jl-font-ui);
  margin-top: 1px;
}

/* Stub placeholder */
:deep(.ribbon-stub) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 84px;
  color: var(--jl-text-muted);
  font-family: var(--jl-font-ui);
  font-size: 13px;
  letter-spacing: 0.05em;
  font-style: italic;
}
</style>
