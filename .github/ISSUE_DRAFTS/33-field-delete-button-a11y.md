# [good first] 画布「删除字段」改为可访问按钮

> **已合入**（勿再投放）：`erd-field-delete` 改为 `button` + `aria-label`；E2E 见 `relation.spec.ts`「删除字段」。

## 背景

关系图表节点上，删除字段控件是带 `×` 的 `<span>`，仅有 `title="删除字段"`，没有 `role` / `aria-label`，键盘与读屏无法稳定操作；也不符合仓库 E2E 定位纪律（优先 `getByRole`）。

把该控件改成真正的 `button`（或等价可聚焦控件），补中文可访问名，并加一条短 E2E。

## 接受标准

- [x] 「删除字段」可用 `getByRole('button', { name: '删除字段' })` 定位（同表多字段时用 `locator` 限定在目标字段行内）
- [x] 点击后字段从节点消失；不改删除确认策略（现状无二次确认则保持）
- [x] 不扩大 `any`；不改 projectJSON 结构

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "删除字段"
```

（若新建独立 spec，把 grep 换成对应文件名。）

## 相关文件

- `frontend/src/pages/design/relation/ReactFlowRelation.tsx`（`erd-field-delete`）
- `frontend/tests/e2e/relation.spec.ts`（或新建短用例）
- `.cursor/rules/e2e-locators.mdc`
