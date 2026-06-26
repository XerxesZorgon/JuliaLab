# tasks.md — JuliaLabApp Sprint 2
**Last updated:** 2026-06-23

---

## Task 001: Spike — Verify codium CLI extension install + directory
**Status:** [ ] Pending
**Milestone:** M0
**Depends on:** sprint1-complete tag

### What to do (manual — not Antigravity)

**Step 1:** Run in PowerShell from the project root:
```powershell
& "C:\Program Files\VSCodium\bin\codium.cmd" `
  --install-extension julialang.language-julia `
  --extensions-dir "$PWD\server-data\extensions" `
  --force
```
Note the exact version installed from the output.

**Step 2:** Verify files appeared:
```powershell
dir server-data\extensions
```

**Step 3:** Launch app and verify extension loads:
```
npm start
```
Open Extensions panel (Ctrl+Shift+X). Confirm `julialang.language-julia`
appears as installed.

**Step 4:** While app is running, also verify:
- SPIKE-3: Activity bar visible? (settings.json still has
  `workbench.activityBar.visible: false` at this point — it should
  NOT be visible yet. This confirms Task 002 is needed.)

**Also resolve before Task 003 — check wolfbook and lean4 settings keys:**
- Visit https://open-vsx.org/extension/wolfbook/wolfbook and find
  the configuration key for the Wolfram kernel path.
- Visit https://open-vsx.org/extension/leanprover/lean4 and find
  the configuration key for the lean executable path.

### Acceptance Criterion
```
SPIKE RESULT: PASS / FAIL
julialang.language-julia version installed: X.Y.Z
server-data/extensions/ contains extension directory: YES/NO
Extension visible in workbench Extensions panel: YES/NO
wolfbook kernel path settings key: <exact key name>
lean4 executable path settings key: <exact key name>
SPIKE-1: PASS/FAIL
SPIKE-2: PASS/FAIL
SPIKE-3: CONFIRMED (activity bar not yet visible — Task 002 needed)
```
Report to planning thread before proceeding.

### On Failure
```
FAIL: Task 001 — [step that failed] — [exact error]
```
Escalate immediately.

---

## Task 002: Update settings.json — re-enable activity bar
**Status:** [ ] Pending
**Milestone:** M1
**Depends on:** Task 001 PASS

### Files touched
- `server-data/Machine/settings.json`

### Acceptance Criterion
File contains exactly:
```json
{
  "workbench.statusBar.visible": true
}
```
Cold launch shows activity bar visible on left side of workbench.
Commit: `git commit -m "Task 002: re-enable activity bar"`

### On Failure
```
FAIL: Task 002 — [exact error or what is not visible]
```

---

## Task 003: Create scripts/detect-deps.js
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** Task 002 + wolfbook/lean4 settings keys confirmed in Task 001

### Files touched
- `scripts/detect-deps.js` — new file

### What to build
A Node.js module that:
1. Detects Julia path via `juliaup which release`, falls back to
   `%LOCALAPPDATA%\juliaup\bin\juliaup.exe`, then PATH.
2. Detects Wolfram kernel via Windows registry
   `HKLM\SOFTWARE\Wolfram Research\Installations`, falls back to
   known install paths, then PATH.
3. Detects Lean4 via `elan which leanprover/lean4:stable`, falls back
   to `%USERPROFILE%\.elan\bin\elan.exe`, then PATH.
4. Reads current `server-data/Machine/settings.json`.
5. Merges discovered paths using the confirmed settings keys from
   Task 001 (wolfbook kernel key, lean4 executable key,
   `julia.executablePath`).
6. Writes updated settings.json.
7. Returns `{ settings, warnings, installUrls }` where:
   - `warnings`: human-readable string per missing tool
   - `installUrls`: install URL per missing tool

Install URLs:
- Julia: `https://julialang.org/downloads/`
- Wolfram Engine: `https://www.wolfram.com/engine/`
- Lean4/elan: `https://lean-lang.org/install/`

