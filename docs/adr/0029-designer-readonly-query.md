# ADR-0029：设计器只读查询（探库）设计简报

## 状态

提议中（设计简报，非实施决策）——2026-08-09。本文回答「要不要做、做成什么样」，**不**授权开工；进入 roadmap 需人工显式拍板并解封 `control-matrix.md` 中「📋 延期：不扩 JDBC 查询台」的现状。

## 背景

历史上 FE 有一版查询台页面（`pages/design/query`、`pages/dataQuery`），W2 阶段已判定 overbuilt 并删除源码（见 `product-capability-map.md`「死壳与过度建设」）；后端 `QueryInfoController`/`SqlGuard.assertReadOnly` 仍在，但走遗留 `@Dynamic` + `SqlHelperDsManager`（按 `dbName` 字符串路由全局注册数据源），**不**经过项目 `data_sources` 表 + `DataSourceAcl` 这条现代权限路径（ADR-0008/R-DATA-02 修复时特意排除在外）。

用户希望重新认真评估这个功能：入口在哪、进去做什么、要不要留痕，并补充一个此前未覆盖的维度——**多数据库驱动怎么管理**。本文是该评估的结论。

## 决策要点

### 0. 先回答「要不要做」

**结论：做，但缩到最小、且改名**——不做"查询台/SQL Workbench"，只做**「表数据预览」**（英文暂定 `Data Preview`，路由/组件名避免出现 `query`/`sql` 字样）。理由：

- vision.md 明确「不做 dbdiagram 复刻」「不在别人生态位内卷」——一个通用 SQL 执行框（DBeaver/Navicat 那种）正是别人的生态位；但**从画布选中表一键看真实数据**是强绑定在"建模"上下文里的动作，服务的是"我建的模型对不对得上库里的真实数据"这个核心建模疑问，不是通用查询能力
- 命名即产品边界：叫「查询」会不断被用户诉求拉向「能不能加个 WHERE 输入框」「能不能存常用查询」「能不能导出 CSV」——每一步都合理，但走到底就是重建一个被裁掉的查询台。叫「预览」从命名上就先天排斥这些诉求
- 与北极星的关系：不直接产生「版本保存」，但能减少「建完模型却不确定字段/数据对不对」的疑虑，间接降低「建模半途放弃」的流失——是**支撑性**功能，不是杠杆功能，排期优先级应低于任何直接服务北极星的切片

### 1. 入口（入口要少、要与建模强绑定，不与建模抢注意力）

| 入口 | 决策 | 理由 |
|---|---|---|
| 画布表节点底栏「字段 \| 索引 \| 元数据 \| 触发器」旁加第 5 项「预览数据」 | ❌ 不加 | 底栏已经 4 项快到密度上限（design-principles 表节点密表纪律）；且底栏 4 项全是**改模型结构**的动作，预览数据是**看外部真实数据**，语义不同类，混进去会让用户误以为预览数据也能编辑结构 |
| 表节点右键菜单「预览数据…」 | ✅ 加 | 上下文即工具（原则 3）；不占底栏常驻空间；只有绑定了数据源的表才出现该项，未绑定则不出现（不做灰置死 affordance） |
| 左树表节点右键同款「预览数据…」 | ✅ 加 | 与画布对称，键盘漫游用户（左树方向键流）同样可达 |
| 项目菜单 / DesignLayout 侧栏新增一级入口「查询」「数据预览」 | ❌ 不加 | 这正是被裁掉的旧入口的翻版——脱离表上下文的独立入口等于重建通用查询台；且会与「导入/导出/设置」等结构动作抢侧栏位置 |
| Home / 顶栏 | ❌ 不加 | 完全脱离建模上下文，纯粹分心 |
| 命令面板 `Cmd/Ctrl+K` 搜表后追加「预览 {表名} 数据」 | ✅（v1 再加，非 v0 必须） | 高手回路一致性；v0 先只做右键，验证需求再扩键盘入口 |

