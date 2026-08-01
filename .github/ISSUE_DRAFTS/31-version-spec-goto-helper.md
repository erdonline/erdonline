# [good first] version.spec 抽取 openVersionPage 到 helpers

## 背景

`version.spec.ts` 与 `approval.spec.ts` 都用「直达 URL」开版本子页；可把 `openVersionPage` / `gotoVersionSub` 抽到 `helpers.ts` 去重。

## 接受标准

- [ ] helpers 导出可复用函数；两处 spec 调用它
- [ ] `version.spec` / `approval.spec` 相关用例仍绿

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/version.spec.ts tests/e2e/approval.spec.ts --project=chromium
```

## 相关文件

- `frontend/tests/e2e/helpers.ts`
- `frontend/tests/e2e/version.spec.ts`
- `frontend/tests/e2e/approval.spec.ts`
