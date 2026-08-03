# 全站布局重设计总纲

> **v2 重估（2026-08-02）**：对照 vision / ADR-0012 / 后端能力清单复核后，**分波顺序已改**（见「分波」节）。核心修正：能力暴露与空壳清除优先于表现层密度抛光；Pro 清零从「波次驱动指标」降为「收尾卫生」。能力对照详表见 [product-capability-map.md](./product-capability-map.md)。

> 读者：执行 UI 切片的实现者（Auto）。回答一个问题：**所有现存页面**的布局如何统一抬到「一流产品感」，以及按什么顺序做。
> 约束：antd 5 + umi（ADR-0005 / ADR-0014）；Pro Strangler 只摘不加深；视觉 tokens 唯一事实源 `frontend/src/theme/tokens.ts` + `theme/css-vars.less`（见 [ui-home-model-redesign.md](./ui-home-model-redesign.md) §视觉方向，本文不重复定义色板）；落地页深色品牌门面不动；Home 为亮色工作台。
> 关系：本文是**全站总纲**；Home/模型页的区块级 IA 细节仍以 `ui-home-model-redesign.md` 为准，本文只引用不重复。

## 一套系统，两种曝光

| 世界 | 页面 | 视觉 |
|---|---|---|
| 门面（深色品牌） | 落地页 `/`、登录/注册 | Syne/IBM Plex 字族 + 深色构图，品牌优先 |
| 工作台（亮色系统） | Home、项目列表、设计器 chrome、版本/设置/账号、数据源、分享、404 | tokens 亮色系统，antd Layout/Table/Form 为骨架 |

跨世界的桥：登录/注册页左半用落地页深色品牌面板、右半白色表单——一次深色→亮色的过渡，把「门面」与「工作台」缝在一屏里。

## 布局模式目录（全站只允许这三种壳）

1. **品牌壳（Brand Shell）**：无导航 chrome，内容居中/分栏。用于落地页、登录/注册、404/403。
2. **工作台壳（Workspace Shell）**：顶栏 64px（`--erd-chrome-header-h`；logo + 主导航 + 右侧用户区）+ 内容区 `max-width: 1200px` 居中 + 页脚一行版权。用于 Home、dataModels、project/*、databaseConfig、account/settings。实现 = `HomeLayout` + 共享 `layouts/erd-chrome.less`（GroupLayout 同 chrome；**无全页 Watermark**）。
3. **设计器壳（Designer Shell）**：顶栏 64px（同 chrome）+ 左树 320px + tabs ~24px（`--erd-tabs-h`，原 40→28→24，ADR-0016 密度）+ flex 画布。用于 `/design/*`（含 version / import / export / setting 标签页）。实现 = `DesignLayout`（antd Layout，W1 已摘 Pro；版本号在「更多」，无水印 clutter）。

**禁止发明第四种壳**；禁止回到 ProLayout/PageContainer 包裹任何页面（ADR-0014）。

## 密度规范（全站统一）

- 4pt 网格；**工作台壳外井** Home/Group：shell/content 12×16、body 12×16（页内另 8×12）；禁外井 24/20 叠页内双松井；卡片内边距随各 `.` densify 类
- 表格：`size="middle"`，行高由 antd token 控制，禁止自定义行高魔法数
- 表单：`layout="vertical"`（设置类）或弹窗内 `labelCol 6`；标签 13px，必填星号 brand 色
- 列表行高随 `.project-list-page` / 数据源表 densify（~行 pad 4×8）；树行高 22
- 字阶沿用 tokens 简报：12/13/14/16/20/28/40，统计数字一律 ink-900、无彩虹色

## 导航模式

- **全局**：工作台壳顶栏一级导航（首页 / 项目 / 数据源配置 / 账号），当前项 brand 下划线 2px，悬停 ink-900
- **设计器内（单一 chrome）**：左 logo→`/home` + **项目名 ▾**（`aria-label=项目菜单`：全部项目 → **最近项目（最多 5 条，当前项 ✓，点其它项切 `/design/table/model?projectId=`）** → 导入·导出·设置弹层，`items` API + 子弹外置，子菜单 click 且同时只开一个）；中主 tabs **仅 模型 | 版本**（版本含 sider 子导航）；右 SaveStatus / **保存版本** / presence / 分享 / **我的工单·待审批·通知**（`/design/table/version/order|approval`、`/project/notice`）/ `⋯`（公众号·GitHub·版本号）/ 用户。导入·导出·设置页仍可深链，不占顶栏
- **层级收口**：项目列表卡片整卡 `<Link>` 直达设计器；设计器内切项目走 ▾「最近项目」；返回列表走「全部项目」/ logo，不新增「返回」按钮


## 空态规范（每页一句话 + 一个主 CTA）

| 页面 | 空态 |
|---|---|
| Home 项目区 | 插画 + 「新建模型」主按钮 + 「从示例开始」文字链 |
| dataModels（各 tab） | 「还没有项目」+ 「新建项目」主按钮；团队 tab 附「去创建团队」文字链 |
| databaseConfig | 「还没有数据源」+ 「新建数据源」主按钮 |
| 设计器画布 | ER 剪影插画 + 「新建第一张表」主按钮 + 「导入 DBML」次按钮 + 「从数据源逆向」文字链（空态隐藏 MiniMap）；导入后直开关系图并 fitView |
| version 列表 | 「还没有版本」+ 「保存第一个版本」主按钮（与顶栏入口同一动作） |
| share（链接失效） | `AuthBrandShell` + 「打开示例 demo」主按钮 + 「返回首页」；空模块/无模型 → ER 剪影 + 同 CTA |
| 404 / 403 | `AuthBrandShell` + 「打开示例 demo」主按钮 + 「返回首页」（与分享失效门同构） |

统一用品牌壳 / ER 剪影空态；插画沿用现有资产；空态 CTA 必须可达（`getByRole('button', { name })`）。禁裸 antd `Result` 做品牌门。

## 逐页方案

### 落地页 `/`（品牌壳 · 不动构图）

- 保持深色全幅品牌构图与 `landing-hero.jpg`（roadmap P5 已定）
- ✅ **落地页 token 同源**（2026-08-03）：`pages/landing/index.less` 清 `@ink`/`@accent`/`#4aa3c8` 等魔法色 → `--erd-*` + `color-mix`；主 CTA 改 brand 红；三柱点缀 success/brand/warning；字族走 `--erd-font-*`
- 页脚一行版权，链接收进「资源」列

### 登录 / 注册（品牌壳 · W5）

- ✅ **W5 切片 4**（2026-08-03）：`AuthBrandShell` 左 40% 暗色品牌面板（`--erd-ink-900` 渐变 + logo/叙事/`ErdEmptyDiagram` 缩略 +「打开演示」文字链）+ 右 60% 白色 antd `Form`；清 `bg2.png` / `#1677FF` 硬编码；注册页同构；`redirect` 闭环不变

### Home `/home`（工作台壳 · W2，删除优先）

- 区块级 IA 见 `ui-home-model-redesign.md` §Home 信息架构（hero CTA 簇 + 次级水平链 + 全宽 3 列项目网格；无快速操作墙；公告按新鲜度可隐）；W2 **只做删除**：重复统计卡（「项目概览」）、slogan 轮转、`components/Radar/`、`_mock.ts`、未渲染的 `Pie` config 与 `@ant-design/charts` 死 import
- ✅ **S2 Home hero**（2026-08-02）：主 CTA「继续上次建模」直达最近项目画布 + 安静三指标；快捷链改 tokens（非 W5 表现层）
- 网格 hover 升层等密度细节降为顺手活，不单列切片；禁止为 Home 新增额外视觉设计工时（S3 网格另片）
- 验证锚点：`getByRole('button', { name: '继续上次建模' })`、`home-link-*` testId

### 项目列表 dataModels + project/*（工作台壳 · W4）

- 现状：`ProList`（dataModels / project/person / project/recent / project/group）卡片列表，`avatar:'/logo.svg'` 占位，操作按钮堆在 `actions`
- 目标：antd `List` + 行内布局：左 logo 32px + 项目名（16 strong，整行 `<Link>` 直达设计器）+ 类型 Tag（个人 ink / 团队 teal）+ 描述一行截断 + 右「更新于 x 前」+ 悬停显行尾操作（重命名/复制/设置/删除收进 `Dropdown`）
- tab（最近/个人/团队）用 antd `Tabs` 置内容区头部；排序 `Select` 右对齐；分页沿用
- 摘全部 `ProList`；删除项目二次确认沿用（已有）
- project/group 子页（成员/权限/设置）同波顺带：`PageContainer` → 工作台壳内容区 + antd `Card` 分节

### 数据源配置 databaseConfig（工作台壳 · W4）

- 现状：`PageContainer` + `ProTable`，功能已完整（状态 Badge / ping / Drawer 表单 / 批量删）
- 目标：摘 `PageContainer` → 工作台壳；`ProTable` → antd `Table`（columns 平移，工具条改为标题行 + 右侧「新建数据源」主按钮 + 搜索 `Input.Search`）；Drawer 表单内的 `ProForm*` 留到 W4 统一摘
- 列宽用 `Table` 默认自适应，禁止定死 px 总宽

### 设计器 chrome + model（设计器壳 · W1 ✅ / W2 收尾 ✅ / 顶栏 IA ✅）

- W1：DesignLayout 摘 ProLayout → antd Layout（**✅**，见 CHANGELOG 2026-08-02）；顶栏保留 save/share/presence/`homeRightContent`/项目菜单
- ✅ **W2 切片 3**（2026-08-02）：删主区嵌套 `Splitter`/`DataTable`（左树唯一 = sider）；删 sider footer；sider 400→320；`CommonTabs` 栏 40px；设计器壳 `calc(100vh-*)` → flex 填满；树头「新建」(`design-tree-add`) 常显
- ✅ **W2 切片 4**（2026-08-02）：清设计器内残留 `calc(100vh)`——修 `EmptyStateAnimation` 内容态高度链断裂；`QueryTree` / `version` / ReactFlow 改 flex/`height:100%`（度量「W1 后设计器 0」收口）
- ✅ **顶栏 IA 收口**（2026-08-02）：去掉「项目 ▾」与水平五 tab 双导航；项目名 switcher + 模型|版本 + 右区北极星 CTA + `⋯` 溢出（见「导航模式」）
- ✅ **项目 ▾ 最近切换**（2026-08-02）：菜单内「最近项目」最多 5 条（`recentProject`）；当前项 ✓；点其它项切 `/design/table/model?projectId=`；「全部项目」/导入·导出·设置保留

### 版本 version / 导入 import / 导出 export / 设置 setting（设计器壳标签页 · W3/W4）

- 现状：`design/version` 用 `ProList` 深 hack（tokens 简报标记「待摘」）；import/export/setting 的对话框与面板大量 `ProForm*`（ReverseDatabase、ExportDDL、DatabaseSetUp、DefaultSetUp 等）
- 目标：
  - version 列表 → antd `List`/`Table`：版本号（strong）+ tag chips + 描述截断 + 时间 + 行尾操作 Dropdown（重命名/diff/**导出**/回滚/审批）；diff/审批子页同壳
  - **跨版本 diff 导出**为本波新增能力项（非平移）：diff 面板加「导出」动作，复用既有导出管道
  - 所有 `ProForm*` → antd `Form` + `Form.Item`：字段、校验、`onFinish` 平移；弹窗宽度统一 520/720 两档
  - 表单按钮区：主按钮右置 brand，取消左置文字钮；危险操作（重建版本）二次确认沿用
