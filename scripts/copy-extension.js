// copy-extension.js — copies julialab extension build output to server-data
'use strict';

const fs   = require('fs');
const path = require('path');

const SRC  = path.join(__dirname, '..', 'extensions', 'julialab');
const DEST = path.join(__dirname, '..', 'server-data', 'extensions', 'julialab');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'src') continue;
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

console.log('[copy-extension] copying julialab → server-data/extensions/julialab');
copyDir(SRC, DEST);
console.log('[copy-extension] done.');
