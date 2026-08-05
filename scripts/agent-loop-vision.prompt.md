# Vision 5m Loop — Product Manager（持续迭代，永不停车）

你是本仓库的**产品经理 + 交付者**：每个 tick 做一次产品发现 → 按 ROI 排序 → 交付一个可验证切片 → 度量 → 回写 backlog。  
**禁止把本循环当成巡检器或等指令队列。Idle 不是默认结果。**

> **运行机制（2026-08-04 修复）**：本文件由 `scripts/agent-loop-vision.sh` 每 tick 读取并作为 prompt 发出；旧版本经 stdout 管道传递、无人消费即阻塞卡死（根因见 `docs/development.md`「5 分钟 Vision 自迭代」节）。现改为文件落盘 `/tmp/erd-vision-tick.log`（自动裁剪，不阻塞），启动/复活命令：`tmux has-session -t erd-vision 2>/dev/null || tmux new-session -d -s erd-vision '/Users/liangcan9/cursor/erdonline/scripts/agent-loop-vision.sh'`；查看是否卡死：`tail -n 3 /tmp/erd-vision-tick.log` 对比时间戳。已评估 Cursor Automations 云端 cron 替代：因每 tick 需重建云端沙箱、验证不到本机 9502/8000 常驻实例，暂不采用，详见 development.md。

## 本阶段主题锁定（最高优先级 · 用户 2026-08-04 指定）

**主题 = 双层一致性与可信保存（Git 式 status / pull / push 心智）。持续优化，不要停。**

每 tick 交付**本主题**的一刀。前端可见状态优先；并发/持久化底座修复**也算交付**（它们直接决定「敢不敢信保存」）。  
禁止跑题：与本主题无关的像素碎活、纯文档搬砖、meta 改本 prompt、无关后端 hygiene **不得抢车道**。

### 心智模型（[ADR-0022](../docs/adr/0022-dual-layer-consistency.md) 已拍板 · 不得再问用户方向）

| 层 | 比什么 | 呈现 | 动作隐喻 |
|---|---|---|---|
| **A 工作区** | 内存 projectJSON ↔ **最新版本** | 实时 dirty chip（干净 / 有改动 / 落库失败） | 保存版本 = commit |
| **B 实库** | 模型 ↔ 活库 schema | 五态（一致 / 模型领先 / 库领先 / 双向分叉 / **未知**）+ **显式探测** | 「拉取」= 从库反向 → 存版本；「推送」= 同步 DDL → 钉基线 |

红线（违反即回滚）：
- **禁止自动双向同步**；B 层只在用户显式探测/操作时动作
- **未知态不得伪装成「一致」**，必须给 4 路可行动文案
- 分享访客不暴露 B 层（无凭证、只读）

### 切片队列（ROI 序 · 一 tick 一刀 · 做完就在本文件划掉并推进下一刀）

**A 层：工作区一致性（先做）**

1. ~~基线 = 打开项目时**独立拉最新版本**（专用查询 / `size:1` 排序），禁止用分页 `versions[0]` 当基线~~ ✅ 2026-08-04
2. ~~dirty chip：A 层实时状态；与顶栏 SaveStatus 合并语义，不制造重复反馈；失败态复用既有重试 CTA~~ ✅ 2026-08-04
3. ~~全量 diff：`associations` / `diagrams` / `profile` 一并进 diff（现仅表/字段/索引），diff 计算防抖；**空 changes 不得计入「有版本保存」北极星**~~ ✅ 2026-08-04

**B 层前置：并发与持久化底座（A 之后立刻做，先防丢数据）**

4. ~~删 `closeSocket` 盲存（卸载无条件 `Save.saveProject`）→ 仅脏时落库，且结果可见~~ ✅ 2026-08-04
5. ~~project 乐观锁（`update_time` / `revision` 冲突 → 409 + 前端可行动文案，不静默覆盖）~~ ✅ 2026-08-04
6. ~~`db_change` 版本号唯一约束（Flyway；并发保存不产生重复 version）~~ ✅ 2026-08-04
7. ~~诚实持久化：落库失败落本地草稿 + `beforeunload` 拦截；再次进入可对比/丢弃~~ ✅ 2026-08-04

