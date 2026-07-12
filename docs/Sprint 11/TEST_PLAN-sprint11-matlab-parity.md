# Test Plan — Sprint 11

Manual verification only.

1. **Subtitle:** toggle on with variables selected — confirm
   `subtitle="Subtitle"` appears in generated code, plot shows a subtitle.
2. **Colorbar:** toggle on with a Heatmap or Surface plot type selected
   (colorbar is meaningful there) — confirm `colorbar=true` appears,
   colorbar renders. Also toggle on with Scatter (colorbar not
   meaningful) — confirm no error, just a harmless no-op.
3. **Grid triad:**
   - Click Grid — confirm both gridlines. Click X-Grid — confirm Grid
     turns off, only vertical lines. Click Y-Grid — confirm X-Grid turns
     off, only horizontal lines. Click Y-Grid again — confirm it turns
     off, no gridlines, and neither Grid nor X-Grid reactivated.
   - Confirm this exclusion does NOT affect Legend/X Label/Y Label —
     toggle those independently alongside any grid state, confirm no
     interference.
4. **Regression:** confirm existing AXES options (Legend, X Label,
   Y Label) and formatting persistence across plot-type changes
   (Sprint 10's core behavior) still work correctly.
5. **Teardown:** same John-only single-cycle procedure as prior sprints.
