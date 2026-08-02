# [good first] ReactFlow MiniMap 中文可访问名

## 背景

关系图与分享页使用 `<MiniMap />`。库默认 `ariaLabel = 'React Flow mini map'`（SVG `<title>`），中文产品读屏会听到英文。

RF v11 `MiniMap` 支持 `ariaLabel` prop（传 `null` 可去掉 title）。改为中文，如「缩略图」或「画布缩略图」。设计器与分享页一并改。

## 接受标准

- [ ] 设计器 / 分享页 MiniMap 可访问名含中文（如 `getByRole('img', { name: '画布缩略图' })` 或等价）
- [ ] 页面上不再出现 `React Flow mini map` 文案（可用 `getByLabel` / `getByText` 断言 count=0）
- [ ] 不扩大 `any`；不改 MiniMap 行为（pannable/zoomable 保持）

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "MiniMap|缩略图"
```

（可在 Controls 用例旁加短独立 test，或扩展既有打开画布用例。）

## 相关文件

- `frontend/src/pages/design/relation/ReactFlowRelation.tsx`（`<MiniMap />`）
- `frontend/src/pages/share/ShareRelationCanvas.tsx`
- `frontend/tests/e2e/relation.spec.ts`