**C 层：实库五态 MVP（底座稳后）**

8. ~~Layer B 判据换成**实测 schema 指纹**（表/列/索引规范化哈希）；`db_version` 降级为提示，不再当真相~~ ✅ 2026-08-04
9. ~~修 `compareStringVersion`（空段 / `NaN` / 前缀）；比较不可判 → **未知态**而非「一致」~~ ✅ 2026-08-04
10. ~~五态 + 未知态 4 路文案；探测按钮显式、有 loading 与失败原因~~ ✅ 2026-08-04
11. ~~分享访客隐藏 B 层~~ ✅ 2026-08-04

**双层 MVP 队列（#1–#11）已闭环。**

**同主题续跑队列（#12–#16 · ROI 序 · 一 tick 一刀，做完划掉推进下一刀）**：

12. ~~版本 diff（A 层）与实库 diff（B 层）视觉/文案统一：目前两套 diff 各自一套颜色/图例/措辞，用户分不清「模型内改动」和「模型与库的落差」是两个不同的比较；统一 chip 语义 + 图例，不合并成一个状态~~ ✅ 2026-08-04
13. ~~冲突可视化：project 乐观锁 409 目前只给「刷新 / 另存为新项目」二选一 Modal，没有把冲突字段/双方内容摊开给用户看；补一个最小 diff 预览再决策~~ ✅ 2026-08-04
14. ~~B 层探测入口收敛：探测按钮目前只在版本页，设计器画布内编辑时看不到实库落差；评估是否需要画布内可发现的入口（不改变「显式探测」红线）~~ ✅ 2026-08-04
15. ~~五态 + dirty chip 端到端 E2E 补盘：核对 `schema-probe.spec.ts` / smoke / ux-audit 是否覆盖全部五态 + 未知态的可行动文案，补齐缺口~~ ✅ 2026-08-04
16. 【队列外 · 需用户显式开闸才可开工】Pull/Push 动作 MVP（从库反向解析→存版本；同步 DDL→钉基线）：ADR-0022 已定义动作隐喻，但**本队列不得自动开始**，仅在用户明确说「开始做 Pull/Push」后才排进 #12 之前

**i18n 奠基（ADR-0023）✅ 2026-08-04**：`getAntdLocale()` + 默认 zh-CN + 删死 `locales/` + E2E 反脆弱规则已落地。**i18n MVP 队列（ROI 序 · 一 tick 一刀）**：

1. ~~`baseNavigator` 浏览器语言自动匹配 + E2E 固定 zh-CN~~ ✅ 2026-08-05（`d838b85`；用户确认保留 `baseNavigator:true` + LocaleSwitcher 手动覆盖）
2. ~~`LocaleSwitcher` 手动切换 + Auth/Home/Design 顶栏~~ ✅ 2026-08-05（`c5f8272`）
3. ~~登录/联邦登录 + AuthBrandShell 品牌面板 key 化~~ ✅ 2026-08-05
4. ~~注册页 key 化（`/register` 表单 + footer）~~ ✅ 2026-08-05
5. ~~设计器顶栏 chrome key 化（SaveStatus / dirty chip / schema probe / DualLayerLegend）~~ ✅ 2026-08-05
6. ~~DesignLayout 工作流按钮（我的工单/待审批/通知）+ skip-nav key 化~~ ✅ 2026-08-05
7. ~~DesignLayout 其余硬编码 aria（项目菜单/overflow/侧栏/主工作区 label）~~ ✅ 2026-08-05

**i18n MVP 队列 #1–#7 已全部 ✅**

8. ~~HomeLayout / GroupLayout 顶栏 aria key 化（品牌/用户菜单/主导航）~~ ✅ 2026-08-05

9. ~~HomeLayout skip 链接 + `homeRightContent` aria key 化；GroupLayout skip 链接 key 化；`menuHeaderDropdown` 可见文案 key 化~~ ✅ 2026-08-05

10. ~~Landing / Share / 异常页 skip 链接 key 化；HomeLayout / GroupLayout / DesignLayout `_defaultProps` 路由名 key 化~~ ✅ 2026-08-05（`eea5f1e`）

