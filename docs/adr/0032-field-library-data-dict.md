# ADR-0032：字段库（data_dict）— 平台 / 团队 / 个人

- 状态：**✅ 已接受**（MVP 2026-08-09）
- 决策者：项目维护者
- 前置：[ADR-0012](./0012-ai-era-data-structure-platform.md) projectJSON 事实源；[ADR-0028](./0028-official-template-catalog.md) 与 catalog 正交；[ADR-0013](./0013-public-api-mcp.md) MCP 写库边界

## 背景

设计器需要可复用的字段/枚举片段：平台种子（性别、状态、审计字段组）、团队共享库、个人收藏。历史 `DataDictController` + `tree()` 仅按 `creator=system|当前用户` 过滤，表 `data_dict` 未入 Flyway；前端 `/design/dataDomain` 已删（W2），零 `/dataDict` 调用。

与 **catalog**（整项目模板）、**sys_dict**（系统配置）、**dataTypeDomains**（项目内逻辑类型）、**profile.defaultFields**（建表默认）均正交：字段库是「片段 copy-on-apply」，不 live 级联。

## 决策（已锁定）

| 议题 | 决策 |
|---|---|
| 表名 | 继续 `data_dict` |
| 粒度 | `scope_type`：`platform` \| `group` \| `user`；`scope_id`：团队项目 id（group）或 user id（user）；platform 的 `scope_id` 为 NULL |
| 「租户」 | = 团队项目（`type=2` 的 project.id）；**不**新建 SaaS org/tenant 表 |
| 存储 | `dict_info` JSON：`{ fields: Field[], enums?: DatatypeSnippet[] }` |
| 应用到项目 | **copy-on-apply**：`POST /dataDict/{id}/apply` 返回 `{ fields, enums }`；前端 merge 进 projectJSON；字段可选 `dictRef`；**无 live 级联** |
| ACL | platform 全员只读；group = `ProjectAcl` 成员读写；user = 本人读写 |
| 入口 | 表设计「从字段库插入」**Modal**；工具栏「字段库」→ 右侧按需 **Drawer**；不做常驻 Affix |
| 库管理 UI | **含完整 CRUD 树**（平台只读浏览；个人 + 团队可编辑）；设置页 `/design/table/setting/fieldLibrary` |
| MCP | **不含** MCP 写字段库（与 ADR-0013 公开写面分离） |

## 后果

- 正面：建模复用有单一真相源；团队可沉淀字段规范；与 projectJSON 解耦，离线编辑仍可用
- 代价：copy 后改库不回写项目（by design）；需 Flyway 种子维护平台库
- 与 catalog：catalog = 整项目；data_dict = 字段/枚举片段

## MVP 切片

| # | 交付 | 状态 |
|---|---|---|
| 0 | 本 ADR + roadmap/data-format/product-capability-map/CHANGELOG | ✅ |
| 1 | Flyway `V25__data_dict_baseline.sql` + 平台种子 | ✅ |
| 2 | Backend scope ACL + apply + 单测 | ✅ |
| 3 | FE 库管理 + Modal + Drawer + merge | ✅ |
| 4 | E2E：插入平台「性别」→ 落表 → 保存 | ✅ |

## 明确不做

- MCP / PAT 写字段库
- live 级联（改库自动改已打开项目）
- 替代 `dataTypeDomains` 或 `defaultFields`
- org/SaaS 多租户层
