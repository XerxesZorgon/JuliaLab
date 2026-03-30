<template>
  <div class="variables-panel">
    <!-- Toolbar -->
    <div class="workspace-toolbar">
      <span class="workspace-count">
        {{ tableData.length }} variable{{ tableData.length !== 1 ? 's' : '' }}
      </span>
      <button class="workspace-refresh" @click="refreshVariables" title="Refresh variables">
        &#x21bb;
      </button>
    </div>

    <!-- DataTable or empty state -->
    <div class="panel-content">
      <div v-if="tableData.length === 0" class="no-variables">
        <n-icon size="32" color="var(--jl-text-muted)"><InformationCircleOutline /></n-icon>
        <p v-if="isDebugging">No variables available</p>
        <p v-else>No workspace variables</p>
        <p class="hint" v-if="isDebugging">
          Variables will appear when execution pauses at a breakpoint
        </p>
        <p class="hint" v-else>
          Run a Julia script or Jupyter notebook cell to see workspace variables
        </p>
      </div>

      <n-data-table
        v-else
        :columns="columns"
        :data="tableData"
        :row-props="rowProps"
        :row-class-name="rowClassName"
        size="small"
        :single-line="false"
        :bordered="false"
        flex-height
        class="workspace-table"
      />
    </div>
  </div>

  <!-- Variable Details Modal (preserved from original) -->
  <n-modal
    v-model:show="showModal"
    preset="card"
    :title="`Variable: ${selectedVariable?.name}`"
    style="width: 95%; max-width: 1400px; max-height: 95vh"
  >
    <div v-if="selectedVariable" class="modal-content">
      <!-- Metadata in horizontal layout -->
      <div class="modal-metadata">
        <div class="metadata-item">
          <strong>Type:</strong> <span>{{ selectedVariable.type }}</span>
        </div>
        <div v-if="selectedVariable.dimensions" class="metadata-item">
          <strong>Size:</strong>
          <span>{{ selectedVariable.dimensions }}</span>
        </div>
        <div
          v-if="selectedVariable.is_dataframe && selectedVariable.parsed_data"
          class="metadata-item"
        >
          <strong>Rows:</strong>
          <span>{{ selectedVariable.parsed_data.length }}</span>
        </div>
        <div
          v-if="selectedVariable.is_dataframe && getTableColumns(selectedVariable).length > 0"
          class="metadata-item"
        >
          <strong>Columns:</strong>
          <span>{{ getTableColumns(selectedVariable).length }}</span>
        </div>
        <div
          v-if="selectedVariable.is_dataframe && selectedVariable.column_names"
          class="metadata-item"
        >
          <strong>Column Names:</strong>
          <span>{{ selectedVariable.column_names.join(', ') }}</span>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="selectedVariable.loading" class="loading-indicator">
        <n-spin size="small" />
        <span style="margin-left: 8px">Loading full value...</span>
      </div>

      <template v-else>
        <div v-if="isTruncated(selectedVariable.value)" class="truncation-warning">
          Large variable - showing first 10,000 characters. Full pagination support coming soon!
        </div>

        <!-- Display table for arrays/matrices using new DataGrid -->
        <div
          v-if="isArrayData(selectedVariable)"
          class="table-container"
        >
          <DataGrid 
            :variable-name="selectedVariable.name"
            :variable-type="selectedVariable.type"
            :initial-total-rows="selectedVariable.element_count || selectedVariable.parsed_data?.length"
            :initial-total-cols="selectedVariable.column_names?.length || getTableColumns(selectedVariable).length"
            :column-names="selectedVariable.column_names"
          />
        </div>

        <!-- Display raw value for non-array data -->
        <pre v-else class="modal-value">{{ selectedVariable.value || 'N/A' }}</pre>
      </template>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, h, watch, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { NIcon, NModal, NSpin, NDataTable } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { InformationCircleOutline } from '@vicons/ionicons5';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { error, warn } from '../../utils/logger';
import { useAppStore } from '../../store/appStore';
import DataGrid from '../shared/DataGrid.vue';

// Props
const props = defineProps<{
  isDebugging?: boolean;
}>();

