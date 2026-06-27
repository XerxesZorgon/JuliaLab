# tasks — Sprint 5
**Project:** JuliaLabApp
**Started:** 2026-06-27
**Prior tag:** `sprint4-complete`
**Target tag:** `sprint5-complete`

Legend: `[ ]` pending · `[~]` in progress · `[x]` done · `[!]` blocked · `[⚠️]` partial

---

## Milestone M0 — Regression check (gates all M1 work)

Run TC-R1 through TC-R5 (TEST_PLAN-sprint5 §regression suite) on `sprint4-complete`
HEAD before any Sprint 5 code change. All must pass. If any fail, diagnose in
this planning thread before proceeding.

**Exit criterion:** John confirms all 5 regressions pass.

---

## Milestone M1 — Spikes (all must complete before M2)

---

### [ ] T-spike-A-1 — Add `--cli-data-dir` to `spawnServer` (main.js)
**Milestone:** M1
**Depends on:** M0 regression check passes

**What to do:**
In `main.js`, add `'--cli-data-dir', SERVER_DATA_DIR,` to the args array in
`spawnServer()`, immediately after the `'--server-data-dir', SERVER_DATA_DIR,`
pair (line ~66). This is a temporary spike modification; it will be reverted in
T-spike-A-revert.

**Files touched:**
- `main.js` — add 2 lines to `spawn` args array in `spawnServer()`

**Acceptance criterion:**
Diff shows exactly two new lines added (`'--cli-data-dir',` and
`SERVER_DATA_DIR,`) in the correct position inside the `spawn` args array. No
other lines changed. `npm start` launches successfully (stdout shows
`Web UI available at`).

**On failure:**
Report: which lines were changed, exact error if `npm start` fails. Do not
attempt a fix. Escalate to planning thread.

**⚠️ MANUAL GATE follows this task:**
After Antigravity confirms acceptance, John runs TC-A2 (TEST_PLAN §Spike A):
1. `npm start`; wait for workbench.
2. If trust dialog appears, click "Yes, I trust the authors."
3. Clean-quit (✕). Run process check.
4. `npm start` again. Note whether trust dialog reappears.
5. Clean-quit.
6. Report result (trust persists or not) to planning thread.

Do not begin T-spike-A-2 until John reports TC-A2 result.

---

### [ ] T-spike-A-2 — Inspect server-data for new state files (read-only)
**Milestone:** M1
**Depends on:** T-spike-A-1 accepted; TC-A2 (manual) reported by John

**What to do:**
Run a PowerShell command to list all files under `server-data/` that were
created or modified after T-spike-A-1 was applied. Report the full listing with
paths, sizes, and modification timestamps.

```powershell
$cutoff = [datetime]::ParseExact('YYYY-MM-DD HH:MM', 'yyyy-MM-dd HH:mm', $null)
Get-ChildItem -Recurse -File 'C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp\server-data' |
  Where-Object { $_.LastWriteTime -gt $cutoff } |
  Select-Object FullName, Length, LastWriteTime |
  Format-Table -Wrap
```

*(Antigravity fills in the actual cutoff timestamp from when T-spike-A-1 was
applied before running.)*

**Files touched:** None (read-only inspection)

**Acceptance criterion:**
A timestamped file listing is produced and reported. Any `.vscdb`, `trust.json`,
`state.json`, or similar file names are highlighted. An empty listing (no new
files) is a valid result.

**On failure:**
Report: PowerShell error text. Do not fix. Escalate.

---

### [ ] T-spike-A-revert — Remove `--cli-data-dir` from main.js
**Milestone:** M1
**Depends on:** T-spike-A-2 accepted; ADR-017 outcome section filled

**What to do:**
Remove the two lines added by T-spike-A-1 from `main.js::spawnServer()`. The
result must match the `sprint4-complete` snapshot for that function.

**Files touched:**
- `main.js` — remove 2 lines added in T-spike-A-1

**Acceptance criterion:**
Diff shows exactly two lines removed — the same lines added in T-spike-A-1. No
other changes. `git diff HEAD -- main.js` shows no remaining delta from
`sprint4-complete` in `spawnServer`.

**On failure:**
Report: exact diff. Do not attempt a fix. Escalate.

**DO NOT COMMIT this task.** The revert restores the prior state; there is
nothing to commit unless ADR-017 decides to adopt the flag permanently (in which
case a separate explicit task is written).

---

### [ ] T-spike-B-pre — Pre-test globalStorage baseline (read-only)
**Milestone:** M1
**Depends on:** M0 regression check passes

**What to do:**
List `server-data/data/User/globalStorage/julialang.language-julia/` recursively
with full paths, file sizes, and modification timestamps.

```powershell
Get-ChildItem -Recurse -File 'C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp\server-data\data\User\globalStorage\julialang.language-julia' |
  Select-Object FullName, Length, LastWriteTime |
  Format-Table -Wrap
```

