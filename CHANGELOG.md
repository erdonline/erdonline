# Changelog

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)；每个迭代轮的验证方式见 `docs/roadmap.md`。

## [Unreleased] — 第 0 轮：验证基建（2026-08-01）

> 目标：建立"一切迭代的前提"——全栈可起、核心旅程有自动化冒烟守护。

### 新增

- **E2E 冒烟测试**（Playwright）：覆盖核心旅程「登录 → 新建项目 → 进入设计器 → 清理删除」，自清理可重复运行（`frontend/tests/e2e/smoke.spec.ts`，`yarn test:e2e`）
- **CI 冒烟门禁**（`.github/workflows/e2e-smoke.yml`）：GitHub Actions 全栈起 mysql/redis/backend/frontend 后执行冒烟，失败禁止合并
- 两个 `test.fixme` 用例标记第 1 轮修复目标：错误凭证无提示、画布删除无二次确认

### 修复（冒烟测试抓出的真实 bug）

- **新克隆无法启动前端**：`yarn start`/`build:prod` 依赖的 `env.local.sh`/`env.sh` 未入库，已补回（生成 `env-config.js`，开发态走同源代理）
- **admin 打开个人项目页 403**：权限种子漏配 admin 角色的 42 个 operation + 9 个 menu（含 `/project/page`），`db/init/03_martin.sql` 追加幂等补全
- **免费版删除项目后永远无法再建**：VIP 项目计数 Redis 缓存只增不减、删除不清除，`ProjectServiceImpl.removeById` 现在删除后清除计数缓存
- **首页统计与项目列表数据不一致**：`/project/statistic` 的 6 个统计 SQL 未过滤 `del_flag`，软删除项目仍被计数（列表显示 0 个、统计却显示 2 个），已全部补上 `del_flag = 0`
  验证点：有软删除数据时 statistic 各计数 = 项目表 del_flag=0 行数（已 curl 验证一致）

### 文档

- 新增 `docs/vision.md`、`docs/roadmap.md`、`docs/design-principles.md`
- 新增 ADR：`0001` ReactFlow 设计器迁移、`0002` 后端升级路径、`0003` Docusaurus 文档站、`0004` MIT 协议
- 新增 Cursor 规则：项目上下文、迭代协议、前端/后端编码红线、文档自动维护

### 已知问题（记入第 1 轮急救包）

- 登录接口用 GET + query 传密码（`?password=` 会进代理/浏览器历史日志）
- 错误凭证登录、表单校验失败、VIP 限额触发等场景前端静默失败，无任何提示
- 点击项目卡片名称无响应，必须点「打开模型」按钮（死 affordance）
- 项目 `create_time`/`creator` 未写入（列表时间为空）
- 登录页存在 `console.log` 调试残留（登录提交打印明文账密！）

## [Unreleased] — 第 2 轮（进行中）：质量基线 · Boot 3 + JWT（ADR-0002）

> 目标：直上 Spring Boot 3.5 + JWT Resource Server；删掉无法带走的旧 OAuth/社交死代码。

### 认证与栈

- **Boot 3.5.16 + JDK 17**：`POST /auth/login`（JSON）签发 HS256 JWT；请求头仍 `Authorization: Bearer`
- **删除**：password-grant `/oauth/token`、Redis opaque token、社交登录整包（`common.social`）、SocialDetails CRUD、微信绑定页、`/login/success` 回调路由、模板页 `pages/user/Login`
- **CI**：backend-ci / e2e-smoke / release 统一 Java 17
  验证点：curl 登录拿 JWT → `/ncnb/project/statistic` 200；错误密码 401；`smoke.spec.ts` 3 过 1 跳过；`relation.spec.ts` 绿（2026-08-01）

### fastjson → Jackson（✅）

- **核心持久化**：`ErdJsonTypeHandler` / `Project` / `JsonBase` 改为 `Map<String,Object>`；Module API `@RequestBody Map`
- **实体对齐**：`DbChange` / `DataDict` 数组字段改 `List`；逆向模型 `@JSONField` → `@JsonPropertyOrder`
- **依赖**：移除 `com.alibaba:fastjson`；统一走 `JsonUtil`（Jackson）
- **单测**：`JsonUtilTest`、`ErdJsonTypeHandlerTest`；`GatewayPrefixStripFilterTest` 改断言 `/auth/login`
  验证点：`mvn test -Dtest=JsonUtilTest,ErdJsonTypeHandlerTest,GatewayPrefixStripFilterTest` 通过；登录后 GET 项目 `projectJSON` 为对象且可进设计器（smoke/relation）

### 核心单测 + Jacoco 门禁（✅）

