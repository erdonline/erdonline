# [good first] json2code.ts 入口函数参数类型收窄（一小段）

## 背景

`getAllDataSQLByFilter` 等仍偏宽松；可选：给 `code` 标注为 `string`，`filter` 为 `string[]`，避免隐式 any 扩散。勿大改生成逻辑。

## 接受标准

- [ ] 触及函数签名有显式类型；行为不变
- [ ] 相关导出 DDL E2E 仍绿

## 验证命令

```bash
cd frontend && npx playwright test tests/e2e/project-menu.spec.ts --project=chromium -g "导出 DDL"
```

## 相关文件

- `frontend/src/utils/json2code.ts`
