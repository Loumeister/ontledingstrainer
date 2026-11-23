import { defineConfig, devices } from '@playwright/test';

// Klikcontrole tegen de gebouwde app (vite preview). Draait in de CI-job `verify`,
// niet in `npm test`: de bestanden heten *.e2e.ts en vallen buiten Vitests patroon.
const baseURL = 'http://localhost:4173';

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