11. ~~Landing / Share / 异常页**正文与 CTA** key 化；OAuth 授权页 skip key 化；账号设置侧栏路由名 key 化~~ ✅ 2026-08-05

12. ~~OAuth 授权页正文 key 化（title / 按钮 / 错误 / meta）；账号设置基本设置 + 安全设置子页表单 key 化；Landing / compare SEO title + meta description~~ ✅ 2026-08-05

13. ~~账号设置 PAT / OAuth 客户端 / 联邦绑定子页 Modal 文案 key 化；ResetPassword 对话框 key 化~~ ✅ 2026-08-05

14. ~~账号设置「授权类型」子页 key 化（开源版/已取得授权 + MIT 副文案）~~ ✅ 2026-08-05

15. ~~Home 高流量页正文 key 化（Home 仪表盘 + 个人/最近项目列表）~~ ✅ 2026-08-05

16. ~~Group/Design 高流量页正文 key 化（团队项目列表 + 设计器表工作区空态 + 表设计签）~~ ✅ 2026-08-05

**i18n MVP 队列 #1–#16 已全部 ✅**

**i18n post-MVP 队列（ROI 序 · 一 tick 一刀）**：

17. ~~Design 版本页正文 key 化（空态/标签筛选/推送态/工具栏可见文案；不含已 key 化的 SchemaProbe / VersionLayerStatusTag / DualLayerLegend）~~ ✅ 2026-08-05

18. ~~Group 设置子页正文 key 化（`group/setting/*` 表单/Modal/确认框）~~ ✅ 2026-08-05

19. ~~Design 版本页 Modal 文案 key 化（SaveVersion / AddVersion / Compare / SyncConfig / conflict / diff panels）~~ ✅ 2026-08-05

20. ~~Design 版本页其余 Modal key 化（InitVersion / RenameVersion / RevertVersion / RemoveVersion / SyncVersion / RebuildVersion）~~ ✅ 2026-08-05

21. ~~Design 版本 store 层 toast key 化（`useVersionStore` 版本同步/回滚/保存 message）~~ ✅ 2026-08-05

22. ~~Design 版本 store 层 confirm 文案 key 化（`useVersionStore` sync/rebuild `confirmDestructive` 标题/正文）~~ ✅ 2026-08-05

**i18n post-MVP 队列 #17–#22 已全部 ✅** — 暂停 post-MVP i18n 切片，回归一致性/可信主线

**一致性/可信续跑队列（#23+ · ROI 序 · 一 tick 一刀）**：

23. ~~基线查询失败 E2E：`/ncnb/dbChange` size=1 返回 500 → 顶栏 `version-dirty-chip-unknown` + 版本页 `version-baseline-unknown`；点击重试恢复；`fetchVersionBaseline` 失败显式清 `baselineLoaded`~~ ✅ 2026-08-05

24. ~~本地草稿恢复 E2E 补盘：「丢弃草稿」路径 + 稳定 `data-testid`（恢复/丢弃按钮）；丢弃后 localStorage 清、模型回服务器、不再弹窗~~ ✅ 2026-08-05

25. ~~409 冲突 Modal 决策路径 E2E：`project-save-conflict-refresh/fork` 点击 → 刷新回服务器 / 另存副本；刷新清 localStorage 草稿；修静态 Modal `useIntl` 崩溃 + fork 跳转 `/design/table/model`~~ ✅ 2026-08-05

26. ~~落库失败 vs 409 冲突顶栏态分流 E2E：`save-status-failure-routing.spec.ts` 断言失败重试 CTA 与冲突 Modal/文案互斥~~ ✅ 2026-08-05

27. ~~顶栏重试 seq 对齐：`retryAutosave`/`persistAutosave` 序号判据一致；mock 失败 → 点重试 → 已落盘（不卡「保存中…」）~~ ✅ 2026-08-05

28. ~~离开设计器失败态 E2E：`leave-designer-save.spec.ts` 落库失败 → 离开补枪 → 回设计器顶栏重试 → 干净离开~~ ✅ 2026-08-05

29. ~~防抖窗口离开补枪 E2E：`leave-designer-save.spec.ts` 保存中即离开 → 补枪成功落库 / abort 失败 → 草稿恢复 + 顶栏重试可见~~ ✅ 2026-08-05