// Access the app store for persisted workspace variables
const appStore = useAppStore();

// State - local ref for debug mode variables (from debug:execution-stopped events)
const debugVariablesLocal = ref<Record<string, any>>({});
const showModal = ref(false);
const selectedVariable = ref<any>(null);

// Computed property that always returns the correct variables source
const debugVariables = computed(() => {
  return props.isDebugging ? debugVariablesLocal.value : appStore.workspaceVariables;
});

// ─── DataTable columns ──────────────────────────────────────────────────────
const columns: DataTableColumns = [
  {
    title: 'Name',
    key: 'name',
    width: 130,
    ellipsis: { tooltip: true },
    render(row: any) {
      return h('span', { class: 'cell-name' }, row.name);
    },
  },
  {
    title: 'Type',
    key: 'type',
    width: 110,
    ellipsis: { tooltip: true },
    render(row: any) {
      return h('span', { class: 'cell-type' }, row.type);
    },
  },
  {
    title: 'Size',
    key: 'size',
    width: 80,
    render(row: any) {
      return h('span', { class: 'cell-size' }, row.size);
    },
  },
  {
    title: 'Value',
    key: 'value',
    ellipsis: { tooltip: true },
    render(row: any) {
      return h('span', { class: 'cell-value' }, row.value);
    },
  },
];

// ─── Computed table data ────────────────────────────────────────────────────
const tableData = computed(() => {
  return Object.entries(debugVariables.value).map(([name, variable]) => ({
    name,
    type: variable.type || 'Unknown',
    size: getVariableSize(variable),
    value: getVariableDisplayValue(variable),
    _raw: variable,
  }));
});

// Row props — click handler for all variables
const rowProps = (row: any) => {
  return {
    style: 'cursor: pointer;',
    onClick: () => {
      showVariableModal(row.name, row._raw);
    },
  };
};

