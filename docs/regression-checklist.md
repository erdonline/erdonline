# 回归检查单

> 规则来源：`.cursor/rules/change-points-as-tests.mdc` —— 每个改动点必须登记为可验证的检查点。
> 自动化覆盖的标注 ✅自动；其余为手工项，涉及对应模块时必查。

## MCP / Agent 增长楔子（2026-08-28）

- [x] [文档 MCP 页 SEO] `cd website && yarn build && yarn test:seo` → 中/英 `/docs/guide/api-and-mcp/` title 含 MCP，正文含 `mcpServers` ✅ 2026-08-28
- [x] [落地页 MCP 链] `yarn test:e2e --project=chromium tests/e2e/landing.spec.ts --grep "顶栏与 Hero"` → `landing-mcp-docs` 指向 `https://doc.erdonline.com/docs/guide/api-and-mcp/`；对照表 Agent 格不再是「路线图中」 ✅ 2026-08-28
- [x] [稿 #13 打包] `node scripts/growth/build-package.mjs cursor-mcp-read-and-suggest-version` 产出掘金 + 小红书包 ✅ 2026-08-28
- [x] [小红书草稿] 创作台长文编辑器已填标题+正文并自动保存；未点公开发布（需封面/人审）。粘贴稿：`content/articles/cursor-mcp-read-and-suggest-version.xhs.md`
- [x] [小红书 #13 已点发布] 创作台笔记管理「审核中」；explore `https://www.xiaohongshu.com/explore/6a90682300000000290346fd`；**禁止再点发布** ✅ 2026-08-28 00:38
- [x] [小红书 #13 过审] 审核中 Tab 空；已发布浏览 5（2026-08-28 01:23）；仍禁止再点发布
- [x] [两周评审提前] GSC 3mo 2/103/1.9%/62.7；网页无 doc.erdonline.com；www `/home` 无 P0 泄漏 ✅ 2026-08-28
- [x] [稿 #15 dunk+demo] `node scripts/growth/build-package.mjs cursor-reads-erd-drawio-cannot` → 主 CTA demo + `utm_source=juejin`；汉字 ≥ 800 ✅ 2026-08-28
- [x] [稿 #15 小红书长文草稿] 梁工造物写长文已填标题+正文，字数 1358，自动保存于 01:32；**未点一键排版、未点发布** ✅ 2026-08-28
- [x] [稿 #16 小红书长文草稿] 梁工造物写长文已填标题+开头/中间/结尾，字数 1385，自动保存于 02:05；**未点一键排版、未点发布** ✅ 2026-08-28
- [x] [对照页 draw.io] `/compare` + 落地摘要表含 draw.io 列与「关系语义 / 外键」；对照 title 含 draw.io；www H1/SERP 未改 ✅ 2026-08-28
- [x] [catalog 独立 SEO] `catalog.spec.ts`「列表 SEO」title 含「ER 图模板」且不含 Draw ER Diagram Online；`i18n.spec.ts` `/en/catalog` 含 ER diagram templates；www H1/SERP 未改 ✅ 2026-08-28
- [x] [掘金粘贴包] `content/articles/cursor-mcp-read-and-suggest-version.juejin.md` 主 CTA 为文档 MCP + `utm_source=juejin` ✅ 2026-08-28
- [ ] [掘金发 #13] Chrome 登录掘金后粘贴上述稿 → 公开发布 URL（本机 2026-08-28 为验证码墙，未发；切片 6 跳过）
- [x] [稿 #14 CI schema-lint] `node scripts/growth/build-package.mjs ci-rest-projectjson-schema-lint` → 主 CTA 文档 MCP 页 + `utm_source=juejin`；汉字 ≥ 800 ✅ 2026-08-28
- [x] [projectJSON schema lint] `node scripts/validate-projectjson.mjs` 正例过、负例非零 ✅ 2026-08-28
- [x] [www SERP] 落地页 H1 仍 Git + Figma；静态 title 仍 Draw ER Diagram Online ✅ 未改 title；landing E2E 仍断言 draw-ERD
- [x] [Home MCP 次入口] `yarn test:e2e --project=chromium tests/e2e/home-mcp.spec.ts` ✅ 2026-08-28
- [x] [切片 7 MCP 文档 live] 中/英 `/docs/guide/api-and-mcp/` 200、canonical 尾斜杠、sitemap loc 尾斜杠；无斜杠 308 ✅ curl 2026-08-28
- [x] [切片 7 GSC] 两 URL 未知 → 已请求编入索引；GSC 补交 `en/sitemap.xml` 成功（66 URL）✅ 2026-08-28
- [x] [GSC catalog/compare] `/catalog` `/compare` `/en/compare` 已收录；`/en/catalog` 已发现尚未编入索引 → 已请求编入索引；四 URL curl 200、未检查 301、未发 XHS ✅ 2026-08-28
- [x] [公开路径 prerender 壳] `yarn test:seo-static`：`/catalog` `/compare` `/en` `/en/catalog` `/en/compare` 首屏 canonical 为该路径，不是首页；`_redirects` 无这些精确路径的 `200` 反代 ✅ 2026-08-28
- [x] [catalog 详情壳] `yarn test:seo-static` + prod-smoke：`/catalog/demo-authz` title 非 Draw-ERD、canonical 非 `https://www.erdonline.com/`；未知 ID 走 `_item` 列表壳 ✅ 2026-08-28

## 英文漏斗 i18n / SEO（2026-08-12）

- [x] [i18n 键对齐 CI] `cd frontend && yarn check:i18n-keys` → 4 locale 文件、952 键、zh/en 零 diff、占位符一致 ✅ 2026-08-12
- [x] [硬编码中文棘轮 CI] `cd frontend && yarn check:i18n-cjk` → baseline 1570 CJK 字符，只减不增 ✅ 2026-08-12
- [x] [LocaleRoute 路由 flatten] `cd frontend && yarn check:routes` PASS；`node scripts/check-routes.mjs --self-test` bad fixture FAIL / good PASS ✅ 2026-08-12
- [x] [生产 boot smoke] `cd frontend && PROD_SMOKE_SKIP_BUILD=1 yarn check:prod-smoke` → 6 公开 URL 无 pageerror、`#root` 有内容 ✅ 2026-08-12
- [x] [catalog 英文 UI] `localStorage umi_locale=en-US` → `/catalog` 顶栏与筛选为英文（Template catalog / Trending…），无 `catalog.*` 裸键 ✅ Playwright 2026-08-12
- [x] [docsUrl 单测] `cd frontend && npx tsx src/utils/docsUrl.test.ts` 路径带尾斜杠 ✅ 2026-08-27
- [x] [文档站 SEO 尾斜杠] `cd website && yarn build && yarn test:seo`：sitemap loc 全带 `/`、无 `/search`、`_redirects` 目标带 `/` ✅ 构建门禁
- [x] [落地页 Docs 分流] 英文态页脚 Docs → `https://doc.erdonline.com/en/`；中文态 → `https://doc.erdonline.com/`（无 `/en/`）✅ Playwright 生产 2026-08-27
- [ ] [分享页 SEO] `/s/public-demo` 英文态 `document.title` 含 demo 文案；`meta[name=description]` 非空；`html[lang=en]`

## 主站 SEO 索引（2026-08-12）

- [x] [构建产物] `cd frontend && yarn build` → `dist/sitemap.xml` + `robots.txt` + `_redirects` + `404.html`；`xmllint --noout dist/sitemap.xml` ✅ 2026-08-12
- [x] [线上 sitemap] 部署后 `curl -sI https://www.erdonline.com/sitemap.xml` → `content-type` 含 xml，非 HTML ✅ 2026-08-27
- [ ] [线上真 404] 部署后 `curl -sI https://www.erdonline.com/__seo_health_nonexistent_path__` → HTTP 404
- [ ] [线上 SPA 仍 200] 部署后 `/compare`、`/catalog`、`/demo`、`/login`、`/s/public-demo` 仍 200

## 会话 JWT TTL（2026-08-11）

- [x] [登录 expires_in] `POST /auth/login` 响应 `expires_in` 为 `604800`（7 天；或部署覆盖的 `JWT_EXPIRES_IN`） ✅ curl 2026-08-11

## 字段库 / ADR-0032（2026-08-09）

- [x] [平台种子 apply] `POST /dataDict/dd-field-gender/apply` 返回 fields+enums 且带 `dictRef` ✅`DataDictServiceImplApplyTest`
- [x] [scope ACL] platform 只读；group 成员可写；user 本人可写 ✅`DataDictAclTest`
- [x] [E2E 写入] 表设计 JExcel 工具栏「从字段库写入」→ 追加性别 → `gender` 列落盘 ✅`field-library-insert.spec.ts`
- [x] [E2E 覆盖] 选中行 → 从字段库写入 → 覆盖为 `gender` ✅`field-library-insert.spec.ts`
- [x] [E2E 菜单露出] 项目菜单 → 类型字典 / 字段库页可达；表单新建条目（不手写 JSON）✅`field-library-manage.spec.ts`
- [ ] [手工] 团队项目：字段库 scope=group 条目仅成员可见/可编辑
- [ ] [手工] 设置页 `/design/table/setting/fieldLibrary` 新建个人条目 CRUD
- [ ] [手工] 表字段空态「从字段库写入」→ Modal → 管理字段库深链

## 数据源凭证落库加密 / R-DATA-06 · ADR-0024（2026-08-05）

- [x] [加解密 roundtrip] 明文→密文→明文一致；IV 随机不重复；篡改/错密钥抛异常 ✅`DataSourceCredentialCipherTest`
- [x] [幂等加密] 已加密值再 `encrypt()` 不二次包裹 ✅`DataSourceCredentialCipherTest#encrypt_isIdempotent_doesNotDoubleEncrypt`
- [x] [存量明文透传] 无 `enc:v1:` 前缀原样返回，不抛异常 ✅`DataSourceCredentialCipherTest#decrypt_legacyPlaintext_passesThroughUnchanged`
- [x] [prod fail-fast] 空密钥 / 仍用仓库默认值 → 启动拒绝 ✅`DataSourceCredentialCipherTest#prodProfile_*`
- [x] [落库为密文] `POST /ncnb/dataSources` 后直查 MySQL `password` 为 `enc:v1:...` ✅ curl + `docker exec mysql` 2026-08-05
- [x] [API 仍收发明文] `GET /ncnb/dataSources/{id}` 与分页列表 `password`/`username` 为明文，与改动前一致 ✅ curl 2026-08-05
- [x] [渐进迁移] 手工插入明文行 → `GET` 可读明文 → `PATCH` 重新保存 → MySQL 变为密文 ✅ curl 2026-08-05
- [x] [ACL 路径同覆盖] `DataSourceAcl.requireOwned` 直查 mapper 路径同样解密，`ConnectorCredentialResolver` 建连仍拿明文 ✅`ConnectorCredentialResolverTest`（mock 层）+ 手工建连验证需求未变
- [ ] [手工 dogfood] 设计器内新建/编辑数据库连接、测试连接、批量删除，UI 无回归（DatabaseConfigForm/index.tsx 未改动，仅后端加解密透明层）——建议下轮 Playwright UX 走查覆盖

## 联邦登录解绑重登 / ADR-0021（2026-08-05）

- [x] [解绑物理删除] `unlink` 走 `physicalDeleteById` 而非 `deleteById` ✅`FederateUserServiceTest#unlink_isPhysicalDelete_notLogicalDeleteById`
- [x] [解绑后重登不撞已存在] 无邮箱身份按约定用户名重新挂接 ✅`FederateUserServiceTest#resolveForLogin_relinksOrphanedAccount_byConventionUsername_whenLinkMissingAndNoEmail`；有邮箱身份仍走邮箱重新挂接 ✅`resolveForLogin_relinksOrphanedAccount_byEmail_whenUsernameNotConventionBased`
- [x] [防劫持] 候选账号已挂别的 subject 时不重新挂接 ✅`resolveForLogin_doesNotRelink_whenCandidateAlreadyLinkedToDifferentSubject`
- [x] [错误码] 极端并发撞库转 409 `FederateException`，不再裸 500 ✅`resolveForLogin_translatesDuplicateKeyExceptionTo409`
- [x] [存量数据] Flyway `V15` 清掉历史软删行 ✅`./backend/dev-ensure.sh --restart` 日志确认迁移成功 + `SELECT COUNT(*) FROM user_identity_link WHERE del_flag<>'0'`=0
- [ ] [Railway 手工] 真实 Google 账号：登录建号 → 账号设置解绑 → 再次 Google 登录 → 秒登成功（原地复用旧账号，无「已存在」错误、无需重新创建项目）——需真实 IdP 回调，无法自动化，redeploy 后人工走一遍

## 公开 API / ADR-0013

- [x] [PAT 哈希] 铸造后库内仅 `token_hash`/`token_hint`，无明文 ✅`PatTokenCodecTest` + `PersonalAccessTokenAuthTest`
- [x] [scope 门禁] 默认只读；写 scope 须显式铸造 ✅`PatScopesTest`
- [x] [限流骨架] 超配额拒绝 ✅`PublicApiRateLimiterTest`
- [x] [Redis 集群限流] Redisson `RRateLimiter`；超限 DENY；Redis 异常 UNAVAILABLE（fail-closed） ✅`PublicApiRateLimiterTest`
- [x] [手工 dogfood] 登录铸造 → `GET /api/v1/me` 200；无 token / 坏 token → 401；JWT 调 `/api/v1/me` → 401 ✅ 2026-08-04
- [x] [projects 列表] PAT + `projects:read` → `GET /api/v1/projects` 仅成员项目 ✅`PublicApiProjectServiceTest` + curl
- [x] [projects 详情] 非成员 403；`projectJSON.profile.dbs` 空列表 ✅`PublicApiProjectServiceTest` + `ProjectShareSanitizeTest`
- [x] [手工 dogfood] 铸造 → projects 列表/详情 200；无 PAT / JWT → 401 ✅ 2026-08-04
- [x] [versions 列表] PAT + `versions:read` + 成员 → `GET /api/v1/projects/{id}/versions` ✅`PublicApiVersionServiceTest` + curl
- [x] [versions 详情] 跨项目 versionId → 404；`projectJSON.profile.dbs` 空列表 ✅`PublicApiVersionServiceTest` + curl
- [x] [手工 dogfood] 铸造 → versions 列表/详情 200；缺 `versions:read` → 403 ✅ 2026-08-04
- [x] [MCP 只读骨架] `cd mcp && yarn dogfood`：tools 五只读 + REST；无写 tool ✅ 2026-08-04（切片 4）
- [x] [写 scope 铸造] `projects:write` / `versions:write` 可铸造；默认仍只读 ✅`PatScopesTest`
- [x] [POST versions] `versions:write` + 成员 → 创建版本；清 `profile.dbs`；无写 scope → 403 ✅`PublicApiVersionServiceTest` + dogfood
- [x] [PATCH project] `projects:write` + 成员 → 改 `projectName`；无写 scope → 403 ✅`PublicApiProjectServiceTest` + curl
- [x] [PUT projectJSON] 写入前清 `profile.dbs`；非成员 403 ✅`PublicApiProjectServiceTest` + curl
- [x] [MCP create_version] `yarn dogfood`：REST 写 + MCP `create_version` ✅ 2026-08-04
- [x] [MCP projects:write] `yarn dogfood`：MCP `update_project` + `put_project_json`；只读 PAT → 403 ✅ 2026-08-04
- [x] [OAuth client 哈希] 注册后库内仅 `client_secret_hash`/`hint`，无明文 ✅`OAuthClientCodecTest`
- [x] [OAuth client_credentials] 有效凭证 → `erd_oat_`；坏 secret → `invalid_client`；scope ⊆ 客户端 ✅`OAuthClientCodecTest` + curl
- [x] [OAuth /api/v1] OAT Bearer → `GET /api/v1/me` 200；与 PAT 同链；会话 JWT → 401 ✅ curl 2026-08-04
- [x] [OAuth ignore] `/oauth/token` `/auth/oauth/token` 在 ignore-urls；无 CORS 放宽 ✅`DeadSecurityConfigContractTest`
- [x] [OAuth PKCE] S256 round-trip；redirect 精确匹配；拒 http 非 localhost ✅`OAuthClientCodecTest`
- [x] [OAuth authorize] 会话 JWT → 302 `code`+`state`；未注册 redirect → JSON 不 302；无 JWT → 401 ✅ curl 2026-08-04
- [x] [OAuth auth_code 换票] public：code+verifier→`erd_oat_`；坏 verifier / 重放 code → `invalid_grant`；code 库仅哈希 ✅ curl 2026-08-04
- [x] [OAuth public 禁 M2M] public client `client_credentials` → `unauthorized_client` ✅ curl 2026-08-04
- [x] [OAuth confidential code] 无 secret → `invalid_client`；有 secret+PKCE → OAT ✅ curl 2026-08-04
- [x] [OAuth client 管理 UI] `/account/settings?selectKey=oauthClients` 注册→secret 揭示→复制 ID→吊销 ✅`oauth-clients.spec.ts`
- [x] [PAT 管理 UI] `/account/settings?selectKey=personalAccessTokens` 铸造→明文揭示→复制→吊销 ✅`personal-access-tokens.spec.ts`
- [x] [PAT 揭示弹层 mcp.json] 铸造后见 `pat-mcp-json`（含 `mcpServers` + 明文 PAT）+ 复制按钮 ✅`personal-access-tokens.spec.ts` 2026-08-28
- [x] [文档 MCP 三截图] 指南含 `/img/guide/mcp-pat-reveal.png` `/img/guide/mcp-json.png` `/img/guide/mcp-agent-tools.png`；XHS 封面副本在 `content/articles/assets/` ✅ 2026-08-28

## 图本身可读可分享 / ADR-0016（续）

- [x] [几何择柄] 竖叠同列表 FK → `data-port=same`；截图 `diagram-port-same-side.png` ✅`relation.spec.ts`「PK/FK 与边样式」
- [x] [字段行再压一档] `.erd-field-row` min-height 22 / line-height 16 / pad 2；`FIELD_ROW_H=26` ✅`graphLayout.test.ts` + `relation.spec.ts`「表节点视觉」
- [x] [表节点密表再压] 表头 pad ≤6；字段行 minH 20 / lh 15 / pad 1；`FIELD_ROW_H=24`；标题/徽章层次不动；截图 `diagram-table-node-density.png` / `demo-table-node-density.png` ✅`graphLayout.test.ts` + `relation.spec`「PK/FK」+ `demo.spec`
- [x] [表节点底栏/空表井碎距] 表头/字段行已密不改；添加 margin≤6 + minH≥22；打开表设计 margin≤6×4 + btn minH≥22；空表井 pad≤6 / gap≤4 / marginT≤4；`NODE_FOOTER_H=28`；截图 `diagram-table-fields-empty-dense.png` ✅`relation`「PK/FK」+ `table-field-empty`「画布空表」
- [x] [导入后首屏] 空态「导入 DBML」→ 直开关系图 + 节点落入画布可视区；截图 `diagram-import-first-screen.png` ✅`dbml-import.spec.ts`「空态导入 DBML」

### 已自动化

- [x] 工作台壳外井次密：HomeLayout shell/body ≤12×16；GroupLayout content/body ≤12×16；列表空态 ≤12；截图 `workspace-shell-dense.png` / `group-shell-dense.png` ✅`layout-outlet.spec.ts`
- [x] 模型树「表/关系」默认展开：不点 switcher 即见三层 + `tree-open-relation` ✅`model-design-ux.spec.ts`
- [x] 树虚拟滚动：`.ant-tree-list-holder` 承载（100+ 表不卡）✅`model-design-ux.spec.ts`
- [x] 左树行高密度：treenode ≤24（目标 ~22）/ font ≤13；截图 `diagram-left-tree-dense.png` ✅`model-design-ux.spec.ts`
- [x] 左树工具条/次密距：工具条 ≤32（目标 ~28）/ 新建·搜索控件 ∈24–28；图标不 clip；sider padX ≤20；新建 Tab focus-visible ✅`model-design-ux.spec.ts`
- [x] CommonTabs / 表设计签头密度：签栏 ≤26（目标 ~24）+ 签头 ≤28；签头 padX≤8 / gap≤4；内签 gutter/marginR≤2；不 clip 标签/关闭；Tab focus-visible + Cmd+1/2/3；截图 `diagram-common-tabs-dense.png` ✅`model-design-ux.spec.ts`「表设计三签」「表设计内签」
- [x] CommonTabs 签头键盘：←/→ 移焦 + Enter 激活；关闭「关闭 `{表名}`」；关签焦点归还；内签同构 ✅`common-tabs-keyboard.spec.ts`
- [x] 审批/工单 SQL 明细：`Modal.info` 首焦「知道了」；Esc/OK 归还「查看SQL」；Tab trap ✅`sql-detail-keyboard.spec.ts`
- [x] 导入跳过校验：二次导入全跳过 → 首焦「知道了」；Esc/OK 归还「解析并导入」；Tab trap ✅`import-skip-warning-keyboard.spec.ts`
- [x] 工作台 databaseConfig Drawer：新建/编辑首焦「连接名称」；Esc 归还触发器；Tab trap ✅`database-config-drawer-keyboard.spec.ts`
- [x] JExcel Escape 退格 / 快捷操作：Esc 归还网格；快捷操作首焦「知道了」；Esc 归还；Tab trap ✅`jexcel-grid-keyboard.spec.ts`
- [x] 版本同步结果弹层：成功/失败首焦「知道了」；Esc 归还「同步」；Tab trap ✅`version-sync-result-keyboard.spec.ts`
- [x] 版本列表行密度：行 pad-block ≤10 / 标题 ≤14 / 顶栏 ≤32；截图 `diagram-version-list-dense.png` ✅`version.spec.ts`
- [x] 版本工具条二次密度/碎色：控件 ∈24–28；图标不 clip；增删摘要·hint 色 ≡ `--erd-success`/`--erd-brand`/`--erd-ink-600`；新增钮 Tab focus-visible ✅`version.spec.ts`
- [x] 工单/审批列表密度：标题栏 ≤32（目标 ~24）/ 行 pad-block ≤10 / 动作钮 ∈22–28；图标不 clip；动作钮 focus-visible；截图 `approval-list-dense.png` / `order-list-dense.png` ✅`approval.spec.ts`
- [x] 设计器次屏 JExcel 密度：工具栏 ≤32 / 表头·行 pad-block ≤10 / 行高 ≤32；图标不 clip；撤销钮 Tab focus-visible；截图 `diagram-jexcel-dense.png` ✅`model-design-ux.spec.ts`
- [x] 元数据应用子签密度：CodeTab/DbTab 栏 ≤26（目标 ~24）；不 clip 标签；子签 Tab focus-visible；Cmd+1/2/3 不回归；截图 `diagram-code-tabs-dense.png` ✅`model-design-ux.spec.ts`
- [x] 表设计内签密度：字段/索引/元数据栏 ≤26（目标 ~24）；不 clip 标签；内签 Tab focus-visible；Cmd+1/2/3 不回归；截图 `diagram-inner-tabs-dense.png` ✅`model-design-ux.spec.ts`
- [x] 表设计签体内容次密距：侧 pad ≤16 / 底 pad ≤6；unique-hint pad-block ≤10 / 高 ≤32；JExcel 工具栏不 clip；元数据 tip ≤32 + CodeTab padY ≤4；截图 `diagram-tab-body-dense.png` ✅`model-design-ux.spec.ts`
- [x] 设计器空态次密距：字段/索引 Empty margin ≤8（禁 100 / antd XL）；空态 pad 贴 tab-body；保留 CTA；截图 `diagram-pane-empty-dense.png` ✅`model-design-ux.spec.ts`
- [x] 欢迎空态次密距：`.erd-welcome-empty__inner` padY≤20 / padX≤16；标题 mt∈[8,12] / 字∈[16,18] / lh≈22；hero ≤180；逆向链 + 左树新增模型；截图 `diagram-welcome-empty-dense.png` ✅`model-design-ux.spec.ts`
- [x] AuthBrandShell 次密距：品牌/表单 pad ≤20×16；gap ∈[8,12]；门头 mb ∈[8,12]；表单 Title mt≤8；项 mb∈[8,16]；控件 ∈[24,32]；标题 ≥24；登录/`share-invalid`/注册同源；键盘 Skip/Tab 不回归 ✅`smoke` + `share` + `session`
- [x] LandingChrome / `/compare` 次密距：次屏 section pad ≤52；对照行 pad ≤12；nav ≤20；footer ≤36；compare hero ≤36；hero 品牌字 ≥36 + 全幅；键盘 Skip/Tab 不回归 ✅`landing.spec` + `compare.spec`
- [x] 分享成功态 meta / 表清单次密：meta 高 ≤60 / gap ≤2 / stage pad ≤6；表清单 pad ≤6 / 标题 ≤12 / 行 ∈20–26；弹层 body ≤8 / hint mb ≤8；键盘 Esc/Tab trap 不回归 ✅`demo.spec` + `share-project-keyboard`
- [x] Home hero CTA 簇次密：actions gap ≤8；secondary 钮 pad ≤4×10；hero gap ≤24 / mb·pb ≤16；主 CTA ≥40；问候 ≥28；Skip→主区→CTA/二级入口/项目卡 + focus-visible 不回归 ✅`home-keyboard`
- [x] Home 空态/公告次密：空态 pad ≤24×12；二级入口 mb ≤16；项目区 mb ≤20；公告 pt ≤4 / 行 pad ≤4·gap ≤10 / 标题 ≤13；空态 CTA +「更多公告」保留；键盘不回归 ✅`home-keyboard`
- [x] 设计器次屏碎密度：逆向/DDL Steps ≤10/12；设置 hint mb≤8；SyncConfig `.erd-io-modal`；ReverseTable meta 次密 ✅`designer-secondary-pane`
- [x] 导入/导出弹层 Steps 对齐：`.erd-io-modal__steps` mt/mb ≤10/12 · 标题 ≤13；与次屏同阶；键盘 Esc/Tab 不回归；截图 `diagram-import-steps-dense.png` ✅`reverse-database-keyboard` + `export-ddl-keyboard`
- [x] 右键/树操作菜单密度：项高 ∈26–30（目标 ~28）/ padY≤2 / border-box / font ≤13；图标·文案不 clip；`role=menuitem` + ArrowDown/Esc；截图 `diagram-context-menu-dense.png` ✅`model-design-ux.spec.ts`
- [x] [字段签空态 CTA] 清字段→字段签见「还没有字段」+「添加第一个字段」→ 网格 + 画布 `id`；空态消失 ✅`table-field-empty.spec.ts`
- [x] [画布空表字段 CTA] 清字段见 `canvas-fields-empty` +「添加第一个字段」→ 内联建 NAME → 空态消失 +「添加字段」 ✅`table-field-empty.spec.ts`
- [x] 版本 diff 次屏密度：组头/行 ~24 pad 4×8 + token 色（success/brand/warning）；不回归可视化 diff ✅`version.spec.ts`
- [x] 导入/导出弹层密度：标题 ≤14 / 头·身·脚 pad ≤8×12（禁头 10×14×8 / 脚 8×14）/ OK ≥28≤32；截图 `diagram-import-modal-dense.png` / `diagram-export-modal-dense.png` ✅`dbml-import` / `dbml-export`
- [x] 普通导出页密度：页标题 ≤14 / 卡片 padY ≤20；图标 `currentColor`→`--erd-brand`；截图 `diagram-export-common-dense.png` ✅`export.spec.ts`
- [x] Home 主导航图标 fill ≡ `--erd-brand`（`erdColors.brand`，非组件硬编码）✅`layout-outlet.spec.ts`「三壳同语言」
- [x] dataTypeDomains 树图标 fill ≡ `erdColors.brand`（禁裸 `#DE2910`）；设置页 `/design/table/setting/dataType` 挂载 CRUD ✅`dataTypeDomainsSlice.test.ts` + `datatype-domains-failure`
- [x] 设置页 chrome 密度：标题 ≤14 / 输入·保存钮 ≤32 / 表单项 mb ≤16；截图 `diagram-setting-page-dense.png` ✅`default-field.spec.ts`
- [x] 数据库配置页密度：标题 ≤14 / 工具条钮 ≤32 / 抽屉输入·保存钮 ≤32；截图 `database-config-page-dense.png` ✅`database-config.spec.ts`
- [x] 账号设置 / Home 项目卡密度：标题 ≤14 / 输入·保存钮 ≤32 / 安全行 padY ≤16；卡 padY ≤28；截图 `account-settings-page-dense.png` / `home-project-cards-dense.png` ✅`account-settings` + `layout-outlet`
- [x] 账号 BaseView 左右列次密：`.baseView` gap ≤16（窄屏 ≤12）；禁 24；截图同 `account-settings-page-dense.png` ✅`account-settings` densify
- [x] 顶栏 `erd-chrome-actions` 次密：Home/Group/分享 gap ≤12；Design ≤8；禁 16；截图 `chrome-actions-dense.png` ✅`layout-outlet` densify
- [x] 顶栏 `erd-chrome-header` 次密：Home padX ≤16 + brand–nav gap ≤12；Design gap ≤8；禁 padX20 / gap16；截图 `chrome-header-dense.png` ✅`layout-outlet` densify
- [x] Home 水平导航 Menu 项次密：padX ∈[8,12]；项高 64；命中宽 ≥44；`testid=home-layout-menu`；截图 `home-nav-menu-dense.png` ✅`layout-outlet` densify + `home-keyboard` 回归
- [x] Group 侧栏 nav 行距次密：项高 ∈[28,32]；padX ∈[8,12]；marginY ≤4；`testid=group-layout-sider-menu`；截图 `group-sider-nav-dense.png` ✅`layout-outlet` densify + `group-keyboard` 回归
- [x] 设计器侧栏 nav 行距次密：项高 ∈[28,32]；padX ∈[8,12]；marginY ≤4；`testid=design-layout-sider-menu`；截图 `design-sider-nav-dense.png` ✅`layout-outlet` densify + 侧栏键盘
- [x] 版本列表空态井次密：padY≤12 / padX≤8；禁 16×12；保留「保存第一个版本」；截图 `version-empty-dense.png` ✅`version.spec`「无数据源也可新增版本」
- [x] 项目列表工具条碎距：Space gap ∈[8,12]；搜索高 ≤28；工具条高 ≤32；`testid=project-list-toolbar`；截图 `project-*-list-dense.png` ✅`project-surface` densify + `project-list-keyboard` 回归
- [x] 团队成员工具条碎距：Space gap ∈[8,12]；搜索高 ≤28；工具条高 ≤32 / mb≤8；钮 padX∈[8,12]；`testid=group-user-toolbar`；截图 `group-user-toolbar-dense.png` ✅`group-layout-nav` densify + `group-keyboard` / `add-user-keyboard` 回归
- [x] Group 用户组 Title/左角色签碎距：标题 ≤14/lh≤24/mb≤8；左签 padX∈[8,12]·高∈[28,32]；`testid=group-setting-page`；截图 `group-setting-page-dense.png` ✅`group-layout-nav` densify + `group-keyboard` / `add-user-keyboard` 回归
- [x] Group 基本设置页头碎距：标题 ≤14/lh≤24/mb≤8/mt≤4；`testid=basic-setting-page`；截图 `group-basic-setting-dense.png` ✅`group-basic-setting` densify + `group-layout-nav` / `group-keyboard` 回归
- [x] Group 基本设置 Form 碎距：项 mb≤16（目标12）；Input/Select/钮高≤32（目标28）；label≤13；禁默认 24/32 ✅`group-basic-setting` densify + `group-layout-nav` / `group-keyboard` 回归
- [x] Group 基本设置删区碎片：Divider≤16；body gap≤12；次文≤13/lh≤20；标题 mb≤2；`testid=basic-setting-delete-zone`；确认/aria 不弱化 ✅`group-basic-setting` densify + `group-project-delete-keyboard`
- [x] 个人/最近/团队/公告列表行密度：行 pad-block ≤10 / 标题 ≤14 / 打开钮 ≤32；截图 `project-person-list-dense.png` / `project-recent-list-dense.png` / `project-group-list-dense.png` / `project-notice-list-dense.png` ✅`project-surface.spec.ts` + `project-notice.spec.ts`
- [x] 用户手动折叠模块不被默认展开回顶 ✅`model-design-ux.spec.ts`
- [x] 表设计三签：签头表名/模型层级 + 字段/索引/元数据应用切换 ✅`model-design-ux.spec.ts`
- [x] 画布「索引」→ 表设计索引签（无死 affordance；再入仍落索引）✅`relation.spec.ts`「画布打开索引签」
- [x] [索引签空态 CTA] 画布→索引见「还没有索引」+「添加第一个索引」→ toast「索引更新成功」+ 表头「索引名*」+ `T_TABLE_1_IDX1`；空态消失 ✅`relation.spec.ts`「索引签空态 CTA」
- [x] [索引签再加一行 CTA] 首条后见「+ 再添加一条索引」→ toast + `T_TABLE_1_IDX2`；`index-add-row` 仍可见 ✅`relation.spec.ts`「索引签再加一行 CTA」
- [x] [索引签删除二次确认] 「删除索引 `{name}`」→ 取消保留；确认 toast「索引更新成功」+ 空态「添加第一个索引」；`index-delete-list` 消失 ✅`relation.spec.ts`「索引签删除二次确认」
- [x] [JExcel 工具栏删除二次确认] 字段签选中行→「删除选中行」→ 取消保留；确认后网格与画布无该字段 ✅`relation.spec.ts`「JExcel 工具栏删除二次确认」+ 键盘 ✅`jexcel-toolbar-delete-keyboard.spec.ts`
- [x] [表设计字段签 Tab 焦点序] hint→撤销→重做→末尾增加一行；Enter 增行；网格 Shift+Tab 回「快捷操作」 ✅`relation.spec.ts`「工具栏 Tab 可达」
- [x] [设计器 Skip + 焦点环] 首项 Tab「跳到模型树」→ `erd-design-tree` → Tab 入搜索；「跳到主工作区」→ `erd-design-workspace` → Tab 离地标（无 trap） ✅`relation.spec.ts`「设计器 Skip」
- [x] [画布字段浏览器 Tab 环] 选中表 Tab 穿字段→添加字段→开表设计后可脱出；未选中表 `tabIndex=-1` ✅`relation.spec.ts`「字段浏览器 Tab 环」
- [x] [画布 chrome Tab 序] Controls 四钮 → 工具栏；MiniMap svg `tabindex=-1`；Controls `:focus-visible` brand 环；Shift+Tab 回 Controls 无 trap ✅`relation.spec.ts`「画布 chrome Tab 序」
- [x] [左树键盘漫游] Skip→↓入树；active `data-tree-kb-active` brand 环；Enter 定位表 + 开关系；Skip→Tab 进搜索无 trap ✅`relation.spec.ts`「左树键盘漫游」
- [x] [画布节点级 Tab] 无选中无 RF node wrapper/`erd-edge-label` 进序；选中边 chip Enter 开基数；Frame Enter 重命名 ✅`relation.spec.ts`「画布节点级 Tab」
- [x] [分享壳键盘] `/demo` 首项 Tab Skip「跳到关系图」→ stage → Tab 离地标；Controls 三钮进序；MiniMap `tabindex=-1`；适应画布 focus-visible brand 环 ✅`share.spec.ts`「分享壳键盘」
- [x] [登录壳键盘] `/login` 首项 Tab Skip「跳到登录表单」→ `#auth-form-anchor` → Tab 入用户名；密码 Enter 错误凭证 toast；登录钮 focus-visible brand 环；无 trap ✅`session.spec.ts`「登录壳键盘」
- [x] [注册壳键盘] `/register` Skip「跳到注册表单」→ `#auth-form-anchor` → 字段 Tab 序（tip 出序）；末字段 Enter 密码不一致 toast；注册钮 focus-visible brand 环；无 trap ✅`session.spec.ts`「注册壳键盘」
- [x] [落地页键盘] `/` 首项 Tab Skip「跳到主操作」→ `#landing-main-cta` → Tab 入「在线试用」；试用→注册→登录可逆；主 CTA focus-visible surface 环；无 trap ✅`landing.spec.ts`「落地页键盘」
- [x] [竞品对照页键盘] `/compare` 首项 Tab Skip「跳到主操作」→ `#landing-main-cta`→「打开演示」→「自部署指南」→「返回产品首页」可逆；surface focus-visible；无 trap ✅`compare.spec.ts`「竞品对照页键盘」
- [x] [Home 工作台键盘] `/home` 首项 Tab Skip「跳到主内容」→ `#home-main-content`→继续建模→新建→示例→二级入口→项目卡可逆；brand focus-visible；无 trap ✅`home-keyboard.spec.ts`「Home 键盘」
- [x] [GroupLayout 壳键盘] `/project/group/setting/basic` 首项 Tab Skip「跳到主内容」→ `#group-main-content`→项目名→标签→项目描述可逆；侧栏链 brand focus-visible；无 trap ✅`group-keyboard.spec.ts`「Group 键盘」
- [x] [项目列表行键盘] 个人/最近/团队 stretched link 消死卡；Enter 开设计器；Tab 行内动作可逆；行 `:has` brand focus-visible；无 trap ✅`project-list-keyboard.spec.ts`
- [x] [账号设置壳键盘] `/account/settings` 首项 Tab Skip「跳到主表单」→ `#account-settings-form`→邮箱→电话→更新基本信息可逆；brand focus-visible；无 trap ✅`account-settings-keyboard.spec.ts`
- [x] [项目动作弹窗键盘] 新建首焦类型 / 修改首焦项目名 / 删除首焦「是」；Esc 关窗归还触发器；Tab trap 在 dialog ✅`project-action-modals-keyboard.spec.ts`
- [x] [导入导出弹层键盘] 空态导入首焦 DBML文本 / 菜单导出首焦模型 Select；Esc 归还 CTA/项目菜单；Tab trap ✅`import-export-keyboard.spec.ts`
- [x] [版本动作弹窗键盘] 新增/编辑首焦版本号（非最新编辑首焦描述）/ 删除·回滚首焦「是」；Esc 关窗归还触发器；Tab trap 在 dialog ✅`version-action-modals-keyboard.spec.ts`
- [x] [版本对比/详情 diff 键盘] 比对首焦「初始版本」/ 详情首焦「导出变更清单」；Esc 关窗归还触发器；Tab trap 在 dialog ✅`version-diff-keyboard.spec.ts`
- [x] [同步配置/重建版本键盘] 同步配置首焦「字段增量」/ 重建版本首焦「版本号」；Esc 关窗归还触发器；Tab trap 在 dialog ✅`version-sync-rebuild-keyboard.spec.ts`
- [x] [重建基线确认键盘] 重建版本表单提交→「重建基线」确认首焦「重建」；Esc 关确认不落盘、归还重建钮；Tab trap ✅`version-rebuild-confirm-keyboard.spec.ts`
- [x] [初始化基线键盘] 有数据源且未建基线时首焦「版本号」；Esc 关窗归还触发器；Tab trap 在 dialog ✅`version-init-keyboard.spec.ts`
- [x] [复刻弹层键盘] 版本行「复刻」首焦「项目名」；Esc 关窗归还触发器；Tab trap 在 dialog ✅`project-copy-keyboard.spec.ts`
- [x] [数据源设置键盘] 项目菜单→数据源设置首焦「新增数据源」；Esc 关窗归还「项目菜单」；Tab trap 在 dialog ✅`database-setup-keyboard.spec.ts`
- [x] [默认项设置键盘] 项目菜单→默认项设置首焦「默认字段」；Esc 关窗归还「项目菜单」；Tab trap 在 dialog ✅`default-setup-keyboard.spec.ts`
- [x] [数据源逆向解析键盘] 项目菜单→数据源逆向解析首焦「数据源」；Esc 关窗归还「项目菜单」；Tab trap 在 dialog ✅`reverse-database-keyboard.spec.ts`
- [x] [导出DDL键盘] 项目菜单→导出DDL首焦「数据源」；Esc 关窗归还「项目菜单」；Tab trap 在 dialog ✅`export-ddl-keyboard.spec.ts`
- [x] [解析ERD文件键盘] 项目菜单→解析ERD文件首焦上传区「选择ERD文件」；Esc 关窗归还「项目菜单」；Tab trap 在 dialog ✅`reverse-erd-keyboard.spec.ts`
- [x] [解析PdMan文件键盘] 项目菜单→解析PdMan文件首焦上传区「选择PdMan文件」；Esc 关窗归还「项目菜单」；Tab trap 在 dialog ✅`reverse-pdman-keyboard.spec.ts`
- [x] [修改密码键盘] `/account/settings?selectKey=security` →「修改密码」首焦「密码」；Esc 关窗归还触发器；Tab trap 在 dialog ✅`reset-password-keyboard.spec.ts`
- [x] [修改密码失败不关窗] mock `settings/update` 业务码 → toast「模拟更新密码拒绝」+ 窗仍开 → 二次成功关窗+「更新密码信息成功」 ✅`reset-password-failure.spec.ts`
- [x] [同步配置失败不关窗] mock `project/save`（upgradeType=rebuild）业务码 → toast「模拟同步配置拒绝」+ 窗仍开 → 二次成功关窗+「设置成功」 ✅`sync-config-failure.spec.ts`
- [x] [默认项设置失败不关窗] mock `project/save`（sqlConfig 标记）业务码 → toast「模拟默认项设置拒绝」+ 窗仍开 → 二次成功关窗+「设置成功」 ✅`default-setup-failure.spec.ts`
- [x] [数据源设置确定失败不关窗] mock PUT `dataSources`（url 标记）业务码 → toast「模拟数据源保存拒绝」+ 窗仍开 → 二次成功关窗+「保存成功！」 ✅`database-setup-failure.spec.ts`
- [x] [EntityModal 落盘失败不关窗] mock `project/save`（modules 含新模型名）业务码 → toast「模拟模型保存拒绝」+ 窗仍开 → 二次成功关窗+「模型添加成功」；键盘闭环不回归 ✅`entity-modal-failure.spec.ts` + `entity-modal-keyboard.spec.ts`
- [x] [画布关系图弹层落盘失败不关窗] mock `project/save`（diagrams 含新图名）业务码 → toast「模拟关系图保存拒绝」+ 窗仍开 → 二次成功关窗+「已新建关系图」+ switcher ✅`diagram-modal-failure.spec.ts`
- [x] [画布关系图弹层键盘] 工具栏「新建关系图」→ 首焦「关系图名称」；Tab trap；Esc 关窗归还触发器 ✅`diagram-modal-keyboard.spec.ts`
- [x] [数据类型字典弹层键盘] 设置页「新增字段类型」→ 首焦「类型名称」；Tab trap；Esc 关窗归还触发器 ✅`datatype-domains-keyboard.spec.ts`
- [x] [数据类型字典枚举域 UX] 「新增枚举」→ kind=enum + values[] 落盘；列表种类/取值；编辑追加取值；定位 role/aria/testid ✅`datatype-enum-ux.spec.ts`
- [x] [字段类型下拉区分枚举] 字典建枚举 → 画布 type select 有 optgroup「枚举」→ 选 code 落盘 + 浏览态徽章；定位 combobox/testid；勿扫 `.ant-*` ✅`field-type-enum-picker.spec.ts`
- [x] [逻辑类型 apply 方言映射] `/setting/dataType` 新增/编辑逻辑类型 → 填 MYSQL/PG/… 物理类型 → save 含 `apply[code].type`；枚举弹层无 apply 编辑器；定位 role/aria/testid ✅`datatype-apply-ux.spec.ts`
- [x] [画布表头改名落盘失败不退出编辑] mock `project/save`（entities 含新表名）业务码 → toast「模拟表改名保存拒绝」+ 编辑态仍开（草稿保留、旧节点 id）→ 二次成功改节点 id ✅`table-rename-failure.spec.ts`
- [x] [画布建表/行内加字段落盘失败可重试] mock save（entities 含 T_TABLE_1 / fields 含新字段）→ toast + 无节点或仍编辑草稿 → 重试成功上图/落字段；空字段 CTA / 空名 toast 不回归 ✅`canvas-create-field-failure.spec.ts`
- [x] [画布字段改名/删字段落盘失败可重试] mock save（改名 fields 含新名 / 删缺 NAME）→ toast + 仍编辑或行仍在+确认可再删 → 重试成功；空名 toast / 删二次确认不回归 ✅`canvas-field-rename-delete-failure.spec.ts`
- [x] [画布字段 meta 落盘失败可重试] mock save（PK / Integer 类型 / relationNoShow / 浏览态 PK）→ toast + 勾选/类型回滚或行仍可见 → 重试成功；happy 路径 relation 不回归 ✅`canvas-field-meta-failure.spec.ts`
- [x] [表设计 JExcel 字段 meta 落盘失败可重试] mock save（字段签 PK / 隐藏）→ toast + 勾选回滚 → 重试成功 + 画布对齐；工具栏删行/半成品/空态 CTA 不回归 ✅`jexcel-field-meta-failure.spec.ts`
- [x] [表设计索引签落盘失败可重试] mock save（添加第一个索引 / 勾是否唯一）→ toast + 空态或勾选回滚 → 重试成功 + 画布 UK；空态 CTA/再加/删除/键盘不回归 ✅`jexcel-index-failure.spec.ts`
- [x] [默认字段落盘失败可重试] mock save（改默认主键英文名）→ toast + 网格回滚仍为 id → 重试成功 + 新表带重命名字段；既有成功路径不回归 ✅`default-field-failure.spec.ts` / `default-field.spec.ts`
- [x] [画布删表落盘失败可重试] mock save（全 modules 缺 T_TABLE_1）→ toast「模拟删表保存拒绝」+ 节点仍在+确认可再删（无「表删除成功」）→ 重试移出；二次确认/键盘不回归 ✅`canvas-delete-table-failure.spec.ts` / `relation`「画布删表/删边二次确认」
- [x] [左树删模型/关系图落盘失败可重试] mock save（缺关系图名 / 缺模块名）→ toast 模拟拒绝 + 树/表仍在+确认可再删（无成功 toast）→ 重试移出；二次确认不回归 ✅`tree-delete-module-diagram-failure.spec.ts` / `multi-diagram`「左树删除关系图/模型二次确认」
- [x] [画布删边/删分组落盘失败可重试] mock save（缺 T_ORDER→T_TABLE_1 关联 / groups 空）→ toast 模拟拒绝 + 边/框仍在+确认可再删（无成功 toast）→ 重试移出；二次确认/键盘不回归 ✅`canvas-delete-edge-frame-failure.spec.ts` / `canvas-delete-edge-frame-keyboard.spec.ts` / `diagram-frame`「删除分组二次确认」
- [x] [左树剪切/粘贴表落盘失败可重试] mock save（含 T_TABLE_1副本 / 缺 T_TABLE_1）→ toast 模拟拒绝 + 无副本或表仍在（无成功 toast / 无「剪切成功」）→ 重试粘贴出现副本 / 剪切移出；定位 role/aria（勿扫 `.ant-*`） ✅`tree-cut-paste-failure.spec.ts`
- [x] [画布拖表坐标落盘失败可回滚] mock save（layout 位移 T_TABLE_1）→ toast「模拟布局保存拒绝」+ transform 回滚（无已保存伪装）→ 重试拖动成功；定位 `rfNode`/`save-status`（勿扫 `.ant-*`） ✅`canvas-drag-reposition-failure.spec.ts`
- [x] [画布对齐/自动布局落盘失败可回滚] mock save（左齐两表同 x / 自动布局位移）→ toast 拒绝 + transform 回滚 → 重试成功；定位 `align-left` / `aria-label=自动布局` / `rfNode`（勿扫 `.ant-*`） ✅`canvas-align-layout-failure.spec.ts`
- [x] [Frame 改名/适应成员落盘失败可回滚] mock save → toast「模拟分组保存拒绝」+ 改名草稿保留/适应成员 RF+store 回滚（无「已适应成员」）→ 重试成功；定位 `frame-rename-*` / `diagram-frame` / 「适应成员」（勿扫 `.ant-*`） ✅`canvas-frame-rename-bounds-failure.spec.ts`
- [x] [Frame 新建/成员加减落盘失败可回滚] mock save → toast「模拟分组保存拒绝」+ 新建不上图/加入成员仍 0（无成功 toast）→ 重试成功；定位「新建分组」/「加入分组」/ `diagram-frame`（勿扫 `.ant-*`） ✅`canvas-frame-members-failure.spec.ts`
- [x] [画布连线建关联落盘失败可重试] mock save → toast「模拟连线保存拒绝」+ 不上边（无 `erd-edge-label`）→ 重试成功上边；定位 `rfNode` / `data-handleid` / `erd-edge-label`（勿扫 `.ant-*`） ✅`canvas-connect-edge-failure.spec.ts`
- [x] [画布改边基数落盘失败可重试] mock save → toast「模拟基数保存拒绝」+ chip 仍 `n:1` → 重试成功 `1:1`；定位 `erd-edge-label` / `erd-edge-cardinality` / `role=option`（勿扫 `.ant-*`） ✅`canvas-cardinality-failure.spec.ts`
- [x] [画布边 FK 元数据可编辑] 点 chip → 约束名 + ON DELETE/UPDATE；失败 toast 保持空 → 重试 CASCADE/RESTRICT + `fk_order_user` 落盘 + 刷新；定位勿扫 `.ant-*` ✅`canvas-fk-meta-edit.spec.ts`
- [x] [数据类型字典落盘失败可重试] 设置页新增类型 mock save → toast「模拟数据类型保存拒绝」+ 窗仍开、表无新行 → 重试成功入表；定位 `datatype-domains-page` / `role=dialog` / aria-label（勿扫 `.ant-*`） ✅`datatype-domains-failure.spec.ts`
- [x] [ERD 导入落盘失败可重试] 项目菜单→解析ERD mock save → toast「模拟ERD导入保存拒绝」+ 窗仍开、树无「ERD导入」→ 重传成功入树；定位 `role=dialog` / complementary（勿扫 `.ant-*`） ✅`import-erd-failure.spec.ts`
- [x] [默认数据源切换落盘失败可重试] 数据源设置：两源切默认 mock save → toast「模拟默认数据源保存拒绝」+「当前使用的数据源」仍为第一源 → 重试切到第二源；定位 `role=radio` aria「设为默认数据源 …」（勿扫 `.ant-*`） ✅`default-db-failure.spec.ts`
- [x] [版本回滚落盘失败可重试] 存 1.0.0→加 REMARK→存 1.0.1→回滚 1.0.0 mock save → toast「模拟回滚保存拒绝」+ 窗仍开 + 画布仍有 REMARK → 重试成功字段消失；定位 `role=dialog`「回滚版本」/ `aria-label=回滚版本`（勿扫 `.ant-*`） ✅`version-revert-failure.spec.ts`
- [x] [WORD 模板下载空/JSON 假文件] 默认项设置→默认配置→「下载模板」mock 空 blob / JSON 错误体 → toast「下载模板出错」+ 无 download 事件；定位 `role=dialog`「默认项设置」/ `role=button`「下载模板」（勿扫 `.ant-*`） ✅`word-template-download-failure.spec.ts`
- [x] [Word gendocx 空/JSON/非 ZIP 假文件] 导出文件页→「导出Word」mock JSON / 空 blob / 非 ZIP octet-stream → toast「Word导出失败」+ 无 download；定位 `role=button`「导出Word」/`testid=export-common-page`（勿扫 `.ant-*`） ✅`word-gendocx-download-failure.spec.ts`
- [x] [SQL审批键盘] 团队项目→版本「提交工单」→详情「SQL审批」首焦「审批人」；Esc 关窗归还触发器且父详情仍开；Tab trap ✅`sql-approval-keyboard.spec.ts`
- [x] [添加成员键盘] 团队项目→权限组「团队普通成员」→「添加成员」首焦「选择用户」；Esc 关窗归还触发器；Tab trap ✅`add-user-keyboard.spec.ts`
- [x] [只读分享键盘] 设计器顶栏「只读分享」首焦「分享链接」；Esc 关窗归还触发器；Tab trap ✅`share-project-keyboard.spec.ts`
- [x] [EntityModal 键盘] 设计器空态「新增模型」首焦「名称」；Esc 关窗归还触发器；Tab trap ✅`entity-modal-keyboard.spec.ts`
- [x] [画布删表确认键盘] RF 选中表 Delete → 首焦「删除」；Esc 关窗归还不删；Tab trap ✅`canvas-delete-table-keyboard.spec.ts`
- [x] [画布删边/删分组确认键盘] RF 选中边/分组 Delete → 首焦「删除」；Esc 关窗归还不删；Tab trap ✅`canvas-delete-edge-frame-keyboard.spec.ts`
- [x] [画布删字段确认键盘] 字段浏览器 ×「删除字段」→ 首焦「删除」；Esc 关窗归还不删；Tab trap ✅`canvas-delete-field-keyboard.spec.ts`
- [x] [表设计删索引确认键盘] 索引签「删除索引」→ 首焦「删除」；Esc 关窗归还不删；Tab trap ✅`table-index-delete-keyboard.spec.ts`
- [x] [JExcel 工具栏删行确认键盘] 字段签「删除选中行」→ 首焦「删除」；Esc 关窗归还不删；Tab trap ✅`jexcel-toolbar-delete-keyboard.spec.ts`
- [x] [JExcel Escape 退格 / 快捷操作键盘] 字段签双击单元格 → 打字 → Esc → 焦点 `jexcel-grid`、草稿不落盘、签仍开；「快捷操作」→ 首焦「知道了」；Esc 归还；Tab trap ✅`jexcel-grid-keyboard.spec.ts`
- [x] [版本同步结果键盘] 版本行「同步」（无悬停）→确认→模拟成功/失败 → 首焦「知道了」；Esc 归还 `version-sync-btn`；Tab trap；禁 `modules` 空炸 ✅`version-sync-result-keyboard.spec.ts`
- [x] [左树删表确认键盘] 表操作→删除表 → 首焦「删除」；Esc 关窗归还不删；Tab trap ✅`tree-delete-keyboard.spec.ts`
- [x] [数据源设置删确认键盘] 新增数据源→删 → 首焦「删除」；Esc 关确认归还删钮不删；外层配置窗仍开；Tab trap ✅`database-setup-delete-keyboard.spec.ts`
- [x] [工作台 databaseConfig 删/批删确认键盘] 行删 + 批删 → 首焦「删除」；Esc 关确认归还触发器不删；Tab trap ✅`database-config-delete-keyboard.spec.ts`
- [x] [工作台 databaseConfig Drawer 键盘] 新建/编辑 → 首焦「连接名称」；Esc 归还触发器；Tab trap ✅`database-config-drawer-keyboard.spec.ts`
- [x] [只读分享吊销确认键盘] 分享→吊销确认 → 首焦「吊销」；Esc 关确认归还吊销钮不吊销；外层分享窗仍开；Tab trap ✅`share-revoke-keyboard.spec.ts`
- [x] [团队项目删确认键盘] 基本设置→删确认 → 首焦「删除」；Esc 关确认归还删钮不删；Tab trap ✅`group-project-delete-keyboard.spec.ts`
- [x] [团队成员移除确认键盘] 权限组普通成员→移除确认 → 首焦「移除」；Esc 关确认归还移除钮不移；Tab trap ✅`group-user-remove-keyboard.spec.ts`
- [x] [审批动作确认键盘] API 种子→审批拒绝/通过 + 工单撤销确认 → 首焦主操作；Esc 关确认不落盘；Tab trap ✅`approval-action-keyboard.spec.ts`
- [x] [审批/工单 SQL 明细键盘] API 种子→审批/工单「查看SQL」→ 首焦「知道了」；Esc/OK 归还触发器；Tab trap ✅`sql-detail-keyboard.spec.ts`
- [x] [404/403 壳键盘] 未知路径 / `/403` 首项 Tab Skip「跳到主操作」→ `#exception-main-cta` →「打开示例 demo」→「返回首页」可逆；主 CTA focus-visible brand 环；无 trap ✅`not-found.spec.ts`「404/403 壳键盘」 |
- [x] [分享失效门键盘] `/s/not-a-real-…` 首项 Tab Skip「跳到主操作」→ `#exception-main-cta`（`share-invalid-gate`）→「打开示例 demo」→「返回首页」可逆；主 CTA focus-visible brand 环；无 trap ✅`share.spec.ts`「分享失效门键盘」
- [x] [表设计字段签半成品不静默丢] Tab/Delete/Enter 清空类型 → toast「有行未填完必填项」；Esc 仍在字段签；画布 NAME 仍在 ✅`relation.spec.ts`「半成品行不静默丢」
- [x] [表设计索引签半成品不静默丢] 添索引 → Tab/Delete/Enter 清字段 → toast；Esc 仍在索引签；删入口仍在；画布重入索引名仍在 ✅`relation.spec.ts`「索引签：半成品行不静默丢」
- [x] 画布「字段」→ 表设计字段签（无死 affordance；再入仍落字段）✅`relation.spec.ts`「画布打开字段签」
- [x] 画布「元数据」→ 表设计元数据应用签（无死 affordance；再入仍落元数据应用）✅`relation.spec.ts`「画布打开元数据应用签」
- [x] [元数据应用修改/删除字段签对齐] 版本基线后改类型→「修改字段」含 MODIFY 不含 DROP；「删除字段」空（无 MODIFY/DROP） ✅`relation.spec.ts`「元数据应用：修改/删除字段签标签对齐模板」

### 手工

- [ ] [大模型树滚动] 灌 100+ 表（`__ERD_E2E__.ensureTables`）→ 左树滚动流畅、搜索命中可见
- [ ] [工作区留白] 模型设计/表设计页四边有 12px 留白，画布圆角面板不贴边

## 多关系图 / ADR-0017 Phase 2a（2026-08-02）

### 已自动化

- [x] 工具栏新建/重命名/切换关系图 + 树图列表 + 布局按图持久化/刷新 ✅`multi-diagram.spec.ts`
- [x] 左树重命名关系图：菜单接通 `renameDiagram`；无空 FK 弹层；无复制/剪切死项 ✅`multi-diagram.spec.ts`「左树重命名关系图」
- [x] 左树新建关系图：树头「新建」→ menuitem → `createDiagram`；树 + switcher + toast ✅`multi-diagram.spec.ts`「左树新建关系图」
- [x] 左树「关系」文件夹 +：`getByRole('button', { name: '新建关系图' })`（scope tree）→ `createDiagram`；树 + switcher + toast ✅`multi-diagram.spec.ts`「左树「关系」文件夹 + 直建图」
- [x] 左树「编辑表」→ 表设计字段签；「重命名表」另项弹层 ✅`multi-diagram.spec.ts`「左树「编辑表」开表设计字段签」
- [x] 左树搜索 × 清过滤 + 无匹配空态：「未找到匹配的表」；× 后树复现表名 ✅`multi-diagram.spec.ts`「左树搜索：无匹配空态」
- [x] 命令面板搜表定位：搜表名 → 选中 + fitView + `data-locate-flash`；视口外可拉回 ✅`relation.spec`「命令面板：搜表定位」
- [x] 左树点表定位：点树表名 → 选中 + fitView + `data-locate-flash`；不开表设计 ✅`relation.spec`「左树点表」
- [x] 快捷键速查：`?` / 工具栏 → aria dialog「快捷键」；含 Cmd+K、Delete 确认、Tab 字段导航、Cmd+1/2/3 表设计签；密度 list≤2×4 / row padY≤6；Esc + 关闭钮可焦；与 Cmd+K 互斥 ✅`relation.spec`「快捷键速查」
- [x] 表设计 Cmd/Ctrl+1/2/3：字段 / 索引 / 元数据应用；输入框内不拦 ✅`relation.spec`「表设计 Cmd/Ctrl+1/2/3」
- [x] `getActiveDiagram` 懒迁移 / tab entity 往返 ✅`diagram.test.ts`
- [x] schema 含 `diagrams` ✅`validate-projectjson.mjs`
- [x] 公开 demo / 示例：双图「鉴权核心」「会话与审计」+ 切换器 ✅`demo.spec.ts` / `activation.spec.ts`

### 手工

- [ ] [旧项目打开] 仅有 `graphCanvas`、无 `diagrams` 的项目 → 打开画布见主关系图，拖动后 projectJSON 出现 `diagrams[0]`
- [x] [分享页] 含 `diagrams` 的项目分享链接 → 只读画布用主图布局 ✅`demo.spec.ts`（/demo）
- [x] [分享只读切图] `/demo` 见 `diagram-switcher`「鉴权核心」→ 选「纵向视图」→ `sys_user` layout x 变 + Frame「核心实体」；截图 `demo-share-diagram-switch.png` ✅`demo.spec.ts`
- [x] [demo 布局无重叠] `/s/public-demo` 8 表卡片两两不重叠、边不穿卡（dagre 分层替代手排 x/y，用户反馈 `7bbcbfa` 手排失败）✅`graphLayout.test.ts`「节点两两不重叠」+ Playwright 截图人工核对
- [x] [分享画布视口铺满] `/demo` `share-relation-canvas` 高 >480 且占视口过半、贴近视口底；截图 `demo-share-canvas-viewport.png` ✅`demo.spec.ts`

## 图内分组 Frame / ADR-0017 Phase 2b（2026-08-02）

### 已自动化

- [x] 选中表→新建分组→`memberEntityIds` 写入 + 刷新仍见框 ✅`diagram-frame.spec.ts`
- [x] 空分组→选表→加入分组 ✅`diagram-frame.spec.ts`
- [x] 选中分组→NodeResizer 拉大→`w`/`h` 持久化 ✅`diagram-frame.spec.ts`
- [x] 拖框→成员表同向平移 ✅`diagram-frame.spec.ts`
- [x] 选中分组→「适应成员」重算包围盒 ✅`diagram-frame.spec.ts`
- [x] 双击 Frame 标题重命名 → `groups[].name` 持久化 ✅`diagram-frame.spec.ts`「重命名」
- [x] 边基数 chip 可改 `1:1|1:n|n:1|n:n` + 刷新仍在 ✅`relation.spec.ts`「表节点视觉」
- [x] Crow's foot：默认 `n:1` → 源 many / 靶 one；改 `1:1` 两端 one ✅`relation.spec.ts`「表节点视觉」+ `relationEdges.test.ts`
- [x] Frame helpers（包围盒 / 扩边 / 点落框 / 成员去重改名剔除 / renameFrame）✅`diagram.test.ts`
- [x] schema `diagramFrame` ✅`validate-projectjson.mjs`
- [x] 公开 demo 主图节点 x 跨度更密（&lt;1100）✅`demo.spec.ts` + 截图 `ux-walkthrough/demo-layout-density.png`
- [x] 分享只读隐藏 `relationNoShow`（无 `del_flag`）✅`demo.spec.ts`
- [x] dagre 默认间距 ≤ 旧走廊 80/160 ✅`graphLayout.test.ts`
- [x] Frame 默认 padding 20（适应成员更贴表）✅`diagram.test.ts`

### 手工

- [x] [分享页 Frame] 含 `groups` 的项目分享 → 只读画布见虚线分组框 ✅`demo.spec.ts`
- [x] [Frame 主题色] demo Frame 底无 Ant 蓝；含 success `frameFill`；截图 `demo-frame-theme-tokens.png` ✅`demo.spec.ts` + `diagram.test.ts` 色板轮换
- [x] [PK/FK 徽章扫读] 设计器/分享 `.erd-pk-badge`/`.erd-fk-badge`：≥10px/700、min-width≥22、warning/success；字段名 500/PK 600 不动；截图 `diagram-pk-fk-badge-hierarchy.png` / `demo-pk-fk-badge-hierarchy.png` ✅`relation.spec` PK/FK + `demo.spec`
- [x] [边标签可读] 分享/设计器 `erd-edge-label`：白底 + ink900 + opacity=1 + ≥12px/600；截图 `demo-edge-label-chip.png` ✅`demo.spec.ts` + `relation.spec` PK/FK
- [x] [边标签碰撞避让] 密图 `erd-edge-label-nudge` 非零 + 标签 AABB 零重叠；截图 `demo-edge-label-collision.png` ✅`relationEdges.test` + `demo.spec.ts`
- [x] [边标签密度] chip padding ≤4/2、radius ≤3；碰撞盒跟字号（40×20）✅`relationEdges.test.ts` + `demo.spec` / `relation.spec` 表节点视觉
- [x] [Frame 标题栏密度] `.erd-frame-chrome` height ≤22；截图 `demo-frame-theme-tokens.png` ✅`demo.spec` + `diagram-frame.spec`
- [x] [Frame 标题扫读] label ≥12/700 vs meta 更小/更轻 + `opacity < 1`；padX≥8；双击重命名仍在；截图 `diagram-frame-title-hierarchy.png` / `demo-frame-title-hierarchy.png` ✅`diagram-frame.spec`「新建分组」+ 重命名 + `demo.spec`
- [x] [MiniMap sunk 对齐] 设计器/分享 MiniMap `backgroundColor` = surfaceSunk `#FAFBFC` + ≤128×96 紧凑；截图 `diagram-minimap-sunk.png` ✅`relation.spec`「MiniMap」+ `demo.spec`
- [x] [MiniMap chrome margin] panel margin **8**∈[8,12]（禁 RF 默认 15）；尺寸 128×96 保留概览；`getByRole('img', { name: '画布缩略图' })`；Controls/版本工具条/Auth 不弱化 ✅`relation.spec`「MiniMap」+ `demo.spec`
- [x] [Controls / 工具栏 panel margin] Controls + 顶栏工具栏 margin **8**∈[8,12]（禁 RF 默认 15）；对齐 MiniMap；`getByRole('button', { name: '适应画布' })` / `testid=canvas-toolbar` ✅`relation.spec`「Controls」+ `demo.spec`
- [x] [基数 Select / Form mb] 编辑态 Select 高≤28；EntityModal 项 mb≤12 / 输入≤28 ✅`relation.spec`「PK/FK」+「实体新建弹层密度」
- [x] [Controls 面板密度] 按钮 ≤22×22、面板 `surface`（禁 RF `#fefefe`）；截图 `diagram-controls-dense.png` ✅`relation.spec`「Controls」+ `demo.spec`
- [x] [Controls 扫读层次]「适应画布」`.erd-controls-primary` ink900 + muted 底；图标 ≥12；aria 不变 ✅`relation.spec`「Controls」+ `demo.spec`
- [x] [选中光晕统一] 表 / Frame `box-shadow` 环均为 brand a18（`--erd-selection-ring`）；禁 Frame a12 ✅`diagram-frame.spec`「选中表→新建分组」+ `relation.spec`「品牌 token」
- [x] [画布工具栏密度] `.erd-canvas-tool` height ≤22、font ≤11；Panel margin 8；截图 `diagram-canvas-toolbar-dense.png` ✅`relation.spec`「工具栏」
- [x] [画布工具栏扫读层次] 单块 chrome；次要 ink600；「自动布局」600/ink900；禁散粒描边 ✅`relation.spec`「工具栏」
- [x] [空态面板密度] `.erd-empty-cta` pad ∈[8,12]（目标 10×12）/ maxW≤300 / 标题≤14 / CTA hit ∈[26,28] / 剪影 compact≈112∈[96,120]；截图 `diagram-empty-composition.png` ✅`relation.spec`「空态构图」
- [x] [空态剪影 compact] `ErdEmptyDiagram` compact **112**（原 132）；禁 ≥132；≥96 保留存在感；Auth logo / 欢迎 pad / hero 176 / Controls·工具栏 margin 不动 ✅`relation.spec`「空态构图」
- [x] [空态 panel 顶距] `.erd-empty-panel` mt ≈ min(8vh,64) 且 ∈[32,64]；`testid=canvas-empty-panel`；禁 min(10vh,88)；Auth logo / 欢迎 pad / CTA pad 不动 ✅`relation.spec`「空态构图」
- [x] [空态纵节奏] `.erd-empty-title` mt≈8∈[6,10] / `.erd-empty-desc` mb≈12∈[8,12]；禁回退 16/18；Auth logo / 欢迎 pad / CTA pad / panel 顶距不动 ✅`relation.spec`「空态构图」
- [x] [空态次链区 mt] `.erd-empty-links` mt≈10∈[8,12]；`testid=canvas-empty-links`；Controls 已密不改；Auth logo / 欢迎 pad / CTA / panel / title·desc 不动 ✅`relation.spec`「空态构图」+「Controls」
- [x] [命令面板密度] 面板宽≤460 / maxH≤360、输入高≤40 / font≤13、行 padY≤16 / font≤12、footer padY≤8 / padX≤8 / font≤11；截图 `diagram-cmd-palette-dense.png` ✅`relation.spec`「命令面板」
- [x] [命令面板空态/list 井] empty padY≤16 / padX≤8 / gap≤2、list pad≤2；无匹配「无匹配结果」+ 提示；Trap/aria/Esc 不弱化 ✅`relation.spec`「命令面板」
- [x] [实体新建弹层密度] 宽≤420、标题≤14·lh≥20、头/身/脚 pad≤8×12、表单项 margin≤14、输入/OK 高∈[28,32]；截图 `diagram-entity-modal-dense.png` ✅`relation.spec`「实体新建弹层密度」
- [x] [导入 Frame 建议] 前缀表 DBML → toast「已建议 N 个分组」+ 画布 2 个 `diagram-frame`（sys/biz）；截图 `diagram-import-frame-suggest.png` ✅`dbml-import.spec`「前缀表」+ `suggestImportFrames.test` / `yarn test:unit:dbml`
- [ ] [拖入/出] 拖表中心进入空分组 → 成员+1 且框扩边；再拖出 → 成员-1（toast「已移出」）

## 第 0 轮（2026-08-01）

### 已自动化（`yarn test:e2e` / CI e2e-smoke）

- [x] 登录页渲染；错误凭证停留登录页 ✅自动
- [x] 登录 → 新建项目（4 必填字段）→ 列表可见 → 打开模型进设计器 → 删除清理 ✅自动
- [x] VIP 计数缓存：删除项目后可再次创建（自清理用例隐含覆盖）✅自动

### 手工/接口断言项

- [x] [自部署可观测] `GET /actuator/health` → `{"status":"UP"}`；`GET /actuator/info` → `app.name=erd-online`；未暴露 `/actuator/env` → HTTP 404（非假 500）✅curl 2026-08-02
- [x] [自部署 DX 验收] `./scripts/verify-self-deploy.sh` → health/info/404/FE + `flyway_schema_history` 有成功版本 ✅脚本 2026-08-02（ok=5）
- [x] [plaza Material 死码删除] `rg 'erd\.plaza|MaterialController' backend/src` = 0；`GET /material` → 404；health UP ✅ 2026-08-02
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
- [x] Colima MySQL `reverse_demo`：`COLUMN_DEF` → `fields[].defaultValue`（`status='NEW'` / `amount=0.00` / `created_at=CURRENT_TIMESTAMP`）✅curl + `DefaultValueMapperTest`
- [x] Colima PostgreSQL `reverse_demo`：meta schemas=[public]；indexs + associations ✅curl
- [x] Colima PostgreSQL `reverse_demo`：表/列 COMMENT → `entity.chnname` / `fields[].chnname`（字典 obj/col_description）✅curl
- [ ] Colima SQL Server（Azure SQL Edge）：meta `supportsComment=true`；`MS_Description` → `entity.chnname` / `fields[].chnname`（单测/fixture 已备；curl 待镜像可用）
- [x] Oracle 表/列注释：`ALL_TAB_COMMENTS`/`ALL_COL_COMMENTS` → `entity.chnname` / `fields[].chnname`；meta `supportsComment=true`（无本机 Oracle：`OracleReverseDialectCommentTest` + mapper）✅自动
- [x] MySQL 表触发器：`INFORMATION_SCHEMA.TRIGGERS` → `entity.triggers[]`（name/timing/event/statement/ddl）；meta `supportsTrigger=true`（`MysqlReverseDialectTriggerTest` + `TriggerResultSetMapperTest`）✅自动
- [x] PostgreSQL 表触发器：`information_schema.triggers` → `entity.triggers[]`（name/timing/event/statement/双引号 ddl）；meta `supportsTrigger=true`（`PostgresqlReverseDialectTriggerTest` + mapper PG）✅自动
- [x] SQL Server 表触发器：`sys.triggers`/`sys.trigger_events`+`OBJECT_DEFINITION` → `entity.triggers[]`（name/timing/event/statement/ddl）；meta `supportsTrigger=true`（`SqlServerReverseDialectTriggerTest` + mapper SQL Server）✅自动
- [x] Oracle 表触发器：`ALL_TRIGGERS`+`ALL_SOURCE` → `entity.triggers[]`（name/timing/event/statement/ddl）；meta `supportsTrigger=true`（`OracleReverseDialectTriggerTest` + mapper Oracle；P0 四库闭环）✅自动
- [x] 表设计触发器签：列表 + 编辑 + 查看 DDL + 添加/删除；`updateEntityTriggers` persist-on-200；定位 role/aria/testid（`table-triggers.spec` + 签页 `Cmd/Ctrl+4`）✅自动
- [x] 触发器签编辑已有行：改语句体落盘 + DDL 重建；刷新残留；失败不关窗可重试 ✅`table-triggers`「编辑已有触发器」/「编辑落盘失败」
- [x] 画布底栏「触发器」：`canvas-open-trigger` 直达触发器签（`aria-selected` + 空态 hint）；切字段后再经画布重入非粘滞 ✅`relation`「画布打开触发器签」+ `table-triggers`
- [x] DDL 导出 `triggers[]`：`createTrigger` 片段优先 `ddl`、否则按方言重建（MySQL/PG/SQL Server/Oracle）；导出弹层可勾选（`json2code.trigger.test.ts`）✅自动
- [x] DDL/DBML FK 回写：`createForeignKey` 四库 ALTER FOREIGN KEY + ON DELETE/UPDATE；同名聚合复合列；DBML Ref settings 往返（`json2code.fk.test.ts` + `yarn test:unit:dbml`）✅自动
- [x] FK 约束元数据：`constraintName` / `deleteRule` / `updateRule`（JDBC + 四库字典；复合拆边同名；ADR-0011 `fields[]` 仍延期）✅`ForeignKeyAssociationMapperTest` + `relationEdges.test.ts`
- [ ] Colima MySQL `reverse_demo`：associations 含 `constraintName`/`deleteRule`（有 CASCADE 的 FK）→ curl 抽检
- [ ] Colima SQL Server（Azure SQL Edge）：indexs + associations 1:n curl 验证
- [x] 只读分享：create + 匿名 GET `readonly=true`；匿名 create 401 ✅curl
- [x] 分享脱敏：dbs password/username → `***` 且不污染原 Map ✅`ProjectShareSanitizeTest`
- [x] [只读分享前端] 设计器「分享」→ `/s/:token` → 未登录打开见表清单 + 只读关系图（`data-testid=share-relation-canvas`）✅`share.spec.ts`
- [x] [只读分享安全] 匿名 GET 中 dbs password/username 为 `***` ✅curl
- [x] [dataSources] 登录后 `GET /ncnb/dataSources?size=10&current=1` → 200（表 `data_sources`）✅`audit-fe-apis.sh`
- [x] [注册放行] 匿名 `POST /ncnb/project/group/user/register`（body: username/pwd/email/phone）→ 非 401（dev `allow-open-register=true`）✅curl
- [x] [R-AUTH-06 单入口] 匿名 `POST /user/register` → 401（不再 ignore / 无 HTTP 映射）；产品路径仍匿名可达 ✅curl + `RemoteSystemUserHttpContractTest`
- [x] [R-AUTH-06 门控] `allow-open-register=false` → 注册 `code=403` 且不 insert ✅`UserExtensionServiceImplRegisterGateTest`
- [x] [R-CFG-07 prod 逃生阀] `SPRING_PROFILES_ACTIVE=prod` + `ERD_ALLOW_OPEN_REGISTER=true`/`ERD_ALLOW_DEMO_ADMIN=true` → 加载真实 `application.yml`+`application-prod.yml` 后 `erd.security.allow-open-register`/`allow-demo-admin` 生效值为 `true`；`ERD_E2E_ACCOUNTS_ENABLED=true` 在 prod 仍恒为 `false`（无逃生阀）✅`ProdSecurityEscapeHatchBindingTest`
- [x] [R-AUTH-01] 匿名 `GET /user/loadUserByUsername/admin` → 401；登录 `/auth/login` 仍 200 ✅curl + `RemoteSystemUserHttpContractTest`
- [x] [R-AUTH-02] 无 `sys_user_*` 的已登录用户 `GET /user/page` → 401（AccessDenied）；admin `GET /user/page` → 200 且 JSON 无 `pwd`/`salt` ✅curl + `UserControllerAuthContractTest`
- [x] [R-DATA-02 dataSourceId] `POST /ncnb/connector/ping` 含他人 `dataSourceId` → body `code=403`；自有 id 覆盖客户端伪账密；无 id raw `jdbc:h2` 仍拒 ✅curl + `ConnectorCredentialResolverTest`
- [x] [R-DATA-02 FE 热路径] 已保存数据源：`dbReverseMeta`/`dbReverseParse`/`connector/ping`（同步状态）body 含 `dataSourceId` 且无 `password`/`url`；表单「测试连接」仍可 raw ✅`import-reverse` + `adr0008-datasource` + `connectorPayload.test.ts`
- [x] [R-DATA-02 mutate 强制 id] `POST /ncnb/connector/sqlexec`（或 dbsync）无 `dataSourceId` 仅 raw JDBC → `code=400` 文案含 dataSourceId；有自有 id 正常 ACL 解析 ✅curl + `ConnectorCredentialResolverTest` applyMutate*
- [x] [R-DATA-02 IMDS/链路本地] `JdbcUrlGuard` 拒 `169.254.0.0/16`、`168.63.129.16`、`100.100.100.200`、`fe80::/10`、`fd00:ec2::254`；允 RFC1918/`127.0.0.1` ✅`JdbcUrlGuardTest`
- [x] [R-DATA-02 DNS resolve] 主机名解析到 IMDS/链路本地 → 拒；解析到 RFC1918 → 允；多 A 含 meta → 拒 ✅`JdbcUrlGuardTest` deniesHostnameResolving* / allowsHostnameResolving*
- [x] [R-DATA-02 pin-IP TOCTOU] 主机名 pin 为解析 IP；字面量不变；多 A 含 meta 仍拒；flip resolver 只 resolve 一次 ✅`JdbcUrlGuardTest` pin*
- [x] [R-DATA-04 测试上传已删] `POST /ncnb/project/upload`、`/project/group/upload`、`/ws/upload` → 404 ✅`UploadTestEndpointsRemovedTest` + curl
- [x] [R-DATA-04 Word 归属] 非成员 `uploadWordTemplate/{projectId}` / `downloadWordTemplate?doctpl=martin/projecterd/{他人}/x.docx` → 403；非 `.docx`/路径穿越拒；默认模板仍可读 ✅`WordTemplateGuardTest` + `GenDocServiceImplTest` + curl
- [x] [queryHistory] `POST /ncnb/queryHistory` 分页 → 200（禁止 GET）✅`audit-fe-apis.sh`
- [x] [ADR-0008 分享] 匿名 GET projectJSON.profile.dbs 为空数组 ✅`ProjectShareSanitizeTest`
- [x] [分享 Fork] 匿名点「复制到我的项目」→ `/login?redirect=`；登录后 fork 进设计器 ✅`share.spec.ts`
- [x] [分享注册转化] 「注册并带回」→ `/register?redirect=`；登录页有「去注册」✅`share.spec.ts`
- [x] [分享 autofork] 登录后打开 `/s/:token?autofork=1` 自动 fork 进设计器 ✅`share.spec.ts`
- [x] [在线 demo] `/demo` → `/s/public-demo` 见关系图 + 复制 CTA ✅`demo.spec.ts`
- [x] [协作 presence] 设计器顶栏 `collab-presence` 含当前用户 ✅`presence.spec.ts`；`verify-socket-presence.mjs`（含断线清名单；须为 project_user）
- [x] [协作光标] 双端 `verify-socket-cursor.mjs`：A 发坐标 B 收、发送方无回声 ✅
- [x] [协作 sync] `verify-socket-sync.mjs`：A 发 delta B 可 patch 出 T_USER、发送方无回声 ✅
- [x] [SocketIO 项目成员 R-AUTH-05] 非成员 `projectId` → connect_error；成员可进房 ✅`verify-socket-membership.mjs` + 单测 `SocketIoAuthorizationListenerTest`
- [x] [协作 sync 提示] 双人同项目：A 改表后 B 见 info / 未保存见 warning；CTA「保存版本」→ version/all；info→AddVersion 落库 `version-row-1.0.0`；60s 内二次变更 toast 仍为 1 ✅`sync-toast.spec.ts`
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
- [x] [逆向选表 UX] Step2 可选目标模块 + 重命名；未入库表排前；全选跨分页 ✅`reverseImportUtils.test.ts` + `diagram.test.ts`（frozen layout）
- [ ] [MySQL 逆向含索引] 配置本机 MySQL 数据源 → 导入逆向 → 勾选含二级索引的表 → 预期：实体 `indexs` 有名称/字段/isUnique，PRIMARY 不重复出现；向导不显示 Schema（API curl 已覆盖；UI 深度后置）
- [ ] [MySQL 逆向含外键] 勾选父子表一并导入 → 预期：子表模块 `associations` 有 `1:n` 边，关系图画布可见连线（字典 KEY_COLUMN_USAGE；API curl 已覆盖）
- [x] [MySQL 复合 FK 列序] `ForeignKeyAssociationMapperTest#mapFromKeyColumnUsage_keepsCompositeOrder` ✅
- [ ] [PostgreSQL 逆向] 选数据源后出现 Schema（默认 public）→ 含二级索引表导入 → 预期：`indexs` 正确且不含主键索引
- [ ] [PostgreSQL 逆向含外键] 勾选父子表 → `associations` 有 `1:n`（字典 KEY_COLUMN_USAGE）
- [ ] [Oracle 逆向] schema=用户 → 含二级索引表导入 → 预期：`indexs` 正确且不含主键约束索引
- [ ] [Oracle 逆向含外键] 勾选父子表 → `associations` 有 `1:n`（ALL_CONSTRAINTS R）
- [ ] [Oracle 逆向含注释] 表/列 `COMMENT ON` → 导入后 `chnname`（单测已覆盖字典回填；有实例时 curl `dbReverseParse`）
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
- [x] [删边] 边 focus+Delete → Modal 确认后边消失 + DB associations 清空 ✅`relation`「画布删表/删边二次确认」「删边后刷新」
- [x] [画布键盘删表二次确认] 选中表 Delete → 取消保留；确认 toast「表删除成功」+ 节点消失 ✅`relation`「画布删表/删边二次确认」
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
- [x] [表头中文名内联] ✎ → Tab 入表中文名 → Enter 落盘可见；Escape 丢弃草稿；可清空；save-status ✅ `relation.spec`「表头中文名」
- [x] [字段 ✎ 改名] hover「编辑字段」→ 改名；空名 toast 留编辑；save-status 已保存 ✅ `relation.spec`「字段 ✎」
- [x] [字段 Tab / 类型即时保存] Tab 字段名→中文名→类型→默认值→下一字段；空名 toast；仅改类型 → save-status 已保存 ✅ `relation.spec`「字段 Tab」
- [x] [末行 Tab 新建字段] 末字段经默认值 Tab → 空新建行；填名再走完 Tab → 落盘并再开新建；空名 toast 保留 ✅ `relation.spec`「字段 Tab」
- [x] [字段中文名内联] ✎ → Tab 入中文名 → Enter 落盘可见；Escape 丢弃别名草稿；空名 toast；中文名可清空 ✅ `relation.spec`「字段中文名」
- [x] [字段默认值内联] ✎ → Tab 入默认值 → Enter 落盘可见 `=值`；Escape 丢弃草稿；可清空；名/中文名/类型 Tab 序不变 ✅ `relation.spec`「字段默认值」
- [x] [编辑态 PK 即时保存] ✎ 内勾/取消主键 → save-status 已保存；空名 toast 保留 ✅ `relation.spec`「编辑态 PK」
- [x] [编辑态非空即时保存] ✎ 内勾/取消非空 → save-status 已保存；PK 时 NN 禁用；空名 toast 保留 ✅ `relation.spec`「编辑态非空」
- [x] [编辑态自增即时保存] ✎ 内勾/取消自增 → save-status 已保存；空名 toast 保留 ✅ `relation.spec`「编辑态自增」
- [x] [编辑态隐藏即时保存] ✎ 内勾「在关系图中隐藏」→ 行离画布 + toast + save-status；表底「已隐藏」→「显示」恢复 ✅ `relation.spec`「编辑态隐藏」
- [x] [编辑态 Escape 取消] ✎ 改名后 Escape → 原名保留、不经 blur 落盘；新建行 Escape 不落盘 ✅ `relation.spec`「编辑态 Escape」
- [x] [删字段二次确认] × / 选中 Delete·Backspace → 确认才删；取消保留；编辑态 Backspace 只改字；空名 toast / Escape 保留 ✅ `relation.spec`「删除字段」
- [x] [PK 切换] PK 徽标 `button`+aria；取消/恢复 ✅ `relation.spec`「PK」
- [x] [命令面板] Cmd/Ctrl+K → 搜「新建」→ 执行 → 节点数 +1；工具条「命令」首焦/↑↓/空态/Esc 归还/Tab trap ✅自动（`relation.spec`「命令面板」）
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
- [x] [画布删除二次确认] 画布 Delete 表/边均 Modal 确认；树侧确认含不可逆文案 ✅`relation`「画布删表/删边」+`smoke`「删除表」
- [x] [画布撤销/重做] relation.spec.ts 覆盖 ✅自动
- [x] [登录 console 无账密] ux-audit / smoke 覆盖 ✅自动

### 新发现待办

- [x] [关系图入口缺失] 已修（见走查发现区，浏览器实证）
- [x] [/oauth/token] 已废弃；现 JWT 登录，错误凭证 401+业务文案（curl+E2E）
- [ ] [登录页过期 JWT] localStorage 有过期 `Authorization` → `/login` 仍显示第三方按钮或「未配置」提示（providers 匿名 200）；`GET /auth/federate/providers` 带坏 Bearer 仍 200 ✅ E2E `federate-login.spec.ts`
- [x] [存量 console.log] 已清零（`rg console\.(log|debug|info) src` = 0；`lint:js:ci` 0 error）✅自动
- [ ] [CORS 收敛] curl 实证：localhost:8000 预检放行含 ACAO；evil.example.com 无 ACAO ✓（2026-08-01）——**部署注意**：生产直连后端须设 `ERD_UI_URL`；prod 禁 SocketIO/CORS `*`（`CrossOriginPolicy`）；prod profile 必须注入 MYSQLUSER/MYSQLPASSWORD/REDISPASSWORD/`ERD_UI_URL`/JWT 否则启动失败（fail-fast；compose 无 Redis 密码时 `REDISPASSWORD=`；**勿**再强制假 `OSS_*`）
- [ ] [R-CFG-04 Origin] prod 未设 `ERD_UI_URL` → 启动失败；`ERD_UI_URL=*` → 启动失败含 `*`；dev profile 本地 dogfood 不受影响
- [x] [R-CFG-05 OSS] 仓库无 `minio123`；prod 不强制 `OSS_*`；启用 MinIO + prod 用默认对 → 启动失败（`OssCredentialGuardTest`）
- [x] [R-CFG-06] `.env.example` 无 `OAUTH_CLIENT_*`（`OssSecurityConfigContractTest`）
- [x] [R-OPS-03] deployment 标明 9092 勿公网裸放
- [ ] [生产凭证 fail-fast] 待 Docker 部署验证：`docker-compose up`（compose 显式传 env，应正常启动）

## UX 走查（playwright-ux-audit 规则，2026-08-01 首轮）

### 已自动化（ux-audit.spec.ts）

- [x] 个人/最近/数据模型页项目卡片标题是**真链接**（getByRole('link')，含 href 可键盘聚焦）✅自动
- [x] 点卡片标题直达设计器（affordance 端到端有效）✅自动
- [x] 全旅程 console 无明文账密 ✅自动
- [x] 全旅程截图存档 test-results/ux-walkthrough/（6 张，每轮人工翻阅找新摩擦）

### 走查发现（本轮新摩擦）

- [x] [假链接] 卡片标题首版修复用 `` `<a onClick>` `` 无 href，无 link role、不可键盘聚焦 → 已改真链接（走查首轮即抓出，P1 已修）
- [x] [关系图入口缺失] 文件夹模式树下无「关系图」节点（`getModuleEntityTree` 仅扁平模式返回入口，而界面恒用文件夹模式）→ 已在「关系」文件夹置顶入口，浏览器验证画布可打开渲染（P0 已修）
- [ ] [实体无法上图·核心断裂] 前端无拖拽源 + `addEntity` 不写 `graphCanvas` → 新建实体永远上不了画布（旧画布建模回路全断）→ **不修补 g6**，ReactFlow 轮按 ADR-0001 补充决策根治：实体即节点、graphCanvas 只存布局
- [x] [设计器空态] 0 表时「新建第一张表」可点且建表即上图（含默认主键）✅ `relation.spec.ts`
- [x] [建表链路] 树/弹窗建表后直开关系图；中文名可选；不再出现「建表即空壳」✅同上
- [x] [连线后改字段名边消失] 先连线再改外键名，边仍在；再 Delete 可删干净 ✅ `relation.spec.ts`

## 第 1 轮待启用（test.fixme 转正目标）

- [x] ~~错误凭证登录出现明确错误提示~~（第 1 轮已转正并通过）
- [x] ~~画布/树删除表需二次确认~~ → 树删除确认已自动化（`smoke`）；画布 Delete 见 `relation`「画布删表/删边二次确认」
- [x] ~~左树删除模型/关系图二次确认~~ → `multi-diagram`「左树删除关系图/模型二次确认」

## 第 3 轮：版本 diff 可视化（2026-08-01）

- [x] [详情可视化] 建表→保存版本→点「详情」→ 见 `version-diff-panel` 着色项与表名 ✅ `version.spec.ts`
- [x] [跨版本 diff 导出] 详情弹层点「导出」→ download `version-diff-*.md` + toast「已导出变更清单」 ✅ `version.spec.ts`
- [x] [列表摘要] 有 changes 的版本行显示 `+N/-N/~N` Tag ✅同上
- [x] [任意版本比对] 单版禁用；双版比对见增量字段 ✅ `version.spec.ts`
- [x] [工单/审批表头] 侧栏「我的工单」「我的审批」表头正确 + 空态引导 ✅ `approval.spec.ts`
- [x] [审批有数据拒绝/复批] API 种子待审→审批页拒绝 toast→工单复批 toast ✅ `approval.spec.ts`「API 种子工单」
- [ ] [团队审批 UI 发起+通过] 手工：团队项目→版本行「提交工单」→SQL审批→选审批人→通过（需真实 JDBC 目标库）
- [x] [W3 审批入口] 版本页顶栏工单/审批直达；团队未同步行「提交工单」→详情「SQL审批」✅ `approval.spec`「版本页：提交工单入口可达」

## 新手激活（2026-08-01）

- [x] [首页示例] 登录→/home→示例项目→设计器关系图见 sys_user 等 8 表 + 7 边 ✅ `activation.spec.ts`
- [x] [去死链] 「新建模型」href 指向 `/project/person` ✅同上
- [x] [多项目] 开源版可连续创建 ≥2 个个人项目 ✅ `activation.spec.ts`
- [x] [30s 计时] 落地→demo→登录→示例就绪→保存首版本；计时段 ≤30s（基线 ~3.5s） ✅ `activation-30s.spec.ts`

## 设计器保存状态（2026-08-01）

- [x] [自动保存反馈] DesignLayout 顶栏见「保存中…」→「已保存」 ✅ `relation.spec.ts`

## 项目激活链路（2026-08-01）

- [x] [空态引导] 清空个人项目 → /project/person 见「立即创建/一键示例」→ 一键示例进设计器树见 sys_user/sys_role/sys_permission/biz_order ✅ `project-activation.spec.ts`
- [x] [新建表单减负] 打开新建弹窗 → 类型默认个人项目、标签已填 → 只填名称/描述可创建，成功有「创建成功」提示 ✅同上

## 开发基建（2026-08-01）

- [x] [后端常驻] `./backend/dev-ensure.sh` 首跑拉起、二跑秒退（幂等）；终端关闭后 curl /actuator/health 仍 UP（tmux 会话 erd-be）
- [x] [保存失败可重试] 断网/业务码失败 → 单条 toast + 顶栏「保存失败，点击重试」→ 点后「已保存」且字段落库；无叠弹「自动保存失败」 ✅`save-failure.spec.ts`
- [x] [逆向解析失败可重试] mock `dbReverseParse` 业务码 → toast 含可读 msg、无 `[object Object]`；失败区「重新解析」→ 二次成功出实体表；body 含 `dataSourceId` 无 password/url ✅`reverse-parse-failure.spec.ts`
- [x] [添加成员邀请失败不关窗] mock `role/users` 业务码 → toast「模拟邀请拒绝」+ dialog 仍开；重试成功 →「保存成功」关窗 ✅`add-user-invite-failure.spec.ts`
- [x] [版本保存失败可读可重试] mock `hisProject/save` → 初始化基线 toast + 窗仍开 → 重试成功；重建失败无「重建基线成功」且不调 rebaseline ✅`version-save-failure.spec.ts`
- [x] [只读分享创建失败可重试] mock `share/create` 业务码 → toast「模拟创建分享拒绝」+ 空链 +「重新生成链接」可点 → 二次成功出 `/s/` +「复制链接」 ✅`share-create-failure.spec.ts`

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

- [x] [大图裁剪] 30 表 + 放大视口 → DOM `.react-flow__node` 数量 `< 30`；`data-viewport-cull=1` ✅ `canvas-scale.spec.ts`
- [x] [E2E 定位] 新建模型/开关系图走 testid，不依赖 `.ant-tree [class*=title]` ✅同上

## 分享页裸 fetch 走 buildApiHref（2026-08-05）

- [x] [分享页初始加载/复制到我的项目] `pages/share/index.tsx` 两处 `fetch` 套 `buildApiHref`；本地 dev（API_URL 空）走既有 proxy 不变 ✅ `share.spec.ts` + `share-revoke-keyboard.spec.ts` + `share-create-failure.spec.ts` + `share-project-keyboard.spec.ts` 10 例全绿
- [x] [CF Pages demo 实测] Redeploy 后打开 `https://www.erdonline.com/s/public-demo`，Playwright 截图确认页面渲染「功能鉴权示例」RBAC 关系图（非「分享不可用」）✅ 2026-08-05

## 官方 Demo 运行时 Railway（2026-08-02）

- [x] [文档站用户手册收口] Navbar「文档」→ `guide/intro`；贡献区默认折叠；Footer 有 Demo/对照/GitHub；七篇 guide 含成功态+排障；`cd website && yarn build` 绿 ✅ 2026-08-09（走查见 `docs/guide/docs-qa-checklist.md`）
- [x] [文档站再打磨] 首页用户 CTA；Demo 只读写清；百度统计 + SPA 追踪；`zh-Hans`/`en` locale 切换与 guide 英译；`yarn build` 绿 ✅ 2026-08-09
- [x] [ADR-0019 + deployment] 文档站可打开 ADR-0019；`deployment.md` 含 Railway 五步与 env 对照；`yarn build`（website）无 MDX 失败 ✅ 2026-08-02
- [x] [Railway monorepo 构建] `backend/railway.toml` + Dockerfile 跟 `PORT`；文档写明 Root Directory=`backend`、Config=`/backend/railway.toml`；本地 `mvn -DskipTests package` + `docker build ./backend` ✅ 2026-08-02
- [ ] [单库 ADR-0020] 空卷 `docker compose up` → 仅一库 `erd`；后端启动后 `sys_user` 有种子；`flyway_schema_history` ≥ V6
- [ ] [Railway 单库] App `MYSQLDATABASE=erd`（或灌入插件库）+ schema init 后 Redeploy → health UP，无 `Unknown database 'martin'`
- [x] [Railway MySQL/Redis yml] 直接读 `MYSQL*`/`REDIS*`（无 `DB_*` / `SPRING_DATA_REDIS_URL`）；文档「Railway MySQL/Redis 正确接法」✅ 2026-08-03
- [ ] [Railway Dashboard] Root Directory=`backend` + Config=`/backend/railway.toml` → Deploy → Link MySQL/Redis（原生变量）+ schema init → Public → `actuator/health` UP → 设 `DEMO_API_URL`
- [ ] [Zeabur Dashboard] Root Directory=`backend` → Dockerfile 构建 → MySQL 8 + Redis + `MYSQL*`/`REDIS*`/`JWT_*`/`CORS_*` → 域名 → `curl /actuator/health` UP（`/` 可为 404）→ `DEMO_API_URL` 指该 URL

## 创建项目 / JWT 头（2026-08-02）

- [x] [新增项目 Modal 中文按钮] `/project/person`→新建→见「确定/取消」（非 OK/Cancel）→创建成功关窗 ✅ `smoke`「登录→新建→设计器」
- [x] [大 JWT POST 非 HTML] Authorization≈8KB 时 `POST /ncnb/project/add|group/add` 返回 JSON 非 Tomcat HTML 400 ✅ curl + ADR-0015
- [x] [DesignLayout 出口] 登录→新建→设计器见顶栏 save/share/presence + 模型空态 ✅ `layout-outlet` DesignLayout

## 布局壳子路由（2026-08-02）

- [x] [HomeLayout 主内容] 登录→/home 见 `home-link-new-project`；/project/person 见新建/立即创建（非仅 slogan）✅ `layout-outlet.spec.ts`
- [x] [HomeLayout 顶栏] `/home` 无 `save-status` / `collab-presence` /「只读分享」；仍有「GitHub 仓库」与「公众号」（`homeRightContent`）✅ `layout-outlet.spec.ts`
- [x] [三壳 chrome 同语言] Home/Group/Design 顶栏 64、无 `.ant-watermark`；Home 底色 surfaceSunk；GitHub 为文本链非 shields ✅ `layout-outlet`「三壳同语言」
- [x] [Pro Strangler 切片1] HomeLayout/GroupLayout 无 `@ant-design/pro-components`；antd Layout+Watermark；主导航「数据模型/数据源」可达 ✅ `layout-outlet` + `project-surface`（2026-08-02）
- [x] [S0 依赖矩阵] installed `@umijs/max@4.6.84` / `antd@5.29.3` / `@ant-design/pro-components@2.8.10` / `rc-util@5.44.4`；`yarn build` 绿 ✅
- [x] [GroupLayout 主内容] 登录→/project/group/setting/basic?projectId= 见「基本设置」+「项目名」且不双挂载 ✅同上

## W6 团队项目基本设置（2026-08-02）

- [x] [基本设置保存成功 toast] API 建团队项目→/project/group/setting/basic →改项目名→提 交→「修改成功」✅ `group-basic-setting.spec.ts`
- [x] [基本设置保存失败 toast] mock update 非 200 →「修改失败」✅同上

## Home S2 hero CTA（2026-08-02）

- [x] [继续上次建模] 有最近项目时 Home 主按钮可达 → 直达 `/design/table/model?projectId=` ✅ `project-surface.spec.ts`
- [x] [彩虹色清零] `pages/home` 无 `#1890ff/#52c41a/#faad14` ✅rg

## W5 404/403（2026-08-02）

- [x] [404] 未知路径见「404」「抱歉，你访问的页面不存在」；「返回首页」离开该路径；「打开示例 demo」→ `/demo`|`/s/public-demo`✅ `not-found.spec.ts`
- [x] [403/404] 无 `antd/dist/reset.css`、无自定义 `no-found`/`no-access` svg（标准 Result）✅ 源码断言

## W5 404/403 品牌对齐（2026-08-03）

- [x] [404] 未知路径见 `AuthBrandShell`「页面不存在」+ `exception-404-gate`；品牌面板 ~40%；主 CTA「打开示例 demo」→ `/demo`|`/s/public-demo`；「返回首页」离开该路径✅ `not-found.spec.ts`
- [x] [403] `pages/403.tsx` 同构 `AuthBrandShell`「无权访问」+ `exception-403-gate`；深链 `/403`（layout false）可达✅ `not-found.spec.ts`
- [x] [404/403 壳键盘] Skip「跳到主操作」→ `#exception-main-cta`；打开示例→返回首页；focus-visible brand；无 trap✅ `not-found.spec.ts`
- [x] [深链/死认证] 空壳深链与 `/login/success` 等见 `exception-404-gate`（非裸 Result「404」）✅ `data-domain`/`design-query`/`home-data-query`/`dead-auth-routes`

## W5 切片 2 — 分享失效态（2026-08-02）

- [x] [无效 token] `/s/not-a-real-…` 见 Result「403」+ 失效文案；无画布；「打开示例 demo」→ `/demo`|`/s/public-demo`✅ `share.spec.ts`
- [x] [吊销后] 创建→吊销→匿名打开见 Result「403」+「打开示例 demo」/「返回首页」；无画布✅ `share.spec.ts`
- [x] [分享失效门键盘] Skip「跳到主操作」→ `#exception-main-cta`（`share-invalid-gate`）；打开示例→返回首页；focus-visible brand；无 trap✅ `share.spec.ts`

## 分享失效/空态品牌对齐（2026-08-03 · ADR-0016）

- [x] [无效 token] `/s/not-a-real-…` 见 `auth-brand-shell` +「分享不可用」+ `share-invalid-gate`；左面板 ~40%；无画布；「打开示例 demo」→ `/demo`|`/s/public-demo`✅ `share.spec`「无效 token…」
- [x] [空模块] 新建空项目分享 → 匿名见 `share-empty-module` + `erd-empty-diagram` + 主标题「该分享暂无模型|该模块暂无表」+ hint + 唯一主 CTA✅ `share.spec`「空模块分享…」
- [x] [吊销后] 创建→吊销→匿名见品牌壳失效门（非裸 403）✅ `share.spec`「创建→吊销后…」
- [x] [成功态不回归] 有表分享仍见 chrome 64 + 画布 + 表清单折叠✅ `share.spec`「设计器分享后…」
- [x] [分享表清单分页] 展开表清单 →「共 8 张表」+ 第 2 页见 `biz_order`（默认 pageSize=5；demo 8 表）；密度锁不退 ✅`demo.spec`「免登录」
- [x] [DBML Trigger 缺口] `@dbml/core` 9.x 无 `Trigger` 块；`Note` 仅 chnname；不伪造互导（见 `data-format.md`）✅文档

## W5 切片 4 — 登录/注册品牌壳（2026-08-03）

- [x] [登录壳] `/login` 见 `auth-brand-shell`；左面板 ~40%；无 `bg2.png`/`#1677FF`；「打开演示」为 link✅ `smoke.spec.ts`
- [x] [注册同构] 登录「去注册」→ `/register` 同壳 +「打开演示」✅ `session.spec.ts`

## 竞品对照子页（2026-08-03）

- [x] [路由] `/compare` 可见对照表（版本/开源自部署等）+ CTA→demo/首页✅ `compare.spec.ts`
- [x] [入口] 落地顶栏「对比」与「查看完整对照」进 `/compare`✅ `compare.spec.ts`
- [x] [落地回归] `/` hero/CTA 仍绿✅ `landing.spec.ts`
- [x] [对照页键盘] `/compare` 首项 Tab Skip「跳到主操作」→ `#landing-main-cta`→「打开演示」→「自部署指南」→「返回产品首页」可逆；surface focus-visible；无 trap✅ `compare.spec.ts`「竞品对照页键盘」

## GSC SERP 摘要（2026-08-27 CTR）

- [x] [静态 HTML] `/` job-first title `Draw ER Diagram Online — Free Editor | ERD Online`、description 含 draw + `ERD editor and maker` + entity-relationship models、JSON-LD `alternateName`、不含 file viewer / Google Draw ✅`landing.spec.ts`「静态 HTML」
- [x] [locale title] `/` 中文「在线绘制 ER 图 — 免费编辑器 | ERD Online」；`/en` 英文同静态 title；`/en/compare` 对照英标题 ✅`i18n.spec.ts`「Landing SEO」

## GSC SERP 摘要（2026-08-16）

- [x] [静态 HTML] `/` 含 `Draw ER Diagrams Online`、JSON-LD WebApplication、canonical ✅`landing.spec.ts`「静态 HTML」（2026-08-27 已改为 job-first 题，见上节）
- [x] [locale title] zh「在线绘制 ER 图」/ en「Draw ER Diagrams Online」+ og:title + canonical ✅`i18n.spec.ts`「Landing SEO」（2026-08-27 文案已更新）

## 落地页 token 同源（2026-08-03）

- [x] [色板] `/` 底色 = `--erd-ink-900`；主 CTA = `--erd-brand`；第三柱 mark = `--erd-warning`；字族含 IBM Plex Sans✅ `landing.spec.ts`
- [x] [源码] `pages/landing/index.less` 无 `@ink`/`@accent`/`#e85d04`/`#4aa3c8`✅ `rg`

## W2 切片 3 — 设计器 chrome（2026-08-02）

- [x] [左树唯一] 空项目仅 1 份 `add-module-empty`；有模块后仅 1 份 `tree-open-relation` / `design-tree-add` / `role=tree`✅ `layout-outlet.spec.ts`
- [x] [sider 320 + 无 footer] `.design-layout__sider` width 320px；无 `.design-layout__sider-footer`✅同上

## W2 切片 4 — 设计器 calc(100vh) 清零（2026-08-02）

- [x] [树填满 sider] 有模块后 `.tree-container` 底边距 sider-inner ≤24px；无 `calc(100vh)`✅ `layout-outlet.spec.ts`
- [x] [版本页填满 content] `version-page` 高度与 `.design-layout__content` 差 `<8px`✅同上

## W6 权限组 / GroupLayout 导航 / 404（2026-08-02）

- [x] [权限组成员可见] `/project/group/setting/permission` 见角色 tab +「用户组成员」「权限配置」；权限配置见「全选」「团队基础设置」✅ `group-layout-nav.spec.ts`
- [x] [返回项目列表] GroupLayout「返回项目列表」→ `/dataModels`（无 projectId）✅同上
- [x] [打开模型] GroupLayout「打开模型」→ `/design/table/model?projectId=` 设计器可见✅同上
- [x] [404] 未知路径见「页面不存在」/`exception-404-gate`；「返回首页」离开该路径✅ `not-found.spec.ts`

## W2 项目公告（2026-08-02）

- [x] [更多公告] `/home`「更多公告」→ `/project/notice` 见 heading「公告」+ 种子标题链（含 ERDOnline）✅ `project-notice.spec.ts`
- [x] [公告加载失败 toast] mock `/syst/sysAnnouncement` 非 200 →「加载公告失败」✅同上
- [x] [公告列表行密度] 行 pad / 页标题 / 工具条与 22–28 同阶；notice-row gap ≤8；截图 `project-notice-list-dense.png` ✅同上「公告列表行密度」

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

## W4 切片 9 — CompareVersion / SyncConfig antd Modal+Form（2026-08-02）

- [x] [版本详情/比对非 ModalForm] 行「详情」/工具栏「版本比对」→ antd dialog；diff 面板 + 导出 `.md` 不变 ✅ `version.spec.ts` 可视化 diff
- [x] [同步配置非 ModalForm] 工具栏「同步配置」→ antd dialog；选「重建数据表」→ toast「设置成功」 ✅ `version.spec.ts`「同步配置弹窗可保存升级方式」

## W4 切片 10 — RebuildVersion / InitVersion / setting DefaultSetUp → antd（2026-08-02）

- [x] [重建版本非 ModalForm] 有版本后工具栏「重建版本」→ antd dialog 见版本号/描述；取消关窗（不真重建） ✅ `version.spec.ts`「重建版本弹窗可打开」
- [x] [初始化基线非 ModalForm] `InitVersion` 无 `@ant-design/pro-components`；testid `version-init-btn` ✅ rg
- [x] [设置页系统默认项非 ProForm] `/design/table/setting/default` 仍可打开；无 `@ant-design/pro-components` ✅ rg

## W4 切片 11 — ResetPassword / AddUser / ReversePdMan / ReverseERD → antd（2026-08-02）

- [x] [修改密码非 ModalForm] 安全设置 →「修改」→ antd dialog 见密码/确认密码；「取消」关窗 ✅ `account-settings.spec.ts`
- [x] [PdMan/ERD 导入非 ModalForm] 项目菜单导入子弹窗 + 上传 fixture 成功 toast；无 `@ant-design/pro-components` ✅ `import-pdman` / `import-erd` / `project-menu`
- [x] [添加成员非 ModalForm] 团队项目角色页「添加成员」→ antd dialog 可搜索用户 ✅`add-user-keyboard.spec.ts`（键盘闭环；不提交加人）

## W4 切片 12 — SqlApproval / BasicSetting / GroupSetting / notice / TableTab → antd（2026-08-02）

- [x] [基本设置非 ProForm] `/project/group/setting/basic` 保存成功/失败 toast ✅ `group-basic-setting.spec.ts`
- [x] [用户组非 ProCard] `/project/group/setting/permission` 角色 tab + 用户组成员/权限配置可见 ✅ `group-layout-nav.spec.ts`
- [x] [公告非 ProList] `/project/notice` 列表可见 + 加载失败 toast ✅ `project-notice.spec.ts`
- [x] [SqlApproval/TableTab 无 Pro] `rg '@ant-design/pro-components' …SqlApproval TableTab` = 0 ✅
- [ ] [SQL审批非 ModalForm] 版本比对弹层「SQL审批」→ antd dialog 见审批人/库/说明（手工；需有 SQL 变更）

## W4 切片 13 — person / recent / group / dataModels / ExportCommon ProList → antd（2026-08-02）

- [x] [项目列表非 ProList] `/project/person|recent|group` 标题+搜索+行链接/操作 ✅ `project-surface` / `layout-outlet`
- [ ] [个人空态 CTA] `/project/person` 无项目时见 `person-empty-create`/`person-empty-example`（`project-activation` chromium-serial；本轮账号锁超时未重验）
- [x] [dataModels 非 ProList] `/dataModels`「最近项目」Select 可见 ✅ `project-surface`
- [x] [ExportCommon 非 ProList] `/design/table/export/common`「导出文件」+ 点击导出 ✅ `export.spec.ts`
- [x] [列表 loading] 个人项目慢网见 `aria-busy` ✅ `loading.spec.ts`
- [x] [Pro 计数] `rg -l '@ant-design/pro-components' frontend/src --glob '*.{ts,tsx}' | wc -l` → 15 ✅

## W4 切片 14 — approval/order/home/login/register/databaseConfig/ExportDDL → antd（2026-08-02）

- [x] [审批/工单非 ProTable] 侧栏「我的工单/我的审批」表头 + 空态；种子拒绝/复批/SQL 失败仍待审 ✅ `approval.spec.ts`
- [x] [Home 非 PageContainer] `/home` 快捷入口 `home-link-*` 可见 ✅ `project-surface` / `activation`
- [x] [Home IA 重设计] `/home` 无「快速操作」色块墙；无竖排中文；hero 唯一 CTA 簇；过期公告隐藏；截图 `home-redesign.png` ✅ `layout-outlet`
- [x] [登录/注册非 LoginFormPage] 错误凭证 toast；去注册导航；注册进 home ✅ `smoke` / `session`
- [x] [databaseConfig 非 ProTable] `/databaseConfig` 新建连接 + 同步状态 + 编辑删除 ✅ `adr0008-datasource`
- [x] [ExportDDL 非 StepsForm] 菜单「导出DDL」弹窗两步 + 下载 `.sql` ✅ `project-menu` 导出DDL
- [x] [Pro 计数] `rg -l '@ant-design/pro-components' frontend/src --glob '*.{ts,tsx}' | wc -l` → 8 ✅

## W4 切片 15 — Pro 清零 + 依赖移除（2026-08-02）

- [x] [account/settings 非 ProLayout] `/account/settings` 基本资料 toast + 页签切换；挂 HomeLayout ✅ `account-settings.spec.ts`
- [x] [GroupUser/Permission 非 Pro] 权限组「用户组成员/权限配置/全选」可见 ✅ `group-layout-nav`
- [x] [逆向非 StepsForm] `/design/table/import/reverse` reverse_demo 导入 t_user/t_order ✅ `import-reverse.spec.ts`
- [x] [Pro 计数] `rg -l '@ant-design/pro-components' frontend/src --glob '*.{ts,tsx}'` → **0** ✅
- [x] [依赖移除] `package.json` 无 `@ant-design/pro-components` / `umi-presets-pro`；`config.ts` 无 presets/layout 空壳 ✅

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

## DBML 导入/导出互通（2026-08-02）

- [x] [DBML→projectJSON] Table/fields/note→chnname/Ref→1:n/Indexes→indexs/default→defaultValue；schema 可选校验 ✅ `yarn test:unit:dbml`
- [x] [projectJSON→DBML] 逻辑类型反查 + Ref + indexs + default；round-trip 实体/字段/FK/indexs/default 稳定 ✅ `fromProjectJSON.test.ts`（`yarn test:unit:dbml`）
- [x] [DBML default 双向] string/number/expression → defaultValue；导出还原；fixture `guest` round-trip ✅ `yarn test:unit:dbml`
- [x] [DBML Enum 双向] `Enum`↔`dataTypeDomains.datatype`（`kind:enum`/`values[]`）+ 列 type=code；fixture `enum.dbml` round-trip ✅ `yarn test:unit:dbml` + `dbml-export`「Enum fixture」
- [x] [DBML 表达式索引] expression 列↔`indexs[].fields[]` 原样；fixture `expression-index.dbml` round-trip ✅ `yarn test:unit:dbml` + `dbml-export`「表达式索引」
- [x] [逆向表达式/函数索引] PG `pg_get_indexdef` + MySQL 8 `EXPRESSION` → `indexs[].fields[]`；无列/空键软跳过 ✅ `IndexResultSetMapperTest` + `PostgresqlReverseDialectExpressionIndexTest` + `MysqlReverseDialectExpressionIndexTest`
- [x] [逆向 Oracle/SQL Server 函数·计算列索引] `ALL_IND_EXPRESSIONS` / `computed_columns.definition` → `indexs[].fields[]`；字典不可用回退列名 ✅ `OracleReverseDialectExpressionIndexTest` + `SqlServerReverseDialectExpressionIndexTest` + `IndexResultSetMapperTest`
- [x] [逆向 PG/SQL Server 部分·过滤索引] `pg_get_expr(indpred)` / `filter_definition` → `indexs[].filter` ✅ `IndexResultSetMapperTest` + `PostgresqlReverseDialectExpressionIndexTest` + `SqlServerReverseDialectExpressionIndexTest`
- [x] [索引签字段/表达式可编辑] JExcel text「字段/表达式*」分号混写 → `indexs[].fields[]`；失败回滚可重试 ✅ `index-expression-edit` + `indexFieldsCell.test.ts`
- [x] [索引签过滤条件列] JExcel「过滤条件」读写 `indexs[].filter`（逆向可见即可） ✅ 手工：逆向含 partial/filtered 索引 → 索引签见谓词文案
- [x] [DDL/DBML filter 回写] PG/SQLServer `CREATE … WHERE`；DBML `note: 'filter: …'` 往返 ✅ `json2code.indexFilter.test.ts` + `yarn test:unit:dbml`
- [x] [设计器导入] 项目菜单「导入DBML」上传 `minimal.dbml` → toast 成功 → 树 users/posts → 画布 `data-node-total≥2` ✅ `dbml-import.spec.ts`
- [x] [导入自动布局] DBML 导入后 `posts.x < users.x`（dagre LR，非网格散点）+ 截图 ✅ `dbml-import.spec.ts` / `yarn test:unit:dbml`
- [x] [表节点视觉打磨] 连线后 FK 徽章可见、PK 行有 `.erd-field-pk`、边带 Crow's foot marker、表名等宽字体；截图 `diagram-node-polish.png` ✅ `relation.spec.ts`「表节点视觉：PK/FK」
- [x] [边路由肘距分流] 同表对双 FK → 两条 `.react-flow__edge-path` 的 `d` 不同 + `erdSmooth`；截图 `diagram-edge-lanes.png` ✅ `relation.spec.ts`「边路由：同表对双 FK」
- [x] [边路由障碍避让] `relationEdgeRoute` 单测（穿表 bypass / 竖肘 centerX）；E2E `erd-edge-route-mode` 接线 + 截图 `diagram-edge-obstacle.png` ✅ `relation.spec.ts`「边路由：erdSmooth 暴露 route-mode」
- [x] [边路由干道 bundling] `assignTrunkBundleOffsets` 同 midX 通道分流；`data-bundle` + path 互异；截图 `diagram-edge-bundle.png` ✅ `relation.spec.ts`「边路由：干道 bundling」
- [x] [边路由两弯 / mid-corridor] `pickBypassYCandidates` 含叠表缝；竖挡堵单 bypass → `mode=twoBend`；E2E `data-mode` 允许 `twoBend` ✅ `relationEdgeRoute.test.ts` + `relation.spec.ts`「边路由」
- [x] [边路由稀疏 A*] 走廊内外封堵两弯 → `mode=astar`；E2E `data-mode` 允许 `astar` ✅ `relationEdgeRoute.test.ts` + `relation.spec.ts`「边路由」
- [x] [密 FK 导入走查 + 绕行竞短] `dense-fk.dbml` 12 表/20 FK → modes 含 `astar|twoBend`；截图 `diagram-dense-fk-canvas.png`；DBML 树勿点已展开标题 ✅ `dense-fk-import.spec.ts` + `dbml-import.spec.ts`
- [x] [分享只读同路由 + hub 扇出] `/demo` 暴露 `erd-edge-route-mode`（同设计器允许集）+ 非零 `data-hub-fan`；截图 `demo-share-edge-routing.png`；`hubFanOffsetsForAssociations` 单测 ✅ `demo.spec.ts` + `relationEdges.test.ts`
- [x] [表节点卡片层次] 表头 `surfaceMuted` rgb(243,245,247)；PK `::before` 2px warning；截图 `diagram-node-polish.png` / `diagram-shareable-tokens.png` ✅ `relation.spec.ts`「表节点视觉」
- [x] [空态构图] 画布见 `erd-empty-diagram` +「开始你的第一张关系图」+ **唯一**主 CTA + 次链「导入 DBML · 从数据源逆向」；禁 outline 第二钮；空态无 MiniMap；截图 `diagram-empty-composition.png` ✅ `relation.spec.ts`「空态构图」
- [x] [空态 CTA 层次] 标题 14/700 + desc ink400；主钮 weight≥600；次链 ink600；分享空态 title/hint 同构 ✅ `relation`「空态构图」+ `share`「空模块分享」
- [x] [画布工具栏新建表] 非空画布点 `canvas-create-table` → `T_TABLE_2` 上图 + toast「表添加成功」；工具栏可访问名含「新建表」 ✅ `relation.spec.ts`「工具栏新建表」
- [x] [连线失败反馈] 拖到表体（未对准接入点）toast；合法连线后重复同一对 toast「关联已存在」且边仍 1 ✅ `relation.spec.ts`「连线失败反馈」
- [x] [设计器导出] 导入后「导出DBML」预览含 Table/Ref → 下载 `.dbml` ✅ `dbml-export.spec.ts`
- [x] [导入菜单四项] 数据源/PdMan/ERD/DBML 均可开弹窗 ✅ `project-menu.spec.ts`
- [x] [导出菜单六项] HTML/Word/Markdown/DDL/ERD/DBML 可见 ✅ `project-menu.spec.ts`

## 设计器项目 ▾ 最近切换（2026-08-02）

- [x] [最近项目当前项] 项目菜单见「最近项目」+ `✓ <当前项目名>` ✅ `project-menu`「全部项目可达」
- [x] [最近项目切换] 建 A/B → 在 B 菜单点 A → URL `projectId=A` 且顶栏名变 A、面板关闭 ✅ `project-menu`「最近项目可切换」

## W6 账户设置基本资料（2026-08-02）

- [x] [基本资料保存成功 toast] `/account/settings?selectKey=base` →「更新基本信息」→「更新基本信息成功」✅ `account-settings.spec.ts`
- [x] [security/identification 页签] 头像→个人中心→「安全设置」见账户密码/修改→密码弹窗；「授权类型」见开源版/已授权；头像「授权信息」直达 identification ✅ `account-settings.spec.ts`
- [x] [identification 密度/token] `/account/settings?selectKey=identification` 见 `account-settings-identification`（无 `.ant-result`）；标题 13/22；图标色走 `--erd-brand`（非硬编码字面量）✅ `account-settings.spec.ts`
- [x] [基本资料保存失败 toast] mock update 非 200 →「更新基本信息失败」✅同上
- [x] [头像无假 Upload] 见「头像上传暂未开放」；无「更换头像」/file input ✅同上

## 双层一致性与可信保存（ADR-0022，2026-08-04）

- [x] [离开设计器不盲存] 干净态点顶栏品牌回 `/home` → 无 `/ncnb/project/save` 请求 ✅ `leave-designer-save.spec.ts`「干净态离开」
- [x] [失败态离开补一枪] 阻断 save 制造失败态 → 放开后离开 → 至少 1 次 save 且失败仍有可见反馈 ✅ `leave-designer-save.spec.ts`「落库失败后离开」
- [x] [失败态离开补枪后顶栏重试] mock 500×2（autosave+离开补枪）→ 回设计器恢复草稿 → 顶栏重试 → 已落盘 → 干净离开零 save ✅ `leave-designer-save.spec.ts`「离开补枪→顶栏重试→离开」
- [x] [防抖窗口离开补枪成功] 建表见「保存中…」即回 `/home` → save 完成 → 重进无草稿弹窗 + T_TABLE_2 在画布 ✅ `leave-designer-save.spec.ts`「防抖窗口内离开：补枪成功」
- [x] [防抖窗口离开补枪失败可见] abort save + 未落盘离开 → 草稿恢复 Modal + 顶栏重试 CTA ✅ `leave-designer-save.spec.ts`「防抖窗口内离开：补枪失败」
- [x] [beforeunload 不覆写失败草稿] 落库失败写 draft → reload → localStorage 仍含新字段 + 草稿恢复弹窗 ✅ `leave-designer-save.spec.ts`「落库失败后 reload：beforeunload 不覆写 localStorage 草稿」
- [x] [关页后草稿可恢复] 落库失败 → 关页重开设计器 → 恢复草稿 + 顶栏重试 CTA ✅ `leave-designer-save.spec.ts`「落库失败后关页：草稿仍在 localStorage，重开可恢复」
- [x] [双人协作离开不覆写对方] 团队项目双 context：B 落盘 → A 失败离开补枪 → B reload 仍见 T_TABLE_1、无 A 脏表、可续编落盘 ✅ `leave-designer-save.spec.ts`「A 落库失败离开后 B 已落库改动仍可见且可续编」
- [x] [双人协作 B localDirty 不被覆写] 团队双 context：B 已落库字段 + 阻断 save 加 dirty 字段 → A 失败离开补枪 → B 已落库仍可见、localStorage 草稿在、reload 恢复后双字段可见 ✅ `leave-designer-save.spec.ts`「A 落库失败离开后 B 未保存与已落库改动均不被覆写」
- [x] [project 乐观锁 409] 陈旧 `updateTime` save → 409；匹配 → 200 + 新 `updateTime` ✅ `ProjectSaveOptimisticLockTest` + `scripts/verify-project-save-conflict.sh`
- [x] [409 可行动 UI] mock 409 → Modal「保存冲突」+ 顶栏「保存冲突，点击查看选项」，不得显示「已落盘」 ✅ `project-save-conflict.spec.ts`
- [x] [409 diff 预览] mock 409 → Modal 内 `project-save-conflict-preview` + `version-diff-panel` 可见（本地 vs 服务器） ✅ `project-save-conflict.spec.ts`
- [x] [409 刷新路径] mock 409 → 点 `project-save-conflict-refresh` → toast「已加载服务器上的最新项目」+ 顶栏「已落盘」+ localStorage 草稿清 ✅ `project-save-conflict.spec.ts`
- [x] [409 另存路径] mock 409 → 点 `project-save-conflict-fork` → toast「已另存为新项目」+ 跳转新 `projectId`（`/design/table/model`） ✅ `project-save-conflict.spec.ts`
- [x] [失败态 vs 409 顶栏分流] mock 500 → 顶栏「保存失败，点击重试」+ 无冲突 Modal；mock 409 → 冲突 Modal +「保存冲突，点击查看选项」+ 无失败重试 CTA ✅ `save-status-failure-routing.spec.ts`
- [x] [顶栏重试不卡保存中] mock 首次 save 500 → 点顶栏重试 CTA → 第二次成功 →「已落盘」、无失败按钮、不长期「保存中…」 ✅ `save-status-failure-routing.spec.ts`「点击顶栏重试」
- [x] [顶栏 A 层 dirty chip] 设计器顶栏 `version-dirty-chip-*`：尚无版本带 +N 摘要 → 存版后「版本一致」→ 再改「未存版本」；基线失败 → `version-dirty-chip-unknown`；SaveStatus「已落盘」分离 ✅ `version-dirty-chip.spec.ts`（4 用例）
- [x] [A 层全量 diff] 改 profile 默认字段或画布连线关联 → dirty chip「未存版本」；空 diff 存版 toast 警告但不阻断 ✅ `versionStructuralDiff.test.ts` + `version-dirty-chip.spec.ts` profile/assoc 用例
- [ ] [北极星计量] 后台统计「有版本保存」须过滤 `db_change.changes` 非空（待 analytics 接线；当前前端 warn + ADR-0022/vision 口径已文档化）
- [x] [基线独立查询] 打开项目即 `size:1` + `create_time` 倒序拉最新版本；版本页列表首条被伪造成更大版本号的空模型后仍判「一致」，建议版本号仍按基线推进 ✅ `version-baseline.spec.ts` + `versionBaseline.test.ts`
- [x] [无基线不伪装一致] 新项目未存版本 → 版本页显示「尚无版本基线，建议先保存第一个版本」，非「已与最新版本一致」 ✅ `version-baseline.spec.ts`
- [x] [基线查询失败为未知] 断网/后端 500 时 `/ncnb/dbChange`（size:1）失败 → 顶栏 `version-dirty-chip-unknown` + 版本页 `version-baseline-unknown`；点击重试恢复 ✅ `version-baseline.spec.ts`「基线查询失败 → 未知态」
- [x] [落库失败不假装落行] 阻断 `/ncnb/project/save` 后画布内联加字段 → 字段草稿留在编辑行、模型无该字段、toast + 顶栏重试可见；恢复后在编辑行再按 Enter 才真正落行 ✅ `save-failure.spec.ts`（原用例按旧乐观行为断言，已按诚实持久化重写）
- [x] [落库失败本地草稿] 保存失败 → localStorage `erd:project-draft:{id}` 写入 → 重进设计器 Modal「恢复草稿/丢弃草稿」→ 恢复后模型含未落库改动；丢弃后清草稿、用服务器模型、不再弹窗 ✅ `projectLocalDraft.test.ts` + `project-local-draft.spec.ts`（恢复 + 丢弃）
- [x] [B 层 schema 指纹] `SchemaFingerprintTest`：同构 hash 稳定；增列 → different；无 projectJSON → unknown；忽略 `db_version` 表 ✅ `SchemaFingerprintTest`
- [x] [B 层探测五态] 设计器顶栏（模型/版本页均可见）`schema-probe-control--chrome`；UNKNOWN 四路 + mock 五态（synced/ahead/behind/diverged/connection-failed）；版本页 `dual-layer-legend` ✅ `schema-probe.spec.ts`（4 用例）
- [x] [分享访客隐藏 B 层] 匿名打开 `/s/:token` → 无 `schema-probe-control`/`schema-probe-btn`；不 POST `/connector/schema/probe`；后端非成员 probe → 403 + `PROBE_ACL_DENIED` ✅ `share.spec.ts` + `SchemaProbeAccessGuardTest`
- [x] [db_version 书签降级] 版本行 tag 为「已推送/未推送」；tooltip 明示非实库指纹真相 ✅ 版本页 `version-push-bookmark-tag`

## Railway 部署排障（2026-08-05）

- [x] [OIDC issuer 单值] `ERD_UI_URL` 逗号双源时，OIDC issuer 只取第一个合法 http(s) 条目；首项畸形（如 `ttps://`）自动跳到下一个合法条目 ✅ `OidcConfigTest`
- [x] [畸形 Origin fail-fast] prod 下 `ERD_UI_URL` 任一逗号条目缺 `http(s)://` 前缀 → 启动失败并点名具体值；非 prod 仅 warn 放行 ✅ `CrossOriginPolicyTest`
- [ ] [Redeploy 崩容器排障] 日志含 `oidcIdTokenService` init 失败 → 先查 `Caused by:` 是否含 `ERD_OIDC_RSA_PRIVATE_KEY`（RSA 私钥未设，与 `ERD_UI_URL` 无关，见 `docs/deployment.md` 排障段）→ 补齐私钥变量后 Redeploy → `actuator/health` 转 UP

## 社交解析 OG（ADR-0025，2026-08-08）

- [x] [分享卡片] `curl -H 'User-Agent: Twitterbot' /og/s/{token}` → `og:title`=项目名·ERD Online，描述含「N 张表」+ `twitter:card=summary_large_image` ✅ 本机 curl + `OgUnfurlControllerTest`
- [x] [失效回落] `curl /og/s/{无效token}` → 品牌通用卡片（`ERD Online · 数据库设计的 Git + Figma`），不泄露分享是否存在 ✅
- [x] [XSS 转义] 项目名含 `<script>` → 揭示页输出 `&lt;script&gt;`，不注入可执行脚本 ✅ `OgUnfurlControllerTest`
- [x] [nginx 分流] bot UA `/s/{token}`、`/demo` → 后端 OG HTML；真人 UA → SPA `index.html`；`/og/**`（含 og:image）任意 UA → 后端 ✅ 本机起 nginx 验证 + `nginx -t`
- [x] [动态 og:image] `curl /og/s/{token}/image.png` → `image/png` 1200×630，含真实表名网格；`og:image` 指向该图 ✅ `OgImageRendererTest` + 本机 curl
- [ ] [多源取首] `ERD_UI_URL` 逗号双源时 `og:url`/`og:image` 用第一个 origin（去尾斜杠）→ 期望首源；上线后抽查

## 版本管理全链路闭环审计（2026-08-09）

- [x] [初始化基线真实提交不炸列表] 有 JDBC 数据源 + 尚无版本 → 点「初始化基线」填版本号/描述 → 确定 → 版本行可见、`version-list` 不空、不白屏；旧代码必现「该行不可见」（git stash 对照验证）✅ `version-init-submit.spec.ts`
- [x] [删除版本行即时消失] 存两版 → 删旧版 → toast「版本信息删除成功」→ 该行立即从列表消失，不因并发重拉「诈尸」；重命名同理 ✅ `version.spec.ts`「重命名描述与删除版本有 toast 且行消失」（此前必现失败，`updateVersionData` 改 `await` 落库后才 `fetch` 修复）
- [x] [重建版本清书签一致] `deleteAllHistory`（重建版本路径）与单删 `deleteHistory` 一样清空该 project+dbKey 下 `db_version` 推送书签，不留旧版本号误判「已推送」✅ `DbChangeServiceImplDeleteAllTest`
- [x] [无 JDBC 快照零摩擦回归] 无数据源仍可保存首版、列表可见（未受本轮改动影响）✅ `version.spec.ts`「无数据源也可新增版本并在列表可见」
- [ ] [hisProject 接口权限仅前端] `canErdHisprojectAdd/Edit/Del/Init/Rebuild` 仅前端 `<Access>` 隐藏按钮，后端 `HisProjectController` 无细粒度 `@PreAuthorize`；已登录用户越权调用可 save/delete 任意项目版本（探索阶段发现，未在本轮修复，需排期评估团队权限模型）
- [ ] [CompareVersion 同步按钮 loading 假态] `execSQL` 的 `loading` 在同步方法体 try/finally 内同步清零，未覆盖弹窗确认后的真实异步窗口（低优 P2，未在本轮修复）
