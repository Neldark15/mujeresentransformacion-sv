import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8777',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile',  use: { ...devices['Pixel 7'] } }
  ],
  webServer: {
    command: 'python3 -m http.server 8777',
    url: 'http://localhost:8777/index.html',
    reuseExistingServer: true,
    timeout: 30_000
  }
});
