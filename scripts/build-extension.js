#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { main: generateIcons } = require('./generate-icons');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist/extension');
const SOURCE = path.join(ROOT, 'extension');
const SHARED = path.join(ROOT, 'src/shared');

const EXCLUDE = new Set([
  '.DS_Store',
  '.env',
  '.env.local',
  'node_modules',
]);

function copyEntry(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (EXCLUDE.has(name)) continue;
    copyEntry(path.join(src, name), path.join(dest, name));
  }
}

function validateManifest(dir) {
  const manifestPath = path.join(dir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  if (manifest.manifest_version !== 3) {
    throw new Error('manifest_version must be 3');
  }

  const required = ['name', 'version', 'action', 'background', 'permissions'];
  required.forEach((key) => {
    if (!(key in manifest)) {
      throw new Error(`manifest.json missing required key: ${key}`);
    }
  });

  for (const size of ['16', '32', '48', '128']) {
    const iconPath = path.join(dir, manifest.icons[size]);
    if (!fs.existsSync(iconPath)) {
      throw new Error(`Missing icon file: ${manifest.icons[size]}`);
    }
  }

  console.log('[build:extension] manifest.json validated');
}

function main() {
  console.log('[build:extension] generating icons…');
  generateIcons();

  console.log('[build:extension] cleaning dist/extension…');
  fs.rmSync(OUT, { recursive: true, force: true });

  console.log('[build:extension] copying extension sources…');
  copyDir(SOURCE, OUT);

  console.log('[build:extension] copying shared modules…');
  copyDir(SHARED, path.join(OUT, 'shared'));

  const logoSrc = path.join(ROOT, 'public/images/download.svg');
  const logoDest = path.join(OUT, 'assets/logo.svg');
  fs.mkdirSync(path.dirname(logoDest), { recursive: true });
  fs.copyFileSync(logoSrc, logoDest);
  console.log('[build:extension] copied assets/logo.svg');

  validateManifest(OUT);

  console.log(`[build:extension] done → ${OUT}`);
}

main();