**首次接触空态**：右键菜单项本身不需要空态设计（菜单项要么出现要么不出现）。预览弹层/面板打开后若表未绑定数据源或数据源未同步该表 → 明确文案「这张表还没连接数据源，去『数据源设置』绑定后可预览真实数据」+ 跳转链接，禁止空白弹层。

### 2. 进去后做什么（流程）

**载体选型**：Drawer（侧滑面板），不用整页路由、不用新 Tab 签。理由：预览是"瞅一眼就关"的轻动作，Drawer 关闭即回到画布原状态，不打断建模流；整页路由（旧版做法）意味着离开设计器上下文，与"支撑性功能"定位不符。

**Happy path**：

1. 表节点/左树右键「预览数据…」→ 若该表 ≥1 个绑定数据源，直接用**当前项目默认数据源**（`profile.defaultDataSourceId`，已有字段）打开 Drawer；若表所在项目有多数据源且未设默认 → Drawer 顶部一个 `Select` 让用户选，选完记住本次会话选择（不写库，纯前端 state）
2. Drawer 打开即**自动执行**按方言生成的 `SELECT * FROM {table} LIMIT/TOP/FETCH 100`（见下「驱动管理」），不需要用户点两次——右键→预览就该看到数据，多一次「运行」点击是摩擦
3. 结果区：只读表格（复用 antd `Table`，非 JExcel——JExcel 是可编辑网格，用在这里会暗示"这些数据能改"）；列头显示字段名 + 从 `projectJSON` 读到的类型（如果模型里有这张表）
4. Drawer 顶部工具条：只有「刷新」「关闭」两个动作 + 一行只读文案「显示前 100 行 · 耗时 xx ms · {数据源名}」；**不做** WHERE 输入框、不做排序点击、不做导出——这些都是"查询台"功能，不是"预览"功能，v0/v1 都不做
5. 失败态：连接失败/超时/SQL 报错 → Drawer 内联错误文案（同「零静默失败」纪律），提供「重试」；不关闭 Drawer、不弹二次 Modal

**与模型树/当前实体选中的关系**：预览是"从表出发"的单向动作，不反向影响画布选中态、不影响当前打开的签页。预览 Drawer 与表设计签、字段编辑器可同时开（Drawer 浮层，不抢 Tab 位）。

**多数据源/多 schema**：一张 `entity` 只对应"当前选中的一个数据源连接"里的"一张真实表"；不做"同时对比多个数据源同名表数据"这种高级功能（v0/v1 非目标）。

**大结果集**：服务端硬顶 100 行（体验默认）+ 500 行硬上限（`PaginationInnerInterceptor.setMaxLimit(500L)` 已是全局配置，天然生效）；前端**不提供**"加载更多"/翻页——预览就是"瞅一眼"，需要看更多数据是运维/DBA 场景，应该去真正的数据库客户端，不是本产品要接的需求。

**超时**：当前 `connector`/`queryInfo` 全套命令都**没有** JDBC 查询超时设置（已实测确认，`Statement.setQueryTimeout` 零调用点）——这是必须补的新工作项，不是"顺带"的：预览必须设 5–10s 服务端超时，超时按「失败态」文案处理（「查询超时，可能是表数据量较大或数据源响应慢」），防止一次预览把连接池打满、拖垮设计器其它接口。

### 3. 留痕 / 审计 / 历史

