# 全站控件矩阵（单一事实源）

> 服务 P2b「全站控件闭环」。每波收口同步改本表。  
> 状态：✅ 已有 E2E/自动化覆盖 · 🚧 开放待闭环 · 🗑 已裁剪/待删 · 📋 延期  
> 采集：手工可跑 `frontend/tests/e2e/control-inventory.spec.ts`（默认 skip，不进 CI）。

## 波次索引

| 波 | 范围 | roadmap |
|---|---|---|
| W0 | HomeLayout / GroupLayout 子路由壳 | ✅ |
| W1 | 获客与会话（登录/注册/退出/头像） | ✅ |
| W2 | 项目面（home / person / group / recent / new） | ✅ |
| W3 | 设计器核心（模型树/关系图/项目菜单） | ✅ |
| W4 | 版本时光机（版本/工单/审批） | ✅ |
| W5 | 导入导出 + 数据源 | ✅ |
| W6 | 外围裁剪（dataDomain/query/ChatSQL/account/占位） | ✅ |

---

## W0 — 布局壳

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| HomeLayout | 子路由内容区 | 渲染 `props.children`，主内容可见（非仅 slogan） | `/home` 等 Home 路由 | ✅ | `layout-outlet.spec` `/home` |
| HomeLayout | 顶栏 actions | `homeRightContent`（公众号/GitHub）；无 SaveStatus / presence / 只读分享 | `/home` | ✅ | `layout-outlet.spec` `/home` |
| GroupLayout | 子路由内容区 | 同上 | `/project/group/setting/*` | ✅ | `layout-outlet.spec` basic |
| DesignLayout | `props.children` | 设计器主区渲染 | 已正确接线 | ✅ | `smoke` / `relation` / `loading` |

---

