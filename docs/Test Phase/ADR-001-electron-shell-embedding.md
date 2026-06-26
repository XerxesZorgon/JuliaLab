# ADR-001: Electron Shell as VSCodium Host
**Date:** 2026-06-22
**Status:** Accepted

## Context

JuliaLabShell needs to own the window chrome (ribbon, window controls) while
using VSCodium as the editor surface. Three options were evaluated: fork
VSCodium internals, use a VSCodium extension webview, or wrap VSCodium in an
independent Electron shell.

## Decision

Run a separate Electron process that owns the window chrome and launches
VSCodium in a child BrowserWindow or via a subprocess pointed at a local
VSCodium installation, with VSCodium's own title bar and menu bar suppressed.

## Rationale

- No fork: VSCodium upstream updates do not require merge work on internals
- No extension constraint: the ribbon is not limited by the VSCodium extension
  API surface
- Electron is already VSCodium's own runtime (v39.8.8); no new runtime is
  introduced
- Cursor and Windsurf demonstrate the pattern at production scale

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Fork VSCodium workbench | 500k-line TS codebase; ongoing merge debt; months of ramp-up |
| VSCodium extension webview only | Cannot remove VSCodium's native title bar/menu without a fork; double-header problem persists |

## Consequences

- **Easier:** ribbon chrome is fully owner-controlled; no VSCodium internals knowledge required
- **Harder:** Electron↔VSCodium IPC boundary must be managed for any future command wiring
- **Locked in:** VSCodium version must be pinned and updated deliberately; embedding API is undocumented and may break on major VSCodium releases
