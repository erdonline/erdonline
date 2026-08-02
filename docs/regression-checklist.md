# 回归检查单

> 规则来源：`.cursor/rules/change-points-as-tests.mdc` —— 每个改动点必须登记为可验证的检查点。
> 自动化覆盖的标注 ✅自动；其余为手工项，涉及对应模块时必查。

## 第 0 轮（2026-08-01）

### 已自动化（`yarn test:e2e` / CI e2e-smoke）

- [x] 登录页渲染；错误凭证停留登录页 ✅自动
- [x] 登录 → 新建项目（4 必填字段）→ 列表可见 → 打开模型进设计器 → 删除清理 ✅自动
- [x] VIP 计数缓存：删除项目后可再次创建（自清理用例隐含覆盖）✅自动

### 手工/接口断言项

- [ ] [env 脚本补回] 全新克隆 → `yarn start` 直接可起 → 预期：8000 端口可访问，不报 env.local.sh 缺失
- [ ] [admin 权限种子补全] 全新初始化 DB → admin 登录进 /project/person → 预期：列表 200，无「权限不够」红提示
- [x] [statistic 不含已删项目] 有软删除项目时 `GET /ncnb/project/statistic` → 预期：total/personTotal 只计 del_flag=0，与 /project/recent 列表数一致（2026-08-01 curl 验证通过）
- [ ] [VIP 计数缓存失效] 建项目 → 删除 → 立即再建 → 预期：不报「个人项目已超过1个」

## 多库逆向 Dialect SPI（2026-08-01）

### 已自动化

- [x] IndexResultSetMapper：PRIMARY/统计行跳过、复合索引、STATISTICS LOWCASE ✅自动
- [x] Registry：MySQL/MariaDB → Mysql；PostgreSQL → Postgresql；Oracle → Oracle；SQL Server → SqlServer；其余 → Generic ✅自动
- [x] `dbReverseMeta` MySQL：`supportsSchema=false` 且 `schemas=[]` ✅curl
- [x] FK 映射：两端在表集内才产出、去重、字段 UPPERCASE ✅`ForeignKeyAssociationMapperTest`
- [x] Colima MySQL `reverse_demo`：indexs + associations 1:n ✅curl
- [x] Colima PostgreSQL `reverse_demo`：meta schemas=[public]；indexs + associations ✅curl
- [ ] Colima SQL Server（Azure SQL Edge）拉起后同样 curl 验证
- [x] 只读分享：create + 匿名 GET `readonly=true`；匿名 create 401 ✅curl
- [x] 分享脱敏：dbs password/username → `***` 且不污染原 Map ✅`ProjectShareSanitizeTest`
- [x] [只读分享前端] 设计器「分享」→ `/s/:token` → 未登录打开见表清单 + 只读关系图（`data-testid=share-relation-canvas`）✅`share.spec.ts`
- [x] [只读分享安全] 匿名 GET 中 dbs password/username 为 `***` ✅curl
- [x] [dataSources] 登录后 `GET /ncnb/dataSources?size=10&current=1` → 200（表 `data_sources`）✅`audit-fe-apis.sh`
- [x] [注册放行] 匿名 `POST /ncnb/project/group/user/register`（body: username/pwd/email/phone）→ 非 401 ✅curl
- [x] [queryHistory] `POST /ncnb/queryHistory` 分页 → 200（禁止 GET）✅`audit-fe-apis.sh`
- [x] [ADR-0008 分享] 匿名 GET projectJSON.profile.dbs 为空数组 ✅`ProjectShareSanitizeTest`
- [x] [分享 Fork] 匿名点「复制到我的项目」→ `/login?redirect=`；登录后 fork 进设计器 ✅`share.spec.ts`
- [x] [分享注册转化] 「注册并带回」→ `/register?redirect=`；登录页有「去注册」✅`share.spec.ts`
- [x] [分享 autofork] 登录后打开 `/s/:token?autofork=1` 自动 fork 进设计器 ✅`share.spec.ts`
- [x] [在线 demo] `/demo` → `/s/public-demo` 见关系图 + 复制 CTA ✅`demo.spec.ts`
- [x] [协作 presence] 设计器顶栏 `collab-presence` 含当前用户 ✅`presence.spec.ts`；`verify-socket-presence.mjs`（含断线清名单）
- [x] [协作光标] 双端 `verify-socket-cursor.mjs`：A 发坐标 B 收、发送方无回声 ✅
- [x] [协作 sync] `verify-socket-sync.mjs`：A 发 delta B 可 patch 出 T_USER、发送方无回声 ✅
- [x] [协作 sync 提示] 双人同项目：A 改表后 B 见 info / 未保存见 warning；CTA「保存版本」→ version/all ✅`sync-toast.spec.ts`
- [x] [空 projectJSON] API 建团队项目未带 JSON → 打开设计器可「新增模型」✅`empty-projectjson.spec.ts`
- [x] [创建默认 projectJSON] API 建项目无 JSON → GET info `modules=[]` ✅`ProjectEnsureDefaultJsonTest` + curl
- [x] [开源无升级 CTA] 设计器顶栏无「升级至尊版」✅`presence.spec.ts`
- [x] [顶栏仓库链] 设计器 GitHub 链指向 `erdonline/erdonline`，无旧 Gitee ✅`presence.spec.ts`
- [x] [开源品牌文案] 设计器无「零代科技」✅`presence.spec.ts`