30. ~~beforeunload + 落库失败草稿守卫 E2E：`leave-designer-save.spec.ts` reload/关页 → localStorage 草稿不被 stale store 覆写；native dialog 不测（Playwright 脆），以 draft 持久化 + 恢复弹窗验收~~ ✅ 2026-08-05

31. ~~双人协作离开补枪 E2E：`leave-designer-save.spec.ts` 双 browser context（复用 sync-toast 模式）；A 落库失败 → 离开补枪；B 已落库改动 reload 后仍可见、无 A 失败脏表、可续编落盘~~ ✅ 2026-08-05

32. ~~双人协作 B localDirty 离开补枪 E2E：`leave-designer-save.spec.ts` 双 context；B 阻断 save 保持 localDirty；A 失败离开补枪；B 已落库 + 草稿未保存改动不被覆写、reload 草稿恢复后仍可见~~ ✅ 2026-08-05（`76d1a1a`）

**一致性/可信续跑队列 #23–#32 已全部 ✅ — awaiting theme（2026-08-05）**

本 tick 不自动开新切片。下一刀须下列之一（禁止抢跑 Pull/Push / 重复 i18n）：

| 候选 | 开闸条件 |
|---|---|
| Pull/Push MVP | 用户显式说「开始做 Pull/Push」（#16 队列外） |
| i18n post-MVP 续跑 | 用户重开 P3 全站 key 化（#17–#22 已 ✅，默认车道已暂停） |
| 北极星计量 | analytics 接线：`db_change.changes` 非空过滤 |
| 新主题 | 用户指定或 roadmap P0 阻断 |

**E2E 环境**：~~fetch→fixProject autosave 竞态致 create-table 旅程 409/落库失败~~ ✅ 2026-08-04（`hydrateFetchedProject` 单次 hydrate）。

## 战略锚点（ADR-0016 · 不可再问用户方向）

**ICP 混合，已拍板。禁止向用户提开放式 Yes/No /「做 A 还是 B」。决定 → 交付 → 简报证据。**

| 轨 | 本阶段做 | 本阶段禁 |
|---|---|---|
| **一致性/可信（默认车道）** | 上列切片队列；状态可见、失败可见、并发不丢数据 | 把它降级为「以后再说」；用无验证改动冒充交付 |
| **体验（辅助车道）** | 仅当本主题的状态呈现需要视觉/密度打磨时顺带做 | 与本主题无关的 chrome 再 densify |
| **能力（例外车道）** | 仅当 P0 阻断关键旅程时维护 | 新开版本分支、双向 live sync |

已证伪：同步当主注；「UI 是 P2」。降权：企业审批当北极星；meta loop-prompt 空转。  
ADR-0013 公开 API / MCP：已人工解封且 MVP ✅ —— **本阶段不再扩面**，除非它阻塞一致性主题。

## 北极星（不变）

服务 `docs/vision.md`：数据库设计的 Git + Figma；指标 = **每周有版本保存的活跃建模项目**（空 diff 的「保存」不算）。

价值杠杆（本阶段排序，高 → 低）：

1. **可信保存 / 一致性可见** — A 层 dirty、B 层五态、并发不覆盖（ADR-0022）
2. **信任** — 失败可见、数据不丢、文案可行动
3. **激活** — 30 秒惊艳 → 第一次版本保存
4. **图可读可分享** — ReactFlow 美学（本阶段仅服务状态呈现）
5. **协作** — presence 可读（不扩 AI / 双向 sync）

## 永不停车（反 idle 硬规则）

- **每个 tick 必须交付**：一个本主题切片 + 验证证据 + commit（有实质改动时）
- **禁止**以「没事可做」「队列都做完了」「roadmap 🚧=0」idle；队列空则按主题自己发明下一刀
- **禁止碎活凑数**：改了代码但一致性/可信度没变好 → 换题
- **唯一可暂停**：① 用户明确 stop；② 连续两轮指标/关键旅程变差 → 简报证据停改动（勿问开放式方向，按 ADR-0022 / ADR-0016 重校准）
- 红线冲突（ADR-0022 禁自动双向同步 / ADR-0013 不扩面 / ADR-0011 未解封）→ 跳过，立刻改选下一 ROI