- **Jacoco**：`pom` 对 JWT / 登录 / 网关前缀 / JsonUtil / ErdJsonTypeHandler 行覆盖率 ≥50%（实测核心包 ~78%）
- **用例**：`AuthLoginControllerTest`、`JwtTokenServiceTest`、`JwtConfigTest`、`AuthEndpointTest`、`TokenServiceTest`；网关前缀补 `/syst` `/ncnb`
- **CI**：`backend-ci` 跑 `mvn test`（含 check）并上传 jacoco 报告；`frontend-ci` Node 20 + `yarn lint:js:ci`（`--quiet`，存量 warn 不挡）
  验证点：本地 `mvn test` BUILD SUCCESS；jacoco check-core 通过；`yarn lint:js:ci` 0 error

### 版本快照零摩擦（✅ 北极星）

- **无 JDBC 也可保存版本**：`SNAPSHOT_DB_KEY` 通道；版本页不再永远 Loading；空态引导文案
- **新增版本**：自动建议下一 semver + 默认描述；去掉 debugger / 明文 console
- **E2E**：`version.spec.ts` 登录→进设计器→版本管理→新增→列表见 `1.0.0`
  验证点：`npx playwright test tests/e2e/version.spec.ts` 通过（2026-08-01）

## [Unreleased] — 第 3 轮：版本时光机

> 目标：抬升「每周有版本保存」——看得见模型变更，不只是存了个号。

### 版本 diff 可视化（✅）

- **模型变更面板**：`VersionDiffPanel` 按表分组，新增绿 / 删除红 / 修改黄；摘要 Tag
- **详情弹窗**：替换纯文本列表 + 去掉 MUI Grid；`CompareVersion` 左右分栏（可视化 + DDL）
- **列表行摘要**：版本行展示 `+N/-N/~N` 变更计数
- **首版增量**：无历史时 `calcChanges` 相对空模型计算（详情可见新建表/字段）
- **清理**：`showChanges` 去掉 `debugger`
  验证点：`npx playwright test tests/e2e/version.spec.ts` 通过（含详情 diff + 双版比对）

### 工单/审批打磨（✅）

- **操作反馈**：通过/拒绝/撤销/复批/发起审批成功有 message，失败不关窗、不静默
- **文案**：审批页 `headerTitle` 由错误的「我的工单」改为「我的审批」；空态引导
- **可达**：拒绝后也可「复批」；创建审批默认 `approveStatus=0`
- **比对入口**：不足两版时「版本比对」禁用
  验证点：`approval.spec.ts` 表头/空态；`version.spec.ts` 单版禁用比对、双版比对出 REMARK

## [Unreleased] — 第 2 轮（进行中）：ReactFlow 迁移（ADR-0001）

> 目标：用现代画布重建核心建模体验，根治「实体上不了画布」断裂。

### R3 默认切换（2026-08-01 ✅）

- **关系图唯一实现**：`relation/index.tsx` 重导出 ReactFlow；删除 `g6.js` / Contex / ModalWrapper / RelationEdit 等旧接线
- **入口统一**：设计器标签经 `pages/design/relation` 进入新画布
- **导出去 G6**：`relation2file.saveImage` 改为 DOM 卡片 + SVG 连线 + html2canvas；`document.ejs` / `config.ts` 移除 g6 全局脚本
  验证点：`export.spec.ts` 设计器「导出 Markdown」成功下载 `.md`；`relation.spec.ts` 仍绿

### R0 探针（2026-08-01 ✅）

- **ReactFlow 只读画布上线**：`relation/ReactFlowRelation.tsx` + `reactflow-relation.scss`，替换设计器「关系图」标签（旧 g6 文件保留未接线，R3 删除）
- **实体即节点（核心设计约束落地）**：`module.entities` 全集即画布节点，**建表即上图**（画布开着建表，节点即时出现，E2E 实证）；`graphCanvas` 只用于复用旧坐标，无坐标节点网格自动布局
- **字段级 Handle**：每字段行左 target/右 source 连接点（悬停可见），为 R1 字段锚点连线铺路；`associations` → 边映射已接线
- **节点卡片**：表头（名+中文名）+ 字段行（PK 徽标/类型/中文名），选中高亮
- **修复画布高度塌陷**：antd Tabs 内容区 auto 高度致 `height:100%` 链塌为 0（空态画布不可见），改显式 `calc(100vh - 104px)`
- 依赖：新增 `reactflow@11.11.4`
- 测试：新增 `tests/e2e/relation.spec.ts`（实体即节点不变量 + finally 清理防配额泄漏），全量 5 通过 1 跳过
- 走查存档：`test-results/ux-walkthrough/r0-reactflow-canvas.png`

### R1 功能对等·第一批（2026-08-01 ✅）

