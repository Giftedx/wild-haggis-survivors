import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4180',
  },
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 4180 --strictPort',
    port: 4180,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Avoid Windows pipe deadlocks when the preview server is chatty.
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
