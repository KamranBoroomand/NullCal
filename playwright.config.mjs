import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);
const E2E_PORT = Number(process.env.NULLCAL_E2E_PORT ?? 4273);
const E2E_BASE_URL = `http://127.0.0.1:${E2E_PORT}`;

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
    baseURL: E2E_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off'
  },
  outputDir: 'output/playwright/test-results',
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${E2E_PORT}`,
    url: E2E_BASE_URL,
    reuseExistingServer: false,
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
