import { defineConfig, devices } from '@playwright/test';

/**
 * ERD Online 冒烟测试配置（第 0 轮验证基建）
 * 运行前提：全栈已启动（mysql + redis + backend:9502 + frontend:8000）
 * 本地：yarn test:e2e ｜ CI：由 workflow 先起依赖再执行
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
