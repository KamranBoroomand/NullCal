import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promises as fs } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

const run = (command, args, cwd) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, CI: '1' },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined);
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} failed with code ${code}: ${stderr}`));
    });
    child.on('error', reject);
  });

test('production build smoke test emits split assets and SPA fallback', async () => {
  await run('npm', ['run', 'build'], repoRoot);

  const distPath = path.resolve(repoRoot, 'dist');
  const assetsPath = path.resolve(distPath, 'assets');
  const [assets, fallbackStat] = await Promise.all([
    fs.readdir(assetsPath),
    fs.stat(path.resolve(distPath, '404.html'))
  ]);

  const jsAssets = assets.filter((name) => name.endsWith('.js'));
  assert.ok(jsAssets.length >= 4, `expected at least 4 JS chunks, got ${jsAssets.length}`);
  assert.equal(fallbackStat.isFile(), true);
});
