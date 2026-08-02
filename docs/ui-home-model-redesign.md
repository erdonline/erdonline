# Home / Model 重设计简报

> 读者：执行下一轮 UI 切片的实现者（Auto）。回答一个问题：Home 与模型页如何从现在「内部工具感」抬到「一流产品感」。
> 约束：ADR-0005（CRUD 壳用 antd，设计域可自研视觉）、ADR-0010（本阶段无暗色切换）、不重写框架、Strangler 逐页抬水位。

## 关键决策：Home 走「工作台式」而非「落地页品牌式」

**结论：Home 是登录后的工作台（Figma-like workspace hub），不延续落地页的深色品牌构图。**

理由：

1. 任务不同。落地页 `/` 的唯一职责是 30 秒惊艳（叙事 + 大图 + CTA）；Home 的唯一职责是让用户**立刻回到建模**（继续上次项目 / 新建）。深色全幅品牌构图会拖慢这一目标。
2. 上下文不同。Home 之上是设计器（亮色、antd、ReactFlow 画布），用户从 Home 到画布每跳一次深色↔亮色都是一次视觉重启。工作台保持亮色，与画布同一世界。
3. 一致性不等于同一张脸。品牌延续通过**字体与点缀色**完成：落地页的 Syne/IBM Plex Sans 字族与克制气质进入工作台，深色仅留在落地页作为「门面」。

落地页 = 深色门面（不动）；Home / 设计器 chrome = 同一套亮色工作台系统。一个系统，两种曝光。

## 现状病灶（代码证据）

| 病灶 | 位置 | 为什么是一流产品不会做的事 |
|---|---|---|
| 彩虹统计卡 | `pages/home/index.tsx` 三处 `Statistic` 分别 `#1890ff`/`#52c41a`/`#faad14`，`Progress` 蓝绿渐变 | 无调色板纪律，dashboard 模板痕迹 |
| 数据自我重复 | 「项目概览」卡（个人/团队统计 + 占比条）与顶部 `ExtraContent` 统计重复 | 一屏两报同一组数，占位不干活 |
| 随机鸡汤轮转 | `HomeLayout` 每 10s 换一条 slogan，页脚 `Space` 塞 3 段次要文案 | 内部工具的自娱自乐，分散注意力 |
| 装饰性背景图 | `DesignLayout` `bgLayoutImgList` 三张 `ant-*.png` 铺在设计器底 | Pro 模板残留，画布之上纯噪音 |
| 嵌套卡片 + 去阴影补丁 | Home 项目 `Card.Grid` 内再套 `Card` + `boxShadow:none` | 用错误组件再打补丁，密度失控 |
| 徽标硬编码 hack | GitHub stars `<img>` 配 `marginTop:-10px` | 布局靠负数魔法数对齐 |
| 画布高度魔法数 | `reactflow-relation.scss` `height: calc(100vh - 104px)` | 顶栏/tabs 一变就破，非 flex 思维 |
| 侧栏过宽 | `DesignLayout siderWidth = 400` | 树最多占 1/5 屏，400px 挤占画布 |

## 视觉方向（tokens）

单一事实源：`frontend/src/theme/tokens.ts`（antd `ConfigProvider.theme`）+ 同值 `theme/css-vars.less`。工作台经 `components/Theme` 注入；设计域 scss / 布局 less 读 CSS 变量，不再散落魔法数。

### 样式策略（token first）

| 优先级 | 做法 | 适用 |
|---|---|---|
| 1 | antd 5 `ConfigProvider` `theme={{ token, components }}`（`theme/tokens.ts`） | 色、圆角、字号、组件级 token |
| 2 | `:root` CSS 变量（`theme/css-vars.less`，与 tokens 同值） | 布局 BEM less、设计域 scss 需读同一色板时 |
| 例外 | 保留 scoped less | **落地页** `pages/landing/index.less`（深色品牌门面）；复杂表格/编辑器（JExcel、QueryTree、version ProList 深 hack 待摘）；业务局部动画 |

禁止：为已摘除的 Pro chrome 新增 `.ant-pro-*` / `.ant-*` 深层覆盖；新颜色勿直写 hex（先加 token）。

### 色彩

```
brand        #DE2910   主操作/选中（沿用现有 logo、VIP、DesignLayout primaryColor，不再发明第二个主色）
brand-hover  #B91E0C
ink-900      #0B1C2C   标题（借落地页 ink）
ink-600      #44525F   正文
ink-400      #8A97A3   次要/说明
line         #E4E7ED   边框（沿用画布节点边框，保持 chrome 与画布同源）
surface      #FFFFFF   卡片
surface-sunk #FAFBFC   页面底（画布 #fafafa 同源，微差可接受，后续统一）
success      #2F8F7B   借落地页 teal，团队/成功语义
warning      #D48806
```

