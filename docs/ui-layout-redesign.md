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

### Home `/home`（工作台壳 · W2，删除优先）

- 区块级 IA 见 `ui-home-model-redesign.md` §Home 信息架构（hero 条 + 3 列项目网格 + 右窄栏）；本波**只做删除**：重复统计卡（「项目概览」）、slogan 轮转、`components/Radar/`、`_mock.ts`、未渲染的 `Pie` config 与 `@ant-design/charts` 死 import；hero 主 CTA「继续上次建模」保留
- 网格 hover 升层等密度细节降为顺手活，不单列切片；禁止为 Home 新增视觉设计工时
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

### 设计器 chrome + model（设计器壳 · W1 ✅ / W2 收尾）

- W1：DesignLayout 摘 ProLayout → antd Layout（**✅**，见 CHANGELOG 2026-08-02）；顶栏保留 save/share/presence/`homeRightContent`/项目菜单
- W2 收尾（删除 + 暴露性质）：删 `bgLayoutImgList`、删 sider footer；sider 400→320；tabs 40px；画布 `calc(100vh-104px)` → flex 填满；面板头「+ 新建」常显（新建表入口现埋树右键，属能力暴露，细节见 tokens 简报 S4/S5）

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

### 分享 share（品牌壳-lite · W5）

- 现状：只读画布 + 顶栏， fork 入口已通（P3a ✅）
- 目标：顶栏对齐设计器壳（64px、logo + 项目名 + 「Fork 到我的项目」主按钮 + 「登录/注册」文字链）；只读水印/提示条用 antd `Alert` type info 一条；链接失效态 `Result` 403 + 「打开示例 demo」
- 分享页是给陌生人的产品门面，保持轻 chrome，不加工作台导航

### 404 / 403（品牌壳 · W5）

- 现状：antd `Result` + 自定义 `no-found.svg`，引了整份 `antd/dist/reset.css`（冗余，ConfigProvider 已全局注入）
- 目标：删 `import 'antd/dist/reset.css'`；`status="404"` 标准图标（删自定义 img 或保留 svg 但去 `title="404"` 重复）；extra 加次按钮「打开示例 demo」；403 同构

## 重估结论（2026-08-02 v2）：三个被推翻的假设

对照 vision（北极星 = 每周产生版本保存的活跃项目数）、ADR-0012（agent 可读事实源 = 版本 + 分享 + 审计）与后端控制器/ Flyway 现状复核，原 W2–W5 排序基于三个错误假设：

1. **「Home 密度值得单列一波」错。** Home 的职责是 5 秒路由回建模；北极星杠杆（示例项目直达「保存第一个版本」、顶栏「保存版本」常驻、远端 sync 提示直达版本页）已于 2026-08-02 全部 ✅。Home 剩余问题是**死代码与重复统计**（`components/Radar/`、`_mock.ts`、未渲染的 `Pie` config、hero 与「项目概览」卡重复报同组 statistic）——这是**删除**问题，不是密度设计问题。装饰性密度抛光对北极星零贡献。
2. **「逐页抬水位 = 按页平移组件」错。** 真实缺口是**能力暴露**：后端能做而 UI 埋没或缺失（见下节）。原 W3–W5 的大部分工作量是 `ProList→List` / `ProForm→Form` 的用户不可见平移。
3. **「Pro import 清零是当前最高优先度量」错。** ADR-0014 已冻结 Pro@2.8.10 并容忍并存；依赖移除是卫生收尾，不应驱动三个波次。摘 Pro 改为搭「能力暴露 / 删空壳」的便车，最后一次性移除依赖（单独 commit）。

### 后端已能、UI 埋没或缺失（先补暴露，再谈美化）

