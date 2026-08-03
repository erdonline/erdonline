# 回归检查单

> 规则来源：`.cursor/rules/change-points-as-tests.mdc` —— 每个改动点必须登记为可验证的检查点。
> 自动化覆盖的标注 ✅自动；其余为手工项，涉及对应模块时必查。

## 图本身可读可分享 / ADR-0016（续）

- [x] [几何择柄] 竖叠同列表 FK → `data-port=same`；截图 `diagram-port-same-side.png` ✅`relation.spec.ts`「PK/FK 与边样式」
- [x] [字段行再压一档] `.erd-field-row` min-height 22 / line-height 16 / pad 2；`FIELD_ROW_H=26` ✅`graphLayout.test.ts` + `relation.spec.ts`「表节点视觉」
- [x] [表节点密表再压] 表头 pad ≤6；字段行 minH 20 / lh 15 / pad 1；`FIELD_ROW_H=24`；标题/徽章层次不动；截图 `diagram-table-node-density.png` / `demo-table-node-density.png` ✅`graphLayout.test.ts` + `relation.spec`「PK/FK」+ `demo.spec`
- [x] [导入后首屏] 空态「导入 DBML」→ 直开关系图 + 节点落入画布可视区；截图 `diagram-import-first-screen.png` ✅`dbml-import.spec.ts`「空态导入 DBML」

### 已自动化