| 议题 | 决策 | 理由 |
|---|---|---|
| 要不要记 `QueryHistory`（已有实体/表） | **要，但目的是审计不是"最近查询"UX** | 项目里有数据源账密（哪怕加密落库），谁在什么时候对哪个数据源跑过什么 SQL 是安全审计基本盘，尤其自托管场景管理员要能查"谁看过生产数据源的数据" |
| 记录粒度 | 每次预览记 1 行：`projectId` / `dataSourceId` / `tableName` / 执行的 SQL 文本 / 执行人 / 耗时 / 行数 / 成功或失败 | 现有 `QueryHistory` 缺 `projectId`/`dataSourceId`（只有遗留 `dbName`/`queryId`），若复活必须先补这两列（Flyway 加列，遵 schema-migration 规则） |
| UI 是否暴露「历史记录」面板 | **v0/v1 不暴露**；只落库不做前端列表 | 暴露"历史"= 暗示"这是一个值得回顾管理的功能"，会把用户心智从"预览"拉回"查询工作台"；等真出现审计需求（比如团队管理员要看谁查了敏感数据）再单独做一个后台审计视图，不挂在设计器 UI 上 |
| 收藏/常用查询（Saved queries） | **v0/v1 明确不做** | 这是"查询台"最典型的特征功能之一，做了就等于承认这是查询台 |
| 协作可见性：队友能看到我预览了什么表吗 | **不能**，也不应该 | 预览是本地只读探索行为，不是建模变更，不该走协作广播（SocketIO presence/sync）；审计日志是给项目所有者/管理员事后查的，不是实时给队友看的 feed |
| 隐私 | 历史记录里的 SQL 文本本身可能含用户手打的 WHERE 条件（哪怕 v0 没有 WHERE 输入框，`SELECT * FROM t LIMIT 100` 也不含敏感值，风险很低）；**结果数据本身绝不落审计表**，只记 SQL 文本+行数+耗时，不记返回的数据内容 | 避免审计表本身变成第二个敏感数据泄露面 |

### 4. 用户没问但重要的点

**安全**（在 ADR-0008/R-DATA-02 已有基础上，预览功能新增的面）：

- 必须走 `dataSourceId` → `DataSourceAcl.requireOwned` 现代路径，**禁止**复活 `queryInfo/exec` 现在用的 `@Dynamic`/`dbName` 遗留路径（那条路径不做项目成员校验，谁都能猜/枚举 `dbName` 打别的项目数据源）
- 只读白名单沿用现成的 `SqlGuard.assertReadOnly`（SELECT/EXPLAIN/SHOW/DESC，jsqlparser 校验）——不需要新写
- SSRF/DNS-rebind 防护复用 `JdbcUrlGuard.assertAllowedAndPin`（连接前把 host 钉成已放行 IP）——预览功能等于新增一条"任意时刻建临时连接跑 SELECT"的路径，必须走这条防护，不能图省事直连

**权限：谁能预览**：

- 项目成员（`project_user`）才能预览，与项目内其它操作同级——**不**单独设"预览权限"这种新维度（YAGNI；等真出现"我要给某人只读预览不给编辑"这种诉求再拆）
- 只读分享（`/s/:token`）访客**不能**预览——ADR-0008 已规定分享响应清空 `profile.dbs`，访客拿不到任何数据源凭证，预览入口在分享壳里天然不出现（前端按 `shareContext` 隐藏，与 B 层探测同一套 guard）

**版本交互：查的是活库，不是模型快照——必须讲清楚这个错位**：

- 预览连接的是**当前活库的真实数据**，与设计器里的 `projectJSON`/版本快照是两件独立的事（呼应 ADR-0022 双层一致性：projectJSON↔版本 是 A 层，活库 schema 是 B 层，`Data Preview` 是 B 层的"数据"维度，之前 B 层只做了"schema 结构"探测）
- 用户可能在模型里改了字段名/加了字段但还没同步到活库（也可能反过来，活库结构已经改了但模型没重新逆向）——预览这时可能显示"表里没有这一列"或者"这一列在模型里没有"，必须用文案讲清楚，不能让用户以为"预览结果 = 模型当前状态"
- 具体做法：Drawer 顶部沿用 B 层探测已有的语义分离色（`dualLayerTokens`），若已知该数据源与当前模型处于 `behind`/`diverged`（`SchemaProbeCommand` 已有判定），预览结果上方加一行 muted 提示「活库结构可能与当前模型不同步，去『版本』页探测详情」——**复用已有能力，不重新发明**

**速率限制/成本/误伤大表**：