## W1 — 获客与会话

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| `/login` | 登录按钮 | 成功进 `/home`；错误凭证单次明确提示 | JWT 会话 | ✅ | `smoke`「错误凭证」「登录→新建」 |
| `/login` | 注册链接 | 导航 `/register` | 转化漏斗 | ✅ | `session.spec`「去注册」 |
| `/login` AuthBrandShell | Skip + Tab 序 + Enter | 首项 Skip「跳到登录表单」→ form；用户名→密码→登录→footer；Enter 提交；focus-visible；无 trap | ADR-0016 键盘门面 | ✅ | `session`「登录壳键盘」 |
| `/login` AuthBrandShell | 次密距 | 品牌/表单 pad ≤20×16；gap ∈[8,12]；门头 mb ∈[8,12]；表单 Title mt≤8；项 mb∈[8,16]；控件 ∈[24,32]；标题 ≥24；hero ≤180；~40% 面板 | ADR-0016 密度 | ✅ | `smoke`「登录页渲染」 |
| `/register` AuthBrandShell | Skip + Tab 序 + Enter | 首项 Skip「跳到注册表单」→ form；字段链（tip 出序）→注册→footer；Enter 校验；focus-visible；无 trap | ADR-0016 键盘门面 | ✅ | `session`「注册壳键盘」 |
| `/register` AuthBrandShell | 次密距 | 与登录同源 pad 20×16 + gap12 + 门头 mb12 + 表单 body 12/28；「去注册」+ 注册键盘 densify | ADR-0016 密度 | ✅ | `session`「去注册」+「注册壳键盘」 |
| `/s/*` 失效门 | 次密距 | 品牌/表单 pad 同上；门头 mb ≤20；键盘用例不改 | ADR-0016 密度 | ✅ | `share`「无效 token」 |
| `/` LandingChrome | Skip + Tab 序 | 首项 Skip「跳到主操作」→ `#landing-main-cta`；试用→注册→登录；focus-visible surface；无 trap | ADR-0016 键盘门面 | ✅ | `landing`「落地页键盘」 |
| `/` LandingChrome | 次密距 | 次屏 section pad ≤52；对照行 ≤12；nav ≤20；footer ≤36；hero 品牌字 ≥36 + 全幅 | ADR-0016 密度 | ✅ | `landing`「加载可见品牌」 |
| `/compare` LandingChrome | Skip + Tab 序 | 同壳 Skip→ `#landing-main-cta`；打开演示→自部署→返回首页；surface focus-visible；无 trap | ADR-0016 键盘门面 | ✅ | `compare`「竞品对照页键盘」 |
| `/compare` LandingChrome | 次密距 | compare hero ≤36；section ≤52；对照行 ≤12；eyebrow ≥22；nav ≤20 | ADR-0016 密度 | ✅ | `compare`「加载对照表」 |
| `/s/*` 成功态 meta/表清单 | 次密距 | meta ≤60 / gap≤2 / stage≤6；表清单 pad≤6·标题≤12·行∈20–26；折叠默认 | ADR-0016 密度 | ✅ | `demo`「免登录 /demo」 |
| 只读分享 Modal | 次密距 | `.erd-io-modal` body≤8；hint mb≤8；链接行 mb≤10；输入 ~28；键盘不回归 | ADR-0016 密度 | ✅ | `share-project-keyboard` |
| HomeLayout `/home` | Skip + Tab 序 | 首项 Skip「跳到主内容」→ `#home-main-content`；继续建模→新建→示例→二级入口→项目卡；brand focus-visible；无 trap | ADR-0016 键盘门面 | ✅ | `home-keyboard`「Home 键盘」 |
| `/home` hero CTA | 次密距 | actions gap ≤8；secondary 钮 pad ≤4×10；hero gap ≤24 / mb·pb ≤16；主 CTA ≥40；问候字 ≥28 | ADR-0016 密度 | ✅ | `home-keyboard` densify |
| `/home` 空态/公告 | 次密距 | 空态 pad ≤24×12；二级入口 mb ≤16；项目区 mb ≤20；公告 pt ≤4 / 行 pad ≤4·gap ≤10 / 标题 ≤13；CTA 保留 | ADR-0016 密度 | ✅ | `home-keyboard` empty/announce densify |
| HomeLayout / GroupLayout 外井 | 次密距 | shell/content pad ≤12×16；body ≤12×16；列表空态 ≤12×8；禁 24/20；Skip/顶栏不弱化 | ADR-0016 密度 | ✅ | `layout-outlet` shell densify |
| `/account/settings` BaseView | 次密距 | 表单/头像列 gap ≤16（窄屏 ≤12）；禁 24；表单项/控件 28 不动；Skip/保存不弱化 | ADR-0016 密度 | ✅ | `account-settings` densify |
| 三壳顶栏 `erd-chrome-actions` | 次密距 | Home/Group/分享 gap ≤12；Design ≤8；禁 16；顶栏 64 / Skip·用户菜单不弱化 | ADR-0016 密度 | ✅ | `layout-outlet` densify |
| 三壳顶栏 `erd-chrome-header` | 次密距 | padX ≤16；brand–nav gap ≤12（Design ≤8）；禁 20/16；顶栏 64 / Skip 不弱化 | ADR-0016 密度 | ✅ | `layout-outlet` densify |
| Home 水平导航 Menu | 次密距 | 项 padX ∈[8,12]；项高 64；命中宽 ≥44；禁 padX16；Skip/键盘不弱化 | ADR-0016 密度 | ✅ | `layout-outlet` + `home-keyboard` |
| Group 侧栏 nav Menu | 次密距 | 项高 ∈[28,32]；padX ∈[8,12]；marginY ≤4；禁高40/pad24；Skip/键盘不弱化 | ADR-0016 密度 | ✅ | `layout-outlet` + `group-keyboard` |
| DesignLayout 侧栏 nav Menu | 次密距 | 项高 ∈[28,32]；padX ∈[8,12]；marginY ≤4；禁高40/pad24；版本/导入/导出/设置同源；`menuitem` 键盘不弱化 | ADR-0016 密度 | ✅ | `layout-outlet` densify + 侧栏键盘 |
| 项目列表工具条 | 碎密度 | Space gap ∈[8,12]；搜索/钮高 ≤28；工具条高 ≤32；禁 Search 默认 32；键盘不弱化 | ADR-0016 密度 | ✅ | `project-surface` densify + `project-list-keyboard` |
| `/project/notice` 公告行 | 碎密度 | `.project-list-page__notice-row` gap ∈[8,12]（目标 8）；行 pad ≤4×8；禁 gap12；工具条不弱化 | ADR-0016 密度 | ✅ | `project-notice` densify |
| 画布空态 CTA `.erd-empty-cta` | 碎密度 | pad ∈[8,12]（目标 10×12）；主 CTA hit ∈[26,28]；禁 14×18；Auth logo / 欢迎 pad 不弱化 | ADR-0016 密度 | ✅ | `relation`「空态构图」 |
| 画布空态剪影 `ErdEmptyDiagram` compact | 碎密度 | 宽 **112**（原 132）；∈[96,120]；禁 ≥132；hero 176 / Auth logo / 欢迎 pad 不弱化 | ADR-0016 密度 | ✅ | `relation`「空态构图」 |
| 画布空态 panel `.erd-empty-panel` | 碎密度 | mt ≈ min(8vh,64) 且 ∈[32,64]；禁 min(10vh,88)；CTA pad / Auth logo / 欢迎 pad 不弱化 | ADR-0016 密度 | ✅ | `relation`「空态构图」 |
| 画布空态纵节奏 title/desc | 碎密度 | title mt ≈8∈[6,10]；desc mb ≈12∈[8,12]；desc mt≤8；禁历史 16/18；Auth logo / 欢迎 pad / CTA pad / panel 顶距不弱化 | ADR-0016 密度 | ✅ | `relation`「空态构图」 |
| 画布空态次链 `.erd-empty-links` | 碎密度 | mt ≈10∈[8,12]；Controls 22/pad0 已密不改；禁 links mt>12；Auth logo / 欢迎 / CTA / panel / title·desc 不弱化 | ADR-0016 密度 | ✅ | `relation`「空态构图」+「Controls」 |
| 团队成员工具条 | 碎密度 | mb≤8；Space gap ∈[8,12]；搜索/钮高 ≤28；工具条高 ≤32；钮 padX∈[8,12]；禁 Search 默认 32 / mb16 | ADR-0016 密度 | ✅ | `group-layout-nav` densify + `group-keyboard` / `add-user-keyboard` |
| Group 用户组页头/左角色签 | 碎密度 | 标题 ≤14·lh≤24·mb≤8·mt≤4；标题→签 ≤12；左签 padX∈[8,12]·高∈[28,32]·字≤13；禁 Title level4 / Space large / padX24 | ADR-0016 密度 | ✅ | `group-layout-nav` densify + `group-keyboard` / `add-user-keyboard` |
| Group 基本设置页头 | 碎密度 | 标题 ≤14·lh≤24·mb≤8·mt≤4；标题→表单 ≤12；禁 Title level4 | ADR-0016 密度 | ✅ | `group-basic-setting` densify + `group-layout-nav` / `group-keyboard` |
| Group 基本设置 Form | 碎密度 | 项 mb∈[8,16]（目标12）；Input/Select/钮高∈[24,32]（目标28）；label≤13；禁 antd 默认 24/32 | ADR-0016 密度 | ✅ | `group-basic-setting` densify + `group-layout-nav` / `group-keyboard` |
| Group 基本设置删区 | 碎密度 | Divider mt/mb∈[8,16]（目标12）；body gap∈[4,12]（目标8）；次文≤13/lh≤20；标题 mb≤2；禁 Divider24 + Space 叠 mb | ADR-0016 密度 | ✅ | `group-basic-setting` densify + `group-project-delete-keyboard` |
| DesignLayout 次屏 | 碎密度 | `.erd-secondary-pane` pad ≤8×12；Steps mt/mb ≤10/12；设置 hint mb ≤8；SyncConfig→`.erd-io-modal`；禁 16/24 Steps | ADR-0016 密度 | ✅ | `designer-secondary-pane` densify |
| 导入/导出 Modal Steps | 次密距对齐 | `.erd-io-modal__steps` mt/mb ≤10/12；标题 ≤13；与次屏同阶；键盘不回归 | ADR-0016 密度 | ✅ | `reverse-database-keyboard` + `export-ddl-keyboard` densify |
| 导入/导出 Modal 头身脚 | 碎密度 | `.erd-io-modal` header/body/footer pad ≤8×12（禁头 10×14×8 / 脚 8×14 / body 12×14）；标题 ≤14·lh≥20；footer 钮 ≥28；键盘不回归 | ADR-0016 密度 | ✅ | `dbml-import` + `dbml-export` densify |
| EntityModal 头身脚 | 碎密度 | `.erd-entity-modal` header/body/footer pad ≤8×12；宽≤420；标题 ≤14·lh≥20；输入/OK ≥28；键盘不回归 | ADR-0016 密度 | ✅ | `relation`「实体新建弹层密度」 |
| GroupLayout `/project/group/setting/*` | Skip + Tab 序 | 首项 Skip「跳到主内容」→ `#group-main-content`；绕开顶栏+侧栏；基本设置字段进序；brand focus-visible；无 trap | ADR-0016 键盘门面 | ✅ | `group-keyboard`「Group 键盘」 |
| 项目列表 `/project/{person,recent,group}` | 行 Enter / Tab 动作 | stretched link 消死卡；Enter 开设计器；Tab 行内动作可逆；行 `:has` inset brand focus-visible；无 trap | ADR-0016 键盘列表 | ✅ | `project-list-keyboard` |
| 项目动作弹窗 新建/修改/删除 | 打开首焦 / Esc / Tab trap | 新增→类型；修改→项目名；删除→「是」；Esc 归还触发器；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `project-action-modals-keyboard` |
| 导入/导出弹层 DBML | 打开首焦 / Esc / Tab trap | 导入→DBML文本；导出→导出模型；Esc 归还空态 CTA / 项目菜单；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `import-export-keyboard` |
| 版本动作弹窗 新增/编辑/删除/回滚 | 打开首焦 / Esc / Tab trap | 新增/编辑最新→版本号；编辑非最新→描述；删除/回滚→「是」；Esc 归还触发器；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `version-action-modals-keyboard` |
| 版本对比/详情 diff Modal | 打开首焦 / Esc / Tab trap | 比对→「初始版本」；详情→「导出变更清单」；Esc 归还触发器；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `version-diff-keyboard` |
| 同步配置/重建版本 Modal | 打开首焦 / Esc / Tab trap | 同步配置→「字段增量」；重建版本→「版本号」；Esc 归还触发器；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `version-sync-rebuild-keyboard` |
| 重建基线二次确认 | 打开首焦 / Esc / Tab trap | 首焦「重建」；Esc 归还不落盘、归还「重建版本」钮；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `version-rebuild-confirm-keyboard` |
| 初始化基线 Modal | 打开首焦 / Esc / Tab trap | 首焦「版本号」；Esc 归还触发器；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `version-init-keyboard` |
| 复刻 Modal | 打开首焦 / Esc / Tab trap | 首焦「项目名」；Esc 归还触发器；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `project-copy-keyboard` |
| 数据源设置 Modal | 打开首焦 / Esc / Tab trap | 首焦「新增数据源」；Esc 归还「项目菜单」；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `database-setup-keyboard` |
| 默认项设置 Modal | 打开首焦 / Esc / Tab trap | 首焦「默认字段」Tab；Esc 归还「项目菜单」；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `default-setup-keyboard` |
| 数据源逆向解析 Modal | 打开首焦 / Esc / Tab trap | 首焦「数据源」Select；Esc 归还「项目菜单」；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `reverse-database-keyboard` |
| 导出DDL Modal | 打开首焦 / Esc / Tab trap | 首焦「数据源」Select；Esc 归还「项目菜单」；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `export-ddl-keyboard` |
| 解析ERD文件 Modal | 打开首焦 / Esc / Tab trap | 首焦上传区「选择ERD文件」；Esc 归还「项目菜单」；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `reverse-erd-keyboard` |
| 解析PdMan文件 Modal | 打开首焦 / Esc / Tab trap | 首焦上传区「选择PdMan文件」；Esc 归还「项目菜单」；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `reverse-pdman-keyboard` |
| 修改密码 Modal | 打开首焦 / Esc / Tab trap | 首焦「密码」；Esc 归还触发器；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `reset-password-keyboard` |
| 修改密码失败 | 业务码失败 / 重试 | toast 可读；失败不关窗；重试成功关窗；不叠弹 | 零静默失败 | ✅ | `reset-password-failure` |
| 同步配置失败 | 业务码失败 / 重试 | 仅 code===200 写 store+「设置成功」关窗；失败 toast 可读；不关窗可重试 | 零静默失败 | ✅ | `sync-config-failure` |
| 默认项设置失败 | 业务码失败 / 重试 | 仅 code===200 写 store+「设置成功」关窗；失败 toast 可读；不关窗可重试 | 零静默失败 | ✅ | `default-setup-failure` |
| 数据源设置确定失败 | 业务码失败 / 重试 | 仅 PUT 成功「保存成功！」关窗；失败 toast 可读；不关窗可重试 | 零静默失败 | ✅ | `database-setup-failure` |
| EntityModal 落盘失败 | 业务码失败 / 重试 | 仅 save code===200 写 store+toast+关窗；失败 toast 可读；不关窗可重试 | 零静默失败 | ✅ | `entity-modal-failure` |
| 画布关系图弹层落盘失败 | 业务码失败 / 重试 | 仅 save code===200 写 store+toast+关窗；失败 toast 可读；不关窗可重试 | 零静默失败 | ✅ | `diagram-modal-failure` |
| 画布表头改名落盘失败 | 业务码失败 / 重试 | 仅 save code===200 写 store+退出编辑；失败 toast 可读；草稿/节点 id 保留可重试 | 零静默失败 | ✅ | `table-rename-failure` |
| 画布建表/行内加字段落盘失败 | 业务码失败 / 重试 | 仅 save code===200 上图/关新建编辑；失败 toast；无节点或草稿可重试；空名 toast/空字段 CTA 保留 | 零静默失败 | ✅ | `canvas-create-field-failure` |
| 画布字段改名/删字段落盘失败 | 业务码失败 / 重试 | 仅 save code===200 退出编辑/移出行；失败 toast；改名草稿保留；删确认窗 keep（reject）可再删 | 零静默失败 | ✅ | `canvas-field-rename-delete-failure` |
| 画布删表落盘失败 | 业务码失败 / 重试 | 仅 save code===200 移出+「表删除成功」；失败 toast；节点保留；删确认窗 keep（reject）可再删 | 零静默失败 | ✅ | `canvas-delete-table-failure` |
| 画布字段 meta 落盘失败 | 业务码失败 / 重试 | 类型/PK/NN/AI/隐藏/浏览 PK：仅 save code===200 写 store；失败 toast；编辑草稿回滚；隐藏不退出 | 零静默失败 | ✅ | `canvas-field-meta-failure` |
| 表设计 JExcel 字段 meta 落盘失败 | 业务码失败 / 重试 | 字段签 PK/隐藏等：仅 save code===200 写 store；失败 toast + 重挂网格回滚勾选；可重试；画布对齐 | 零静默失败 | ✅ | `jexcel-field-meta-failure` |
| 表设计索引签落盘失败 | 业务码失败 / 重试 | 添加/唯一勾选等：仅 save code===200 写 store + 成功 toast；失败 toast + 空态/重挂回滚；删确认失败拒关窗；可重试；画布 UK | 零静默失败 | ✅ | `jexcel-index-failure` |
| 发起SQL审批 Modal | 打开首焦 / Esc / Tab trap | 首焦「审批人」；Esc 归还触发器（父详情仍开）；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `sql-approval-keyboard` |
| 添加成员 Modal | 打开首焦 / Esc / Tab trap | 首焦「选择用户」；Esc 归还触发器；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `add-user-keyboard` |
| 添加成员邀请失败 | 业务码失败 / 重试 | toast 可读；失败不关窗；重试成功关窗；不叠弹 | 零静默失败 | ✅ | `add-user-invite-failure` |
| 版本初始化/重建保存失败 | 业务码失败 / 重试 | 初始化失败不关窗可重试；重建失败无伪装成功、无 rebaseline | 零静默失败 | ✅ | `version-save-failure` |
| 只读分享创建失败 | 业务码失败 / 重试 | toast 可读；窗保持开；「重新生成」可重试；不叠弹；禁禁用死 affordance | 零静默失败 | ✅ | `share-create-failure` |
| 只读分享 Modal | 打开首焦 / Esc / Tab trap | 首焦「分享链接」；Esc 归还触发器；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `share-project-keyboard` |
| 只读分享吊销确认 | 打开首焦 / Esc / Tab trap | 首焦「吊销」；Esc 归还不吊销；外层分享窗仍开；焦点归还吊销钮；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `share-revoke-keyboard` |
| 团队项目删确认 | 打开首焦 / Esc / Tab trap | 首焦「删除」；Esc 归还不删；焦点归还「删除团队项目」；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `group-project-delete-keyboard` |
| 团队成员移除确认 | 打开首焦 / Esc / Tab trap | 首焦「移除」；Esc 归还不移；焦点归还「移除成员 {username}」；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `group-user-remove-keyboard` |
| 审批动作确认（通过/拒绝/撤销/复批） | 打开首焦 / Esc / Tab trap | 首焦语义 OK；Esc 归还不落盘；焦点归还触发器；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `approval-action-keyboard` |
| EntityModal 新增模型/表/关系图 | 打开首焦 / Esc / Tab trap | 新增模型首焦「名称」；新增表首焦「所属模型」；Esc 归还触发器；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `entity-modal-keyboard` |
| 画布删表确认 | 打开首焦 / Esc / Tab trap | 首焦「删除」；Esc 归还不删；焦点归还触发器；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `canvas-delete-table-keyboard` |
| 画布删边/删分组确认 | 打开首焦 / Esc / Tab trap | 首焦「删除」；Esc 归还不删；焦点归还触发器；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `canvas-delete-edge-frame-keyboard` |
| 画布删字段确认 | 打开首焦 / Esc / Tab trap | 首焦「删除」；Esc 归还不删；焦点归还触发器；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `canvas-delete-field-keyboard` |
| 表设计删索引确认 | 打开首焦 / Esc / Tab trap | 首焦「删除」；Esc 归还不删；焦点归还触发器；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `table-index-delete-keyboard` |
| JExcel 工具栏删行确认 | 打开首焦 / Esc / Tab trap | 首焦「删除」；Esc 归还不删；焦点归还触发器；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `jexcel-toolbar-delete-keyboard` |
| 左树删模型/表/关系图确认 | 打开首焦 / Esc / Tab trap | 首焦「删除」；Esc 归还不删；焦点归还行「…操作」；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `tree-delete-keyboard` |
| 数据源设置删确认 | 打开首焦 / Esc / Tab trap | 首焦「删除」；Esc 归还不删；焦点归还行删钮；外层配置窗仍开；焦点不逃出确认 dialog | ADR-0016 键盘弹层 | ✅ | `database-setup-delete-keyboard` |
| 工作台 databaseConfig 删/批删确认 | 打开首焦 / Esc / Tab trap | 首焦「删除」；Esc 归还不删；焦点归还行删钮/批删钮；焦点不逃出 dialog | ADR-0016 键盘弹层 | ✅ | `database-config-delete-keyboard` |
| `/404` AuthBrandShell 门 | Skip + Tab 序 | 首项 Skip「跳到主操作」→ `#exception-main-cta`；打开示例→返回首页；focus-visible brand；无 trap | ADR-0016 键盘门面 | ✅ | `not-found`「404 壳键盘」 |
| `/403` AuthBrandShell 门 | Skip + Tab 序 | 同 404；深链 `/403` 可达 | ADR-0016 键盘门面 | ✅ | `not-found`「403 壳键盘」 |
| `/s/:token` 失效门 | Skip + Tab 序 | 首项 Skip「跳到主操作」→ `#exception-main-cta`（`share-invalid-gate`）；打开示例→返回首页；focus-visible brand；无 trap | ADR-0016 键盘门面 | ✅ | `share`「分享失效门键盘」 |
| `/register` | 注册提交 | 成功进 `/home`；可带 redirect | `share` autofork | ✅ | `session.spec`「注册成功」；`share` redirect |
| `/demo` | 重定向 | → `/s/public-demo` 只读图 + 复制 CTA | ADR-0007 | ✅ | `demo.spec` |
| `/s/:token` | 复制到我的项目 | 未登录→注册 redirect；登录→fork | 分享 fork | ✅ | `share.spec` |
| 头像菜单 | 个人中心 | → `/account/settings?selectKey=base` | account | ✅ | `session.spec` |
| 头像菜单 | 授权信息 | → `selectKey=identification` | licence | ✅ | `session.spec` |
| 头像菜单 | 退出登录 | `cache.clear()` 回 `/login` | `logout()` | ✅ | `session.spec` |
| DesignLayout 顶栏 | GitHub stars 链 | 外链 `erdonline/erdonline` | 社区 | ✅ | 文案/链已合入 |
| DesignLayout 顶栏 | 分享按钮 | 生成只读链接 | ADR-0007 | ✅ | `share.spec` |
| DesignLayout 顶栏 | 协作 presence | 可见在线名单 | ADR-0009 | ✅ | `presence.spec` |

