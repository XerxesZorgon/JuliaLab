import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface ActiveAppInfo {
  id: string;
  name: string;
  icon: string;
}

export const useAppsStore = defineStore('apps', () => {
  // Which app is currently open in the gallery (null = gallery home)
  const activeApp = ref<ActiveAppInfo | null>(null);

  // Per-app action buses — components emit here, toolbar buttons listen
  // Using a simple event emitter pattern via callbacks
  const _listeners = new Map<string, Set<() => void>>();

  function setActiveApp(app: ActiveAppInfo | null) {
    activeApp.value = app;
  }

  /** Register a callback for a named action (e.g. 'curve-fitting:export') */
  function onAction(action: string, cb: () => void) {
    if (!_listeners.has(action)) _listeners.set(action, new Set());
    _listeners.get(action)!.add(cb);
    // Return cleanup function
    return () => _listeners.get(action)?.delete(cb);
  }

  /** Fire a named action from the ribbon toolbar button */
  function fireAction(action: string) {
    _listeners.get(action)?.forEach(cb => cb());
  }

  return { activeApp, setActiveApp, onAction, fireAction };
});