# Software Description Document — MATLAB-Parity FIGURES Features
**Project:** JuliaLabApp
**Sprint:** 11
**Version:** 0.1
**Date:** 2026-07-11
**Author:** John Peach / eurAIka
**Depends on:** Sprint 10 (`PersistentPlotState`, `generatePlotCode()`/`buildCallArgs()`, reactive regeneration), backlog #8

---

## 1. Purpose

Close part of the MATLAB-parity gap identified during Sprint 9 prior-art
review (backlog #8): add Subtitle, Colorbar, and two new independent
X-Grid/Y-Grid toggles (alongside, not replacing, the existing combined
Grid toggle) to the AXES ribbon group. Text Arrow annotations and
GLMakie/interactive-window plotting were both proposed during scoping and
are deferred together as backlog #14 — this sprint stays entirely within
the existing Plots.jl/GR architecture proven across Sprints 9-10, and is
now purely additive kwargs work with no new state-model changes.

## 2. Scope

### 2.1 Subtitle (new AXES toggle)
Follows the exact existing pattern of `xlabel`/`ylabel` (Sprint 9/10) —
fixed placeholder text, no free-text input, consistent with the
already-accepted limitation for labels. Generates `subtitle="Subtitle"`.

### 2.2 Colorbar (new AXES toggle)
Generates `colorbar=true`. Meaningful mainly for heatmap/contour/surface,
but harmless as a no-op kwarg on other plot types — same tolerance
already established for `markershape`/`linewidth` applying regardless of
type.

### 2.3 X-Grid / Y-Grid split (adds to, does not replace, existing Grid toggle)
Per John's confirmation: the existing combined "Grid" toggle
(`grid=true`, both axes) stays exactly as-is — it's the most-used case.
Two NEW independent toggles are added alongside it: X-Grid and Y-Grid,
generating `xgrid=true`/`ygrid=false` per John's confirmed syntax. Three
grid-related buttons total in the AXES group.

**New open question this raises, not yet resolved — see §4:** what
happens if a user has the combined Grid toggle ON and also toggles
X-Grid or Y-Grid independently? Plots.jl would receive both `grid=true`
and (e.g.) `xgrid=false` as kwargs simultaneously — behavior is not
verified, could be silently conflicting rather than one cleanly
overriding the other.

## 3. Architecture Notes

- Subtitle/Colorbar/Grid-split all extend `PersistentPlotState.plotConfig.axes`
  exactly like existing entries — no structural change to Sprint 10's
  state model at all. This sprint, as now scoped, is purely additive
  kwargs work, no new state shapes needed.

## 4. Open Questions (must resolve before DESIGN doc)

1. **Grid precedence conflict — DECIDED (2026-07-11), via direct
   empirical test.** John tested Plots.jl's actual behavior directly:
   `plot(θ, y, grid=true, xgrid=false)` still renders both gridlines —
   **`grid=true` silently overrides a conflicting independent setting**
   when both are passed together. Rather than let the ribbon UI produce
   that same silent-no-op confusion, the three grid-related buttons
   (Grid, X-Grid, Y-Grid) become a **mutually exclusive triad** — a
   radio-group nested inside the otherwise-independent AXES multi-toggle
   group. Selecting one clears the other two; each still individually
   toggles on/off. `generatePlotCode()` therefore only ever needs to
   emit at most one of `grid=true` / `xgrid=.../ygrid=...` at a time —
   this actually simplifies code-gen, since the precedence question is
   resolved structurally by the UI rather than needing conditional logic
   at generation time.

   **Real implementation implication, not just a kwarg change:** this
   needs a new interaction pattern in `renderer.js`'s AXES button
   handling — a mutual-exclusion subset within an otherwise-independent
   multi-toggle group. Not unprecedented in this app (PLOT TYPE is
   already a full radio-group), but this is the first time part of a
   multi-toggle group needs radio-like behavior while the rest of the
   same group (Legend, X Label, Y Label) stays independently toggleable.
   This is a UI/state-model design decision at the DESIGN-doc level, not
   significant enough to warrant its own ADR (no alternatives
   architecture bet involved, unlike Sprint 10's TreeView/reactive-
   trigger decisions).

2. **Subtitle placeholder text — DECIDED (2026-07-11).** Fixed
   placeholder string, matching `xlabel`/`ylabel`. If unset, the kwarg is
   omitted entirely (not an empty string) — same pattern as every other
   optional AXES kwarg today.

All open questions now resolved. Ready for DESIGN doc.

## 5. Explicitly Out of Scope

- **Text Arrow annotations — DEFERRED (2026-07-11), folded into the
  GLMakie initiative (backlog #14) rather than treated as separate.**
  John clarified: even a basic typed-coordinate (non-dragging) version
  isn't wanted as a standalone Sprint 11 item — the whole annotation
  capability, both the fancy drag-to-place version and a simpler
  typed-coordinate MVP, waits until GLMakie is scoped properly as its own
  initiative. Backlog #14 updated to reflect this.
- GLMakie / interactive native-window plotting (backlog #14)
- Sprint 8 regressions (backlog #7)
- Multi-variable plotting / Lorenz-style paths (backlog #9)