---

## W2 — 项目面（HomeLayout 菜单 + `/project/*`）

### HomeLayout 主导航

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| HomeLayout 菜单 | 首页 | → `/home` 主内容 | W0 | ✅ | `layout-outlet` / `project-surface` |
| HomeLayout 菜单 | 数据模型 | → `/dataModels` | 项目列表别名面 | ✅ | `project-surface` |
| HomeLayout 菜单 | 数据查询 | `_defaultProps` 已摘；路由保留实验深链 | exec 忽略所选 DS | ✅ | `home-data-query.spec` |
| HomeLayout 菜单 | 数据源 | → `/databaseConfig` | ADR-0008 / W5 | ✅ | `project-surface` / `adr0008` |
| HomeLayout 菜单 | ERD Online 论坛 | 外链 Discussions | 社区 | 📋 | 外链不测 |

### `/home` 快捷

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| `/home` | 新建模型 `home-link-new-project` | → `/project/person` | 空态新建 | ✅ | `activation` / `project-activation` |
| `/home` | 示例项目 `home-link-example` | 建示例并进设计器见表 | 30s 激活 | ✅ | `activation.spec` |
| `/home` | 导入模型 | → `/project/person`（引导） | 导入在设计器 | ✅ | `project-surface` 导航类同 person |
| `/home` | 最近项目 | → `/project/recent` | | ✅ | `project-surface` |
| `/home` | 个人项目 | → `/project/person` | | ✅ | `project-surface` / `smoke` |
| `/home` | 团队项目 | → `/project/group` | | ✅ | `project-surface` |
| `/home` | VIP/授权角标 | → account identification | | 📋 | 头像菜单已覆盖 identification |

