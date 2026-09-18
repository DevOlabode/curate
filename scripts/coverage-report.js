#!/usr/bin/env node
/**
 * Run the Node test runner with built-in coverage and persist the report.
 *
 * Uses `node --test --experimental-test-coverage` (no extra coverage
 * dependency). Exit status follows the tests themselves — this script
 * does not enforce a coverage threshold.
 *
 * Named coverage-report.js on purpose: Node's default test globs include
 * test-*.js, so a file called test-coverage.js would be picked up as a test.
 *
 * Writes the full runner output (including the per-file table) to
 * coverage/coverage.txt so CI can upload it as an artifact.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'coverage');
const OUT_FILE = path.join(OUT_DIR, 'coverage.txt');

fs.mkdirSync(OUT_DIR, { recursive: true });

const chunks = [];
const child = spawn(
  process.execPath,
  ['--test', '--experimental-test-coverage', '--test-reporter=spec'],
  {
    cwd: ROOT,
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
  }
);

function forward(stream, dest) {
  stream.on('data', (chunk) => {
    chunks.push(chunk);
    dest.write(chunk);
  });
}

forward(child.stdout, process.stdout);
forward(child.stderr, process.stderr);

child.on('error', (err) => {
  console.error(err);
  process.exit(1);
});

child.on('close', (code, signal) => {
  fs.writeFileSync(OUT_FILE, Buffer.concat(chunks));
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
