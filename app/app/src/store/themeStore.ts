import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type ThemeMode = 'light' | 'dark';

export const useThemeStore = defineStore('theme', () => {
  // Default to light theme (MATLAB-style)
  const currentTheme = ref<ThemeMode>('light');

  // Apply theme to document root
  const applyTheme = (theme: ThemeMode) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  };

  // Set theme
  const setTheme = (theme: ThemeMode) => {
    currentTheme.value = theme;
    applyTheme(theme);
    // Persist to localStorage
    localStorage.setItem('julialab-theme', theme);
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    setTheme(currentTheme.value === 'light' ? 'dark' : 'light');
  };

  // Initialize theme — always start in light mode; dark is session-only
  const initTheme = () => {
    localStorage.removeItem('julialab-theme');
    setTheme('light');
  };

  // Watch for theme changes
  watch(currentTheme, (newTheme) => {
    applyTheme(newTheme);
  });

  return {
    currentTheme,
    setTheme,
    toggleTheme,
    initTheme,
  };
});
