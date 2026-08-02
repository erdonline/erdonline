# 全站布局重设计总纲

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
2. **工作台壳（Workspace Shell）**：顶栏 64px（logo + 主导航 + 右侧用户区）+ 内容区 `max-width: 1200px` 居中 + 页脚一行。用于 Home、dataModels、project/*、databaseConfig、account/settings。实现 = `HomeLayout`（GroupLayout 已对齐，antd Layout，Pro 已摘）。
3. **设计器壳（Designer Shell）**：顶栏 64px + 左树 320px + tabs 40px + flex 画布。用于 `/design/*`（含 version / import / export / setting 标签页）。实现 = `DesignLayout`（antd Layout，W1 已摘 Pro）。

**禁止发明第四种壳**；禁止回到 ProLayout/PageContainer 包裹任何页面（ADR-0014）。

## 密度规范（全站统一）

- 4pt 网格；页面左右 padding 24，区块间距 16/24；卡片内边距 16/20
- 表格：`size="middle"`，行高由 antd token 控制，禁止自定义行高魔法数
- 表单：`layout="vertical"`（设置类）或弹窗内 `labelCol 6`；标签 13px，必填星号 brand 色
- 列表行高 56（项目列表）/ 48（数据源表格）；树行高 32
- 字阶沿用 tokens 简报：12/13/14/16/20/28/40，统计数字一律 ink-900、无彩虹色

## 导航模式

- **全局**：工作台壳顶栏一级导航（首页 / 项目 / 数据源配置 / 账号），当前项 brand 下划线 2px，悬停 ink-900
- **设计器内**：顶栏 `项目 ▾` 菜单承担页内跳转（版本/导入/导出/设置 = 设计器 tabs，不是独立页面导航）；面包屑已废（设计器无导航价值）
- **层级收口**：项目列表卡片整卡 `<Link>` 直达设计器；设计器返回走顶栏 logo/项目菜单，不新增「返回」按钮

## 空态规范（每页一句话 + 一个主 CTA）

| 页面 | 空态 |
|---|---|
| Home 项目区 | 插画 + 「新建模型」主按钮 + 「从示例开始」文字链 |
| dataModels（各 tab） | 「还没有项目」+ 「新建项目」主按钮；团队 tab 附「去创建团队」文字链 |
| databaseConfig | 「还没有数据源」+ 「新建数据源」主按钮 |
| 设计器画布 | 「新建数据表」主按钮 + 「从数据源逆向」文字链（唯一 CTA，合并双空态） |
| version 列表 | 「还没有版本」+ 「保存第一个版本」主按钮（与顶栏入口同一动作） |
| share（链接失效） | `Result` 403/404 + 「打开示例 demo」次按钮 |
| 404 | 见下「逐页」 |

统一用 antd `Empty`/`Result`，插画沿用现有 svg 资产；空态 CTA 必须可达（`getByRole('button', { name })`）。

## 逐页方案

### 落地页 `/`（品牌壳 · 不动构图）

- 保持深色全幅品牌构图与 `landing-hero.jpg`（roadmap P5 已定）；本轮**只做 token 对齐**：字族/点缀色与 tokens 同源，禁新增紫色渐变/AI slop
- 页脚一行版权，链接收进「资源」列

### 登录 / 注册（品牌壳 · W5）

- 现状：`LoginFormPage`（Pro）+ `bg2.png` 背景 + 内联 style 魔法色（`#f16824` 活动条、`#1677FF` 按钮）
- 目标：左 40% 深色品牌面板（落地页同源：logo + 一句话叙事 + 画布截图缩略），右 60% 白色 antd `Form`（用户名/密码、主按钮「登录」brand 实心、文字链「注册新账号 / 先看演示」）
- 摘 `LoginFormPage` → 纯 antd `Form` + `Card`（平级无阴影）；`activityConfig` 活动条改为品牌面板内一行文字链；清除全部内联 hex
- 注册页同构复用；`redirect` 闭环逻辑不变

### Home `/home`（工作台壳 · W2）

- 区块级 IA 见 `ui-home-model-redesign.md` §Home 信息架构（hero 条 + 3 列项目网格 + 右窄栏）；本波只做**密度落地**：删剩余 Pro 组件（`PageHeaderContent`/`ExtraContent` 残留）、卡片网格 hover 升层、统计数字去彩虹
- 验证锚点：`getByRole('button', { name: '继续上次建模' })`、`home-link-*` testId

### 项目列表 dataModels + project/*（工作台壳 · W3）

- 现状：`ProList`（dataModels / project/person / project/recent / project/group）卡片列表，`avatar:'/logo.svg'` 占位，操作按钮堆在 `actions`
- 目标：antd `List` + 行内布局：左 logo 32px + 项目名（16 strong，整行 `<Link>` 直达设计器）+ 类型 Tag（个人 ink / 团队 teal）+ 描述一行截断 + 右「更新于 x 前」+ 悬停显行尾操作（重命名/复制/设置/删除收进 `Dropdown`）
- tab（最近/个人/团队）用 antd `Tabs` 置内容区头部；排序 `Select` 右对齐；分页沿用
- 摘全部 `ProList`；删除项目二次确认沿用（已有）
- project/group 子页（成员/权限/设置）同波顺带：`PageContainer` → 工作台壳内容区 + antd `Card` 分节

### 数据源配置 databaseConfig（工作台壳 · W3）

- 现状：`PageContainer` + `ProTable`，功能已完整（状态 Badge / ping / Drawer 表单 / 批量删）
- 目标：摘 `PageContainer` → 工作台壳；`ProTable` → antd `Table`（columns 平移，工具条改为标题行 + 右侧「新建数据源」主按钮 + 搜索 `Input.Search`）；Drawer 表单内的 `ProForm*` 留到 W4 统一摘
- 列宽用 `Table` 默认自适应，禁止定死 px 总宽

### 设计器 chrome + model（设计器壳 · W1 ✅ 进行中 / W2 收尾）

- W1：DesignLayout 摘 ProLayout → antd Layout（**进行中，见 CHANGELOG 2026-08-02**）；续做：sider 400→320、删 `bgLayoutImgList`、删 sider footer、tabs 40px、画布 `calc(100vh-104px)` → flex 填满、面板头「+ 新建」常显（细节见 tokens 简报 S4/S5）

### 版本 version / 导入 import / 导出 export / 设置 setting（设计器壳标签页 · W4）

- 现状：`design/version` 用 `ProList` 深 hack（tokens 简报标记「待摘」）；import/export/setting 的对话框与面板大量 `ProForm*`（ReverseDatabase、ExportDDL、DatabaseSetUp、DefaultSetUp 等）
- 目标：
  - version 列表 → antd `List`/`Table`：版本号（strong）+ tag chips + 描述截断 + 时间 + 行尾操作 Dropdown（重命名/diff/导出/审批）；diff/审批子页同壳
  - 所有 `ProForm*` → antd `Form` + `Form.Item`：字段、校验、`onFinish` 平移；弹窗宽度统一 520/720 两档
  - 表单按钮区：主按钮右置 brand，取消左置文字钮；危险操作（重建版本）二次确认沿用
- 原则：**一次只摘一个对话框**，平移不改行为；每摘一个跑该旅程 E2E

### 账号 account/settings（工作台壳 · W4）

- 现状：Pro 设置页骨架（`account/settings` + `components/base` 等 `ProForm`）
- 目标：antd `Tabs`（左侧 vertical：基本资料 / 修改密码）+ `Form layout="vertical"`；头像上传沿用；摘全部 ProForm；删除「地理/电话」等无后端字段（先 grep 确认无引用）

### 分享 share（品牌壳-lite · W5）

- 现状：只读画布 + 顶栏， fork 入口已通（P3a ✅）
- 目标：顶栏对齐设计器壳（64px、logo + 项目名 + 「Fork 到我的项目」主按钮 + 「登录/注册」文字链）；只读水印/提示条用 antd `Alert` type info 一条；链接失效态 `Result` 403 + 「打开示例 demo」
- 分享页是给陌生人的产品门面，保持轻 chrome，不加工作台导航

### 404 / 403（品牌壳 · W5）

- 现状：antd `Result` + 自定义 `no-found.svg`，引了整份 `antd/dist/reset.css`（冗余，ConfigProvider 已全局注入）
- 目标：删 `import 'antd/dist/reset.css'`；`status="404"` 标准图标（删自定义 img 或保留 svg 但去 `title="404"` 重复）；extra 加次按钮「打开示例 demo」；403 同构

## 分波（Auto 可逐波执行）

每波独立可 revert；收尾 `yarn build` + 受影响 E2E + UX 走查截图 + 更新 CHANGELOG「验证点」。

| 波 | 范围 | 摘 Pro | 验证点 |
|---|---|---|---|
| **W1** 设计器壳 | DesignLayout → antd Layout；sider 320；去装饰图；tabs 密度；画布 flex 高度；「+ 新建」露出 | ProLayout/PageContainer/ProCard/WaterMark ✅（进行中） | `layout-outlet.spec` + smoke「登录→新建→设计器」；设计器截图对比 |
| **W2** Home 密度 | hero 条 + 项目网格 + 右窄栏收口；删重复统计卡与 slogan 轮转（按 tokens 简报 S2/S3） | Home 残留 Pro（PageHeaderContent 等） | `getByRole('button', {name:'继续上次建模'})` 可达；`home-link-*` 不回归；彩虹色 grep → 0 |
| **W3** 项目列表 | dataModels + project/* `ProList` → antd List；databaseConfig `ProTable`/`PageContainer` → antd Table + 工作台壳 | 4 页 ProList + 1 ProTable + PageContainer | 项目「列表→打开→重命名→删除」E2E；数据源「新建→ping→删除」E2E |
| **W4** 版本/设置表单 | version ProList → antd List；import/export/setting/account 对话框与面板 `ProForm*` → antd Form（逐个平移） | 约 30 个 ProForm 文件 + version ProList | 版本「保存→diff→导出」旅程；设置「改资料→改密码」旅程；每对话框对应 E2E 不回归 |
| **W5** 登录/分享/404 打磨 | 登录注册左右分栏品牌壳；share 顶栏对齐 + 失效态；404/403 去 reset.css + 标准 Result | LoginFormPage（最后一块 Pro 页面级组件） | `landing.spec` + 登录 redirect 闭环 E2E；share fork 旅程；404 截图 |

依赖序：W1 → W2 → W3 → W4 → W5。W3 与 W4 无文件重叠可并行；W5 依赖 W1 的顶栏模式沉淀。

**Pro Strangler 收口判据**：W5 完成后 `@ant-design/pro-components` import 文件数 → 0，依赖可从 `package.json` 移除（单独一个 commit）。

## 度量（每波收尾对照）

- Pro import 文件数：基线 65（S0 冻结）→ W1 后 ≤ 45 → W3 后 ≤ 35 → W5 后 0
- 内联 hex 直写：`grep -rn '#[0-9a-fA-F]\{6\}' frontend/src/pages | wc -l` 逐波下降；W5 后仅落地页 less 保留品牌色
- 高度/对齐魔法数（`calc(100vh -`、负 margin）：W1 后设计器 0；W5 后全站 0
- 不新增 `any`；不新增 UI 依赖；`yarn build` 体积不增
