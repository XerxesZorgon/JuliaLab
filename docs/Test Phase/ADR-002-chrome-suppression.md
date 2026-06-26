# ADR-002: VSCodium Title Bar and Menu Bar Suppression
**Date:** 2026-06-22
**Status:** Accepted

## Context

VSCodium renders its own title bar and menu bar by default. If these are
visible alongside the custom Electron ribbon, the double-header problem
defeats the purpose of Option C. They must be suppressed completely.

## Decision

Suppress VSCodium's native chrome via a combination of:
1. `--title-bar-style=hidden` CLI flag passed to the VSCodium process
2. User settings JSON (`"window.titleBarStyle": "custom"` or `"native": false`)
   written to VSCodium's portable data directory before launch
3. `--disable-extensions` flag during PoC (eliminates extension-contributed
   UI that might restore chrome)

## Rationale

- CLI flags and user settings are documented VSCodium/VS Code behaviour;
  no internal patching required
- `window.titleBarStyle: "custom"` is the same mechanism VS Code uses on
  macOS/Linux for its own compact mode; it is stable across versions
- Writing settings to a portable data dir (`--user-data-dir`) keeps PoC
  settings isolated from the developer's real VSCodium installation

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| CSS injection to hide title bar DOM elements | Fragile; breaks on VSCodium DOM changes; requires `--disable-web-security` |
| Electron `BrowserWindow.setMenuBarVisibility(false)` on VSCodium window | Cannot reach VSCodium's window from outside its process without undocumented IPC |
| Overlapping the Electron ribbon on top of VSCodium | Z-order races; VSCodium focus events can push it behind |

## Consequences

- **Easier:** no patching of VSCodium source; approach survives minor version updates
- **Harder:** `window.titleBarStyle` behaviour differs subtly between Windows and other OSes; PoC is Windows-only so this is acceptable
- **Locked in:** PoC must write a controlled `argv.json` / `settings.json` to `--user-data-dir`; that directory layout must be maintained in the full rewrite