### 手工

- [x] [ADR-0008 设计器] 设置→数据源：增改测连写到 `/ncnb/dataSources`；保存项目后 `profile` 无 password/url，有 `defaultDataSourceId` ✅`adr0008-datasource.spec.ts`
- [x] [`/databaseConfig` 编辑/删除] 新建→编辑改名→更新成功→删除确认→删除成功 ✅`adr0008-datasource.spec.ts`
- [x] [`/databaseConfig` 同步状态] 点同步 → toast（在线/不可达）+ 行状态更新 ✅`adr0008-datasource.spec.ts`

- [x] [MySQL 逆向提交闭环] `reverse_demo` 数据源 → `/design/table/import/reverse` 选 `t_user`/`t_order` → 模型树可见 ✅`import-reverse.spec.ts`
- [ ] [MySQL 逆向含索引] 配置本机 MySQL 数据源 → 导入逆向 → 勾选含二级索引的表 → 预期：实体 `indexs` 有名称/字段/isUnique，PRIMARY 不重复出现；向导不显示 Schema（API curl 已覆盖；UI 深度后置）
- [ ] [MySQL 逆向含外键] 勾选父子表一并导入 → 预期：子表模块 `associations` 有 `1:n` 边，关系图画布可见连线（字典 KEY_COLUMN_USAGE；API curl 已覆盖）
- [x] [MySQL 复合 FK 列序] `ForeignKeyAssociationMapperTest#mapFromKeyColumnUsage_keepsCompositeOrder` ✅
- [ ] [PostgreSQL 逆向] 选数据源后出现 Schema（默认 public）→ 含二级索引表导入 → 预期：`indexs` 正确且不含主键索引
- [ ] [PostgreSQL 逆向含外键] 勾选父子表 → `associations` 有 `1:n`（字典 KEY_COLUMN_USAGE）
- [ ] [Oracle 逆向] schema=用户 → 含二级索引表导入 → 预期：`indexs` 正确且不含主键约束索引
- [ ] [Oracle 逆向含外键] 勾选父子表 → `associations` 有 `1:n`（ALL_CONSTRAINTS R）
- [ ] [SQL Server 逆向] 默认 dbo → 含二级索引表导入 → 预期：`indexs` 正确且不含主键/INCLUDE 列
- [ ] [SQL Server 逆向含外键] 勾选父子表 → `associations` 有 `1:n`（sys.foreign_keys）
- [ ] [其它库兜底] H2/达梦等走 Generic → 表/列/PK 可导入；索引尽力

## 第 3 轮（2026-08-01）：Blueprint → antd 清零