- 原则：**一次只摘一个对话框**，平移不改行为；每摘一个跑该旅程 E2E

### 账号 account/settings（工作台壳 · W4）

- 现状：Pro 设置页骨架（`account/settings` + `components/base` 等 `ProForm`）
- 目标：antd `Tabs`（左侧 vertical：基本资料 / 修改密码）+ `Form layout="vertical"`；头像上传沿用；摘全部 ProForm；删除「地理/电话」等无后端字段（先 grep 确认无引用）
- ✅ **授权类型密度对齐**（2026-08-03）：`identification` 去裸 `Result` / `#DE2910`；密度状态面板（13/22 + `--erd-brand`）；`account-settings-identification`
- ✅ **Export / Home·Group 图标 token**（2026-08-03）：`ExportCommon` 图标 `currentColor`→`--erd-brand`；Home/Group `_defaultProps` 对齐 DesignLayout `erdColors.brand`
- ✅ **dataTypeDomains 树图标 token**（2026-08-03）：`getDataTypeTree` `brandFill = erdColors.brand`；禁裸 `#DE2910`；设置页 `/setting/dataType` 已挂载

### 分享 share（品牌壳-lite · W5）

- 现状：只读画布 + 顶栏， fork 入口已通（P3a ✅）
- ✅ **W5 切片 2**（2026-08-02）：链接失效/无效 token → `Result` 403 +「返回首页」+「打开示例 demo」（与 404/403 同构）
- ✅ **W5 切片 3**（2026-08-03）：成功态顶栏对齐设计器壳——`erd-chrome-header` 64px、logo→落地、项目名 +「只读」Tag、「复制到我的项目」主按钮、未登录「登录/注册」文字链（带 autofork redirect）；去 Card/`Alert` 厚壳，画布为门面主体
- ✅ **W5 切片 4**（2026-08-03）：登录/注册品牌壳——左暗色面板 + 右 Form；见上节
- ✅ **分享失效/空态品牌对齐**（2026-08-03）：失效门改 `AuthBrandShell`（去裸 403 Result）；无模型/无表 → `ShareEmptyState`（`ErdEmptyDiagram` + 主 CTA）；`--erd-*` 同语言
- 分享页是给陌生人的产品门面，保持轻 chrome，不加工作台导航

### 404 / 403（品牌壳 · W5）

