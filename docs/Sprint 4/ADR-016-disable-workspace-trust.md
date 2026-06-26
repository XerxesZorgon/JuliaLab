# ADR-016: Disable Workspace Trust
**Date:** 2026-06-25
**Status:** Accepted

## Context (KI-6)
On every launch, VSCodium prompts "Do you trust the authors of the files in this
folder? (`C:\Users\johnx\JuliaLab`)" and, until answered, runs in **Restricted
Mode** — which disables task execution and some extension features and interrupts
the auto-start flow. Workspace trust is meant to be a one-time per-folder
decision; its recurrence indicates the trust decision is not persisting (see SDD
§8, H1/H2). For a single-user scientific IDE whose default workspace is its own
trusted-by-construction folder, this prompt is pure friction.

## Decision
Disable workspace trust globally by adding to
`server-data/Machine/settings.json`:
```json
"security.workspace.trust.enabled": false
```
Confirmed merge-safe: `detect-deps.js` merges via
`Object.assign({}, existing, detected)` and its `detected` set does not include
this key, so it is preserved on every relaunch.

## Rationale
- One line; eliminates the prompt and Restricted Mode regardless of whether the
  underlying persistence issue is H1 or H2 (it removes the dependency on
  persisted trust entirely).
- Appropriate for a single-user IDE on a trusted-by-construction default folder.

## Alternatives Considered
| Option | Rejected Because |
|---|---|
| Trust only the default folder (seed trusted-folders list) | Depends on the same global-state persistence that appears broken; would likely recur |
| Leave trust on, fix persistence first | Blocks a one-line UX fix on an unresolved root-cause investigation |
| Reduce to `security.workspace.trust.startupPrompt: "never"` | Leaves Restricted Mode active; features stay disabled |

## Consequences
- The trust warning is suppressed even if a user later opens an untrusted repo
  *inside* JuliaLab. Accepted for this product; recorded here as the explicit
  security trade-off.
- Does not address the underlying persistence anomaly (SDD §8) — that remains a
  Sprint 5 investigation, and the H1/H2 discriminator test should still be run
  after KI-1 lands to learn whether persistence is structurally broken.