### 已自动化

- [x] 登录/新建项目/设计器/版本/导出/关系图/UX 走查共 15 条 E2E 全绿（4 workers，1.6min）✅自动
- [x] [设计器顶栏菜单] 项目 → 设置 → 数据源设置 dialog ✅`project-menu.spec.ts`
- [x] [数据源设置 dialog] ModalForm「数据源连接配置」可打开 ✅`project-menu.spec.ts`
- [x] [逆向解析入口] 导入 → 数据源逆向/PdMan/ERD 弹窗可见 ✅`project-menu.spec.ts`
- [x] [导出入口] 导出五项可见且 DDL 配置弹窗可开 ✅`project-menu.spec.ts`

## 第 2 轮（进行中）

### 质量基线 · Jackson / 单测

- [x] [fastjson 已移除] `pom` 无 fastjson；`JsonUtilTest` + `ErdJsonTypeHandlerTest` 通过 ✅自动
- [x] [projectJSON 仍可读] JWT 登录 → 进设计器（smoke/relation）✅E2E
- [x] [Jacoco 核心≥50%] `mvn test` 含 check-core；JWT/登录/网关/JsonUtil 行覆盖 ✅自动
- [x] [前端 lint:js:ci] `yarn lint:js:ci`（--quiet）0 error 进 frontend-ci ✅自动
- [x] [版本快照零摩擦] 无 JDBC → 版本管理非 Loading → 新增版本 → 列表见版本号 ✅`version.spec.ts`
- [x] [version antd List 空态] 无版本时见「还没有版本」+「保存第一个版本」；保存后空态消失、行可见 ✅`version.spec.ts`「无数据源也可新增版本」
- [x] [AddVersion antd Form] 保存版本弹窗非 Pro ModalForm；标签逗号/回车、校验、确定→保存成功 toast ✅`version.spec.ts` saveVersion 路径
- [x] [RenameVersion antd Form] 编辑版本弹窗非 Pro ModalForm；改号成功 toast；重复号 toast 且弹窗不关 ✅`version.spec.ts`「重命名描述」
- [x] [多标签 Escape 遮罩] 保存带标签版本勿 Escape 关下拉；chip 可见后失焦再确定；筛选 release 同时见 1.0.0/1.0.1 ✅`version.spec.ts`「多标签」
- [x] [AddProject antd Form] 新建项目弹窗非 Pro ModalForm；个人项目创建成功进列表 ✅`smoke` / `project-activation` createPersonProject
- [x] [RenameProject antd Form] 修改项目弹窗非 Pro ModalForm；改名成功 toast + 列表见新名、旧名消失 ✅`project-surface.spec.ts`「修改弹窗可改名并回列表」
- [x] [CopyProject antd Form] 版本行复刻弹窗非 Pro ModalForm；复刻成功 toast + 个人项目列表见新名 ✅`version.spec.ts`「版本行复刻弹窗可创建个人项目」

### 已自动化（`yarn test:e2e`）

- [x] [实体即节点] relation.spec.ts：建 2 表 → 关系图立即渲染 2 节点（含画布开启中建表即时出现）✅自动
- [x] [画布高度] 空模块打开关系图画布可见（.react-flow 非 0 高度，历史塌陷 bug 回归断言含于上条）✅自动
- [x] [拖动持久化] 拖节点 → 重载 → 画布 transform 坐标不变 ✅自动
- [x] [节点删除守卫] 选中节点按 Delete → 提示走模型树 + 节点保留 ✅自动

### 手工/接口断言（2026-08-01 已验证）

- [x] [字段连线建关联] T_B.A_ID 右锚点拖至 T_A.ID 左锚点 → 边出现；DB associations 落库；重载后边仍在 ✅浏览器+SQL 实证
- [x] [删边] 边 focus+Delete → 边消失 + DB associations 清空 ✅浏览器+SQL 实证
- [x] [手柄可点] overflow/z-index 修复后 elementFromPoint 命中手柄（修复前被节点埋住）✅浏览器实证

