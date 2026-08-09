# ADR-0026：精密工具站视觉语言（Precision Tooling）

- 状态：**已接受**（2026-08-09）
- 决策者：项目维护者

## 背景

落地页与文档站首页已用「深色虚空 + 细网格 + IBM Plex + 品牌红点缀 + 玻璃产品窗」验证科技感；登录后工作台仍偏 Ant Design Pro 模板感。需要统一视觉语言，且不得推翻 [ADR-0010](./0010-defer-dark-mode.md)（本阶段不做全局暗色）。

## 决策

1. **采用精密工具站语言**：Linear / Raycast / Figma 壳层精神对齐——精度与信息密度，不做赛博霓虹。
2. **双域策略**：
   - **营销壳**（landing / AuthBrandShell / 异常门）：深色虚空 + 网格
   - **工作台**（Home / Group / Design chrome）：**浅色**精密化（hairline、mono chip、紧字距、弱阴影面板）
3. **本里程碑不改** ReactFlow 表节点 / 边皮肤（分享图与视觉 E2E 基线后置）。
4. Token 真相源：`frontend/src/theme/tokens.ts` + `css-vars.less`；新增 `--erd-void`、`--erd-hairline`、`--erd-surface-elevated`、`--erd-chrome-blur`、`--erd-steel`、kicker 字号。

## 后果

- 正面：落地与产品壳观感一致；可分切片 revert；不阻塞建模北极星。
- 负面：浅色工作台夜间观感仍非暗色；全站暗色需另开里程碑。
