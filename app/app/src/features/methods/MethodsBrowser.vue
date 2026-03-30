<template>
  <div class="methods-browser">
    <!-- Search bar -->
    <div class="mb-search-bar">
      <n-input
        v-model:value="funcName"
        placeholder="Function name, e.g. sin, Base.push!"
        size="small"
        clearable
        @keydown.enter="inspect"
      >
        <template #prefix>
          <n-icon><SearchOutline /></n-icon>
        </template>
      </n-input>
      <n-button size="small" type="primary" :loading="loading" :disabled="!funcName.trim()" @click="inspect">
        Inspect
      </n-button>
    </div>

    <!-- Results -->
    <div class="mb-content">
      <!-- Idle state -->
      <div v-if="!inspected" class="mb-empty">
        <n-icon size="40" color="var(--jl-text-muted)"><CodeSlashOutline /></n-icon>
        <p>Enter a function name above to inspect its methods</p>
      </div>

      <!-- Error -->
      <div v-else-if="errorMsg" class="mb-error">
        <span>{{ errorMsg }}</span>
      </div>

      <!-- No methods -->
      <div v-else-if="methods.length === 0 && !loading" class="mb-empty">
        <p>No methods found for <code>{{ lastInspected }}</code></p>
      </div>

      <!-- Loading -->
      <div v-else-if="loading" class="mb-loading">
        <n-spin size="small" />
        <span>Inspecting {{ funcName }}…</span>
      </div>

      <!-- Methods table -->
      <div v-else class="mb-table-wrap">
        <div class="mb-summary">
          <span class="mb-func-name">{{ lastInspected }}</span>
          <span class="mb-count">{{ methods.length }} method{{ methods.length !== 1 ? 's' : '' }}</span>
        </div>
        <n-data-table
          :columns="columns"
          :data="methods"
          size="small"
          :bordered="false"
          :single-line="false"
          :max-height="600"
          class="mb-table"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted, onUnmounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { NInput, NButton, NIcon, NDataTable, NSpin, NTooltip } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { SearchOutline, CodeSlashOutline, OpenOutline } from '@vicons/ionicons5';
import { open as openExternal } from '@tauri-apps/plugin-shell';

interface MethodEntry {
  signature: string;
  file: string;
  line: number;
  module: string;
  nargs: number;
}

const funcName = ref('');
const lastInspected = ref('');
const methods = ref<MethodEntry[]>([]);
const loading = ref(false);
const inspected = ref(false);
const errorMsg = ref('');

let unlistenMethods: (() => void) | null = null;
let pendingInspect: string | null = null;

const columns: DataTableColumns<MethodEntry> = [
  {
    title: 'Signature',
    key: 'signature',
    ellipsis: { tooltip: true },
    render(row) {
      return h('span', { class: 'mb-sig', style: 'font-family: var(--jl-font-mono); font-size: 11px;' }, row.signature);
    },
  },
  {
    title: 'Module',
    key: 'module',
    width: 90,
    render(row) {
      return h('span', { style: 'font-size: 11px; color: var(--jl-accent-green);' }, row.module);
    },
  },
  {
    title: 'Location',
    key: 'location',
    width: 130,
    render(row) {
      const fileName = row.file.split(/[\\/]/).pop() || row.file;
      const label = `${fileName}:${row.line}`;
      const canOpen = row.file && !row.file.startsWith('<');
      return h('div', { style: 'display: flex; align-items: center; gap: 4px;' }, [
        h('span', {
          style: 'font-size: 10px; color: var(--jl-text-muted); font-family: var(--jl-font-mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
          title: `${row.file}:${row.line}`,
        }, label),
        canOpen
          ? h(NButton, {
              size: 'tiny',
              quaternary: true,
              circle: true,
              title: 'Open file',
              onClick: () => openExternal(`file://${row.file}`),
            }, { default: () => h(NIcon, { size: 12 }, { default: () => h(OpenOutline) }) })
          : null,
      ]);
    },
  },
];

const inspect = async () => {
  const name = funcName.value.trim();
  if (!name) return;

  loading.value = true;
  inspected.value = true;
  errorMsg.value = '';
  methods.value = [];
  pendingInspect = name;

  try {
    await invoke('execute_code', {
      code: `browse_methods("${name.replace(/"/g, '\\"')}")`,
      executionType: 'api_call',
      filePath: null,
    });
  } catch (e: any) {
    loading.value = false;
    errorMsg.value = String(e);
  }
};

onMounted(async () => {
  unlistenMethods = await listen<any>('methods:info', (event) => {
    const payload = event.payload;
    // Only process if this matches the pending request
    if (payload.id && pendingInspect && payload.id !== pendingInspect) return;

    loading.value = false;
    lastInspected.value = payload.id || pendingInspect || '';
    pendingInspect = null;

    if (payload.error) {
      errorMsg.value = payload.error;
      methods.value = [];
    } else {
      errorMsg.value = '';
      methods.value = Array.isArray(payload.methods) ? payload.methods : [];
    }
  });
});

onUnmounted(() => {
  unlistenMethods?.();
});
</script>

<style scoped>
.methods-browser {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--jl-panel-bg);
  overflow: hidden;
}

.mb-search-bar {
  display: flex;
  gap: 6px;
  padding: 8px;
  background-color: var(--jl-panel-bg-alt);
  border-bottom: 1px solid var(--jl-border);
  flex-shrink: 0;
}

.mb-content {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.mb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 12px;
  color: var(--jl-text-muted);
  font-family: var(--jl-font-ui);
  font-size: 13px;
  padding: 24px;
  text-align: center;
}

.mb-error {
  padding: 12px 16px;
  margin: 12px;
  background: rgba(203, 60, 51, 0.1);
  border: 1px solid var(--jl-accent-red, #cb3c33);
  border-radius: 4px;
  color: var(--jl-accent-red, #cb3c33);
  font-family: var(--jl-font-mono);
  font-size: 12px;
}

.mb-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  color: var(--jl-text-secondary);
  font-size: 13px;
}

.mb-table-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.mb-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background-color: var(--jl-panel-bg-alt);
  border-bottom: 1px solid var(--jl-border);
  flex-shrink: 0;
}

.mb-func-name {
  font-family: var(--jl-font-mono);
  font-weight: 600;
  color: var(--jl-accent-green);
  font-size: 13px;
}

.mb-count {
  font-size: 11px;
  color: var(--jl-text-muted);
}

.mb-table {
  flex: 1;
}

:deep(.n-data-table .n-data-table-td) {
  padding: 3px 8px;
}
:deep(.n-data-table .n-data-table-th) {
  padding: 4px 8px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--jl-text-secondary);
  font-family: var(--jl-font-ui);
}
</style>