- [x] 模型树「表/关系」默认展开：不点 switcher 即见三层 + `tree-open-relation` ✅`model-design-ux.spec.ts`
- [x] 树虚拟滚动：`.ant-tree-list-holder` 承载（100+ 表不卡）✅`model-design-ux.spec.ts`
- [x] 左树行高密度：treenode ≤24（目标 ~22）/ font ≤13；截图 `diagram-left-tree-dense.png` ✅`model-design-ux.spec.ts`
- [x] 左树工具条/次密距：工具条 ≤32（目标 ~28）/ 新建·搜索控件 ∈24–28；图标不 clip；sider padX ≤20；新建 Tab focus-visible ✅`model-design-ux.spec.ts`
- [x] CommonTabs / 表设计签头密度：签栏 ≤26（目标 ~24）+ 签头 ≤28；不 clip 标签/关闭；Tab focus-visible；截图 `diagram-common-tabs-dense.png` ✅`model-design-ux.spec.ts`
- [x] 版本列表行密度：行 pad-block ≤10 / 标题 ≤14 / 顶栏 ≤32；截图 `diagram-version-list-dense.png` ✅`version.spec.ts`
- [x] 版本工具条二次密度/碎色：控件 ∈24–28；图标不 clip；增删摘要·hint 色 ≡ `--erd-success`/`--erd-brand`/`--erd-ink-600`；新增钮 Tab focus-visible ✅`version.spec.ts`
- [x] 工单/审批列表密度：标题栏 ≤32（目标 ~24）/ 行 pad-block ≤10 / 动作钮 ∈22–28；图标不 clip；动作钮 focus-visible；截图 `approval-list-dense.png` / `order-list-dense.png` ✅`approval.spec.ts`
- [x] 设计器次屏 JExcel 密度：工具栏 ≤32 / 表头·行 pad-block ≤10 / 行高 ≤32；图标不 clip；撤销钮 Tab focus-visible；截图 `diagram-jexcel-dense.png` ✅`model-design-ux.spec.ts`
- [x] 元数据应用子签密度：CodeTab/DbTab 栏 ≤26（目标 ~24）；不 clip 标签；子签 Tab focus-visible；Cmd+1/2/3 不回归；截图 `diagram-code-tabs-dense.png` ✅`model-design-ux.spec.ts`
- [x] 表设计内签密度：字段/索引/元数据栏 ≤26（目标 ~24）；不 clip 标签；内签 Tab focus-visible；Cmd+1/2/3 不回归；截图 `diagram-inner-tabs-dense.png` ✅`model-design-ux.spec.ts`
- [x] 版本 diff 次屏密度：组头/行 ~24 pad 4×8 + token 色（success/brand/warning）；不回归可视化 diff ✅`version.spec.ts`
- [x] 导入/导出弹层密度：标题 ≤14 / body padY ≤28 / 控件 ≤32；截图 `diagram-import-modal-dense.png` / `diagram-export-modal-dense.png` ✅`dbml-import` / `dbml-export`
- [x] 普通导出页密度：页标题 ≤14 / 卡片 padY ≤20；图标 `currentColor`→`--erd-brand`；截图 `diagram-export-common-dense.png` ✅`export.spec.ts`
- [x] Home 主导航图标 fill ≡ `--erd-brand`（`erdColors.brand`，非组件硬编码）✅`layout-outlet.spec.ts`「三壳同语言」
- [x] dataTypeDomains 树图标 fill ≡ `erdColors.brand`（禁裸 `#DE2910`；UI 入口暂未挂载）✅`dataTypeDomainsSlice.test.ts`
- [x] 设置页 chrome 密度：标题 ≤14 / 输入·保存钮 ≤32 / 表单项 mb ≤16；截图 `diagram-setting-page-dense.png` ✅`default-field.spec.ts`
- [x] 数据库配置页密度：标题 ≤14 / 工具条钮 ≤32 / 抽屉输入·保存钮 ≤32；截图 `database-config-page-dense.png` ✅`database-config.spec.ts`
- [x] 账号设置 / Home 项目卡密度：标题 ≤14 / 输入·保存钮 ≤32 / 安全行 padY ≤16；卡 padY ≤28；截图 `account-settings-page-dense.png` / `home-project-cards-dense.png` ✅`account-settings` + `layout-outlet`
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
- [x] [SQL审批键盘] 团队项目→版本「提交工单」→详情「SQL审批」首焦「审批人」；Esc 关窗归还触发器且父详情仍开；Tab trap ✅`sql-approval-keyboard.spec.ts`
- [x] [添加成员键盘] 团队项目→权限组「团队普通成员」→「添加成员」首焦「选择用户」；Esc 关窗归还触发器；Tab trap ✅`add-user-keyboard.spec.ts`
- [x] [只读分享键盘] 设计器顶栏「只读分享」首焦「分享链接」；Esc 关窗归还触发器；Tab trap ✅`share-project-keyboard.spec.ts`
- [x] [EntityModal 键盘] 设计器空态「新增模型」首焦「名称」；Esc 关窗归还触发器；Tab trap ✅`entity-modal-keyboard.spec.ts`
- [x] [画布删表确认键盘] RF 选中表 Delete → 首焦「删除」；Esc 关窗归还不删；Tab trap ✅`canvas-delete-table-keyboard.spec.ts`
- [x] [画布删边/删分组确认键盘] RF 选中边/分组 Delete → 首焦「删除」；Esc 关窗归还不删；Tab trap ✅`canvas-delete-edge-frame-keyboard.spec.ts`
- [x] [画布删字段确认键盘] 字段浏览器 ×「删除字段」→ 首焦「删除」；Esc 关窗归还不删；Tab trap ✅`canvas-delete-field-keyboard.spec.ts`
- [x] [表设计删索引确认键盘] 索引签「删除索引」→ 首焦「删除」；Esc 关窗归还不删；Tab trap ✅`table-index-delete-keyboard.spec.ts`
- [x] [JExcel 工具栏删行确认键盘] 字段签「删除选中行」→ 首焦「删除」；Esc 关窗归还不删；Tab trap ✅`jexcel-toolbar-delete-keyboard.spec.ts`
- [x] [左树删表确认键盘] 表操作→删除表 → 首焦「删除」；Esc 关窗归还不删；Tab trap ✅`tree-delete-keyboard.spec.ts`
- [x] [数据源设置删确认键盘] 新增数据源→删 → 首焦「删除」；Esc 关确认归还删钮不删；外层配置窗仍开；Tab trap ✅`database-setup-delete-keyboard.spec.ts`
- [x] [工作台 databaseConfig 删/批删确认键盘] 行删 + 批删 → 首焦「删除」；Esc 关确认归还触发器不删；Tab trap ✅`database-config-delete-keyboard.spec.ts`
- [x] [只读分享吊销确认键盘] 分享→吊销确认 → 首焦「吊销」；Esc 关确认归还吊销钮不吊销；外层分享窗仍开；Tab trap ✅`share-revoke-keyboard.spec.ts`
- [x] [团队项目删确认键盘] 基本设置→删确认 → 首焦「删除」；Esc 关确认归还删钮不删；Tab trap ✅`group-project-delete-keyboard.spec.ts`
- [x] [团队成员移除确认键盘] 权限组普通成员→移除确认 → 首焦「移除」；Esc 关确认归还移除钮不移；Tab trap ✅`group-user-remove-keyboard.spec.ts`
- [x] [审批动作确认键盘] API 种子→审批拒绝/通过 + 工单撤销确认 → 首焦主操作；Esc 关确认不落盘；Tab trap ✅`approval-action-keyboard.spec.ts`
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
- [x] 快捷键速查：`?` / 工具栏 → aria dialog「快捷键」；含 Cmd+K、Delete 确认、Tab 字段导航、Cmd+1/2/3 表设计签；Esc 关闭 ✅`relation.spec`「快捷键速查」
- [x] 表设计 Cmd/Ctrl+1/2/3：字段 / 索引 / 元数据应用；输入框内不拦 ✅`relation.spec`「表设计 Cmd/Ctrl+1/2/3」
- [x] `getActiveDiagram` 懒迁移 / tab entity 往返 ✅`diagram.test.ts`
- [x] schema 含 `diagrams` ✅`validate-projectjson.mjs`
- [x] 公开 demo / 示例：双图「鉴权核心」「会话与审计」+ 切换器 ✅`demo.spec.ts` / `activation.spec.ts`

