# Software Description Document — Sprint 7

**Project:** JuliaLabApp
**Sprint:** 7 — Ribbon button wiring (Tier 1) + COMMAND WINDOW sync + DevTools
**Version:** 0.1
**Date:** 2026-07-02
**Author:** John Peach / eurAIka
**Tag at sprint start:** `sprint6-complete`
**ADRs in force (inherited):** ADR-020, ADR-021, ADR-022

---

## 1. Purpose

Sprint 6 delivered a visually complete four-tab ribbon with all buttons
rendering correctly but most dispatching `noop`. Sprint 7 makes the ribbon
functional in two tiers:

**Tier 1 (this sprint — wire immediately):** Every button whose command id
falls under `workbench.action.*` or `editor.action.*` is wired now. These are
standard VSCodium commands that work verbatim under the ADR-020 prefix
allowlist without any verification step.

**Tier 2 (deliverable for Sprint 8):** A verified `language-julia.*` command
id table, produced by triangulation (command palette search + terminal output +
extension host log probe), is delivered as a document this sprint. The actual
wiring of those commands happens in Sprint 8.

Additionally Sprint 7 delivers:
- COMMAND WINDOW toggle button stays in sync with actual terminal panel state
  via a new WS bridge event from `extension.ts`
- F2 ribbon collapse hides tab text (gives VSCodium-native feel)
- `Ctrl+Shift+I` opens ribbon DevTools (developer-only)

---

## 2. Users and Use Cases

| User | Use Case |
|---|---|
| MATLAB-migrating scientist | Clicks HOME Find in Files → VSCodium search panel opens |
| Same user | Clicks CODE Format → active file formatted |
| Same user | Clicks FIGURES New → plot pane opens |
| Same user | Clicks VIEW COMMAND WINDOW toggle → terminal shows/hides; button color stays accurate |
| Same user | Presses F2 → ribbon collapses to tab strip only (no tab text) |
| Developer (John) | Presses Ctrl+Shift+I → ribbon DevTools inspector opens |

---

## 3. Features

### Tier 1 — Immediate wiring (this sprint)

**HOME tab:**
- SEARCH group: Find in Files, Replace, Symbols, Go to File — all
  `workbench.action.*` — wire immediately
- SETTINGS group: Preferences, Keybindings, Theme (visual-only) — wire
  Preferences and Keybindings; Theme remains visual-only (no argument support)
- DIRECTORY, PACKAGE MANAGER, UPDATE, HELP — remain `noop` (require Julia
  process interaction or unverified ids)

**CODE tab:**
- PROJECT group: New, Open, Save — `workbench.action.files.*` — wire
- EDIT group: Cut, Copy, Paste — `editor.action.clipboard*` — wire;
  Undo, Redo — bare `undo`/`redo` commands — wire (already in allowlist
  as bare commands — ADR-023 decision needed, see Section 6)
- NAVIGATE group: Go to Definition, Find, Forward, Back — wire
- FORMAT group: Indent, Comment — `editor.action.*` — wire;
  Refactor — `noop` (requires language server context)
- RUN group: Run large button, Run Selection, Execute Cell, Restart REPL —
  all `language-julia.*` — Tier 2 (verify first)
- DEBUG group: Breakpoint, Step, Continue — all `language-julia.*` — Tier 2

**FIGURES tab:**
- FIGURE group: New → `language-julia.show-plotpane` (already proven) — wire
- All other FIGURES buttons — `language-julia.*` or unimplemented — Tier 2

**VIEW tab:**
- PANES group: FILE BROWSER → `workbench.view.explorer` — wire;
  COMMAND WINDOW → `workbench.action.terminal.toggleTerminal` — wire + sync;
  WORKSPACE → `language-julia.show-workspace` — Tier 2;
  VARIABLE EXPLORER, DOCUMENTATION, HISTORY — Tier 2
