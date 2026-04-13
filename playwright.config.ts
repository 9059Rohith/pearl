import { defineConfig } from '@playwright/test';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://publication:publication@localhost:5433/publication?schema=public';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 120_000,
  use: {
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'corepack pnpm --filter @publication/api build && corepack pnpm --filter @publication/api db:push && corepack pnpm --filter @publication/api start',
      url: 'http://localhost:3001/pages',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
    },
    {
      command: 'corepack pnpm --filter @publication/admin build && corepack pnpm --filter @publication/admin start',
      url: 'http://localhost:3000',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: process.env,
    },
    {
      command: 'corepack pnpm --filter @publication/site build && corepack pnpm --filter @publication/site start',
      url: 'http://localhost:3002',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: process.env,
    },
  ],
});
