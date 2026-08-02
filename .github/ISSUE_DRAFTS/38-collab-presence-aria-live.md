# [good first] 顶栏协作在线状态补 aria-live

> **已合入**（勿再投放）：CollabPresence `role="status"` + `aria-live="polite"`；E2E `presence.spec`。

## 背景

设计器顶栏 `CollabPresence`（`data-testid="collab-presence"`）已有 `aria-label` 与可见文案（「在线 N：…」/「连接协作中…」），但缺少 `aria-live`。协作者进出导致文案变化时，读屏用户不会收到播报。

在现有 `span` 上补 `role="status"` + `aria-live="polite"`（或等价），不改样式与 presence 订阅逻辑。模式对齐已合入的 `SaveStatus`。

## 接受标准

- [x] `collab-presence` 节点具备 `aria-live="polite"`（或 `role="status"`，二者其一即可，推荐并存）
- [x] 可见文案与 `data-testid` / 既有 `aria-label` 模式不变；不改 Socket/presence 行为
- [x] 不扩大 `any`
- [x] 短 E2E 或清单：双标签同项目打开设计器 → `getByTestId('collab-presence')` 可见且含 `aria-live`（或 `role=status`）；可复用 `presence.spec` 旅程加 1–2 行属性断言

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/presence.spec.ts --project=chromium
```

（若无独立 presence 用例，可在打开设计器后断言节点属性；组件未挂载时跳过可见性、只测源码属性亦可，但优先真实 DOM。）

## 相关文件

- `frontend/src/components/CollabPresence/index.tsx`
- `frontend/tests/e2e/presence.spec.ts`（或 `relation.spec.ts`）
