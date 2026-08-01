# [good first] 加载骨架页补 aria-busy / 可访问名

## 背景

`PageSkeleton` 用于版本/项目加载；建议根节点加 `aria-busy="true"` 与简短 `aria-label`，便于读屏与 E2E。

## 接受标准

- [ ] `PageSkeleton` 有稳定可访问属性
- [ ] `loading.spec.ts` 可断言（可选）

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/loading.spec.ts --project=chromium
```

## 相关文件

- `frontend/src/components/PageSkeleton/`
- `frontend/tests/e2e/loading.spec.ts`