### 项目列表路由

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| `/project/person` | 空态「新建」 | 弹窗→创建→列表可见 | VIP/开源不限数 | ✅ | `project-activation`「新建」 |
| `/project/person` | 一键示例 | 示例进设计器 | | ✅ | `project-activation` / `activation` |
| `/project/person` | 项目卡片打开 | 进 `/design/table/model?projectId=` | 死链已修 | ✅ | `smoke`「登录→新建→设计器」 |
| `/project/person` | 删除项目 | 确认后列表消失；可再建 | 缓存 | ✅ | `smoke` 清理路径 |
| `/project/recent` | 列表/打开 | 打开最近项目进设计器 | | ✅ | `project-surface` |
| `/project/group` | 团队项目列表/打开 | 进设计器或设置 | 权限 | ✅ | `project-surface` 可达；`empty-projectjson` |
| `/project/group` | 进入团队设置 | → `/project/group/setting/basic` | GroupLayout | ✅ | `layout-outlet` |
| `/project/notice` | 通知列表 | 首页「更多公告」→列表可读；失败 toast；notice-row gap ≤8 | | ✅ | `project-notice.spec` |
| `/project/new` | （整页） | redirect→`/project/person`；占位页已删 | W2 新建走 person | ✅ | `project-surface` |
| `/dataModels` | 模型列表入口 | 与项目列表等价可用 | | ✅ | `project-surface` |