### 手工

- [ ] [旧项目打开] 仅有 `graphCanvas`、无 `diagrams` 的项目 → 打开画布见主关系图，拖动后 projectJSON 出现 `diagrams[0]`
- [x] [分享页] 含 `diagrams` 的项目分享链接 → 只读画布用主图布局 ✅`demo.spec.ts`（/demo）
- [x] [分享只读切图] `/demo` 见 `diagram-switcher`「鉴权核心」→ 选「会话与审计」→ `sys_user` layout x 变 + Frame「会话审计」；截图 `demo-share-diagram-switch.png` ✅`demo.spec.ts`
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
- [x] [Controls 面板密度] 按钮 ≤22×22、面板 `surface`（禁 RF `#fefefe`）；截图 `diagram-controls-dense.png` ✅`relation.spec`「Controls」+ `demo.spec`
- [x] [Controls 扫读层次]「适应画布」`.erd-controls-primary` ink900 + muted 底；图标 ≥12；aria 不变 ✅`relation.spec`「Controls」+ `demo.spec`
- [x] [选中光晕统一] 表 / Frame `box-shadow` 环均为 brand a18（`--erd-selection-ring`）；禁 Frame a12 ✅`diagram-frame.spec`「选中表→新建分组」+ `relation.spec`「品牌 token」
- [x] [画布工具栏密度] `.erd-canvas-tool` height ≤22、font ≤11；截图 `diagram-canvas-toolbar-dense.png` ✅`relation.spec`「工具栏」
- [x] [画布工具栏扫读层次] 单块 chrome；次要 ink600；「自动布局」600/ink900；禁散粒描边 ✅`relation.spec`「工具栏」
- [x] [空态面板密度] `.erd-empty-cta` padY≤30 / maxW≤300 / 标题≤14 / CTA≤28 / 剪影≤140；截图 `diagram-empty-composition.png` ✅`relation.spec`「空态构图」
- [x] [命令面板密度] 面板宽≤460 / maxH≤360、输入高≤40 / font≤13、行 padY≤16 / font≤12；截图 `diagram-cmd-palette-dense.png` ✅`relation.spec`「命令面板」
- [x] [实体新建弹层密度] 宽≤420、标题≤14、body padY≤28、表单项 margin≤14、输入/OK 高≤32；截图 `diagram-entity-modal-dense.png` ✅`relation.spec`「实体新建弹层密度」
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
- [ ] Colima SQL Server（Azure SQL Edge）：indexs + associations 1:n curl 验证
- [x] 只读分享：create + 匿名 GET `readonly=true`；匿名 create 401 ✅curl
- [x] 分享脱敏：dbs password/username → `***` 且不污染原 Map ✅`ProjectShareSanitizeTest`
- [x] [只读分享前端] 设计器「分享」→ `/s/:token` → 未登录打开见表清单 + 只读关系图（`data-testid=share-relation-canvas`）✅`share.spec.ts`
- [x] [只读分享安全] 匿名 GET 中 dbs password/username 为 `***` ✅curl
- [x] [dataSources] 登录后 `GET /ncnb/dataSources?size=10&current=1` → 200（表 `data_sources`）✅`audit-fe-apis.sh`
- [x] [注册放行] 匿名 `POST /ncnb/project/group/user/register`（body: username/pwd/email/phone）→ 非 401（dev `allow-open-register=true`）✅curl
- [x] [R-AUTH-06 单入口] 匿名 `POST /user/register` → 401（不再 ignore / 无 HTTP 映射）；产品路径仍匿名可达 ✅curl + `RemoteSystemUserHttpContractTest`
- [x] [R-AUTH-06 门控] `allow-open-register=false` → 注册 `code=403` 且不 insert ✅`UserExtensionServiceImplRegisterGateTest`
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
- [ ] [MySQL 逆向含索引] 配置本机 MySQL 数据源 → 导入逆向 → 勾选含二级索引的表 → 预期：实体 `indexs` 有名称/字段/isUnique，PRIMARY 不重复出现；向导不显示 Schema（API curl 已覆盖；UI 深度后置）
- [ ] [MySQL 逆向含外键] 勾选父子表一并导入 → 预期：子表模块 `associations` 有 `1:n` 边，关系图画布可见连线（字典 KEY_COLUMN_USAGE；API curl 已覆盖）
- [x] [MySQL 复合 FK 列序] `ForeignKeyAssociationMapperTest#mapFromKeyColumnUsage_keepsCompositeOrder` ✅
- [ ] [PostgreSQL 逆向] 选数据源后出现 Schema（默认 public）→ 含二级索引表导入 → 预期：`indexs` 正确且不含主键索引
- [ ] [PostgreSQL 逆向含外键] 勾选父子表 → `associations` 有 `1:n`（字典 KEY_COLUMN_USAGE）
- [ ] [Oracle 逆向] schema=用户 → 含二级索引表导入 → 预期：`indexs` 正确且不含主键约束索引
- [ ] [Oracle 逆向含外键] 勾选父子表 → `associations` 有 `1:n`（ALL_CONSTRAINTS R）
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
- [x] [存量 console.log] 已清零（`rg console\.(log|debug|info) src` = 0；`lint:js:ci` 0 error）✅自动
- [ ] [CORS 收敛] curl 实证：localhost:8000 预检放行含 ACAO；evil.example.com 无 ACAO ✓（2026-08-01）——**部署注意**：生产直连后端需设 `CORS_ALLOWED_ORIGINS` 或 `ERD_UI_URL`；prod 禁 SocketIO/CORS `*`（`CrossOriginPolicy`）；prod profile 必须注入 MYSQLUSER/MYSQLPASSWORD/REDISPASSWORD/`ERD_UI_URL`（或 `SOCKETIO_ORIGIN`）/JWT 否则启动失败（fail-fast；compose 无 Redis 密码时 `REDISPASSWORD=`；**勿**再强制假 `OSS_*`）
- [ ] [R-CFG-04 Origin] prod 未设 `ERD_UI_URL`/`SOCKETIO_ORIGIN` → 启动失败；设 `SOCKETIO_ORIGIN=*` → 启动失败含 `*`；dev profile 本地 dogfood 不受影响
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
- [ ] [保存失败] 手工：断网后改模型 → 见「未保存」且有错误提示

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

