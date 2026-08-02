# ADR-0014：@ant-design/pro-components 去留（Strangler 摘除）

- 状态：**✅ 已落地 · 选项 B**（2026-08-02 接受；**2026-08-02 依赖移除完成**）
- 决策者：产品负责人
- 前置：[ADR-0005](./0005-ui-architecture.md)（UI 架构：antd 守 CRUD，设计器域自研）

## 背景

`@ant-design/pro-components`（下称 Pro）曾为直接依赖（钉在 `2.8.10`）。注意：`@umijs/max` **不内置** Pro——它是单独的包；Max 只提供 antd 接入与插件体系，移除 Pro 不影响 umi/antd 升级路径。

用户提问：Pro 是否必要？能否只留 antd + umi？

## 基线用量（2026-08-02 Strangler 起点）

约 **70 个文件**直接 import `@ant-design/pro-components`（chrome / ModalForm / ProTable / ProList / StepsForm 等）。经 W3–W4 分片摘除后于 **2026-08-02** 清零。

## 决策：选项 B —— Strangler 摘除（已完成）

三个候选：

- **A 本里程碑全量移除**：替换为 antd `Layout/Table/Form` + 薄封装。拒绝——70 文件、300+ 处用量的爆破与「一次只做一件事」冲突，且与 ReactFlow 画布、北极星三件事抢迭代带宽。
- **B Strangler（已接受并落地）**：冻结 Pro 新增用量；随布局/能力切片逐域收口；grep 清零后移除依赖。
- **C 保留 Pro**：仅当 Pro 对本栈不可替代。拒绝——Pro 的价值（模板化 CRUD）与 ADR-0005「antd 守 CRUD + 设计域自研」重叠，且它是 antd 升级的版本耦合点。

**落地结果（2026-08-02）**：

1. `rg -l '@ant-design/pro-components' frontend/src --glob '*.{ts,tsx}'` → **0**
2. `frontend/package.json` 已移除 `@ant-design/pro-components` 与仅为其服务的 `umi-presets-pro`
3. `frontend/config/config.ts` 已去掉 `presets: ['umi-presets-pro']` 与空 `layout:{}`（改由自研 Home/Group/Design Layout + `Theme`/`Outlet`）
4. 新代码禁止再引入 Pro（建议后续补 `no-restricted-imports`）

### 迁移映射（历史查表）

| Pro | antd / 薄封装替代 |
|---|---|
| `ModalForm` + `ProForm*` | antd `Modal` + `Form` + `Form.Item` |
| `StepsForm` | antd `Steps` + 多 `Form` 实例 |
| `ProTable`（`request`/`ActionType`） | antd `Table` + 手写分页 |
| `ProLayout` / `PageContainer` | antd `Layout` + 自研 chrome |
| `ProCard` | antd `Card` / 普通容器 |
| `ProList` | antd `List` |
| `LoginForm(Page)` | antd `Form` 直写 |
| `FooterToolbar` | sticky 底栏 |
| `WaterMark` | antd 5 原生 `Watermark` |

## 后果

- 正面：解除 antd 升级耦合；chrome 自研与 ADR-0005 对齐；依赖面缩小
- 代价：迁移期曾双写并存（已结束）
- 约束：禁止重新加入 `@ant-design/pro-components` / `umi-presets-pro` / `@ant-design/pro-layout`