// Row class — highlight expandable rows
const rowClassName = (row: any) => {
  return row._raw.is_expandable ? 'expandable-row' : '';
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const getVariableSize = (variable: any): string => {
  if (variable.dimensions) return variable.dimensions;
  if (variable.element_count != null) return String(variable.element_count);
  return '\u2014'; // em-dash
};

const getVariableDisplayValue = (variable: any): string => {
  if (variable.summary) return variable.summary;

  if (variable.is_array) {
    const count = variable.element_count || 0;
    return `[${count} elements]`;
  }
  if (variable.is_dict) return '{...}';
  if (variable.is_struct) {
    const typeName = variable.type || 'Unknown';
    return `${typeName}{...}`;
  }

  if (variable.var_type?.is_array) {
    const count = variable.var_type.element_count || 0;
    return `[${count} elements]`;
  }
  if (variable.var_type?.is_dict) return '{...}';
  if (variable.var_type?.is_struct) return `${variable.var_type.name}{...}`;

  return variable.value || '[Empty]';
};

// ─── Modal logic (preserved from original) ──────────────────────────────────
const showVariableModal = async (name: string, variable: any) => {
  const variablesCountBefore = Object.keys(debugVariables.value).length;

  const isActuallyDataFrame =
    variable.is_dataframe || (variable.type && variable.type.includes('DataFrame'));
  if (isActuallyDataFrame && !variable.is_dataframe) {
    variable.is_dataframe = true;
  }

  selectedVariable.value = { name, ...variable };
  showModal.value = true;

  await nextTick();
  const variablesCountAfterModal = Object.keys(debugVariables.value).length;
  const storeCountAfterModal = Object.keys(appStore.workspaceVariables).length;

  if (variablesCountBefore > 0 && variablesCountAfterModal === 0) {
    await error('VARIABLES WERE CLEARED AFTER MODAL OPEN!');
    await error(
      `Before: ${variablesCountBefore}, After: ${variablesCountAfterModal}, Store still has: ${storeCountAfterModal}`
    );
  }

  const needsFetch = variable.needs_fetch && !variable.value;
  const isDataFrameNeedingFetch = variable.is_dataframe && !variable.parsed_data && !variable.value;

  if (needsFetch || isDataFrameNeedingFetch) {
    selectedVariable.value = { ...selectedVariable.value, loading: true };

    try {
      const variablesCountBeforeInvoke = Object.keys(debugVariables.value).length;

      const fullValue = await invoke<string | null>('get_variable_value', { variableName: name });

      const variablesCountAfterInvoke = Object.keys(debugVariables.value).length;

      if (variablesCountBeforeInvoke > 0 && variablesCountAfterInvoke === 0) {
        await error('VARIABLES WERE CLEARED AFTER INVOKE!');
        await error(
          `Before invoke: ${variablesCountBeforeInvoke}, After invoke: ${variablesCountAfterInvoke}`
        );
      }

      let processedVariable: any = {
        ...selectedVariable.value,
        value: fullValue || 'Unable to fetch value',
        loading: false,
      };

      if (variable.is_dataframe && fullValue) {
        try {
          const parsed = JSON.parse(fullValue);
          if (Array.isArray(parsed)) {
            processedVariable.parsed_data = parsed;
            processedVariable.value = fullValue;
          } else if (typeof parsed === 'object' && parsed.parsed_data) {
            processedVariable.parsed_data = parsed.parsed_data;
          }
        } catch (e) {
          // Not JSON — string representation, handled by table display
        }
      }

      selectedVariable.value = processedVariable;
    } catch (err) {
      error(`VariablesPanel: Failed to fetch variable value: ${err}`);
      selectedVariable.value = {
        ...selectedVariable.value,
        value: 'Error loading value',
        loading: false,
      };
    }
  }
};

const isTruncated = (value: string) => {
  return value && value.includes('[Truncated - showing first');
};

const isStructuredData = (variable: any): boolean => {
  if (!variable) return false;
  if (variable.is_dataframe || (variable.type && variable.type.includes('DataFrame'))) return true;
  const type = variable.type || variable.var_type?.name || '';
  return type.includes('Table') || type.includes('Dict');
};

const isArrayData = (variable: any): boolean => {
  if (!variable) return false;
  if (variable.is_dataframe || (variable.type && variable.type.includes('DataFrame'))) return true;
  if (variable.is_array || (variable.var_type && variable.var_type.is_array)) return true;
  const value = variable.value || '';
  return value.startsWith('[') && value.includes(',');
};

const getTableColumns = (variable: any): Array<{ key: string; title: string; width?: number }> => {
  const value = variable.value || '';
  const isStructured = isStructuredData(variable);

  if (
    variable.is_dataframe &&
    variable.parsed_data &&
    Array.isArray(variable.parsed_data) &&
    variable.parsed_data.length > 0
  ) {
    const firstRow = variable.parsed_data[0];
    const columnNames = variable.column_names || Object.keys(firstRow);
    return columnNames.map((key: string) => {
      const minWidth = 100;
      const maxWidth = 300;
      const width = Math.max(minWidth, Math.min(maxWidth, key.length * 8 + 40));
      return { title: key, key, width };
    });
  }

  if (variable.is_dataframe) {
    if (typeof variable.value === 'string') {
      try {
        const parsed = JSON.parse(variable.value);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const firstRow = parsed[0];
          const columnNames = variable.column_names || Object.keys(firstRow);
          return columnNames.map((key: string) => {
            const minWidth = 100;
            const maxWidth = 300;
            const width = Math.max(minWidth, Math.min(maxWidth, key.length * 8 + 40));
            return { title: key, key, width };
          });
        }
      } catch (e) {
        // not JSON
      }
    } else if (Array.isArray(variable.value) && variable.value.length > 0) {
      const firstRow = variable.value[0];
      return Object.keys(firstRow).map((key) => ({ title: key, key, width: 150 }));
    }
    return [];
  }

  try {
    if (value.match(/^\[.*\]$/s) && !value.includes(';')) {
      const cols: Array<{ key: string; title: string; width?: number }> = [];
      if (isStructured) cols.push({ title: 'Index', key: 'index', width: 60 });
      cols.push({ title: isStructured ? 'Value' : '', key: 'value' });
      return cols;
    }

    const rows = value.split(';').map((r: string) => r.trim());
    if (rows.length > 1) {
      const firstRow = rows[0].replace('[', '').split(/\s+/).filter((v: string) => v);
      const numCols = firstRow.length;
      const cols: Array<{ key: string; title: string; width?: number }> = [];
      if (isStructured) cols.push({ title: 'Row', key: 'row', width: 60 });
      for (let i = 0; i < numCols; i++) {
        cols.push({ title: isStructured ? `Col ${i + 1}` : '', key: `col${i}`, width: 120 });
      }
      return cols;
    }
  } catch (e) {
    error(`Error parsing array structure: ${e}`);
  }

  const cols: Array<{ key: string; title: string; width?: number }> = [];
  if (isStructured) cols.push({ title: 'Index', key: 'index', width: 60 });
  cols.push({ title: isStructured ? 'Value' : '', key: 'value' });
  return cols;
};

