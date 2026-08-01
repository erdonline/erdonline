# [good first] 关系图边交互热区说明或小幅加宽

## 背景

`docs/regression-checklist.md`：边中点被节点遮挡时需 force 才能点中（P2）。在 ReactFlow 关系图上评估 `interactionWidth` / 边样式，或在开发文档写明已知限制与操作建议。

## 接受标准

- [ ] 要么边可点中概率明显改善（附前后对比说明），要么 `docs/development.md` / checklist 标明「已知限制 + 推荐操作」并勾选清单项
- [ ] 不破坏现有 `relation.spec.ts`

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium
```

## 相关文件

- `docs/regression-checklist.md`（边点击区域）
- ReactFlow 关系图相关组件（搜 `interactionWidth` / Edge）
