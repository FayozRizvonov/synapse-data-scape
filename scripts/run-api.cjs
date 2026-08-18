#!/usr/bin/env node
/**
 * Start the FastAPI backend using the .venv interpreter for this platform.
 *
 * Exists because an npm script cannot express both .venv\Scripts\python.exe
 * and .venv/bin/python.  Extra args are forwarded to uvicorn, e.g.
 *   npm run api -- --reload
 */
const { spawn } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');
const { venvPython, readDotEnv } = require('./lib-env.cjs');

const projectRoot = process.cwd();
const pythonExe = venvPython(projectRoot);

if (!existsSync(pythonExe)) {
  console.error(`No virtualenv interpreter at ${pythonExe}\nRun: npm run bootstrap:api`);
  process.exit(1);
}

const env = {
  ...readDotEnv(path.join(projectRoot, '.env')),
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379/0',
  ...process.env, // a real environment variable always wins over .env
};

const args = [
  '-m', 'uvicorn', 'claire_ai_api:app',
  '--host', '0.0.0.0',
  '--port', process.env.PORT || '8000',
  ...process.argv.slice(2),
];

const child = spawn(pythonExe, args, { stdio: 'inherit', env });
child.on('exit', (code, signal) => process.exit(signal ? 1 : code ?? 0));
