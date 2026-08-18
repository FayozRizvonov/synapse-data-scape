#!/usr/bin/env node
const { spawnSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');
const { isWindows, venvPython } = require('./lib-env.cjs');

const projectRoot = process.cwd();
const pythonExe = venvPython(projectRoot);

function run(exe, args = [], opts = {}) {
  const res = spawnSync(exe, args, { stdio: 'inherit', shell: false, ...opts });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`${exe} ${args.join(' ')} exited with code ${res.status}`);
}

function ensureVenv() {
  if (existsSync(pythonExe)) return;

  // `python` is not always on PATH outside Windows; try the usual names in order.
  const candidates = isWindows
    ? [['py', ['-3', '-m', 'venv', '.venv']], ['python', ['-m', 'venv', '.venv']]]
    : [['python3', ['-m', 'venv', '.venv']], ['python', ['-m', 'venv', '.venv']]];

  let lastError;
  for (const [exe, args] of candidates) {
    try {
      run(exe, args);
      return;
    } catch (e) {
      lastError = e;
    }
  }
  throw new Error(
    `could not create .venv (tried: ${candidates.map(([e]) => e).join(', ')}). ` +
      `Last error: ${lastError?.message || lastError}`
  );
}

function ensureDeps() {
  // Use `python -m pip` rather than the pip executable — one less
  // platform-specific path to get wrong.
  run(pythonExe, ['-m', 'pip', 'install', '--upgrade', 'pip', 'wheel', 'setuptools']);

  for (const r of ['requirements.txt', 'claire-ai-backend/requirements.txt']) {
    if (existsSync(path.join(projectRoot, r))) {
      try {
        run(pythonExe, ['-m', 'pip', 'install', '-r', r, '--disable-pip-version-check']);
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
