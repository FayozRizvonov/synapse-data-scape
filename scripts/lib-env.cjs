'use strict';
/**
 * Shared helpers for the dev scripts.
 *
 * The venv layout differs by platform — Scripts/python.exe on Windows,
 * bin/python everywhere else — so nothing here may hardcode either.
 */
const path = require('path');
const fs = require('fs');

const isWindows = process.platform === 'win32';

/** Absolute path to the .venv interpreter for this platform. */
function venvPython(projectRoot) {
  return isWindows
    ? path.join(projectRoot, '.venv', 'Scripts', 'python.exe')
    : path.join(projectRoot, '.venv', 'bin', 'python');
}

/**
 * Parse a .env file into a plain object.
 *
 * mmm_claire/src/database/* read os.environ directly and never call
 * load_dotenv(), so the worker only sees these if we pass them through.
 */
function readDotEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;

  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    if (!key) continue;

    let value = line.slice(eq + 1).trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted && value.length >= 2) value = value.slice(1, -1);

    out[key] = value;
  }
  return out;
}

module.exports = { isWindows, venvPython, readDotEnv };
