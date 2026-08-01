# [good first] canvasHistory.ts 去掉 any 参数

## 背景

`frontend/src/store/project/canvasHistory.ts` 的 `snapshotModules` / `undoModules` / `redoModules` 仍用 `any`。应用项目里已有的 module 类型（或最小接口）替换，不扩大前端 `any` 数量。

## 接受标准

- [ ] 文件内无显式 `any`（或仅必要断言并注释）
- [ ] `yarn eslint src/store/project/canvasHistory.ts --max-warnings 0`
- [ ] undo/redo 冒烟：设计器改表 → Ctrl/Cmd+Z 可回退（见既有 smoke / 手工）

## 验证命令

```bash
cd frontend && yarn eslint src/store/project/canvasHistory.ts --max-warnings 0
```

## 相关文件

- `frontend/src/store/project/canvasHistory.ts`
