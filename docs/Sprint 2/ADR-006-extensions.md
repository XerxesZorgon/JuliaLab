# ADR-006: Install extensions via codium CLI into server-data/extensions/
**Date:** 2026-06-23
**Status:** Accepted (pending Task 001 spike)

## Decision

Install extensions using `codium --install-extension <id> --extensions-dir
server-data/extensions/ --force` via `scripts/install-extensions.js`.
Run once at development setup time.

## Rationale

CLI handles download and dependency resolution. `--force` makes it
idempotent. Sequential installs avoid registry conflicts. Targeting
`server-data/extensions/` isolates from user's own VSCodium profile.

## Extension versions

Pinned after Task 001 spike. TBD.
