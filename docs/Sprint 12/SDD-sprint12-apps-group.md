# SDD — HOME Tab APPS Group + Companion App Launchers
**Sprint:** 12
**Date:** 2026-07-11
**Depends on:** investigation findings (Pluto launcher code, Wolfbook/Lean4/Claude Code contributed commands, Lean4 titlebar menu structure)

## 1. Purpose
Consolidate access to Pluto, Wolfram (Wolfbook), Lean4, and Claude Code
into a single new HOME tab "APPS" group, regardless of whether each also
has an existing Activity Bar icon (Wolfram, Claude) or editor-toolbar
icon (Lean4) — those stay as-is, unchanged, this is a second, consistent
access point. Also add two new HELP-group external links (Wolfbook,
Pluto), matching the existing Julia Docs/Examples/Community pattern.

## 2. Scope

### 2.1 HOME tab, new "APPS" group — 4 buttons (REVISED 2026-07-13)

**Browser-mechanism question RESOLVED:** John confirmed he prefers the
existing `vscode.env.openExternal()` internal-popup behavior (used by
Docs/Examples/Community/About) — it feels fast and integrated. No change
to those existing buttons. Pluto stays on `shell.openExternal`/Zen
(genuine system browser) since that's required for it to work at all —
John explicitly approved keeping this as the one exception. All NEW
doc/link buttons (Wolfram's 6 links, Pluto's 2 links) use
`vscode.env.openExternal`, matching the preferred existing pattern.

- **Pluto:** dispatches `data-dispatch="pluto-menu"` → opens a **custom
  ribbon-side popup menu** (built in `index.html`/`renderer.js`/CSS, NOT
  a VS Code `QuickPick`) with 3 items:
  1. Launch Pluto — `window.electronAPI.launchPluto()` (existing
     mechanism from Task 001, unchanged)
  2. Documentation — new `julialab.openPlutoDocs` command,
     `vscode.env.openExternal('https://plutojl.org/en/docs/')`
  3. Get Involved — new `julialab.openPlutoGetInvolved` command,
     `vscode.env.openExternal('https://plutojl.org/en/docs/get-involved/')`

  **Why not a QuickPick like Lean/Wolfram:** Pluto's primary action
  (spawning a process) lives in `main.js`, a separate process the
  extension host can't directly reach. A QuickPick is an extension-host
  API — it can't call `window.electronAPI.launchPluto()`, which is a
  renderer/preload concept. Rather than build new cross-process bridging
  infrastructure for one button, Pluto's menu lives entirely in the
  renderer/ribbon layer instead, where it already has access to both the
  existing IPC call and can dispatch the two new doc-link commands via
  the existing WS bridge.

