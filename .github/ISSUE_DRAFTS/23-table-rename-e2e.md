# [good first] 关系图表头改名 E2E

## 背景

`docs/regression-checklist.md`：点 ✎ 改表名功能已落地；Playwright 曾被 RF 层吞 click。可试 `getByRole` / `evaluate(el=>el.click())`（参见 `project-menu` 默认项确定按钮写法）。

## 接受标准

- [ ] `relation.spec.ts`（或独立用例）覆盖：✎ → 改名 → 节点标题更新
- [ ] 不破坏「全旅程」「PK」用例

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "改名|全旅程"
```

## 相关文件

- `frontend/src/pages/design/relation/ReactFlowRelation.tsx`
- `frontend/tests/e2e/relation.spec.ts`
- `docs/regression-checklist.md`