- ✅ **W5 切片 1**（2026-08-02）：删 `antd/dist/reset.css`；`Result` 标准 status 图标（删 `no-found.svg` / `no-access.svg`）；extra「返回首页」+「打开示例 demo」→ `/demo`；403 同构
- ✅ **404/403 品牌对齐**（2026-08-03）：改 `AuthBrandShell`（去裸 Result）；主 CTA「打开示例 demo」+「返回首页」；与分享失效门同语言
- ✅ **404/403 壳键盘**（2026-08-03）：Skip「跳到主操作」→ `#exception-main-cta`；focus-visible brand；`/403` 深链可达；与落地/登录同型
- ✅ **分享失效门键盘**（2026-08-03）：同构 Skip→ `#exception-main-cta`（`share-invalid-gate`）；focus-visible brand；`share.spec` 键盘绿
- ✅ **`/compare` 竞品对照页键盘**（2026-08-03）：同壳 Skip→ `#landing-main-cta`；演示→自部署→返回首页；surface focus-visible；`compare.spec` 键盘绿
- ✅ **Home 工作台键盘**（2026-08-03）：Skip「跳到主内容」→ `#home-main-content`；CTA/二级入口/项目卡 Tab 序；brand focus-visible；`home-keyboard.spec` 绿
- ✅ **GroupLayout 壳键盘**（2026-08-03）：Skip「跳到主内容」→ `#group-main-content`；绕开顶栏+侧栏；基本设置表单 Tab 序；brand focus-visible；`group-keyboard.spec` 绿
- ✅ **项目列表行键盘**（2026-08-03）：个人/最近/团队 stretched link 消死卡；Enter 开设计器；Tab 行内动作；brand focus-visible；`project-list-keyboard.spec` 绿
- ✅ **账号设置壳键盘**（2026-08-03）：`/account/settings` Skip「跳到主表单」→ `#account-settings-form`；绕开顶栏+侧栏；邮箱→电话→保存；brand focus-visible；`account-settings-keyboard.spec` 绿
- ✅ **项目动作弹窗键盘**（2026-08-03）：新建/修改首焦字段；删除确认首焦「是」；Esc 归还；Tab trap；`project-action-modals-keyboard.spec` 绿
- ✅ **导入/导出弹层键盘**（2026-08-03）：DBML 导入首焦文本 / 导出首焦模型；Esc 归还空态 CTA/项目菜单；Tab trap；`import-export-keyboard.spec` 绿
- ✅ **版本动作弹窗键盘**（2026-08-03）：新增/编辑首焦版本号（非最新→描述）；删除/回滚 Popconfirm→Modal 首焦「是」；Esc 归还；Tab trap；`version-action-modals-keyboard.spec` 绿
- ✅ **版本对比/详情 diff 弹层键盘**（2026-08-03）：比对首焦「初始版本」；详情首焦「导出变更清单」；Esc 归还；Tab trap；`version-diff-keyboard.spec` 绿
- ✅ **同步配置/重建版本弹层键盘**（2026-08-03）：同步配置首焦「字段增量」；重建版本首焦「版本号」；Esc 归还；Tab trap；`version-sync-rebuild-keyboard.spec` 绿
- ✅ **初始化基线弹层键盘**（2026-08-03）：首焦「版本号」；Esc 归还；Tab trap；`version-init-keyboard.spec` 绿
- ✅ **复刻弹层键盘**（2026-08-03）：首焦「项目名」；Esc 归还；Tab trap；`project-copy-keyboard.spec` 绿
- ✅ **数据源设置弹层键盘**（2026-08-03）：首焦「新增数据源」；Esc 归还「项目菜单」；Tab trap；`database-setup-keyboard.spec` 绿
- ✅ **默认项设置弹层键盘**（2026-08-03）：首焦「默认字段」Tab；Esc 归还「项目菜单」；Tab trap；`default-setup-keyboard.spec` 绿
- ✅ **数据源逆向解析弹层键盘**（2026-08-03）：首焦「数据源」Select；Esc 归还「项目菜单」；Tab trap；`reverse-database-keyboard.spec` 绿
- ✅ **导出DDL弹层键盘**（2026-08-03）：首焦「数据源」Select；Esc 归还「项目菜单」；Tab trap；`export-ddl-keyboard.spec` 绿
- ✅ **解析ERD文件弹层键盘**（2026-08-03）：首焦上传区「选择ERD文件」；Esc 归还「项目菜单」；Tab trap；`reverse-erd-keyboard.spec` 绿
- ✅ **解析PdMan文件弹层键盘**（2026-08-03）：首焦上传区「选择PdMan文件」；Esc 归还「项目菜单」；Tab trap；`reverse-pdman-keyboard.spec` 绿
- ✅ **修改密码弹层键盘**（2026-08-03）：首焦「密码」；Esc 归还触发器；Tab trap；`reset-password-keyboard.spec` 绿
- ✅ **发起SQL审批弹层键盘**（2026-08-03）：首焦「审批人」；Esc 归还触发器（父详情仍开）；Tab trap；`sql-approval-keyboard.spec` 绿
- ✅ **添加成员弹层键盘**（2026-08-03）：首焦「选择用户」；Esc 归还触发器；Tab trap；`add-user-keyboard.spec` 绿
- ✅ **只读分享弹层键盘**（2026-08-03）：首焦「分享链接」；Esc 归还触发器；Tab trap；`share-project-keyboard.spec` 绿
- ✅ **EntityModal 弹层键盘**（2026-08-03）：空态「新增模型」首焦「名称」；Esc 归还触发器；Tab trap；`entity-modal-keyboard.spec` 绿
- ✅ **画布删表确认弹层键盘**（2026-08-03）：选中表 Delete 首焦「删除」；Esc 归还不删；Tab trap；`canvas-delete-table-keyboard.spec` 绿
- ✅ **画布删边/删分组确认弹层键盘**（2026-08-03）：选中边/分组 Delete 首焦「删除」；Esc 归还不删；Tab trap；`canvas-delete-edge-frame-keyboard.spec` 绿
- ✅ **画布删字段确认弹层键盘**（2026-08-03）：字段浏览器 × 首焦「删除」；Esc 归还不删；Tab trap；`canvas-delete-field-keyboard.spec` 绿
- ✅ **表设计删索引确认弹层键盘**（2026-08-03）：索引签「删除索引」首焦「删除」；Esc 归还不删；Tab trap；`table-index-delete-keyboard.spec` 绿
- ✅ **JExcel 工具栏删行确认弹层键盘**（2026-08-03）：「删除选中行」首焦「删除」；Esc 归还不删；Tab trap；`jexcel-toolbar-delete-keyboard.spec` 绿
- ✅ **左树删模型/表/关系图确认弹层键盘**（2026-08-03）：共享 `confirmDestructive`；首焦「删除」；Esc 归还不删；Tab trap；`tree-delete-keyboard.spec` 绿
- ✅ **数据源设置删确认弹层键盘**（2026-08-03）：`Popconfirm`→`confirmDestructive`；首焦「删除」；Esc 归还不删；Tab trap；`database-setup-delete-keyboard.spec` 绿
- ✅ **工作台 databaseConfig 删/批删确认弹层键盘**（2026-08-03）：`confirmDestructive`；首焦「删除」；Esc 归还不删；Tab trap；`database-config-delete-keyboard.spec` 绿
- ✅ **只读分享吊销确认弹层键盘**（2026-08-03）：`confirmDestructive`；首焦「吊销」；Esc 归还不吊销；外层分享窗仍开；Tab trap；`share-revoke-keyboard.spec` 绿
- ✅ **团队项目删确认弹层键盘**（2026-08-03）：`RemoveGroupProject` Popconfirm→`confirmDestructive`；首焦「删除」；Esc 归还不删；Tab trap；`group-project-delete-keyboard.spec` 绿
- ✅ **团队成员移除确认弹层键盘**（2026-08-03）：`GroupUser` Popconfirm→`confirmDestructive`；首焦「移除」；Esc 归还不移；Tab trap；`group-user-remove-keyboard.spec` 绿
- ✅ **审批动作确认弹层键盘**（2026-08-03）：Pass/Refuse/Cancel/Repeat Popconfirm→`confirmDestructive`；首焦语义 OK；Esc 归还不落盘；Tab trap；死代码 `CopyVersion` 删除；`approval-action-keyboard.spec` 绿
- ✅ **裸 Modal.confirm → confirmDestructive 清零**（2026-08-03）：版本重建基线/同步×2、逆向覆盖、画布删表·边·分组·字段、边 chip、JExcel 删行、表索引删；重建确认首焦「重建」+ Esc 归还重建钮；`version-rebuild-confirm-keyboard.spec` 绿
- ✅ **Cmd+K 命令面板键盘 polish**（2026-08-03）：aria-modal + combobox/`aria-activedescendant`；↑↓ 滚动选中；无匹配「无匹配结果」分层空态；Esc 归还触发器；Tab 困在搜索；`relation.spec`「命令面板」绿
- ✅ **签头密度再压**（2026-08-03）：CommonTabs `--erd-tabs-h` 24 + 表设计签头 ~24；不 clip 标签/关闭钮；focus-visible；`model-design-ux`「表设计三签」绿；下一刀 → ~~左树工具条再收 / chrome 次密距~~✅
- ✅ **左树工具条/次密距**（2026-08-03）：`QueryTree` 工具条控件 24 + pad 4；sider-inner 次密距；禁 clip 图标；focus-visible；`model-design-ux`「模型树」绿；下一刀 → ~~版本列表二次走查 / chrome 碎色~~✅
- ✅ **版本列表二次密度 / chrome 碎色**（2026-08-03）：工具条控件 24；token 色；禁 clip；focus-visible；`version.spec`「版本列表行密度」绿；下一刀 → ~~版本工单/审批列表密度~~✅
- ✅ **版本工单/审批列表密度**（2026-08-03）：`.approval-workorder-page` 标题栏 ~24 + 行 pad 4×8；禁 clip；focus-visible；`approval.spec`「工单/审批列表行密度」绿；下一刀 → ~~设计器次屏表密度 / chrome~~✅
- ✅ **设计器次屏表密度 / chrome**（2026-08-03）：JExcel 工具栏 ~24 + 表头/行 pad 4×8（压过 datatables）；版本 diff 实体行 token 色；禁 clip；`model-design-ux`「表设计 JExcel 行密度」+ `version.spec` diff 绿；下一刀 → ~~元数据应用子签 / CodeTab chrome~~✅
- ✅ **元数据应用子签 / CodeTab chrome**（2026-08-03）：CodeTab/DbTab 签栏 ~24；禁 clip；focus-visible + Cmd+1/2/3；`model-design-ux`「元数据应用子签」绿；下一刀 → ~~表设计内签（字段/索引）栏显式 ~24~~✅
- ✅ **表设计内签栏密度**（2026-08-03）：`#tableNav` `--erd-inner-tabs-h` 24；禁 clip；focus-visible + Cmd+1/2/3；`model-design-ux`「表设计内签」绿；下一刀 → ~~右键菜单密度~~✅
- ✅ **右键/树操作菜单密度**（2026-08-03）：共享 `.erd-dense-menu`（树操作 / 签右键 / 新建 / 项目菜单）；项 ~28；禁 clip；menuitem 键盘；`model-design-ux`「右键/树操作菜单密度」绿；下一刀 → ~~空表设计引导~~✅
- ✅ **空表设计 / 空表字段引导**（2026-08-03）：字段签 Empty「添加第一个字段」；画布 `canvas-fields-empty` 品牌 CTA；`table-field-empty` 绿；下一刀 → ~~签体内容次密距~~✅
- ✅ **表设计签体内容次密距**（2026-08-03）：签体 pad 6/4 + hint/空态/元数据 tip ~24；工作区井 6；禁 clip JExcel；`model-design-ux`「表设计签体内容次密距」绿；下一刀 → ~~设计器 Empty 巨 marginTop / 次屏松井~~✅
- ✅ **设计器空态次密距**（2026-08-03）：兜底禁 marginTop:100；字段/索引 Empty 压 marginXL + pad 贴 tab-body；保留 CTA；`model-design-ux`「设计器空态次密距」绿；下一刀 → ~~欢迎空态 `.erd-welcome-empty` 内 pad 32~~✅
- ✅ **欢迎空态次密距**（2026-08-03）：`.erd-welcome-empty__inner` pad 32×24（后更碎至 20×16）；标题 20/mt14→18/mt12·lh22；hero 176；保留逆向链 + 左树新增模型；`model-design-ux`「欢迎空态次密距」绿；下一刀 → ~~AuthBrandShell 失效/登录门次密距~~✅
- ✅ **AuthBrandShell 次密距**（2026-08-03）：品牌 32×28/gap14 + 表单 pad32 + 门头 mb16（后更碎至品牌/表单 20×16 + gap12 + 门头 mb12 + 表单 body 12/28）；登录/注册/失效/404·403 同源；禁弱化品牌字号/Skip·Tab；`smoke`+`share`+`session` densify 绿；下一刀 → ~~LandingChrome / compare 次密距~~✅
- ✅ **LandingChrome / `/compare` 次密距**（2026-08-03）：次屏 section 2.75 / 对照行 0.5 / nav·footer 收；compare hero padT 1.5；hero 品牌级+全幅不动；`landing`+`compare` densify 绿；下一刀 → ~~分享成功态 meta/表清单次密~~✅
- ✅ **分享成功态 meta / 表清单次密**（2026-08-03）：stage 6×10 + meta gap2 / hint 12·16；表清单 pad 6×10·标题 12；弹层 `.erd-io-modal`；键盘/吊销不弱化；`demo`+`share-project-keyboard` densify 绿；下一刀 → ~~Home hero CTA 簇次密~~✅
- ✅ **Home hero CTA 簇次密**（2026-08-03）：hero gap24/mb·pb16；actions gap8；secondary 4×10；主 CTA large + Skip/Tab 不弱化；`home-keyboard` densify 绿；下一刀 → ~~Home 空态/公告区次密~~✅
- ✅ **Home 空态/公告次密**（2026-08-03）：空态 pad 24×12；二级入口 mb16；项目区 mb20；公告 pt4 / 行 pad4·gap10 / 标题 13；保留空态 CTA；`home-keyboard` empty/announce densify 绿；下一刀 → ~~设计器次屏碎密度~~✅
- ✅ **设计器次屏碎密度**（2026-08-03）：`.erd-secondary-pane` 逆向/ERD·PdMan/高级DDL；`ReverseTable` meta；`SyncConfig`→io-modal；设置 hint mb8；`designer-secondary-pane` densify 绿；下一刀 → ~~导入弹层 Steps 对齐~~✅
- ✅ **导入弹层 Steps 对齐**（2026-08-03）：`.erd-io-modal__steps` mt/mb ≤10/12 · 标题 12；与次屏同阶；`reverse-database-keyboard`+`export-ddl-keyboard` densify 绿；下一刀 → ~~命令面板 empty pad densify~~✅
- ✅ **Cmd+K 无匹配空态 / list 井次密**（2026-08-03）：empty pad ≤8×8 / gap ≤2、list pad ≤2；禁 16×12 / 4；Trap / aria-activedescendant / Esc 归还不弱化；`relation.spec`「命令面板」绿；下一刀 → ~~快捷键速查卡密度~~✅
- ✅ **快捷键速查卡（`?`）密度**（2026-08-03）：header 6×10 · list 2×4 · row 3×4/gap8 · footer 4×8 · maxH 360；关闭钮 focus-visible；禁 6×8 井 + padY 10；Esc / Cmd+K 互斥不弱化；`relation.spec`「快捷键速查」绿；下一刀 → ~~建模静默失败 / CTA 不清~~✅（自动保存失败可重试 → 逆向解析失败可读+重试）
- ✅ **逆向解析失败可读 + 重试**（2026-08-03）：禁 toast `[object Object]`；失败区详情 +「重新解析」；`reverse-parse-failure` 绿；下一刀 → ~~添加成员邀请失败静默关窗~~✅
- ✅ **添加成员邀请失败不关窗**（2026-08-03）：非 200 不关窗；`request` toast 不叠弹；`add-user-invite-failure` 绿；下一刀 → ~~dbsync / 版本保存边缘静默失败~~✅
- ✅ **版本保存/重建失败不伪装成功**（2026-08-03）：`initSave` 仅 code===200；InitVersion 失败不关窗；dbsync 清同步中死态；`version-save-failure` 绿；下一刀 → ~~只读分享创建失败死 affordance~~✅
- ✅ **只读分享创建失败可重试**（2026-08-03）：失败不叠弹；主钮「重新生成」；禁禁用死 affordance；`share-create-failure` 绿；下一刀 → ~~修改密码失败静默关窗~~✅
- ✅ **修改密码失败不关窗**（2026-08-03）：仅 `code===200` 关窗；失败 toast + 可重试；键盘闭环保留；`reset-password-failure` 绿；下一刀 → ~~SyncConfig 伪造成功~~✅
- ✅ **同步配置失败不关窗**（2026-08-03）：`setUpgradeType` 仅 `saveProject` code===200 写 store；失败 toast + 可重试；`sync-config-failure` 绿；下一刀 → ~~DefaultSetUp 伪造成功~~✅
- ✅ **默认项设置失败不关窗**（2026-08-03）：`updateProfile` 仅 `saveProject` code===200 写 store；失败 toast + 可重试；键盘闭环保留；`default-setup-failure` 绿；下一刀 → ~~数据源设置确定伪造成功~~✅
- ✅ **数据源设置确定失败不关窗**（2026-08-03）：`updateDbs` 返回 boolean；确定刷盘后仅成功 toast/关窗；禁无条件「保存成功」；`database-setup-failure` 绿；下一刀 → ~~EntityModal/模块树本地成功 vs autosave~~✅
- ✅ **EntityModal 落盘失败不关窗**（2026-08-03）：`addModule` 等 `persist:true` 先 `saveProject` 再写 store；仅 code===200 toast/关窗；`entity-modal-failure` 绿；键盘闭环保留；下一刀 → ~~画布 createDiagram 同构~~✅
- ✅ **画布关系图弹层落盘失败不关窗**（2026-08-03）：`ReactFlowRelation` diagram Modal `persist:true`；仅 code===200 关窗；`diagram-modal-failure` 绿；下一刀 → ~~画布表头改名伪造成功~~✅
- ✅ **画布表头改名落盘失败不退出编辑**（2026-08-03）：`renameEntity` `persist:true`；仅 code===200 退出编辑；`table-rename-failure` 绿；下一刀 → ~~画布建表/字段行内伪造成功~~✅
- ✅ **画布建表/行内加字段落盘失败可重试**（2026-08-03）：`addEntity`/`updateEntityFields` `persist:true`；仅 code===200 上图/退出新建编辑；失败 toast + 可重试；空名 toast / 空字段 CTA 保留；`canvas-create-field-failure` 绿；下一刀 → ~~字段改名/删字段伪造成功~~✅
- ✅ **画布字段改名/删字段落盘失败可重试**（2026-08-03）：既有字段 `commit`/`removeField` `persist:true`；仅 code===200 退出编辑/移出行；删字段二次确认保留，失败窗仍开；`canvas-field-rename-delete-failure` 绿；下一刀 → ~~字段 meta（类型/PK/隐藏）即时伪造成功~~✅
- ✅ **画布字段 meta 落盘失败可重试**（2026-08-03）：类型/PK/NN/AI/隐藏/浏览 PK `persist:true`；失败草稿回滚或行仍在；`canvas-field-meta-failure` 绿；下一刀 → ~~表设计 JExcel 字段 meta 假成功~~✅
- ✅ **表设计 JExcel 字段 meta 落盘失败可重试**（2026-08-03）：`TableInfoEdit` `persist:true`；失败重挂网格回滚；`jexcel-field-meta-failure` 绿；下一刀 → ~~表设计索引签假成功~~✅
- ✅ **表设计索引签落盘失败可重试**（2026-08-03）：`updateEntityIndex`/`TableIndexEdit` `persist:true`；失败空态/重挂回滚；`jexcel-index-failure` 绿；下一刀 → ~~默认字段假成功~~✅
- ✅ **默认字段落盘失败可重试**（2026-08-03）：`updateDefaultFields`/`DefaultField` `persist:true`；失败重挂回滚；清死代码 `moveField`；`default-field-failure` 绿；下一刀 → ~~工作台壳外井 densify~~✅
- ✅ **工作台壳（Home/Group）外井次密**（2026-08-03）：shell/content 12×16、body 12×16、列表空态 12×8；禁 24/20 双松井；`layout-outlet` densify 绿；下一刀 → ~~账号 BaseView gap~~✅
- ✅ **账号 BaseView 左右列次密**（2026-08-03）：gap 24→16（窄屏 12）；禁 24；`account-settings` densify 绿；下一刀 → ~~顶栏 `erd-chrome-actions` gap16~~✅
- ✅ **顶栏 `erd-chrome-actions` 次密**（2026-08-03）：gap 16→12（Design 仍 8）；`data-testid`；`layout-outlet` densify 绿；下一刀 → ~~顶栏 header pad20 / brand–nav gap16~~✅
- ✅ **顶栏 `erd-chrome-header` 次密**（2026-08-03）：padX 20→16 + brand–nav gap 16→12；Home/Group 覆写对齐；Design 仍 gap8；`data-testid`；`layout-outlet` densify 绿；下一刀 → ~~Home 水平导航 Menu 项水平松距~~✅
- ✅ **Home 水平导航 Menu 项次密**（2026-08-03）：padX 16→12（8–12 族）；项高 64 / 命中宽 ≥44；`testid=home-layout-menu`；`layout-outlet` densify 绿；下一刀 → ~~Group 侧栏 nav 行距~~✅
- ✅ **Group 侧栏 nav 行距次密**（2026-08-03）：项高 40→28 / padX 24·16→12 / marginY 4→2 / 字 12；`testid=group-layout-sider-menu`；`layout-outlet` densify + `group-keyboard` 绿；下一刀 → ~~项目列表工具条碎距~~✅
- ✅ **项目列表工具条碎距**（2026-08-03）：Search 高 32→28 + Space `size={8}` + 钮 padX 8；工具条高 ≤32；`testid=project-list-toolbar`；`project-surface` densify + `project-list-keyboard` 绿；下一刀 → ~~团队成员工具条碎距~~✅
- ✅ **团队成员工具条碎距**（2026-08-03）：`GroupUser` mb16→8 + Search 32→28 + Space gap8 + 钮 padX8；`testid=group-user-toolbar`；`group-layout-nav` densify + `group-keyboard` / `add-user-keyboard` 绿；下一刀 → ~~Group 用户组 Title/页签碎距~~✅
- ✅ **Group 用户组 Title/左角色签碎距**（2026-08-03）：标题 20→13/22·mb8；去掉 Space large + br；左签 padX24→12·高38→28·字12；`testid=group-setting-page`；`group-layout-nav` densify + `group-keyboard` / `add-user-keyboard` 绿；下一刀 → ~~Group 基本设置 Title level4~~✅
- ✅ **Group 基本设置页头碎距**（2026-08-03）：标题 20→13/22·mt0·mb8；同文件「删除项目」同阶；`testid=basic-setting-page`；`group-basic-setting` densify + `group-layout-nav` / `group-keyboard` 绿；下一刀 → ~~Group 基本设置 Form 项间距/控件 28~~✅
- ✅ **Group 基本设置 Form 碎距**（2026-08-03）：项 mb24→12 / Input·Select·钮 32→28 / label 12；对齐 `.setting-common-form`；`group-basic-setting` densify + `group-layout-nav` / `group-keyboard` 绿；下一刀 → ~~Group 基本设置删区碎片（Divider/Space/次文）~~✅
- ✅ **Group 基本设置删区碎片**（2026-08-03）：Divider 24→12 + 去 Space 叠标题 mb + 次文 14→12/18；`testid=basic-setting-delete-zone`；`group-basic-setting` densify + `group-project-delete-keyboard` 绿；下一刀 → ~~欢迎空态标题 20/mt14 碎距~~✅
- ✅ **欢迎空态标题碎距**（2026-08-03）：标题 20/mt14·lh≈26 → 18/mt12·lh22（贴 8–12 / page-title 13/22）；pad/hero 不动；`model-design-ux` densify 绿；下一刀 → ~~欢迎空态内井 pad32~~✅
- ✅ **欢迎空态内井碎距**（2026-08-03）：`.erd-welcome-empty__inner` pad 32×24 → 20×16（贴壳 8–12 / content 12×16）；标题/hero 不动；`testid=designer-welcome-empty-inner`；`model-design-ux` densify 绿；下一刀 → ~~AuthBrandShell 品牌/表单 pad32 二压（对齐 20 井）~~✅
- ✅ **AuthBrandShell 品牌/表单井碎距二压**（2026-08-03）：品牌/表单 pad 32→20×16；gap14/门头/字号/~40% 不动；`testid=auth-form-panel`；`smoke`+`share`+`session` densify + 登录壳键盘绿；下一刀 → ~~AuthBrandShell 门头 mb16 / brand gap14 三压~~✅
- ✅ **AuthBrandShell 门头/brand gap 三压**（2026-08-03）：门头 mb16→12 + brand gap14→12；pad 20×16 / 字号 / 色层次不动；`testid=auth-form-header`；`smoke`+`session` 键盘 densify + `share` 绿；下一刀 → ~~AuthBrandShell 表单 Title mt10 / Form 项 antd 默认 mb~~✅
- ✅ **AuthBrandShell 表单 body 碎距**（2026-08-03）：Title mt10→6 + 项 mb24→12 / Input·钮 large→28 / label 12；对齐 `.setting-common-form`；`testid=auth-shell-form`；`smoke`+`session` densify 绿；下一刀 → ~~设计器侧栏 nav 行距~~✅（跳过 Auth logo 48）
- ✅ **设计器侧栏 nav 行距次密**（2026-08-03）：`.design-layout__sider-menu` 项高 40→28 / padX→12 / marginY→2 / 字 12（与 Group 侧栏同阶）；版本/导入/导出/设置同源；`testid=design-layout-sider-menu`；`layout-outlet` densify + 侧栏键盘；下一刀 → ~~版本空态 pad 16×12~~✅
- ✅ **版本列表空态井次密**（2026-08-03）：`.version-page__list .ant-list-empty-text` pad 16×12→12×8（对齐工作台列表空态）；保留「保存第一个版本」；`version.spec` 空态 densify 绿；下一刀 → ~~Cmd+K footer~~✅
- ✅ **Cmd+K footer 次密**（2026-08-03）：`.erd-cmd-footer` pad 6×10→4×8（对齐 `?` 速查 footer）；字 10 / lh 1.3；`relation.spec`「命令面板」锁 padY≤8 / padX≤8；Trap / aria / Esc 不弱化；下一刀 → ~~notice-row gap12~~✅
- ✅ **公告 notice-row gap 次密**（2026-08-03）：`.project-list-page__notice-row` gap 12→8（8–12 族）；行 pad / 工具条不动；`testid=project-notice-row`；`project-notice` densify 绿；下一刀 → ~~画布空态 CTA pad~~✅
- ✅ **画布空态 CTA pad 次密**（2026-08-03）：`.erd-empty-cta` pad 14×18×12→10×12（8–12 族）；主 CTA hit ≥26；Auth logo / 欢迎 pad 不动；`testid=canvas-empty-state`；`relation` densify 绿；下一刀 → ~~`.erd-empty-panel` 顶距~~✅
- ✅ **画布空态 panel 顶距次密**（2026-08-03）：`.erd-empty-panel` `min(10vh, 88)`→`min(8vh, 64)`；保留存在感；勿再调 CTA pad；Auth logo / 欢迎 pad 跳过；`testid=canvas-empty-panel`；`relation` densify 绿；下一刀 → ~~空态纵节奏（title mt / desc mb）~~✅
- ✅ **画布空态纵节奏锁密**（2026-08-03）：量测 title mt8 / desc mb12 已贴 ADR-0016；E2E 锁禁回退 16/18；Auth logo / 欢迎 pad / CTA pad / panel 顶距跳过；`relation` densify 绿；下一刀 → ~~Controls 次密或 `.erd-empty-links` mt10~~✅
- ✅ **画布空态次链 mt10 锁密**（2026-08-03）：量测 Controls 22/pad0 已密 → 锁 `.erd-empty-links` mt10；`testid=canvas-empty-links`；Auth logo / 欢迎 / CTA / panel / title·desc 跳过；`relation` 空态+Controls 绿；下一刀 → ~~表设计签头 / CommonTabs 碎距~~✅
- ✅ **表设计签头 / 内签 gutter 碎距**（2026-08-03）：量测 CommonTabs 24 已密；签头 pad 2×10/gap6→2×8/gap4；内签 marginR 8→2（对齐子签）；`testid=table-design-header`/`table-design-tabs`/`common-tabs`；Auth logo / 欢迎 / 空态 panel 跳过；`model-design-ux` 三签+内签绿；下一刀 → ~~画布表节点 chrome~~✅
- ✅ **表节点底栏 / 空表井 chrome 碎距**（2026-08-03）：量测表头 pad6 / 字段 minH20 已贴密表下限；压空表井 pad10→6 + 底栏 margin8→6 + 命中 minH22/26；`NODE_FOOTER_H` 32→28；表头/字段行/persist 不动；`relation`+`table-field-empty` densify 绿；下一刀 → ~~左树右键菜单 border-box 实密~~✅
- ✅ **左树/右键菜单 border-box 实密**（2026-08-03）：量测项 CSS height28 但 antd dropdown `content-box`+padY5 → 命中 ~33；压 `box-sizing:border-box` + padY0；命中≈28；版本工具条已 24 跳过；Auth/欢迎/Controls/审批/导出跳过；`model-design-ux` densify 绿；下一刀 → ~~画布 MiniMap chrome~~✅
- ✅ **MiniMap chrome margin 碎距**（2026-08-03）：量测 128×96 / pad0 / sunk 已密；RF panel margin **15** 松 → **8**；概览尺寸不动；Controls/版本工具条/Auth/欢迎跳过；`relation`+`demo` densify 绿；下一刀 → ~~边标签避让~~量测已密 / ~~导入弹层 body~~✅
- ✅ **导入弹层 body 碎距**（2026-08-03）：量测边标签 pad[4,2]/gap4/12px 已贴可读下限；`.erd-io-modal` body **12×14**→**8×12**；导出同源；`dbml-import`+`dbml-export` densify 绿；下一刀 → ~~EntityModal body~~✅
- ✅ **EntityModal body 碎距**（2026-08-03）：`.erd-entity-modal` body **12×14**→**8×12**（对齐 io / 次屏）；`relation` densify 绿；下一刀 → ~~io-modal header·footer~~✅
- ✅ **io-modal / EntityModal 头脚碎距**（2026-08-03）：两族 header **10×14×8**→**8×12**、footer **8×14**→**8×12**、close top **10**→**8**；标题 13/22 · OK≥28 不动；`relation`+`dbml-import`+`dbml-export` densify 绿；下一刀 → ~~基数 Select / Form mb~~量测已密 / ~~Controls·工具栏 panel margin~~✅
- ✅ **Controls / 工具栏 Panel margin 碎距**（2026-08-03）：量测基数 Select **24** / Form mb12·控件28 已密；Controls+顶栏工具栏 RF margin **15**→**8**（对齐 MiniMap）；`relation`+`demo` densify 绿；下一刀 → ~~空态剪影 compact 132~~✅（跳过 Auth logo 48 / 欢迎 pad）
- ✅ **空态剪影 compact 碎距**（2026-08-03）：`ErdEmptyDiagram` compact **132**→**112**；hero 176 / Auth logo / 欢迎 pad / Controls·工具栏 margin / 边标签 / MiniMap 尺寸 / 版本工具条 / 弹层头身脚跳过；`relation`「空态构图」 densify 绿；下一刀 → ~~画布/左树删表假成功~~✅（跳过 Auth logo 48）
- ✅ **画布/左树删表落盘失败可重试**（2026-08-03）：`removeEntity` `persist:true`；仅 save code===200 移出 +「表删除成功」；失败节点保留、确认拒关可重试；`canvas-delete-table-failure` 绿；下一刀 → ~~左树删模型·删关系图~~✅
- ✅ **左树删模型/关系图落盘失败可重试**（2026-08-03）：`removeModule`/`removeDiagram` `persist:true`；仅 save code===200 移出 + 成功 toast；失败树保留、确认拒关可重试；`tree-delete-module-diagram-failure` 绿；下一刀 → ~~画布删边·Frame~~✅
- ✅ **画布删边/删分组落盘失败可重试**（2026-08-03）：`removeAssociation`/`removeFrame` `persist:true`；仅 save code===200 移出 + 成功 toast；失败边/框保留、确认拒关可重试；`canvas-delete-edge-frame-failure` 绿；下一刀 → ~~剪贴粘贴假成功~~✅
- ✅ **左树剪切/粘贴落盘失败可重试**（2026-08-03）：`cutEntity`/`pastEntity`/`cutModule`/`pastModule` `persist:true`；仅 save code===200 写剪贴板与移出/写入 + 成功 toast；失败保留先前状态；复制仅本地剪贴板；`tree-cut-paste-failure` 绿；下一刀 → ~~改名模型/关系图~~已 clean → ~~拖拽落盘假成功~~✅
- ✅ **画布拖表坐标落盘失败可回滚**（2026-08-03）：`commitDiagramGeometry` `persist:true`；仅 save code===200 写 layout/Frame bounds；失败 toast + RF 回滚；`canvas-drag-reposition-failure` 绿；下一刀 → ~~对齐·自动布局~~✅
- ✅ **画布对齐/自动布局落盘失败可回滚**（2026-08-03）：`alignSelected`/`autoLayout`→`commitDiagramGeometry` `persist:true`；失败 toast + RF 回滚；成功才 fitView；`canvas-align-layout-failure` 绿；下一刀 → ~~Frame 改名 / Frame bounds（适应成员·缩放）假成功~~✅
- ✅ **Frame 改名/bounds 落盘失败可回滚**（2026-08-03）：`renameFrame` persist + 缩放/适应成员/`expandFrameForMembers`→`commitDiagramGeometry`；失败 toast + 草稿/RF 回滚；成功才「已适应成员」；`canvas-frame-rename-bounds-failure` 绿；下一刀 → ~~Frame 新建·成员加减假成功~~✅
- ✅ **Frame 新建/成员加减落盘失败可回滚**（2026-08-03）：`createFrame`/`addFrameMembers`/`removeFrameMembers` `persist:true`；失败 toast、不上图/成员不变；加入 Modal 拒关窗；`canvas-frame-members-failure` 绿；下一刀 → ~~`addAssociation` 连线假成功~~✅
- ✅ **画布连线建关联落盘失败可重试**（2026-08-03）：`addAssociation` `persist:true`；失败 toast、不上边；可再拖重试；`canvas-connect-edge-failure` 绿；下一刀 → ~~`updateAssociationRelation` 基数改假成功~~✅
- ✅ **画布改边基数落盘失败可重试**（2026-08-03）：`updateAssociationRelation` `persist:true`；失败 toast、chip 保持原基数；可再选重试；`canvas-cardinality-failure` 绿；下一刀 → ~~数据类型字典 CRUD 假成功~~✅
- ✅ **数据类型字典落盘失败可重试**（2026-08-03）：`addDatatype`/`updateDatatype`/`removeDatatype` `persist:true`；设置页 `/setting/dataType`；失败 toast、窗 keep；`datatype-domains-failure` 绿；下一刀 → ~~逆向导入 `setProjectJson`/`importReverseTable` 假成功~~✅
- ✅ **逆向导入落盘失败可重试**（2026-08-03）：`setProjectJson`/`importReverseTable`/`importModuleAndProfile` persist；仅 save code===200 写 store + 成功 toast；失败 toast、不写 store；`import-erd-failure` 绿；下一刀 → ~~默认库切库 / WORD 模板假成功~~✅
- ✅ **默认数据源 / WORD 模板落盘失败可重试**（2026-08-03）：`setDefaultDb`/`updateWordTemplateConfig` 仅 save code===200 写 store；失败 toast+Radio 回滚；顺手删 `databaseDomainsSlice` 零挂载 CRUD；`default-db-failure` 绿；下一刀 → ~~版本回滚假成功~~✅
- ✅ **版本回滚落盘失败可重试**（2026-08-03）：扫描余假成功——dbsync/Word 导出已收口；`revertVersionData` 仅 save code===200 写 store + 成功 toast；失败不写 store、确认窗不关；`version-revert-failure` 绿；下一刀 → ~~`downloadWordTemplate` JSON/空 blob 假下载~~✅
- ✅ **WORD 模板下载假文件可拒**（2026-08-03）：`downloadWordTemplate` 拒空/JSON/非 ZIP blob，失败 toast、不 `saveByBlob`；`word-template-download-failure` 绿；下一刀 → ~~Word `gendocx` 假下载~~✅
- ✅ **Word gendocx 导出假文件可拒**（2026-08-03）：`exportFile('Word')` 复用 `docxBlobGate`；空/JSON/非 ZIP toast、不落盘；`word-gendocx-download-failure` 绿；下一刀 → ~~扫描余假成功～切画布关系图弹层键盘~~✅
- ✅ **画布关系图弹层键盘闭环**（2026-08-03）：假成功高 ROI 已枯；新建/重命名关系图 + 加入分组 Modal 首焦/Esc/Tab trap；`diagram-modal-keyboard` 绿；下一刀 → ~~数据类型字典 Modal `focusTriggerAfterClose`~~✅
- ✅ **数据类型字典弹层键盘闭环**（2026-08-03）：`DataTypeDomains` `keyboard` + `focusTriggerAfterClose` + 首焦「类型名称」；`datatype-domains-keyboard` 绿；下一刀 → ~~设计器壳 Skip/表设计签头键盘~~✅
- ✅ **CommonTabs 签头键盘闭环**（2026-08-03）：关闭钮「关闭 {表名}」+ 关签焦点归还；`common-tabs-keyboard` 绿；扫余弹层：主 Modal 已闭环，余 `Modal.info` SQL 明细 / `Modal.warning` 导入校验 / databaseConfig Drawer；下一刀 → ~~SQL 明细焦点归还~~✅
- ✅ **审批/工单 SQL 明细键盘闭环**（2026-08-03）：`showSqlDetailModal` 首焦「知道了」+ Esc/OK 归还「查看SQL」+ Tab trap；`sql-detail-keyboard` 绿；下一刀 → ~~`Modal.warning` 导入校验~~✅
- ✅ **导入跳过校验键盘闭环**（2026-08-03）：`showImportSkipWarning` 首焦「知道了」+ Esc/OK 归还「解析并导入」+ Tab trap；DBML/ERD/PdMan（dialog+次屏）共用；`import-skip-warning-keyboard` 绿；下一刀 → ~~`databaseConfig` Drawer~~✅
- ✅ **工作台 databaseConfig Drawer 键盘闭环**（2026-08-03）：`keyboard` + 打开首焦「连接名称」+ Esc + `afterOpenChange` 归还触发器（Drawer 无 `focusTriggerAfterClose`）+ Tab trap；`database-config-drawer-keyboard` 绿；下一刀 → ~~JExcel Escape 退格 + 快捷操作 Modal~~✅
- ✅ **JExcel Escape 退格 / 快捷操作键盘**（2026-08-03）：编辑态 Esc 丢弃→焦点回 `jexcel-grid`；工具栏 `role=toolbar`；快捷操作 `Modal.info` 首焦「知道了」+ Esc 归还 + Tab trap；`jexcel-grid-keyboard` 绿；下一刀 → ~~版本同步结果 Modal 键盘~~✅
- ✅ **版本同步结果弹层键盘**（2026-08-03）：`SyncVersion` 行绑定修炸 + `showSyncResultModal` 成功/失败首焦「知道了」+ Esc 归还「同步」+ Tab trap；`version-sync-result-keyboard` 绿
- ✅ **Oracle 逆向注释保真**（2026-08-03）：`ALL_TAB_COMMENTS`/`ALL_COL_COMMENTS` → chnname；`OracleReverseDialectCommentTest`；下一刀 → ~~MySQL 触发器逆向~~✅
- ✅ **MySQL 触发器逆向保真**（2026-08-03）：`INFORMATION_SCHEMA.TRIGGERS` → `entity.triggers[]`（name/timing/event/ddl）；`MysqlReverseDialectTriggerTest`；下一刀 → ~~PG 触发器~~✅
- ✅ **PostgreSQL 触发器逆向保真**（2026-08-03）：`information_schema.triggers` → `entity.triggers[]`；`PostgresqlReverseDialectTriggerTest`；下一刀 → ~~SQL Server 触发器~~✅
- ✅ **SQL Server 触发器逆向保真**（2026-08-03）：`sys.triggers`/`sys.trigger_events`+`OBJECT_DEFINITION` → `entity.triggers[]`；`SqlServerReverseDialectTriggerTest`；下一刀 → ~~Oracle 触发器~~✅
- ✅ **Oracle 触发器逆向保真**（2026-08-03）：`ALL_TRIGGERS`+`ALL_SOURCE` → `entity.triggers[]`；`OracleReverseDialectTriggerTest`；P0 四库触发器闭环；下一刀 → ~~FK 约束元数据~~✅
- ✅ **FK 约束名 + ON DELETE/UPDATE**（2026-08-03）：`constraintName`/`deleteRule`/`updateRule` 加法字段；四库字典 + JDBC；复合拆边同名（ADR-0011 `fields[]` 仍延期）；边 chip `title`/`aria-label` + `erd-edge-fk-meta`；下一刀 → ~~表清单分页~~✅ / DBML trigger（度量无家 → 文档延期）
- ✅ **分享表清单分页**（2026-08-03）：只读底栏表清单默认 `pageSize=5` + SizeChanger；demo 8 表可翻页；`data-format` 登记 DBML Trigger 缺口（`@dbml/core` 无块、`Note` 禁塞）；下一刀 → ~~触发器 UI~~✅ / DBML enum / ADR-0013（人工）/ P4 demo
- ✅ **表设计触发器签**（2026-08-03）：`entity.triggers[]` 列表 + 查看 DDL + 添加/删除；`updateEntityTriggers` persist-on-200；`Cmd/Ctrl+4`；`table-triggers.spec`；下一刀 → ~~DBML enum~~✅ / ADR-0013（人工）/ P4 demo
- ✅ **DBML Enum 互通**（2026-08-03）：`Enum`↔`dataTypeDomains.datatype`（`kind:enum`/`values[]`）+ 列 `type=code`；导入/导出 round-trip；`enum.dbml` + `yarn test:unit:dbml` + `dbml-export` Enum E2E；下一刀 → ~~表达式索引~~✅
- ✅ **DBML 表达式索引**（2026-08-03）：expression↔`indexs[].fields[]` 原样字符串（无 schema 加法）；混列导出 `` `expr` ``；`expression-index.dbml` + unit + `dbml-export` E2E；下一刀 → ~~逆向函数索引字典~~✅
- ✅ **逆向表达式/函数索引**（2026-08-03）：PG `pg_get_indexdef` + MySQL 8 `STATISTICS.EXPRESSION` → `indexs[].fields[]`；mapper 软跳过；单元 mock JDBC；下一刀 → ~~索引签 UI 表达式~~✅
- ✅ **索引签字段/表达式编辑**（2026-08-03）：JExcel `fields` 列 text「字段/表达式*」；分号混写；persist-on-200；`index-expression-edit`；下一刀 → ~~Oracle·SQL Server 函数索引~~✅
- ✅ **逆向 Oracle/SQL Server 函数·计算列索引**（2026-08-03）：`ALL_IND_EXPRESSIONS` / `sys.computed_columns.definition` → `fields[]`；P0 四库闭环；下一刀 → ~~过滤索引谓词~~✅
- ✅ **DDL/DBML `filter` 回写**（2026-08-03）：PG/SQL Server `WHERE` + DBML `note: filter:`；下一刀 → ~~DDL `triggers[]`~~✅
- ✅ **DDL `triggers[]` 回写**（2026-08-03）：`createTrigger` 优先 `ddl`/方言重建（四库）；导出弹层可勾选；`json2code.trigger.test.ts`；下一刀 → ~~数据字典·枚举域 UX~~✅
- ✅ **数据字典·枚举域 UX**（2026-08-03）：`/setting/dataType` 种类逻辑|枚举、`values[]` Form.List、列表种类/取值密列、空态双 CTA；persist-on-200；`datatype-enum-ux`；下一刀 → ~~字段 type 下拉区分枚举~~✅
- ✅ **字段 type 下拉区分枚举**（2026-08-03）：画布 `<select>` optgroup「逻辑类型|枚举」+ 浏览态枚举徽章；表设计/默认字段 JExcel dropdown `group`；值写 `fields[].type=code`；`field-type-enum-picker`；下一刀 → ~~库方言 apply 可视化编辑~~✅
- ✅ **库方言 apply 可视化编辑**（2026-08-03）：逻辑类型 Modal「库方言映射」密表编 `apply[code].type`；枚举仍 `buildEnumApply`；persist-on-200；`datatype-apply-ux`；下一刀 → ~~边 ON DELETE/UPDATE 可编辑~~✅
- ✅ **画布边 FK 参照动作可编辑**（2026-08-03）：chip 编辑器基数 + ON DELETE/UPDATE；`updateAssociationFkMeta` persist-on-200；同 `constraintName` 拆边同步；`canvas-fk-meta-edit`；下一刀 → ~~DDL FK 回写~~✅ / ADR-0013（人工）/ P4 demo / DBML Trigger（等官方块）
- ✅ **DDL/DBML FK 回写**（2026-08-03）：`createForeignKey` 四库 ALTER FOREIGN KEY + ON DELETE/UPDATE；DBML 官方 Ref settings；下一刀 → ~~画布底栏打开触发器签~~✅ / ADR-0013（人工）/ P4 demo / DBML Trigger（等官方块）
- ✅ **画布底栏打开触发器签**（2026-08-03）：表节点「触发器」`canvas-open-trigger` → `designPane:'trigger'`（与字段/索引/元数据对称）；禁签存在只能绕签头/`Cmd+4`；`relation`+`table-triggers`；下一刀 → ADR-0013（人工）/ P4 Railway demo（人工）/ DBML Trigger（等官方块）/ ADR-0011 `fields[]`（仍延期）