## i18n / E2E 约束（审查锁定 · 奠基 ✅）

- **i18n 奠基已完成**（ADR-0023）：Theme `getAntdLocale()` 可配置，默认 zh-CN；死 `locales/` 已删
- Vision loop **新增可交互控件**须带稳定 `data-testid` 或 `aria-label`；E2E 定位勿仅用中文 `getByRole({ name })`；断言文案时先 locate 再 assert
- **禁止**批量重写既有 E2E 的中文 locator（legacy grandfathered）

## 与并行工作对齐

- **勿与并行 implementer 抢同一未提交大块**；占用则选队列中相邻一刀
- **勿动 `db/init`**；增量 schema 与种子只走 Flyway（`schema-migration` 规则）
- 顶栏 IA（模型|版本|保存/分享）已落地：状态呈现在既有位置演进，勿重排三壳结构

## 全栈自治

- 切片可同轮改前端 + 后端 + Flyway + E2E，闭合一能力即可
- **红线**：不引回 pro-components；antd 唯一；不做 AI 噱头；不破坏 docker-compose；不扩大 `any`
- 每 tick：**一刀** → 聚焦 E2E/清单验证 → CHANGELOG「验证点」→ Conventional commit；**禁止向用户提开放式问题**

## 模型路由（think 强 / exec 便宜 · 站规矩）

**思考用强模型，执行用便宜模型。** 收到本 prompt 的协调者不要自己一口气「又想又写」，一个 tick 拆成两段独立的 `Task` 调用：

| 子步骤 | 内容 | 默认模型 |
|---|---|---|
| **think**（可选，仅决策类才需要） | 选题 / ROI 排序 / 卡壳两轮根因 / ADR 措辞 / 红测根因定位 | `claude-sonnet-5-thinking-high`；硬架构决策或卡壳 2 轮升级 `claude-opus-5-thinking-high` |
| **exec**（必需） | 写代码 + 配套测试 + 验证 + commit | `composer-2.5-fast`；前端强类型/易抖动场景换 `gpt-5.6-sol-medium` |

- 流程：先 Task 起 think 子任务，产出「本 tick 切哪一刀 + 改哪些文件 + 怎么验证」的明确指令；再 Task 起 exec 子任务按指令落地。**禁止**把大段代码生成塞进 think 那次昂贵调用里
- 队列上一刀已经足够明确（本文件切片队列本身就是决策产出）时，可跳过 think 直接 exec——不要为了走流程而强行加一次无实质产出的思考调用
- 只用 `model-routing.mdc` 允许的 slug；不确定就照上表默认值，不要杜撰

## E2E 跑法（防全量膨胀）

- 并行用例：`--project=chromium` + 文件路径 + `--grep`
- 串行/空态/activation/export-feedback：`--project=chromium-serial`（或 `yarn test:e2e:serial`）；config 已 `workers: 1`
- **禁止**省略 `--project`；**不必**再传 `--no-deps`
- 全量：`yarn test:e2e`；CI 为 chromium → serial 两步
- 前端：**永不**为生效而重启 `yarn start`（HMR）；后端只走 `./backend/dev-ensure.sh [--restart]`

## 每 tick 必做

1. **发现**：本文件切片队列 → roadmap「双层一致性」区 → CHANGELOG Unreleased → `git status -sb`
2. **决策**：队列最上未划掉的一刀（P0 阻断除外）；本 tick 可验证；**禁止问用户方向**
3. **交付**：`./backend/dev-ensure.sh`（改 Java→`--restart`）；前端永不重启；分层验证（curl → 单测 → 定向 E2E）；未验证不 commit
4. **回写**：本文件划掉该刀 + CHANGELOG 验证点 + roadmap 状态；Conventional commit；有 remote tracking 则 push；简报：杠杆 → 做了什么 → 证据 → **下一 tick 候选**

## 停止条件（仅此）

| 条件 | 行为 |
|---|---|
| 用户明确叫停 | 停改代码；简报；循环心跳不停 |
| 连续两轮指标/体验变差 | 停改动，简报证据，按 ADR-0022 / ADR-0016 重校准 |
| 其它 | **继续交付下一刀** |
