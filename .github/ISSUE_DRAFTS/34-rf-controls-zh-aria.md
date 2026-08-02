# [good first] ReactFlow Controls 中文可访问名

## 背景

关系图画布使用默认 `<Controls />`。库内按钮硬编码英文 `aria-label` / `title`（`zoom in` / `zoom out` / `fit view` / `toggle interactivity`），中文产品界面读屏与键盘用户会听到英文。

RF v11 的 `Controls` **没有** `ariaLabels` prop。推荐：`showZoom={false}` `showFitView={false}` `showInteractive={false}`，再用 `ControlButton`（从 `reactflow` 导入）自定义四个按钮，文案与 `aria-label` 用中文（如「放大」「缩小」「适应画布」「切换交互」）。行为与默认 Controls 一致（`useReactFlow` 的 `zoomIn` / `zoomOut` / `fitView` + 交互锁定）。

## 接受标准

- [ ] 画布左下角仍有放大 / 缩小 / 适应 / 交互切换
- [ ] `getByRole('button', { name: '放大' })`（及缩小、适应画布、切换交互）可定位
- [ ] 页面上不再出现 `aria-label="zoom in"` 等英文控件名（可用 Playwright `getByLabel` 断言 count=0）
- [ ] 不扩大 `any`；分享页只读画布若也用了 Controls，一并改或注明范围

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "Controls|放大|适应画布"
```

（可在现有「全旅程」用例末尾加 3–4 行断言，或短独立 test。）

## 相关文件

- `frontend/src/pages/design/relation/ReactFlowRelation.tsx`
- `frontend/src/pages/share/ShareRelationCanvas.tsx`（若有 `<Controls />`）
- `frontend/tests/e2e/relation.spec.ts`
