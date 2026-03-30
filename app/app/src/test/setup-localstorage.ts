/**
 * Pre-setup: polyfill localStorage and sessionStorage for happy-dom.
 *
 * This file has NO imports so its top-level code runs immediately —
 * before setup.ts imports pinia, which would otherwise trigger
 * @vue/devtools-kit to call localStorage.getItem() and crash.
 */

function makeStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    get length() { return Object.keys(store).length; },
    key: (n: number) => Object.keys(store)[n] ?? null,
  };
}

Object.defineProperty(globalThis, 'localStorage', {
  value: makeStorage(),
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: makeStorage(),
  writable: true,
  configurable: true,
});
