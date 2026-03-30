<template>
  <button class="ribbon-btn" :title="label" @click="$emit('click')">
    <span class="ribbon-btn-icon">
      <component :is="resolvedIcon" :size="22" />
    </span>
    <span class="ribbon-btn-label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  FilePlus, ZoomIn, ZoomOut, RefreshCw, Move, MousePointer,
  BarChart2, Tag, AlignLeft, AlignRight, Palette, Download,
  Copy, Settings, TrendingUp, Circle, Grid, Layers,
  List, Image, Link, Table, Minus, BookOpen,
  CheckSquare, ChevronDown, Square, PlayCircle,
  FolderOpen, Package
} from 'lucide-vue-next'

const iconMap: Record<string, object> = {
  'new-figure':  FilePlus,
  'zoom-in':     ZoomIn,
  'zoom-out':    ZoomOut,
  'reset-view':  RefreshCw,
  'pan':         Move,
  'cursor':      MousePointer,
  'select':      MousePointer,
  'legend':      List,
  'title':       Tag,
  'xlabel':      AlignLeft,
  'ylabel':      AlignRight,
  'colorbar':    Palette,
  'save-png':    Download,
  'save-svg':    Download,
  'save-pdf':    Download,
  'copy':        Copy,
  'fig-props':   Settings,
  'line':        TrendingUp,
  'scatter':     Circle,
  'bar':         BarChart2,
  'histogram':   BarChart2,
  'heatmap':     Grid,
  'surface':     Layers,
  'contour':     Grid,
  'app-gallery': Grid,
  'design-app':  Square,
  'open-app':    FolderOpen,
  'package-app': Package,
  'code-cell':   PlayCircle,
  'text-cell':   BookOpen,
  'slider':      Minus,
  'checkbox':    CheckSquare,
  'dropdown':    ChevronDown,
  'button':      Square,
  'equation':    Tag,
  'image':       Image,
  'hyperlink':   Link,
  'table':       Table,
  'section':     Minus,
  'toc':         List,
}

const props = defineProps<{
  icon: string
  label: string
}>()

defineEmits<{ click: [] }>()

const resolvedIcon = computed(() => iconMap[props.icon] ?? Square)
</script>

<style scoped>
.ribbon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background: none;
  border: 1px solid transparent;
  border-radius: 3px;
  padding: 3px 5px;
  cursor: pointer;
  min-width: 44px;
  gap: 2px;
  color: var(--jl-text-secondary, #505050);
  transition: background 0.1s, border-color 0.1s;
}
.ribbon-btn:hover {
  background: var(--jl-panel-bg-alt, rgba(0, 0, 0, 0.07));
  border-color: var(--jl-border, #ccc);
}
.ribbon-btn:active {
  background: rgba(0, 0, 0, 0.13);
}
.ribbon-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
.ribbon-btn-label {
  font-size: 10px;
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
  font-family: var(--jl-font-ui);
}
</style>