const getTableData = (variable: any): any[] => {
  if (variable.is_dataframe && variable.parsed_data && Array.isArray(variable.parsed_data)) {
    return variable.parsed_data;
  }

  if (variable.is_dataframe) {
    if (typeof variable.value === 'string') {
      try {
        const parsed = JSON.parse(variable.value);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // not JSON
      }
    } else if (Array.isArray(variable.value)) {
      return variable.value;
    }
    return [];
  }

  const value = variable.value || '';
  const isStructured = isStructuredData(variable);

  try {
    if (value.match(/^\[.*\]$/s) && !value.includes(';')) {
      const cleanValue = value.replace(/^\[|\]$/g, '').trim();
      const items = cleanValue.split(',').map((v: string) => v.trim());
      return items.map((item: string, index: number) => {
        const rowData: any = { value: item };
        if (isStructured) rowData.index = index + 1;
        return rowData;
      });
    }

    const rows = value.replace(/^\[|\]$/g, '').split(';').map((r: string) => r.trim());
    return rows.map((row: string, rowIndex: number) => {
      const values = row.split(/\s+/).filter((v: string) => v);
      const rowData: any = {};
      if (isStructured) rowData.row = rowIndex + 1;
      values.forEach((val: string, colIndex: number) => {
        rowData[`col${colIndex}`] = val;
      });
      return rowData;
    });
  } catch (e) {
    error(`Error parsing array data: ${e}`);
    const errorData: any = { value: 'Error parsing data' };
    if (isStructured) errorData.index = 1;
    return [errorData];
  }
};

// ─── Refresh variables from backend ─────────────────────────────────────────
const refreshVariables = async () => {
  try {
    if (props.isDebugging) {
      try {
        const variables = await invoke<Record<string, any>>('debug_get_variables');
        if (variables && Object.keys(variables).length > 0) {
          debugVariablesLocal.value = variables;
        }
      } catch (err: any) {
        const errorMessage = err?.message || String(err);
        if (
          !errorMessage.includes('not initialized') &&
          !errorMessage.includes('not paused') &&
          !errorMessage.includes('No variables') &&
          !errorMessage.includes('not available')
        ) {
          await warn(`Failed to refresh debug variables: ${errorMessage}`);
        }
      }
    } else {
      try {
        await invoke('refresh_workspace_variables');
      } catch (err: any) {
        // Expected if no code has been executed or Julia process is not ready
      }
    }
  } catch (err) {
    await warn(`Failed to refresh variables: ${err}`);
  }
};

// Watch for debugging state changes
watch(
  () => props.isDebugging,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      if (newValue) {
        refreshVariables();
      } else {
        debugVariablesLocal.value = {};
        if (Object.keys(appStore.workspaceVariables).length === 0) {
          refreshVariables();
        }
      }
    }
  }
);

// ─── Event listeners ────────────────────────────────────────────────────────
let unlistenVariables: (() => void) | null = null;
let unlistenExecutionStopped: (() => void) | null = null;
let unlistenWorkspaceVariables: (() => void) | null = null;
let unlistenDebugCompleted: (() => void) | null = null;
let unlistenDebugSessionStarted: (() => void) | null = null;
let unlistenBackendBusy: (() => void) | null = null;