### Acceptance Criterion
```
node -e "require('./scripts/detect-deps').detectDeps(
  'server-data/Machine/settings.json'
).then(r => console.log(JSON.stringify(r, null, 2)))"
```
Output shows discovered paths (or null) and any warnings.
`server-data/Machine/settings.json` contains updated paths.
Commit: `git commit -m "Task 003: detect-deps.js — tool path discovery"`

### On Failure
```
FAIL: Task 003 — [which detection step failed] — [exact error]
```

---

## Task 004: main.js — wire detectDeps() before spawnServer()
**Status:** [ ] Pending
**Milestone:** M2
**Depends on:** Task 003

### Files touched
- `main.js` — add `shell` to require; add `detectDeps` call in `app.whenReady()`

### What to add
In `main.js`:
1. Add `shell` to the electron require destructure.
2. Add `const { detectDeps } = require('./scripts/detect-deps');`
   after the existing requires.
3. In `app.whenReady().then(async () => { ... })`, before
   `spawnServer()`, add:
   ```js
   const depsResult = await detectDeps(
     path.join(__dirname, 'server-data', 'Machine', 'settings.json')
   );
   if (depsResult.warnings.length > 0) {
     const choice = await dialog.showMessageBox({
       type:    'warning',
       title:   'JuliaLab — Missing Dependencies',
       message: depsResult.warnings.join('\n\n'),
       detail:  'JuliaLab will launch. Install missing tools and restart to enable full functionality.',
       buttons: ['Continue anyway', 'Open install pages'],
     });
     if (choice.response === 1) {
       for (const url of depsResult.installUrls) {
         shell.openExternal(url);
       }
     }
   }
   ```

### Acceptance Criterion
Cold launch logs dependency detection output to terminal.
`server-data/Machine/settings.json` contains discovered tool paths.
No dialog when all tools present.
Commit: `git commit -m "Task 004: wire detectDeps into app startup"`

### On Failure
```
FAIL: Task 004 — [exact error or unexpected behaviour]
```

---

## Task 005: Create scripts/install-extensions.js
**Status:** [ ] Pending
**Milestone:** M3
**Depends on:** Task 004

### Files touched
- `scripts/install-extensions.js` — new file

### What to build
Node.js script that installs all four extensions sequentially:
```
julialang.language-julia
leanprover.lean4
wolfbook.wolfbook
Anthropic.claude-code
```
Using:
```
cmd.exe /c codium.cmd --install-extension <id>
  --extensions-dir server-data/extensions --force
```
Logs `Installing <id>...` → `OK` or `FAILED: <error>` per extension.
Exits 0 if all succeed, exits 1 if any fail.

### Acceptance Criterion
`node scripts/install-extensions.js` exits 0.
All four extension directories present in `server-data/extensions/`.
Commit: `git commit -m "Task 005: install-extensions.js"`

### On Failure
```
FAIL: Task 005 — [which extension failed] — [exact error]
```

---

## Task 006: Run install script + full SC verification
**Status:** [ ] Pending
**Milestone:** M4
**Depends on:** Task 005

### What to do
1. Run: `node scripts/install-extensions.js`
2. Kill any running codium/node processes.
3. Cold launch: `npm start`
4. Verify SC-1 through SC-8 per TEST_PLAN-sprint2.md.

Report:
```
SC-1: PASS/FAIL — <notes>
SC-2: PASS/FAIL — <notes>
SC-3: PASS/FAIL / ADVISORY FAIL — <notes>
SC-4: PASS/FAIL / ADVISORY FAIL — <notes>
SC-5: PASS/FAIL — <notes>
SC-6: PASS/FAIL — <notes>
SC-7: PASS/FAIL — <notes>
SC-8: PASS/FAIL — <notes>
SPRINT 2: PASS / FAIL
```

If PASS (SC-3/SC-4 advisory fail acceptable):
```
git add -A
git commit -m "Sprint 2: extensions, detect-deps, activity bar"
git tag sprint2-complete
```

### On Failure
```
FAIL: Task 006 — [which SC failed] — [exact observation]
```
Do not tag. Escalate.
