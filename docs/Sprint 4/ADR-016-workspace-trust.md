# ADR-016: Workspace Trust — Root Cause and Resolution
**Date:** 2026-06-25 (resolved 2026-06-26)
**Status:** Resolved — closed via ADR-015 amendment (fixed port)

## Original intent
Disable the workspace-trust dialog that appeared on every cold launch, dropping
the workbench into Restricted Mode.

## Investigation — all settings-based approaches blocked
Three approaches were attempted and all confirmed non-functional:

**Machine-scope settings.json key** (`security.workspace.trust.enabled: false`):
Applied but ignored. VSCode issue #210965 (microsoft/vscode, labeled *as-designed*)
confirms this setting has no effect under serve-web — VSCode settings in the web
context are stored in browser storage, not file-based settings.

**User-scope settings.json key** (same key in `server-data/data/User/settings.json`):
Applied but ignored. Same root cause as above. The User settings file IS read by
serve-web (confirmed via Command Palette → Open User Settings), but trust is not
controlled by this key in the web context.

**CLI flag `--disable-workspace-trust`**: Confirmed absent from `codium-tunnel.exe
serve-web` — the binary's `--help` output lists no trust flag.

**Manual "Yes, I trust" click**: Did not persist across restarts. Trust decision
is stored in browser IndexedDB, keyed by origin (`http://127.0.0.1:<port>`).

## Root cause
Dynamic port (ADR-015 original) created a new browser origin each session.
Browser storage is strictly partitioned by origin. Every launch on a new port
was a fresh storage bucket — the trust click from the prior session was
inaccessible. This is why the dialog appeared on every launch regardless of what
the user clicked.

## Resolution
Fixed port 41000 (ADR-015 amendment). Same origin every launch → IndexedDB
persists → trust decision survives across sessions. Verified: trust dialog absent
on 2nd+ cold launch after clicking "Yes, I trust" once.

## Consequences
- No code change targeting trust directly. The fix is the port stability.
- `--cli-data-dir` flag (available in `codium-tunnel serve-web --help`) may
  offer an alternative: pointing CLI metadata storage into `server-data/` could
  make trust persistent independently of port. Worth investigating in Sprint 5
  if a future feature requires dynamic ports again.
- The T-trust and T-trust-B commits (Machine-scope key; detect-deps User-scope
  seed) were reverted. They are in git history but are inert.