- **节点拖动 + 位置持久化**：`onNodeDragStop` → `updateGraphCanvasLayout`（graphCanvas 只存布局），store 订阅自动落库；重载后坐标精确保持（E2E 断言画布 transform）
- **字段拖连线建关联**：字段行左 target/右 source 手柄，`onConnect` → `addAssociation`（去重），边删除（Delete 键）→ `removeAssociation`；curl 实证 `{from:{T_B.A_ID}, to:{T_A.ID}}` 落库与清除
- **节点删除守卫**：画布 Delete 不删表（实体即节点，删节点=删表属破坏性）——拦截 + 提示走模型树，E2E 断言
- **走查抓出并修复两个真 bug**：① 节点 `overflow:hidden` 把半探出的字段手柄埋住不可点（连线不可能）；② 节点点击不选中——重建节点时未保留 `selected` 交互态
- ADR-0005 落定 UI 架构：antd 守 CRUD、设计器域自研、暂缓 Tailwind

### R2 超越·第一批（2026-08-01 ✅）

- **节点即编辑器**：字段增/改/删全部画布内联（`+ 添加字段` / 双击改名改类型 / × 删字段），告别「双击开标签 + handsontable」4 步链路
- **空态可操作引导**：0 表时「+ 新建第一张表」CTA（非静态插图），创建即上图
- **dagre 自动布局**：画布右上角一键分层排布（LR），布局即持久化
- **字段改名/删除同步 associations**：改名后边锚点跟随；删字段清除悬空关联；去掉字段更新 success toast（UI 即反馈，避免淹没守卫提示）
- **手柄可点性**：常显弱可见 + 扩大热区 + overflow visible（连线命中率）
- **画布 undo/redo**：模块 JSON 快照栈（`canvasHistory.ts`），覆盖字段/关联/布局/建表；Cmd/Ctrl+Z · Shift+Z + 工具条按钮；项目加载时重置
- **表头内联改名**：✎ 按钮 / 双击表头；`renameEntity` 同步 associations 与 graphCanvas 节点 id
- **PK 一键切换**：字段行 PK 徽标可点；新建 `IdOrKey` 字段默认主键
- **命令面板 Cmd/Ctrl+K**：建表 / 自动布局 / 左齐 / 顶齐 / 撤销 / 重做；工具条「命令」入口；Esc / 筛选 / ↑↓ Enter
  验证点：`relation.spec.ts` Cmd+K → 搜「新建」→ 执行 → 节点数 +1（已通过）
- **多选对齐**：Shift+点击 / 左键框选（`selectionOnDrag`）；≥2 选中时工具条显示左/右/顶/底/水平中/垂直中；布局即持久化
  验证点：`relation.spec.ts` Shift 多选两表 → 左齐 → transform x 相同（已通过）
- **E2E 全旅程**：`relation.spec.ts` 覆盖空态→建表→内联字段→连线→改字段名跟边→删边→删除守卫→拖动持久化→自动布局→撤销→多选对齐→命令面板建表

## [Unreleased] — 第 1 轮：交互急救包 + P0 安全（2026-08-01）

> 目标：消灭静默失败与高危残留；建立秒级开发验证回路。

### 修复（第 0 轮登记的已知问题，逐条核销）

- **静默失败 → 统一错误反馈**（`utils/request.js`）：重写 `errorHandler`——401 区分登录接口（提示后端业务文案，不跳转）与登录态失效（提示+跳登录）；补 500 处理盲区；透传 `msg`/`message`/`error_description`；网络层失败提示「网络异常」。响应拦截器跳过非 2xx（修同一条错误弹两次）。验证点：E2E「错误凭证登录出现明确错误提示」含**仅弹一次**断言，已通过
- **登录页打印明文账密**：`pages/login/index.tsx` 删除 `console.log(29, values)`；`.eslintrc.js` 新增 `no-console` 规则防新增（存量 488 处记 P2 批量清除）。验证点：E2E 登录流程 console 无账密输出
- **项目卡片死 affordance**：个人/团队/最近/数据模型 4 个列表页的项目名全部可点击直达设计器（`dataModels` 页原有 `<a>` 无事件也已接线）。验证点：E2E 冒烟主旅程通过；手工点击卡片名跳转正常
- **`create_time`/`creator` 未写入**：根因=双数据源手动建 `SqlSessionFactory` 时 `GlobalConfig` 未挂 `MetaObjectHandler`（MP 自动配置被 exclude），两个数据源全部填充失效。已挂接。验证点：curl 建项目 → 库中 `creator=admin`、`create_time` 非空，且**接口返回 id 与库中一致**（同根因顺带修 `BeanUtil.copyProperties` null 覆盖抹掉 id 的隐患）
- **画布删除无确认**：g6 右键删除表/连接线接线 `Modal.confirm`（红按钮、提示可撤销）。同时补 `Modal` 导入（`Modal.error` 两处调用原为 ReferenceError 隐患）。验证点：代码审查通过；自动化待 ReactFlow 迁移（canvas 无 DOM 节点），见检查单手工项
- **画布撤销/重做快捷键**：Cmd/Ctrl+Z 撤销、Cmd/Ctrl+Shift+Z 重做（输入框内不拦截）