onMounted(async () => {
  try {
    unlistenBackendBusy = await listen('backend-busy', async () => {
      // NOT clearing variables — will be updated by workspace:variables-updated
    });

    unlistenDebugSessionStarted = await listen('debug:session-started', async () => {
      debugVariablesLocal.value = {};
      appStore.setWorkspaceVariables({});
    });

    unlistenExecutionStopped = await listen('debug:execution-stopped', async (event: any) => {
      const variables = event.payload?.variables || event.payload?.variable_summaries;
      if (variables) {
        debugVariablesLocal.value = variables;
      } else {
        await warn('No variables in payload');
        debugVariablesLocal.value = {};
      }
    });

    unlistenVariables = await listen('debug:variables-updated', async (event: any) => {
      if (event.payload) {
        debugVariablesLocal.value = event.payload;
      } else {
        await warn('debug:variables-updated event has no payload');
      }
    });

    unlistenWorkspaceVariables = await listen('workspace:variables-updated', async (event: any) => {
      if (!props.isDebugging) {
        if (event.payload) {
          appStore.setWorkspaceVariables(event.payload);
        } else {
          const storeCount = Object.keys(appStore.workspaceVariables).length;
          await warn('workspace:variables-updated event has NO payload!');
          await warn(
            `Ignoring to prevent accidental clearing. Store still has: ${storeCount} variables`
          );
        }
      }
    });

    unlistenDebugCompleted = await listen('debug:session-completed', async (event: any) => {
      const variables = event.payload?.variables;
      if (variables) {
        debugVariablesLocal.value = variables;
      } else {
        await warn('No variables in session-completed payload');
      }
    });

    const hasVariables = props.isDebugging
      ? Object.keys(debugVariablesLocal.value).length > 0
      : Object.keys(appStore.workspaceVariables).length > 0;

    if (!hasVariables) {
      await refreshVariables();
    }
  } catch (err) {
    error(`VariablesPanel: Failed to set up event listeners: ${err}`);
  }
});

onUnmounted(() => {
  if (unlistenVariables) unlistenVariables();
  if (unlistenExecutionStopped) unlistenExecutionStopped();
  if (unlistenWorkspaceVariables) unlistenWorkspaceVariables();
  if (unlistenDebugCompleted) unlistenDebugCompleted();
  if (unlistenDebugSessionStarted) unlistenDebugSessionStarted();
  if (unlistenBackendBusy) unlistenBackendBusy();
});
</script>

<style scoped>
.variables-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--jl-panel-bg);
}

/* ─── Toolbar ────────────────────────────────────────────────────────────── */
.workspace-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 28px;
  padding: 0 8px;
  background: var(--jl-panel-bg-alt, #252525);
  border-bottom: 1px solid var(--jl-border);
  flex-shrink: 0;
}

.workspace-count {
  font-size: 11px;
  color: var(--jl-text-secondary);
  font-family: var(--jl-font-ui);
}

.workspace-refresh {
  background: none;
  border: 1px solid transparent;
  border-radius: 3px;
  color: var(--jl-text-secondary);
  font-size: 14px;
  cursor: pointer;
  padding: 1px 4px;
  line-height: 1;
  transition: all 0.12s ease;
}
.workspace-refresh:hover {
  color: var(--jl-accent-green);
  border-color: var(--jl-border-light, #2a2a2a);
  background: rgba(56, 152, 38, 0.08);
}

/* ─── Panel content ──────────────────────────────────────────────────────── */
.panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.no-variables {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  text-align: center;
  color: var(--jl-text-secondary);
  font-family: var(--jl-font-ui);
}
.no-variables p {
  margin: 8px 0 0;
  font-size: 13px;
}
.no-variables .hint {
  font-size: 11px;
  color: var(--jl-text-muted);
  margin-top: 4px;
}

/* ─── DataTable overrides ────────────────────────────────────────────────── */
.workspace-table {
  flex: 1;
}

/* Custom cell rendering classes */
:deep(.cell-name) {
  font-family: var(--jl-font-mono);
  font-weight: 600;
  color: var(--jl-accent-green);
  font-size: 12px;
}

:deep(.cell-type) {
  font-style: italic;
  color: var(--jl-text-secondary);
  font-size: 11px;
}

:deep(.cell-size) {
  color: var(--jl-text-secondary);
  font-family: var(--jl-font-mono);
  font-size: 11px;
}

:deep(.cell-value) {
  font-family: var(--jl-font-mono);
  color: var(--jl-text-primary);
  font-size: 12px;
}

/* Expandable row styling */
:deep(.expandable-row td) {
  border-left: 2px solid var(--jl-accent-green);
}
:deep(.expandable-row:hover td) {
  background-color: rgba(56, 152, 38, 0.06);
}

/* Compact row height for MATLAB density */
:deep(.n-data-table .n-data-table-td) {
  padding: 4px 8px;
}
:deep(.n-data-table .n-data-table-th) {
  padding: 4px 8px;
  font-size: 11px;
  font-family: var(--jl-font-ui);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--jl-text-secondary);
}

