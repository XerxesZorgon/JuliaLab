# Software Design Document — Sprint 2
**Project:** JuliaLabApp
**Version:** 0.2
**Date:** 2026-06-23

---

## 1. Architecture Changes from Sprint 1

Sprint 2 adds two scripts and modifies three existing files:

```
JuliaLabApp/
├── main.js                          (CHANGED — call detectDeps() before spawnServer())
├── server-data/
│   └── Machine/
│       └── settings.json            (CHANGED — re-enable activity bar; paths written by detect-deps)
└── scripts/
    ├── detect-deps.js               (NEW — discovers tool paths, updates settings.json, warns if missing)
    └── install-extensions.js        (NEW — one-time setup: installs four extensions via codium CLI)
```

The Electron main process change is minimal: one `require` and one
`await detectDeps()` call before `spawnServer()`.

---

## 2. detect-deps.js Design

### 2.1 Detection strategy per tool

**Julia:**
```
1. Run: juliaup which release  (stdout = full path to julia.exe)
2. If juliaup not found, check: %LOCALAPPDATA%\juliaup\bin\juliaup.exe
3. If still not found, check PATH for julia.exe
4. Record: juliaPath (string | null)
```

**Wolfram Engine:**
```
1. Query registry: HKLM\SOFTWARE\Wolfram Research\Installations
   (each subkey has an "ExecutablePath" or "MathKernel" value)
2. If registry fails, check common paths:
   C:\Program Files\Wolfram Research\Wolfram Engine\*\WolframKernel.exe
   C:\Program Files\Wolfram Research\Mathematica\*\WolframKernel.exe
3. If still not found, check PATH for WolframKernel
4. Record: wolframKernelPath (string | null)
```

**elan / Lean4:**
```
1. Run: elan which leanprover/lean4:stable  (stdout = path to lean)
2. If elan not found, check: %USERPROFILE%\.elan\bin\elan.exe
3. If still not found, check PATH for lean
4. Record: leanPath (string | null)
```

### 2.2 Output — settings.json patch

After detection, `detect-deps.js` reads the current
`server-data/Machine/settings.json`, merges in the discovered paths,
and writes it back. Only non-null paths are written.

```js
// Paths written if discovered:
{
  "workbench.statusBar.visible": true,
  // julia-vscode reads this setting:
  "julia.executablePath": "<juliaPath>",
  // wolfbook reads this setting:
  "wolfbook.wolframExecutablePath": "<wolframKernelPath>",
  // lean4 reads this setting:
  "lean4.toolchainPath": "<leanPath>"
}
```

### 2.3 Missing dependency dialog

If any tool is not found, `detect-deps.js` returns a warnings array.
`main.js` shows one consolidated dialog after detection, before the
server spawns:

```
JuliaLab — Missing Dependencies

The following tools were not found and some features will be unavailable:

• Julia — required for Julia REPL and language support
  Install: https://julialang.org/downloads/ (use juliaup)

• Wolfram Engine — required for Wolfbook notebooks
  Install: https://www.wolfram.com/engine/ (free personal license)

These tools can be installed at any time. JuliaLab will detect them
automatically on next launch.

[Continue anyway]  [Open install pages]
```

"Open install pages" opens each URL in the default browser.
"Continue anyway" proceeds to launch.
VSCodium missing is a hard failure (no dialog — error box and exit).

### 2.4 detect-deps.js module interface

```js
// scripts/detect-deps.js
// Returns: Promise<{ settings: object, warnings: string[], installUrls: string[] }>

async function detectDeps(settingsPath) { ... }
module.exports = { detectDeps };
```

Called from `main.js`:
```js
const { detectDeps } = require('./scripts/detect-deps');

app.whenReady().then(async () => {
  const { settings, warnings, installUrls } = await detectDeps(
    path.join(__dirname, 'server-data', 'Machine', 'settings.json')
  );
  if (warnings.length > 0) {
    // show consolidated dialog
  }
  // then spawnServer() → waitForReady() → createWindow()
});
```

---

## 3. install-extensions.js Design

```js
// scripts/install-extensions.js
// Run once: node scripts/install-extensions.js
// Installs four extensions into server-data/extensions/ via codium CLI.

const EXTENSIONS = [
  'julialang.language-julia',
  'leanprover.lean4',
  'wolfbook.wolfbook',
  'Anthropic.claude-code',
];

const CODIUM_CMD    = 'C:\\Program Files\\VSCodium\\bin\\codium.cmd';
const EXTENSIONS_DIR = path.join(__dirname, '..', 'server-data', 'extensions');

// For each extension, run sequentially:
// cmd.exe /c codium.cmd --install-extension <id>
//   --extensions-dir <EXTENSIONS_DIR> --force
// Log: "Installing <id>..." → "OK" or "FAILED: <error>"
// Exit 0 if all succeed, exit 1 if any fail.
```

Sequential (not parallel) to avoid extension registry conflicts.
`--force` makes the script idempotent.

---

## 4. main.js Changes (Task 004)

Add to `app.whenReady()` before `spawnServer()`:

```js
const { detectDeps } = require('./scripts/detect-deps');

// In app.whenReady():
const depsResult = await detectDeps(
  path.join(__dirname, 'server-data', 'Machine', 'settings.json')
);

if (depsResult.warnings.length > 0) {
  const buttons = ['Continue anyway', 'Open install pages'];
  const choice = await dialog.showMessageBox({
    type:    'warning',
    title:   'JuliaLab — Missing Dependencies',
    message: 'Some tools were not found:\n\n' + depsResult.warnings.join('\n'),
    detail:  'JuliaLab will launch. Install missing tools and restart.',
    buttons,
  });
  if (choice.response === 1) {
    depsResult.installUrls.forEach(url => shell.openExternal(url));
  }
}
// then: spawnServer() → waitForReady() → createWindow()
```

Add `shell` to the Electron require: `const { app, ..., shell } = require('electron')`.

---

## 5. Open Design Questions

| # | Question | Resolution path |
|---|---|---|
| DQ-1 | Does `codium serve-web` auto-load from `server-data/extensions/` when `--server-data-dir` is set? | Task 001 spike |
| DQ-2 | Which registry key does Wolfram Engine use on this machine? | Task 003 implementation + SC-4 verification |
| DQ-3 | Does `juliaup which release` work from within Electron's child_process? | Task 003 implementation + SC-6 verification |
| DQ-4 | Does Claude Code browser auth work in the WebContentsView context? | SC-5 verification in Task 006 |
| DQ-5 | Which settings key does wolfbook use for the kernel path? | Check wolfbook extension docs/source before Task 003 |
