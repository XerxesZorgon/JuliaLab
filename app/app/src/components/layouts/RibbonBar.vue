<template>
  <div class="ribbon-bar">
    <!-- Tab bar row -->
    <div class="ribbon-tabs">
      <button
        v-for="tab in TABS"
        :key="tab"
        class="ribbon-tab"
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab; layoutStore.ribbonVisible = true"
      >
        {{ tab }}
        <span v-if="tab === 'PLOTS' && plotStore.plotCount > 0" class="ribbon-tab-badge">
          {{ plotStore.plotCount > 99 ? '99+' : plotStore.plotCount }}
        </span>
      </button>

      <!-- Spacer -->
      <div class="ribbon-tabs-spacer" />

      <!-- Pin toggle -->
      <button
        class="ribbon-pin"
        :class="{ pinned: layoutStore.ribbonPinned }"
        :title="layoutStore.ribbonPinned ? 'Unpin ribbon' : 'Pin ribbon'"
        @click="layoutStore.ribbonPinned = !layoutStore.ribbonPinned"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path v-if="layoutStore.ribbonPinned" d="M15 3h6v6 M9 21H3v-6 M21 3l-7 7 M3 21l7-7" />
          <path v-else d="M4 14h6v6 M20 10h-6V4 M14 10l7-7 M3 21l7-7" />
        </svg>
      </button>
    </div>

    <!-- Ribbon content row (collapsible via max-height) -->
    <div
      class="ribbon-content"
      :class="{ collapsed: !showRibbon }"
    >
      <div class="ribbon-content-inner">
        <component :is="tabComponent" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type Component } from 'vue';
import { useLayoutStore } from '../../store/layoutStore';
import { usePlotStore } from '../../store/plotStore';
import HomeTab from '../ribbon/HomeTab.vue';
import ViewTab from '../ribbon/ViewTab.vue';

const layoutStore = useLayoutStore();
const plotStore = usePlotStore();

const TABS = ['HOME', 'PLOTS', 'APPS', 'LIVE EDITOR', 'INSERT', 'VIEW'] as const;
type TabName = typeof TABS[number];

const activeTab = ref<TabName>('HOME');

// Ribbon is visible when pinned, or when explicitly toggled visible
const showRibbon = computed(() => layoutStore.ribbonVisible || layoutStore.ribbonPinned);

// Map tabs to components
const tabComponents: Record<TabName, Component> = {
  HOME: HomeTab,
  PLOTS: { template: '<div class="ribbon-stub">PLOTS tab content</div>' },
  APPS: { template: '<div class="ribbon-stub">APPS tab content</div>' },
  'LIVE EDITOR': { template: '<div class="ribbon-stub">LIVE EDITOR tab content</div>' },
  INSERT: { template: '<div class="ribbon-stub">INSERT tab content</div>' },
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
  background: var(--jl-panel-bg);
  border-bottom: 1px solid var(--jl-border);
}

/* ─── Tab bar ────────────────────────────────────────────────────────────── */
.ribbon-tabs {
  display: flex;
  align-items: flex-end;
  height: 28px;
  background: var(--jl-panel-bg);
  border-bottom: 1px solid var(--jl-border);
  padding: 0 4px;
}

.ribbon-tab {
  position: relative;
  height: 100%;
  padding: 0 14px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  border-top: 2px solid transparent;
  cursor: pointer;
  color: var(--jl-text-muted);
  font-size: 11.5px;
  font-weight: 400;
  font-family: var(--jl-font-ui);
  letter-spacing: 0.04em;
  transition: all 0.1s;
}

.ribbon-tab-badge {
  position: absolute;
  top: 4px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--jl-accent-green);
  color: white;
  font-size: 9px;
  font-weight: 600;
  border-radius: 8px;
  line-height: 1;
}
.ribbon-tab:hover {
  color: var(--jl-text-secondary);
}
.ribbon-tab.active {
  color: var(--jl-text-primary);
  font-weight: 600;
  background: var(--jl-panel-bg-alt);
  border-bottom-color: var(--jl-accent-green);
}

.ribbon-tabs-spacer {
  flex: 1;
}

.ribbon-pin {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-bottom: 2px;
  background: none;
  border: 1px solid transparent;
  border-radius: 3px;
  cursor: pointer;
  color: var(--jl-text-muted);
  transition: all 0.12s;
}
.ribbon-pin:hover {
  color: var(--jl-text-secondary);
  border-color: var(--jl-border-light);
}
.ribbon-pin.pinned {
  color: var(--jl-accent-green);
}

/* ─── Ribbon content ─────────────────────────────────────────────────────── */
.ribbon-content {
  max-height: 68px;
  overflow: hidden;
  background: var(--jl-panel-bg-alt);
  border-bottom: 1px solid var(--jl-bg);
  transition: max-height 0.18s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}
.ribbon-content.collapsed {
  max-height: 0;
  border-bottom: none;
  box-shadow: none;
}

.ribbon-content-inner {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  overflow-x: auto;
  overflow-y: hidden;
  min-height: 68px;
  padding: 0 2px;
}

/* Scrollbar for ribbon overflow */
.ribbon-content-inner::-webkit-scrollbar {
  height: 4px;
  background: var(--jl-bg);
}
.ribbon-content-inner::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 2px;
}

/* Stub placeholder */
:deep(.ribbon-stub) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 68px;
  color: var(--jl-text-muted);
  font-family: var(--jl-font-ui);
  font-size: 12px;
  letter-spacing: 0.04em;
}
</style>