- 每会话/每用户预留一个轻量节流（比如 5 次/分钟），理由不是"省钱"（自托管无 token 成本），是防止一次误操作（比如快捷键连点）把下游数据源连接池打满
- `SELECT *` 误伤大表：v0 固定 `LIMIT/TOP/FETCH 100`，用户在这个功能里**不能**自己改 SQL、不能去掉 LIMIT——从产品设计上直接消灭"不小心跑全表"的可能性，这也是"不做 WHERE 输入框"决策的另一个理由（一旦允许自定义 SQL，就要操心用户是不是打了个没有 LIMIT 的语句）

**移动端**：不适用；产品明确不做移动端（vision.md），预览面板也不用考虑响应式深度适配。

**命名**：已在 §0 定论——「预览数据」/`Data Preview`，禁用「查询」「探库」「SQL」出现在产品可见文案与路由/组件命名里；仅后端内部实现细节（如 Command 类名）可以叫 `PreviewTableDataCommand` 之类，不强制忌讳，但 Controller 路径建议 `connector/tablePreview` 而非 `queryInfo/*`（彻底斩断与遗留路径的语义联系，防止后续维护者顺手把功能又焊回遗留 `@Dynamic` 路径）。

**成功指标**：不是北极星本身，是**先行指标**：「预览使用次数」与「预览后 24h 内是否发生一次非空 diff 版本保存」的相关性——如果用了预览的用户版本保存率没有显著差异，说明这个功能对北极星没有实际拉动，应该降级维护或砍掉。这个指标不需要专门仪表盘，能从 `QueryHistory`（补了 `projectId` 后）+ `db_change` 表跑一次性 SQL 分析即可，不值得为此建产品化报表。

**Kill 条件（dogfood 失败判据）**：

- 上线 4 周内，预览功能使用次数 < 项目活跃数的 10%，且无用户主动反馈"离不开这个"——降级为「维护但不再投入」，不删代码（沉没成本已付，留着比删更省事），但停止任何后续增强（不做 WHERE、不做导出等诉求一律拒绝）
- 若实测发现预览功能显著增加"活库连接池压力"投诉/故障（尤其自托管小内存部署），先加节流/超时收紧，仍无效则收回入口（右键菜单项移除），后端接口保留但不暴露

### 5. 驱动管理（新增维度）

#### 5.1 现状：驱动今天怎么管理的

驱动是**编译期 Maven 依赖**，打进后端 fat jar / Docker 镜像，**没有**运行时动态加载、没有插件市场、没有"上传 driver jar"这类 DBeaver 式机制：

| 驱动 | pom.xml 坐标 | 版本 | 产品面是否已接入 |
|---|---|---|---|
| MySQL（含 MariaDB 兼容） | `com.mysql:mysql-connector-j` | `${mysql.connector.version}` | ✅ ADR-0006 P0 · `JdbcUrlGuard` 白名单 · 前端类型 Select |
| PostgreSQL | `org.postgresql:postgresql` | `42.7.4` | ✅ 同上 |
| Oracle | `com.oracle.database.jdbc:ojdbc8` | `${oracle.connector.version}` | ✅ 同上（`jdbc:oracle:thin\|oci`） |
| SQL Server | `com.microsoft.sqlserver:mssql-jdbc` | `12.8.1.jre11` | ✅ 同上 |
| DB2 | `com.ibm.db2:jcc` | `${db2.connector.version}` | ❌ **零使用**：不在 `JdbcUrlGuard` 协议白名单、不在 `ReverseDialectRegistry`/`DialectIds`、不在前端数据源类型 `Select` 选项——纯声明未接线的死依赖 |

**方言能力矩阵**已有前例：`ReverseDialect` SPI + `DialectCapability` + `ReverseDialectRegistry`（ADR-0006），但服务对象是"逆向解析元数据"（读表/列/索引/FK/触发器结构），不服务"执行任意 SELECT 并分页返回结果"——预览功能不能直接套用这套 SPI，只能借鉴其**模式**（按 `DialectIds` 做能力表驱动，而不是散落 `if (dbType)`）。

