# 产品能力对照表（Capability Map）

> 读者：排期者与 UI 切片实现者。回答一个问题：**后端/SQL 已经能做什么，UI 暴露到哪，缺口是什么**。
> 缺口分级：**missing**（后端能做，UI 不可达）· **thin**（有入口但浅/难找）· **overbuilt**（UI 投入超过能力价值）· ✅（暴露充分，勿重复投资）。
> 维护：每轮迭代收尾核对本表；UI 排期优先消灭 missing，其次 thin，overbuilt 只删不增。

## 版本与审计（北极星直接相关）

| 能力 | API / SQL | UI 暴露面 | 缺口 |
|---|---|---|---|
| 保存版本（快照） | `POST /hisProject/save`（HisProjectController → db_change） | 设计器顶栏「保存版本」常驻 ✅；示例项目通知卡直达 ✅ | ✅ |
| 版本列表 + 多标签筛选 | `POST /dbChange` 分页；`db_change.tag`（Flyway V1 加列、V2 多标签放宽） | 设计器 version tab：antd List（W3 切片 2）+ tag chips + 筛选 + 空态「保存第一个版本」✅ | ✅ |
| 版本 diff | CompareVersion / VersionDiffPanel | version 页行操作 ✅ | ✅（屏上） |
| 跨版本 diff **导出** | 同 diff 数据，`File.save` 管道 | CompareVersion「导出」→ Markdown 变更清单（模型变更+SQL）/ 仅 SQL ✅（W3 切片 1） | ✅ |
| 版本回滚 | RevertVersion → `hisProject/load` + save | version 页行操作「回滚」✅ | ✅ |
| 版本 → 数据源同步 | `POST /connector/dbsync` / `rebaseline` / `checkdbversion` / `updateVersion` | version 页同步状态 tag + SyncConfig/InitVersion ✅ | ✅ |
| 版本删除 / 重建 | `hisProject/delete{,All}` | version 页，二次确认 ✅ | ✅ |

## 分享与传播

| 能力 | API / SQL | UI 暴露面 | 缺口 |
|---|---|---|---|
| 只读分享创建 | `POST /share/create`（token 匿名读，ADR-0007） | 设计器顶栏「分享」一键复制 ✅ | ✅ |
| 分享**吊销 / 链接管理** | `POST /share/revoke` | 设计器顶栏「分享」弹层：创建/复制/吊销 ✅（W2 切片 1） | ✅ |
| 分享 → fork | `POST /share/{token}/fork` | 分享页 fork + autofork ✅ | ✅ |
| 分享失效态 | `GET /share/{token}` | 无效/吊销 → `AuthBrandShell`「分享不可用」+ 主 CTA「打开示例 demo」+「返回首页」✅（ADR-0016 品牌对齐；W5 切片 2 能力保留） | ✅ |
| 分享只读空态 | 无模型 / 模块 0 表 | `ShareEmptyState`（`ErdEmptyDiagram` + 主 CTA）✅ | ✅ |
| 分享成功态顶栏 | 只读 `/s/:token` | 64px `erd-chrome-header` + logo + 项目名 + Fork CTA + 登录/注册链 ✅（W5 切片 3） | ✅ |
| 404 / 403 页 | 路由 `/*` / `403.tsx` | `AuthBrandShell` +「打开示例 demo」+「返回首页」✅（ADR-0016 品牌对齐；W5 切片 1 能力保留） | ✅ |
| 登录/注册品牌壳 | `/login` `/register` | 左 40% 暗色品牌面板 + 右 Form；`--erd-*`；无 `bg2`/`#1677FF` ✅（W5 切片 4） | ✅ |
| 落地页色板 | `/` | 深色门面构图不变；less 只读 `--erd-*`（ink/brand/success/warning + font）✅（2026-08-03） | ✅ |
| 竞品对照 | `/compare`（落地摘要 `#compare`） | 诚实对照表 + demo/自部署 CTA；`LandingChrome` 共用壳 ✅ | ✅ |

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
| 工单提交/审批 | ApprovalController CRUD；通过必须先 SQL 成功再落库/sync（✅ 已修） | 设计器 version 页：未同步行「提交工单」→ 详情「SQL审批」；工具栏/侧栏「我的工单」「我的审批」直达 ✅（W3 切片 3） | ✅ |
| 在线 SQL（只读白名单） | `POST /connector/sqlexec`（jsqlparser，仅 SELECT/EXPLAIN/SHOW/DESC） | UI 实验页已删（W2）；后端接口保留供版本审批 SQL | **overbuilt 已裁**：control-matrix 📋 延期，本阶段不恢复查询台 |

## 数据字典 / 治理

| 能力 | API / SQL | UI 暴露面 | 缺口 |
|---|---|---|---|
| 数据字典 CRUD | DataDictController 全量 CRUD + tree | 实验页 `dataDomain` 已删（W2）；后端 CRUD 保留 | thin：本阶段不扩 UI；P5 产品深度再重估 |

## 死壳与过度建设（只删不增）

| 对象 | 现状 | 处置 |
|---|---|---|
| `pages/design/query`、`pages/dataQuery` | 实验页延期 | W2 切片 2：源文件 + QueryLeftContent/dialog/query/useQueryStore 已删；路由 404 |
| `pages/design/chatsql` | ADR-0012 明说不做营销包装 | W2 切片 2：源文件已删；依赖 `@chatui/core` 移除 |
| `pages/design/dataDomain` | 实验页延期 | W2 切片 2：源文件已删；路由 404 |
| `pages/design/test`、`pages/test` | 演示/测试残留 | W2 切片 1：已删（`pages/JExcel` 为表编辑组件，保留） |
| Home `components/Radar/`、`_mock.ts`、`fakeChartData`、未渲染 `Pie`、重复「项目概览」、slogan 轮转 | 死代码 | W2 切片 2：已删；`@ant-design/charts` 移除 |
| `account/settings/geographic`（province/city json） | 无后端字段 | W2 切片 1：已删 |
| `plaza/Material*` 后端控制器 | 前端零引用 | ✅ 已删（2026-08-02；Java/XML/MapperScan；表不动） |
| `dialog/import/ReversePDM`（「玩命开发中」） | 菜单零引用 | ✅ 已删（2026-08-02） |
| `pages/design/import/index.tsx` 空壳 | 路由不引用 | ✅ 已删；`component/*` 仍服务 sider 深链，勿整目录删 |

## 北极星对齐结论

直接服务「每周版本保存」的 UI 缺口：分享吊销/管理已 ✅（W2 切片 1）；设计器 chrome 左树去重 + 画布空间回收已 ✅（W2 切片 3）；设计器内 `calc(100vh)` 清零（树/版本页 flex）已 ✅（W2 切片 4）；跨版本 diff 导出已 ✅（W3 切片 1）；version ProList→List + 空态 CTA 已 ✅（W3 切片 2）；审批/工单入口理顺已 ✅（W3 切片 3）。W5 share 顶栏 ✅（切片 3）；登录/注册品牌壳 ✅（切片 4）。