### R2 已自动化（relation.spec.ts 全旅程）

- [x] [空态 CTA] 0 表显示「新建第一张表」→ 点击即上图 ✅自动
- [x] [内联加字段] 节点「+ 添加字段」→ 输名回车 → 字段行出现 ✅自动
- [x] [字段拖连线] dragTo 外键右锚点→主键左锚点 → 边出现 ✅自动
- [x] [字段改名跟边] 双击外键改名 → 边仍在（associations 锚点同步）✅自动
- [x] [dagre 自动布局] 点「自动布局」→ 节点 transform 改变 ✅自动

### 待办

- [x] [边点击区域] `interactionWidth=24`；`relation.spec` 删边不再 `force` ✅
- [ ] [旧坐标复用] 含 g6 graphCanvas 坐标的老项目打开新画布，节点位置应保持（无老数据样本）
- [x] [undo] 自动布局后 Cmd/Ctrl+Z → 坐标回到布局前 ✅自动
- [x] [IdOrKey 默认 PK] 内联加 IdOrKey 字段后 PK 徽标 active ✅自动
- [x] [表头改名] ✎ DOM click → 改名；改名中勿用 `rfNode(旧名)` 链 ✅ `relation.spec`「改名」
- [x] [PK 切换] PK 徽标 `button`+aria；取消/恢复 ✅ `relation.spec`「PK」
- [x] [命令面板] Cmd/Ctrl+K → 搜「新建」→ 执行 → 节点数 +1；工具条「命令」/Esc ✅自动（`relation.spec`「命令面板」）
- [x] [多选对齐] Shift 多选两表 → 左齐 → transform x 相同 ✅自动
- [x] [R3 切 g6] 打开关系图仅 ReactFlow（无 G6Relation）；relation.spec 全旅程绿 ✅自动
- [x] [导出去 G6] 设计器导出 Markdown 下载 .md（DOM+html2canvas）✅自动 export.spec.ts

## 第 1 轮（2026-08-01）

### 已自动化（`yarn test:e2e` / CI e2e-smoke）

- [x] 错误凭证登录展示后端业务文案（查无此用户）且同一条错误只弹一次 ✅自动
- [x] 全量冒烟 3 条通过（2026-08-01 本地）✅自动

### 手工/接口断言项

- [x] [create_time/creator 填充] curl 建项目 → 库中 creator=admin、create_time 非空、返回 id 与库中一致（2026-08-01 验证通过）
- [x] [项目卡片可点] 个人/团队/最近/数据模型 4 页项目名可点进设计器（2026-08-01 浏览器手工验证通过，卡片显示创建时间）
- [x] [dev-restart.sh] 改 Java 后执行 → ~20s 内后端就绪；**JAVA_HOME 必须 JDK 17**（Boot 3）
- [x] [SocketIO 端口释放] 后端重启后 9092 可重绑，无 BindException（2026-08-01 验证通过）
- [x] [登录契约 JWT] `POST /auth/login` JSON → access_token；Bearer 访问业务接口 200（替代旧 `/oauth/token`）
- [x] [社交登录已删] `/login/success`、微信绑定页 404；`/auth/oauth2/**` 非 200 ✅`dead-auth-routes.spec.ts`
- [x] [画布删除二次确认] ReactFlow Delete 不删表；树侧确认含不可逆文案 ✅`smoke`「删除表」取消/确认
- [x] [画布撤销/重做] relation.spec.ts 覆盖 ✅自动
- [x] [登录 console 无账密] ux-audit / smoke 覆盖 ✅自动

### 新发现待办

- [x] [关系图入口缺失] 已修（见走查发现区，浏览器实证）
- [x] [/oauth/token] 已废弃；现 JWT 登录，错误凭证 401+业务文案（curl+E2E）
- [x] [存量 console.log] 已清零（`rg console\.(log|debug|info) src` = 0；`lint:js:ci` 0 error）✅自动
- [ ] [CORS 收敛] curl 实证：localhost:8000 预检放行含 ACAO；evil.example.com 无 ACAO ✓（2026-08-01）——**部署注意**：生产直连后端需设 `CORS_ALLOWED_ORIGINS`；prod profile 必须注入 DB_USERNAME/DB_PASSWORD/OSS 密钥否则启动失败（fail-fast 设计）
- [ ] [生产凭证 fail-fast] 待 Docker 部署验证：`docker-compose up`（compose 显式传 env，应正常启动）

