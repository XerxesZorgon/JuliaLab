// Colored SVG icon markup for MATLAB-style ribbon icons.
// Each value is a full SVG string (28×28 viewBox) with explicit fill colors.
// Used via v-html inside RibbonBtn's #icon slot.

export const coloredIcons: Record<string, string> = {

  newFile: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="2" width="14" height="18" rx="1.5" fill="#ffffff" stroke="#b0b8c8" stroke-width="1"/>
    <path d="M15 2v5h4" fill="#dde3ed" stroke="#b0b8c8" stroke-width="1"/>
    <path d="M15 2l4 5" fill="none" stroke="#b0b8c8" stroke-width="1"/>
    <line x1="8" y1="11" x2="16" y2="11" stroke="#4a90d9" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="8" y1="14" x2="16" y2="14" stroke="#4a90d9" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="8" y1="17" x2="13" y2="17" stroke="#4a90d9" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="22" cy="22" r="5" fill="#389826"/>
    <line x1="22" y1="19" x2="22" y2="25" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <line x1="19" y1="22" x2="25" y2="22" stroke="white" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  open: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8a2 2 0 0 1 2-2h5l2 2.5h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" fill="#f5c842" stroke="#d4a800" stroke-width="1"/>
    <path d="M3 12h19l-2.5 8H5.5L3 12z" fill="#fad95c" stroke="#d4a800" stroke-width="0.8"/>
  </svg>`,

  save: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="22" height="22" rx="2" fill="#4a90d9" stroke="#2e70b8" stroke-width="1"/>
    <rect x="7" y="3" width="10" height="8" rx="1" fill="#7db8f0"/>
    <rect x="9" y="3" width="2" height="6" fill="#5aa0e0"/>
    <rect x="6" y="16" width="16" height="8" rx="1" fill="#2e70b8"/>
    <rect x="9" y="18" width="10" height="4" rx="0.5" fill="#7db8f0"/>
  </svg>`,

  section: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="24" height="6" rx="1" fill="#e8f0e8" stroke="#c0d0c0" stroke-width="0.8"/>
    <polygon points="6,5.5 10,7 6,8.5" fill="#389826"/>
    <line x1="12" y1="6" x2="22" y2="6" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="12" y1="8" x2="19" y2="8" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="2" y="12" width="24" height="6" rx="1" fill="#f5f5f5" stroke="#d8d8d8" stroke-width="0.8"/>
    <line x1="5" y1="14" x2="23" y2="14" stroke="#aaa" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="5" y1="16.5" x2="18" y2="16.5" stroke="#aaa" stroke-width="1.2" stroke-linecap="round"/>
    <rect x="2" y="20" width="24" height="6" rx="1" fill="#f5f5f5" stroke="#d8d8d8" stroke-width="0.8"/>
    <line x1="5" y1="22" x2="23" y2="22" stroke="#aaa" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="5" y1="24.5" x2="18" y2="24.5" stroke="#aaa" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`,

  run: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="11" fill="#389826" stroke="#2a7a1a" stroke-width="1"/>
    <polygon points="11,9 21,14 11,19" fill="white"/>
  </svg>`,

  format: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="4" y1="7" x2="24" y2="7" stroke="#4a90d9" stroke-width="2" stroke-linecap="round"/>
    <line x1="7" y1="12" x2="24" y2="12" stroke="#555" stroke-width="2" stroke-linecap="round"/>
    <line x1="7" y1="17" x2="20" y2="17" stroke="#555" stroke-width="2" stroke-linecap="round"/>
    <line x1="7" y1="22" x2="24" y2="22" stroke="#555" stroke-width="2" stroke-linecap="round"/>
    <path d="M4 10l2-3-2-3" fill="none" stroke="#389826" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  trash: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="8" width="18" height="16" rx="2" fill="#e8e8e8" stroke="#c0c0c0" stroke-width="1"/>
    <line x1="4" y1="8" x2="24" y2="8" stroke="#cb3c33" stroke-width="2" stroke-linecap="round"/>
    <path d="M11 5h6" stroke="#cb3c33" stroke-width="2" stroke-linecap="round"/>
    <line x1="10" y1="12" x2="10" y2="20" stroke="#cb3c33" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="14" y1="12" x2="14" y2="20" stroke="#cb3c33" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="18" y1="12" x2="18" y2="20" stroke="#cb3c33" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  workspace: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="10" height="10" rx="1.5" fill="#4a90d9" stroke="#2e70b8" stroke-width="1"/>
    <rect x="15" y="3" width="10" height="10" rx="1.5" fill="#9558b2" stroke="#7a3d96" stroke-width="1"/>
    <rect x="3" y="15" width="10" height="10" rx="1.5" fill="#389826" stroke="#2a7a1a" stroke-width="1"/>
    <rect x="15" y="15" width="10" height="10" rx="1.5" fill="#f5c842" stroke="#d4a800" stroke-width="1"/>
  </svg>`,

  pkg: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 3l11 6v10l-11 6L3 19V9z" fill="#5bb8d4" stroke="#3a9ab8" stroke-width="1"/>
    <path d="M14 3l11 6-11 6L3 9z" fill="#7dd0e8" stroke="#3a9ab8" stroke-width="1"/>
    <line x1="14" y1="15" x2="14" y2="25" stroke="#3a9ab8" stroke-width="1.2"/>
    <path d="M3 9l11 6" stroke="#3a9ab8" stroke-width="1"/>
    <path d="M25 9l-11 6" stroke="#3a9ab8" stroke-width="1"/>
  </svg>`,

  find: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="7" fill="#dde8f8" stroke="#4a90d9" stroke-width="2"/>
    <line x1="17" y1="17" x2="24" y2="24" stroke="#4a90d9" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="9" y1="12" x2="15" y2="12" stroke="#4a90d9" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="12" y1="9" x2="12" y2="15" stroke="#4a90d9" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  findFiles: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="12" height="16" rx="1.5" fill="#ffffff" stroke="#b0b8c8" stroke-width="1"/>
    <path d="M12 4v4h4" fill="#dde3ed" stroke="#b0b8c8" stroke-width="1"/>
    <circle cx="19" cy="20" r="5" fill="#dde8f8" stroke="#4a90d9" stroke-width="1.8"/>
    <line x1="23" y1="24" x2="26" y2="27" stroke="#4a90d9" stroke-width="2" stroke-linecap="round"/>
    <line x1="17" y1="20" x2="21" y2="20" stroke="#4a90d9" stroke-width="1.3" stroke-linecap="round"/>
    <line x1="19" y1="18" x2="19" y2="22" stroke="#4a90d9" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`,

  goToFile: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="3" width="14" height="18" rx="1.5" fill="#ffffff" stroke="#b0b8c8" stroke-width="1"/>
    <path d="M14 3v5h4" fill="#dde3ed" stroke="#b0b8c8" stroke-width="1"/>
    <polyline points="16,16 22,16 22,24 16,24" fill="none" stroke="#389826" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="19,13 23,16 19,19" fill="none" stroke="#389826" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  newDropdown: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="3" width="14" height="18" rx="1.5" fill="#ffffff" stroke="#b0b8c8" stroke-width="1"/>
    <path d="M14 3v5h4" fill="#dde3ed" stroke="#b0b8c8" stroke-width="1"/>
    <circle cx="22" cy="22" r="5" fill="#4a90d9"/>
    <polyline points="19,21 22,24 25,21" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  undo: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 10a9 9 0 1 1 0 8" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round"/>
    <polyline points="2,6 6,10 10,6" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  redo: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 10a9 9 0 1 0 0 8" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round"/>
    <polyline points="26,6 22,10 18,6" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  dyad: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8" width="8" height="8" rx="1" fill="#9558b2" stroke="#7a3d96" stroke-width="1"/>
    <rect x="17" y="8" width="8" height="8" rx="1" fill="#9558b2" stroke="#7a3d96" stroke-width="1"/>
    <line x1="7" y1="6" x2="7" y2="4" stroke="#9558b2" stroke-width="1.5"/>
    <line x1="21" y1="6" x2="21" y2="4" stroke="#9558b2" stroke-width="1.5"/>
    <line x1="7" y1="4" x2="21" y2="4" stroke="#9558b2" stroke-width="1.5"/>
    <line x1="7" y1="18" x2="7" y2="22" stroke="#9558b2" stroke-width="1.5"/>
    <line x1="21" y1="18" x2="21" y2="22" stroke="#9558b2" stroke-width="1.5"/>
    <line x1="7" y1="22" x2="21" y2="22" stroke="#9558b2" stroke-width="1.5"/>
  </svg>`,

  // ── Plot type icons ──────────────────────────────────────────────
  newFigure: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="22" height="18" rx="2" fill="#ffffff" stroke="#b0b8c8" stroke-width="1.2"/>
    <rect x="3" y="4" width="22" height="5" rx="2" fill="#4a90d9" stroke="#2e70b8" stroke-width="1.2"/>
    <circle cx="6" cy="6.5" r="1" fill="white"/>
    <circle cx="9" cy="6.5" r="1" fill="white"/>
    <circle cx="12" cy="6.5" r="1" fill="white"/>
    <polyline points="7,20 10,15 13,17 17,11 21,14" fill="none" stroke="#389826" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  linePlot: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="4" y1="24" x2="4" y2="4" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="4" y1="24" x2="24" y2="24" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
    <polyline points="5,20 9,14 13,16 17,9 23,12" fill="none" stroke="#4a90d9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="5,22 9,18 13,20 17,15 23,17" fill="none" stroke="#cb3c33" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  scatterPlot: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="4" y1="24" x2="4" y2="4" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="4" y1="24" x2="24" y2="24" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="8" cy="20" r="2" fill="#4a90d9"/>
    <circle cx="11" cy="15" r="2" fill="#4a90d9"/>
    <circle cx="14" cy="17" r="2" fill="#cb3c33"/>
    <circle cx="17" cy="10" r="2" fill="#4a90d9"/>
    <circle cx="20" cy="13" r="2" fill="#cb3c33"/>
    <circle cx="22" cy="8" r="2" fill="#389826"/>
  </svg>`,

  barPlot: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="4" y1="24" x2="4" y2="4" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="4" y1="24" x2="24" y2="24" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="6" y="14" width="4" height="10" fill="#4a90d9" rx="0.5"/>
    <rect x="12" y="9" width="4" height="15" fill="#cb3c33" rx="0.5"/>
    <rect x="18" y="17" width="4" height="7" fill="#389826" rx="0.5"/>
  </svg>`,

  heatmapPlot: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="20" height="20" rx="1" fill="#f5f5f5" stroke="#ccc" stroke-width="1"/>
    <rect x="4" y="4" width="5" height="5" fill="#fef0d9"/>
    <rect x="9" y="4" width="5" height="5" fill="#fdcc8a"/>
    <rect x="14" y="4" width="5" height="5" fill="#fc8d59"/>
    <rect x="19" y="4" width="5" height="5" fill="#e34a33"/>
    <rect x="4" y="9" width="5" height="5" fill="#fdcc8a"/>
    <rect x="9" y="9" width="5" height="5" fill="#fc8d59"/>
    <rect x="14" y="9" width="5" height="5" fill="#e34a33"/>
    <rect x="19" y="9" width="5" height="5" fill="#b30000"/>
    <rect x="4" y="14" width="5" height="5" fill="#ffffcc"/>
    <rect x="9" y="14" width="5" height="5" fill="#a1dab4"/>
    <rect x="14" y="14" width="5" height="5" fill="#41b6c4"/>
    <rect x="19" y="14" width="5" height="5" fill="#2c7fb8"/>
    <rect x="4" y="19" width="5" height="5" fill="#a1dab4"/>
    <rect x="9" y="19" width="5" height="5" fill="#41b6c4"/>
    <rect x="14" y="19" width="5" height="5" fill="#2c7fb8"/>
    <rect x="19" y="19" width="5" height="5" fill="#253494"/>
  </svg>`,

  surfacePlot: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 20 L14 24 L24 20 L24 10 L14 6 L4 10 Z" fill="#dde8f8" stroke="#4a90d9" stroke-width="1"/>
    <path d="M4 20 L14 24 L24 20" fill="none" stroke="#4a90d9" stroke-width="1"/>
    <path d="M14 24 L14 6" fill="none" stroke="#4a90d9" stroke-width="1" stroke-dasharray="2,2"/>
    <path d="M4 15 Q9 11 14 13 Q19 15 24 11" fill="none" stroke="#cb3c33" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M4 18 Q9 14 14 16 Q19 18 24 14" fill="none" stroke="#389826" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  contourPlot: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="20" height="20" rx="1" fill="#f8f8f8" stroke="#ccc" stroke-width="1"/>
    <ellipse cx="14" cy="14" rx="9" ry="7" fill="none" stroke="#4a90d9" stroke-width="1.5"/>
    <ellipse cx="14" cy="14" rx="6" ry="4.5" fill="none" stroke="#41b6c4" stroke-width="1.5"/>
    <ellipse cx="14" cy="14" rx="3" ry="2.5" fill="none" stroke="#cb3c33" stroke-width="1.5"/>
    <circle cx="14" cy="14" r="1.2" fill="#cb3c33"/>
  </svg>`,

  // ── View/zoom icons ──────────────────────────────────────────────
  zoomIn: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="7" fill="#dde8f8" stroke="#4a90d9" stroke-width="2"/>
    <line x1="17" y1="17" x2="24" y2="24" stroke="#4a90d9" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="9" y1="12" x2="15" y2="12" stroke="#4a90d9" stroke-width="2" stroke-linecap="round"/>
    <line x1="12" y1="9" x2="12" y2="15" stroke="#4a90d9" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  zoomOut: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="7" fill="#dde8f8" stroke="#4a90d9" stroke-width="2"/>
    <line x1="17" y1="17" x2="24" y2="24" stroke="#4a90d9" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="9" y1="12" x2="15" y2="12" stroke="#4a90d9" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  pan: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 4v4M14 20v4M4 14h4M20 14h4" stroke="#555" stroke-width="2" stroke-linecap="round"/>
    <path d="M7 7l2.5 2.5M18.5 18.5L21 21M7 21l2.5-2.5M18.5 9.5L21 7" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="14" cy="14" r="4" fill="#4a90d9" opacity="0.3" stroke="#4a90d9" stroke-width="1.5"/>
  </svg>`,

  addLabel: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="7" width="16" height="14" rx="1.5" fill="#ffffff" stroke="#b0b8c8" stroke-width="1"/>
    <line x1="6" y1="12" x2="16" y2="12" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="6" y1="15" x2="13" y2="15" stroke="#555" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="22" cy="22" r="5" fill="#389826"/>
    <line x1="22" y1="19" x2="22" y2="25" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <line x1="19" y1="22" x2="25" y2="22" stroke="white" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  style: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="13" r="8" fill="#f0f0f0" stroke="#ccc" stroke-width="1"/>
    <circle cx="10" cy="10" r="2.5" fill="#4a90d9"/>
    <circle cx="18" cy="10" r="2.5" fill="#cb3c33"/>
    <circle cx="10" cy="17" r="2.5" fill="#389826"/>
    <circle cx="18" cy="17" r="2.5" fill="#f5c842"/>
    <rect x="10" y="22" width="8" height="3" rx="1" fill="#9558b2"/>
  </svg>`,

  exportImg: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5" width="18" height="15" rx="1.5" fill="#ffffff" stroke="#b0b8c8" stroke-width="1"/>
    <circle cx="8" cy="10" r="2" fill="#f5c842" stroke="#d4a800" stroke-width="0.8"/>
    <path d="M3 16l5-5 4 4 3-3 6 5" fill="#dde8f8" stroke="#4a90d9" stroke-width="1"/>
    <line x1="18" y1="18" x2="18" y2="26" stroke="#389826" stroke-width="2" stroke-linecap="round"/>
    <polyline points="14,23 18,27 22,23" fill="none" stroke="#389826" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  copyCode: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="5" width="14" height="17" rx="1.5" fill="#ffffff" stroke="#b0b8c8" stroke-width="1"/>
    <rect x="5" y="8" width="14" height="17" rx="1.5" fill="#e8f0e8" stroke="#9ab89a" stroke-width="1"/>
    <line x1="8" y1="13" x2="16" y2="13" stroke="#389826" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="8" y1="16" x2="14" y2="16" stroke="#389826" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="8" y1="19" x2="16" y2="19" stroke="#389826" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  // ── View tab icons ───────────────────────────────────────────────
  fileBrowser: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8a2 2 0 0 1 2-2h4l2 2.5h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" fill="#f5c842" stroke="#d4a800" stroke-width="1"/>
    <line x1="8" y1="15" x2="20" y2="15" stroke="#d4a800" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="8" y1="18" x2="16" y2="18" stroke="#d4a800" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`,

  commandWindow: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="22" height="20" rx="2" fill="#1e1e1e" stroke="#555" stroke-width="1"/>
    <polyline points="6,11 10,14 6,17" fill="none" stroke="#389826" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="12" y1="17" x2="20" y2="17" stroke="#389826" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,

  lightTheme: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="5" fill="#f5c842" stroke="#d4a800" stroke-width="1.5"/>
    <line x1="14" y1="4" x2="14" y2="7" stroke="#f5c842" stroke-width="2" stroke-linecap="round"/>
    <line x1="14" y1="21" x2="14" y2="24" stroke="#f5c842" stroke-width="2" stroke-linecap="round"/>
    <line x1="4" y1="14" x2="7" y2="14" stroke="#f5c842" stroke-width="2" stroke-linecap="round"/>
    <line x1="21" y1="14" x2="24" y2="14" stroke="#f5c842" stroke-width="2" stroke-linecap="round"/>
    <line x1="7" y1="7" x2="9" y2="9" stroke="#f5c842" stroke-width="2" stroke-linecap="round"/>
    <line x1="19" y1="19" x2="21" y2="21" stroke="#f5c842" stroke-width="2" stroke-linecap="round"/>
    <line x1="21" y1="7" x2="19" y2="9" stroke="#f5c842" stroke-width="2" stroke-linecap="round"/>
    <line x1="9" y1="19" x2="7" y2="21" stroke="#f5c842" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  darkTheme: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 5a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 2a7 7 0 0 1 0 14V7z" fill="#555" stroke="#333" stroke-width="0.5"/>
    <path d="M14 7v14a7 7 0 0 1 0-14z" fill="#9558b2"/>
  </svg>`,

  hideRibbon: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="22" height="7" rx="1" fill="#e0e0e0" stroke="#bbb" stroke-width="1"/>
    <rect x="3" y="13" width="22" height="11" rx="1" fill="#f5f5f5" stroke="#ddd" stroke-width="1"/>
    <polyline points="9,7.5 14,5 19,7.5" fill="none" stroke="#4a90d9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  pinRibbon: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="22" height="7" rx="1" fill="#4a90d9" stroke="#2e70b8" stroke-width="1"/>
    <rect x="3" y="13" width="22" height="11" rx="1" fill="#f5f5f5" stroke="#ddd" stroke-width="1"/>
    <line x1="14" y1="6" x2="14" y2="12" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <line x1="11" y1="8.5" x2="17" y2="8.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  cheatSheet: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="2" width="15" height="20" rx="1.5" fill="#ffffff" stroke="#b0b8c8" stroke-width="1"/>
    <path d="M15 2v5h4" fill="#dde3ed" stroke="#b0b8c8" stroke-width="1"/>
    <path d="M15 2l4 5" fill="none" stroke="#b0b8c8" stroke-width="1"/>
    <line x1="7" y1="11" x2="14" y2="11" stroke="#888" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="7" y1="14" x2="14" y2="14" stroke="#888" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="7" y1="17" x2="11" y2="17" stroke="#888" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="21" cy="21" r="6" fill="#4a90d9"/>
    <path d="M19.5 19.2c0-0.8 0.7-1.5 1.5-1.5s1.5 0.7 1.5 1.5c0 0.6-0.4 1.1-0.9 1.3L21 21v0.8" stroke="white" stroke-width="1.4" stroke-linecap="round" fill="none"/>
    <circle cx="21" cy="23.5" r="0.7" fill="white"/>
  </svg>`,

  saveAs: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" fill="#4a90d9" stroke="#2e70b8" stroke-width="1"/>
    <rect x="7" y="3" width="8" height="7" rx="1" fill="#7db8f0"/>
    <rect x="9" y="3" width="2" height="5" fill="#5aa0e0"/>
    <rect x="6" y="13" width="12" height="7" rx="1" fill="#2e70b8"/>
    <rect x="9" y="15" width="6" height="3" rx="0.5" fill="#7db8f0"/>
    <path d="M18 18l6 6" stroke="#389826" stroke-width="2" stroke-linecap="round"/>
    <polyline points="20,24 24,24 24,20" fill="none" stroke="#389826" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  print: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="7" y="3" width="14" height="8" rx="1" fill="#ffffff" stroke="#b0b8c8" stroke-width="1"/>
    <rect x="4" y="10" width="20" height="11" rx="2" fill="#e0e0e0" stroke="#aaa" stroke-width="1"/>
    <rect x="7" y="17" width="14" height="8" rx="1" fill="#ffffff" stroke="#b0b8c8" stroke-width="1"/>
    <circle cx="20" cy="15" r="1.5" fill="#389826"/>
    <line x1="9" y1="20" x2="19" y2="20" stroke="#ccc" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="9" y1="22" x2="15" y2="22" stroke="#ccc" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`,

  copyFigure: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="6" width="14" height="16" rx="1.5" fill="#ffffff" stroke="#b0b8c8" stroke-width="1"/>
    <rect x="9" y="6" width="14" height="4" rx="1.5" fill="#4a90d9" stroke="#2e70b8" stroke-width="1"/>
    <rect x="5" y="10" width="14" height="16" rx="1.5" fill="#f0f4ff" stroke="#4a90d9" stroke-width="1"/>
    <rect x="5" y="10" width="14" height="4" rx="1.5" fill="#4a90d9" stroke="#2e70b8" stroke-width="1"/>
    <polyline points="8,19 11,16 14,18 17,14" fill="none" stroke="#389826" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  showCode: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="9,8 4,14 9,20" fill="none" stroke="#4a90d9" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="19,8 24,14 19,20" fill="none" stroke="#4a90d9" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="16" y1="6" x2="12" y2="22" stroke="#389826" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  figTitle: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="6" y1="8" x2="22" y2="8" stroke="#333" stroke-width="3" stroke-linecap="round"/>
    <line x1="14" y1="8" x2="14" y2="20" stroke="#333" stroke-width="3" stroke-linecap="round"/>
    <line x1="4" y1="24" x2="24" y2="24" stroke="#4a90d9" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  figSubtitle: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="8" y1="10" x2="20" y2="10" stroke="#555" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="14" y1="10" x2="14" y2="19" stroke="#555" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="4" y1="24" x2="24" y2="24" stroke="#aaa" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="3,2"/>
  </svg>`,

  xLabel: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="4" y1="22" x2="4" y2="6" stroke="#888" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="4" y1="22" x2="24" y2="22" stroke="#888" stroke-width="1.5" stroke-linecap="round"/>
    <polyline points="6,18 10,12 14,15 18,9 22,12" fill="none" stroke="#555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="9" y1="26" x2="15" y2="26" stroke="#4a90d9" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="9" y1="24" x2="15" y2="28" stroke="#4a90d9" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="15" y1="24" x2="9" y2="28" stroke="#4a90d9" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  yLabel: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="6" y1="22" x2="6" y2="6" stroke="#888" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="6" y1="22" x2="24" y2="22" stroke="#888" stroke-width="1.5" stroke-linecap="round"/>
    <polyline points="8,18 12,12 16,15 20,9 23,12" fill="none" stroke="#555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="2" y1="11" x2="5" y2="16" stroke="#4a90d9" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="5" y1="16" x2="2" y2="21" stroke="#4a90d9" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="8" y1="11" x2="5" y2="16" stroke="#4a90d9" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  legend: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="20" height="16" rx="1.5" fill="#ffffff" stroke="#b0b8c8" stroke-width="1"/>
    <line x1="7" y1="11" x2="12" y2="11" stroke="#4a90d9" stroke-width="2" stroke-linecap="round"/>
    <line x1="7" y1="16" x2="12" y2="16" stroke="#cb3c33" stroke-width="2" stroke-linecap="round"/>
    <line x1="14" y1="11" x2="22" y2="11" stroke="#888" stroke-width="1.2" stroke-linecap="round"/>
    <line x1="14" y1="16" x2="22" y2="16" stroke="#888" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`,

  colorbar: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="cbg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b30000"/>
      <stop offset="50%" stop-color="#fc8d59"/>
      <stop offset="100%" stop-color="#253494"/>
    </linearGradient></defs>
    <rect x="11" y="4" width="6" height="20" rx="1" fill="url(#cbg)" stroke="#aaa" stroke-width="0.8"/>
    <line x1="17" y1="6" x2="20" y2="6" stroke="#555" stroke-width="1" stroke-linecap="round"/>
    <line x1="17" y1="14" x2="20" y2="14" stroke="#555" stroke-width="1" stroke-linecap="round"/>
    <line x1="17" y1="22" x2="20" y2="22" stroke="#555" stroke-width="1" stroke-linecap="round"/>
  </svg>`,

  gridIcon: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="20" height="20" rx="1" fill="#f8f8f8" stroke="#ccc" stroke-width="1"/>
    <line x1="4" y1="11" x2="24" y2="11" stroke="#4a90d9" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="4" y1="17" x2="24" y2="17" stroke="#4a90d9" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="11" y1="4" x2="11" y2="24" stroke="#4a90d9" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="17" y1="4" x2="17" y2="24" stroke="#4a90d9" stroke-width="1" stroke-dasharray="2,2"/>
    <polyline points="6,20 10,14 14,16 18,10 22,13" fill="none" stroke="#555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  xGrid: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="20" height="20" rx="1" fill="#f8f8f8" stroke="#ccc" stroke-width="1"/>
    <line x1="11" y1="4" x2="11" y2="24" stroke="#4a90d9" stroke-width="1.5" stroke-dasharray="2,2"/>
    <line x1="17" y1="4" x2="17" y2="24" stroke="#4a90d9" stroke-width="1.5" stroke-dasharray="2,2"/>
    <polyline points="6,20 10,14 14,16 18,10 22,13" fill="none" stroke="#555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  yGrid: `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="20" height="20" rx="1" fill="#f8f8f8" stroke="#ccc" stroke-width="1"/>
    <line x1="4" y1="11" x2="24" y2="11" stroke="#4a90d9" stroke-width="1.5" stroke-dasharray="2,2"/>
    <line x1="4" y1="17" x2="24" y2="17" stroke="#4a90d9" stroke-width="1.5" stroke-dasharray="2,2"/>
    <polyline points="6,20 10,14 14,16 18,10 22,13" fill="none" stroke="#555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};