---

## W3 — 设计器核心

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| DesignLayout 菜单 | 模型 | → `/design/table/model` | 关系图 | ✅ | `relation` / `smoke` |
| `/design/table/model` | 树「关系图」`tree-open-relation` | 打开画布标签 | RF | ✅ | `relation.spec` |
| `/design/table/model` | 空态建表 CTA | 表节点出现 | | ✅ | `relation` 全旅程 |
| `/design/table/model` | 内联字段/连线/守卫 | 持久化刷新仍在；chnname/defaultValue 行内；删字段二次确认（× / 选中 Delete·Backspace） | | ✅ | `relation` |
| `/design/table/model` | 表节点「索引」`canvas-open-index` | 直达表设计索引签（`aria-selected`）；可切字段后再经画布重入 | | ✅ | `relation`「画布打开索引签」 |
| `/design/table/model` | 索引签空态 CTA `index-empty-add` | 「添加第一个索引」→ 种子行 + 表格；无白屏 | | ✅ | `relation`「索引签空态 CTA」 |
| `/design/table/model` | 字段签空态 CTA `field-empty-add` | 「添加第一个字段」→ 种子首 defaultField / id + 表格；无白屏 | | ✅ | `table-field-empty` |
| `/design/table/model` | 画布空表字段 CTA `canvas-fields-empty` | 「添加第一个字段」→ 内联新建；有字段后回「添加字段」 | | ✅ | `table-field-empty` |
| `/design/table/model` | 索引签再加一行 `index-add-row` | 已有索引后「+ 再添加一条索引」→ 追加种子行；无死 affordance | | ✅ | `relation`「索引签再加一行 CTA」 |
| `/design/table/model` | 索引签删除 `index-delete-N` | 「删除索引 `{name}`」→ Modal 确认才删；取消保留；删空回空态 CTA；键盘首焦/Esc/Tab trap | | ✅ | `relation`「索引签删除二次确认」+`table-index-delete-keyboard` |
| `/design/table/model` | JExcel 工具栏删除 `jexcel-toolbar-remove` | 「删除选中行」→ Modal 确认才 `deleteRow`；取消保留；未选中 toast；键盘首焦/Esc/Tab trap | | ✅ | `relation`「JExcel 工具栏删除二次确认」+`jexcel-toolbar-delete-keyboard` |
| `/design/table/model` | JExcel 工具栏/网格 Tab 序 | 7 工具栏按钮 Tab+Enter；`jexcel-grid` 可聚焦；Shift+Tab 无 trap | | ✅ | `relation`「工具栏 Tab 可达」 |
| `/design/table/model` | 表设计字段签半成品写回 | 缺 `name`/`typeName` → toast + 中止写回；全空草稿可丢；Esc 停网格 | | ✅ | `relation`「半成品行不静默丢」 |
| `/design/table/model` | 表设计索引签半成品写回 | 缺 `name`/`fields`（含 `[]`/「;」空）→ toast + 中止写回；Esc 停网格；重入索引仍在 | | ✅ | `relation`「索引签：半成品行不静默丢」 |
| `/design/table/model` | 表节点「字段」`canvas-open-field` | 直达表设计字段签（`aria-selected` + `table-field-edit`）；可切索引后再经画布重入 | | ✅ | `relation`「画布打开字段签」 |
| `/design/table/model` | 表节点「元数据」`canvas-open-code` | 直达表设计元数据应用签（`aria-selected` + `table-code-edit`）；可切字段后再经画布重入 | | ✅ | `relation`「画布打开元数据应用签」 |
| `/design/table/model` | 表头 ✎ 改名 | 名称更新；chnname 双栏内联 | | ✅ | `relation`「改名」/「表头中文名」 |
| `/design/table/model` | PK 徽标切换 | 取消/恢复 | | ✅ | `relation`「PK」 |
| `/design/table/model` | 树删表 | 二次确认；确认后移除+toast | | ✅ | `smoke` 取消/确认 |
| `/design/table/model` | undo/redo | 可撤销画布操作 | canvasHistory | ✅ | `relation` 全旅程 Meta+z |
| `/design/table/model` | 删边 | Delete → Modal 确认后边消失并落库；取消保留 | | ✅ | `relation`「画布删表/删边」「删边后刷新」 |
| `/design/table/model` | 画布删表 | Delete → Modal 确认后 `removeEntity` `persist:true`（仅 save 成功移出）；失败窗 keep；取消保留；键盘首焦/Esc/Tab trap | | ✅ | `relation`「画布删表/删边二次确认」+`canvas-delete-table-keyboard`+`canvas-delete-table-failure` |
| DesignLayout | 项目菜单按钮 | 下拉打开 | | ✅ | `project-menu.spec` |
| 项目菜单 | 全部项目 | → `/project/recent` | | ✅ | `project-menu`「全部项目」 |
| 项目菜单 | 最近项目 | 最多 5 条；当前 ✓；点其它项切设计器 | | ✅ | `project-menu`「最近项目可切换」 |
| 项目菜单 | 版本（已迁顶栏） | 顶栏「版本」→ 版本管理；菜单内无「版本」 | | ✅ | `project-menu`「全部项目…顶栏版本」 |
| 项目菜单 | 导入→三项 | 弹窗可开、关下拉不挡 | | ✅ | `project-menu`「导入」 |
| 项目菜单 | 导出→五项 | 可见；DDL 可开 | | ✅ | `project-menu`「导出」 |
| 项目菜单 | 设置→数据源设置 | 弹窗可开 | ADR-0008 | ✅ | `project-menu`「数据源设置」 |
| 项目菜单 | 设置→默认项设置 | 打开+保存成功提示 | | ✅ | `project-menu`「默认项」 |
| DesignLayout | 自动保存状态 | 顶栏可见保存中/已保存；失败为可点「保存失败，点击重试」+ 单条 toast（断网不叠弹） | P1 | ✅ | `relation.spec`「保存中…→已保存」+ `save-failure` |
| DesignLayout | CommonTabs / 表设计签头 | 栏高 ~24；签头 padX≤8/gap≤4；内签 gutter≤2；标签/关闭钮不 clip；Tab focus-visible；Cmd+1/2/3 | ADR-0016 密度 | ✅ | `model-design-ux`「表设计三签」「表设计内签」 |
| RF TableNode | 底栏 / 空表井 chrome | 表头 pad≤6 / 字段 minH20 已密；添加 margin≤6 + minH≥22；打开表设计 margin≤6×4 + btn minH≥22；空表井 pad≤6/gap≤4；`NODE_FOOTER_H` 28；persist 不回归 | ADR-0016 密度 | ✅ | `relation`「PK/FK」+ `table-field-empty`「画布空表」 |
| DesignLayout | 命令面板/快捷键 | Cmd/Ctrl+K/F 开合；搜表定位+高亮；↑↓/aria-activedescendant；空态「无匹配结果」pad≤8×8 / list≤2；footer pad≤4×8；Esc 归还；Tab trap | RF CommandPalette | ✅ | `relation.spec`「命令面板」+「搜表定位」 |
| DesignLayout | 快捷键速查卡 | `?` / 工具栏「?」→ aria dialog「快捷键」；含 Cmd+1/2/3 表设计签；密度 maxH≤360 / list 2×4 / row padY≤6；Esc + 关闭钮可焦；与命令面板互斥 | RF ShortcutHelp | ✅ | `relation.spec`「快捷键速查」 |
| DesignLayout | Skip 跳过导航 | 首项 Tab「跳到模型树/主工作区」→ 地标 focus；无 trap | 焦点环审计 | ✅ | `relation`「设计器 Skip」 |
| DesignLayout | 左树工具条密度 | 工具条 ≤32 / 控件 ∈24–28；图标不 clip；sider 次密距；新建 focus-visible | QueryTree toolbar + sider-inner | ✅ | `model-design-ux`「模型树」 |
| DesignLayout | 版本列表二次密度 | 工具条控件 ∈24–28；图标不 clip；token 色；新增钮 focus-visible；键盘弹层不回归 | version-page toolbar/list | ✅ | `version.spec`「版本列表行密度」+ `version-action-modals-keyboard` |
| DesignLayout | 版本列表空态井次密 | 空态 pad ≤12×8；禁 16×12；保留「保存第一个版本」CTA | version-empty / list empty-text | ✅ | `version.spec`「无数据源也可新增版本」 |
| DesignLayout | 工单/审批列表密度 | 标题栏 ~24；行 pad 4×8；动作钮 ∈22–28；图标不 clip；focus-visible；确认键盘不回归 | approval-workorder-page | ✅ | `approval.spec`「工单/审批列表行密度」+ `approval-action-keyboard` |
| DesignLayout | 次屏表密度（JExcel / 版本 diff） | JExcel 工具栏 ~24；表头/行 pad 4×8；图标不 clip；focus-visible；diff 组头/行 ~24 token 色；工具栏 Tab / 可视化 diff 不回归 | jexcel-root / version-diff-panel | ✅ | `model-design-ux`「表设计 JExcel 行密度」+ `relation`「工具栏 Tab」+ `version.spec` diff |
| DesignLayout | 元数据应用子签密度 | CodeTab/DbTab 栏 ~24；标签不 clip；子签 Tab focus-visible；Cmd+1/2/3 不回归 | erd-code-tab / erd-db-tab | ✅ | `model-design-ux`「元数据应用子签」+ `relation`「表设计 Cmd/Ctrl+1/2/3」 |
| DesignLayout | 表设计内签密度 | 字段/索引/元数据栏 ~24；标签不 clip；内签 Tab focus-visible；Cmd+1/2/3 不回归 | erd-table-design__tabs / #tableNav | ✅ | `model-design-ux`「表设计内签」+ `relation`「表设计 Cmd/Ctrl+1/2/3」 |
| DesignLayout | 表设计签体内容次密距 | 侧/底 pad 6/4；hint ~24；JExcel 不 clip；元数据 tip 密；空字段 CTA / 空名 toast 保留 | erd-tab-body-pad / erd-meta-ddl-hint | ✅ | `model-design-ux`「表设计签体内容次密距」+ `table-field-empty` |
| DesignLayout | 设计器空态次密距 | 兜底禁 marginTop:100；字段/索引 Empty margin-block 0 + pad 贴 tab-body；保留 CTA | erd-pane-empty / erd-table-*-empty | ✅ | `model-design-ux`「设计器空态次密距」+ `table-field-empty` |
| DesignLayout | 欢迎空态次密距 | pad 20×16；标题 18/mt12·lh22；hero 176；逆向链 + 左树新增模型 | erd-welcome-empty / designer-welcome-empty(-inner) | ✅ | `model-design-ux`「欢迎空态次密距」 |
| DesignLayout | 右键/树操作菜单密度 | 项高 ~28（∈26–30）；border-box + padY≤2；图标/文案不 clip；`role=menuitem`；方向键/Esc | `.erd-dense-menu` | ✅ | `model-design-ux`「右键/树操作菜单密度」 |
| DesignLayout | 左树键盘漫游 | Skip→↓入树；方向键+Enter 定位表/开关系；active brand 环；Tab 进搜索无 trap | QueryTree.focusKeyboard + handleSelect | ✅ | `relation`「左树键盘漫游」 |
| RF TableNode | 字段浏览器 Tab 环 | 仅选中表字段/添加/开表设计进序；行内微钮 -1；无 trap + focus-visible | 键盘建模 | ✅ | `relation`「字段浏览器 Tab 环」 |
| RF canvas chrome | Controls / 工具栏 Tab；MiniMap 出序 | Controls→工具栏；MiniMap `tabindex=-1`；Controls focus-visible | 键盘 chrome | ✅ | `relation`「画布 chrome Tab 序」 |
| RF MiniMap | panel chrome 碎距 | 128×96 概览；margin ≈8∈[8,12]；sunk 底；禁 RF margin15；Controls 按钮/版本工具条不动 | ADR-0016 密度 | ✅ | `relation`「MiniMap」+ `demo` |
| RF Controls / 工具栏 Panel | panel chrome 碎距 | margin ≈8∈[8,12]（禁 RF 默认 15）；钮≤22；对齐 MiniMap；版本工具条/边标签不动 | ADR-0016 密度 | ✅ | `relation`「Controls」+ `demo` |
| 边基数 Select / Entity Form | 控件密度锁 | Select 高≤28；项 mb≤12；输入/OK≤28；禁回退 32/24 | ADR-0016 密度 | ✅ | `relation`「PK/FK」+「实体新建弹层密度」 |
| RF 节点级 Tab | 选中门控；RF wrapper 出序 | `nodesFocusable/edgesFocusable=false`；选中表/边 chip/Frame 进序 | 键盘建模 | ✅ | `relation`「画布节点级 Tab」 |
| `/s/:token` 分享壳 | Skip + Controls Tab | 首项 Skip「跳到关系图」→ stage；放大/缩小/适应可达；MiniMap 出序；focus-visible；无 trap | ADR-0016 键盘门面 | ✅ | `share`「分享壳键盘」 |
| TableTab | Cmd/Ctrl+1/2/3 | 表设计：字段 / 索引 / 元数据应用；输入中不拦；仅表设计签挂载 | TableTab activatePane | ✅ | `relation`「表设计 Cmd/Ctrl+1/2/3」 |
| DesignLayout | 左树点表定位 | 点表 → 切关系图 + 选中 + fitView + flash；不开表设计 | DataTable → pendingLocate + focusTable | ✅ | `relation.spec`「左树点表」 |
| `ProjectSortMenu` | 创建时间/最近修改 | 已从 Menu 导出删除 | 死代码 | 🗑 | 代码已不存在（grep 零命中） |
| `ProjectFilterMenu` | 过滤1/过滤2 | 已从 Menu 导出删除 | 死代码 | 🗑 | 代码已不存在（grep 零命中） |
| `NavigationMenu` | （空水平菜单） | 已从 Menu 导出删除 | | 🗑 | 代码已不存在（grep 零命中） |

