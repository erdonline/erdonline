# 产品能力对照表（Capability Map）

> 读者：排期者与 UI 切片实现者。回答一个问题：**后端/SQL 已经能做什么，UI 暴露到哪，缺口是什么**。
> 缺口分级：**missing**（后端能做，UI 不可达）· **thin**（有入口但浅/难找）· **overbuilt**（UI 投入超过能力价值）· ✅（暴露充分，勿重复投资）。
> 维护：每轮迭代收尾核对本表；UI 排期优先消灭 missing，其次 thin，overbuilt 只删不增。

## 版本与审计（北极星直接相关）

| 能力 | API / SQL | UI 暴露面 | 缺口 |
|---|---|---|---|
| 保存版本（快照） | `POST /hisProject/save`（HisProjectController → db_change） | 设计器顶栏「保存版本」常驻 ✅；示例项目通知卡直达 ✅ | ✅ |
| 版本列表 + 多标签筛选 | `POST /dbChange` 分页；`db_change.tag`（Flyway V1 加列、V2 多标签放宽） | 设计器 version tab，tag chips + 筛选 ✅ | ✅ |
| 版本 diff | CompareVersion / VersionDiffPanel | version 页行操作 ✅ | ✅（屏上） |
| 跨版本 diff **导出** | 同 diff 数据，导出管道已存在 | 无 | **missing** → W3 |
| 版本回滚 | RevertVersion → `hisProject/load` + save | version 页行操作「回滚」✅ | ✅ |
| 版本 → 数据源同步 | `POST /connector/dbsync` / `rebaseline` / `checkdbversion` / `updateVersion` | version 页同步状态 tag + SyncConfig/InitVersion ✅ | ✅ |
| 版本删除 / 重建 | `hisProject/delete{,All}` | version 页，二次确认 ✅ | ✅ |

## 分享与传播

| 能力 | API / SQL | UI 暴露面 | 缺口 |
|---|---|---|---|
| 只读分享创建 | `POST /share/create`（token 匿名读，ADR-0007） | 设计器顶栏「分享」一键复制 ✅ | ✅ |
| 分享**吊销 / 链接管理** | `POST /share/revoke` | **无 UI** | **missing** → W2（安全模型承诺的一半不可达） |
| 分享 → fork | `POST /share/{token}/fork` | 分享页 fork + autofork ✅ | ✅ |
| 分享失效态 | `GET /share/{token}` | `Result` 403/404 ✅（W5 顺带打磨） | ✅ |

## 协作

| 能力 | API / SQL | UI 暴露面 | 缺口 |
|---|---|---|---|
| presence + 增量 sync | WsController / SocketIO（ADR-0009） | 设计器顶栏 CollabPresence ✅；远端 sync 提示直达「保存版本」✅ | ✅ |
| 团队/权限三级 | GroupProject / *Privilege 系列 | project/group 子页 ✅ | thin（W4 平移时理顺） |

## 数据进出

| 能力 | API / SQL | UI 暴露面 | 缺口 |
|---|---|---|---|
| 逆向解析（四库） | `POST /connector/dbReverseParse` / `dbReverseMeta`（ADR-0006） | 设计器 import tab ✅ | ✅（复合 FK `fields[]` 延期 ADR-0011） |
| DDL 导出 | export 域 | 设计器 export tab ✅ | ✅ |
| Word 文档导出 | `POST /doc/gendocx`（classpath 模板 + MinIO 缺席降级 ✅） | export 流程内 ✅ | ✅ |
| 数据源管理 | DataSourcesController + `connector/ping` | databaseConfig 页（状态/ping/批量删）✅ | thin（W4 摘 ProTable 平移） |

## 审批与 SQL 信任链

| 能力 | API / SQL | UI 暴露面 | 缺口 |
|---|---|---|---|
| 工单提交/审批 | ApprovalController CRUD；通过必须先 SQL 成功再落库/sync（✅ 已修） | 设计器 version/order/approval tab | thin：入口深埋，W3 平移 + 理顺 |
| 在线 SQL（只读白名单） | `POST /connector/sqlexec`（jsqlparser，仅 SELECT/EXPLAIN/SHOW/DESC） | `design/query` + `dataQuery` 两实验页 | **overbuilt 候选**：control-matrix 📋 延期 → W2 隐藏/删除，不抛光 |

## 数据字典 / 治理

| 能力 | API / SQL | UI 暴露面 | 缺口 |
|---|---|---|---|
| 数据字典 CRUD | DataDictController 全量 CRUD + tree | 仅 `design/dataDomain` 实验页（📋 延期） | thin：本阶段不扩，也不许抛光；P5 产品深度再重估 |

## 死壳与过度建设（只删不增）

| 对象 | 现状 | 处置 |
|---|---|---|
| `pages/design/query`、`pages/dataQuery` | 实验页延期但仍在路由/导航 | W2 隐藏或删除 |
| `pages/design/chatsql` | ADR-0012 明说不做营销包装 | W2 隐藏 |
| `pages/design/dataDomain` | 实验页延期 | W2 隐藏 |
| `pages/JExcel`、`pages/design/test`、`pages/test` | 演示/测试残留 | W2 删除 |
| Home `components/Radar/`、`_mock.ts`、`fakeChartData`、未渲染 `Pie` config | 死代码；统计区两处重复（hero + 项目概览卡） | W2 删除，**不做密度重设计** |
| `account/settings/geographic`（province/city json） | 无后端字段 | W2 删除（先 grep 零引用） |
| `plaza/Material*` 后端控制器 | 前端零引用 | 记入死代码候选，独立切片评估（不动表） |

## 北极星对齐结论

直接服务「每周版本保存」的 UI 缺口只有两类：**版本域收口（diff 导出、审批入口）** 与 **分享吊销/管理**。其余 W 波工作（组件平移、密度抛光）不直接移动北极星，排序一律靠后。