**连接凭据解析**已有现代路径：`ConnectorCredentialResolver.apply()` 按 `dataSourceId` 经 `DataSourceAcl` 拿到 `driverClassName`/`url`/`username`/`password`；若 `data_sources.driverClassName` 留空，`defaultDriver(type)` 按 4 种类型给内置默认类名兜底（`com.mysql.cj.jdbc.Driver` / `org.postgresql.Driver` / `oracle.jdbc.OracleDriver` / `com.microsoft.sqlserver.jdbc.SQLServerDriver`）——**预览功能必须复用这条路径**，不新建一套。

**分页方言差异**：好消息是 MyBatis-Plus 的 `PaginationInnerInterceptor`（`MartinDataAutoConfiguration`）**没有固定 `dbType`**，按每次实际 JDBC 连接的元数据自动探测方言生成对应的 `LIMIT`/`TOP`/`ROWNUM` 分页 SQL——这是已经在生产验证过的机制（`queryInfo/exec` 现有实现已经这样用），预览功能复用同一模式不需要自己处理分页方言。

**已知真坑**：`QueryInfoMapper.xml` 里 `explain ${sql}` 硬编码 `EXPLAIN <sql>` 语法，只对 MySQL/PostgreSQL 有效；Oracle 需要 `EXPLAIN PLAN FOR ...` 再查 `PLAN_TABLE`，SQL Server 用 `SET SHOWPLAN_ALL ON` 会话级开关——四库根本没有统一 `EXPLAIN <SQL>` 语法。**结论：预览功能 v0/v1 不做 explain/执行计划**，这本来就是"查询台"特征功能，不是"预览"该有的。

#### 5.2 v0/v1 方言范围

- 只服务 **P0 四库**（MySQL/MariaDB、PostgreSQL、Oracle、SQL Server）——与逆向解析 P0 对齐，复用同一批已声明驱动，**不新增任何依赖**
- `LIMIT`/`TOP`/`FETCH` 差异**不需要预览功能自己处理**：交给 MP 分页插件自动探测（见上），前提是 SQL 通过 `exec(Page, sql)` 这种注入 `IPage` 参数的调用方式，且用户不能在 SQL 里自带 `LIMIT`（v0 不给用户写 SQL 的入口，天然规避这个冲突）
- **Prefill 模板必须按方言生成**——这是预览功能唯一真正需要"自己管方言"的地方：

  | 方言 | Prefill 模板 |
  |---|---|
  | MySQL / MariaDB / PostgreSQL | `` SELECT * FROM `t` LIMIT 100 ``（PG 用双引号 `"t"`） |
  | SQL Server | `SELECT TOP 100 * FROM [t]` |
  | Oracle | `SELECT * FROM "T" FETCH FIRST 100 ROWS ONLY`（12c+ 语法；本项目定位新项目自建库，不兼容 11g 及更早） |

  标识符引用规则也要按方言给对（`` ` ``/`"`/`[]`），否则遇到保留字/大小写敏感表名会直接语法报错——这是"看起来能点却点了报错"的死 affordance，必须在生成 prefill 时处理，不能偷懒拼裸表名。

- Explain/执行计划：v0/v1 不做（见上「已知真坑」）。

#### 5.3 驱动打包 / 升级 / 安全

- 版本集中在 `pom.xml` 顶部 `<properties>`（`mysql.connector.version`/`postgresql.connector.version`/`oracle.connector.version`/`sqlserver.connector.version`），升级只改一处版本号 + `mvn verify`；**当前没有 Dependabot/Renovate 自动化**，是既有 gap，不在本次预览功能范围内新增负担，但值得记一笔到 roadmap 安全清单
- 镜像体积：4 个 JDBC driver 合计几 MB 级（`ojdbc8` 最大，约 4MB；`mssql-jdbc` 约 1.5MB），相对 Boot fat jar 整体量级可忽略；**DB2 `jcc` 驱动是纯浪费**——零产品面使用却打进每个镜像，属于 `delete-dead-code` 规则的典型目标，建议独立提一刀清掉（不阻塞本 ADR，也不属于查询功能改动范围，只是顺手记录发现）
- 预览功能**不新增任何驱动依赖**，完全复用 connector/reverse 模块已声明的 4 个驱动；**不做**运行时动态下载/加载驱动 jar——那是多租户 SaaS（用户各连各的冷门库）才需要考虑的复杂度，本项目是自托管单体，运维要接新库类型走"改 pom + 重新构建镜像"完全够用，做插件化驱动市场是过度设计