---

## W4 — 版本时光机

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| DesignLayout 菜单 | 版本管理 | → `/design/table/version/all` | | ✅ | `project-menu` / `version` / `loading` |
| `/design/table/version/all` | 新增版本（无数据源） | 列表可见新版本 | 北极星 | ✅ | `version.spec`「新增」 |
| `/design/table/version/all` | 返回模型 | → `/design/table/model?projectId=` | | ✅ | `version.spec`「返回模型」 |
| `/design/table/version/all` | 版本详情 diff | 增删改着色 | | ✅ | `version.spec`「diff」 |
| `/design/table/version/all` | 重命名/删除版本 | 列表更新+toast；最新版改号成功；重复号 toast 且弹窗不关 | VersionHandle | ✅ | `version.spec`「重命名与删除」 |
| `/design/table/version/all` | 对比版本 | 对比结果可见 | | ✅ | `version.spec`「可视化 diff」双版比对（`version-compare-btn`→任意版本比较） |
| `/design/table/version/all` | 回滚 | 落库；刷新后模型仍回滚 | | ✅ | 回滚落库；version/approval 绿 |
| DesignLayout 菜单 | 我的工单 | → `/design/table/version/order` 空态引导 | | ✅ | `approval.spec` |
| DesignLayout 菜单 | 我的审批 | → `.../approval` 空态引导 | | ✅ | `approval.spec` |
| `/design/table/version/all` | 顶栏「我的工单/我的审批」 | 直达 order/approval 页 | W3 切片 3 | ✅ | `approval.spec`「提交工单入口」 |
| `/design/table/version/all` | 版本行「提交工单」 | 团队未同步行 → 详情「SQL审批」可见 | W3 切片 3 | ✅ | `approval.spec`「提交工单入口」 |
| 工单/审批 | 提交→通过/拒绝全链路 | 状态变更可见 | 需有数据 | ✅ | `approval.spec`：API 种子→UI 拒绝 toast→工单复批（通过=JDBC 过重未覆盖） |
| 工单/审批 | 通过/拒绝/撤销/复批确认键盘 | 首焦主操作；Esc 不落盘；Tab trap | ADR-0016 键盘弹层 | ✅ | `approval-action-keyboard` |

