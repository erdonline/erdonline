# 体验设计原则 / Design Principles

> 面向所有贡献者：写任何 UI 代码之前必读。
> 每条原则附正例与反例（反例均来自项目真实历史代码，已被修正或列入修正计划）。

## 1. 即时反馈

每个操作 100ms 内有可见响应；能乐观更新就不等服务器；异步操作必须有状态。

- ✅ 自动保存显示"保存中… / 已保存 12:30 / 保存失败，点击重试"
- ❌ 登录失败无任何提示，用户以为网络断了（历史问题）
- ❌ 静默自动保存，用户不知道建模成果是否已落库（历史问题）

## 2. 键盘优先

完整快捷键体系 + `Cmd/Ctrl+K` 命令面板。高手应能不碰鼠标完成建模。

- ✅ `Cmd+Z/Y` 撤销重做、`Delete` 删除选中、`Cmd+F` 搜索表、`?` 呼出快捷键速查卡
- ❌ undo/redo 方法已实现却从未接线到 UI 和键盘（历史问题）

## 3. 上下文即工具

右键菜单、悬停操作、内联编辑优先；能不用弹窗就不用弹窗。

- ✅ 画布表节点上直接内联编辑字段，Tab 跳下一行
- ✅ 关系基数：点边标签 chip 内联选 `1:1`/`1:n`/`n:1`/`n:n`（不弹窗）；拖连线默认 `n:1`；两端 Crow's foot（IE）随基数变
- ✅ Frame 标题双击内联重命名
- ❌ 建一条关系要打开弹窗手工配置基数（历史问题）
- ❌ 关系线只有闭合箭头、扫一眼读不出基数（历史问题）
- ❌ 双击打开表的方法存在但从未传入组件，双击是死链（历史问题）

## 4. 零摩擦默认

模板、智能默认值、一切皆可拖拽；任何页面都不该让用户面对无从下手白屏。

- ✅ 新建项目向导：空白 / 导入数据库 / 从模板，三步内完成
- ✅ 空态 = 插画 + 一句话引导 + 行动按钮
- ❌ 首页快捷入口指向不存在的路由（404）（历史问题）

## 5. 掌控感

一切可撤销；危险操作先预览或确认；用户永远可以回到过去。

- ✅ 删除画布表前确认，并说明"表本身不会被删除，可重新拖入"
- ✅ 版本时光机：任意历史版本可 diff、可恢复
- ❌ 右键删除表/连接线立即执行，无确认（历史问题）

## 6. 流畅动效

画布操作跟手（60fps）；页面过渡有动画；加载用骨架屏而不是转圈。

- ✅ 悬浮工具栏实时显示缩放比例，一键适应屏幕
- ✅ CRUD / 进设计器等待用 `PageSkeleton`（或列表 `loading`）；按钮级异步可用 Spin / Button loading
- ❌ 用 `position: fixed` 把提示文字钉死在视窗上，不随布局响应（历史问题）

## 7. 图本身可读可分享（ADR-0016）

关系图是产品门面：节点/边/背景用 `erd-*` tokens（与 Home/落地同语言）；密度与字体让人愿意截图分享。UI 美是一等公民，不是可永久扔的 P2。

