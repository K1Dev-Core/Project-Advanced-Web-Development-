import { defineConfig } from '@playwright/test';
import base from './playwright.simple.config';
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: '**/*.live.spec.ts',
  outputDir: 'test-results-simple-live',
  workers: 1,
  timeout: 120000,
  use: { ...base.use, baseURL: 'http://127.0.0.1:4201', actionTimeout: 15000, trace: 'off' },
  webServer: {
    command: 'npm run start:local',
    url: 'http://127.0.0.1:4201',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
