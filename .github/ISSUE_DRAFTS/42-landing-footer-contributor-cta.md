# [good first] 落地页页脚补 Star + Good first issue 外链

## 背景

推广需要把浏览 README / 落地页的流量导向 GitHub：**Star**、**认领 good first issue**、**路线图投票**。落地页 `LandingChrome` 页脚已有「社区」Broad 链，但缺少显式 Star / 新手任务 CTA，与 README 新入口不对齐。

## 接受标准

- [ ] 页脚增加 GitHub Star 与 Good first issues 链接（`target="_blank"` + `rel="noreferrer"`）
- [ ] 链到 `https://github.com/erdonline/erdonline/stargazers` 与 `…/issues?q=label%3A%22good+first+issue%22`
- [ ] 新增 `data-testid="landing-footer-star"`、`landing-footer-good-first`（或 i18n key + testid）
- [ ] `landing.spec.ts` 断言两链可见（定位用 testid，文案断言可 regex）
- [ ] 遵循 `frontend-standards.mdc`：不新增 `any`；文案走 `locales` 或现有 intl 模式

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/landing.spec.ts --project=chromium
cd frontend && yarn lint
```

## 相关文件 / 目录

- `frontend/src/pages/landing/LandingChrome.tsx`
- `frontend/src/locales/`（若补 key）
- `frontend/tests/e2e/landing.spec.ts`