- **Wolfram:** dispatches `julialab.openWolframMenu` (new extension
  command, native `QuickPick`, matches Lean's pattern exactly) with 7
  items:
  1. Launch Kernel — existing `workbench.view.extension.wolfbook-debugger`
     + `wolfbook.launchKernel` sequence (unchanged from the earlier fix)
  2. GitHub Repository — `https://github.com/vanbaalon/wolfbook`
  3. Getting Started — `https://github.com/vanbaalon/wolfbook/blob/main/docs/getting-started.md`
  4. Features — `https://github.com/vanbaalon/wolfbook/blob/main/docs/features.md`
  5. Best Practices — `https://github.com/vanbaalon/wolfbook/blob/main/docs/best-practices.md`
  6. Report an Issue — `https://github.com/vanbaalon/wolfbook/issues`
  7. Wolfram Engine (free download) — `https://wolfram.com/engine`

- **Lean:** unchanged from original scope — `julialab.openLeanMenu`,
  14-item flat QuickPick (§2.2, already implemented and confirmed
  working)
- **Claude:** unchanged from original scope, with the `editor.openLast`
  correction already applied (§2.1 original, already implemented and
  confirmed working)

### 2.2 Lean QuickPick — 14 items, flat, exact command IDs confirmed
```
1.  Create Standalone Project...     lean4.project.createStandaloneProject
2.  Create Project Using Mathlib...  lean4.project.createMathlibProject
3.  Download Project...              lean4.project.clone
4.  Open Local Project...            lean4.project.open
5.  Show Documentation Resources     lean4.docs.showDocResources
6.  Show Manual                      lean4.docs.showExtensionManual
7.  Show Setup Guide                 lean4.docs.showSetupGuide
8.  Show Unicode Input Abbreviations lean4.docs.showAbbreviations
9.  Find Unicode Symbol...           lean4.input.findSymbol
10. Search With Loogle...            lean4.loogle.search
11. Show Troubleshooting Guide       lean4.troubleshooting.showTroubleshootingGuide
12. Show Troubleshooting Output      lean4.troubleshooting.showOutput
13. Show Setup Information           lean4.troubleshooting.showSetupInformation
14. Lean 4 Homepage                  (external — vscode.env.openExternal, https://lean-lang.org/)
```
Items 1-13 dispatch via `executeCommand()`. Item 14 uses the
already-proven `openExternal` pattern (same as `julialab.openJuliaDocs`
etc.).

### 2.3 HELP group — unchanged, no additions
**Revised (2026-07-13):** the originally-planned Wolfbook/Pluto Help
links are now folded into each app's own dropdown menu (§2.1) instead of
being separate HELP-group buttons — cleaner, keeps all Wolfram-related
actions under the Wolfram button and all Pluto-related actions under the
Pluto button, rather than splitting them across two ribbon groups.

## 3. Pluto — real fix needed, not just wiring (as implemented, corrected after testing)

**Confirmed via direct test (2026-07-11):** `Pluto.run()` prints
`Opening http://localhost:1234/?secret=cGXTbHow in your default
browser...` — port is stable at `1234`, but Pluto requires a per-session
random `?secret=...` token in the URL as a lightweight local-access
safeguard. **This means the URL cannot be hardcoded** — it must be
parsed from process output every launch, because the secret changes each
run.

**Two corrections made during implementation, both from actual testing,
not assumption:**
1. **`launch_browser=false`, not `autoopen=false`.** The originally
   assumed keyword doesn't exist in the installed Pluto version — its
   own error message's "closest candidates" list confirmed the real
   parameter name.
2. **The ready message (including the URL) is written to STDERR, not
   STDOUT.** Julia's `@info` macro — which Pluto uses for this message —
   writes to stderr by convention. The URL-detection regex must check
   BOTH streams (a shared buffer/check function), not just stdout.

Final implemented approach: pass `launch_browser=false` (prevents
Pluto's own browser-open, avoids a double-tab on first launch), parse
the real URL from either stdout OR stderr via a shared regex check, store
it, and always call `shell.openExternal(capturedUrl)` — both on first
successful launch AND on the "already running" early-return path.

```javascript
let plutoUrl = null; // module-level, alongside existing plutoProcess

ipcMain.on('pluto:launch', () => {
  if (plutoProcess && !plutoProcess.killed) {
    if (plutoUrl) shell.openExternal(plutoUrl);
    return;
  }
  const juliaExe = getJuliaExe();
  plutoProcess = spawn(juliaExe,
    ['-e', 'using Pluto; Pluto.run(launch_browser=false)'],
    { stdio: ['ignore', 'pipe', 'pipe'], detached: false }
  );
  state.childPids.add(plutoProcess.pid);

  let ready = false;
  let combinedBuffer = '';

  function checkForPlutoUrl(text) {
    combinedBuffer += text;
    if (!ready) {
      const match = combinedBuffer.match(/https?:\/\/localhost:\d+\/\?secret=\w+/);
      if (match) {
        ready = true;
        plutoUrl = match[0];
        console.log('[pluto] server ready:', plutoUrl);
        shell.openExternal(plutoUrl);
      }
    }
  }

  plutoProcess.stdout.on('data', chunk => {
    const text = chunk.toString();
    process.stdout.write('[pluto] ' + text);
    checkForPlutoUrl(text);
  });
  plutoProcess.stderr.on('data', chunk => {
    const text = chunk.toString();
    process.stderr.write('[pluto:err] ' + text);
    checkForPlutoUrl(text);
  });
  // ...existing exit handler unchanged (resets plutoProcess and plutoUrl to null)...
});
```

**Known, accepted limitation (not a bug):** repeat clicks while the
server is already running correctly reopen the SAME session URL each
time, but `shell.openExternal` has no way to detect or focus an
already-open browser tab — the OS simply opens a new tab per call. All
tabs share the identical session/secret, so this is cosmetic redundancy,
not a functional problem. Confirmed via direct testing (2026-07-13):
three rapid clicks produced three tabs, all with the identical
`?secret=...` value.

## 4. No ADR-020 changes
Per the wrapping-command architecture — `julialab.*` commands internally
call third-party command IDs via `executeCommand()`, so the WS bridge
prefix allowlist never needs to know about `wolfbook.*`/`lean4.*`/
`claude-vscode.*` at all.

## 5. Out of scope
- Claude Code's "can't interact with agent" issue — third-party
  extension's own UX, not JuliaLabApp code
- Rebuilding Lean4's nested Version-Management/Documentation submenus —
  flat list per John's confirmed decision
- Any change to existing Activity-Bar or editor-toolbar icons for these
  apps — HOME tab is an ADDITIONAL access point, not a replacement
