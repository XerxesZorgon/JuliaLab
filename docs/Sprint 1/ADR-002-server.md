# ADR-002: Use `codium serve-web` (VSCodium built-in) as the embedded server
**Date:** 2026-06-22
**Revised:** 2026-06-23
**Status:** Accepted — validated by manual test on dev machine

## Context

Sprint 1 requires a server process that serves the VSCodium workbench over
HTTP so it can be loaded into an Electron `WebContentsView`.

Original decision was openvscode-server (Gitpod). That was invalidated by
Task 001 spike: openvscode-server publishes Linux-only binaries and its
latest release is v1.109.5 — no Windows support, version too far behind
VSCodium 1.121.03429.

code-server (Coder) was also evaluated and rejected: Linux-only binaries,
same Windows gap.

## Decision

Use `codium serve-web`, VSCodium's own built-in web server CLI command,
as the server process.

## Validation (2026-06-23)

Manual test on dev machine (Windows 10 x64, VSCodium 1.121.03429):

```
codium serve-web --host 127.0.0.1 --port 3456 --without-connection-token
```

Result: VSCodium workbench loaded successfully in a browser at
`http://127.0.0.1:3456`. Full workbench visible (activity bar, editor
area, status bar). No title bar, no menu bar (suppressed automatically
in web context). Activity bar present — suppressed via settings.

## Rationale

- Version is guaranteed to match VSCodium because it IS VSCodium's own
  CLI — no version mismatch possible.
- No separate binary to download, install, or bundle for Sprint 1 —
  `codium` is already on the dev machine PATH.
- First run downloads and caches a server component to
  `~/.vscodium-server/`; subsequent runs use the cache — no re-download.
- Title bar and menu bar are automatically absent in the web context;
  only activity bar suppression is needed via settings.
- The blank-screen bug (VSCodium issue #2578) was fixed in PR #2612,
  merged 2026-11-26, and is included in VSCodium 1.121.03429.

## Key Operational Details

- **CLI binary:** `C:\Program Files\VSCodium\bin\codium` (on PATH)
- **Server cache:** `C:\Users\johnx\.vscodium-server\`
- **Ready signal:** `Extension host agent started` in server stdout
  (NOT `Web UI available at` — that fires before the server is ready)
- **Internal IPC:** Windows named pipe (`\\.\pipe\codium-*`); external
  HTTP interface remains `http://127.0.0.1:PORT`
- **Connection token:** `--without-connection-token` required; omitting
  it appends `?tkn=...` to the URL which the WebContentsView must handle

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| openvscode-server (Gitpod) | Linux-only binaries; max version 1.109.5; no Windows path |
| code-server (Coder) | Linux-only binaries; no Windows support |
| Path E — Fork VSCodium TitlebarPart | 1–2 day initial setup + ongoing merge debt per VSCodium release; not worth it if serve-web works |
| Path A — subprocess + SetWindowPos (PoC) | Two-window UX problems; eliminated now that serve-web is validated |

## Consequences

- Easier: no binary to manage; version always matches; chrome suppression
  mostly automatic in web context; first-run download is one-time.
- Harder: first run requires internet access to download server component
  (~16MB); Sprint 4 distribution must either pre-cache or bundle the
  server component.
- Locked in: spawn `codium serve-web --host 127.0.0.1 --port PORT
  --without-connection-token`; detect ready on `Extension host agent
  started`; load `http://127.0.0.1:PORT` in WebContentsView.

## Spike Results (Task 001b — 2026-06-23)

```
SPIKE RESULT: PASS
Electron version: 39.8.8
Ready signal line: Web UI available at http://127.0.0.1:3457
SPIKE-1: PASS — server started without error
SPIKE-2: PASS — full workbench visible in WebContentsView
SPIKE-3: PASS — terminal echo subjectively imperceptible
SPIKE-4: PASS — activity bar absent via settings.json
```

### Windows-specific spawn findings

- `codium` is NOT on the system PATH; must use full path
- `.cmd` wrapper requires `cmd.exe /c` invocation with `shell: false`
- `shell: true` splits on spaces in path — do not use
- Correct pattern: `spawn('cmd.exe', ['/c', CODIUM_BIN + '.cmd', 'serve-web', ...], { shell: false })`
- Ready signal is `Web UI available at` on CLI stdout — fires before
  `Extension host agent started` which appears via internal wrapper ~2s later
