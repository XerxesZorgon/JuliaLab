# Software Design Document — Sprint 6

**Project:** JuliaLabApp
**Sprint:** 6 — MATLAB-style ribbon redesign (flat grouped buttons)
**Version:** 0.2
**Date:** 2026-06-27
**Author:** John Peach / eurAIka
**Decisions in force:** ADR-020 (prefix-allowlist dispatch), ADR-021 (ribbon-height
SSOT), ADR-022 (dropdowns deferred to Sprint 7)

---

## 1. Architecture Overview

The redesign replaces the flat six-item text tab bar with a MATLAB-style ribbon:
a blue **tab strip** over a light **grouped-button body** that swaps per active
tab. It lives entirely in the existing ribbon `WebContentsView`; the process,
port, teardown, and trust architecture are untouched.

```
BaseWindow
├─ ribbonView   (WebContentsView, h = RIBBON_HEIGHT)   ← redesigned
│    index.html  →  tab strip (row 1) + tab bodies (row 2)
│    ribbon.css  →  light theme, #00589C strip, grouped layout
│    renderer.js →  tab→body switch + button dispatch
├─ workbenchView (WebContentsView, y = RIBBON_HEIGHT)  ← unchanged
│    http://127.0.0.1:41000  (codium serve-web)
└─ (no overlay view this sprint — dropdowns deferred, ADR-022)

dispatch:
  body button ──ws://127.0.0.1:2999──▶ extension.ts (prefix allowlist, ADR-020)
  Pluto button ──ipcMain 'pluto:launch'──▶ main.js launchPluto()
```

The ribbon gains a **tab → body** model. Tab click switches the visible body
`<div>`; the buttons inside each body dispatch commands. `renderer.js` therefore
changes this sprint (the Sprint 6 context note that it would not was incorrect —
five files are in play).

---

## 2. Component / Module Breakdown

| Component | Responsibility | Change |
|---|---|---|
| `index.html` | Tab strip (8 tabs) + one body `<div>` per tab; JuliaLab icon at left end of body; window controls on strip | Rewrite ribbon markup |
| `ribbon.css` | Light theme, `#00589C` strip, group/label/separator layout, active-tab state, `var(--ribbon-height)` | Rewrite |
| `renderer.js` | Tab click → set active + show that tab's body (hide others); button click → WS or ipc dispatch | Extend with body switching |
| `main.js` | `RIBBON_HEIGHT` constant (SSOT, ADR-021); inject `--ribbon-height` CSS var into ribbon view; use in `setViewBounds()` | ADR-021 edit |
| `extension.ts` | WS bridge validates by prefix allowlist instead of exact-match map | ADR-020 edit + `npm run build:ext` |

---

## 3. Tab Strip Specification

Tabs, left to right — all `no-drag` islands on a draggable `#00589C` strip:

| # | Tab label | Functional in S6 |
|---|---|---|
| 1 | HOME | Body switches only |
| 2 | EDIT | Placeholder body |
| 3 | PLOTS | 1 live button (Show Plot Pane) |
| 4 | APPS | Placeholder body |
| 5 | VIEW | Placeholder body |
| 6 | PLUTO | 1 live button (Launch Pluto, ipc) |
| 7 | LEAN | Placeholder body |
| 8 | WOLFRAM | Placeholder body |

Active tab: lighter panel punch-out from blue strip + white text + 2 px white
bottom border (matches JL26). Inactive: `#D3E4F5` text on `#00589C`. Window
controls (−, □, ×) right-aligned on the strip; close hovers red.

---

## 4. Tab → Body Model

`renderer.js` rule: tab click sets `.active`, shows `div.ribbon-body[data-tab]`
for that tab, hides all others. All bodies are present in the DOM at load.
No fetch, no dynamic creation.

---

## 5. HOME Body — Button Specification

Source: `julialab-ribbon.jsx` HOME `tabContents` (lines 143–191), adapted from
the dark-theme `.jsx` to the Sprint 6 light theme and new tab split.

The `.jsx` HOME contained FILE / NAVIGATE / EDIT / CODE / RUN / ENVIRONMENT.
In the 8-tab scheme EDIT gets its own tab, so HOME retains only the groups that
are fundamentally "home base" actions:

| Group | Buttons | Icon keys (from .jsx) | Layout |
|---|---|---|---|
| (JuliaLab icon) | App icon tile | — | 46 px, left end |
| **FILE** | New Script (large), New, Open, Go to File, Find Files | `newFile`, `newFile`, `open`, `find`, `find` | large + 2×2 grid |
| **CODE** | Run Section, Format Code, Run File | `section`, `format`, `run` | 3 stacked |
| **VARIABLES** | Clear Workspace, Workspace, Packages | `workspace`, `workspace`, `pkg` | 3 stacked |
| **NAVIGATE** | Find, Find Files, Undo, Redo | `find`, `find`, `undo`, `redo` | 2×2 grid |

Note: all buttons are flat this sprint (no `▼` chevron). Buttons with `dropdown`
in the .jsx become flat single-action buttons pending Sprint 7.

---

## 6. EDIT Body — Placeholder Specification

The EDIT body is a placeholder frame this sprint. It receives the groups from
the .jsx HOME body that belong to an editor context:

| Group | Buttons (Sprint 7 wiring targets) | Icon keys |
|---|---|---|
| **NAVIGATE** | Find, Find Files, Undo, Redo | `find`, `find`, `undo`, `redo` |
| **EDIT** | Cut, Copy, Paste | `cut`, `copy`, `paste` |
| **CODE** | Format Code, Run Section, Breakpoints | `format`, `section`, `breakpt` |
| **RUN** | Run (large), Step (large), Stop (large, disabled) | `run`, `step`, `stop` |
| **ENVIRONMENT** | Packages, Workspace, Revise | `pkg`, `workspace`, `revise` |

All buttons render with icons but dispatch `noop` this sprint.

---

## 7. PLOTS Body — Placeholder with 1 Live Button

From the .jsx PLOTS `tabContents` (lines 194–243). Groups: 2D Plots / 3D Plots /
Control & Signal / Figure Style / Backend. All buttons `noop` except one:

**Show Plot Pane** → `language-julia.show-plotpane` (proven command, WS bridge).
This is the only new live button added to PLOTS this sprint; it replaces the
current flat-tab PLOTS dispatch.

---

## 8. PLUTO Body — 1 Live Button

Single group, single large button:

**Launch Pluto** → `data-dispatch="ipc"` `data-command="pluto:launch"` →
`window.electronAPI.launchPluto()`. Existing proven path preserved.

---

## 9. APPS / VIEW / LEAN / WOLFRAM Bodies

All placeholder frames this sprint. Reference content for future sprints:

- **APPS**: from .jsx APPS body — Launch Apps / Build App / Interact.jl Widgets /
  App Gallery / Dyad (Modeling) groups. Dyad moves here from old HOME.
- **VIEW**: from .jsx VIEW body — Layout / Panels / Sidebar Panels / Theme /
  Ribbon groups.
- **LEAN**: new; designed Sprint 7+.
- **WOLFRAM**: new; designed Sprint 7+.

---

## 10. Color & Layout Spec (sampled from JL26.png)

| Token | Value | Source |
|---|---|---|
| Tab strip bg | `#00589C` | JL26 pixel sample |
| Inactive tab text | `#D3E4F5` | derived |
| Active tab text | `#FFFFFF` | JL26 |
| Body bg | `#F0F0F0` | JL26 pixel sample |
| Group separator | `#DCDCDC` | JL26 pixel sample |
| Group label | `#8A8A8A`, 10 px, uppercase, letter-spaced, centred | JL26 |
| Button text | `#333333` | JL26 |
| Strip height | 30 px | measured |
| Body height | ~94 px | measured |
| `RIBBON_HEIGHT` | **124 px** | strip + body (ADR-021) |

Blue is JL26's `#00589C`, intentionally distinct from MATLAB's `#0076A8`.

---

## 11. Icon Asset Strategy

**Source:** `julialab-ribbon.jsx`, `icons` object, lines 10–54. All icons are
inline SVG path strings (`strokeWidth 1.8`, `strokeLinecap round`,
`strokeLinejoin round`, 24×24 viewBox). No separate files, no git extraction
needed.

**V0.1 DESIGN was wrong** on this point: there is no `compute42` branch icon
file set to extract. The paths are in the .jsx.

**Delivery:** Extract the `icons` object into `assets/icons.js` (a plain JS
module exporting the path map). `index.html` loads it via `<script src="assets/icons.js">`.
The inline SVG `<path d="...">` approach is fully CSP-compliant under
`script-src 'self'; style-src 'self' 'unsafe-inline'`.

**Full icon inventory used in Sprint 6:**

| Key | Used in |
|---|---|
| `newFile` | HOME FILE group |
| `open` | HOME FILE group |
| `find` | HOME FILE, NAVIGATE groups |
| `undo` | HOME NAVIGATE |
| `redo` | HOME NAVIGATE |
| `section` | HOME CODE |
| `format` | HOME CODE |
| `run` | HOME CODE, EDIT RUN |
| `workspace` | HOME VARIABLES, EDIT ENV |
| `pkg` | HOME VARIABLES, EDIT ENV |
| `cut`, `copy`, `paste` | EDIT EDIT group |
| `breakpt` | EDIT CODE |
| `step`, `stop` | EDIT RUN |
| `revise` | EDIT ENVIRONMENT |
| `notebook` | PLUTO body |
| `plot` | PLOTS (placeholder) |

---

## 12. Dispatch Specification

- **WS bridge (ADR-020):** `extension.ts` forwards command iff id starts with
  `julialab.`, `workbench.action.`, `editor.action.`, or `language-julia.`.
  Buttons carry `data-command="<id>"`; `renderer.js` sends over port 2999.
- **ipc (Pluto):** Launch Pluto button carries `data-dispatch="ipc"
  data-command="pluto:launch"` → `window.electronAPI.launchPluto()`.
- `julialab.focusEditor` / `julialab.showPlots` remain valid under `julialab.`
  prefix. HOME dispatches `julialab.focusEditor` on activation.

---

## 13. Error Handling

Unchanged from v0.1 — WS unreachable drops command + logs; missing icon falls
back to neutral glyph; Pluto failure hits existing `dialog.showErrorBox`.

---

## 14. Open Design Questions

None blocking Phase 6. Two items tracked as tasks:

1. **Revert spike** — `git checkout -- index.html` before any other task.
2. **Per-button command ids** — verified at each wiring task, not pre-assumed.
