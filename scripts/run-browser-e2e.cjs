const { spawnSync } = require('node:child_process');

const isCI = process.env.CI === '1' || process.env.CI === 'true';
const extraArgs = process.argv.slice(2);
const cliPath = (() => {
  try {
    return require.resolve('@playwright/test/cli');
  } catch {
    return null;
  }
})();

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

if (!cliPath) {
  // eslint-disable-next-line no-console
  console.error('Playwright is required for browser journey tests. Install @playwright/test.');
  process.exit(1);
}

const testRun = spawnSync(process.execPath, [cliPath, 'test', '--config=playwright.config.mjs', ...extraArgs], {
  stdio: 'inherit'
});

if (typeof testRun.status === 'number') {
  process.exit(testRun.status);
}

process.exit(1);