## 重估结论（2026-08-02 v2）：三个被推翻的假设

对照 vision（北极星 = 每周产生版本保存的活跃项目数）、ADR-0012（agent 可读事实源 = 版本 + 分享 + 审计）与后端控制器/ Flyway 现状复核，原 W2–W5 排序基于三个错误假设：

1. **「Home 密度值得单列一波」错。** Home 的职责是 5 秒路由回建模；北极星杠杆（示例项目直达「保存第一个版本」、顶栏「保存版本」常驻、远端 sync 提示直达版本页）已于 2026-08-02 全部 ✅。Home 剩余问题是**死代码与重复统计**（`components/Radar/`、`_mock.ts`、未渲染的 `Pie` config、hero 与「项目概览」卡重复报同组 statistic）——这是**删除**问题，不是密度设计问题。装饰性密度抛光对北极星零贡献。
2. **「逐页抬水位 = 按页平移组件」错。** 真实缺口是**能力暴露**：后端能做而 UI 埋没或缺失（见下节）。原 W3–W5 的大部分工作量是 `ProList→List` / `ProForm→Form` 的用户不可见平移。
3. **「Pro import 清零是当前最高优先度量」错。** ADR-0014 已冻结 Pro@2.8.10 并容忍并存；依赖移除是卫生收尾，不应驱动三个波次。摘 Pro 改为搭「能力暴露 / 删空壳」的便车，最后一次性移除依赖（单独 commit）。

