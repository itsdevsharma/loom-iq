import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1,
  reporter: 'list', use: { baseURL: 'http://127.0.0.1:3101', trace: 'retain-on-failure' },
  webServer: { command: 'node e2e/server.cjs', url: 'http://127.0.0.1:3101/health', reuseExistingServer: false, timeout: 30000 },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }, { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
});