## 官方 Demo 运行时 Railway（2026-08-02）

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

## W5 切片 4 — 登录/注册品牌壳（2026-08-03）

- [x] [登录壳] `/login` 见 `auth-brand-shell`；左面板 ~40%；无 `bg2.png`/`#1677FF`；「打开演示」为 link✅ `smoke.spec.ts`
- [x] [注册同构] 登录「去注册」→ `/register` 同壳 +「打开演示」✅ `session.spec.ts`

## 竞品对照子页（2026-08-03）

- [x] [路由] `/compare` 可见对照表（版本/开源自部署等）+ CTA→demo/首页✅ `compare.spec.ts`
- [x] [入口] 落地顶栏「对比」与「查看完整对照」进 `/compare`✅ `compare.spec.ts`
- [x] [落地回归] `/` hero/CTA 仍绿✅ `landing.spec.ts`
- [x] [对照页键盘] `/compare` 首项 Tab Skip「跳到主操作」→ `#landing-main-cta`→「打开演示」→「自部署指南」→「返回产品首页」可逆；surface focus-visible；无 trap✅ `compare.spec.ts`「竞品对照页键盘」

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
- [x] [公告列表行密度] 行 pad / 页标题 / 工具条与 22–28 同阶；截图 `project-notice-list-dense.png` ✅同上「公告列表行密度」

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
