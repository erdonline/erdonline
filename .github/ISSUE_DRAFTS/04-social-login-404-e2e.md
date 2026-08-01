# [good first] 社交登录已删路径 E2E 断言 404

## 背景

OAuth 社交登录已下线；清单项「`/login/success`、微信绑定、`/auth/oauth2/**` 不可用」仍手工。补一条 Playwright 断言防回潮。

## 接受标准

- [ ] E2E：访问上述路径得到 404 或明确不可用（非登录成功页）
- [ ] 定位遵守 `e2e-locators`（勿依赖 `.ant-*`）
- [ ] `docs/regression-checklist.md` 对应项勾为自动

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/ --grep "社交登录|oauth" --project=chromium
```

## 相关文件

`frontend/tests/e2e/`（新建或扩展 smoke）、`docs/regression-checklist.md`
