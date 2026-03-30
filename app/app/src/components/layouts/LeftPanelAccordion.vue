<template>
  <div style="height: 100%; display: flex; flex-direction: column; background-color: var(--jl-files-panel-bg)">
    <div style="flex-grow: 1; overflow: auto; display: flex; flex-direction: column">
      <n-collapse
        v-model:expanded-names="expandedNames"
        :default-expanded-names="defaultExpandedNames"
        style="flex-grow: 1; display: flex; flex-direction: column"
      >
        <!-- File Explorer Section (always visible) -->
        <n-collapse-item name="explorer" title="Explorer">
          <template #header>
            <div class="accordion-header">
              <n-icon><FolderOutline /></n-icon>
              <span class="header-text">Explorer</span>
            </div>
          </template>
          <div
            style="
              flex-grow: 1;
              display: flex;
              flex-direction: column;
              min-height: 0;
              height: 100%;
              overflow: hidden;
            "
          >
            <FileExplorer
              @open-file="handleOpenFile"
              @open-package-settings="handleOpenPackageSettings"
              @project-root-changed="handleProjectRootChanged"
            />
          </div>
        </n-collapse-item>


      </n-collapse>
    </div>

    <!-- Environment Info - Always visible at bottom -->
    <div style="flex-shrink: 0; border-top: 1px solid var(--jl-border)">
      <EnvironmentInfo />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { NCollapse, NCollapseItem, NIcon } from 'naive-ui';
import { FolderOutline } from '@vicons/ionicons5';
import { FileExplorer } from '../FileExplorer';
import EnvironmentInfo from '../shared/EnvironmentInfo.vue';
import { useAppStore } from '../../store/appStore';

const expandedNames = ref(['explorer']); // Start with only explorer expanded

// Computed property for default expanded names
const defaultExpandedNames = computed(() => {
  return ['explorer']; // Only explorer expanded by default
});

const appStore = useAppStore();

// Plot listening is now initialized globally in the plot store

// Event handlers for FileExplorer
const emit = defineEmits(['open-file', 'open-package-settings', 'project-root-changed']);

const handleOpenFile = (filePath) => {
  emit('open-file', filePath);
};

const handleOpenPackageSettings = (projectPath) => {
  emit('open-package-settings', projectPath);
};

const handleProjectRootChanged = (newRoot) => {
  emit('project-root-changed', newRoot);
};

onMounted(async () => {
  // Component mounted
});
</script>

<style scoped>
:deep(.n-collapse-item__header) {
  background-color: var(--jl-panel-bg-alt) !important;
  border-bottom: 1px solid var(--jl-border) !important;
  margin: 0 !important;
  padding: 0 12px !important;
}

:deep(.n-collapse-item__header:hover) {
  background-color: var(--jl-border-light) !important;
}

:deep(.n-collapse-item__content) {
  background-color: var(--jl-files-panel-bg) !important;
  padding: 0 !important;
}

:deep(.n-collapse-item__content-box) {
  padding: 0 !important;
}

/* Only expanded items should have flex-grow on content */
:deep(.n-collapse-item--expanded .n-collapse-item__content) {
  flex-grow: 1 !important;
  display: flex !important;
  flex-direction: column !important;
}

:deep(.n-collapse-item--expanded .n-collapse-item__content-box) {
  flex-grow: 1 !important;
  display: flex !important;
  flex-direction: column !important;
}

/* Make the explorer section take up maximum available space */
:deep(.n-collapse-item[name='explorer'].n-collapse-item--expanded) {
  flex-grow: 1 !important;
  min-height: 0 !important;
}

/* Ensure the explorer takes all available space when expanded */
:deep(
  .n-collapse-item[name='explorer'].n-collapse-item--expanded .n-collapse-item__content-wrapper
) {
  flex-grow: 1 !important;
  min-height: 0 !important;
}

:deep(.n-collapse) {
  background-color: var(--jl-files-panel-bg) !important;
  border: none !important;
  gap: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
  min-height: 0 !important;
}

/* Remove any spacing between collapse items */
:deep(.n-collapse-item) {
  margin: 0 !important;
  border: none !important;
  display: flex !important;
  flex-direction: column !important;
}

/* Expanded collapse items should fill available space */
:deep(.n-collapse-item--expanded) {
  flex-grow: 1 !important;
  min-height: 0 !important;
}

/* Ensure proper flex distribution */
:deep(.n-collapse-item) {
  display: flex !important;
  flex-direction: column !important;
}

/* Collapsed collapse items should take minimal space but still be interactive */
:deep(.n-collapse-item:not(.n-collapse-item--expanded)) {
  flex-shrink: 0 !important;
  flex-grow: 0 !important;
  min-height: 32px !important; /* Ensure header is still clickable */
}

:deep(.n-collapse-item + .n-collapse-item) {
  margin-top: 0 !important;
  border-top: none !important;
}

/* Accordion header styling */
.accordion-header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px; /* Ensure consistent height */
  width: 100%;
}

.header-icon {
  color: var(--jl-text-secondary) !important;
  font-size: 14px;
  flex-shrink: 0;
}

.header-text {
  color: var(--jl-text-secondary);
  font-size: 12px;
  font-weight: 500;
  flex: 1;
}

.header-badge {
  flex-shrink: 0;
}

.header-button {
  margin-left: auto;
  flex-shrink: 0;
}

/* Ensure all collapse item headers have the same height */
:deep(.n-collapse-item__header) {
  min-height: 32px !important;
  height: 32px !important;
  padding: 0 12px !important;
}

/* Ensure collapsed content takes no space */
:deep(.n-collapse-item__content-wrapper) {
  margin: 0 !important;
  padding: 0 !important;
}

/* Only expanded items should have flex properties on content wrapper */
:deep(.n-collapse-item--expanded .n-collapse-item__content-wrapper) {
  flex-grow: 1 !important;
  display: flex !important;
  flex-direction: column !important;
}

/* Explorer content wrapper should take maximum space */
:deep(
  .n-collapse-item[name='explorer'].n-collapse-item--expanded .n-collapse-item__content-wrapper
) {
  flex-grow: 1 !important;
  min-height: 0 !important;
}

/* Explorer content wrapper should take minimal space when collapsed */
:deep(
  .n-collapse-item[name='explorer']:not(.n-collapse-item--expanded)
    .n-collapse-item__content-wrapper
) {
  height: 0 !important;
  overflow: hidden !important;
}

:deep(.n-collapse-item__content) {
  margin: 0 !important;
  padding: 0 !important;
  flex-grow: 1 !important;
  display: flex !important;
  flex-direction: column !important;
}

:deep(.n-collapse-item__header-content) {
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
}

/* Ensure FileExplorer takes up all available space */
:deep(.n-collapse-item[name='explorer'] .n-collapse-item__content > div) {
  height: 100% !important;
  flex-grow: 1 !important;
  min-height: 0 !important;
  overflow: hidden !important;
}

/* Ensure FileExplorer component itself takes full height */
:deep(.n-collapse-item[name='explorer'] .n-collapse-item__content > div > *) {
  height: 100% !important;
  flex-grow: 1 !important;
  min-height: 0 !important;
}
</style>