### 后端已能、UI 埋没或缺失（先补暴露，再谈美化）

| 能力 | 后端证据 | UI 现状 | 缺口 |
|---|---|---|---|
| 只读分享**吊销/管理** | `POST /share/revoke`（ProjectShareController）；security-model 明文「创建/吊销需登录且为项目创建人」 | 设计器顶栏「分享」弹层：创建/复制/吊销 ✅（W2 切片 1） | ✅ |
| 跨版本 diff **导出** | 版本 diff 可视化 ✅（CompareVersion）；db_change.tag 多标签 ✅（Flyway V1/V2） | CompareVersion「导出」Markdown/SQL ✅（W3 切片 1） | ✅ |
| 数据字典 | `/dataDict` 全 CRUD（DataDictController） | 实验页已删（W2）；本阶段无 UI | **thin** — 本阶段不扩，但也不许为其抛光 |
| 审批流 | approval CRUD + SQL 信任链（SQL 失败不落通过 ✅） | 版本行「提交工单」+ 顶栏/侧栏工单·审批直达 ✅（W3 切片 3） | ✅ |
| 版本回滚 / 标签 / 同步 / 逆向 / Word 导出 | RevertVersion、tag chips、dbsync/rebaseline、dbReverseParse、`/doc/gendocx` | 均已暴露 ✅ | 无缺口，勿重复投资 |