### 新增

- **秒级后端验证回路**：`backend/dev-restart.sh`——`mvn compile -o` + 直接 `java -cp` 启动，全流程 ~20s（原 `mvn spring-boot:run` 冷启动 3-4 分钟）
- **SocketIO 端口泄漏修复**：`socketIOServer` Bean 加 `destroyMethod="stop"`，上下文关闭释放 9092（原来每次重启必 BindException）
- `.cursor/rules/dev-loop-speed.mdc`：服务常驻/热加载/增量验证/环境一次到位纪律

### 技术决策记录（为什么不用 spring-boot-devtools）

试装 devtools 后发现致命冲突：`RedisTokenStore` 用 JDK 序列化存 `Authentication`（内含本项目 `MartinUser`），`ObjectInputStream` 按调用栈把类解析到基础类加载器，而 devtools 业务代码在 `RestartClassLoader`——同名类双加载器，**所有登录态请求必报 ClassCastException**，且 `restart.exclude` 不支持按包排除目录类。已卸载，改用 `dev-restart.sh` 方案。TCCL 过滤器方案已实证无效（`latestUserDefinedLoader` 不读 TCCL）。

### 新发现问题（登记待办）

- 存量 488 处 `console.log`（P2，配合 `no-console` 规则批量清除）

### 追加修复（2026-08-01 下午，走查驱动）

- **[P0] 关系图入口缺失（核心功能不可达）**：`getModuleEntityTree` 仅 `groupByType=false` 扁平模式返回「关系图」叶子，而界面恒用文件夹模式 → 画布无任何入口。已在「关系」文件夹置顶「关系图」入口（`modulesSlice.tsx`），浏览器实证画布打开渲染（3 canvas 元素）
- **[P0 登记] 实体永远无法上图（旧画布建模回路全断）**：前端无任何拖拽源（树节点 draggable=false）+ `addEntity` 不写 `graphCanvas` → 新建实体上不了画布。**决策：不修补 g6**，ReactFlow 轮根治——实体即节点、`graphCanvas` 只存布局（ADR-0001 补充决策已写入）
- **[安全] CORS 收敛**：`CorsConfig` 通配 origin → 默认仅 localhost:8000/127.0.0.1:8000，其他来源 `CORS_ALLOWED_ORIGINS` 显式声明（Bearer token 认证不受收紧影响）；删除 `GatewayPrefixStripFilter` 预检短路（回显任意 Origin + `Allow-Credentials:true` 的潜在漏洞，且已被 CorsFilter 覆盖的死代码）
- **[安全] 生产凭证 fail-fast**：`application.yml` 弱默认值（martin/erd/minio123）原会随 prod profile 泄漏上线；`application-prod.yml` 重新声明 DB/OSS 凭证为无默认值环境变量，缺失即启动失败
- **[语义修正] /oauth/token 500→401**：`MartinOauthResponseExceptionTranslator`——StatefulException 9404xxx 业务码（查无此用户等）与 InvalidGrantException（密码错误）由 500 改 401；前端 errorHandler 同步透传后端业务文案。curl + E2E 双验证
- **[文档] CSRF 关闭合理性**：`WebSecurityConfigurer` 补注释——Bearer token 无 Cookie 会话，CSRF 可安全关闭；引入 Cookie 时必须恢复

### UX 走查机制（playwright-ux-audit 规则首轮运转）

- 新增 `.cursor/rules/playwright-ux-audit.mdc`：页面级改动必须 Playwright 真实旅程走查；摩擦分类判据表（静默失败/死 affordance/重复反馈/多余步骤/空态/破坏无确认/文案不清）；P0/P1/P2 分级处理
- 新增 `tests/e2e/ux-audit.spec.ts`：UX 不变量断言（卡片标题真链接可键盘聚焦、标题直达设计器、全旅程 console 无账密）+ 6 张全旅程截图存档
- **首轮走查即抓出真问题**：卡片标题 `<a onClick>` 无 href 是"假链接"（无 link role、键盘不可达），已修为带 href 的真链接（4 个页面）
- 走查新发现（P2 登记）：设计器 0 表空态为静态插图无操作引导；建表到看图需 4 步