---

## W5 — 导入导出 + 数据源

### 侧栏导入/导出页

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| `/design/table/import/reverse` | 逆向解析提交 | 表进入模型 | ADR-0006 | ✅ | `import-reverse.spec`（MySQL `reverse_demo`） |
| `/design/table/import/reverse` | 解析失败可读 + 重试 | toast/页内文案；「重新解析」恢复 | ADR-0016 零静默 | ✅ | `reverse-parse-failure`（mock API） |
| `/design/table/import/pdman` | 上传 PdMan | 模型可见 | | ✅ | `import-pdman.spec` |
| `/design/table/import/erd` | 上传 ERD | 模型可见 | | ✅ | `import-erd.spec` |
| `ReverseERWin` | 解析 ERWin 文件 | 组件已删；菜单未挂 | stub | 🗑 | 代码已不存在（grep 零命中） |
| `/design/table/export/common` | 导出 Markdown | 文件下载 | 无 G6 | ✅ | `export.spec` |
| `/design/table/export/common` | 导出 HTML/Word/ERD | 下载或明确失败 | | ✅ | `export.spec` HTML+ERD |
| `/design/table/export/more` | 高级导出 DDL | 有源+表时可进第二步 | ADR-0008 | ✅ | `project-menu`「DDL 第二步」 |
| `/design/table/export/more` | DDL 终步下载 | 产出 SQL 文件 | | ✅ | `project-menu`「DDL 下载」 |

