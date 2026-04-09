import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'html',
  use: {
    baseURL: 'http://160.202.253.143:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /login\.spec\.ts/,
      grep: /登录页面|登录并保存/,
    },
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
      grep: /登录后/,
      dependencies: ['setup'],
    },
    {
      name: 'knowledge',
      testMatch: /knowledge\.spec\.ts/,
      use: { browserName: 'chromium' },
      dependencies: ['setup'],
    },
    {
      name: 'search',
      testMatch: /search\.spec\.ts/,
      use: { browserName: 'chromium' },
      dependencies: ['setup'],
    },
  ],
})
