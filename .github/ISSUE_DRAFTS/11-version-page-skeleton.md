# [good first] 版本管理页首屏骨架替代 Loading 文案

## 背景

回归清单：进版本管理首屏曾见裸 `Loading...` 文案。应与设计器其它页一致用骨架（`PageSkeleton` 或 antd `Skeleton`），避免空白感。

## 接受标准

- [ ] `/design/table/version/all` 加载中不出现用户可见的纯文本 `Loading...`（或仅极短闪现后消失）
- [ ] 有骨架或 spinner 区域（可 `data-testid`）
- [ ] `version.spec.ts` 或新断言覆盖「无 Loading 文案残留」

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/version.spec.ts --project=chromium
```

## 相关文件

- `frontend/src/pages/design/version/index.tsx`
- `frontend/src/components/PageSkeleton`
- `docs/regression-checklist.md`（版本页骨架项）