- **禁令**：禁止 `#1890ff/#52c41a/#faad14` 直写；禁止蓝绿渐变 Progress。语义色只表达状态，不装饰统计数字（统计数字一律 ink-900，图标 ink-400）。

### 字体

- Display（Home 问候语、空态大标题）：`Syne, 'PingFang SC', sans-serif`，weight 700，`letter-spacing:-0.02em`
- UI 正文：`'IBM Plex Sans', 'PingFang SC', 'Noto Sans SC', sans-serif`（与落地页同族）
- 字阶：12（辅助）/ 13（表格·节点）/ 14（正文）/ 16（小节题）/ 20（卡片题）/ 28（页面题）/ 40（hero 问候）
- antd token：`fontFamily` 统一；`fontSize: 14`；`fontSizeHeading2: 28` 等按上表映射

### 间距 / 圆角 / 层级

- 4pt 网格；卡片内边距 16/20，区块间距 16/24；消灭 `marginTop:-10px` 类魔法数
- 圆角：`borderRadius: 8`（与画布节点一致），按钮 8，输入 6
- 阴影三级：`sm: 0 1px 2px rgba(11,28,44,.06)`（卡片静态）、`md: 0 4px 16px rgba(11,28,44,.10)`（悬停/浮层）、`lg`（Modal/Drawer 由 antd 默认）
- 层级纪律：**静态卡片用 1px `line` 边框 + sm，悬停才升 md**；禁止 `bordered={false}` + `boxShadow:none` 补丁

## Home 信息架构（改造后）

单页一个任务：**让用户 5 秒内继续建模**。自上而下三个区块：

1. **Hero 条**（替换 `PageHeaderContent` + `ExtraContent`）
   - 左：`Syne 28px`「欢迎回来，{username}」+ 一句话上下文（最近编辑的项目名 + 更新时间）
   - 右：主 CTA `继续上次建模`（brand 实心，直达最近项目画布）+ 次 CTA `新建模型` + 文字链 `从示例开始`
   - 指标只留 3 个安静数字（活跃模型 / 模型总数 / 团队项目），小号、无图标、ink-900，排在问候语下方一行
   - **删除**：随机 slogan 轮转、VIP 图标塞进标题、页脚三段次要文案（版权保留一行即可）
2. **进行中的项目**（主体，替换 `Card.Grid` 嵌套）
   - 桌面 3 列紧凑卡片网格：项目名（16px strong）+ 类型 tag（个人 ink / 团队 teal）+ 描述一行截断 + 「更新于 x 前」+ 卡片右上角悬停显「打开」
   - 整卡可点（一个 `<Link>` 包卡片，不用嵌套 Card）；悬停 1px 边框 → md 阴影 + 上移 1px
   - 空态 = 插画 + 一句话 + 主按钮「新建模型」（沿用 design-principles §4）
   - 「查看全部」保留在卡头右侧
3. **右侧窄栏（xl 8）**
   - 快速操作收编为一张卡，6 项链接压成 2 列小按钮（沿用现有 quickLinks 数据与 testId）
   - **删除「项目概览」整卡**（与 hero 指标重复，pie 图仅 two-slice 无信息量）
   - 公告卡保留但降为 `size=small` 列表 + 「更多公告」链接

Before/After 原则对照：

| 原则 | Before | After |
|---|---|---|
| §4 零摩擦默认 | 首屏 4 张卡 + 2 组重复统计，不知点哪 | 一个主 CTA「继续上次建模」 |
| §1 即时反馈 | 数字彩虹色抢戏，无信息层级 | 指标安静、CTA 唯一高亮 |
| §6 流畅动效 | 静态卡片无悬停态 | 卡片 hover 升层，100ms 过渡 |
| 氛围无 clutter | slogan 轮转 + 装饰图 + 双份统计 | 每区块一职，留白是有意的 |

## Model 页（`/design/table/model` + DesignLayout）信息架构

层级：**画布是主角，chrome 全部退后半步**。

1. **顶栏（64px，不变高）**
   - 左：logo + `项目 ▾` 菜单（现状保留）
   - 中：面包屑去掉（设计器无导航价值）
   - 右：`保存状态 · 保存版本 · 协作者 · 分享` 成组，组间 8px 分隔线；GitHub/公众号收进用户菜单下拉或移出设计器（设计器内不获客）
   - **删除**：`bgLayoutImgList` 三张 `ant-*.png` 背景；水印保留（授权要求）但评估透明度