## UX 走查（playwright-ux-audit 规则，2026-08-01 首轮）

### 已自动化（ux-audit.spec.ts）

- [x] 个人/最近/数据模型页项目卡片标题是**真链接**（getByRole('link')，含 href 可键盘聚焦）✅自动
- [x] 点卡片标题直达设计器（affordance 端到端有效）✅自动
- [x] 全旅程 console 无明文账密 ✅自动
- [x] 全旅程截图存档 test-results/ux-walkthrough/（6 张，每轮人工翻阅找新摩擦）

### 走查发现（本轮新摩擦）

- [x] [假链接] 卡片标题首版修复用 `<a onClick>` 无 href，无 link role、不可键盘聚焦 → 已改真链接（走查首轮即抓出，P1 已修）
- [x] [关系图入口缺失] 文件夹模式树下无「关系图」节点（`getModuleEntityTree` 仅扁平模式返回入口，而界面恒用文件夹模式）→ 已在「关系」文件夹置顶入口，浏览器验证画布可打开渲染（P0 已修）
- [ ] [实体无法上图·核心断裂] 前端无拖拽源 + `addEntity` 不写 `graphCanvas` → 新建实体永远上不了画布（旧画布建模回路全断）→ **不修补 g6**，ReactFlow 轮按 ADR-0001 补充决策根治：实体即节点、graphCanvas 只存布局
- [x] [设计器空态] 0 表时「新建第一张表」可点且建表即上图（含默认主键）✅ `relation.spec.ts`
- [x] [建表链路] 树/弹窗建表后直开关系图；中文名可选；不再出现「建表即空壳」✅同上
- [x] [连线后改字段名边消失] 先连线再改外键名，边仍在；再 Delete 可删干净 ✅ `relation.spec.ts`

## 第 1 轮待启用（test.fixme 转正目标）

- [x] ~~错误凭证登录出现明确错误提示~~（第 1 轮已转正并通过）
- [x] ~~画布/树删除表需二次确认~~ → 树删除确认已自动化（`smoke`）；画布 Delete 不删表见 `relation.spec`

## 第 3 轮：版本 diff 可视化（2026-08-01）

- [x] [详情可视化] 建表→保存版本→点「详情」→ 见 `version-diff-panel` 着色项与表名 ✅ `version.spec.ts`
- [x] [跨版本 diff 导出] 详情弹层点「导出」→ download `version-diff-*.md` + toast「已导出变更清单」 ✅ `version.spec.ts`
- [x] [列表摘要] 有 changes 的版本行显示 `+N/-N/~N` Tag ✅同上
- [x] [任意版本比对] 单版禁用；双版比对见增量字段 ✅ `version.spec.ts`
- [x] [工单/审批表头] 侧栏「我的工单」「我的审批」表头正确 + 空态引导 ✅ `approval.spec.ts`
- [x] [审批有数据拒绝/复批] API 种子待审→审批页拒绝 toast→工单复批 toast ✅ `approval.spec.ts`「API 种子工单」
- [ ] [团队审批 UI 发起+通过] 手工：团队项目→详情 SQL审批→选审批人→通过（需真实 JDBC 目标库）

## 新手激活（2026-08-01）

- [x] [首页示例] 登录→/home→示例项目→设计器关系图见 T_USER/T_ORDER + 边 ✅ `activation.spec.ts`
- [x] [去死链] 「新建模型」href 指向 `/project/person` ✅同上
- [x] [多项目] 开源版可连续创建 ≥2 个个人项目 ✅ `activation.spec.ts`

## 设计器保存状态（2026-08-01）

