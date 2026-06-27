# ADR-014: Workspace-Panel Persistence Mechanism
**Date:** 2026-06-25
**Status:** Resolved — no code change required

## Spike E Result (2026-06-25)
The Julia WORKSPACE panel is visible on 2nd+ cold launches without any user
action. VSCodium's own view-restoration restores it by default. The one-shot
`applyLayoutIfFirstOpen()` preset is correctly NOT re-running on subsequent
launches (the integrated terminal does not auto-open, editor has focus — signs
the preset is one-shot as designed).

SC-2 was already satisfied before Sprint 4 began. No code change was made.

## Note on sidebar state persistence
Manual sidebar changes (e.g. switching to Search) do not persist across launches
— VSCodium restores to the Julia view container regardless. With the Sprint 4
fixed-port change (ADR-015 amendment), browser-origin state now persists; the
H1/H2 discriminator (does telemetry dismissal survive a clean quit?) should be
run in Sprint 5 to confirm whether serve-web state is now fully persistent.
