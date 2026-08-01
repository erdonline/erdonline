# [good first] 默认项设置「确定」保存后有成功反馈

## 背景

项目→设置→默认项设置可开（已有 E2E）。保存成功/失败应对用户可见（message），避免静默。

## 接受标准

- [ ] 修改 SQL 分隔符或开关后点确定 → 出现成功提示（或已有则断言之）
- [ ] 失败路径有错误提示（可 mock）
- [ ] 补/扩 `project-menu.spec.ts` 或独立 spec

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "默认项"
```

## 相关文件

- `frontend/src/components/dialog/setup/DefaultSetUp.tsx`
- `frontend/src/store/project/profileSlice.tsx`（`updateProfile`）