### `/databaseConfig`

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| `/databaseConfig` | 新建/保存数据源 | POST dataSources；profile 无 password | ADR-0008 | ✅ | `adr0008-datasource.spec` |
| `/databaseConfig` | 测试连接 | 成功/失败 toast | | ✅ | `adr0008-datasource.spec`「测试连接」 |
| `/databaseConfig` | 编辑/删除/批量删 | 列表更新+确认；行内 aria | | ✅ | `adr0008-datasource`「编辑保存 + 删除确认」 |
| `/databaseConfig` | 删/批删确认键盘 | 首焦「删除」；Esc 归还不删；Tab trap | ADR-0016 键盘弹层 | ✅ | `database-config-delete-keyboard` |
| `/databaseConfig` | 同步状态钮 | ping + toast + 徽章更新 | | ✅ | `adr0008-datasource`「同步状态」 |
| `/databaseConfig` 顶栏 | 「统计」按钮 | 已移除（原无 onClick） | 死 affordance | 🗑 | 顶栏无该按钮（仅表单「需要帮助？」文案） |
| `/databaseConfig` 顶栏 | 「帮助」按钮 | 已移除（原无 onClick） | 死 affordance | 🗑 | 顶栏无该按钮（仅表单「需要帮助？」文案） |

---

## W6 — 外围与账户

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| DesignLayout 菜单 | 数据域 | `_defaultProps` 已摘；路由保留实验页 | 北极星弱 | ✅ | `data-domain.spec`；深链见「实验功能」 |
| DesignLayout 菜单 | 查询 | `_defaultProps` 已摘；路由保留实验深链 | exec 忽略所选 DS | ✅ | `design-query.spec` |
| DesignLayout 菜单 | Chat SQL | 侧栏已隐藏；路由保留实验页 | AI 后置 | ✅ | W6 裁剪导航 |
| `/design/dataDomain` | 页内类型域树 | 实验；不扩主旅程闭环 | | 📋 | 不扩 E2E 编辑 |
| `/design/table/query` | 页内运行/计划 | 实验；失败有 toast；不扩真·DS SELECT | | 📋 | 不扩 JDBC 查询台 |
| `/design/table/chatsql` | 页内发送等 | 实验；不作为北极星闭环 | | 📋 | 不扩模型 |
| `/design/table/setting/defaultField` | 默认字段保存 | toast + 新表带默认字段；仅 code===200；失败回滚可重试 | | ✅ | `default-field.spec`「编辑保存有 toast」；`default-field-failure` |
| `/design/table/setting/default` | 系统默认项 | 同项目菜单默认项 | | ✅ | `project-menu`「默认项设置」 |
| `/dataQuery` | 页内运行/CRUD | 实验；失败有 toast；不扩真·DS SELECT | | 📋 | 不扩 JDBC 查询台 |
| `/account/settings` | 基本资料保存 | toast | | ✅ | `account-settings.spec` |
| `/account/settings` | 壳键盘 Skip/Tab | Skip→主表单；字段→保存；focus-visible；无 trap | HomeLayout | ✅ | `account-settings-keyboard.spec` |
| `/account/settings` | 「更换头像」Upload | 改为「头像上传暂未开放」文案 | | ✅ | W6 去假上传 |
| `/account/settings` | 其它 selectKey 页签 | 可切换有内容 | | ✅ | `account-settings.spec` 头像→security/identification |
| `/project/group/setting/basic` | 保存基本设置 | toast | GroupLayout/W0 | ✅ | `group-basic-setting.spec` |
| `/project/group/setting/permission` | 权限组维护 | 成员可见 | access | ✅ | `group-layout-nav`「权限组」 |
| GroupLayout 菜单 | 返回项目列表 | → `/dataModels` | | ✅ | `group-layout-nav`「返回/打开」 |
| GroupLayout 菜单 | 打开模型 | → 设计器 | projectId | ✅ | `group-layout-nav`「返回/打开」 |
| `/*` | 404 页 | 未知路径友好提示 | | ✅ | `not-found.spec` |

---

## 其它已覆盖横切

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| 已删认证路径 | `/login/success` 等 | 前端无页；后端不可用 | 清死代码 | ✅ | `dead-auth-routes.spec` |
| 画布大项目 | 视口裁剪 | 离屏节点不渲染 | 性能预算 | ✅ | `canvas-scale.spec` |
| 协作 sync | 远端改动 toast | info / warning +「保存版本」→ version/all 落库（≤1/min） | ADR-0009 | ✅ | `sync-toast.spec`（全路径+节流） |
| 加载骨架 | 列表/设计器/版本 | `aria-busy` + 可访问名 | | ✅ | `loading.spec` |
| UX 不变量 | 死 affordance/账密 | 全旅程截图+断言 | | ✅ | `ux-audit.spec` |
| 空 projectJSON | 团队项目加模型 | 可新增模型 | | ✅ | `empty-projectjson.spec` |

---

## 统计（v1 初版）

| 状态 | 行数 |
|---|---|
| ✅ | 90 |
| 🚧 | 0 |
| 🗑 | 6 |
| 📋 | 6 |
| **合计** | **102** |

📋 延期（本阶段不啃）：论坛外链、VIP 角标、dataDomain / query / chatsql / dataQuery。  
Vision loop：矩阵 🚧=0 时，优先可行动矩阵 📋 或 roadmap 下一 📋（Issue seed / AI），见 `scripts/agent-loop-vision.prompt.md`。
