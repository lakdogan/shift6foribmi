#!/usr/bin/env node
/**
 * Lightweight pre-commit guard: runs typecheck without emitting build output.
 * Skip with SKIP_SHIFT6_PRECOMMIT=1 if needed.
 */
const { spawnSync } = require('node:child_process');

if (process.env.SKIP_SHIFT6_PRECOMMIT) {
  process.exit(0);
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit' });
  if (res.status !== 0) {
    process.exit(res.status || 1);
  }
}

run('npm', ['run', '--silent', 'typecheck']);
