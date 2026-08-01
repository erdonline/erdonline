# [good first] 社交登录已删路径 E2E 断言 404

> **已合入**（勿再投放）：见 `frontend/tests/e2e/dead-auth-routes.spec.ts`。

## 背景

OAuth 社交登录已下线；防路径回潮。

## 接受标准

- [x] E2E：`/login/success`、微信绑定页见 404；`/auth/oauth2/**` 非 200

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/dead-auth-routes.spec.ts --project=chromium
```

## 相关文件

`frontend/tests/e2e/dead-auth-routes.spec.ts`
