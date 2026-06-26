# ADR-001: Use openvscode-server + WebContentsView for single-window embedding
**Date:** 2026-06-22
**Status:** Accepted (pending spike validation — Task 001)

## Context

JuliaLabApp must present VSCodium's full workbench (file tree, editor,
integrated terminal, extension host) inside a single Electron OS window
below a custom ribbon bar. Three architectural options were evaluated in
the JuliaLabShell PoC thread.

## Decision

Spawn `openvscode-server` as a local subprocess bound to `localhost:PORT`.
Load `http://localhost:PORT` into an Electron `WebContentsView` positioned
below the ribbon. Both ribbon and workbench share one `BaseWindow`.

## Rationale

- Eliminates all two-window UX problems from PoC (drag delay, Z-order
  intrusion, minimize/maximize desync, accidental detach).
- `WebContentsView` is the current Electron-recommended multi-view API;
  `BrowserView` is deprecated.
- `openvscode-server` serves a fully-functional VS Code workbench including
  extension host, PTY terminal, and LSP — not the no-terminal Web build.
- The Julia extension's PTY runs server-side (node-pty in the extension
  host), so it has full terminal access. WebSocket overhead on localhost
  is estimated at 1–5 ms round-trip, acceptable on top of the xterm.js
  baseline (~30 ms).
- Does not require forking VSCodium internals.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| A — Two-window subprocess + SetWindowPos (PoC approach) | Drag delay, Z-order intrusion, minimize desync, exposed resize handles |
| B — VS Code for the Web (static build) | No integrated terminal; loses PTY responsiveness that motivated the rewrite |
| C1 — Fork VSCodium Electron main process | 500k-line TS codebase; months of ramp-up; ongoing merge debt |
| C2 — Load VSCodium workbench.html directly in WebContentsView | VSCodium no longer loads via `file://`; uses custom protocol registered by its own main process — cannot be loaded by an external Electron process |

## Consequences

- Easier: single OS window; no PowerShell; no positioning math.
- Harder: must bundle openvscode-server and manage its process lifecycle;
  must verify spike (Task 001) before implementation tasks begin.
- Locked in: localhost HTTP boundary between Electron shell and VSCodium
  workbench; all ribbon→workbench IPC crosses this boundary via
  `webContentsView.webContents.executeJavaScript()` or VSCodium's
  command API.
- If spike fails: fall back to ADR-001-ALT (Path A subprocess approach),
  which is already validated by the PoC.