#### 5.4 新增驱动的流程（未来某天要支持第 5 种库时）

1. `pom.xml` 加依赖坐标 + 版本号 property
2. （可选，若要逆向解析精度）实现 `ReverseDialect` SPI，注册进 `ReverseDialectRegistry`
3. `ConnectorCredentialResolver.defaultDriver()` / `buildJdbcUrl()` 各加一个 `case` 分支
4. `JdbcUrlGuard` 协议白名单加对应 `jdbc:xxx` 前缀
5. 前端 `DatabaseConfigForm` 类型 `Select` 加一项 + `dbTypeMap`/`defaultPorts` 补一行
6. 预览功能这边只需要在 §5.2 的 prefill 模板表里加一行——如果新库属于 ANSI SQL:2008 `FETCH FIRST` 家族（新版 PG、DB2、H2、较新 MySQL 也支持但项目仍用 `LIMIT` 保持一致性)直接复用 Oracle 分支即可，不需要新写分页逻辑（MP 分页插件已经自动探测）

**非目标**：不做插件化驱动加载/驱动市场；不支持用户运行时上传 driver jar；预览功能不服务"未登记类型"的裸 JDBC URL（`dataSourceId` 强制要求，见 §5.5）。

#### 5.5 连接解析路径（必须明确，防止走回遗留路径）

预览功能**必须**走 `connector/*` 现代路径而不是 `queryInfo/exec` 现在用的遗留路径：

- 请求体只带 `dataSourceId`，后端复用 `ConnectorCredentialResolver`（新增一个语义等同 `applyMutate` 但改用只读校验的 `applyQuery`/`applyProbe` 分支）解析出 `driverClassName`/`url`/`username`/`password`
- 用解析出的信息复用 `AbstractDBCommand` 现成的连接建立逻辑（已含 `JdbcUrlGuard.assertAllowedAndPin` 的 SSRF/DNS-rebind 防护），临时开一条只读连接，跑 `SqlGuard.assertReadOnly` 校验过的 SQL，用完关闭连接（不进连接池常驻，预览是低频轻量动作，没必要占用连接池资源）
- **不经过** `@Dynamic` 注解、不经过 `SqlHelperDsManager` 的全局注册数据源表——现有 `QueryInfoController`/`QueryInfoServiceImpl` 因此**不能直接复活**，落地时是"新写一个 `connector/tablePreview` 端点"，不是"给旧 Controller 解禁"

#### 5.6 失败态（用户可见）

| 失败场景 | 用户可见文案 | 处理方式 |
|---|---|---|
| 数据源类型超出 P0 四库（边界情况，前端目前只给 4 个选项） | 「暂不支持该数据库类型的在线预览」 | 服务端能力表驱动判断，不裸抛异常 |
| 驱动类加载失败（`ClassNotFoundException`，通常是手填 `driverClassName` 填错） | 「连接失败：驱动不可用，请检查数据源设置里的驱动类名」 | 不暴露 Java 异常堆栈/包名 |
| 方言探测失败（分页插件拿不到连接元数据，比如连接池代理类不透明） | 无感知：服务端兜底降级为固定 `LIMIT 100` 硬拼接，不透传给用户 | 宁可退化成"总是 100 行"，不能语法直接炸裂 |
| 查询超时（新增：当前全线路零 `setQueryTimeout` 调用，必须补） | 「预览超时，可能是数据量较大或数据源响应较慢」+「重试」 | 服务端 5–10s `Statement.setQueryTimeout` 硬顶 |
| SQL 执行报错（表已被删/字段类型不兼容等） | 直接展示数据库驱动返回的可读错误信息（已有 `ExceptionUtil.getCausedBy(e, SQLException.class)` 模式可复用） | 复用 `queryInfo/exec` 现成的错误提取逻辑 |