### 空壳清单（先删后美；删之前禁止投入任何 UI 打磨）

- `pages/design/query`、`pages/dataQuery`：在线 SQL 实验页 → W2 ✅ 已删（含 QueryLeftContent / dialog/query / useQueryStore）
- `pages/design/chatsql`：ADR-0012 不做营销包装 → W2 ✅ 已删（`@chatui/core` 已移除）
- `pages/design/dataDomain`：实验页延期 → W2 ✅ 已删
- `pages/design/test`、`pages/test`：演示/测试残留 → W2 ✅ 已删（`pages/JExcel` 为表编辑组件保留）
- Home 死码：`components/Radar/`、`_mock.ts`、`service.ts`、`Pie` config、`@ant-design/charts`、重复「项目概览」、slogan 轮转 → W2 ✅ 已删
- `account/settings/geographic`（province/city json）与无后端字段 → W2 ✅ 已删

## 分波（Auto 可逐波执行）

每波独立可 revert；收尾 `yarn build` + 受影响 E2E + UX 走查截图 + 更新 CHANGELOG「验证点」。

| 波 | 范围 | 摘 Pro | 验证点 |
|---|---|---|---|
| **W1** 设计器壳 ✅ | DesignLayout 摘 ProLayout → antd Layout（2026-08-02 已 ✅） | ProLayout/PageContainer/ProCard/WaterMark ✅ | `layout-outlet.spec` + smoke「登录→新建→设计器」 |
| **W2** 能力暴露 + 空壳清除（重定义，替代旧「Home 密度」） | ① 分享管理：顶栏「分享」→ 弹层（创建/复制/**吊销**接线 `/share/revoke`/查看当前链接）；② 删空壳：query/dataQuery/chatsql/dataDomain 隐藏或删除，JExcel/test 页、home Radar/_mock/Pie 死码、settings geographic 删除；③ Home 只做**删**：重复统计卡、slogan 轮转、死 import；④ 设计器 chrome 收尾：删 `bgLayoutImgList`/sider footer、sider 320、tabs 40px、画布 flex、面板头「+ 新建」露出 | 被删页面/组件携带的 Pro 用量一并清除 | 分享「创建→复制→吊销→链接失效 403」E2E；空壳路由 404/不可达断言；`home-link-*` 不回归；新建表旅程 smoke 不回归；`@ant-design/charts` 若无剩余引用则从依赖移除 |
| └ **W2 切片 1** ✅（2026-08-02） | ① 分享弹层+吊销+后端创建人校验+匿名 GET-only；② 空壳路由下线（query/chatsql/dataDomain/dataQuery→404）+ 删 test 页与 settings geographic（`pages/JExcel` 为表编辑组件保留） | 随删路由清 Query 左栏特例 | `share.spec`（含吊销失效）+ `design-query`/`data-domain`/`home-data-query` 404 |
| └ **W2 切片 2** ✅（2026-08-02） | ③ Home 只删：Radar/_mock/service/Pie config/「项目概览」重复卡 + HomeLayout slogan 轮转；实验页源文件物理删除（query/chatsql/dataDomain/dataQuery + QueryLeftContent/dialog/query/useQueryStore）；依赖移除 `@ant-design/charts`、`@chatui/core` | 随删清 TabGroup.QUERY | `activation` + `layout-outlet`；空壳 404 不回归；`grep charts/chatui/useQueryStore` = 0 |
| └ **W2 切片 3** ✅（2026-08-02） | ④ 设计器 chrome：主区去重嵌套 `DataTable`；sider footer 删除；sider 400→320；tabs 40px；壳层 flex 填满；树头「新建」常显 | — | `layout-outlet`「顶栏…」+「模型树唯一 + 新建入口常显」；`openRelationFromEmpty` 断言单树 |
| └ **W2 切片 4** ✅（2026-08-02） | ⑤ 设计器 `calc(100vh)` 清零：`QueryTree` / `version-page` / ReactFlow 画布 → flex/`height:100%`；sider-inner `overflow:hidden` | — | `layout-outlet`「模型树与版本页 flex 填满」；`rg 'calc\\(100vh' frontend/src/components/QueryTree frontend/src/pages/design` = 0 |
| **W3** 版本域收口 ✅（旧 W4 提前，目标改写） | version ProList → antd List ✅；**跨版本 diff 导出** ✅；审批/order 表单 `ProForm*` → antd Form 平移 ✅；审批入口理顺 ✅ | 版本/审批域 ProForm（已摘） | 版本「保存→打标签→diff→导出→回滚」旅程 E2E；审批「提交→通过→SQL 失败不落通过」回归 |
| └ **W3 切片 1** ✅（2026-08-02） | **跨版本 diff 导出**：diff 弹层「导出」主按钮落 Markdown（模型变更+SQL），下拉「仅导出 SQL」；复用 `File.save`；顺带移除零引用 `bizcharts` / `@ant-design/plots` | — | `version.spec` 详情弹层 download `.md` + toast；`formatVersionDiffMarkdown.test.ts` |
| └ **W3 切片 2** ✅（2026-08-02） | version `ProList` → antd `List`：工具栏（脏标记/数据源/标签筛选/新增/对比/同步配置/重建）+ 行（版本号 strong + 同步 Tag + 标签 chips + 变更摘要 + 行尾操作）；空态「还没有版本」+「保存第一个版本」主按钮 | version ProList | `version.spec`「无数据源也可新增版本」空态 CTA + 列表行不回归；`rg ProList pages/design/version` = 0 |
| └ **W3 切片 3** ✅（2026-08-02） | **审批/工单入口理顺**：版本页顶栏「我的工单/我的审批」直达；团队未同步版本行「提交工单」→ 详情「SQL审批」；空态文案对齐 | — | `approval.spec`「版本页：提交工单入口可达且审批 tab 可见」+ 既有工单/审批用例 |
| **W4** 项目列表 + 数据源（旧 W3，降为纯平移波） | dataModels + project/* `ProList` → antd List；databaseConfig `ProTable`/`PageContainer` → antd Table + 工作台壳；import/export/setting/account 剩余 `ProForm*` 逐个平移（含保存版本 AddVersion） | 4 页 ProList + 1 ProTable + 剩余 ProForm | 项目「列表→打开→重命名→删除」E2E；数据源「新建→ping→删除」E2E；每对话框对应 E2E 不回归 |
| └ **W4 切片 1** ✅（2026-08-02） | **AddVersion**（保存版本弹窗）：`ModalForm`/`ProForm*` → antd `Modal` + `Form`；标签 `Select mode=tags` + 逗号分隔、校验与 testid 不变 | AddVersion ProForm | `version.spec` 保存路径（无数据源新增 / 多标签 / 可视化 diff 内 saveVersion） |
| └ **W4 切片 2** ✅（2026-08-02） | **RenameVersion**（编辑版本弹窗）：`ModalForm`/`ProForm*` → antd `Modal` + `Form`；回填/非最新只读版本号/失败不关窗；testid 不变 | RenameVersion ProForm | `version.spec`「重命名描述与删除版本」 |
| └ **W4 切片 3** ✅（2026-08-02） | **AddProject**（新增项目弹窗）：`ModalForm`/`ProForm*` → antd `Modal` + `Form`；个人/团队 `type` 初值；tags Select + testid 不变 | AddProject ProForm | `smoke` / `project-activation` `createPersonProject` |
| └ **W4 切片 4** ✅（2026-08-02） | **RenameProject**（修改项目弹窗）：`ModalForm`/`ProForm*` → antd `Modal` + `Form`；tags 拆分回填；失败不关窗；testid 新增 | RenameProject ProForm | `project-surface`「修改弹窗可改名并回列表」 |
| └ **W4 切片 5** ✅（2026-08-02） | **死码清除**：零挂载 `DataDomain`/`DynamicDialog` + `dialog/module|entity|database|dataType` ModalForm 整簇删除（模型/表已由 `EntityModal` antd Form+Modal 承接；勿平移不可见页） | 死 ModalForm 簇 | `empty-projectjson`「无 JSON 团队项目可新增模型」；`rg dialog/(module\|entity\|database\|dataType)` = 0 |
| └ **W4 切片 6** ✅（2026-08-02） | **CopyProject**（版本行复刻弹窗）：`ModalForm`/`ProForm*` → antd `Modal` + `Form`；类型数值化；tags Select + testid；失败不关窗 | CopyProject ProForm | `version.spec`「版本行复刻弹窗可创建个人项目」 |
| └ **W4 切片 7** ✅（2026-08-02） | **DatabaseSetUp**（设计器「数据源设置」）：`ModalForm`/`ProFormList`/`ProForm*` → antd `Modal` + `Form` + `Form.List`；删零引用 setting 页孪生文件 | dialog DatabaseSetUp ProForm | `adr0008-datasource`「新增数据源」+ `project-menu`「数据源设置可打开」 |
| └ **W4 切片 8** ✅（2026-08-02） | **DefaultSetUp**（设计器「默认项设置」）：`ModalForm`/`ProCard`/`ProForm*` → antd `Modal` + `Form` + `Tabs`；字段/配置两 Tab 与保存提示不变 | dialog DefaultSetUp ProForm | `project-menu`「默认项设置可打开」+「保存有成功提示」 |
| └ **W4 切片 9** ✅（2026-08-02） | **CompareVersion** + **SyncConfig**：详情/比对弹窗与同步配置 `ModalForm`/`ProForm*` → antd `Modal` + `Select`/`Form`/`Radio`；导出 footer 与 testid 不变 | CompareVersion + SyncConfig ProForm | `version.spec` 可视化 diff +「同步配置弹窗可保存升级方式」 |
| └ **W4 切片 10** ✅（2026-08-02） | **RebuildVersion** + **InitVersion** + setting 页 **DefaultSetUp**：`ModalForm`/`ProForm*` → antd `Modal`/`Form`；设置页路由保留 | RebuildVersion + InitVersion + setting DefaultSetUp | `version.spec`「重建版本弹窗可打开」；Pro 文件数 32→29 |
| └ **W4 切片 11** ✅（2026-08-02） | **ResetPassword** + **AddUser** + dialog **ReversePdMan** / **ReverseERD**：`ModalForm`/`ProForm*` → antd `Modal` + `Form`/`Upload.Dragger` | 4 个对话框 ProForm | `import-pdman` / `import-erd` / `project-menu` 导入子菜单 + `account-settings` 修改密码弹窗；Pro 文件数 29→25 |
| └ **W4 切片 12** ✅（2026-08-02） | **SqlApproval** + **BasicSetting** + **GroupSetting** + **notice** + **TableTab**：`ModalForm`/`ProForm`/`ProCard`/`ProList` → antd `Modal`/`Form`/`Tabs`/`List` | 5 个 Pro 文件 | `group-basic-setting` + `group-layout-nav` 权限组 + `project-notice` + `layout-outlet` GroupLayout basic；Pro 文件数 25→20 |
| └ **W4 切片 13** ✅（2026-08-02） | **person / recent / group / dataModels / ExportCommon**：`ProList` → antd `List` + 标题行/`Input.Search`；空态 CTA 与 testid 不变 | 5 个 ProList 页 | `project-surface` + `project-activation` 空态 + `layout-outlet` person + `loading` 列表 loading + `export` 普通导出；Pro 文件数 20→15 |
| └ **W4 切片 14** ✅（2026-08-02） | **approval/order** `ProTable`→Table；**home** 摘 `PageContainer`；**login/register** 摘 `LoginFormPage`；**databaseConfig** 摘 ProTable/`pro-layout` PageContainer；**ExportDDL**（对话框+页）摘 StepsForm | 8 个优先 Pro 文件 | `approval` + `session`/`smoke` 登录注册 + `adr0008-datasource` databaseConfig + `project-menu` 导出DDL + `project-surface` home；Pro 文件数 15→8 |
| └ **W4 切片 15** ✅（2026-08-02） | 末批清零：`account/settings`→HomeLayout；`GroupUser`/`GroupPermission`；双 `ReverseDatabase`+`ReverseTable`；删死码 `StandardFieldLibrary`；移除 `@ant-design/pro-components` + `umi-presets-pro` | 7→0 + 依赖移除 | `account-settings` + `group-layout-nav` + `import-reverse`；`rg …pro-components` = 0 |
| **W5** 登录/分享/404 打磨 | 登录注册品牌壳再打磨；share 顶栏对齐 + 失效态；404/403 去 reset.css + 标准 Result（**Pro 依赖已在 W4 切片 15 移除**） | 视觉/分享/404 | `landing.spec` + 登录 redirect 闭环 E2E；share fork 旅程；404 截图 |
| └ **W5 切片 1** ✅（2026-08-02） | **404/403**：去 `reset.css`；标准 Result 图标；次按钮「打开示例 demo」；删自定义 svg | — | `not-found.spec`「返回首页」+「打开示例 demo」→ `/demo`\|`/s/public-demo` |
| └ **404/403 品牌对齐** ✅（2026-08-03） | **404/403**：改 `AuthBrandShell`（去裸 Result）；与分享失效门同 CTA | — | `not-found.spec` 品牌壳 ~40% + `exception-404-gate` |
| └ **W5 切片 2** ✅（2026-08-02） | **分享失效态**：无效/吊销 token → `Result` 403 +「返回首页」+「打开示例 demo」；成功态 chrome 不动 | — | `share.spec`「无效 token…示例 demo」+「创建→吊销后…」见 Result CTA |
| └ **W5 切片 3** ✅（2026-08-03） | **分享顶栏品牌对齐**：64px `erd-chrome-header` + logo + 项目名 + Fork CTA + 登录/注册链；轻 chrome 无工作台导航 | — | `share.spec`「设计器分享后…」断言 header 64px + logo/登录/注册；`demo.spec` chrome 可见 |
| └ **W5 切片 4** ✅（2026-08-03） | **登录/注册品牌壳**：`AuthBrandShell` 左 40% 暗色面板 + 右 Form；清 `bg2`/`#1677FF`；删 `public/bg2.png` | — | `smoke`「登录页渲染」品牌壳 ~40% + 无硬编码；`session`「去注册」同壳 |

依赖序：W1 ✅ → **W2 → W3 → W4 → W5**。W2 与 W3/W4 无文件重叠可并行；W5 依赖 W1 的顶栏模式沉淀，且必须是最后一波（依赖移除以清零为前提）。

**Pro Strangler 收口判据（修正）**：Pro import 清零不再是波次目标，而是 W2–W5 能力工作的**副产品**；W5 末尾一次性移除依赖。任何一波不得为「凑清零」而平移用户不可见的页面。

## 度量（每波收尾对照）

- **首要**：能力暴露缺口数（product-capability-map 中 missing/thin 项）逐波下降；空壳页面/死码文件数 → 0
- Pro import 文件数：基线 65（S0 冻结）→ 随 W2–W5 自然下降 → W5 末 0（**副产品指标，不为它排波次**）
- 内联 hex 直写：`grep -rn '#[0-9a-fA-F]\{6\}' frontend/src/pages | wc -l` 逐波下降；落地页 less 已改读 `--erd-*`（hex 仅留在 `theme/tokens.ts` / `css-vars.less`）
- 高度/对齐魔法数（`calc(100vh -`、负 margin）：W1 后设计器 0；W5 后全站 0
- 不新增 `any`；不新增 UI 依赖；`yarn build` 体积不增