- [x] [自动保存反馈] DesignLayout 顶栏见「保存中…」→「已保存」 ✅ `relation.spec.ts`

## 项目激活链路（2026-08-01）

- [x] [空态引导] 清空个人项目 → /project/person 见「立即创建/一键示例」→ 一键示例进设计器树见 T_USER/T_ORDER ✅ `project-activation.spec.ts`
- [x] [新建表单减负] 打开新建弹窗 → 类型默认个人项目、标签已填 → 只填名称/描述可创建，成功有「创建成功」提示 ✅同上

## 开发基建（2026-08-01）

- [x] [后端常驻] `./backend/dev-ensure.sh` 首跑拉起、二跑秒退（幂等）；终端关闭后 curl /actuator/health 仍 UP（tmux 会话 erd-be）
- [ ] [保存失败] 手工：断网后改模型 → 见「未保存」且有错误提示

## 加载骨架（2026-08-01）

- [x] [项目列表] 慢网打开 /project/person 见 list loading，完成后可新建 ✅ `loading.spec.ts`
- [x] [进设计器] 慢网打开模型见 `page-skeleton`，加载后消失 ✅同上
- [x] [版本页] 进版本管理首屏见骨架而非 `Loading...` ✅`loading.spec.ts`「版本管理首屏慢网」
- [x] [版本页返回模型] 「返回模型」→ `/design/table/model?projectId=` 且见模型空态/树 ✅`version.spec.ts`「返回模型」

## UI 收敛 antd（2026-08-01）

- [x] [无 MUI] `rg '@mui/' frontend/src` 零命中；package.json 无 `@mui/*`
- [ ] [数据源对话框] 手工：设置→数据源设置→测试/确定按钮为 antd 样式；预览编辑抽屉布局正常
- [x] [版本编辑] 版本页「编辑」仍可打开表单；最新版改号成功；重复号 toast 且弹窗不关 ✅ `version.spec.ts`「重命名与删除」

## 画布视口裁剪（2026-08-01）

- [x] [大图裁剪] 30 表 + 放大视口 → DOM `.react-flow__node` < 30；`data-viewport-cull=1` ✅ `canvas-scale.spec.ts`
- [x] [E2E 定位] 新建模型/开关系图走 testid，不依赖 `.ant-tree [class*=title]` ✅同上

## 布局壳子路由（2026-08-02）

- [x] [HomeLayout 主内容] 登录→/home 见 `home-link-new-project`；/project/person 见新建/立即创建（非仅 slogan）✅ `layout-outlet.spec.ts`
- [x] [HomeLayout 顶栏] `/home` 无 `save-status` / `collab-presence` /「只读分享」；仍有「GitHub 仓库」与「公众号」（`homeRightContent`）✅ `layout-outlet.spec.ts`
- [x] [Pro Strangler 切片1] HomeLayout/GroupLayout 无 `@ant-design/pro-components`；antd Layout+Watermark；主导航「数据模型/数据源」可达 ✅ `layout-outlet` + `project-surface`（2026-08-02）
- [x] [S0 依赖矩阵] installed `@umijs/max@4.6.84` / `antd@5.29.3` / `@ant-design/pro-components@2.8.10` / `rc-util@5.44.4`；`yarn build` 绿 ✅
- [x] [GroupLayout 主内容] 登录→/project/group/setting/basic?projectId= 见「基本设置」+「项目名」且不双挂载 ✅同上

## W6 团队项目基本设置（2026-08-02）

- [x] [基本设置保存成功 toast] API 建团队项目→/project/group/setting/basic →改项目名→提 交→「修改成功」✅ `group-basic-setting.spec.ts`
- [x] [基本设置保存失败 toast] mock update 非 200 →「修改失败」✅同上

## W6 权限组 / GroupLayout 导航 / 404（2026-08-02）