**Files touched:** None

**Acceptance criterion:**
Listing produced and reported. The exact output is saved as the baseline for
T-spike-B-post comparison.

**⚠️ MANUAL GATE follows this task:**
After baseline is captured, John runs TC-B2 (TEST_PLAN §Spike B):
1. `npm start`. Wait for julia-vscode to activate.
2. If a telemetry notification appears, click "No" (or equivalent).
3. If no notification appears, note this and continue.
4. Clean-quit (✕).
5. `npm start` again. Check whether the notification reappears.
6. Clean-quit.
7. Report: H2 (stays dismissed) or H1 (reappears) to planning thread.

Do not begin T-spike-B-post until John reports TC-B2 result.

---

### [ ] T-spike-B-post — Post-test globalStorage comparison (read-only)
**Milestone:** M1
**Depends on:** T-spike-B-pre accepted; TC-B2 (manual) reported by John

**What to do:**
Re-run the same listing as T-spike-B-pre and compare to the baseline. Report
any new or modified files.

**Files touched:** None

**Acceptance criterion:**
Delta report produced. If new files appeared, they are listed with full paths and
timestamps. If no files changed, that is reported explicitly. ADR-017 Spike B
finding section is updated by John in this planning thread based on the combined
TC-B2 observation and this file report.

---

### [ ] T-spike-J-1 — Add exports-key log to extension.ts + rebuild
**Milestone:** M1
**Depends on:** M0 regression check passes

**What to do:**
In `extensions/julialab/src/extension.ts`, in the `activate()` function, add
a single `console.log` line immediately after `await ensureJuliaExtension()`:

```typescript
  console.log('[spike-j]', JSON.stringify(Object.keys(
    vscode.extensions.getExtension('julialang.language-julia')?.exports ?? {}
  )));
```

Then run `npm run build:ext` and report the build output.

**Files touched:**
- `extensions/julialab/src/extension.ts` — add 3 lines (one logical statement)

**Acceptance criterion:**
Diff adds exactly 3 lines (the console.log statement) after `await ensureJuliaExtension();`.
`npm run build:ext` exits 0. Build output reported.

**On failure:**
Report: exact diff + build error. Do not fix. Escalate.

**⚠️ MANUAL GATE follows this task:**
John runs TC-J2 (TEST_PLAN §Spike J):
1. `npm start` (or `npm run start:fast`).
2. Open Electron DevTools (Ctrl+Shift+I in the ribbon view) or watch terminal.
3. Find lines starting with `[spike-j]` in the console.
4. Copy and report the full line(s) to the planning thread.

Do not begin T-spike-J-revert until John reports TC-J2 output.

---

### [ ] T-spike-J-revert — Remove exports-key log from extension.ts
**Milestone:** M1
**Depends on:** T-spike-J-1 accepted; TC-J2 (manual) reported by John

**What to do:**
Remove the 3 lines added by T-spike-J-1 from `extension.ts::activate()`. Run
`npm run build:ext`. The result must match the `sprint4-complete` snapshot for
`activate()`.

**Files touched:**
- `extensions/julialab/src/extension.ts` — remove 3 lines added in T-spike-J-1

**Acceptance criterion:**
Diff shows exactly 3 lines removed. `npm run build:ext` exits 0.
`git diff HEAD -- extensions/julialab/src/extension.ts` shows no remaining
delta from `sprint4-complete` in `activate()`.

**On failure:**
Report: exact diff + build error. Do not fix. Escalate.

**⚠️ After this task:** John and this planning thread interpret the TC-J2 output
and decide: Path A (probe implementation, write T-KI3) or Path B (delay retained,
close KI-3, update ADR-019). T-KI3 is not written until this decision is made.

---

## Milestone M2 — Fixes and Chore (gated on M1 complete)

*M2 tasks may begin in parallel with late M1 tasks, subject to the dependency
rules below. T-KI5 and T-KI2 have no dependency on spike outcomes; T-KI3 is
gated on Spike J (T-spike-J-revert + path decision).*

---

### [ ] T-KI5 — Add GitHub remote
**Milestone:** M2
**Depends on:** M0 regression check passes; John creates GitHub repo and provides URL

**Prerequisite (John action before task starts):**
1. Create the GitHub repository at `github.com/<owner>/JuliaLabApp` (or
   equivalent). Set visibility as desired.
2. Provide the HTTPS or SSH remote URL to this planning thread.
3. Confirm the repo is empty (no initial commit) — the local history is complete.

**What to do:**
From the project root, run:

```powershell
cd 'C:\Users\johnx\Documents\WildPeaches\Projects\JuliaLab\JuliaLabApp'
git remote add origin <URL>          # John supplies URL
git push --set-upstream origin main
git push --tags
```

Report the output of each command.

**Files touched:** None (git config only)