2. **左树面板**
   - `siderWidth` 400 → **320**，Splitter 默认 20% 保持但 min 240px
   - 面板头：模块名 + 搜索框 + **主按钮「+ 新建」**（下拉：数据表 / 关系图）——当前新建入口埋在树右键，是设计器第一动作，必须露出来
   - 树行高 36→32，图标 ink-400，选中态 brand 左边条 2px（而非整行浅蓝）
   - 底部「项目名 + 版权」footer 删除（顶栏已有项目名，版权留 Home/落地页）
3. **标签栏 + 画布**
   - tabs 高度压到 40px，未保存圆点指示，关闭按钮悬停才显
   - 画布 `height: calc(100vh - 104px)` 魔法数 → flex 填满（`Flex vertical` 内 `flex:1; min-height:0`），顶栏/tabs 改高不再破
   - 空态只留一个 CTA：「新建数据表」主按钮 + 「从数据源逆向」文字链（现状双空态嵌套合并为一个）

Before/After 原则对照：

| 原则 | Before | After |
|---|---|---|
| §3 上下文即工具 | 新建表藏右键 | 面板头「+ 新建」常显 |
| §6 流畅动效 | 高度魔法数易塌 | flex 弹性填满 |
| 氛围无 clutter | 装饰背景图 + 宽侧栏 + 页脚 | 画布最大化，chrome 退后 |
| §2 键盘优先 | 不变（`Cmd+K` 已就绪，简报不触碰） | — |

## 不做（本阶段）

- 不做暗色模式（ADR-0010）；tokens 结构设计为未来可挂 dark 主题，但不实现
- 不换 UI 框架、不动 CRUD 壳 antd（ADR-0005）
- 不动落地页构图、不动画布节点视觉体系（已成体系，仅 token 对齐）
- 不改任何交互行为与路由；纯表现层

## 分片（Strangler，Auto 可逐片实现）

每片独立可 revert；改完走 `yarn build` + 受影响 E2E + UX 走查截图。

| # | 切片 | 范围 | 验证点 |
|---|---|---|---|
| S0 | 依赖升级（前置，ADR-0014）✅ | **只升 umi + antd，不升 `@ant-design/pro-components`**；冻结 Pro 新增用量；`rc-util@5.44.4` 解 peer；chrome 切片 1 已摘 Home/Group | `yarn build` 绿；pro=`2.8.10`；Pro import 文件数 65 ≤ 基线 70 |
| S1 | tokens 地基 ✅ | `theme/tokens.ts` + `ConfigProvider` 接入 + `theme/css-vars.less`；剪除 Pro scaffold 死 less；全站视觉应**无可见变化**或仅圆角/主色归一 | `yarn build` 绿；`layout-outlet.spec` + home 相关 smoke 不回归 |
| S2 | Home hero 条 | 问候 + 主 CTA + 3 指标；删 slogan 轮转、ExtraContent 彩虹、页脚压缩 | Home 截图前后对比；`getByRole('button', {name:'继续上次建模'})` 可达 |
| S3 | Home 项目网格 | 去 Card.Grid 嵌套，紧凑网格 + hover 升层；删「项目概览」卡 | 卡片整卡可点；`home-link-*` testId 用例不回归 |
| S4 | DesignLayout 去杂 | 删 `bgLayoutImgList`、sider 400→320、删 sider footer、徽标对齐去魔法数 | `layout-outlet.spec` 全绿；设计器截图对比 |
| S5 | 树面板头 + tabs 密度 + 画布 flex 高度 | 「+ 新建」露出；tabs 40px；删 `calc(100vh-104px)` | 新建表旅程 E2E（smoke「登录→新建→设计器」）不回归；空态 CTA 唯一 |
| S6 | 走查收口 | 全核心旅程 UX 走查截图 + `regression-checklist.md` 登记 + 本简报勾掉完成片 | `ux-audit.spec` 绿；截图人工过一遍 |

依赖序：S0 → S1 →（S2∥S4）→ S3 → S5 → S6。S2/S3 只动 `pages/home`，S4/S5 只动 `layouts/DesignLayout` 与设计器 chrome，互不阻塞。S0 为依赖层前置：升级 umi+antd 时不得加深 Pro 用量（ADR-0014），S2–S5 顺手摘除所及 chrome 的 Pro 组件（ProLayout/PageContainer/ProCard）。

## 度量（每片收尾对照）

- Home 首屏「可见卡片数」：4 → 3；重复统计组：2 → 1；页脚文案段：3 → 1
- 设计器画布可用宽度：+80px（sider 400→320）；高度魔法数：1 → 0
- 直写彩虹色值：`grep -c '#1890ff\|#52c41a\|#faad14' frontend/src/pages/home` → 0
- 不引入新 `any`；不新增 UI 依赖；`yarn build` 包体积不增（删图应略降）
