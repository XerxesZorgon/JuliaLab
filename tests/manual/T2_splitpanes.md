# T2 — Splitpanes Manual Test

**Setup:** Run `npm run tauri dev`. Wait for Julia Ready signal.

## Test Cases

### TC-2.1 Vertical splitter (left sidebar ↔ center pane)
1. Hover over the vertical divider between the file tree and the editor.
2. **Expected:** cursor changes to `col-resize` (left-right arrow).
3. Click and drag left → file tree shrinks, editor grows.
4. Click and drag right → file tree grows, editor shrinks.
5. **Pass:** both panes resize smoothly with no jump or snap.

### TC-2.2 Vertical splitter (center pane ↔ right panel)
1. Hover over the divider between the editor and the Workspace/Plots panel.
2. Repeat drag tests as above.
3. **Pass:** both panes resize independently of TC-2.1 test.

### TC-2.3 Horizontal splitter (editor ↔ command window)
1. Hover over the horizontal divider above the Command Window.
2. **Expected:** cursor changes to `row-resize`.
3. Drag up → Command Window grows. Drag down → Command Window shrinks.
4. **Pass:** resize works without clipping or overflow.

### TC-2.4 Splitter visibility
1. Check splitter width: all splitters must be visibly ~6px wide/tall
   (not 1–3px hairlines).
2. Hover each splitter: background changes to green accent color.
3. **Pass:** hover color change is visible on all four splitters.

### TC-2.5 Layout persistence (if implemented)
1. Resize panels, close app, reopen.
2. **Expected:** pane sizes are restored to last session values.
3. **Pass:** no reset to default sizes on relaunch.

## Failure signatures
- Cursor does not change → z-index or pointer-events issue
- Splitter exists but doesn't move → overflow:hidden clipping parent
- Only one axis works → horizontal/vertical CSS rules are swapped
