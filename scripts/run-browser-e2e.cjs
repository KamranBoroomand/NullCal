const { spawnSync } = require('node:child_process');

const isCI = process.env.CI === '1' || process.env.CI === 'true';
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const check = spawnSync(process.execPath, ['-e', "require.resolve('@playwright/test')"], {
  stdio: 'ignore'
});

if (check.status !== 0 && !isCI) {
  // Local environments can skip browser journeys when Playwright is unavailable.
  // CI always runs these tests after installing browsers.
  // eslint-disable-next-line no-console
  console.log('Skipping browser journey tests (Playwright not installed locally).');
  process.exit(0);
}

const testRun = spawnSync(command, ['playwright', 'test', '--config=playwright.config.mjs'], {
  stdio: 'inherit'
});

if (typeof testRun.status === 'number') {
  process.exit(testRun.status);
}

process.exit(1);
