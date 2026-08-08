# [good first] 分享页「复制到我的项目」CTA 更显眼 + 失败可见

## 背景

只读分享 `/s/:token` 是外链落地的主转化点：访客应一眼看到「复制到我的项目 / 登录试用」，且 fork / 登录失败不能静默。当前顶栏 primary 按钮在窄屏下容易被项目名挤占，失败路径虽有 toast，但缺少稳定 `data-testid` 供 E2E 与 i18n 反脆弱定位。

## 接受标准

- [ ] 分享顶栏 fork 主 CTA 增加 `data-testid="share-fork-cta"`（或等价 aria-label + testid）
- [ ] 未登录时「登录试用」链/按钮有 `data-testid="share-login-cta"` 且 Tab 序在 fork 之后可发现
- [ ] fork API 非 200 时 `message.error` 必出（已有逻辑则补 E2E 断言，禁止静默）
- [ ] 375px 宽视口下主 CTA 仍可见（可 sticky 底栏或顶栏换行，遵循 antd + 现有 token）
- [ ] `share.spec.ts` 至少一条用 `getByTestId('share-fork-cta')` 定位，不新增仅中文 `getByRole({ name })` 唯一定位

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/share.spec.ts --project=chromium --grep "复制"
# 窄屏截图（手工或 spec 内 page.setViewportSize({ width: 375, height: 812 })）
```

## 相关文件 / 目录

- `frontend/src/pages/share/index.tsx`
- `frontend/src/pages/share/*.less`（若有）
- `frontend/tests/e2e/share.spec.ts`
