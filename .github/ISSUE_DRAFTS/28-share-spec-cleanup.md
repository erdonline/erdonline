# [good first] share.spec 失败时清理项目更稳

## 背景

分享相关 E2E 的 `finally` 已调 `deleteOwnPersonProjects`；可核对是否与 `presence`/`approval` 同级稳健（超时、二次清理），并补一条断言「清理后个人项目列表无本次名」。

## 接受标准

- [ ] `share.spec.ts` 失败路径仍清理；可选断言列表无残留名
- [ ] 不扩大用例范围到分享业务本身

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium
```

## 相关文件

- `frontend/tests/e2e/share.spec.ts`
- `frontend/tests/e2e/helpers.ts`
