# [good first] 命令面板选项列表补 listbox 语义

> **已合入**（勿再投放）：命令列表 `role="listbox"` + 空态 `aria-live`；E2E `relation.spec`「命令面板」。

## 背景

画布命令面板（`CommandPalette`）已是 `role="dialog"`，搜索框与各选项已有 `aria-label` / `role="option"` + `aria-selected`，但选项所在 `<ul>` 缺少 `role="listbox"`（及可选 `aria-label`）。读屏难以把列表识别为可选列表；空态「无匹配命令」也无 `aria-live`，过滤无结果时不会播报。

在既有结构上补齐 listbox 语义与空态播报，不改命令执行与快捷键逻辑。可复用 `relation.spec`「命令面板」旅程。

## 接受标准

- [x] 命令列表容器具备 `role="listbox"`（建议 `aria-label="命令列表"` 或等价中文）
- [x] 选项仍为 `role="option"` + `aria-selected`；`data-testid` / 点击与键盘行为不变
- [x] 无匹配时「无匹配命令」对读屏可感知（`aria-live="polite"` 或挂在 listbox 内由读屏读到即可）
- [x] 不扩大 `any`

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "命令面板"
```

（可在既有用例中加：打开面板后 `getByRole('listbox')` 可见；填无匹配关键字后见「无匹配命令」。）

## 相关文件

- `frontend/src/pages/design/relation/CommandPalette.tsx`
- `frontend/tests/e2e/relation.spec.ts`