### 6. 分期

| 阶段 | 范围 | 明确非目标 |
|---|---|---|
| v0 | 画布/左树表右键「预览数据…」→ Drawer；自动跑方言化 `LIMIT/TOP/FETCH 100`；只读表格；刷新/关闭；失败态文案；`dataSourceId` 现代路径 + `SqlGuard.assertReadOnly` + `JdbcUrlGuard` 复用；服务端超时 + 节流；`QueryHistory` 补 `projectId`/`dataSourceId` 落库审计（不做前端历史面板） | WHERE 输入框、自定义 SQL、排序/筛选、导出、explain、收藏、多表 JOIN、协作可见性、命令面板入口 |
| v1（视 v0 dogfood 结果决定要不要做） | 命令面板搜表后追加「预览」入口；与 B 层探测（`behind`/`diverged`）的语义提示联动；轻量分页（下一页 100，仍不做 WHERE） | 仍不做：自定义 SQL、导出、收藏、explain、跨数据源对比 |
| Later（需要重新立项，不是本 ADR 范围） | 若团队强烈诉求"能不能自己写 WHERE"——**应该拒绝**并引导去真正的数据库客户端；若确实要做，需要重新过一遍安全模型（自定义 SQL = 重新打开"用户可控 SQL 执行面"，不是加个输入框那么简单）且需要新的 ADR，不能顺着 v0/v1 自然长出来 | — |

## 后果

- 正：右键"预览数据"能低成本回答"我建的模型跟真实数据对不对得上"，减少建模中途因不确定而放弃的摩擦；复用现成的 `SqlGuard`/`JdbcUrlGuard`/`ConnectorCredentialResolver`/MP 分页插件，几乎不新增安全面
- 正：命名与范围双重收紧（"预览"而非"查询"，无 WHERE/无自定义 SQL），从产品设计上排除了"变成第二个查询台"的路径依赖
- 负：`QueryHistory` 需要补列迁移（Flyway）；新增服务端超时/节流是当前遗留路径缺失的能力，需要新写而非复用
- 负：这是一个北极星支撑性功能而非杠杆功能，若排期时误判优先级会挤占直接服务"版本保存"的切片时间——本 ADR 建议排期时明确标为低于任何 P3 版本工作流/协作类切片
- 遗留 `QueryInfoController`/`SqlGuard.assertReadOnly` 现有代码：已核实全仓仅 `QueryInfoServiceImpl` 调用 `assertReadOnly`，审批/工单模块的「查看 SQL」明细走的是纯文本展示，不经过这条执行路径——预览功能落地后，遗留 `@Dynamic` 路径可整体下线（Controller/ServiceImpl/Mapper 一起清），另开一次 `delete-dead-code` PR，不在本 ADR 内处理

## 关联

- [ADR-0006](./0006-reverse-dialect-spi.md) 多库逆向 Dialect SPI —— 方言能力表驱动模式的先例
- [ADR-0008](./0008-datasource-isolation.md) 数据源隔离 —— 预览必须走的现代凭据路径
- [ADR-0022](./0022-dual-layer-consistency.md) 双层一致性 —— 预览结果与模型快照错位的语义解释框架
- [ADR-0024](./0024-datasource-credential-encryption.md) 数据源凭证加密 —— 预览解密凭据的路径与本 ADR 一致
- `security-model.md` R-DATA-01/02 —— 只读白名单与 SSRF 防护现状
- `product-capability-map.md`「死壳与过度建设」—— 旧查询台被裁的历史决策，本 ADR 不推翻该决策，只是在其边界外提出一个更小的替代方案
