# ERD Online 英文 UI 术语表

> **单一事实源**（ADR-0033）：应用内 i18n、营销页、`website/` 文档站英文译名均以此表为准。  
> 新术语**先登记再使用**；agent 不得自行发明同义词。

## 调性

与 [`frontend/src/locales/en-US.ts`](../frontend/src/locales/en-US.ts) 中 `landing.*`、`share.*` 一致：

| 原则 | 做法 |
|---|---|
| **Sentence case** | 按钮/菜单/标题仅句首大写：`Save version`，非 `Save Version` |
| **祈使动词** | 动作按钮用动词原形：`Save`、`Publish`、`Install`、`Copy to my projects` |
| **工具型产品** | 短句、无感叹号、不用 marketing 腔 |
| **错误文案** | 说明「发生了什么 + 怎么办」：`Save failed — click to retry` |
| **aria-label** | 与可见文案同调性，可略长：`Open workspace`、`Switch module` |

### 正反例

| ❌ 避免（机翻腔 / Title Case / 冗长） | ✅ 采用 |
|---|---|
| Save Version Successfully! | Saved to server |
| Please kindly enter your user name | Please enter your username |
| Relationship Diagram Canvas | Diagram |
| Data Source Configuration Panel | Data source |
| Template Marketplace | Template catalog |
| The operation has failed, please contact administrator | Save failed — click to retry |
| Module Copy | Copy module |
| Field Library Management | Field library |

---

## 核心实体

| 中文（产品内） | English | 备注 |
|---|---|---|
| 模型 / 模块 | **Module** | 画布分组单元；`share.module.fallback` 已用 Module |
| 实体 / 表 | **Table** | 物理表/逻辑实体；列表列名 `Table` |
| 关系图 / 图 | **Diagram** | 画布视图；`Skip to diagram`、`Switch diagram` |
| 字段 | **Field** | 列级属性 |
| 字段库 | **Field library** | sentence case；设置入口可写 `Field library` |
| 数据源 | **Data source** | 两个词；JDBC 连接配置 |
| 版本 | **Version** | 快照/基线；`Version history` |
| 差异 / Diff | **Diff** | 作名词：`View diff`；作动词：`Compare` |
| 模板 | **Template** | 可安装模型包 |
| 模板广场 | **Template catalog** | `landing.footer.catalog` 已定型；SERP 用 `catalog.seo.title`（ER diagram templates），勿套用首页 Draw ER Diagram Online |
| 协作 | **Collaboration** | 名词；`Real-time collaboration` |
| 工作区 | **Workspace** | 登录后应用区；`Open workspace` |
| 项目 | **Project** | 顶层容器 |
| 索引 | **Index** | DB index |
| 触发器 | **Trigger** | |
| 视图 | **View** | SQL view |
| 外键 | **Foreign key** | 表格/Tooltip 可缩写 FK |
| 主键 | **Primary key** | 徽章 PK |
| 数据类型字典 | **Data type dictionary** | `datatypeDomains.title` |

---

## 动作（常见按钮 / 菜单）

| 中文 | English | 语境 |
|---|---|---|
| 保存 | Save | 通用持久化 |
| 保存版本 | Save version | 显式版本快照 |
| 发布 | Publish | 对外可见 |
| 安装 | Install | 模板安装到项目 |
| 再次安装（创建新副本） | Reinstall (create copy) | 模板详情 |
| 复制到我的项目 | Copy to my projects | 分享页 fork |
| 删除 | Delete | 危险操作仍用 Delete |
| 确认 | Confirm | Modal 主按钮 |
| 取消 | Cancel | |
| 重试 | Retry | 失败后可点：`Retry probe` |
| 探测 / 探活 | Probe | 实时库：`Probe live DB` |
| 导出 | Export | DDL / DBML |
| 导入 | Import | |
| 注册 | Register | |
| 登录 / Sign in | Sign in | 表单标题用 `Sign in to ERD Online` |
| 打开演示 | Open demo | 与 landing 一致 |
| 打开工作区 | Open workspace | |

---

## 状态与反馈

| 中文 | English |
|---|---|
| 已保存 | Saved |
| 保存中… | Saving… |
| 保存失败 | Save failed — click to retry |
| 未保存的更改 | Unsaved changes |
| 只读 | Read-only |
| 同步 / 一致 | in sync |
| 领先 / 落后 / 分叉 | ahead / behind / diverged |
| 官方（标签，UI 展示） | Official |
| 社区 | Community |

> **不抽取**：与后端/模板数据比较的 `'官方'` 等字面量（见 ADR-0033 §4）—— UI 展示走 key，数据比较保留中文/原始值。

---

## 设计器专用

| 中文 | English |
|---|---|
| 双层对照 | Dual comparison |
| 工作区 ↔ 已保存版本 | Workspace ↔ saved version |
| 模型 ↔ 实时库结构 | Model ↔ live DB schema |
| 实时库 | Live DB |
| 未探测 | Not probed yet |
| 选择数据源 | Select datasource |
| 从字段库写入 | Insert from field library |
| DDL 模板 | DDL templates |

---

## 占位符（ICU）

- 命名占位符：`{count}`、`{name}`、`{total}`、`{layer}`、`{label}`
- 复数：`{count, plural, one {# table} other {# tables}}`（英文必须 one/other）
- **禁止**字符串拼接后再 `formatMessage`；中英 key 占位符集合必须一致（CI `check-locale-keys` 校验）

---

## 变更流程

1. 新术语 → 本表追加一行 + PR 说明
2. 全局 `src/locales/` 新增 `common.*` / `entity.*` 前先查表
3. 模块内 key 英文值必须符合本表；不确定时查 `en-US.ts` 已有 `landing.*` / `share.*` / `catalog.*`
