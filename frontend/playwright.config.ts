import { defineConfig, devices } from '@playwright/test';
import os from 'os';

/**
 * ERD Online E2E 配置
 * 运行前提：全栈已启动（mysql + redis + backend:9502 + frontend:8000）
 * 本地：yarn test:e2e ｜ CI：由 workflow 先起依赖再执行
 *
 * 并发：本地上限 16（种子 e2e0..e2e15）；默认取 ceil(CPU/2) 以免打爆 FE/BE。
 * 满配：PW_WORKERS=16；串行排查：PW_WORKERS=1。
 * 账号级空态用例 → chromium-serial（workers=1，账号 e2e-serial）。
 */
const cpuCount = os.cpus().length;
const parallelWorkers = process.env.PW_WORKERS
  ? Number(process.env.PW_WORKERS)
  : process.env.CI
    ? 2
    : Math.max(2, Math.min(16, Math.ceil(cpuCount / 2)));

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  fullyParallel: true,
  workers: parallelWorkers,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // 需账号级空态的用例等并行项目跑完再跑（dependencies）
      testIgnore: [
        '**/project-activation.spec.ts',
        '**/activation.spec.ts',
        '**/export-feedback.spec.ts',
      ],
    },
    {
      name: 'chromium-serial',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        '**/project-activation.spec.ts',
        '**/activation.spec.ts',
        '**/export-feedback.spec.ts',
      ],
      fullyParallel: false,
      // 共用 e2e-serial：必须单 worker，避免文件锁空等到用例超时
      workers: 1,
      dependencies: ['chromium'],
    },
  ],
});