- [x] [权限组成员可见] `/project/group/setting/permission` 见角色 tab +「用户组成员」「权限配置」；权限配置见「全选」「团队基础设置」✅ `group-layout-nav.spec.ts`
- [x] [返回项目列表] GroupLayout「返回项目列表」→ `/dataModels`（无 projectId）✅同上
- [x] [打开模型] GroupLayout「打开模型」→ `/design/table/model?projectId=` 设计器可见✅同上
- [x] [404] 未知路径见「404」「抱歉，你访问的页面不存在」；「返回首页」离开该路径✅ `not-found.spec.ts`

## W2 项目公告（2026-08-02）

- [x] [更多公告] `/home`「更多公告」→ `/project/notice` 见「公告」+ 种子标题链（含 ERDOnline）✅ `project-notice.spec.ts`
- [x] [公告加载失败 toast] mock `/syst/sysAnnouncement` 非 200 →「加载公告失败」✅同上

## W4 切片 5 — module/entity/database 死 ModalForm（2026-08-02）

- [x] [零引用对话框已删] `frontend/src` 无 `dialog/module|entity|database|dataType`、`DataDomain`、`DynamicDialog`；模型/表走 `EntityModal` ✅ `empty-projectjson.spec.ts`
- [x] [空 JSON 仍可新增模型] 无 projectJSON 团队项目 → 空态「新增模型」→ EntityModal 填名 → toast「模型添加成功」✅同上

## W4 切片 6 — CopyProject antd Form+Modal（2026-08-02）

- [x] [复刻弹窗非 ModalForm] 版本行「复刻」→ antd dialog；填名/标签/描述 → toast「复刻成功」→ `/project/person` 见新项目 ✅ `version.spec.ts`

## W4 切片 7 — DatabaseSetUp antd Form+Modal（2026-08-02）

- [x] [数据源设置非 ModalForm] 项目菜单→数据源设置 → dialog「数据源连接配置」；「新增数据源」POST `/ncnb/dataSources` 且 profile 无 password ✅ `adr0008-datasource.spec.ts` + `project-menu.spec.ts`
- [x] [setting 死页已删] `pages/design/setting/component/DatabaseSetUp.tsx` 不存在 ✅

## W4 切片 8 — DefaultSetUp antd Form+Modal（2026-08-02）

- [x] [默认项设置非 ModalForm] 项目菜单→默认项设置 → dialog 两 Tab（默认字段/默认配置）；确定 → toast「设置成功」 ✅ `project-menu.spec.ts`

## W6 数据域裁剪（2026-08-02）

- [x] [无数据域入口] 设计器项目菜单无 menuitem「数据域」；无导航 link「数据域」✅ `data-domain.spec.ts`
- [x] [深链实验页] `/design/dataDomain` 见「实验功能」✅同上

## W6 设计器查询裁剪（2026-08-02）

- [x] [无查询入口] 设计器项目菜单无 menuitem「查询」；无导航 link「查询」✅ `design-query.spec.ts`
- [x] [深链实验页] `/design/table/query` 见「实验功能」+ `design-query-page` ✅同上
- [ ] [深链运行失败有 toast] 打开查询叶子 → 选非法 SQL 运行 → 见 error toast（手工；后端仍打应用库）

## W6 Home 数据查询裁剪（2026-08-02）

- [x] [无数据查询入口] `/home` 主导航无 link「数据查询」；仍有「数据模型」「数据源」✅ `home-data-query.spec.ts`
- [x] [深链实验页] `/dataQuery` 见「实验功能」+ `home-data-query-page` ✅同上

## W6 账户设置基本资料（2026-08-02）

- [x] [基本资料保存成功 toast] `/account/settings?selectKey=base` →「更新基本信息」→「更新基本信息成功」✅ `account-settings.spec.ts`
- [x] [security/identification 页签] 头像→个人中心→「安全设置」见账户密码/修改；「授权类型」见开源版/已授权；头像「授权信息」直达 identification ✅ `account-settings.spec.ts`
- [x] [基本资料保存失败 toast] mock update 非 200 →「更新基本信息失败」✅同上
- [x] [头像无假 Upload] 见「头像上传暂未开放」；无「更换头像」/file input ✅同上
