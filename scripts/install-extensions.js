// scripts/install-extensions.js — JuliaLabApp Sprint 2
// One-time setup: installs four extensions into server-data/extensions/
// Run: node scripts/install-extensions.js

'use strict';

const { spawn } = require('child_process');
const path      = require('path');

const CODIUM_CMD     = 'C:\\Program Files\\VSCodium\\bin\\codium.cmd';
const EXTENSIONS_DIR = path.join(__dirname, '..', 'server-data', 'extensions');

const EXTENSIONS = [
  'julialang.language-julia',
  'leanprover.lean4',
  'wolfbook.wolfbook',
  'Anthropic.claude-code',
];

function installExtension(id) {
  return new Promise((resolve, reject) => {
    console.log(`Installing ${id}...`);
    const proc = spawn('cmd.exe', [
      '/c', CODIUM_CMD,
      '--install-extension', id,
      '--extensions-dir', EXTENSIONS_DIR,
      '--force',
    ], { stdio: 'inherit', shell: false });

    proc.on('exit', code => {
      if (code === 0) {
        console.log(`OK: ${id}`);
        resolve();
      } else {
        console.error(`FAILED: ${id} (exit code ${code})`);
        reject(new Error(`${id} failed with exit code ${code}`));
      }
    });
    proc.on('error', err => {
      console.error(`FAILED: ${id} — ${err.message}`);
      reject(err);
    });
  });
}

async function main() {
  console.log('JuliaLabApp — Installing extensions into', EXTENSIONS_DIR);
  console.log('');
  for (const id of EXTENSIONS) {
    await installExtension(id);
  }
  console.log('');
  console.log('All extensions installed successfully.');
}

main().catch(err => {
  console.error('Extension install failed:', err.message);
  process.exit(1);
});
