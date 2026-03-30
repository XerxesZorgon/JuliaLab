# T1a — Layout Control Manual Test

**Setup:** Run `npm run tauri dev`. Wait for Julia Ready.

## TC-1a.1 Layout persistence (resize)
1. Drag the left splitter to resize the file tree to roughly 30% width.
2. Close the app and reopen.
3. **Pass:** File tree reopens at ~30% width (not reset to default 18%).

## TC-1a.2 Layout preset picker accessibility
1. Click the VIEW tab in the ribbon.
2. **Expected:** A "Layout" button with a dropdown chevron is visible in the LAYOUT group.
3. Click it — a popover grid of 5 layout thumbnails appears.
4. **Pass:** All 5 presets are named, thumbnails are visible and schematically
   accurate (wider workspace preset shows a wider right pane in the SVG).

## TC-1a.3 Apply a preset
1. Open the layout picker.
2. Click "Wide Workspace" preset.
3. **Expected:** Left panel narrows; right Workspace panel widens.
4. **Pass:** Pane sizes snap to new values. Picker closes automatically.

## TC-1a.4 Active preset highlight
1. Open the layout picker immediately after applying "Wide Workspace".
2. **Expected:** "Wide Workspace" card has a green border (active indicator).
3. **Pass:** Exactly one card is highlighted as active.

## TC-1a.5 Status bar quick access
1. Without opening the VIEW tab, locate the Layout button in the status bar (right side).
2. Click it — same popover grid appears, opening upward.
3. **Pass:** Layout picker accessible from any ribbon tab via the status bar.

## TC-1a.6 Panel drag-to-swap
1. Hover over a panel header bar (e.g. "FILES" in the left pane).
2. **Expected:** Cursor changes to `grab`.
3. Drag the panel header onto another panel header (e.g. Workspace/right pane).
4. **Expected:** A dashed green drop-target highlight appears on the target header
   as the dragged header passes over it.
5. Release the mouse button.
6. **Pass:** The two panels have swapped positions.

   *Note: Step 6 (PanelHeader wiring into MainLayout) is not yet complete —
   this test case requires that wiring to be done first.*

## TC-1a.7 Drag-to-swap persistence
1. After completing TC-1a.6, close and reopen the app.
2. **Pass:** Swapped panel positions are restored (persisted to localStorage key
   `julialab:panel-slots`).

## TC-1a.8 Preset resets swap
1. With panels in a swapped state, open the layout picker and apply "Default".
2. **Pass:** Panels return to canonical positions (FileTree left, Workspace right).

## Failure signatures
- Preset picker does nothing → `applyPreset` not wired to `layoutStore`
- Sizes don't persist → localStorage watcher not running; check `julialab:pane-sizes`
- Popover opens but closes instantly → `onClickOutside` firing on the trigger button itself
- Drop highlight doesn't appear → `@dragover.prevent` missing (browser blocks drop
  events without `.prevent` on the dragover handler)
- Panels swap but content doesn't change → `panelSlots` not bound to
  `<component :is="...">` in MainLayout (Step 6 not yet wired)
