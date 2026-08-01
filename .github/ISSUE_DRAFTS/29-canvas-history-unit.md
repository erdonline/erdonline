# [good first] canvasHistory 纯函数单测

## 背景

`frontend/src/store/project/canvasHistory.ts` 的 snapshot/undo/redo 可在无 DOM 下用 jest/vitest（仓库现有前端测法）覆盖边界：空栈、重复快照去重、MAX 截断。

## 接受标准

- [ ] 至少 3 个断言覆盖 undo 空栈 / 连续 snapshot / redo
- [ ] CI 可跑（沿用前端现有 unit 脚本，若无则放 `frontend/src/store/project/canvasHistory.test.ts` 并接 `yarn test`）

## 验证命令

```bash
cd frontend && yarn test --testPathPattern=canvasHistory 2>/dev/null || npx jest src/store/project/canvasHistory --passWithNoTests
```

## 相关文件

- `frontend/src/store/project/canvasHistory.ts`
