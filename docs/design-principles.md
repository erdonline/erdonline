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

- ✅ 画布表节点上直接内联编辑字段：hover ✎ / 双击进编辑；空名有 toast 不静默丢改动；Enter 提交；Escape 取消未提交改名（拦 blur，禁止取消变落盘）；Tab/Shift+Tab 跳下一/上一行；末行 Tab 开新建字段；仅改类型/PK/非空/自增/隐藏即时落盘（save-status）；隐藏有 toast + 表底「已隐藏」可恢复；默认值（defaultValue）编辑态次行内联（主栏已满不挤横向）；浏览态选中字段 Delete/Backspace（及 ×）二次确认删除，编辑态 Backspace 只改字
- ✅ 关系基数：点边标签 chip 内联选 `1:1`/`1:n`/`n:1`/`n:n`（不弹窗）；拖连线默认 `n:1`；两端 Crow's foot（IE）随基数变
- ✅ Frame 标题双击内联重命名
- ❌ 建一条关系要打开弹窗手工配置基数（历史问题）
- ❌ 关系线只有闭合箭头、扫一眼读不出基数（历史问题）
- ❌ 双击打开表的方法存在但从未传入组件，双击是死链（历史问题）

## 4. 零摩擦默认

模板、智能默认值、一切皆可拖拽；任何页面都不该让用户面对无从下手白屏。

- ✅ 新建项目向导：空白 / 导入数据库 / 从模板，三步内完成
- ✅ 空态 = 插画 + 一句话引导 + 行动按钮
- ✅ 非空画布工具栏「新建表」一键上图（`canvas-create-table`）；不必再绕左树或 Cmd+K
- ✅ 拖连线失败有 toast：重复关联 / 非法锚点（同类型或未对准接入点）；空白处松开=取消不打扰
- ✅ 字段行 ✎ 与表头改名同形；改已有字段空名 toast「字段名不能为空」；Enter 提交；Escape 取消（不经 blur 落盘）；Tab 字段名→中文名→类型→默认值→跳行；末行 Tab 新建；中文名（chnname）/默认值（defaultValue）行内编辑；类型/PK/非空/自增/隐藏 onChange 即时 save-status；隐藏 toast + 表底恢复；选中字段 Delete/Backspace / × 二次确认删
- ✅ 表头 ✎ / 双击：表名 + 实体中文名双栏内联；Tab 表名→中文名→提交；Escape 丢弃（拦 blur）；仅改 chnname 亦 save-status
- ✅ 表节点底栏并排「字段 | 索引 | 元数据」→ 表设计对应签（`canvas-open-field` / `canvas-open-index` / `canvas-open-code`）；禁画布无入口只能绕左树
- ✅ 索引签空态：`还没有索引` + 主 CTA「添加第一个索引」（种子首字段索引）；禁空 `indexs[]` 白屏死表
- ✅ 索引签已有行：表下「+ 再添加一条索引」明确 CTA；禁只靠 JExcel 工具栏无文案加号
- ✅ 索引签删除：表下「删除索引 `{name}`」+ Modal 二次确认（对齐画布删字段）；取消保留；清空回空态
- ✅ 左树关系图「重命名关系图」→ `renameDiagram`（名称-only；禁空 FK「表1/表2」死弹层）；无未接线的复制/剪切
- ✅ 左树树头「新建 → 新建关系图」→ EntityModal 名称-only → `createDiagram`（与画布工具栏同路径；禁空 FK 弹层）
- ✅ 左树「关系」文件夹旁 `+`（`aria-label=新建关系图`）→ 同路径 `createDiagram`；与「表」文件夹旁 `+` 对称
- ✅ 左树表菜单「编辑表」→ 表设计字段签（`designPane: 'field'`，与画布 `canvas-open-field` 同路径）；「重命名表」另项走 EntityModal
- ✅ 字段级 unique 说明：字段签 hint「无独立唯一列」+「去索引签设置唯一」；索引空态「添加唯一索引」；画布字段 UK 徽章（只读，编辑在索引签）
- ✅ 元数据应用子签「修改字段」=`updateFieldTemplate`（MODIFY）、「删除字段」=`deleteFieldTemplate`（DROP）；禁标签与模板对调诱导误执行；差异脚本与版本页同 dbKey（含快照通道）；拉取失败有 toast
- ❌ 首页快捷入口指向不存在的路由（404）（历史问题）
- ❌ 首张表建完后画布无建表 CTA，只能左树/命令面板（历史问题）
- ❌ 重复连线或拖到错误锚点静默无反馈（历史问题）
- ❌ 字段只能双击编辑、空名静默退出丢类型/PK 改动；仅改类型/PK/非空/自增/隐藏要等 blur 才保存或只能绕表设计；中文名/默认值只能开 EntityModal 或表设计；表头中文名只能开 EntityModal；末行 Tab 退出要再点「+ 添加字段」；Escape 卸编辑后 blur 仍 commit（取消变落盘）；× 删字段无确认；索引/字段/元数据应用只能绕左树开表设计（历史问题）

