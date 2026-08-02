# projectJSON 数据格式（对外规范 · 初稿）

> **读者问题**：人和 AI agent 如何读写 ERD Online 的项目模型事实源？  
> **答案**：`projectJSON` 是项目建模的唯一 JSON 事实源；机器可校验定义见仓库根目录 [`schema/projectjson.schema.json`](../schema/projectjson.schema.json)（JSON Schema draft 2020-12）。

依据：[ADR-0012](./adr/0012-ai-era-data-structure-platform.md)（schema-as-code）、[ADR-0008](./adr/0008-datasource-isolation.md)（密钥不进 JSON）。本文件服务开放叙事；公开 API/MCP 仍受 [ADR-0013](./adr/0013-public-api-mcp.md) 约束，**本规范不授权绕过鉴权写库**。

## 兼容性政策（agent 稳定性承诺）

| 规则 | 说明 |
|---|---|
| **仅加法演进** | 可新增可选字段 / 模块；已发布字段的语义与类型不得原地破坏 |
| **禁止原地破坏** | 不重命名、不删除、不改类型含义；若必须破坏，走 semver major + 迁移指南 + 至少一个 minor 的弃用窗口（见 [roadmap 版本政策](./roadmap.md#版本政策)） |
| **未知字段保留** | 读取方应忽略未知键；写入方不得擅自剥离他人写入的未知键（forward-compat） |
| **schema 校验** | 仓库提供 ajv 脚本；CI/贡献者可本地跑；通过 ≠ 业务语义全部合法（如 FK 指向存在性由运行时保证） |

当前仓库**尚未**在 JSON 内嵌入 `schemaVersion` 字段；兼容政策以本文 + schema 文件的 Git 历史为准。引入显式版本号时仍遵守「仅加法」。

## 顶层结构

`ensureProjectJSON`（前端）与后端默认骨架保证打开项目时至少具备三个顶层键：

```json
{
  "modules": [],
  "profile": { "defaultFields": [] },
  "dataTypeDomains": { "datatype": [], "database": [] }
}
```

| 键 | 类型 | 含义 |
|---|---|---|
| `modules` | `Module[]` | 模型列表：实体、关联、画布布局 |
| `profile` | `object` | 项目级配置（默认字段、默认数据源绑定等） |
| `dataTypeDomains` | `object` | 逻辑类型与库方言 / DDL 模板 |

完整骨架参考：`frontend/src/utils/defaultData.json`。公开 demo /「从示例开始」正例：[`schema/examples/demo.projectjson.json`](../schema/examples/demo.projectjson.json)（功能鉴权 RBAC；同步到 `db/init/08_public_demo.sql` 与前端请跑 `node scripts/sync-demo-projectjson.mjs`；`profile.defaultFields` 规范为空数组）。

## modules / entities / fields / associations

### Module

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | string | 模块逻辑键（必填） |
| `chnname` | string | 显示名 |
| `entities` | `Entity[]` | 表列表（必填数组） |
| `associations` | `Association[]` | 表间关联 |
| `graphCanvas` | object | 画布布局；**实体以 `entities` 为准，此处只存坐标**（ADR-0001） |

`graphCanvas.nodes[]`：`{ id, title?, x, y }`（`id` 通常等于实体 `title`）。  
`graphCanvas.edges[]`：可选；运行时可见 `source` / `target`。

### Entity

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | 表名；画布节点 id |
| `name` | string | 常与 `title` 同步 |
| `chnname` | string | 中文/显示名 |
| `remark` | string | 备注 |
| `fields` | `Field[]` | 字段列表 |
| `indexs` | `Index[]` | 索引（历史拼写 **indexs**，非 indexes） |

运行时校验：至少有 `title` 或 `name`，且 `fields` 为数组。

### Field

常见键（见 `defaultData.json` 默认字段）：

`name` · `chnname` · `typeName` · `type` · `dataType` · `remark` · `pk` · `notNull` · `autoIncrement` · `relationNoShow` · `defaultValue` · `uiHint` · `addAfter`（DDL 模板）

- `type`：逻辑类型 code，对齐 `dataTypeDomains.datatype[].code`
- `dataType`：当前方言下的物理类型字符串（如 `VARCHAR(32)`）
- `defaultValue`：列默认值字符串。约定：字符串字面量带单引号（`'NEW'`）；数字原样（`0` / `0.00`）；表达式原样（`CURRENT_TIMESTAMP` / `now()`）。**逆向**自 JDBC `COLUMN_DEF`（`DefaultValueMapper`）；**DBML** 双向见下文映射表

### Association

```json
{
  "relation": "1:n",
  "from": { "entity": "T_ORDER", "field": "USER_ID" },
  "to": { "entity": "T_USER", "field": "ID" }
}
```

`relation` 为基数字符串（如 `1:1`、`1:n`、`n:n`）；`from` / `to` 的 `entity` 为实体 `title`，`field` 为字段 `name`。

### Index（`indexs[]`）

```json
{ "name": "AUTH_USER_INDEX1", "isUnique": true, "fields": ["ID", "CODE"] }
```

## profile

| 字段 | 说明 |
|---|---|
| `defaultFields` | 新建实体时注入的默认 `Field[]` |
| `defaultDataSourceId` | 项目默认数据源 id（`data_sources.id`） |
| `dbs` | **遗留槽位**；保存/分享时应为 `[]` |
| `defaultFieldsType` / `sqlConfig` / `wordTemplateConfig` | 配置扩展（形态随 UI） |
| `tableLimit` / `tableNameFormat` | 表数量上限与命名格式 |
| `erdPassword` | 历史本地加密派生用口令（**不是** JDBC 密码） |

### 密钥纪律（强制）

连接机密（JDBC `url` / `username` / `password` / `driver`）**唯一事实源**是表 `data_sources` + API `/ncnb/dataSources`，**永不写入 projectJSON**（[ADR-0008](./adr/0008-datasource-isolation.md)）。

- 打开旧项目：剥离 `profile.dbs.*.properties`
- 保存前：强制清空机密字段；`dbs` 置空
- 只读分享：匿名响应清空 `dbs`（见 [security-model.md](./security-model.md)）
- 版本快照 / 导出 / fork：同样不得回灌 JDBC 机密

## dataTypeDomains

```json
{
  "datatype": [
    {
      "name": "标识号",
      "code": "IdOrKey",
      "apply": {
        "MYSQL": { "type": "VARCHAR(32)" },
        "JAVA": { "type": "String" }
      }
    }
  ],
  "database": [
    {
      "code": "MYSQL",
      "defaultDatabase": true,
      "createTableTemplate": "…"
    }
  ]
}
```

- `datatype[]`：逻辑类型；`apply` 按方言 code 映射 `{ type }`
- `database[]`：方言与 doT 风格 DDL/代码模板（`createTableTemplate`、`createIndexTemplate` 等）

## 机器校验

```bash
# 仓库根目录：正例必须通过、负例必须失败（非零退出）
node scripts/validate-projectjson.mjs

# 校验任意文件
node scripts/validate-projectjson.mjs path/to/your.projectjson.json

# 前端包脚本（等价）
cd frontend && yarn validate:projectjson
```

首次运行会在 `schema/` 下安装 `ajv@8`（见 `schema/package.json`）。Schema 与示例变更后请重跑本命令。

## 示例（公开 demo）

与 `/demo` → `/s/public-demo` 及登录态「从示例开始」同构的正例见 [`schema/examples/demo.projectjson.json`](../schema/examples/demo.projectjson.json)。

| 表 | 中文名 | 角色 |
|---|---|---|
| `sys_user` | 用户 | 主体 |
| `sys_role` | 角色 | RBAC |
| `sys_permission` | 权限 | RBAC |
| `sys_user_role` | 用户角色 | n:m 中间表 |
| `sys_role_permission` | 角色权限 | n:m 中间表 |
| `sys_session` | 登录会话 | 认证态 |
| `sys_audit_log` | 审计日志 | 可追溯 |
| `biz_order` | 业务订单 | 业务切片（挂 `user_id`） |

模块名 `AUTHZ` / 显示名「功能鉴权」；含 `indexs`、`defaultValue` 与 LR 分层坐标，打开即可分享截图（ADR-0016）。

## DBML 互通（导入 / 导出）

设计器「导入 → 导入DBML」将 [DBML](https://dbml.dbdiagram.io/) 文本解析为 `projectJSON` 模块后合并进当前项目（`@dbml/core`，前端懒加载）。「导出 → 导出DBML」将选定模块反向生成为 `.dbml`（纯函数，本地下载 / 复制）。

| DBML | projectJSON |
|---|---|
| `Table` | `modules[].entities[]`（`title`/`name` = 表名） |
| 列 | `fields[]`（物理类型 ↔ 逻辑 `type` code 薄双向映射；未知导入回落 `String`，导出回落 `varchar`） |
| `[default: …]` | `fields[].defaultValue`（string→`'…'`；number→数字串；expression→原样如 `now()`；导出时字符串/数字/表达式分别还原） |
| `Note` / `[note: …]` | **仅**与 `chnname` 互通（表/列显示名） |
| `Ref` / 列上 `[ref: …]` | `associations[]`（`1:1` / `1:n` / `n:n`；`from`=多端持 FK） |
| `indexes { … }` | `entities[].indexs[]`（`name` / `isUnique` / `fields[]`；跳过 pk 索引与表达式列） |
| `Project` 名 / Note | 模块 `name` / `chnname`（缺省 `DBML` / `DBML导入`） |

**不映射**：enum、trigger、表级 check、复合 FK、索引表达式列。导入合并路径复用 `importModuleAndProfile`（与 ERD/PdMan 逆向一致，含 `fixModules`）。

## 非目标（本规范不覆盖）

- `configJSON`（导出/同步偏好，与模型事实源分离）
- 公开 REST/MCP 载荷包装（ADR-0013）
- 复合 FK `fields[]` 语义扩展（ADR-0011 解封后再增订）
