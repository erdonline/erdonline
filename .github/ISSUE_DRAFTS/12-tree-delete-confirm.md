# [good first] 模型树删表二次确认文案与 E2E

## 背景

画布 Delete 已守卫不删表；树侧删表应有二次确认。补清文案（说明不可逆）并加 Playwright 断言确认框出现。

## 接受标准

- [ ] 树侧删除实体弹出确认（含「删除」/「取消」）
- [ ] 取消后表仍在；确认后表消失且有成功/结果提示
- [ ] E2E 用 `getByRole('dialog')` / `getByRole('button')`，禁止 `.ant-*`

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/ --project=chromium -g "删表|删除"
```

## 相关文件

- `frontend/src/components/LeftContent/DesignLeftContent/`
- `frontend/src/store/project/entitiesSlice.tsx`
- `docs/regression-checklist.md`（画布删除二次确认项）
