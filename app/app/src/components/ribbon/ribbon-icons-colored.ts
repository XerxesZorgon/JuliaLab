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
};