## 5. 掌控感

一切可撤销；危险操作先预览或确认；用户永远可以回到过去。

- ✅ 画布删关系边二次确认（选中边 Delete·Backspace / 基数 chip 聚焦 Delete·Backspace；取消保留；确认后落库）
- ✅ 删除画布表前确认（模型树菜单 / 画布选中后 Delete·Backspace；文案「不可逆」；`selectNodesOnDrag=false` 使表头可点选）
- ✅ 画布删分组（Frame）二次确认（选中后 Delete·Backspace；文案标明仅删框不删表；取消保留）
- ✅ 左树删除模型/关系图二次确认（模型：标明级联删表与图；非主关系图：仅删图不删表；主图无删除项）
- ✅ 画布删字段二次确认（按钮 / 选中后 Delete·Backspace），编辑态 Backspace 不误删
- ✅ 索引签「删除索引 `{name}`」Modal 二次确认；取消保留；删空回空态
- ✅ JExcel 工具栏「删除选中行」Modal 二次确认（字段/索引/默认字段表共用；未选中有 toast）
- ✅ 版本时光机：任意历史版本可 diff、可恢复

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
- ✅ 表名/字段名等宽（`--erd-font-mono`）；字段名扫读主列 500（PK 行 600）、类型右对齐次要栏；**PK/FK 徽章角色标列** 10/700 + `min-width` 22（琥珀/青绿，截图先扫角色再扫名）；表头 `surfaceMuted` + 字段发丝分隔 + PK 左边条；自定义 `erdSmooth`（圆角肘 + 同表对多 FK 分流 + 中间表障碍避让 + 干道 bundling + 两弯/mid-corridor + 稀疏 Hanan A* + 密障绕行竞短 + 高度数 hub 按对端 Y 扇出 + **几何择柄**：竖叠同列同侧短 U，消固定右→左绕圈）+ **Crow's foot 端点**（IE：one=竖线 / many=鸦爪，随 `association.relation`）；设计器与分享只读同路由；**表节点密表再压**：表头 pad 6、字段行 `min-height` 20 / lh 15 / pad 1、`FIELD_ROW_H` 24（标题 14/700 与徽章层次不动）
- ❌ 字段行 PK/FK 徽章 9px 无列宽、角色标糊进字段名（历史问题）
- ✅ Frame 色板走 `frameFill*` tokens（success/ink/warning/brand 浅底轮换）；禁 demo/画布散落 Ant 蓝 Frame；命令面板 hover 禁 `#f0f5ff`
- ✅ 边基数标签 chip：白底 `surface` + `line` 描边 + `ink900` 字 / 12px / 600；padding `[4,2]` / radius 3（密图再压）；禁与画布 sunk 同色、禁整块半透明冲淡字；**可点选改基数**（设计器）；**干道 bundle 拉伸 + AABB 迭代避让**（`resolveEdgeLabelOffsets`），密图 chip 不叠字
- ✅ Frame 标题栏 chrome：height 22 / **label 12/700** vs **meta 10/400+0.88**（分组名主标题、张数 muted）；pad 0 8；轻表面条；禁占高顶栏挤成员；**双击标题重命名**
- ✅ 边路由：同侧短 U 外肘避障（`sameSide`）；bypass 叠表缝显式 mid-corridor；绕行倍率 1.85 竞短
- ✅ MiniMap：底色 `surfaceSunk` + `line` 描边 + 128×96 紧凑；禁 RF 默认白底与 sunk 画布割裂
- ✅ Controls：按钮 22×22、`surface` + `line` 描边圆角；图标 12px；**适应画布** muted 底 + ink900 主操作，缩放/锁次要 ink600；禁 RF `#fefefe` 松柱与画布割裂
- ✅ 画布工具栏：单块 surface chrome（与 Controls 同语言）；按钮 height 22 / font 11；次要 ink600，**自动布局** 600/ink900；禁散粒描边钮 + 5×12 松按钮盖截图
- ✅ 选中光晕：表 / Frame 共用 `--erd-selection-ring`（brand a18）；禁 Frame a12 弱环分叉
- ✅ 导入/逆向后 Frame 自动建议：表名前缀（`sys_*`/`biz_*`）优先，否则 ≥2 连通分量；禁单前缀/单分量整图大框
- ✅ 空态构图：设计器欢迎与关系图画布共用 ER 剪影（`ErdEmptyDiagram`）+ 主标题（14/700）+ 一句 muted 引导 + **唯一**实心主 CTA「新建第一张表」+ 次链「导入 DBML · 从数据源逆向」（ink600 文字）；分享空态同构（标题 + hint +「打开示例 demo」）；禁粉红卡通 / 描边第二钮 / 空态 MiniMap clutter
- ✅ 空态面板密度：padding 14/18/12、max-width 300、标题 14/700 / CTA height 26、剪影 compact 132；禁 28/32 松卡片盖首屏
- ✅ 命令面板密度：宽 ≤440、max-height 360、输入 36/13、行 pad 6/8 / font 12、footer 10；禁 48 高输入 + 10/12 松行盖快捷回路
- ✅ 实体新建弹层密度：宽 400、标题 13、body pad 12/14、表单项 margin 12、输入/OK 高 28 / font 12；禁默认 520 宽 + 24 pad 松卡片盖建模回路
- ✅ 导入/导出弹层密度：共享 `.erd-io-modal`（标题 13/22、body pad 12/14、footer 钮 28、Select/单行 Input 28、Dragger 收紧）；禁默认头脚松距盖项目菜单回路
- ✅ 左树行高密度：`QueryTree` 行高 22 / font 12、工具条 pad 8 / 控件 28；虚拟滚动 `itemHeight` 与视觉对齐；禁默认 ~28 松行
- ✅ CommonTabs / 表设计签头密度：签栏 `--erd-tabs-h` 28、字 12；表头 pad 4×12 / title 13；禁历史 40 松栏 + 10×16 签头
- ✅ 版本列表行密度：行 pad 4×8、标题 13/行高 22、工具条控件 28；禁 8×12 松行 + 16 标题
- ✅ 普通导出页密度：`.export-common-page` 标题 13/22、卡片 pad 8×10 / gutter 8；图标 `currentColor` → `--erd-brand`；禁 16 pad + Title level4 松卡片 / 裸 `#DE2910`
- ✅ Home / Group 主导航图标：`erdColors.brand`（与 DesignLayout / `--erd-brand` 同源）；禁组件内硬编码 `#DE2910`
- ✅ dataTypeDomains 树图标：`getDataTypeTree` 走 `erdColors.brand`；禁裸 `#DE2910`
- ✅ 设置页 chrome 密度：`.setting-common-page` 标题 13/22、页 pad 8×12、表单项 margin 12、Input/按钮 28；菜单「默认项设置」挂 `.erd-io-modal`；禁默认 Form 24 间距 + 大号控件
- ✅ 数据库配置页密度：`.database-config-page` 标题 13/22、页 pad 8×12、工具条钮 28、表行 pad 4×8；抽屉表单同阶；菜单「数据源设置」挂 `.erd-io-modal`；禁 Title level4 + 松 Card
- ✅ 账号设置 / Home 项目卡密度：`/account/settings` 标题 13/22、页 pad 8×12、表单/安全行 28；授权类型密度面板（`--erd-brand` + 13/22，禁裸 `Result` / `#DE2910`）；Home「进行中的项目」卡 pad 10×12 / 标题 13/22；修改密码挂 `.erd-io-modal`；禁 20 标题 + 14 松行 / 16×18 松卡
- ✅ 项目列表行密度：个人/最近/团队/公告共用 `.project-list-page`（标题 13/22、行 pad 4×8、工具条/打开钮 28）；禁 Title level4 + List `large`
- ✅ 分享 meta 密度：hint/描述 12/18、meta gap 4、描述单行 ellipsis；stage pad 8×12；禁 13px + 12 间距抢画布高
- ✅ 分享展开表清单密度：标题 13/22、panel pad 8×12、表头/行 pad 4×8 / font 12（行高 ∈22–28）；默认仍折叠；禁 16 pad + 14 标题松表
- ✅ 分享失效/空态：无效·吊销 → `AuthBrandShell`（左暗色品牌面板 + 右「分享不可用」+ 主 CTA「打开示例 demo」）；无模型/无表 → `ErdEmptyDiagram` + 同 CTA；禁裸 antd `Result` 403 与登录壳割裂
- ✅ 404/403：未知路径 / 无权访问 → `AuthBrandShell`（「页面不存在」/「无权访问」+ 同 CTA）；禁裸 `Result` 与三壳 token 割裂
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
- ❌ 密图干道 bundling 后基数 chip 仍叠在最长段中点（历史问题）
- ❌ MiniMap 默认白底 `#fff` 贴在 sunk 画布上成白块（历史问题）
- ❌ Controls 默认 `#fefefe` 松柱（content-box 26px）与 sunk 画布割裂；四钮等权无主操作（历史问题）
- ❌ 画布工具栏散粒描边钮 + `padding: 5px 12px` 松按钮，截图主操作扫不过（历史问题）
- ❌ 空态面板 `padding: 28px 32px` 松卡片盖首屏（历史问题）
- ❌ 命令面板输入 height 48 / 行 pad 10×12 松卡片，与 22 chrome 不同阶（历史问题）
- ❌ 实体新建弹层默认 520 宽 + Form 24 间距松卡片，与 22 chrome 不同阶（历史问题）
- ❌ 导入/导出 Modal 默认头脚松距 + 大号控件，与 22–28 chrome 不同阶（历史问题）
- ❌ 左树默认 ~28 行高 + 16 工具条松距，与 22 chrome 不同阶（历史问题）
- ❌ CommonTabs 栏 40px + 表设计签头 10×16 松距，与 22 chrome 不同阶（历史问题）
- ❌ 版本列表 8×12 松行 + 16 标题，与 22–28 chrome 不同阶（历史问题）
- ❌ 普通导出页 16 pad + Title level4 松卡片 / 图标裸 `#DE2910`，与 22–28 chrome / `--erd-*` 不同阶（历史问题）
- ❌ Home / Group 导航图标硬编码 `#DE2910`，与 DesignLayout `erdColors.brand` 割裂（历史问题）
- ❌ dataTypeDomains 树图标硬编码 `#DE2910`，与 `erdColors.brand` 割裂（历史问题）
- ❌ 设置页默认 Form 24 间距 + 大号控件，与 22–28 chrome 不同阶（历史问题）
- ❌ 账号设置 20 标题 + 14 松行 / Home 项目卡 16×18 pad，与 22–28 chrome 不同阶（历史问题）
- ❌ 授权类型裸 `Result` + 硬编码 `#DE2910`，与账号设置密度 / `--erd-*` 割裂（历史问题）
- ❌ 个人/最近/团队/公告列表 Title level4 + List large 松行，与 22–28 chrome 不同阶（历史问题）
- ❌ 分享页 hint 13px + 12 间距 / 描述无 ellipsis 抢画布高（历史问题）
- ❌ 分享展开表清单 16 pad + 14 标题 + antd 默认松行，与 22–28 / project-list 不同阶（历史问题）
- ❌ 分享失效页裸 `Result` 403，与登录 `AuthBrandShell` / 三壳 token 割裂（历史问题）
- ❌ 404/403 裸 `Result`，与登录 / 分享失效 `AuthBrandShell` 割裂（历史问题）
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
