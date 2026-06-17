# Feature: Prompt Consolidation and Startup Output Cleanup
**Date:** 2026-06-16  **Tier:** 2 — Feature  **Author:** John Peach

## Purpose
The Command Window displays Julia's startup output badly: stderr load
frames (normal Julia precompile instrumentation) appear interleaved
with stdout and look like crash backtraces; the terminal clear fires
~5s before Julia finishes activating, so the real julia> prompt
arrives after it with no subsequent write, leaving the window
apparently stuck until the user types something. The REPL is
functional; the display is not. This feature fixes both by
consolidating to one authoritative prompt writer keyed off a
deterministic backend signal, and by suppressing stderr load-frame
noise during the startup window.

## Users and Use Cases

| User              | Use Case                                                     |
| ----------------- | ------------------------------------------------------------ |
| Any JuliaLab user | Opens the app and sees a clean Command Window with a julia> prompt, no apparent error output |
| Any JuliaLab user | Restarts Julia and sees the same clean result                |
| Developer         | A real Julia exception during startup is still visible — suppression is time-bounded, not permanent |

## Success Criterion
After a cold start and after a restart:
1. The Command Window shows no interleaved stderr frame lines during
   startup.
2. A clean `julia>` prompt appears without the user typing anything.
3. If Julia throws a real exception after activation completes, it
   appears in the Command Window normally — suppression does not hide
   post-activation errors.
4. All three criteria hold on both cold start and restart paths.
Binary: observable in the running app, no special tooling needed.

## Out of Scope
- Changing any backend Rust actor behavior or event contracts.
- Modifying what Julia scripts emit or how they load packages.
- The stdout/stderr interleave visible *after* startup (only the
  startup window is suppressed; interleave during user eval is
  unchanged and acceptable).
- Dark/light theme changes, font changes, or any other terminal
  styling.

## Affected Components

| Component                | What changes                                                 |
| ------------------------ | ------------------------------------------------------------ |
| `TerminalView.vue`       | Remove the "Project activated:" text-match timer path (paths 2); gate `ensurePromptVisible` (path 1) on the execution actor's prompt signal rather than duplicating it; add startup stderr suppression window |
| `execution_actor/mod.rs` | Emit a distinct frontend event (`julia:prompt-ready`) after the existing `julia:output "julia> "` emit, so the frontend has a clean signal to key off — OR confirm the existing `orchestrator:startup-ready` event is sufficient (see Open Questions) |

## Design

### The three prompt writers today (all removed or consolidated)

| Path                        | Trigger                                                      | Problem                                                      |
| --------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| 1 — `ensurePromptVisible()` | `orchestrator:startup-ready` event                           | Fires before activation finishes on some runs; guarded by `promptWrittenThisSession` but races path 3 |
| 2 — text-match timer        | Substring "Project activated:" in julia:output + 2500ms      | Fires ~5s before Julia finishes; unconditional `term.clear()` wipes whatever path 1 or 3 wrote |
| 3 — execution actor         | `julia:output "julia> "` emitted after `ActivateProject` completes | Correct and deterministic — this is the authoritative signal |

### Target design (one writer)

Path 3 is the only writer that is both correct and deterministic —
it fires after the execution actor confirms activation, which is
exactly when the prompt should appear. The fix is:

1. **Remove path 2 entirely.** The "Project activated:" text match
   and its 2500ms timer are deleted. The `term.clear()` it was
   doing moves to step 3 below.
2. **Make path 1 a no-op for the prompt.** `ensurePromptVisible()`
   keeps its `promptWrittenThisSession` guard but stops writing
   `julia>` directly — it instead calls `term.clear()` only, to
   wipe the noisy startup output at the right moment (see below).
3. **Path 3 becomes the single prompt writer.** When `julia:output`
   carries exactly `"julia> "` and `promptWrittenThisSession` is
   false, write the prompt and set the flag. No other path writes
   the prompt.

### Startup stderr suppression

A boolean flag `suppressStartupStderr` is set `true` when Julia
starts and cleared when `orchestrator:startup-ready` fires. While
the flag is true, lines received on `julia:error` that match the
load-frame pattern are dropped silently:

/^\s+[[(@]/

This matches `  [3] __require(...)`, `    @ Base .\loading.jl:2358`,
and similar instrumentation lines. Lines that do NOT match this
pattern (i.e. a real `ERROR:` header or exception message) are
always shown regardless of the flag — real errors are never
suppressed.

After `orchestrator:startup-ready` fires, `suppressStartupStderr`
is cleared and all stderr lines display normally.

### Clear timing

The `term.clear()` should fire once, keyed off
`orchestrator:startup-ready` (the earliest point at which we know
Julia is ready and the startup noise is complete). This replaces
the 2500ms timer. The sequence becomes:

orchestrator:startup-ready fires
 → term.clear()               # wipe startup noise
 → suppressStartupStderr = false  # re-enable stderr display
 → (path 3 writes julia> when the emit arrives, which is
 already in-flight from the execution actor)

On restart, `promptWrittenThisSession` and `suppressStartupStderr`
are both reset when `orchestrator:julia_restart_started` fires,
so the same logic runs cleanly on the restart path.

## Open Questions

These must each become a decision before coding starts:

1. **Is `orchestrator:startup-ready` timing correct for the clear?**
   The cold-start log shows startup-ready at 17:53:49 and
   `Julia prompt emitted` at 17:53:56 — a 7-second gap. If
   `term.clear()` fires at startup-ready and the prompt arrives 7s
   later, the window will be blank for 7 seconds. Alternatives:
   (a) clear on `orchestrator:startup-ready`, accept the blank
   window — clean but blank; (b) clear immediately before writing
   the prompt in path 3 — no blank window, but requires path 3
   to do the clear; (c) clear on startup-ready and write a
   "Julia is starting…" placeholder. **Decision needed before Task
   005 is written.**

2. **Is path 3's signal unambiguous?** `julia:output "julia> "`
   will also fire for every user command that returns a prompt.
   The `promptWrittenThisSession` guard handles this for cold
   start, but on restart the flag is cleared — is there a risk
   of a mid-session `julia>` triggering an unwanted clear?
   **Decision needed: should path 3 only act during a defined
   startup/restart window, or is the flag sufficient?**

3. **Stderr suppression pattern correctness.** The regex
   `/^\s+[\[(@]/` was derived from observed frames. Are there
   Julia stderr lines during normal startup that do NOT match
   this pattern but also should not be shown? Conversely, are
   there legitimate user-visible errors that DO match it?
   **Validate against 2–3 cold-start logs before coding the
   filter.**

4. **Restart path parity.** `orchestrator:julia_restart_started`
   is the proposed reset trigger. Confirm this event fires before
   any new julia:output lines arrive on the restart path, or the
   flag reset will race the new startup output.

## New Dependencies
None.

## Affected Files (anticipated)
- `app/app/src/components/HomeView/TerminalView.vue` — primary
- Possibly `app/internals/src/actors/execution_actor/mod.rs` —
  only if a distinct `julia:prompt-ready` event is chosen over
  the existing `julia:output "julia> "` signal (Open Question 2)