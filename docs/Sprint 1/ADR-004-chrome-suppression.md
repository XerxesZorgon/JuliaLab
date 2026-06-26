# ADR-004: Suppress VSCodium chrome via web context (automatic) + settings.json (activity bar only)
**Date:** 2026-06-22
**Revised:** 2026-06-23
**Status:** Accepted — validated by manual test on dev machine

## Context

The embedded VSCodium workbench must show no title bar, menu bar, or
activity bar. In the PoC (Path A subprocess), all three required explicit
suppression via `settings.json`. In Path D (`codium serve-web`), the
suppression story is simpler.

## Decision

Rely on the web context to automatically suppress the title bar and menu
bar. Suppress the activity bar via `workbench.activityBar.visible: false`
in a Machine `settings.json` written to the server data directory before
spawn.

## Validation (2026-06-23)

Manual test confirmed: when `codium serve-web` is loaded in a browser,
the title bar and menu bar are absent automatically — the browser/Electron
chrome owns that space. Only the activity bar (left icon strip) remains
and requires explicit suppression.

## Rationale

- Title bar is absent in web context: the workbench renders inside an
  existing browser/Electron window; there is no OS-level title bar to
  show.
- Menu bar is absent in web context: VS Code's menu bar is not rendered
  in the web workbench by default.
- Activity bar requires explicit suppression: it is part of the workbench
  layout, not the OS chrome, and renders in web context unless disabled.
- Writing settings before spawn avoids a race condition between settings
  write and workbench load.
- An isolated server data dir prevents cross-contamination with the
  user's own VSCodium profile.

## Chrome Suppression Settings (minimal set)

```json
{
  "workbench.activityBar.visible": false,
  "workbench.statusBar.visible": true
}
```

`window.titleBarStyle` and `window.menuBarVisibility` are NOT needed —
those settings control native window chrome, which does not apply in
the web context.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| CSS injection via executeJavaScript after load | Fragile; breaks on VSCodium DOM changes |
| Suppressing via URL query parameters | No supported mechanism in serve-web |
| Writing all four original PoC suppression keys | titleBarStyle and menuBarVisibility are no-ops in web context; including them is misleading |

## Consequences

- Easier: fewer settings needed; title bar and menu bar suppression is
  free in web context; settings.json is simpler than in the PoC.
- Locked in: Sprint 1 uses the default server data directory
  (~/.vscodium-server/). Sprint 4 will manage this path for bundled
  distribution to avoid colliding with the user's own VSCodium profile.
