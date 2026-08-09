# ADR-0027：产品 Chrome 信息架构（仪器盘 + 全站主题 + 单一浏览面）

- 状态：**已接受**（2026-08-09）
- 决策者：项目维护者

## 背景

精密工具站（ADR-0026）落地后，设计器顶栏仍是「已落盘 / 未存版本 / 实库未知 / 保存版本 / 工单…」文案墙；登录等 `layout:false` 页未吃 `erdTheme`（antd 蓝主钮）；`/dataModels` 与 `/project/*` 两套列表密度分叉。继续在 24px 密度上抠像素 ROI 归零，需要**信息架构**决策。

## 决策

1. **全站 Theme**：`app.tsx` `rootContainer` 注入 `erdTheme`；营销壳与工作台同一 `colorPrimary`（品牌红）。
2. **状态仪器盘**：Autosave / Version / Live-DB 三语义（ADR-0022）**不合并 store**，呈现压缩为 Synced / `vX` / `DB ·` 胶囊；长说明进 tooltip/Popover/`aria`。
3. **动作分级**：顶栏常显仅仪器盘 + 一个北极星主 CTA（保存版本）+ 图标动作；工单/审批等进图标或溢出。
4. **项目浏览单一视觉**：`/dataModels` 与 `/project/*` 共用 `project-list` 密度与 `ProjectTypeBadge`（禁 antd `Tag color="blue"` / `#5BD8A6`）。
5. **表设计层级**：表名条与内签合并为一条 chrome；CommonTabs（多表）与内容签视觉分化。
6. **左树新建**：去掉与文件夹 inline `+` 重复的全局下拉；右键菜单分段。
7. **本 ADR 不做**：设计器默认暗色、ReactFlow 玻璃节点（仍遵 ADR-0010 / 0026 后置）。

## 后果

- 正面：门面与设计器气质对齐；顶栏可读性与笔记本宽度改善；列表不再两套脸。
- 负面：仪器短标签偏英文化号（需完整 `aria`）；部分 E2E 需跟 testid/文案迁移。
