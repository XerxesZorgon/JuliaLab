# ADR-018: Remove `debounce` from Resize Event Handler (KI-2)
**Date:** 2026-06-27
**Status:** Accepted
**Sprint:** 5

---

## Context

Sprint 4 delivered T2 (view background colour fix) which applied
`setBackgroundColor('#1e1e1e')` to both `WebContentsView` objects. The black
flash on rapid window resize persisted (KI-2, ⚠️ partial in Sprint 4 SDD).

The current resize handler is:

```javascript
state.win.on('resize', debounce(setViewBounds, 16));
```

The 16 ms debounce coalesces rapid resize events. Between the moment the
BaseWindow repaints its new size and the moment `setViewBounds` fires (~16 ms
later), a gap frame can appear where the BaseWindow background shows through the
views. This is visible as a thin black band between the ribbon and workbench
panes on fast drags.

Two possible root causes:
1. **Debounce gap (H1):** The 16 ms delay is long enough for a gap frame to
   appear. Removing the debounce would call `setViewBounds` synchronously on
   every resize event, keeping the views flush with the window at all times.
2. **BaseWindow repaint (H2):** The BaseWindow itself repaints before the
   WebContentsViews catch up, regardless of debounce timing. No application-layer
   fix is possible without Electron-internal repaint hooks.

---

## Decision

Remove the debounce. Replace:
```javascript
state.win.on('resize', debounce(setViewBounds, 16));
```
with:
```javascript
state.win.on('resize', setViewBounds);
```

The `debounce` helper and its call are both removed from `main.js`. `setViewBounds`
is idempotent and fast (two `setBounds` calls); calling it on every resize event
has negligible CPU cost.

If the flash persists after this change, H2 is confirmed and KI-2 is documented as
BaseWindow-level; no further fix is attempted within Sprint 5.

---

## Rationale

H1 is more likely than H2:
- `setBackgroundColor` fills the view background but does not prevent a gap when
  the view has not yet been resized to fill the window.
- Electron's `BaseWindow.on('resize')` fires at ~60 Hz on a 60 Hz monitor; the
  debounce window (16 ms ≈ one frame) means the views lag by at least one frame
  on every resize event — matching the visual artefact.
- Removing the debounce is a one-character diff with zero risk of breakage
  (`setViewBounds` is idempotent and has been in production since Sprint 1).

H2 (BaseWindow repaint race) is possible but requires Electron-internal hooks not
available in the application layer. It should only be investigated if H1 is
conclusively ruled out.

---

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Keep debounce at lower threshold (e.g. 4 ms) | Still a gap; not clearly better than 16 ms |
| Use `requestAnimationFrame` equivalent | Not directly available in Electron main process |
| Investigate `BaseWindow` repaint hooks | H2 path; premature until H1 is ruled out |
| Remove background colour instead | Regression; background is needed for cold-start flash |

---

## Consequences

- Easier: Eliminates or clearly diagnoses KI-2; simplifies the resize handler.
- Harder: On very high-frequency resize events (trackpad gesture), `setViewBounds`
  is called at display rate (~60 calls/s). This is not a concern for the current
  workload (two `setBounds` calls per event).
- Locked in: If H2 is confirmed, KI-2 is closed as "BaseWindow-level, deferred
  indefinitely." A future Electron upgrade may resolve it.

---

## Outcome (fill in after T-KI2 is verified)

**Flash eliminated?** [ ] Yes — SC-1 passes / [ ] No — H2 confirmed, SC-1 ⚠️

**Root cause:** [ ] H1 (debounce gap) / [ ] H2 (BaseWindow repaint)

**Note for Sprint 6 (if H2):**
```
Flash eliminated? No — SC-1 ⚠️ partial
Root cause: H1 (debounce gap) partially confirmed — flash reduced after removal.
H2 (BaseWindow repaint) confirmed as remaining cause — Electron-internal,
no application-layer fix available.
Note for Sprint 6: investigate Electron compositor hooks or upgrade path.
```
