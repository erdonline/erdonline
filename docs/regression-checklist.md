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

## 第 2 轮（进行中）

### 质量基线 · Jackson / 单测

- [x] [fastjson 已移除] `pom` 无 fastjson；`JsonUtilTest` + `ErdJsonTypeHandlerTest` 通过 ✅自动
- [x] [projectJSON 仍可读] JWT 登录 → 进设计器（smoke/relation）✅E2E
- [x] [Jacoco 核心≥50%] `mvn test` 含 check-core；JWT/登录/网关/JsonUtil 行覆盖 ✅自动
- [x] [前端 lint:js:ci] `yarn lint:js:ci`（--quiet）0 error 进 frontend-ci ✅自动
- [x] [版本快照零摩擦] 无 JDBC → 版本管理非 Loading → 新增版本 → 列表见版本号 ✅`version.spec.ts`

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

- [ ] [边点击区域] 边中点被节点遮挡时 force 才能点（P2，可提高边交互热区）
- [ ] [旧坐标复用] 含 g6 graphCanvas 坐标的老项目打开新画布，节点位置应保持（无老数据样本）
- [x] [undo] 自动布局后 Cmd/Ctrl+Z → 坐标回到布局前 ✅自动
- [x] [IdOrKey 默认 PK] 内联加 IdOrKey 字段后 PK 徽标 active ✅自动
- [ ] [表头改名] 点 ✎ → 改名 → 节点标题更新（MCP 实证 DOM click 有效；Playwright locator.click 被 RF 层吞，自动化待补）
- [ ] [PK 切换] 点 PK 徽标取消/恢复（功能已落地，自动化待补）
- [x] [命令面板] Cmd/Ctrl+K → 搜「新建」→ 执行 → 节点数 +1 ✅自动
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
- [ ] [社交登录已删] `/login/success`、微信绑定、`/auth/oauth2/**` 不可用（404）
- [ ] [画布删除二次确认] ReactFlow 节点 Delete 已守卫（不删表）；树侧删表确认另查
- [x] [画布撤销/重做] relation.spec.ts 覆盖 ✅自动
- [x] [登录 console 无账密] ux-audit / smoke 覆盖 ✅自动

### 新发现待办

- [x] [关系图入口缺失] 已修（见走查发现区，浏览器实证）
- [x] [/oauth/token] 已废弃；现 JWT 登录，错误凭证 401+业务文案（curl+E2E）
- [ ] [存量 console.log] 488 处，配 `yarn lint:js` 批量清除（P2）
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
- [ ] [设计器空态] 0 表时主区域显示静态插图而非可操作引导（「新建第一张表」按钮）→ P2，ReactFlow 轮一并处理
- [ ] [建表链路长] 建模块→建表→双击打开→关系图另切标签，4 步才能看到表结构 → P2，交互重构时统一设计

## 第 1 轮待启用（test.fixme 转正目标）

- [x] ~~错误凭证登录出现明确错误提示~~（第 1 轮已转正并通过）
- [x] ~~画布/树删除表需二次确认~~ → 树删除确认已自动化（`smoke`）；画布 Delete 不删表见 `relation.spec`

## 第 3 轮：版本 diff 可视化（2026-08-01）

- [x] [详情可视化] 建表→保存版本→点「详情」→ 见 `version-diff-panel` 着色项与表名 ✅ `version.spec.ts`
- [x] [列表摘要] 有 changes 的版本行显示 `+N/-N/~N` Tag ✅同上
- [x] [任意版本比对] 单版禁用；双版比对见增量字段 ✅ `version.spec.ts`
- [x] [工单/审批表头] 侧栏「我的工单」「我的审批」表头正确 + 空态引导 ✅ `approval.spec.ts`
- [ ] [团队审批全链路] 手工：团队项目→详情 SQL审批→审批人通过/拒绝→发起人复批 → 各步有成功/失败提示

## 新手激活（2026-08-01）

- [x] [首页示例] 登录→/home→示例项目→设计器关系图见 T_USER/T_ORDER + 边 ✅ `activation.spec.ts`
- [x] [去死链] 「新建模型」href 指向 `/project/person` ✅同上
- [ ] [配额满] 手工：已有 1 个个人项目时点示例 → 提示去清理并跳转个人项目页
