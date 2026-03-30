<template>
  <n-modal
    v-model:show="show"
    title="Manage Layouts"
    preset="card"
    style="width: 560px; max-height: 80vh; overflow-y: auto;"
    :mask-closable="true"
  >
    <!-- Save current layout -->
    <div class="lm-section">
      <div class="lm-section-title">Save Current Layout</div>
      <n-input-group>
        <n-input
          v-model:value="newName"
          placeholder="Layout name…"
          size="small"
          @keydown.enter="handleSave"
        />
        <n-button
          type="primary"
          size="small"
          :disabled="!newName.trim()"
          @click="handleSave"
        >
          Save
        </n-button>
      </n-input-group>
    </div>

    <n-divider style="margin: 12px 0" />

    <!-- User-saved layouts -->
    <div class="lm-section">
      <div class="lm-section-title">Saved Layouts</div>
      <div v-if="layoutStore.userLayouts.length === 0" class="lm-empty">
        No custom layouts yet. Resize panels and click Save to create one.
      </div>
      <n-list v-else bordered size="small">
        <n-list-item v-for="layout in layoutStore.userLayouts" :key="layout.id">
          <div class="lm-item-body">
            <n-input
              v-if="editingId === layout.id"
              v-model:value="editingName"
              size="tiny"
              style="width: 180px"
              @keydown.enter="finishRename(layout.id)"
              @keydown.escape="cancelRename"
              @blur="finishRename(layout.id)"
            />
            <template v-else>
              <span class="lm-item-name">{{ layout.name }}</span>
              <span class="lm-item-meta">{{ formatDate(layout.createdAt) }}</span>
            </template>
          </div>
          <template #suffix>
            <n-space size="small">
              <n-button size="tiny" @click="layoutStore.applyLayout(layout)">Apply</n-button>
              <n-button size="tiny" @click="startRename(layout)">Rename</n-button>
              <n-button size="tiny" type="error" @click="layoutStore.deleteLayout(layout.id)">Delete</n-button>
            </n-space>
          </template>
        </n-list-item>
      </n-list>
    </div>

    <n-divider style="margin: 12px 0" />

    <!-- Built-in presets (apply-only) -->
    <div class="lm-section">
      <div class="lm-section-title">Built-in Presets</div>
      <n-list bordered size="small">
        <n-list-item v-for="preset in BUILTIN_LAYOUTS" :key="preset.id">
          <span class="lm-item-name">{{ preset.name }}</span>
          <span class="lm-item-sep"> — </span>
          <span class="lm-item-meta lm-preset-desc">{{ describeLayout(preset) }}</span>
          <template #suffix>
            <n-button size="tiny" @click="layoutStore.applyLayout(preset)">Apply</n-button>
          </template>
        </n-list-item>
      </n-list>
    </div>

    <template #footer>
      <div style="display: flex; justify-content: flex-end;">
        <n-button @click="show = false">Close</n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  NModal, NInput, NInputGroup, NButton, NList, NListItem,
  NSpace, NDivider,
} from 'naive-ui';
import { useLayoutStore, BUILTIN_LAYOUTS, type SavedLayout } from '../../store/layoutStore';

const show = defineModel<boolean>('show', { default: false });
const layoutStore = useLayoutStore();

const newName = ref('');
const editingId = ref<string | null>(null);
const editingName = ref('');

function handleSave() {
  if (!newName.value.trim()) return;
  layoutStore.saveCurrentLayout(newName.value);
  newName.value = '';
}

function startRename(layout: SavedLayout) {
  editingId.value = layout.id;
  editingName.value = layout.name;
}

function finishRename(id: string) {
  if (editingName.value.trim()) {
    layoutStore.updateLayoutName(id, editingName.value);
  }
  editingId.value = null;
}

function cancelRename() {
  editingId.value = null;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function describeLayout(layout: SavedLayout): string {
  const parts: string[] = [];
  if (!layout.visibility.files) parts.push('no file browser');
  if (!layout.visibility.terminal) parts.push('no terminal');
  if (!layout.visibility.workspace) parts.push('no workspace panel');
  if (layout.visibility.ai) parts.push('+ AI sidebar');
  return parts.length ? parts.join(' · ') : 'standard 4-panel layout';
}
</script>

<style scoped>
.lm-section {
  margin-bottom: 4px;
}

.lm-section-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--jl-text-secondary);
  margin-bottom: 6px;
  font-family: var(--jl-font-ui);
}

.lm-empty {
  font-size: 12px;
  color: var(--jl-text-secondary);
  padding: 8px 0;
  font-style: italic;
}

.lm-item-body {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.lm-item-name {
  font-family: var(--jl-font-ui);
  font-size: 13px;
  color: var(--jl-text-primary);
}

.lm-item-sep {
  font-size: 11px;
  color: var(--jl-text-secondary);
}

.lm-item-meta {
  font-size: 11px;
  color: var(--jl-text-secondary);
}

.lm-preset-desc {
  font-style: italic;
}
</style>
