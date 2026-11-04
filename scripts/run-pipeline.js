#!/usr/bin/env node

/**
 * Swan Glide Video Pipeline CLI Launcher.
 * Sets necessary shared library paths and invokes TypeScript CLI runner.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Ensure LD_LIBRARY_PATH includes Linux shared libraries
const currentLd = process.env.LD_LIBRARY_PATH || '';
if (!currentLd.includes('/usr/lib/firefox-esr')) {
  process.env.LD_LIBRARY_PATH = `/usr/lib/firefox-esr:${currentLd}`;
}

// Locate local tsx binary or fallback to npx
const localTsx = path.resolve(projectRoot, 'node_modules/.bin/tsx');
const tsxCmd = fs.existsSync(localTsx) ? localTsx : 'npx';
const tsxArgs = fs.existsSync(localTsx)
  ? [path.resolve(projectRoot, 'src/pipeline/cli.ts'), ...process.argv.slice(2)]
  : ['tsx', path.resolve(projectRoot, 'src/pipeline/cli.ts'), ...process.argv.slice(2)];

const child = spawn(tsxCmd, tsxArgs, {
  stdio: 'inherit',
  env: process.env,
  cwd: projectRoot
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error('Failed to start pipeline runner:', err);
  process.exit(1);
});
