import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'tests/e2e/browser',
  timeout: 90_000,
  expect: {
    timeout: 10_000
  },
  reporter: isCI ? [['list'], ['github']] : [['list']],
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  outputDir: 'output/playwright/test-results',
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !isCI,
    timeout: 120_000
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ]
});
