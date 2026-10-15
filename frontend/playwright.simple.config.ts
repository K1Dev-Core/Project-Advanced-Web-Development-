import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './simple-e2e',
  testIgnore: '**/*.live.spec.ts',
  outputDir: 'test-results-simple',
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:4200',
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm start',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 60000,
  },
  reporter: [['list']],
});
