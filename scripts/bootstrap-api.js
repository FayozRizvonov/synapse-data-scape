#!/usr/bin/env node
const { execSync, spawnSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const venvDir = path.join(projectRoot, '.venv');
const pythonExe = path.join(venvDir, 'Scripts', 'python.exe');
const pipExe = path.join(venvDir, 'Scripts', 'pip.exe');

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', ...opts });
}

function ensureVenv() {
  if (!existsSync(pythonExe)) {
    // Create venv using system python
    run('python -m venv .venv');
  }
}

function ensureDeps() {
  const reqs = [
    'requirements.txt',
    'claire-ai-backend/requirements.txt'
  ];
  // Install/upgrade core tools first
  run(`${pipExe} install --upgrade pip wheel setuptools`);
  // Install requirements files (best-effort)
  for (const r of reqs) {
    if (existsSync(path.join(projectRoot, r))) {
      try {
        run(`${pipExe} install -r ${r} --disable-pip-version-check`);
      } catch (e) {
        // Continue even if one file fails
        console.warn(`Warning: failed installing ${r}:`, e?.message || e);
      }
    }
  }
}

(function main() {
  try {
    ensureVenv();
    ensureDeps();
    console.log('bootstrap:api complete');
  } catch (e) {
    console.error('bootstrap:api failed:', e?.message || e);
    process.exit(1);
  }
})();