**Acceptance criterion (TC-KI5):**
```powershell
git remote -v
git push --dry-run origin main
```
`git remote -v` shows `origin` with the correct URL.
`git push --dry-run` exits 0 with "Everything up-to-date" or equivalent.
SC-5 passes.

**On failure:**
Report: exact command output. Do not fix. Escalate.

**Commit:** None (git config change; tags already pushed).

---

### [ ] T-KI2 — Remove debounce from resize event handler (main.js)
**Milestone:** M2
**Depends on:** M0 regression check passes

**What to do:**
In `main.js`, replace:
```javascript
state.win.on('resize', debounce(setViewBounds, 16));
```
with:
```javascript
state.win.on('resize', setViewBounds);
```

Also remove the `debounce` function definition (lines ~75-78) since it will be
unused. If `debounce` is referenced anywhere else in the file, retain it (check
before removing).

**Files touched:**
- `main.js` — one line changed in the resize handler; `debounce` function
  removed if unused

**Show diff before applying.**

**Acceptance criterion:**
Diff shows: (1) the resize handler line changed to `state.win.on('resize', setViewBounds)`,
and (2) the `debounce` helper function removed (if unused). No other changes.
`npm start` launches successfully.
John runs TC-KI2 (TEST_PLAN §KI-2) and TC-KI2-reg, reports Pass or ⚠️.

**On failure (build/launch):**
Report: exact error. Do not fix. Escalate.

**Commit (if John reports Pass or ⚠️ with H2 note):**
```
T-KI2: remove resize debounce; immediate setViewBounds (ADR-018, KI-2)
```
SC-1 verdict recorded in ADR-018 outcome section.

---

### [ ] T-KI3 — Replace REPL delay with readiness probe (extension.ts)
**Milestone:** M2
**Depends on:** T-spike-J-revert complete; Path A decision confirmed by John

**⚠️ CONDITIONAL:** This task is only written and executed if Spike J finds a
ready signal in `juliaExt.exports` (Path A). If Path B is chosen, this task is
struck and replaced with a planning-thread note updating ADR-019 §Outcome and
marking KI-3 closed.

**What to do (Path A only):**
In `extensions/julialab/src/extension.ts::activate()`, replace:
```typescript
  await new Promise(resolve => setTimeout(resolve, 2000));
```
with the appropriate readiness probe based on the exports API found in Spike J.
The exact replacement is determined from the TC-J2 output and posted to the
planning thread before this task is written.

Wrap the probe in a try/catch with a 2000 ms fallback:
```typescript
  try {
    // [readiness probe — exact form TBD after Spike J]
  } catch (err) {
    console.warn('[julialab] readiness probe failed, falling back to delay:', err);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
```

Then run `npm run build:ext`.

**Files touched:**
- `extensions/julialab/src/extension.ts` — one logical block changed

**Acceptance criterion:**
Diff shows the `setTimeout(resolve, 2000)` line replaced with the readiness probe
(plus fallback). `npm run build:ext` exits 0. John runs TC-KI3 (3 cold launches,
no crash-reporter). SC-2(a) passes.

**On failure:**
Report: exact diff + build error OR crash-reporter details. Do not fix. Escalate.

**Commit (if TC-KI3 passes):**
```
T-KI3: replace 2000ms REPL delay with juliaExt readiness probe (ADR-019, KI-3)
```

---

## Sprint Close

When all tasks in M1 and M2 are `[x]` (or `[⚠️]` with rationale):

1. Update ADR-017, ADR-018, ADR-019 outcome sections.
2. Run full regression suite (R-1 through R-5) on final HEAD.
3. Commit any open docs changes.
4. Tag: `git tag sprint5-complete && git push origin sprint5-complete`
5. Write HANDOFF-sprint6.md in `docs/Sprint 5/`.

---

## Antigravity Standing Rules (Sprint 5 additions)

Per `.antigravity/rules.md` (existing):
> Never quit JuliaLab with `taskkill /IM electron.exe` during verification.
> Always use the window ✕ control.

**Sprint 5 additions (append to `.antigravity/rules.md` as a separate task if
desired, or treat as active for this sprint):**
- All spike modifications (T-spike-A-1, T-spike-J-1) are followed by explicit
  revert tasks. Never commit spike modifications.
- The scope of a PowerShell file inspection is exactly the path specified. Do not
  recurse into `node_modules/` or `.git/`.
- Read-only tasks (T-spike-A-2, T-spike-B-pre/post) produce no code changes and
  no commits. Report only.

---

## Definition of Done

SC-1 ✅ or ⚠️ with rationale
SC-2 ✅ (path A or B)
SC-3 ✅ (ADR-017 outcome filled)
SC-4 ✅ (finding recorded)
SC-5 ✅
Regressions R-1 through R-5 ✅
Tag: `sprint5-complete`
