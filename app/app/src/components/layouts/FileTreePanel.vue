<template>
  <LeftPanelAccordion
    @open-file="handleOpenFile"
    @open-package-settings="handleOpenPackageSettings"
    @project-root-changed="handleProjectRootChanged"
  />
</template>

<script setup lang="ts">
import { inject } from 'vue'
import LeftPanelAccordion from './LeftPanelAccordion.vue'

const handleOpenFile = inject<(filePath: string) => void>('handleOpenFile', () => {})
const handleOpenPackageSettings = inject<(projectPath: string) => void>('handleOpenPackageSettings', () => {})
const handleProjectRootChanged = inject<(newRoot: string) => Promise<void>>('handleProjectRootChanged', async () => {})
</script>
