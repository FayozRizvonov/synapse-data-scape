#!/usr/bin/env node
const { spawnSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const venvDir = path.join(projectRoot, '.venv');
const pythonExe = path.join(venvDir, 'Scripts', 'python.exe');
const pipExe = path.join(venvDir, 'Scripts', 'pip.exe');

function run(exe, args = [], opts = {}) {
  const res = spawnSync(exe, args, { stdio: 'inherit', shell: false, ...opts });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`${exe} ${args.join(' ')} exited with code ${res.status}`);
}

function ensureVenv() {
  if (!existsSync(pythonExe)) {
    try {
      run('python', ['-m', 'venv', '.venv']);
    } catch (e) {
      // Try Windows launcher as a fallback
      run('py', ['-3', '-m', 'venv', '.venv']);
    }
  }
}

function ensureDeps() {
  const reqs = ['requirements.txt', 'claire-ai-backend/requirements.txt'];
  run(pipExe, ['install', '--upgrade', 'pip', 'wheel', 'setuptools']);
  for (const r of reqs) {
    if (existsSync(path.join(projectRoot, r))) {
      try {
        run(pipExe, ['install', '-r', r, '--disable-pip-version-check']);
      } catch (e) {
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


