# ADR-024: WS Bridge Argument Passing
**Date:** 2026-07-04
**Status:** Accepted

## Context

The ribbon-to-extension WebSocket bridge (port 2999, ADR-023) currently
carries messages of the form `{ command: string }`. `executeCommand` is
invoked with no arguments. The Plot Builder (SDD-plot-builder.md) requires
executing `language-julia.executeJuliaCodeInREPL` with a generated Julia
code string as its argument — the current message format cannot express
this.

## Decision

Extend the WS message schema to `{ command: string, args?: any[] }`. In
`extension.ts`, the dispatch handler destructures `args` (defaulting to
`[]`) and spreads it into `vscode.commands.executeCommand(command, ...args)`
for any command matching the existing ADR-020 prefix allowlist
(`julialab.`, `workbench.action.`, `editor.action.`, `language-julia.`).

## Rationale

- Minimal surface change: one new optional field, no new message types,
  no new WS endpoints.
- Reuses the existing ADR-020 prefix allowlist rather than introducing a
  parallel authorization path for "commands with arguments."
- Existing senders (ribbon buttons that send `{ command }` only) continue
  to work unmodified — `args` defaults to `[]`, and `executeCommand(command)`
  is behaviorally identical to `executeCommand(command, ...[])`.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| New dedicated message type (e.g. `{ type: 'execCode', code }`) for REPL execution only | Adds a second dispatch path to maintain alongside the generic one; doesn't generalize to future commands that need arguments |
| Pass code via a temp file path instead of a WS argument | Adds filesystem round-trip latency and cleanup responsibility for no benefit — WS already carries structured JSON |
| Base64/serialize args to avoid arbitrary JS values in transit | Unneeded complexity for a localhost, single-process bridge; JSON already round-trips strings, numbers, arrays cleanly |

## Consequences

**Easier:**
- Any future ribbon feature needing to pass arguments to a VSCode command
  (not just Plot Builder) reuses this same mechanism — no further protocol
  changes needed for Sprint 10+ features.
- Plot Builder's REPL execution (SDD §3.5) can be implemented directly
  against this format.

**Harder / now locked in:**
- **Security surface widening, stated explicitly:** prior to this ADR, the
  ribbon WS client could only *select which allowlisted command* to run.
  After this ADR, it can also supply that command's *argument payload*.
  Concretely, `language-julia.executeJuliaCodeInREPL` now accepts an
  arbitrary string of Julia code originating from the ribbon
  WebContentsView. This is an acceptable trust boundary today because the
  ribbon view only runs code the extension itself generated
  (Plot Builder's code-gen, SDD §3.4) — but it means the allowlist alone no
  longer bounds *what* a command does, only *which* command runs. If the
  ribbon WebContentsView's content is ever sourced from anything other than
  first-party code shipped with JuliaLabApp (e.g. remote content, user-
  editable ribbon config), this becomes a code-execution path into the
  Julia REPL and should be revisited.
- No argument validation/type-checking is specified by this ADR — a
  malformed `args` array (wrong arity, wrong types) fails at the
  `executeCommand` call site with whatever error VSCode's command registry
  produces. Acceptable for Sprint 9 per SDD §5 Q6, but not a substitute for
  future input validation if this bridge is extended further.
- This is a breaking-in-spirit (not breaking-in-practice) protocol change:
  any external tooling that constructs raw WS messages by hand (outside
  `renderer.js`) needs to know about the new optional field.