- ✅ 表头 ink、选中 brand 描边、边 stroke 走 ink600；禁散落默认蓝 `#4096ff` 当画布主色
- ✅ 逆向 / DBML 导入按 FK 做 dagre 分层布局（外键侧→主键侧，默认 `nodesep` 56 / `ranksep` 108），不是无关联网格散点
- ✅ 公开 demo / 示例主图手排收紧（列间距约 28px、Frame padding 20），截图不「空旷」；分享只读隐藏 `relationNoShow`；多图项目分享页可切 `diagrams[]`（与设计器同源，只读无新建/重命名）
- ✅ 表名/字段名等宽（`--erd-font-mono`）；PK 琥珀 / FK 青绿徽章；表头 `surfaceMuted` + 字段发丝分隔 + PK 左边条；自定义 `erdSmooth`（圆角肘 + 同表对多 FK 分流 + 中间表障碍避让 + 干道 bundling + 两弯/mid-corridor + 稀疏 Hanan A* + 密障绕行竞短 + 高度数 hub 按对端 Y 扇出 + **几何择柄**：竖叠同列同侧短 U，消固定右→左绕圈）+ **Crow's foot 端点**（IE：one=竖线 / many=鸦爪，随 `association.relation`）；设计器与分享只读同路由；字段行 `min-height` 22 / `FIELD_ROW_H` 26（再压一档，截图更密）
- ✅ Frame 色板走 `frameFill*` tokens（success/ink/warning/brand 浅底轮换）；禁 demo/画布散落 Ant 蓝 Frame；命令面板 hover 禁 `#f0f5ff`
- ✅ 边基数标签 chip：白底 `surface` + `line` 描边 + `ink600`；padding `[4,2]` / radius 3（密图再压）；禁与画布 sunk 同色、禁整块半透明冲淡字；**可点选改基数**（设计器）
- ✅ Frame 标题栏 chrome：height 22 / label 11 / meta 10；轻表面条可读；禁占高顶栏挤成员；**双击标题重命名**
- ✅ 边路由：同侧短 U 外肘避障（`sameSide`）；bypass 叠表缝显式 mid-corridor；绕行倍率 1.85 竞短
- ✅ MiniMap：底色 `surfaceSunk` + `line` 描边；禁 RF 默认白底与 sunk 画布割裂
- ✅ Controls：按钮 22×22、`surface` + `line` 描边圆角；禁 RF `#fefefe` 松柱与画布割裂
- ✅ 画布工具栏：按钮 height 22 / font 11 / padding 0 8；禁 5×12 松按钮盖截图
- ✅ 选中光晕：表 / Frame 共用 `--erd-selection-ring`（brand a18）；禁 Frame a12 弱环分叉
- ✅ 导入/逆向后 Frame 自动建议：表名前缀（`sys_*`/`biz_*`）优先，否则 ≥2 连通分量；禁单前缀/单分量整图大框
- ✅ 空态构图：设计器欢迎与关系图画布共用 ER 剪影（`ErdEmptyDiagram`）+ 一句引导 + 主 CTA「新建第一张表」+ 次 CTA「导入 DBML」+「从数据源逆向」文字链；禁粉红卡通 / 空态 MiniMap clutter
- ✅ 空态面板密度：padding 14/18/12、max-width 300、标题 14 / CTA height 26、剪影 compact 132；禁 28/32 松卡片盖首屏
- ✅ 命令面板密度：宽 ≤440、max-height 360、输入 36/13、行 pad 6/8 / font 12、footer 10；禁 48 高输入 + 10/12 松行盖快捷回路
- ✅ 实体新建弹层密度：宽 400、标题 13、body pad 12/14、表单项 margin 12、输入/OK 高 28 / font 12；禁默认 520 宽 + 24 pad 松卡片盖建模回路
- ✅ 导入/导出弹层密度：共享 `.erd-io-modal`（标题 13/22、body pad 12/14、footer 钮 28、Select/单行 Input 28、Dragger 收紧）；禁默认头脚松距盖项目菜单回路
- ✅ 左树行高密度：`QueryTree` 行高 22 / font 12、工具条 pad 8 / 控件 28；虚拟滚动 `itemHeight` 与视觉对齐；禁默认 ~28 松行
- ✅ CommonTabs / 表设计签头密度：签栏 `--erd-tabs-h` 28、字 12；表头 pad 4×12 / title 13；禁历史 40 松栏 + 10×16 签头
- ✅ 版本列表行密度：行 pad 4×8、标题 13/行高 22、工具条控件 28；禁 8×12 松行 + 16 标题
- ✅ 普通导出页密度：`.export-common-page` 标题 13/22、卡片 pad 8×10 / gutter 8；禁 16 pad + Title level4 松卡片
- ✅ 设置页 chrome 密度：`.setting-common-page` 标题 13/22、页 pad 8×12、表单项 margin 12、Input/按钮 28；菜单「默认项设置」挂 `.erd-io-modal`；禁默认 Form 24 间距 + 大号控件
- ✅ 数据库配置页密度：`.database-config-page` 标题 13/22、页 pad 8×12、工具条钮 28、表行 pad 4×8；抽屉表单同阶；菜单「数据源设置」挂 `.erd-io-modal`；禁 Title level4 + 松 Card
- ✅ 账号设置 / Home 项目卡密度：`/account/settings` 标题 13/22、页 pad 8×12、表单/安全行 28；Home「进行中的项目」卡 pad 10×12 / 标题 13/22；修改密码挂 `.erd-io-modal`；禁 20 标题 + 14 松行 / 16×18 松卡
- ✅ 项目列表行密度：个人/最近/团队/公告共用 `.project-list-page`（标题 13/22、行 pad 4×8、工具条/打开钮 28）；禁 Title level4 + List `large`
- ✅ 分享 meta 密度：hint/描述 12/18、meta gap 4、描述单行 ellipsis；stage pad 8×12；禁 13px + 12 间距抢画布高
- ✅ 分享展开表清单密度：标题 13/22、panel pad 8×12、表头/行 pad 4×8 / font 12（行高 ∈22–28）；默认仍折叠；禁 16 pad + 14 标题松表
- ✅ 导入后首屏：DBML 导入直开关系图 + `fitView`（多表 padding 0.08 / maxZoom 1.15，与分享只读同密）；切图/一键布局同样铺满
- ✅ 竞品对照子页 `/compare`：诚实差异化（协作/版本/开放/自部署）；落地保留摘要表；禁夸大、禁复刻 dbdiagram 叙事
- ✅ Home / Group / Design 三壳共用 `erd-chrome-*`：顶栏 64、`--erd-*` 表面；禁全页 Watermark / shields 徽标 clutter
- ✅ Home 一构图：hero CTA 簇 + 项目网格锚点；禁快速操作竖排中文磁贴 / 陈旧公告占位；导航选中走 brand
- ✅ 设计器下拉用 antd `Menu`/`Dropdown` `items`：单行标题、紧凑密度；弹窗外置；禁「大图标+副标题」卡片项；子菜单不得串台（导出≠导入）
- ❌ 画布一套 Ant 蓝、Home 一套品牌红，截图不像同一产品（历史问题）
- ❌ 项目「导出」旁弹出逆向/PdMan 等导入项（历史问题）
- ❌ 导入多表后按序号铺网格，关联线交叉成毛线团（历史问题）
- ❌ 关联字段无 FK 标识、边无线头，截图像白板连线（历史问题）
- ❌ 表头散落 `#f3f5f7`、字段糊成一块无行界（历史问题）
- ❌ 竖叠同列表仍固定右源左靶，边绕一大圈（circle-route，历史问题）
- ❌ Frame / 命令面板散落 Ant 蓝浅底（`#f0f5ff` / `rgba(37,99,235)`，历史问题）
- ❌ 边标签与画布同色 sunk + 整块 0.94 opacity + ink400，截图基数看不清（历史问题）
- ❌ MiniMap 默认白底 `#fff` 贴在 sunk 画布上成白块（历史问题）
- ❌ Controls 默认 `#fefefe` 松柱（content-box 26px）与 sunk 画布割裂（历史问题）
- ❌ 画布工具栏 `padding: 5px 12px` 松按钮与 22 chrome 不同阶（历史问题）
- ❌ 空态面板 `padding: 28px 32px` 松卡片盖首屏（历史问题）
- ❌ 命令面板输入 height 48 / 行 pad 10×12 松卡片，与 22 chrome 不同阶（历史问题）
- ❌ 实体新建弹层默认 520 宽 + Form 24 间距松卡片，与 22 chrome 不同阶（历史问题）
- ❌ 导入/导出 Modal 默认头脚松距 + 大号控件，与 22–28 chrome 不同阶（历史问题）
- ❌ 左树默认 ~28 行高 + 16 工具条松距，与 22 chrome 不同阶（历史问题）
- ❌ CommonTabs 栏 40px + 表设计签头 10×16 松距，与 22 chrome 不同阶（历史问题）
- ❌ 版本列表 8×12 松行 + 16 标题，与 22–28 chrome 不同阶（历史问题）
- ❌ 普通导出页 16 pad + Title level4 松卡片，与 22–28 chrome 不同阶（历史问题）
- ❌ 设置页默认 Form 24 间距 + 大号控件，与 22–28 chrome 不同阶（历史问题）
- ❌ 账号设置 20 标题 + 14 松行 / Home 项目卡 16×18 pad，与 22–28 chrome 不同阶（历史问题）
- ❌ 个人/最近/团队/公告列表 Title level4 + List large 松行，与 22–28 chrome 不同阶（历史问题）
- ❌ 分享页 hint 13px + 12 间距 / 描述无 ellipsis 抢画布高（历史问题）
- ❌ 分享展开表清单 16 pad + 14 标题 + antd 默认松行，与 22–28 / project-list 不同阶（历史问题）
- ❌ 表选中 a18、Frame 选中 a12 光晕分叉（历史问题）
- ❌ 工作台铺满水印 + GitHub stars 外链图，模板脸盖过产品感（历史问题）

---

## 评审检查单

提交涉及 UI 的 PR 前自问：

1. 操作失败时用户会看到什么？
2. 这个操作能用键盘完成吗？
3. 这个弹窗能不能用内联/右键替代？
4. 第一次来的用户知道这个页面该点哪吗？
5. 误操作能撤销吗？危险操作有确认吗？
6. 等待超过 300ms 的地方有加载态吗？
