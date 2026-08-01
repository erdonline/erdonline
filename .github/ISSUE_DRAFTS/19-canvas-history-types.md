# [good first] canvasHistory.ts 去掉 any 参数

> **已合入**（勿再投放）：`ModulesSnapshot = unknown[]`；undo/redo 经 `parseModules`。

## 验证命令

```bash
cd frontend && yarn eslint src/store/project/canvasHistory.ts --max-warnings 0
npx playwright test tests/e2e/relation.spec.ts --project=chromium -g "全旅程"
```
