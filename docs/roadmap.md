# 路线图 / Roadmap

:::info 读者
本文面向**贡献者与维护者**。终端用户请从 [从这里开始](/docs/guide/intro) 进入使用指南；公开能力入口见侧栏「自托管与开放接口」。
:::

> 公开路线图。欢迎通过 [Issues](https://github.com/erdonline/erdonline/issues) 影响它。
> 状态标记：✅ 已完成 · 🚧 进行中 · 📋 已规划

## 当前状态

工程与设计器为**可用雏形**：核心旅程可跑；数据源已按 ADR-0008 隔离。联调基线：`./scripts/audit-fe-apis.sh`。

**下一阶段战略（服务北极星，不推翻愿景）**：P2b 矩阵 🚧 已清零（见 [control-matrix.md](./control-matrix.md)）；余下矩阵 📋 为延期（论坛外链、VIP 角标、实验 query/ChatSQL/dataDomain/dataQuery 等，见矩阵）。**模板广场 MVP ✅**（[ADR-0028](./adr/0028-official-template-catalog.md) 切片 0–5）；**P1 评论/举报/hot ✅**（切片 6–7）；转化看板 stub 📋。

### Vision 自动轨重定向（2026-08-04）

人工指定主题：**双层一致性与可信保存**（[ADR-0022](./adr/0022-dual-layer-consistency.md)）。Vision 5m 循环（`scripts/agent-loop-vision.prompt.md`）按该主题的切片队列续跑（A 工作区 → 并发/持久化底座 → B 实库五态），一 tick 一刀，做完自动推进；仅用户叫停或连续两轮指标变差才暂停改动。详见下「双层一致性 🚧」。

### Vision 自动轨暂停点（2026-08-03 · `d94f1fd`，已被上方重定向取代）

自动扫描结论：已无**未锁定**的高 ROI P0/P1 Vision 切片（不含已密 chrome 再 densify、不含 Auth logo）。**自动 Vision track 暂停**，等人工解封后再续跑。

| Human next | 为何门控 | 解封条件 |
|---|---|---|
| ~~[ADR-0013](./adr/0013-public-api-mcp.md) 公开 API / MCP~~ | ~~鉴权/限流/scope 未拍板~~ → **人工解封 2026-08-04**；MVP ✅（切片 1–5 + write REST/MCP + Redis + OAuth A+B + PAT/client UI + 同意页） | — |
| P4 官方 demo（Railway） | Dashboard 拉起 + 填 `DEMO_API_URL`（ADR-0019 选型已定，运维仍人工） | 人工完成 Railway + 回填 env |
| DBML Trigger 互导 | `@dbml/core` 无 Trigger 块；禁止塞 Note | 上游官方块稳定 |
| 复合 FK `fields[]`（[ADR-0011](./adr/0011-defer-composite-fk-fields-array.md)） | 仍延期 | FE 多字段边协议落地 |

非 Vision 低优备忘（不抢自动轨）：security R-DATA-02 残余 raw ping/reverse JDBC；跨表复用 / dataDomain 重估；版本分支式演进（ADR-0016 本季禁）；贡献者漏斗 / 正式仓 Issue 投放；demo 站主 bundle vendor/app 未拆分（`umi.js` ~1.86MB 落地页与设计器共背同一包，见 2026-08-04 性能诊断）+ `html2canvas.min.js` 阻塞头脚本改懒加载（仅导出功能用）。

## 下一季只做三件事（北极星杠杆）

按序推进，一次只做一件。三件事均 ✅ 后 **不 idle**：Vision 5m 循环按 [ADR-0016](./adr/0016-experience-first-shareable-diagram.md) 双轨（体验=敢分享的美图；能力=维护版本/分享）继续发明下一刀（见 `scripts/agent-loop-vision.prompt.md`）：

1. **首屏叙事 + 示例项目 → 30 秒进版本保存**（激活；服务「30s 惊艳」+「每周版本」北极星）✅（示例就绪 CTA + 顶栏「保存版本」✅；计时 E2E `activation-30s.spec.ts` 墙钟基线 ~3.5s ≤30s ✅ 2026-08-02）
2. **导出/版本信任链打穿**（Word/MinIO 解耦或降级、审批通过路径、导出失败可见）✅（导出失败可见 ✅；Word/MinIO 解耦：classpath 默认模板 + MinIO 缺席降级 ✅；审批通过路径：SQL 失败不落通过/不 sync ✅ 2026-08-02）
3. **协作 → 版本自然发生**（presence 到「本周一起改并保存」的引导，不扩 AI）✅（远端 sync 提示带「保存版本」直达版本页，节流 ≤1/min/会话；全路径 E2E：toast→CTA→AddVersion 落库 + 60s 节流回归 ✅ 2026-08-02）

**依赖外部或后置**：AI、i18n、正式仓 Issue 投放（`REPO=… ./scripts/seed-good-first-issues.sh`，待正式仓就绪）。

## P5：AI 时代数据结构平台 🚧

> 依据 [ADR-0012](./adr/0012-ai-era-data-structure-platform.md)（**已接受 · 选项 B**）：「数据库设计的 Git + Figma + AI agent 可读的开源事实源」，关键词 **开放 + 安全**。落地页先行；API/MCP 见 [ADR-0013](./adr/0013-public-api-mcp.md)（✅ MVP：切片 1–5 + write REST/MCP + Redis + OAuth A+B + PAT/client UI + 同意页）。

### MCP / Agent 增长楔子（2026-08-28 起，两周）🚧

> 详细日历与验证点见 [`growth.md`](./growth.md)「MCP / Agent 两周猛攻」。愿景锁：AI 是期权；H1 仍 Git + Figma；www SERP title 仍 draw-ERD；公开文档只认 `https://doc.erdonline.com`。

| 切片 | 状态 | 交付 |
|---|---|---|
| 1 文档 30 秒 MCP 路径 + SEO + 稿 #13 | ✅ 2026-08-28 | [`guide/api-and-mcp`](./guide/api-and-mcp.md) copy-paste；落地页开放支柱链；`content/articles/cursor-mcp-read-and-suggest-version.md` |
| 2 小红书/掘金发 #13 | 🚧 2026-08-28 | 小红书**已发布**浏览 5 [explore/6a906823…](https://www.xiaohongshu.com/explore/6a90682300000000290346fd)（勿再点发布）；掘金粘贴稿待登录后发 |
| 3 已登录工作台 MCP 次入口 | ✅ 2026-08-28 | Home hero「给 Cursor 配 MCP」；统计改「今日编辑」 |
| 4 PAT 成功页内嵌 mcp.json | ✅ 2026-08-28 | 铸造后弹层可复制已填 PAT 的 Cursor `mcp.json` |
| 5 文档 MCP 页 3 张截图 | ✅ 2026-08-28 | PAT 揭示 / mcp.json / Agent 工具清单；XHS 封面用 `content/articles/assets/mcp-*.png` |
| 6 掘金 CTA 复盘 | ⛔ 验证码墙 | 待登录掘金后再做；不群发 |
| 7 GSC EN 收录探测 | ✅ 2026-08-28 | 中/英 MCP 页 200 + 尾斜杠 canonical + sitemap loc；GSC 未知 → 已请求编入索引；补交 EN sitemap |
| 8 CI REST schema-lint 稿 | ✅ 2026-08-28 | `ci-rest-projectjson-schema-lint`；蒸馏进 [`data-format`](./data-format.md) |
| 两周评审（提前） | ✅ 2026-08-28 | XHS #13 已发布浏览 5（#6 仍 51）；GSC 2/103 持平、无 doc 页；www home 无 P0 泄漏；稿 #15 dunk+demo |

### 落地页（公开，品牌优先，一个构图）✅

- 公开路由 `/`（未登录可访问）；登录「了解产品」回链；未登录主 CTA → `/demo`，已登录主 CTA → `/home`
- 实现约束：品牌优先 + **全幅**真实画布截图（`landing-hero.jpg`），禁止侧栏嵌图 / 紫色渐变 AI slop；见 [landing.md](./landing.md)
- E2E：`landing.spec.ts`（加载 + CTA→demo/登录 + 已登录→工作台）✅
- GSC snippet 对齐（2026-08-16）：静态 title/description + JSON-LD WebApplication；H1 品牌定位不动 ✅

### 双层一致性与可信保存 🚧

> 依据 [ADR-0022](./adr/0022-dual-layer-consistency.md)：借 Git 心智（status / pull / push）把三个真相分层表达；**禁止自动双向同步**。当前 Vision 5m 循环的唯一主题。

**A 工作区（内存 projectJSON ↔ 最新版本）**

- ~~基线独立拉最新版本（禁用分页 `versions[0]`）~~ ✅（2026-08-04；`create_time` 倒序 `size:1` 独立查询 + 无基线态提示）
- ~~实时 dirty chip（干净 / 有改动 / 落库失败；与顶栏保存状态合并语义，不重复反馈）~~ ✅（2026-08-04；顶栏 `VersionDirtyChip` + SaveStatus 改「已落盘」）
- ~~全量 diff（`associations` / `diagrams` / `profile` 进 diff）+ 防抖；**空 changes 不计入「有版本保存」北极星**~~ ✅（2026-08-04；`versionStructuralDiff.ts` + 存版 warn + 快照含 profile/domains）

**并发与持久化底座（先防丢数据）**

- ~~删卸载盲存（`closeSocket` 无条件 `Save.saveProject`）→ 仅脏时落库且结果可见~~ ✅（2026-08-04）
- ~~project 乐观锁（冲突可行动提示，不静默覆盖）~~ ✅（2026-08-04；`update_time` CAS → 409；Modal 刷新/另存为新项目）
- ~~`db_change.version` 唯一约束（Flyway）~~ ✅（2026-08-04；V14 去重 + 唯一索引；409001 + 前端 Modal）
- 诚实持久化：落库失败落本地草稿 + `beforeunload` 拦截，再次进入可对比/丢弃 ✅ 2026-08-04

**B 实库（模型 ↔ 活库 schema）**

- ~~判据换实测 schema 指纹（表/列/索引规范化哈希）；`db_version` 降级为提示~~ ✅ 2026-08-04（`POST /connector/schema/probe` + 版本页「探测实库」；书签 tag「已推送/未推送」）
- 修 `compareStringVersion`（空段 / `NaN` / 前缀）；不可判 → 未知态而非「一致」~~ ✅ 2026-08-04（`stringVersion.ts` 返回 `null`；书签 tag「书签未知」；同步动作保守阻断）
- ~~五态 + 未知态 4 路可行动文案；探测显式（loading + 失败原因）~~ ✅ 2026-08-04（IR diff → ahead/behind/diverged；未知四路 copy + testid；`schema-probe.spec.ts`）
- ~~分享访客隐藏 B 层~~ ✅ 2026-08-04（`shareContext` + ACL guard + `share.spec.ts` 无 probe testid/API）

**MVP 队列（#1–#11）已闭环**；同主题续跑队列 #12 ✅ → #13 ✅ → #14 ✅ → #15 ✅ → #16（Pull/Push 需用户开闸）见 `scripts/agent-loop-vision.prompt.md`。

- ~~#12 A/B 层 diff 视觉/文案统一（`dualLayerTokens` parity 色 + 顶栏图例；A 一致绿/领先蓝；toolbar 与 dirty chip 同源）~~ ✅ 2026-08-04
- ~~#13 冲突可视化：project 409 Modal 补最小 diff 预览（本地 vs 服务器 / last known；复用 `VersionDiffPanel`）~~ ✅ 2026-08-04
- ~~#14 B 层探测入口收敛：`SchemaProbeControl` 迁入设计器顶栏（icon-only chrome）；版本页移除重复；画布内可发现~~ ✅ 2026-08-04
- ~~#15 五态 + dirty chip E2E 补盘：`schema-probe.spec.ts` 4 用例（mock 五态 + 未知四路 + legend）；`version-dirty-chip.spec.ts` no-baseline/clean/dirty；A 层 unknown 仍手工清单~~ ✅ 2026-08-04
- ~~#23 基线查询失败 E2E：`version-baseline.spec.ts` mock size=1 → 500 → unknown chip/tag + 重试恢复；`fetchVersionBaseline` 失败清 `baselineLoaded`~~ ✅ 2026-08-05
- ~~#24 本地草稿丢弃 E2E：`project-local-draft.spec.ts` 丢弃路径 + `project-draft-recovery-*` testid；丢弃后清 localStorage、回服务器模型~~ ✅ 2026-08-05
- ~~#25 409 冲突 Modal 决策 E2E：`project-save-conflict.spec.ts` refresh/fork 路径 + 刷新清草稿；静态 Modal 改 `appFormat`/`VersionDiffPanelStatic`；fork 跳转 `/design/table/model`~~ ✅ 2026-08-05
- ~~#26 落库失败 vs 409 冲突顶栏态分流 E2E：`save-status-failure-routing.spec.ts` 失败重试与冲突 Modal 不得混态~~ ✅ 2026-08-05
- ~~#27 顶栏重试 seq 对齐：`isPersistAutosaveCurrent`；mock 失败 → 点重试 → 已落盘（不卡保存中）~~ ✅ 2026-08-05
- ~~#28 离开设计器失败态 E2E：`leave-designer-save.spec.ts` 失败 → 离开补枪 → 顶栏重试 → 干净离开~~ ✅ 2026-08-05
- ~~#29 防抖窗口离开补枪 E2E：保存中即离开 → 补枪成功 / abort 失败 → 草稿 + 顶栏重试可见~~ ✅ 2026-08-05
- ~~#30 beforeunload + 落库失败草稿守卫 E2E：reload/关页不覆写 localStorage 草稿；native dialog 不测（Playwright 脆），以 draft 持久化验收~~ ✅ 2026-08-05
- ~~#31 双人协作离开补枪 E2E：双 context（sync-toast 模式）；A 落库失败离开补枪；B 已落库改动 reload 后仍可见且可续编~~ ✅ 2026-08-05
- ~~#32 双人协作 B localDirty 离开补枪 E2E：B 阻断 save 保持 localDirty；A 失败离开补枪；B 已落库 + 草稿未保存改动均不被覆写~~ ✅ 2026-08-05

### i18n 奠基（B 层后）✅

> 依据 [ADR-0023](./adr/0023-i18n-foundation.md)。2026-08-04 落地。

- ~~Theme locale 可配置（默认仍 **zh-CN**；本切片不启用 umi locale plugin MVP）~~ ✅
- ~~清理死 `locales/` Pro 骨架（零 `useIntl` 消费者）~~ ✅
- ~~E2E 反脆弱：新控件 prefer `data-testid` / `aria-label`；定位与文案断言分离~~ ✅（`e2e-locators.mdc`）

完整 i18n（语言切换 UI、全站 key 化）仍为 P3 📋；「英文优先」= 新 key 同时写 EN+ZH；首访 `baseNavigator:true` 按浏览器语言匹配，`LocaleSwitcher` 显式选择 + `umi_locale` 持久化覆盖。

**i18n MVP 进度（2026-08-05）**：#1–#16 已全部 ✅（含 DesignLayout 工作流/skip-nav/aria · `1c63853` 等）；post-MVP #17–#22 ✅；Vision 默认车道已回归一致性/可信（#23–#32 ✅ · `76d1a1a`），**awaiting theme**

### 产品深度（走出「thin CRUD」）📋

- 数据字典 / 治理：~~字段级文档~~✅ 字段库 MVP（ADR-0032 `/setting/fieldLibrary` + copy-on-apply）；~~枚举域~~✅（`/setting/dataType` kind=enum + `values[]` 可编）；~~逻辑类型 apply 方言映射~~✅（密表编 `apply[code].type`）；跨表复用（字段库 platform/group/user scope）
- 逆向保真🚧：~~FK 约束名 + ON DELETE/UPDATE~~✅（`constraintName`/`deleteRule`/`updateRule`；复合仍拆边同名；~~画布可编参照动作~~✅；~~DDL/DBML FK 回写~~✅）、复合 FK `fields[]`（ADR-0011 **仍延期**，解封=FE 多字段边协议）、~~PG 表/列注释 → chnname~~✅（字典 `obj_description`/`col_description`）、~~SQL Server 表/列注释 → chnname~~✅（`MS_Description`）、~~Oracle 表/列注释 → chnname~~✅（`ALL_TAB_COMMENTS`/`ALL_COL_COMMENTS`）、~~列默认值 `COLUMN_DEF` → `defaultValue`~~✅（JDBC 通用）、~~索引已字典化~~✅、~~PG/MySQL 表达式·函数索引 → `indexs[].fields[]`~~✅（`pg_get_indexdef` / `STATISTICS.EXPRESSION`）、~~Oracle/SQL Server 函数·计算列索引 → `indexs[].fields[]`~~✅（`ALL_IND_EXPRESSIONS` / `sys.computed_columns.definition`；P0 四库闭环）、~~PG/SQL Server 部分·过滤索引谓词 → `indexs[].filter`~~✅（`pg_get_expr(indpred)` / `filter_definition`）、~~索引签字段/表达式可编辑~~✅（JExcel text；分号混写；persist-on-200）、~~索引签过滤条件列~~✅（文本读写 `filter`）、~~DDL/DBML `filter` 回写~~✅（PG/SQLServer `WHERE`；DBML `note: filter:` 约定）、~~MySQL 触发器 → `triggers[]`~~✅（`INFORMATION_SCHEMA.TRIGGERS`）、~~PG 触发器 → `triggers[]`~~✅（`information_schema.triggers`）、~~SQL Server 触发器 → `triggers[]`~~✅（`sys.triggers`）、~~Oracle 触发器 → `triggers[]`~~✅（`ALL_TRIGGERS`+`ALL_SOURCE`；P0 四库闭环）、~~DDL `triggers[]` 回写~~✅（`createTrigger`；优先 `ddl`/方言重建）
- 版本工作流：分支式演进、~~版本标签/里程碑~~✅（`db_change.tag` 逗号分隔多标签 + chips 筛选；无跨版本唯一）、~~跨版本 diff 的导出~~✅（W3 切片 1：Markdown 变更清单 + SQL）
- 协作 → 版本自然发生（下一季③ ✅）；后续深化见版本工作流（分支式演进等）

### UI 水位（Strangler，不重写）🚧

- CRUD 壳维持 antd（ADR-0005），设计域沉淀自研视觉系统（节点/工具条/命令面板已成体系）；[ADR-0016](./adr/0016-experience-first-shareable-diagram.md) 美图主线：品牌 token ✅ → 导入/逆向 dagre 分层布局 ✅ → 节点密度/PK·FK 徽章/箭头边 ✅ → 边路由（同表对多 FK 肘距分流 + 自定义 erdSmooth）✅ → 示例/默认布局密度（dagre 56/108 + Frame padding 24；demo 种子改用 `gen-demo-layout.ts` 算法生成，弃手排 x/y）✅ → 边障碍避让（centerX / bypassY 绕中间表）✅ → 正交 edge bundling（同 midX 通道干道分流）✅ → 两弯绕行 / mid-corridor（escapeX + 叠表缝）✅ → 稀疏 Hanan A* ✅ → 密 FK 导入走查 + 绕行竞短 ✅ → 分享只读同路由 + hub 扇出 ✅ → **表节点卡片层次（muted 表头 + 行分隔 + PK 色条）✅** → **几何择柄（竖叠同侧短 U）✅** → **Frame 主题色板 + 三壳清硬编码 ✅** → **边标签 chip 可读 ✅** → **导入后 Frame 自动建议 ✅** → **基数可编辑（1:1/1:n/n:1/n:n）✅** → **Frame 双击重命名 ✅** → **同侧 sameSide 外肘 + mid-corridor 竞短 ✅** → **Crow's foot 端点（IE，随基数）✅** → **空态构图打磨 ✅** → **分享顶栏品牌对齐（W5 切片 3）✅** → **登录/注册品牌壳（W5 切片 4）✅** → **落地页 token 同源 ✅** → **密图密度微调（demo dagre 生成 + 分享 fitView / relationNoShow）✅** → **字段行再压一档（min-height 22 / FIELD_ROW_H 26）✅** → **导入后首屏打磨（空态导入 CTA + fitView 同分享密）✅** → **竞品对照子页 `/compare` ✅** → **边标签密度 + Frame padding 20 ✅** → **Frame 标题栏密度 + MiniMap sunk 对齐 ✅** → **Controls 面板密度（22px + surface chrome）✅** → **选中光晕统一（表/Frame a18）✅** → **画布工具栏再收（22 / font 11）✅** → **空态面板再收（14/18 pad + CTA 26）✅** → **命令面板密度（440 / 输入 36）✅** → **实体新建弹层密度（宽 400 / 输入 28）✅** → **左树行高密度（22 / font 12）✅** → **CommonTabs/签头密度（tabs ~24，再压不 clip）✅** → **版本列表行密度（pad 4×8 / 标题 13）✅** → **导入/导出弹层密度（`.erd-io-modal` 头脚 22–28）✅** → **普通导出页 ExportCommon 卡片密度（pad 8×10 / 标题 13）✅** → **设置页 chrome 密度（DefaultSetUp / DefaultField + 菜单弹层 `.erd-io-modal`）✅** → **数据库配置页密度（`/databaseConfig` + 菜单「数据源设置」`.erd-io-modal`）✅** → **账号设置 + Home 项目卡密度（22–28 chrome / `.erd-io-modal`）✅** → **个人/最近项目列表行密度（`.project-list-page` 22–28）✅** → **团队项目列表行密度（`/project/group` 同 `.project-list-page`）✅** → **公告列表行密度（`/project/notice` 同 `.project-list-page`）✅** → **分享只读多关系图切换（`diagram-switcher` / ADR-0017）✅** → **分享画布视口铺满（480→stage flex）✅** → **分享只读表清单折叠（底条展开 affordance）✅** → **分享 meta hint/描述密度 ✅** → **分享展开表清单行密度（22–28 / project-list）✅** → **边标签碰撞避让（AABB chip）✅** → **分享失效/空态品牌对齐（AuthBrandShell + ErdEmptyDiagram）✅** → **404/403 AuthBrandShell ✅** → **关系图 SCSS 清 brand 裸 rgba ✅** → **PK/FK/hover 行浅底 color-mix ✅** → **字段行扫读层次（名 500/PK 600 + 类型右对齐）✅** → **关系线默认描边权重/对比（ink900 + 2px）✅** → **表头标题层次（title 14/700 vs chnname 10/400）✅** → **空态 CTA 层次（唯一主钮 + 次链）✅** → **基数 chip 扫读层次（12/600/ink900）✅** → **PK/FK 徽章扫读层次（10/700 + min-width 22）✅** → **画布工具栏/Controls 扫读层次（单块 chrome + 主操作）✅** → **表节点密表再压（表头 pad 6 / 字段 minH 20 / FIELD_ROW_H 24）✅** → **Frame 标题扫读（label 12/700 vs meta muted，chrome 22）✅** → **画布工具栏「新建表」一键上图（建模回路）✅** → **连线失败可见反馈（重复/非法锚点 toast）✅** → **画布工具栏「新建表」一键上图（建模回路）✅** → **连线失败可见反馈（重复/非法锚点 toast）✅** → **字段行 ✎ 内联编辑 + 空名 toast（建模回路）✅** → **字段 Tab 跳行 + 类型即时 save-status（建模回路）✅** → **末行 Tab 新建字段（建模回路）✅** → **编辑态 PK 勾选即时 save-status（建模回路）✅** → **编辑态非空勾选即时 save-status（建模回路）✅** → **编辑态自增勾选即时 save-status（建模回路）✅** → **编辑态隐藏 relationNoShow 即时 save-status + 表底恢复（建模回路）✅** → **编辑态 Escape 取消改名（拦 blur，建模回路）✅** → **Delete/Backspace 删字段二次确认（建模回路）✅** → **字段 chnname 内联 + Tab 入中文名（建模回路）✅** → **表头实体 chnname 内联（建模回路）✅** → **字段 defaultValue 内联 + Tab 入默认值（建模回路）✅** → **画布打开表设计「索引」签（建模回路）✅** → **画布对称打开「字段」签（建模回路）✅** → **索引签空态 CTA「添加第一个索引」（建模回路）✅** → **画布打开「元数据应用」签（建模回路）✅** → **索引签再加一行 CTA（建模回路）✅** → **左树删除模型/关系图二次确认 ✅** → **左树重命名关系图接通 ✅** → **左树新建关系图路径 E2E ✅** → **左树「关系」文件夹 + 直建图 ✅** → **左树「编辑表」开表设计字段签（重命名另项）✅** → **字段级 unique 说明（索引唯一 CTA + 画布 UK）✅** → **元数据应用修改/删除字段签对齐模板 ✅** → **左树搜索 × 清过滤 + 无匹配空态 ✅** → **命令面板搜表定位/高亮 ✅** → **设计器 Skip + 焦点环（树/签·画布）✅** → **表设计 Cmd/Ctrl+1/2/3/4 签页直切✅** → **画布字段浏览器 Tab 环✅** → **画布 chrome Tab 序（Controls/工具栏；MiniMap 出序）✅** → **左树键盘漫游✅** → **画布节点级 Tab✅** → **分享壳键盘✅** → **登录壳键盘✅** → **注册壳键盘✅** → **落地页键盘打磨✅** → **404/403 壳键盘✅** → **分享失效门键盘✅** → **`/compare` 竞品对照页键盘✅** → **Home 工作台键盘✅** → **GroupLayout 壳键盘✅** → **项目列表行键盘✅** → **账号设置壳键盘✅** → **项目动作弹窗键盘✅** → **导入/导出弹层键盘（DBML）✅** → **版本动作弹窗键盘（新增/编辑/删除/回滚）✅** → **版本对比/详情 diff 键盘✅** → **同步配置/重建版本弹层键盘✅** → **初始化基线弹层键盘✅** → **Cmd+K 命令面板键盘 polish✅** → **签头密度再压（tabs ~24 / 不 clip）✅** → **左树工具条/次密距（24 / pad 4）✅** → **版本列表二次密度/碎色（工具条 24 + token）✅** → **版本工单/审批列表密度（标题栏 ~24 / 行 pad 4×8）✅** → **设计器次屏表密度（JExcel + 版本 diff ~24）✅** → **元数据应用子签 / CodeTab chrome（~24 / 不 clip）✅** → **表设计内签栏显式 ~24（字段/索引/元数据/触发器）✅** → **右键/树操作菜单密度（`.erd-dense-menu` ~28）✅** → **空表设计/空表字段引导（字段签 + 画布 CTA）✅** → **签体内容次密距（pad 6/4 + hint/tip ~24）✅** → **设计器 Empty / 次屏空态次密距（禁 marginTop:100 + 压 marginXL）✅** → **欢迎空态次密距（pad 32×24 / hero 176）✅** → **AuthBrandShell 次密距（32×28 / 表单 pad32）✅** → **LandingChrome / `/compare` 次密距（section 2.75 / 对照行 0.5）✅** → **版本同步结果弹层键盘** ✅ → **Oracle 逆向注释保真** ✅ → **触发器逆向（P0 四库）** ✅ → **FK 约束名+ON DELETE/UPDATE** ✅ → **分享表清单分页** ✅ → **表设计触发器签（list/DDL/CRUD）** ✅ → **DBML Enum ↔ dataTypeDomains** ✅ → **DBML 表达式索引 ↔ `indexs[].fields[]`** ✅ → **逆向 PG/MySQL 表达式索引** ✅ → **索引签字段/表达式可编辑** ✅ → **逆向 Oracle/SQL Server 函数·计算列索引** ✅ → **逆向 PG/SQL Server 部分·过滤索引谓词** ✅ → **DDL/DBML `filter` 回写** ✅ → **DDL `triggers[]` 回写** ✅ → ~~字段 type 下拉区分枚举~~✅；~~库方言 apply 可视化编辑~~✅；~~画布边 ON DELETE/UPDATE 可编辑~~✅；~~DDL FK 回写~~✅；~~画布底栏打开触发器~~✅；~~触发器签可编辑已有行~~✅；~~画布边约束名可编辑~~✅；**自动轨暂停** → Human next 见上「Vision 自动轨暂停点」
- 逐页抬水位：每轮迭代顺带提升所在页密度与反馈，禁止全站大改版
- Home / 模型页重设计简报：[ui-home-model-redesign.md](./ui-home-model-redesign.md) ✅（2026-08-02；决策：Home 走工作台式亮色系统，落地页保留深色门面；**S1–S3 ✅**：tokens + hero CTA + 项目网格 IA 收口 / 去快速操作墙 / 公告新鲜度 / Menu brand）
- **精密工具站**（[ADR-0026](./adr/0026-precision-tooling-visual-language.md)）✅（2026-08-09）：营销壳 void+网格；工作台浅色 hairline/玻璃顶栏/mono chip；画布节点皮肤后置；**≠** ADR-0010 全局暗色
- **产品 Chrome IA**（[ADR-0027](./adr/0027-designer-chrome-ia.md)）✅（2026-08-09）：全站 Theme；状态仪器盘；项目浏览单一脸；表设计单行 chrome；左树新建去重
- **全站布局重设计总纲**：[ui-layout-redesign.md](./ui-layout-redesign.md)（2026-08-02 v2 重估：能力暴露优先于表现层；分波 W1 设计器壳 ✅ → **W2 能力暴露+空壳清除**（切片 1–4 ✅：分享吊销、Home 死码/实验页删除、设计器 chrome 左树去重+sider 320+tabs 40+flex、设计器内 `calc(100vh)` 清零）→ **W3 版本域收口** ✅（切片 1 ✅ 跨版本 diff 导出；切片 2 ✅ version ProList→antd List + 空态 CTA；切片 3 ✅ 审批/工单入口理顺；2026-08-02 顶栏右「我的工单/待审批/通知」可发现入口 + 项目菜单导出串台修复）→ **W4** 项目列表/数据源平移（切片 1–15 ✅；切片 15 ✅ 末 7 文件清零 + 依赖移除）→ **W5** 登录/分享/404 打磨（切片 1–4 ✅：404/403、分享失效态、share 顶栏 64px、登录/注册品牌壳）+ **落地页 token 同源 ✅**；能力对照见 [product-capability-map.md](./product-capability-map.md)）
- **Pro Strangler**（[ADR-0014](./adr/0014-drop-or-strangle-ant-pro.md) ✅ 已落地 · B）：`@ant-design/pro-components` / `umi-presets-pro` 已从 `package.json` 移除；`rg …pro-components` = 0；自研 Home/Group/Design Layout + antd 表单/表格承接

### 开放（Openness）✅ — API/MCP 见 ADR-0013

- ~~projectJSON 公开 schema 文档化（schema-as-code，`data-format.md` 升级为对外规范）~~✅（2026-08-02：[`data-format.md`](./data-format.md) + [`schema/projectjson.schema.json`](../schema/projectjson.schema.json) + `scripts/validate-projectjson.mjs`；解锁 ADR-0013 触发条件 #3）
- ~~公开 API / MCP（[ADR-0013](./adr/0013-public-api-mcp.md)）~~✅（2026-08-04 MVP）：
  - ~~拍板鉴权/scope/限流默认 + PAT 哈希存储 + `/api/v1/me` + 限流骨架~~✅（切片 1，2026-08-04）
  - ~~`GET /api/v1/projects[+/{id}]`（成员 ACL + projectJSON 密钥清洗）~~✅（切片 2，2026-08-04）
  - ~~`GET /api/v1/projects/{id}/versions[+/{versionId}]`（`versions:read` + 成员；详情清 `profile.dbs`）~~✅（切片 3，2026-08-04）
  - ~~MCP server 只读骨架（`mcp/`：stdio + Streamable HTTP → 上列 REST）~~✅（切片 4，2026-08-04）
  - ~~写 scope + `POST …/versions` + MCP `create_version`~~✅（切片 5，2026-08-04）
  - ~~`projects:write` REST：`PATCH /api/v1/projects/{id}` + `PUT …/projectJSON`~~✅（2026-08-04）
  - ~~集群限流 Redis（Redisson；fail-closed）~~✅（2026-08-04）
  - ~~MCP `projects:write` tools：`update_project` + `put_project_json`~~✅（2026-08-04）
  - ~~OAuth 切片 A：client 注册/列表/吊销 + `client_credentials` → `erd_oat_` 调 `/api/v1`~~✅（2026-08-04）
  - ~~OAuth 切片 B：Authorization Code + PKCE S256（public/confidential；authorize + token）~~✅（2026-08-04）
  - ~~OAuth client 管理 UI：`/account/settings?selectKey=oauthClients`（列表/注册/secret 一次揭示/吊销）~~✅（2026-08-04）
  - ~~PAT 管理 UI：`/account/settings?selectKey=personalAccessTokens`（列表/铸造/scopes/明文一次揭示/吊销）~~✅（2026-08-04）
  - ~~同意页：`/oauth/authorize` AuthBrandShell + Allow/Deny；GET 预览不签发；仅 Allow → `erd_ac_`~~✅（2026-08-04）
  - ~~OAuth refresh_token：`erd_ort_`（仅 auth code）；轮换 + 复用整族吊销；`POST /oauth/revoke`~~✅（2026-08-04）
  - ~~OIDC 薄 MVP：discovery / HS256 `id_token`（`ERD_OIDC_HMAC`）/ userinfo / `openid` scope~~✅（2026-08-04）
  - ~~OIDC `nonce` + `at_hash`（authorize 绑定；refresh 省略 nonce）~~✅（2026-08-04）
  - ~~OIDC RS256 + 真 JWKS（废 HMAC；`/.well-known/jwks.json`）~~✅（2026-08-04）
  - ~~第三方 IdP 联邦（GitHub OAuth + Google OIDC + 微信开放平台扫码）~~✅（[ADR-0021](./adr/0021-idp-federation-google-wechat.md)；会话 JWT；与 PAT/OAT 解耦）
- 导入/导出互通：DBML / dbdiagram 格式互转，降低迁移成本；插件机制后置 — ✅（2026-08-02：导入+导出 Table/fields/FK/note↔chnname + Indexes↔`indexs` + `default`↔`defaultValue` 闭环；**Enum↔`dataTypeDomains.datatype` kind=enum ✅（2026-08-03）**；**表达式索引↔`indexs[].fields[]` 原样字符串 ✅（2026-08-03）**；**trigger 文档延期**：`@dbml/core` 无块、`Note` 禁塞）

### 安全（Security）📋

- 分享 token：只读分享（ADR-0007）；公开 API PAT scope/吊销/过期见 ADR-0013（切片 1：哈希存储 + 吊销 + 可选过期）
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
- ~~`data_sources.username`/`password` 明文入库（R-DATA-06）~~✅（[ADR-0024](./adr/0024-datasource-credential-encryption.md)：`DataSourceCredentialCipher` AES-256-GCM 落库加密，`ERD_DB_CONFIG_SECRET` 密钥，存量明文渐进迁移；见 [security-model.md](./security-model.md#r-data-06)）
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
| P4：社区与生态 | 让项目长大 | ~~文档站骨架 / Pages / 本地搜索~~✅；~~用户文档站精致完备（intro + 七篇 guide 加厚 + 导航/Footer/搜索收口）~~✅；~~文档站再打磨（带入式手册 + 百度统计 + zh/en i18n）~~✅；~~托管拓扑 1–3：CF Pages 文档+静态 demo、GHCR release、compose 拉镜像（ADR-0018）~~✅；~~good-first-issue 运营清单（`docs/community.md` + Issue 模板）~~✅；~~Issue 草稿 + `seed-good-first-issues.sh`~~✅；~~CHANGELOG Unreleased 按日折叠~~✅；~~草稿 `33` 删字段 a11y~~✅；~~草稿 `34` Controls 中文 aria~~✅；~~草稿 `35` MiniMap 中文 aria~~✅；~~草稿 `36` 画布工具栏 aria~~✅；~~草稿 `37` SaveStatus aria-live~~✅；~~草稿 `38` CollabPresence aria-live~~✅；~~草稿 `39` 命令面板 listbox~~✅；草稿池暂空（a11y 微切片停）；正式仓就绪后 `seed-good-first-issues.sh` 投放 3–8 个📋；发版节奏固化✅；~~官方 demo 运行时选型 Railway-only（ADR-0019）+ deployment 步骤~~✅；Dashboard 实际拉起 Railway + 填 `DEMO_API_URL`📋 | 🚧 |

## 完整用户旅程（我们关注用户的每一步）

首次接触（落地页/README）→ 试用（在线 demo）→ 注册登录 → 新手激活（示例项目）→ 日常创作（设计器）→ 团队协作（邀请/权限/通知）→ 分享传播（只读链接/导出）→ 留存回访（动态/What's New）→ 自部署运维（升级/备份）→ 社区共建。

每个阶段的断点都有对应阶段承接，详见各阶段交付物。

## 版本政策

- 语义化版本（semver）；破坏性变更提前一个 minor 版本公告，并附迁移指南
- 数据库 schema 变更一律走 Flyway 迁移脚本，自部署用户可平滑升级
- 每双周一个 release，发布笔记附改动前后对比

## 如何影响路线图

- 提需求：开 Issue 并说明它服务哪类用户价值（见 [vision.md](./vision.md)）
- 参与讨论：在 [Issues](https://github.com/erdonline/erdonline/issues) 回复或新建讨论帖
- 直接贡献：认领 `good first issue`，阅读仓库根目录 [CONTRIBUTING.md](https://github.com/erdonline/erdonline/blob/main/CONTRIBUTING.md)