| 能力 | 后端证据 | UI 现状 | 缺口 |
|---|---|---|---|
| 只读分享**吊销/管理** | `POST /share/revoke`（ProjectShareController）；security-model 明文「创建/吊销需登录且为项目创建人」 | `ShareProjectButton` 只有创建+复制；无吊销、无已有链接查看 | **missing** — 安全模型承诺的一半不可达 |
| 跨版本 diff **导出** | 版本 diff 可视化 ✅（CompareVersion）；db_change.tag 多标签 ✅（Flyway V1/V2） | CompareVersion「导出」Markdown/SQL ✅（W3 切片 1） | ✅ |
| 数据字典 | `/dataDict` 全 CRUD（DataDictController） | 实验页已删（W2）；本阶段无 UI | **thin** — 本阶段不扩，但也不许为其抛光 |
| 审批流 | approval CRUD + SQL 信任链（SQL 失败不落通过 ✅） | 入口深埋设计器 version/order/approval tab | thin — 可用，W3 平移时顺带理顺入口 |
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
| **W3** 版本域收口（旧 W4 提前，目标改写） | version ProList → antd List ✅；**跨版本 diff 导出** ✅；审批/order 表单 `ProForm*` → antd Form 平移；审批入口理顺 | 版本/审批域 ProForm（version ProList 已摘） | 版本「保存→打标签→diff→导出→回滚」旅程 E2E；审批「提交→通过→SQL 失败不落通过」回归 |
| └ **W3 切片 1** ✅（2026-08-02） | **跨版本 diff 导出**：diff 弹层「导出」主按钮落 Markdown（模型变更+SQL），下拉「仅导出 SQL」；复用 `File.save`；顺带移除零引用 `bizcharts` / `@ant-design/plots` | — | `version.spec` 详情弹层 download `.md` + toast；`formatVersionDiffMarkdown.test.ts` |
| └ **W3 切片 2** ✅（2026-08-02） | version `ProList` → antd `List`：工具栏（脏标记/数据源/标签筛选/新增/对比/同步配置/重建）+ 行（版本号 strong + 同步 Tag + 标签 chips + 变更摘要 + 行尾操作）；空态「还没有版本」+「保存第一个版本」主按钮 | version ProList | `version.spec`「无数据源也可新增版本」空态 CTA + 列表行不回归；`rg ProList pages/design/version` = 0 |
| **W4** 项目列表 + 数据源（旧 W3，降为纯平移波） | dataModels + project/* `ProList` → antd List；databaseConfig `ProTable`/`PageContainer` → antd Table + 工作台壳；import/export/setting/account 剩余 `ProForm*` 逐个平移（含保存版本 AddVersion） | 4 页 ProList + 1 ProTable + 剩余 ProForm | 项目「列表→打开→重命名→删除」E2E；数据源「新建→ping→删除」E2E；每对话框对应 E2E 不回归 |
| └ **W4 切片 1** ✅（2026-08-02） | **AddVersion**（保存版本弹窗）：`ModalForm`/`ProForm*` → antd `Modal` + `Form`；标签 `Select mode=tags` + 逗号分隔、校验与 testid 不变 | AddVersion ProForm | `version.spec` 保存路径（无数据源新增 / 多标签 / 可视化 diff 内 saveVersion） |
| └ **W4 切片 2** ✅（2026-08-02） | **RenameVersion**（编辑版本弹窗）：`ModalForm`/`ProForm*` → antd `Modal` + `Form`；回填/非最新只读版本号/失败不关窗；testid 不变 | RenameVersion ProForm | `version.spec`「重命名描述与删除版本」 |
| └ **W4 切片 3** ✅（2026-08-02） | **AddProject**（新增项目弹窗）：`ModalForm`/`ProForm*` → antd `Modal` + `Form`；个人/团队 `type` 初值；tags Select + testid 不变 | AddProject ProForm | `smoke` / `project-activation` `createPersonProject` |
| └ **W4 切片 4** ✅（2026-08-02） | **RenameProject**（修改项目弹窗）：`ModalForm`/`ProForm*` → antd `Modal` + `Form`；tags 拆分回填；失败不关窗；testid 新增 | RenameProject ProForm | `project-surface`「修改弹窗可改名并回列表」 |
| └ **W4 切片 5** ✅（2026-08-02） | **死码清除**：零挂载 `DataDomain`/`DynamicDialog` + `dialog/module|entity|database|dataType` ModalForm 整簇删除（模型/表已由 `EntityModal` antd Form+Modal 承接；勿平移不可见页） | 死 ModalForm 簇 | `empty-projectjson`「无 JSON 团队项目可新增模型」；`rg dialog/(module\|entity\|database\|dataType)` = 0 |
| **W5** 登录/分享/404 打磨 + Pro 依赖移除 | 登录注册左右分栏品牌壳；share 顶栏对齐 + 失效态；404/403 去 reset.css + 标准 Result；**grep 清零后一次性从 `package.json` 移除 `@ant-design/pro-components`（单独 commit）** | LoginFormPage + 全部残留清零 | `landing.spec` + 登录 redirect 闭环 E2E；share fork 旅程；404 截图；`grep -r "@ant-design/pro-components" src` = 0 |

依赖序：W1 ✅ → **W2 → W3 → W4 → W5**。W2 与 W3/W4 无文件重叠可并行；W5 依赖 W1 的顶栏模式沉淀，且必须是最后一波（依赖移除以清零为前提）。

**Pro Strangler 收口判据（修正）**：Pro import 清零不再是波次目标，而是 W2–W5 能力工作的**副产品**；W5 末尾一次性移除依赖。任何一波不得为「凑清零」而平移用户不可见的页面。

## 度量（每波收尾对照）

- **首要**：能力暴露缺口数（product-capability-map 中 missing/thin 项）逐波下降；空壳页面/死码文件数 → 0
- Pro import 文件数：基线 65（S0 冻结）→ 随 W2–W5 自然下降 → W5 末 0（**副产品指标，不为它排波次**）
- 内联 hex 直写：`grep -rn '#[0-9a-fA-F]\{6\}' frontend/src/pages | wc -l` 逐波下降；W5 后仅落地页 less 保留品牌色
- 高度/对齐魔法数（`calc(100vh -`、负 margin）：W1 后设计器 0；W5 后全站 0
- 不新增 `any`；不新增 UI 依赖；`yarn build` 体积不增
