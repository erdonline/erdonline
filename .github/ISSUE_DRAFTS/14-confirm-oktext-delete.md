# [good first] 树删除确认主按钮文案改为「删除」

## 背景

`DataTable` 的 `Modal.confirm` 现用 `okText: '确定'` + `okType: 'danger'`。破坏性操作行业惯例为「删除」。

## 接受标准

- [ ] `okText: '删除'`（模块/表删除确认）
- [ ] 更新 `smoke.spec.ts` 中按钮名断言为「删除」
- [ ] 取消路径仍绿

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/smoke.spec.ts --project=chromium -g "删除表"
```

## 相关文件

- `frontend/src/components/LeftContent/DesignLeftContent/component/DataTable.tsx`
- `frontend/tests/e2e/smoke.spec.ts`
