# 路线图 / Roadmap

> 公开路线图。欢迎通过 [Issues](https://github.com/erdonline/erdonline/issues) 与 [Discussions](https://github.com/erdonline/erdonline/discussions) 影响它。
> 状态标记：✅ 已完成 · 🚧 进行中 · 📋 已规划

## 当前状态

工程与设计器为**可用雏形**：核心旅程可跑；数据源已按 ADR-0008 隔离。联调基线：`./scripts/audit-fe-apis.sh`。

**下一阶段战略（服务北极星，不推翻愿景）**：P2b 矩阵 🚧 已清零（见 [control-matrix.md](./control-matrix.md)）；余下矩阵 📋 为延期（论坛外链、VIP 角标、实验 query/ChatSQL/dataDomain/dataQuery 等，见矩阵）。

## 下一季只做三件事（北极星杠杆）

按序推进，一次只做一件。三件事均 ✅ 后 **不 idle**：Vision 5m 循环按 [ADR-0016](./adr/0016-experience-first-shareable-diagram.md) 双轨（体验=敢分享的美图；能力=维护版本/分享）继续发明下一刀（见 `scripts/agent-loop-vision.prompt.md`）：

1. **首屏叙事 + 示例项目 → 30 秒进版本保存**（激活；服务「30s 惊艳」+「每周版本」北极星）✅（示例就绪 CTA + 顶栏「保存版本」✅；计时 E2E `activation-30s.spec.ts` 墙钟基线 ~3.5s ≤30s ✅ 2026-08-02）
2. **导出/版本信任链打穿**（Word/MinIO 解耦或降级、审批通过路径、导出失败可见）✅（导出失败可见 ✅；Word/MinIO 解耦：classpath 默认模板 + MinIO 缺席降级 ✅；审批通过路径：SQL 失败不落通过/不 sync ✅ 2026-08-02）
3. **协作 → 版本自然发生**（presence 到「本周一起改并保存」的引导，不扩 AI）✅（远端 sync 提示带「保存版本」直达版本页，节流 ≤1/min/会话；全路径 E2E：toast→CTA→AddVersion 落库 + 60s 节流回归 ✅ 2026-08-02）

**依赖外部或后置**：AI、i18n、正式仓 Issue 投放（`REPO=… ./scripts/seed-good-first-issues.sh`，待正式仓就绪）。

## P5：AI 时代数据结构平台 🚧

> 依据 [ADR-0012](./adr/0012-ai-era-data-structure-platform.md)（**已接受 · 选项 B**）：「数据库设计的 Git + Figma + AI agent 可读的开源事实源」，关键词 **开放 + 安全**。落地页先行；API/MCP 受 [ADR-0013](./adr/0013-public-api-mcp.md)（📋）约束，需求清晰前不实现。

### 落地页（公开，品牌优先，一个构图）✅

- 公开路由 `/`（未登录可访问）；登录「了解产品」回链；未登录主 CTA → `/demo`，已登录主 CTA → `/home`
- 实现约束：品牌优先 + **全幅**真实画布截图（`landing-hero.jpg`），禁止侧栏嵌图 / 紫色渐变 AI slop；见 [landing.md](./landing.md)
- E2E：`landing.spec.ts`（加载 + CTA→demo/登录 + 已登录→工作台）✅

### 产品深度（走出「thin CRUD」）📋

- 数据字典 / 治理：字段级文档、枚举域、跨表复用（承接 📋 dataDomain 实验页的定位重估）
- 逆向保真🚧：~~FK 约束名 + ON DELETE/UPDATE~~✅（`constraintName`/`deleteRule`/`updateRule`；复合仍拆边同名）、复合 FK `fields[]`（ADR-0011 **仍延期**，解封=FE 多字段边协议）、~~PG 表/列注释 → chnname~~✅（字典 `obj_description`/`col_description`）、~~SQL Server 表/列注释 → chnname~~✅（`MS_Description`）、~~Oracle 表/列注释 → chnname~~✅（`ALL_TAB_COMMENTS`/`ALL_COL_COMMENTS`）、~~列默认值 `COLUMN_DEF` → `defaultValue`~~✅（JDBC 通用）、~~索引已字典化~~✅、~~PG/MySQL 表达式·函数索引 → `indexs[].fields[]`~~✅（`pg_get_indexdef` / `STATISTICS.EXPRESSION`）、~~Oracle/SQL Server 函数·计算列索引 → `indexs[].fields[]`~~✅（`ALL_IND_EXPRESSIONS` / `sys.computed_columns.definition`；P0 四库闭环）、~~索引签字段/表达式可编辑~~✅（JExcel text；分号混写；persist-on-200）、~~MySQL 触发器 → `triggers[]`~~✅（`INFORMATION_SCHEMA.TRIGGERS`）、~~PG 触发器 → `triggers[]`~~✅（`information_schema.triggers`）、~~SQL Server 触发器 → `triggers[]`~~✅（`sys.triggers`）、~~Oracle 触发器 → `triggers[]`~~✅（`ALL_TRIGGERS`+`ALL_SOURCE`；P0 四库闭环）
- 版本工作流：分支式演进、~~版本标签/里程碑~~✅（`db_change.tag` 逗号分隔多标签 + chips 筛选；无跨版本唯一）、~~跨版本 diff 的导出~~✅（W3 切片 1：Markdown 变更清单 + SQL）
- 协作 → 版本自然发生（下一季③ ✅）；后续深化见版本工作流（分支式演进等）

### UI 水位（Strangler，不重写）🚧

- CRUD 壳维持 antd（ADR-0005），设计域沉淀自研视觉系统（节点/工具条/命令面板已成体系）；[ADR-0016](./adr/0016-experience-first-shareable-diagram.md) 美图主线：品牌 token ✅ → 导入/逆向 dagre 分层布局 ✅ → 节点密度/PK·FK 徽章/箭头边 ✅ → 边路由（同表对多 FK 肘距分流 + 自定义 erdSmooth）✅ → 示例/默认布局密度（手排收紧 + dagre 56/108 + Frame padding 24）✅ → 边障碍避让（centerX / bypassY 绕中间表）✅ → 正交 edge bundling（同 midX 通道干道分流）✅ → 两弯绕行 / mid-corridor（escapeX + 叠表缝）✅ → 稀疏 Hanan A* ✅ → 密 FK 导入走查 + 绕行竞短 ✅ → 分享只读同路由 + hub 扇出 ✅ → **表节点卡片层次（muted 表头 + 行分隔 + PK 色条）✅** → **几何择柄（竖叠同侧短 U）✅** → **Frame 主题色板 + 三壳清硬编码 ✅** → **边标签 chip 可读 ✅** → **导入后 Frame 自动建议 ✅** → **基数可编辑（1:1/1:n/n:1/n:n）✅** → **Frame 双击重命名 ✅** → **同侧 sameSide 外肘 + mid-corridor 竞短 ✅** → **Crow's foot 端点（IE，随基数）✅** → **空态构图打磨 ✅** → **分享顶栏品牌对齐（W5 切片 3）✅** → **登录/注册品牌壳（W5 切片 4）✅** → **落地页 token 同源 ✅** → **密图密度微调（demo 手排 + 分享 fitView / relationNoShow）✅** → **字段行再压一档（min-height 22 / FIELD_ROW_H 26）✅** → **导入后首屏打磨（空态导入 CTA + fitView 同分享密）✅** → **竞品对照子页 `/compare` ✅** → **边标签密度 + Frame padding 20 ✅** → **Frame 标题栏密度 + MiniMap sunk 对齐 ✅** → **Controls 面板密度（22px + surface chrome）✅** → **选中光晕统一（表/Frame a18）✅** → **画布工具栏再收（22 / font 11）✅** → **空态面板再收（14/18 pad + CTA 26）✅** → **命令面板密度（440 / 输入 36）✅** → **实体新建弹层密度（宽 400 / 输入 28）✅** → **左树行高密度（22 / font 12）✅** → **CommonTabs/签头密度（tabs ~24，再压不 clip）✅** → **版本列表行密度（pad 4×8 / 标题 13）✅** → **导入/导出弹层密度（`.erd-io-modal` 头脚 22–28）✅** → **普通导出页 ExportCommon 卡片密度（pad 8×10 / 标题 13）✅** → **设置页 chrome 密度（DefaultSetUp / DefaultField + 菜单弹层 `.erd-io-modal`）✅** → **数据库配置页密度（`/databaseConfig` + 菜单「数据源设置」`.erd-io-modal`）✅** → **账号设置 + Home 项目卡密度（22–28 chrome / `.erd-io-modal`）✅** → **个人/最近项目列表行密度（`.project-list-page` 22–28）✅** → **团队项目列表行密度（`/project/group` 同 `.project-list-page`）✅** → **公告列表行密度（`/project/notice` 同 `.project-list-page`）✅** → **分享只读多关系图切换（`diagram-switcher` / ADR-0017）✅** → **分享画布视口铺满（480→stage flex）✅** → **分享只读表清单折叠（底条展开 affordance）✅** → **分享 meta hint/描述密度 ✅** → **分享展开表清单行密度（22–28 / project-list）✅** → **边标签碰撞避让（AABB chip）✅** → **分享失效/空态品牌对齐（AuthBrandShell + ErdEmptyDiagram）✅** → **404/403 AuthBrandShell ✅** → **关系图 SCSS 清 brand 裸 rgba ✅** → **PK/FK/hover 行浅底 color-mix ✅** → **字段行扫读层次（名 500/PK 600 + 类型右对齐）✅** → **关系线默认描边权重/对比（ink900 + 2px）✅** → **表头标题层次（title 14/700 vs chnname 10/400）✅** → **空态 CTA 层次（唯一主钮 + 次链）✅** → **基数 chip 扫读层次（12/600/ink900）✅** → **PK/FK 徽章扫读层次（10/700 + min-width 22）✅** → **画布工具栏/Controls 扫读层次（单块 chrome + 主操作）✅** → **表节点密表再压（表头 pad 6 / 字段 minH 20 / FIELD_ROW_H 24）✅** → **Frame 标题扫读（label 12/700 vs meta muted，chrome 22）✅** → **画布工具栏「新建表」一键上图（建模回路）✅** → **连线失败可见反馈（重复/非法锚点 toast）✅** → **画布工具栏「新建表」一键上图（建模回路）✅** → **连线失败可见反馈（重复/非法锚点 toast）✅** → **字段行 ✎ 内联编辑 + 空名 toast（建模回路）✅** → **字段 Tab 跳行 + 类型即时 save-status（建模回路）✅** → **末行 Tab 新建字段（建模回路）✅** → **编辑态 PK 勾选即时 save-status（建模回路）✅** → **编辑态非空勾选即时 save-status（建模回路）✅** → **编辑态自增勾选即时 save-status（建模回路）✅** → **编辑态隐藏 relationNoShow 即时 save-status + 表底恢复（建模回路）✅** → **编辑态 Escape 取消改名（拦 blur，建模回路）✅** → **Delete/Backspace 删字段二次确认（建模回路）✅** → **字段 chnname 内联 + Tab 入中文名（建模回路）✅** → **表头实体 chnname 内联（建模回路）✅** → **字段 defaultValue 内联 + Tab 入默认值（建模回路）✅** → **画布打开表设计「索引」签（建模回路）✅** → **画布对称打开「字段」签（建模回路）✅** → **索引签空态 CTA「添加第一个索引」（建模回路）✅** → **画布打开「元数据应用」签（建模回路）✅** → **索引签再加一行 CTA（建模回路）✅** → **左树删除模型/关系图二次确认 ✅** → **左树重命名关系图接通 ✅** → **左树新建关系图路径 E2E ✅** → **左树「关系」文件夹 + 直建图 ✅** → **左树「编辑表」开表设计字段签（重命名另项）✅** → **字段级 unique 说明（索引唯一 CTA + 画布 UK）✅** → **元数据应用修改/删除字段签对齐模板 ✅** → **左树搜索 × 清过滤 + 无匹配空态 ✅** → **命令面板搜表定位/高亮 ✅** → **设计器 Skip + 焦点环（树/签·画布）✅** → **表设计 Cmd/Ctrl+1/2/3/4 签页直切✅** → **画布字段浏览器 Tab 环✅** → **画布 chrome Tab 序（Controls/工具栏；MiniMap 出序）✅** → **左树键盘漫游✅** → **画布节点级 Tab✅** → **分享壳键盘✅** → **登录壳键盘✅** → **注册壳键盘✅** → **落地页键盘打磨✅** → **404/403 壳键盘✅** → **分享失效门键盘✅** → **`/compare` 竞品对照页键盘✅** → **Home 工作台键盘✅** → **GroupLayout 壳键盘✅** → **项目列表行键盘✅** → **账号设置壳键盘✅** → **项目动作弹窗键盘✅** → **导入/导出弹层键盘（DBML）✅** → **版本动作弹窗键盘（新增/编辑/删除/回滚）✅** → **版本对比/详情 diff 键盘✅** → **同步配置/重建版本弹层键盘✅** → **初始化基线弹层键盘✅** → **Cmd+K 命令面板键盘 polish✅** → **签头密度再压（tabs ~24 / 不 clip）✅** → **左树工具条/次密距（24 / pad 4）✅** → **版本列表二次密度/碎色（工具条 24 + token）✅** → **版本工单/审批列表密度（标题栏 ~24 / 行 pad 4×8）✅** → **设计器次屏表密度（JExcel + 版本 diff ~24）✅** → **元数据应用子签 / CodeTab chrome（~24 / 不 clip）✅** → **表设计内签栏显式 ~24（字段/索引/元数据/触发器）✅** → **右键/树操作菜单密度（`.erd-dense-menu` ~28）✅** → **空表设计/空表字段引导（字段签 + 画布 CTA）✅** → **签体内容次密距（pad 6/4 + hint/tip ~24）✅** → **设计器 Empty / 次屏空态次密距（禁 marginTop:100 + 压 marginXL）✅** → **欢迎空态次密距（pad 32×24 / hero 176）✅** → **AuthBrandShell 次密距（32×28 / 表单 pad32）✅** → **LandingChrome / `/compare` 次密距（section 2.75 / 对照行 0.5）✅** → **版本同步结果弹层键盘** ✅ → **Oracle 逆向注释保真** ✅ → **触发器逆向（P0 四库）** ✅ → **FK 约束名+ON DELETE/UPDATE** ✅ → **分享表清单分页** ✅ → **表设计触发器签（list/DDL/CRUD）** ✅ → **DBML Enum ↔ dataTypeDomains** ✅ → **DBML 表达式索引 ↔ `indexs[].fields[]`** ✅ → **逆向 PG/MySQL 表达式索引** ✅ → **索引签字段/表达式可编辑** ✅ → **逆向 Oracle/SQL Server 函数·计算列索引** ✅ → 下一刀：P4 demo（Railway + `DEMO_API_URL`）/ 数据字典·枚举域 / SQL Server 过滤索引谓词；ADR-0013 人工；复合 FK `fields[]`（ADR-0011 仍延期）
- 逐页抬水位：每轮迭代顺带提升所在页密度与反馈，禁止全站大改版
- Home / 模型页重设计简报：[ui-home-model-redesign.md](./ui-home-model-redesign.md) ✅（2026-08-02；决策：Home 走工作台式亮色系统，落地页保留深色门面；**S1–S3 ✅**：tokens + hero CTA + 项目网格 IA 收口 / 去快速操作墙 / 公告新鲜度 / Menu brand）
- **全站布局重设计总纲**：[ui-layout-redesign.md](./ui-layout-redesign.md)（2026-08-02 v2 重估：能力暴露优先于表现层；分波 W1 设计器壳 ✅ → **W2 能力暴露+空壳清除**（切片 1–4 ✅：分享吊销、Home 死码/实验页删除、设计器 chrome 左树去重+sider 320+tabs 40+flex、设计器内 `calc(100vh)` 清零）→ **W3 版本域收口** ✅（切片 1 ✅ 跨版本 diff 导出；切片 2 ✅ version ProList→antd List + 空态 CTA；切片 3 ✅ 审批/工单入口理顺；2026-08-02 顶栏右「我的工单/待审批/通知」可发现入口 + 项目菜单导出串台修复）→ **W4** 项目列表/数据源平移（切片 1–15 ✅；切片 15 ✅ 末 7 文件清零 + 依赖移除）→ **W5** 登录/分享/404 打磨（切片 1–4 ✅：404/403、分享失效态、share 顶栏 64px、登录/注册品牌壳）+ **落地页 token 同源 ✅**；能力对照见 [product-capability-map.md](./product-capability-map.md)）
- **Pro Strangler**（[ADR-0014](./adr/0014-drop-or-strangle-ant-pro.md) ✅ 已落地 · B）：`@ant-design/pro-components` / `umi-presets-pro` 已从 `package.json` 移除；`rg …pro-components` = 0；自研 Home/Group/Design Layout + antd 表单/表格承接

### 开放（Openness）📋 — API/MCP 见 ADR-0013

- ~~projectJSON 公开 schema 文档化（schema-as-code，`data-format.md` 升级为对外规范）~~✅（2026-08-02：[`data-format.md`](./data-format.md) + [`schema/projectjson.schema.json`](../schema/projectjson.schema.json) + `scripts/validate-projectjson.mjs`；解锁 ADR-0013 触发条件 #3）
- 只读 API / MCP server：鉴权、限流、scope **待 ADR-0013 拍板**；本阶段不写实现代码
- 导入/导出互通：DBML / dbdiagram 格式互转，降低迁移成本；插件机制后置 — ✅（2026-08-02：导入+导出 Table/fields/FK/note↔chnname + Indexes↔`indexs` + `default`↔`defaultValue` 闭环；**Enum↔`dataTypeDomains.datatype` kind=enum ✅（2026-08-03）**；**表达式索引↔`indexs[].fields[]` 原样字符串 ✅（2026-08-03）**；**trigger 文档延期**：`@dbml/core` 无块、`Note` 禁塞）

### 安全（Security）📋

- 分享 token：只读分享（ADR-0007）+ 未来 API token 的 scope/吊销/过期模型（随 ADR-0013）
- CSRF/CORS 已收敛（第 1 轮 ✅），SQL 执行信任链已修（审批失败不落通过 ✅）——写入型 API 沿用同级约束
- ~~密钥纪律：连接信息不进 projectJSON（ADR-0008 已隔离），文档化对外承诺~~✅（[`data-format.md`](./data-format.md)「密钥纪律」+ [security-model.md](./security-model.md)）
- ~~项目 / dataSources IDOR（R-AUTH-03/04）~~✅（`ProjectAcl` / `DataSourceAcl`；登记见 [security-model.md](./security-model.md)）
- ~~connector 凭证改走已鉴权 dataSources id（R-DATA-02）~~✅（后端 `dataSourceId`→ACL；FE 热路径只传 id；mutate 强制 id + IMDS/链路本地拦截）
- ~~上传归属（R-DATA-04）~~✅（删测试上传口；Word 模板 `.docx`+`projecterd/{projectId}`+`ProjectAcl`；见 [security-model.md](./security-model.md)）
- ~~SocketIO Origin / CORS 生产默认（R-CFG-04）~~✅（`CrossOriginPolicy` prod 拒 `*`；单一 `ERD_UI_URL` fail-fast；见 [security-model.md](./security-model.md)）
- ~~UserController 权限（R-AUTH-02）~~✅（`sys_user_*` `@PreAuthorize`；见 [security-model.md](./security-model.md)）
- ~~SocketIO 项目成员（R-AUTH-05）~~✅（握手 + `JOIN_ROOM` 验 `project_user`；见 [security-model.md](./security-model.md)）
- ~~开放注册双入口（R-AUTH-06）~~✅（单入口 + `allow-open-register` prod 默认关；见 [security-model.md](./security-model.md)）
- ~~TestJson 样板面（R-DATA-05）~~✅（删 Controller/Service/Mapper/Entity；见 [security-model.md](./security-model.md)）
- ~~应用库 JDBC `useSSL=false`（R-CFG-03）~~✅（双 DS env 驱动 TLS；prod 默认开；compose 关；见 [security-model.md](./security-model.md)）
- ~~`frameOptions` 恢复（R-AUTH-07）~~✅（API `DENY`；分享走 SPA；见 [security-model.md](./security-model.md)）
- ~~ignore 假路径 / 假开关（R-DEAD-01/02/03）~~✅（删 `martin.swagger`/`resource-server`；ignore 去 `/endpoint/**`；见 [security-model.md](./security-model.md)）
- ~~OSS 默认密钥 / `.env.example` OAuth 死键（R-CFG-05/06）~~✅（嵌套 minio 空默认 + `OssCredentialGuard`；删 `OAUTH_CLIENT_*`；见 [security-model.md](./security-model.md)）
- ~~SocketIO 9092 公网裸放说明（R-OPS-03）~~✅（deployment 防火墙约定）
- ~~连接器 DNS 重绑定（R-DATA-02 残余：resolve 后再判 IMDS）~~✅（`JdbcUrlGuard` `getAllByName`；仍允 RFC1918）
- ~~连接器 check→connect TOCTOU（R-DATA-02 残余：钉解析 IP）~~✅（`assertAllowedAndPin` → `AbstractDBCommand`/`JdbcKit`/`DynamicAspect`；仍允 RFC1918）
- 下一刀：raw ping·reverse JDBC 面 / 贡献者路径（见 security-model R-DATA-02）
### 用户没说的缺口（主动补齐）📋

- 贡献者漏斗：good-first-issue → 首个 PR → 维护者的路径文档化（`community.md` 延伸）
- ~~Schema 版本化对外承诺：projectJSON 兼容性政策成文（agent 依赖稳定性）~~✅（`data-format.md`「仅加法 / 禁止原地破坏」）
- ~~Agent 可读 projectJSON：机器可校验的 JSON Schema + 示例~~✅（`schema/` + `node scripts/validate-projectjson.mjs`）
- ~~可观测性：自部署者的健康检查/指标端点（少量、低成本）~~✅（`/actuator/health` + `/actuator/info` app/version；未暴露路径 404；见 [deployment.md](./deployment.md)）
- ~~自部署 DX：docker-compose 一键起的文档化验收 + 升级路径演练~~✅（`scripts/verify-self-deploy.sh` + [deployment.md](./deployment.md) 验收/升级演练；Flyway 不靠重跑 `db/init`）
- ~~竞品对比页：vs dbdiagram / dbml 的诚实对照（协作/版本/开放/自部署），落地页子页~~✅（`/compare` + 落地摘要表；E2E `compare.spec.ts`）

## 阶段总览

| 阶段 | 目标 | 关键交付 | 状态 |
|---|---|---|---|
| 第 0 轮：验证基建 | 一切迭代的前提 | 全栈一键起；Playwright 核心旅程冒烟进 CI | ✅ 2026-08-01 |
| 第 1 轮：交互急救包 + P0 安全 | 现有页面不闹心；让别人敢用 | ~~静默失败补反馈~~✅；~~undo/redo 接线~~✅；~~删除确认~~✅(代码)；~~CORS/CSRF 收敛~~✅；~~硬编码密码清除~~✅(prod fail-fast)；~~/oauth/token 500→401~~✅；~~关系图入口~~✅；~~fastjson→Jackson~~✅(第 2 轮完成)；~~create_time 填充~~✅；~~卡片死链~~✅；~~dev 回路提速~~✅ | ✅ |
| 第 2 轮：质量基线 | 让贡献者敢改 | ~~Boot 3.5.16 + JDK 17 + JWT~~✅；~~删死代码~~✅；~~fastjson→Jackson~~✅；~~核心单测≥50%+Jacoco~~✅；~~CI coverage/lint:js:ci~~✅；~~版本快照零摩擦~~✅ | ✅ |
| 第 3-6 轮：ReactFlow 画布 | 设计器现代化 | ~~R0~~✅ → ~~R1~~✅ → ~~R2~~✅ → ~~R3~~✅（画布 + 导出去 G6） | ✅ 闭环 |
| 第 3 轮：版本时光机 | 抬升「每周有版本保存」 | ~~快照零摩擦~~✅；~~版本 diff 可视化~~✅；~~工单/审批打磨~~✅；~~编辑版本号重复拦截不关窗~~✅ | ✅ 2026-08-01 |
| P2：体验深水区 | 让用户爱用 | ~~首页示例项目 30s 激活~~✅；~~自动保存状态可见~~✅；~~开源不限项目数~~✅；~~项目空态引导 + 新建表单减负~~✅；~~缩短建表链路~~✅；~~加载骨架统一~~✅；~~暗色延期（ADR-0010）~~✅；~~清 MUI/Blueprint→antd~~✅；~~连线后改字段名跟边~~✅；~~性能预算 / 视口裁剪~~✅；~~eslint 热路径 console / 存量 log 清零~~✅（其余 warn→P4）；~~核心接口连通~~✅；~~数据源隔离（ADR-0008）~~✅ | ✅ |
| **P2b：全站控件闭环** | 可点即可达结果；死入口修或删 | 控件矩阵 [control-matrix.md](./control-matrix.md)；~~W0–W6~~✅；矩阵 **🚧=0**；📋 延期（非本阶段闭环）：论坛外链（正式仓 Discussions 未就绪）、VIP 角标（头像 identification 已覆盖）、实验页 dataDomain/query/ChatSQL/dataQuery | ✅ 2026-08-02 |
| P3：功能深度 | 比竞品强 | ~~版本 diff 可视化~~✅（第 3 轮）；~~协作 presence+光标+增量 sync（ADR-0009）~~✅；~~远端同步冲突提示~~✅；~~只读分享链接~~✅（ADR-0007）；~~反向解析 + P0 四库字典 FK~~✅（ADR-0006；~~复合 fields[] 延期 ADR-0011~~✅）；AI📋；i18n📋 | 🚧 |
| P3a：获客与传播 | 陌生人能试用并产生版本 | ~~在线 demo（`/demo`→`/s/public-demo`）~~✅；~~分享页 → fork + autofork~~✅；~~注册转化（redirect 闭环）~~✅；~~双周发版笔记~~✅ | ✅ |
| P4：社区与生态 | 让项目长大 | ~~文档站骨架 / Pages / 本地搜索~~✅；~~托管拓扑 1–3：CF Pages 文档+静态 demo、GHCR release、compose 拉镜像（ADR-0018）~~✅；~~good-first-issue 运营清单（`docs/community.md` + Issue 模板）~~✅；~~Issue 草稿 + `seed-good-first-issues.sh`~~✅；~~CHANGELOG Unreleased 按日折叠~~✅；~~草稿 `33` 删字段 a11y~~✅；~~草稿 `34` Controls 中文 aria~~✅；~~草稿 `35` MiniMap 中文 aria~~✅；~~草稿 `36` 画布工具栏 aria~~✅；~~草稿 `37` SaveStatus aria-live~~✅；~~草稿 `38` CollabPresence aria-live~~✅；~~草稿 `39` 命令面板 listbox~~✅；草稿池暂空（a11y 微切片停）；正式仓就绪后 `seed-good-first-issues.sh` 投放 3–8 个📋；发版节奏固化✅；~~官方 demo 运行时选型 Railway-only（ADR-0019）+ deployment 步骤~~✅；Dashboard 实际拉起 Railway + 填 `DEMO_API_URL`📋 | 🚧 |

## 完整用户旅程（我们关注用户的每一步）

首次接触（落地页/README）→ 试用（在线 demo）→ 注册登录 → 新手激活（示例项目）→ 日常创作（设计器）→ 团队协作（邀请/权限/通知）→ 分享传播（只读链接/导出）→ 留存回访（动态/What's New）→ 自部署运维（升级/备份）→ 社区共建。

每个阶段的断点都有对应阶段承接，详见各阶段交付物。

## 版本政策

- 语义化版本（semver）；破坏性变更提前一个 minor 版本公告，并附迁移指南
- 数据库 schema 变更一律走 Flyway 迁移脚本，自部署用户可平滑升级
- 每双周一个 release，发布笔记附改动前后对比

## 如何影响路线图

- 提需求：开 Issue 并说明它服务哪类用户价值（见 [vision.md](./vision.md)）
- 参与讨论：Discussions 区回复路线图帖
- 直接贡献：认领 `good first issue`，阅读仓库根目录 [CONTRIBUTING.md](https://github.com/erdonline/erdonline/blob/main/CONTRIBUTING.md)
