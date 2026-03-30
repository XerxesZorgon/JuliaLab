<template>
  <div class="data-grid-container">
    <div class="grid-header">
      <div class="grid-info">
        <span class="grid-tag">{{ variableType }}</span>
        <span class="grid-dimensions">{{ totalRows }} x {{ totalCols }}</span>
      </div>
      <div class="grid-actions">
        <n-pagination
          v-model:page="currentPage"
          :page-count="pageCount"
          size="small"
          show-quick-jumper
          @update:page="handlePageChange"
        />
        <n-select
          v-model:value="pageSize"
          :options="pageSizeOptions"
          size="small"
          style="width: 100px"
          @update:value="handlePageSizeChange"
        />
      </div>
    </div>

    <div class="grid-wrapper" ref="tableWrapper">
      <n-spin :show="loading">
        <table class="matlab-grid">
          <thead>
            <tr>
              <th class="index-col"></th>
              <th v-for="col in columns" :key="col">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in tableData" :key="row.__row_index__ || rowIndex">
              <td class="index-col">{{ row.__row_index__ != null ? row.__row_index__ : (currentPage - 1) * pageSize + rowIndex + 1 }}</td>
              <td v-for="col in columns" :key="col" class="data-cell">
                <div class="cell-content" :title="String(row[col])">
                  {{ formatValue(row[col]) }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { NPagination, NSelect, NSpin } from 'naive-ui';
import { invoke } from '@tauri-apps/api/core';

const props = defineProps<{
  variableName: string;
  variableType?: string;
  initialTotalRows?: number;
  initialTotalCols?: number;
  columnNames?: string[];
}>();

const loading = ref(false);
const tableData = ref<any[]>([]);
const totalRows = ref(props.initialTotalRows || 0);
const totalCols = ref(props.initialTotalCols || 0);
const currentPage = ref(1);
const pageSize = ref(100);
const columns = ref<string[]>(props.columnNames || []);

const pageSizeOptions = [
  { label: '50 rows', value: 50 },
  { label: '100 rows', value: 100 },
  { label: '200 rows', value: 200 },
  { label: '500 rows', value: 500 },
];

const pageCount = computed(() => Math.ceil(totalRows.value / pageSize.value));

const fetchPage = async () => {
  if (!props.variableName) return;
  
  loading.value = true;
  try {
    const rowStart = (currentPage.value - 1) * pageSize.value + 1;
    const result = await invoke<any>('get_variable_chunk', {
      variableName: props.variableName,
      rowStart,
      rowCount: pageSize.value,
      colStart: 1,
      colCount: 0, // 0 means all columns
    });

    if (result) {
      tableData.value = result.data || [];
      totalRows.value = result.total_rows;
      totalCols.value = result.total_cols;
      
      // Update columns if we don't have them or they changed
      if (tableData.value.length > 0) {
        const firstRow = tableData.value[0];
        const detectedCols = Object.keys(firstRow).filter(k => k !== '__row_index__');
        if (columns.value.length === 0 || columns.value.length !== detectedCols.length) {
          columns.value = detectedCols;
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch grid page:', error);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = () => {
  fetchPage();
};

const handlePageSizeChange = () => {
  currentPage.value = 1;
  fetchPage();
};

const formatValue = (val: any) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return val.toString();
    return val.toFixed(4); // MATLAB-like default precision
  }
  return String(val);
};

onMounted(() => {
  fetchPage();
});

watch(() => props.variableName, () => {
  currentPage.value = 1;
  fetchPage();
});
</script>

<style scoped>
.data-grid-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--jl-bg);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--jl-border);
}

.grid-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--jl-panel-bg-alt);
  border-bottom: 1px solid var(--jl-border);
}

.grid-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.grid-tag {
  font-size: 11px;
  background: var(--jl-accent-green);
  color: white;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 600;
}

.grid-dimensions {
  font-family: var(--jl-font-mono);
  font-size: 12px;
  color: var(--jl-text-secondary);
}

.grid-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.grid-wrapper {
  flex: 1;
  overflow: auto;
  position: relative;
}

.matlab-grid {
  border-collapse: collapse;
  width: 100%;
  font-family: var(--jl-font-mono);
  font-size: 12px;
  table-layout: fixed; /* Important for dense grids */
}

.matlab-grid th {
  background: var(--jl-panel-bg-alt);
  color: var(--jl-text-secondary);
  font-weight: normal;
  padding: 4px 8px;
  border: 1px solid var(--jl-border);
  text-align: left;
  position: sticky;
  top: 0;
  z-index: 10;
}

.matlab-grid td {
  padding: 2px 8px;
  border: 1px solid var(--jl-border);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 24px;
}

.index-col {
  width: 50px;
  background: var(--jl-panel-bg-alt) !important;
  color: var(--jl-text-muted);
  text-align: center !important;
  position: sticky;
  left: 0;
  z-index: 11;
}

.data-cell {
  background: var(--jl-bg);
}

.data-cell:hover {
  background: rgba(56, 152, 38, 0.05);
}

.cell-content {
  width: 100%;
}

/* MATLAB-specific colors for numbers vs strings if possible */
.matlab-grid tr:nth-child(even) .data-cell {
  background: var(--jl-panel-bg);
}
</style>
