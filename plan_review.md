The plan is solid overall. Here's my critical review — things that are correct, things that need fixing, and things that could cause Claude Code to get stuck.

---

## ✅ What's Right

**Task 1 (sysimage)** is precise and safe. The guard against redefining `app_data_dir` is important and correctly flagged.

**Task 2 (splitpanes)** covers all the real failure modes for Tauri + splitpanes. The CSS fixes are correct.

**Task 7B (Pkg staleness)** is a clean, idiomatic Julia solution. `mtime()` comparison against a stamp file is the right approach.

---

## ⚠️ Issues That Will Cause Problems

### 1. Task 3 — `RibbonToggle.vue` doesn't exist yet
The `PlotsToolbar.vue` code imports `RibbonToggle.vue` but the plan never instructs Claude Code to create it. Claude Code will either fabricate it incorrectly or error out. **Add to Task 3:** create `RibbonGroup.vue`, `RibbonButton.vue`, and `RibbonToggle.vue` as shared primitives *before* creating `PlotsToolbar.vue`.

### 2. Task 3 — Icon components are phantom
The `plotTypes` array references `IconLine`, `IconScatter`, etc. as Vue components, but they're never defined or imported. The plan says "use lucide-vue-next or inline SVG" but doesn't resolve the component binding. Claude Code needs a concrete instruction: either use lucide icons mapped by name, or create a `PlotIcon.vue` that renders a small inline SVG thumbnail by plot type.

### 3. Task 5 — Pluto's `require_secret_for_access` flag was removed
In recent Pluto versions (0.19.x+), `require_secret_for_access` and `require_secret_for_open_links` are no longer valid keyword arguments — Pluto will throw on startup. The correct modern approach is:

```julia
Pluto.run(
    port=port,
    launch_browser=false,
    secret="",           # empty string disables auth in current Pluto
)
```

Claude Code should be told to check `Pluto.run` keyword arguments at runtime with `?Pluto.run` before assuming these flags exist.

### 4. Task 5 — Tauri CSP will block the iframe
Tauri 2's default Content Security Policy blocks iframes loading from `localhost`. The plan doesn't address this. Claude Code needs to add to `tauri.conf.json`:

```json
"security": {
  "csp": "default-src 'self'; frame-src http://localhost:*; script-src 'self' 'unsafe-inline' http://localhost:*; style-src 'self' 'unsafe-inline'"
}
```

Without this, the Pluto iframe will silently refuse to load.

### 5. Task 6 — Pluto HTTP API endpoints are not what's documented
The plan references `POST /api/notebook/{id}/cells/create` but Pluto uses a **WebSocket-based message protocol**, not a REST API for cell operations. There is no stable REST endpoint for cell insertion. The correct approach for Task 6 is `postMessage` to the iframe, using Pluto's internal message format, **or** injecting code via the Julia REPL that calls `Pluto.ServerSession` methods. Claude Code needs this clarification or it will build something non-functional.

**Recommended replacement instruction for Task 6:**
> Cell insertion must use `postMessage` to the Pluto iframe. Before implementing, read the Pluto source at `~/.julia/packages/Pluto/*/src/webserver/` to identify the current WebSocket message format for `add_cell`. Implement a JS helper in `LiveEditorPanel.vue` that posts the correct message to the iframe's `contentWindow`.

### 6. Task 7A — `tokio::spawn` pattern may not compile
The async Revise loading block captures `tx` by move, but `tx` is likely used after the spawn elsewhere in the function. Claude Code needs to be told to clone the sender before spawning: `let tx_revise = tx.clone();` then use `tx_revise` inside the spawn.

---

## 🔧 Minor Improvements

- **Task 4 (Apps):** `Interact.jl` is largely unmaintained and has compatibility issues with Julia 1.12. The plan should note this and suggest `PlutoUI.jl` widgets embedded in a Pluto notebook as the fallback for interactive app UI, rather than `Interact.jl`.

- **Execution order:** Task 6 depends on Task 5 being fully working (Pluto server running, iframe embedded). The plan says this but it's worth making it explicit that Task 6 should not be started until the `get_pluto_url` Tauri command is returning a live URL.

- **Definition of Done** is good and complete. No changes needed there.

---

## Summary

The plan is ready to run **after** these five targeted fixes are applied to the CLAUDE.md before handing it to Claude Code:

1. Add creation of `RibbonGroup`, `RibbonButton`, `RibbonToggle` primitives before `PlotsToolbar`
2. Resolve icon components concretely (use lucide mapped by name)
3. Fix the Pluto startup flags (remove `require_secret_for_*`, use `secret=""`)
4. Add the Tauri CSP fix for iframe localhost
5. Replace the REST API cell insertion with a `postMessage` approach and direct Claude Code to read Pluto's WebSocket message format first

Read `CLAUDE.md` for the complete plan with these fixes applied.

Here's a summary of every fix that was applied versus the original:

**Fix 1 — Ribbon primitives created first (Step 3a).** `RibbonGroup.vue`, `RibbonButton.vue`, and `RibbonToggle.vue` are now fully specified with complete code and must exist before any toolbar component is attempted. Claude Code is explicitly blocked from proceeding to 3b until all three compile.

**Fix 2 — Icons are concrete, not phantom strings (Step 3c).** The `plotTypes` array now holds direct lucide component references (`TrendingUp`, `Circle`, etc.) imported at the top of the script block — no dynamic string-to-component resolution that Vue can't handle at runtime.

**Fix 3 — Pluto startup flags are version-safe (Step 5b).** The `start_pluto.jl` script now introspects `methods(Pluto.run)` at runtime to detect which auth keyword exists, and passes only what the installed version accepts. It handles both the old `require_secret_for_access` (≤0.18) and the new `secret=""` (≥0.19) automatically.

**Fix 4 — Tauri CSP is the very first Pluto step (Step 5a).** This is now task 5a with a hard "do this before any Pluto code" gate, and the CSP string covers `frame-src`, `connect-src` (for WebSocket), `script-src`, `style-src`, and `img-src` for `localhost:*`.

**Fix 5 — Insert tab uses `postMessage`, not a REST API (Step 6a).** The REST endpoint approach is gone. The implementation now uses `iframe.contentWindow.postMessage(...)` with a clear note to verify the exact `type` field name against the Pluto WebSocket source before shipping, with instructions on how to do so using browser DevTools.

**Bonus fix — `tx.clone()` before spawn (Fix A).** The async Revise pattern now explicitly clones the sender before spawning and uses `tx_revise` inside the task, preventing a move-after-use compiler error.