#!/usr/bin/env node
/**
 * Start the Celery worker that runs the PyMC5 training pipeline.
 *
 * The worker cannot use .venv — PyMC/pytensor need the conda-forge builds in
 * the `mmm_cl` env.  This resolves that env, checks Redis is up, and exports
 * .env into the worker's environment (src/database/* read os.environ and never
 * call load_dotenv()).
 *
 * Override the env location with MMM_CONDA_PREFIX if it lives somewhere else.
 */
const { spawn, spawnSync } = require('child_process');
const { existsSync } = require('fs');
const net = require('net');
const path = require('path');
const os = require('os');
const { isWindows, readDotEnv } = require('./lib-env.cjs');

const projectRoot = process.cwd();
const ENV_NAME = 'mmm_cl';

/** Path to an executable inside a conda env, per platform. */
function envBin(prefix, name) {
  return isWindows
    ? path.join(prefix, 'Scripts', `${name}.exe`)
    : path.join(prefix, 'bin', name);
}

function resolveCondaEnv() {
  const candidates = [];

  if (process.env.MMM_CONDA_PREFIX) candidates.push(process.env.MMM_CONDA_PREFIX);

  // Ask conda itself where its base lives.
  const info = spawnSync('conda', ['info', '--base'], { encoding: 'utf8', shell: isWindows });
  if (info.status === 0 && info.stdout.trim()) {
    candidates.push(path.join(info.stdout.trim(), 'envs', ENV_NAME));
  }

  // Common install locations, for when conda is not on PATH.
  for (const base of [
    '/opt/homebrew/Caskroom/miniconda/base',
    path.join(os.homedir(), 'miniconda3'),
    path.join(os.homedir(), 'anaconda3'),
    path.join(os.homedir(), 'miniforge3'),
  ]) {
    candidates.push(path.join(base, 'envs', ENV_NAME));
  }

  for (const prefix of candidates) {
    if (prefix && existsSync(envBin(prefix, 'celery'))) return prefix;
  }
  return null;
}

function checkRedis(redisUrl) {
  let host = 'localhost';
  let port = 6379;
  try {
    const u = new URL(redisUrl);
    host = u.hostname || host;
    port = Number(u.port || port);
  } catch {
    /* fall back to defaults */
  }

  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (ok) => {
      socket.destroy();
      resolve({ ok, host, port });
    };
    socket.setTimeout(2000);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

(async function main() {
  const prefix = resolveCondaEnv();
  if (!prefix) {
    console.error(
      `Could not find the '${ENV_NAME}' conda env (looked for its celery binary).\n` +
        `Create it, or set MMM_CONDA_PREFIX to its path.\n` +
        `See CLAUDE.md > Running the Project.`
    );
    process.exit(1);
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/0';
  const redis = await checkRedis(redisUrl);
  if (!redis.ok) {
    console.error(
      `Redis is not reachable at ${redis.host}:${redis.port}.\n` +
        `Start it first:  redis-server --port ${redis.port}\n` +
        `Celery cannot run without its broker.`
    );
    process.exit(1);
  }

  const mmmRoot = path.join(projectRoot, 'mmm_claire');
  const env = {
    ...readDotEnv(path.join(projectRoot, '.env')),
    ...process.env,
    REDIS_URL: redisUrl,
    // The task imports run_mmm_pipeline from the package root.
    PYTHONPATH: [mmmRoot, process.env.PYTHONPATH].filter(Boolean).join(path.delimiter),
  };

  // --pool=solo: the default prefork pool runs tasks in daemonic processes,
  // which cannot spawn children, so PyMC falls back to sequential chains (~3.3x slower).
  const args = [
    '-A', 'src.workers.celery_app', 'worker',
    '--loglevel=info',
    '--pool=solo',
    ...process.argv.slice(2),
  ];

  console.log(`[worker] conda env : ${prefix}`);
  console.log(`[worker] redis     : ${redis.host}:${redis.port}`);

  const child = spawn(envBin(prefix, 'celery'), args, {
    cwd: mmmRoot,
    stdio: 'inherit',
    env,
  });
  child.on('exit', (code, signal) => process.exit(signal ? 1 : code ?? 0));
})();