- LAYOUT MANAGER: Load layout → `workbench.action.editorLayoutTwoColumns` — wire
- RIBBON: Hide/Pin — already wired (Sprint 6)
- THEME: visual-only (Sprint 6)

### COMMAND WINDOW panel-state sync

`extension.ts` publishes a `panelState` message over the WS bridge whenever
the terminal panel opens or closes. `renderer.js` listens and toggles the
COMMAND WINDOW button's `.active` class to match. This is the only PANES
button with sync this sprint.

### F2 collapse — hide tab text

When the ribbon is hidden (collapsed to 30px strip), the tab labels
(HOME · CODE · FIGURES · VIEW) are hidden via CSS. The strip shows only
the blue background and window controls. Restoring via F2 or Pin Ribbon
shows the tab labels again.

### DevTools shortcut

`Ctrl+Shift+I` opens ribbon `WebContentsView` DevTools. Developer-only;
no production guard (packaging sprint will add one).

---

## 4. Non-Goals

- Dropdowns (ADR-022 — deferred)
- Activity bar launchers for Pluto, Lean, Wolfram, Claude (Sprint 8)
- `language-julia.*` command wiring (Sprint 8 — pending Tier 2 table)
- PANES panel-state sync except COMMAND WINDOW
- Windows packaging
- KI-6 false crash popup (independent)

---

## 5. Success Criteria (binary)

| # | Criterion | Verifiable by |
|---|---|---|
| S1 | All Tier 1 buttons execute their commands on click | Manual click test per button |
| S2 | COMMAND WINDOW button stays green when terminal open, gray when closed | Toggle terminal manually; button updates |
| S3 | F2 collapse hides tab text; tab strip shows only blue + window controls | Visual |
| S4 | `Ctrl+Shift+I` opens ribbon DevTools inspector | Keyboard shortcut |
| S5 | Tier 2 `language-julia.*` command id table delivered as `docs/Sprint 7/julia-commands.md` | Document present and complete |
| S6 | ✕-quit teardown still clean | Process-diff audit (John-verified) |

---

## 6. Open Questions / ADR Triggers

**ADR-023:** `undo` and `redo` are bare command ids (not prefixed). The current
`ALLOWED_PREFIXES` check in `extension.ts` requires a prefix match — bare
`undo` / `redo` will be silently dropped by the bridge. Three options:
(a) add `''` as an allowed prefix (too wide),
(b) add `undo` and `redo` as explicit string exceptions in the bridge,
(c) map them to `editor.action.undo` / `editor.action.redo` in `index.html`
(correct VSCodium command ids — these exist and are prefixed).
Option (c) is correct and costs nothing — change the `data-command` values
in `index.html`. No ADR needed; resolved inline in Task 001.

**ADR-023 (actual):** COMMAND WINDOW sync protocol — what message format does
`extension.ts` send over the WS bridge for panel state events? Options:
(a) a new message type `{ event: 'panelState', panel: 'terminal', open: bool }`,
(b) reuse the existing command channel with a synthetic `julialab.terminalState`
command and a payload. Option (a) is cleaner — the bridge already handles
arbitrary JSON; adding an `event` field alongside `command` is backward
compatible. This is the ADR-023 decision.

---

## 7. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `workbench.action.*` id mismatch (VSCodium vs VSCode) | Low | Med | Test each on first launch; VSCodium 1.121 is close to VSCode |
| COMMAND WINDOW sync fires on wrong events | Med | Low | Use both `onDidOpenTerminal` and `onDidChangeActiveTerminal` |
| `editor.action.clipboard*` blocked by CSP or focus | Med | Med | Verify clipboard actions with editor focused; fallback to noop with comment |
| Tier 2 table incomplete after triangulation | Med | Low | Table is a deliverable doc, not a gate — Sprint 8 wires what's verified |
| F2 tab-text hide conflicts with ribbon-hidden CSS | Low | Low | Test hide/pin cycle; both use `main.js` view bounds, no CSS conflict expected |