/* Table theme — adapts to both light and dark via CSS variables */
:deep(.n-data-table) {
  --n-th-color: var(--jl-panel-bg-alt);
  --n-td-color: var(--jl-panel-bg);
  --n-td-color-hover: var(--jl-border-light);
  --n-border-color: var(--jl-border);
  --n-th-text-color: var(--jl-text-secondary);
  --n-td-text-color: var(--jl-text-primary);
}

/* ─── Modal styles (preserved from original) ─────────────────────────────── */
.modal-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(95vh - 120px);
  overflow: hidden;
}

.modal-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 8px 12px;
  background-color: var(--jl-panel-bg-alt, #252525);
  border-radius: 4px;
  border: 1px solid var(--jl-border);
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.metadata-item strong {
  color: var(--jl-accent-green);
  font-weight: 600;
}
.metadata-item span {
  color: var(--jl-text-primary);
}

.truncation-warning {
  background-color: rgba(243, 156, 18, 0.12);
  border: 1px solid var(--jl-warning, #F39C12);
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 8px;
  color: var(--jl-text-primary);
  font-size: 12px;
  line-height: 1.5;
}

.modal-value {
  background-color: var(--jl-bg);
  border: 1px solid var(--jl-border);
  border-radius: 4px;
  padding: 12px;
  font-family: var(--jl-font-mono);
  font-size: 12px;
  color: var(--jl-text-primary);
  max-height: 400px;
  overflow: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.table-container {
  margin-top: 8px;
  border-radius: 4px;
  overflow-x: auto;
  overflow-y: auto;
  max-width: 100%;
  width: 100%;
  max-height: 700px;
}
.table-container.hide-headers thead {
  display: none;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--jl-bg);
  font-size: 12px;
  min-width: max-content;
}
.data-table th {
  background-color: var(--jl-panel-bg-alt, #252525);
  color: var(--jl-accent-green);
  font-weight: 600;
  white-space: nowrap;
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--jl-border);
  position: sticky;
  top: 0;
  z-index: 1;
}
.data-table td {
  color: var(--jl-text-primary);
  font-family: var(--jl-font-mono);
  white-space: nowrap;
  padding: 6px 12px;
  border-bottom: 1px solid var(--jl-border);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.data-table tr:hover {
  background-color: var(--jl-border-light);
}
.data-table tr.even {
  background-color: var(--jl-bg);
}
.data-table tr.even:hover {
  background-color: var(--jl-border-light);
}

.loading-indicator {
  display: flex;
  align-items: center;
  padding: 20px;
  color: var(--jl-accent-green);
  font-size: 13px;
}

/* ─── Scrollbar ──────────────────────────────────────────────────────────── */
.panel-content::-webkit-scrollbar {
  width: 8px;
}
.panel-content::-webkit-scrollbar-track {
  background: var(--jl-panel-bg);
}
.panel-content::-webkit-scrollbar-thumb {
  background: var(--jl-border);
  border-radius: 4px;
}
.panel-content::-webkit-scrollbar-thumb:hover {
  background: var(--jl-text-muted);
}
</style>
