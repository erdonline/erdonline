# [good first] 画布工具栏撤销/重做/排布/对齐补 aria-label

## 背景

关系图右上角工具栏（`ReactFlowRelation` `Panel`）里，「撤销」「重做」「自动排布」及对齐组内按钮目前只有 `title`，没有 `aria-label`。读屏/键盘用户依赖可访问名时不如「命令」「对齐」组稳定；E2E 也更难 `getByRole('button', { name })`。

对齐组已有 `role="group" aria-label="对齐"`；组内各按钮仍建议补独立中文名（可与现有 `title` 一致）。

## 接受标准

- [ ] 「撤销」「重做」「自动排布」（或等价中文）按钮可用 `getByRole('button', { name })` 定位
- [ ] 对齐组内各按钮（左对齐 / 水平居中 / 右对齐 / 顶对齐 / 垂直居中 / 底对齐）均有中文 `aria-label`（可与 `title` 相同）
- [ ] 不扩大 `any`；不改点击行为与 `data-testid`（`align-left` / `align-top` 可保留）

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "工具栏|撤销|对齐"
```

（可短独立 test：打开空关系图 → 断言上述按钮可见。）

## 相关文件

- `frontend/src/pages/design/relation/ReactFlowRelation.tsx`（`erd-canvas-toolbar`）
- `frontend/tests/e2e/relation.spec.ts`
