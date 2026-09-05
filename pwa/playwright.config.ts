import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. Builds and serves the app, emulates a mobile viewport and allows
 * autoplay so the practice flow runs without a user gesture.
 */
// Puerto del servidor de pruebas. Configurable para no chocar con otro `ng serve`
// que ya esté en el 4200: Playwright reutilizaría ese y probaría otra app.
const PORT = Number(process.env['E2E_PORT'] ?? 4200);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
        launchOptions: {
          args: ['--autoplay-policy=no-user-gesture-required'],
        },
      },
    },
  ],
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
