# ADR-0014：@ant-design/pro-components 去留（Strangler 摘除）

- 状态：**⏳ 待确认（建议选项 B）**（2026-08-02）
- 决策者：待定
- 前置：[ADR-0005](./0005-ui-architecture.md)（UI 架构：antd 守 CRUD，设计器域自研）

## 背景

`@ant-design/pro-components`（下称 Pro）当前为直接依赖（`frontend/package.json` 钉在 `2.8.10`）。注意：`@umijs/max` **不内置** Pro——它是单独的包；Max 只提供 antd 接入与插件体系，移除 Pro 不影响 umi/antd 升级路径。

用户提问：Pro 是否必要？能否只留 antd + umi？

## 现状用量（2026-08-02 grep 基线）

约 **70 个文件**直接 import `@ant-design/pro-components`，热点分布：

| 组件 | 文件数 | 主要位置 |
|---|---|---|
| `ModalForm` / `ProForm*`（弹窗表单家族） | ~32 | `components/dialog/**`（项目/模块/实体/版本/数据库等全部对话框） |
| `ProCard` | ~12 | `layouts/*`、`pages/design/query`、`dataQuery`、`account/settings` 等 |
| `ProTable` | ~10 | `databaseConfig`、版本 order/approval、查询历史/结果、`TableTransfer` |
| `ProLayout` / `PageContainer` | ~6 | `HomeLayout` / `DesignLayout` / `GroupLayout` / `home` / `account/settings` |
| `ProList` / `StepsForm` / `LoginForm(Page)` / `FooterToolbar` / `WaterMark` | ~18 | 登录/注册、逆向导入向导、导出 DDL、项目组页等 |

## 决策（建议：选项 B —— Strangler 摘除）

三个候选：

- **A 本里程碑全量移除**：替换为 antd `Layout/Table/Form` + 薄封装。拒绝——70 文件、300+ 处用量的爆破与「一次只做一件事」冲突，且与 ReactFlow 画布、北极星三件事抢迭代带宽。
- **B Strangler（建议）**：冻结 Pro 新增用量；Home/模型 chrome 随 `ui-home-model-redesign` S 片优先摘除（S2–S5 本就要重写这些 chrome）；表单/表格域后续按迁移映射逐域收口；最终移除依赖单独切片。
- **C 保留 Pro**：仅当 Pro 对本栈不可替代。拒绝——Pro 的价值（模板化 CRUD）与 ADR-0005「antd 守 CRUD + 设计域自研」重叠，且它是 antd 升级的版本耦合点。

**B 的约束条款**：

1. **冻结**：新代码禁止新增 `@ant-design/pro-components` import（lint 规则 `no-restricted-imports` 跟进）
2. **版本冻结**：升级 umi + antd 时**不升级 Pro**；若出现 peer 冲突，优先降 antd 升级幅度或加速摘除 chrome 域，不为 Pro 让路
3. **摘除顺序**：chrome（ProLayout/PageContainer/ProCard in layouts + home）→ 表单对话框（ModalForm/ProForm*）→ 表格（ProTable）→ 登录注册（LoginForm）
4. **移除判据**：grep 基线清零后从 `package.json` 删除依赖，单独 commit

### 迁移映射（供实施者查表）

| Pro | antd / 薄封装替代 |
|---|---|
| `ModalForm` + `ProForm*` | antd `Modal` + `Form` + `Form.Item`（沉淀 `components/FormDialog` 薄封装，统一 footer/loading/反馈纪律） |
| `StepsForm` | antd `Steps` + 多 `Form` 实例 |
| `ProTable`（`request`/`ActionType`） | antd `Table` + `useRequest`/手写分页薄封装 |
| `ProLayout` / `PageContainer` | antd `Layout` + 自研 chrome（重设计 S2–S5 已在走这条路） |
| `ProCard` | antd `Card` |
| `ProList` | antd `List` |
| `LoginForm(Page)` | antd `Form` 直写（登录/注册页本就轻） |
| `FooterToolbar` | 薄 fixed 底栏组件 |
| `WaterMark` | antd 5 原生 `WaterMark`（免费，直接换 import） |

## 后果

- 正面：解除 antd 升级耦合；chrome 自研与 ADR-0005 对齐；包体积最终下降
- 代价：冻结期内 Pro/antd 双写并存；迁移期同站两种表单写法（薄封装先行收敛）
- 风险：Pro 2.8.x 对新版 antd 的 peer 警告——容忍警告，不升级 Pro
- 对实现者的中断指令：下一轮 Auto 若在做 umi+antd+pro 升级，**停止升级 Pro**，只升 umi+antd；新切片一律走迁移映射，不再加深 Pro 用量
