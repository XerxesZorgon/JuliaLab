// scripts/detect-deps.js — JuliaLabApp Sprint 2
// Detects Julia, Lean4, and Wolfram Engine paths at launch.
// Returns: Promise<{ settings: object, warnings: string[], installUrls: string[] }>

'use strict';

const { execFile, exec } = require('child_process');
const { promisify }       = require('util');
const fs                  = require('fs');
const path                = require('path');
const os                  = require('os');

const execFileP = promisify(execFile);
const execP     = promisify(exec);

// Install URLs shown in missing-dependency dialog
const INSTALL_URLS = {
  julia:   'https://julialang.org/downloads/',
  wolfram: 'https://www.wolfram.com/engine/',
  lean4:   'https://lean-lang.org/install/',
};

// ── Julia detection ────────────────────────────────────────────────────────────

async function detectJulia() {
  // 1. Try juliaup which release
  const juliaupPaths = [
    path.join(os.homedir(), 'AppData', 'Local', 'juliaup', 'bin', 'juliaup.exe'),
    'juliaup',
  ];
  for (const juliaup of juliaupPaths) {
    try {
      const { stdout } = await execFileP(juliaup, ['which', 'release']);
      const p = stdout.trim();
      if (p && fs.existsSync(p)) { console.log('[detect-deps] Julia:', p); return p; }
    } catch { /* try next */ }
  }
  // 2. Try julia on PATH
  try {
    const { stdout } = await execP('where julia');
    const p = stdout.trim().split('\n')[0].trim();
    if (p && fs.existsSync(p)) { console.log('[detect-deps] Julia (PATH):', p); return p; }
  } catch { /* not found */ }
  console.log('[detect-deps] Julia: NOT FOUND');
  return null;
}

// ── Wolfram Engine detection ───────────────────────────────────────────────────

async function detectWolfram() {
  function toKernel(p) {
    // Replace any executable name with WolframKernel.exe
    const kernel = path.join(path.dirname(p), 'WolframKernel.exe');
    return fs.existsSync(kernel) ? kernel : null;
  }

  // 1. Try Windows registry
  try {
    const { stdout } = await execP(
      'reg query "HKLM\\SOFTWARE\\Wolfram Research\\Installations" /s /v ExecutablePath'
    );
    const match = stdout.match(/ExecutablePath\s+REG_SZ\s+(.+)/);
    if (match) {
      const k = toKernel(match[1].trim());
      if (k) { console.log('[detect-deps] Wolfram:', k); return k; }
    }
  } catch { /* registry not found */ }
  // 2. Try common install paths
  const base = 'C:\\Program Files\\Wolfram Research';
  for (const product of ['Wolfram Engine', 'Mathematica']) {
    const productDir = path.join(base, product);
    if (fs.existsSync(productDir)) {
      const versions = fs.readdirSync(productDir).sort().reverse();
      for (const v of versions) {
        const kernel = path.join(productDir, v, 'WolframKernel.exe');
        if (fs.existsSync(kernel)) { console.log('[detect-deps] Wolfram:', kernel); return kernel; }
      }
    }
  }
  // 3. Try PATH
  try {
    const { stdout } = await execP('where WolframKernel');
    const p = stdout.trim().split('\n')[0].trim();
    if (p && fs.existsSync(p)) { console.log('[detect-deps] Wolfram (PATH):', p); return p; }
  } catch { /* not found */ }
  console.log('[detect-deps] Wolfram: NOT FOUND');
  return null;
}

// ── Lean4 / elan detection ────────────────────────────────────────────────────

async function detectLean4() {
  // 1. Check %USERPROFILE%\.elan\toolchains\ directly — elan may not be on PATH
  const toolchainsDir = path.join(os.homedir(), '.elan', 'toolchains');
  if (fs.existsSync(toolchainsDir)) {
    // Prefer stable, then any leanprover--lean4 toolchain
    const preferred = path.join(toolchainsDir, 'leanprover--lean4---stable');
    if (fs.existsSync(preferred)) {
      console.log('[detect-deps] Lean4 toolchain:', preferred);
      return preferred;
    }
    const entries = fs.readdirSync(toolchainsDir)
      .filter(d => d.startsWith('leanprover--lean4'))
      .sort().reverse();
    if (entries.length > 0) {
      const p = path.join(toolchainsDir, entries[0]);
      console.log('[detect-deps] Lean4 toolchain:', p);
      return p;
    }
  }
  // 2. Try elan binary directly
  const elanBin = path.join(os.homedir(), '.elan', 'bin', 'elan.exe');
  if (fs.existsSync(elanBin)) {
    try {
      const { stdout } = await execFileP(elanBin, ['toolchain', 'list']);
      const lines = stdout.trim().split('\n');
      const active = lines.find(l => l.includes('(default)') || l.includes('(override)'))
                  || lines[0];
      if (active) {
        const name = active.replace(/\s*\(.*\)/, '').trim();
        const p = path.join(os.homedir(), '.elan', 'toolchains', name);
        if (fs.existsSync(p)) { console.log('[detect-deps] Lean4 toolchain:', p); return p; }
      }
    } catch { /* fall through */ }
  }
  // 3. Try lean on PATH
  try {
    const { stdout } = await execP('where lean');
    const p = stdout.trim().split('\n')[0].trim();
    if (p && fs.existsSync(p)) {
      console.log('[detect-deps] Lean4 (PATH):', p);
      return path.dirname(path.dirname(p));
    }
  } catch { /* not found */ }
  console.log('[detect-deps] Lean4: NOT FOUND');
  return null;
}

// ── Main export ───────────────────────────────────────────────────────────────

async function detectDeps(settingsPath) {
  console.log('[detect-deps] Starting dependency detection...');

  const [juliaPath, wolframPath, lean4Path] = await Promise.all([
    detectJulia(),
    detectWolfram(),
    detectLean4(),
  ]);

  // Read existing settings
  let settings = {};
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch { /* start fresh */ }

  // Write discovered paths into settings
  if (juliaPath)   settings['julia.executablePath']      = juliaPath;
  if (lean4Path)   settings['lean4.toolchainPath']       = lean4Path;
  if (wolframPath) settings['wolfbook.wolframKernelPath'] = wolframPath;

  // Always keep status bar enabled
  settings['workbench.statusBar.visible'] = true;

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log('[detect-deps] Settings written to', settingsPath);

  // Build warnings for missing tools
  const warnings    = [];
  const installUrls = [];

  if (!juliaPath) {
    warnings.push('• Julia — required for Julia REPL and language support\n  Install via juliaup: ' + INSTALL_URLS.julia);
    installUrls.push(INSTALL_URLS.julia);
  }
  if (!wolframPath) {
    warnings.push('• Wolfram Engine — required for Wolfbook notebooks\n  Free personal license: ' + INSTALL_URLS.wolfram);
    installUrls.push(INSTALL_URLS.wolfram);
  }
  if (!lean4Path) {
    warnings.push('• Lean4/elan — required for Lean4 language support\n  Install: ' + INSTALL_URLS.lean4);
    installUrls.push(INSTALL_URLS.lean4);
  }

  console.log('[detect-deps] Done.', warnings.length === 0 ? 'All tools found.' : `Missing: ${warnings.length} tool(s).`);
  return { settings, warnings, installUrls };
}

module.exports = { detectDeps };
