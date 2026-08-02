# [good first] 顶栏自动保存状态补 aria-live

> **已合入**（勿再投放）：SaveStatus `role="status"` + `aria-live="polite"`；E2E `relation.spec`「save-status」。

## 背景

设计器顶栏 `SaveStatus`（`data-testid="save-status"`）已有 `aria-label={`自动保存：${label}`}` 与可见文案「保存中… / 已保存 / 未保存」，但缺少 `aria-live`。状态从「保存中…」切到「已保存」时，读屏用户不会收到播报。

在现有 `span` 上补 `role="status"` + `aria-live="polite"`（或等价），不改样式与保存逻辑。

## 接受标准

- [x] `save-status` 节点具备 `aria-live="polite"`（或 `role="status"`，二者其一即可，推荐并存）
- [x] 可见文案与 `data-testid` / 既有 `aria-label` 模式不变；不改自动保存行为
- [x] 不扩大 `any`
- [x] 短 E2E：打开设计器建表触发保存 → `getByTestId('save-status')` 最终为「已保存」，并断言 `aria-live`（或 `role=status`）属性存在

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "保存|save-status|aria-live"
```

（亦可在既有「全旅程」断言旁加 1–2 行属性检查，或短独立 test。）

## 相关文件

- `frontend/src/components/SaveStatus/index.tsx`
- `frontend/tests/e2e/relation.spec.ts`（或 `smoke.spec.ts`）
