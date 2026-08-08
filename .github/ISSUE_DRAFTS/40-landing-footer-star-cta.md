# [good first] 落地页 footer 增加 GitHub Star 入口

## 背景

README 已有 Star CTA，但落地页 footer 仅链到 Issues。推广流量从 `/` 进入时应有一条明确的 Star 链，降低「体验完找不到 star 按钮」的摩擦。

## 接受标准

- [ ] `LandingChrome` footer 增加「Star on GitHub」链到 `https://github.com/erdonline/erdonline/stargazers`（`target=_blank`）
- [ ] 补 zh-CN / en-US i18n key（`landing.footer.star`）；E2E 定位用 `data-testid="landing-footer-star"` 或 `getByRole('link', { name: /Star/i })` 与文案断言分离
- [ ] `compare.spec.ts` 或 `landing` 相关 spec 断言 footer 可见 Star 链

## 验证命令

```bash
cd frontend && yarn build
cd frontend && npx playwright test tests/e2e/compare.spec.ts --project=chromium --grep "footer"
```

## 相关文件

- `frontend/src/pages/landing/LandingChrome.tsx`
- `frontend/src/locales/zh-CN.ts`、`en-US.ts`
