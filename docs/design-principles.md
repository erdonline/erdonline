# 体验设计原则 / Design Principles

:::info 读者
维护者文档：写 UI 前必读。普通用户请从 [使用指南](/docs/guide/what-is-erd-online) 开始。
:::

> 面向所有贡献者：写任何 UI 代码之前必读。
> 每条原则附正例与反例（反例均来自项目真实历史代码，已被修正或列入修正计划）。

## 1. 即时反馈

每个操作 100ms 内有可见响应；能乐观更新就不等服务器；异步操作必须有状态。

- ✅ 自动保存显示"保存中… / 已保存 12:30 / 保存失败，点击重试"
- ✅ 数据源逆向解析失败：toast/页内可读业务文案（禁 `[object Object]`）；失败区「重新解析」；业务/网络错误不叠弹
- ✅ 添加成员邀请失败：业务 toast 后弹层不关（禁伪装成功）；可重试；不叠弹
- ✅ 初始化基线保存失败：业务 toast 后弹层不关；可重试；成功才关窗
- ✅ 重建基线 `hisProjectSave` 失败：禁「重建基线成功」伪装；禁失败后 rebaseline；toast 可读
- ✅ dbsync 同步失败：清「正在同步」死态，可再点同步；Modal 标明失败原因
- ✅ 只读分享创建失败：业务 toast 后窗保持开；主钮「重新生成」可重试（禁禁用死 affordance）；不叠弹
- ✅ 修改密码失败：业务 toast 后弹层不关（禁伪装成功）；可重试；无 msg 兜底「更新密码失败」
- ✅ 同步配置失败：仅 `saveProject` code===200 写 store + toast「设置成功」+ 关窗；失败 toast 可读、不关窗可重试；无 msg 兜底「设置失败」
- ✅ 默认项设置失败：仅 `saveProject` code===200 写 store + toast「设置成功」+ 关窗；失败 toast 可读、不关窗可重试；无 msg 兜底「设置失败」
- ✅ 数据源设置确定失败：仅 `updateDbs`（PUT dataSources）成功 toast「保存成功！」+ 关窗；失败 toast 可读、不关窗可重试；禁无条件成功 toast
- ✅ EntityModal（新增模型/表/关系图）：仅 `saveProject` code===200 写 store + 成功 toast + 关窗；失败 toast 可读、不关窗可重试；禁本地 mutate 即「添加成功」
- ✅ 画布新建/重命名关系图：仅 `saveProject` code===200 写 store + 成功 toast（创建）+ 关窗；失败 toast 可读、不关窗可重试
- ✅ 画布建表 / 行内新建字段：仅 `saveProject` code===200 上图 / 退出新建编辑；失败 toast 可读、草稿/空态可重试；禁本地 mutate 即「表添加成功」
- ✅ 画布既有字段改名 / 删字段：仅 `saveProject` code===200 退出编辑 / 移出行；失败 toast；改名草稿保留；删字段二次确认失败窗仍开可重试
- ✅ 画布/左树删表：仅 `saveProject` code===200 移出节点 + toast「表删除成功」；失败 toast、节点保留、确认窗拒关可重试；禁本地 mutate 即「表删除成功」
- ✅ 左树删模型/关系图：仅 `saveProject` code===200 移出 + toast「模型/关系图删除成功」；失败 toast、树节点保留、确认窗拒关可重试；禁本地 mutate 即成功
- ✅ 左树剪切/粘贴表（及模型剪切/粘贴）：仅 `saveProject` code===200 写剪贴板与移出/写入 + 成功 toast；失败 toast、保留先前状态；禁本地 mutate 即「剪切/粘贴成功」（复制仅本地剪贴板，无落盘）
- ✅ 画布拖表/拖框坐标：仅 `saveProject` code===200 写 layout/Frame bounds；失败 toast + RF 回滚到先前坐标；禁本地 mutate 即坐标已落盘
- ✅ 画布对齐/自动布局：仅 `saveProject` code===200 写 layout；失败 toast + RF 回滚；成功后才 fitView；禁本地 `updateGraphCanvasLayout` 即坐标已落盘
- ✅ Frame 改名/缩放/适应成员：仅 `saveProject` code===200 写 store；失败 toast + 改名草稿保留 / RF bounds 回滚；成功才 toast「已适应成员」；禁本地 mutate 即落盘
- ✅ Frame 新建/加入/移出成员：仅 `saveProject` code===200 写 store + toast；失败 toast、不上图/不改成员；加入 Modal 失败拒关窗；禁本地 mutate 即成功
- ✅ 画布拖连线建关联：仅 `saveProject` code===200 写 store；失败 toast、不上边（associations 派生）；可再拖重试；禁本地 mutate 即上边
- ✅ 画布改边基数：仅 `saveProject` code===200 写 store；失败 toast、chip 保持原基数；可再选重试；禁本地 mutate 即换基数
- ✅ 画布改边 ON DELETE/UPDATE / 约束名：仅 `saveProject` code===200 写 `constraintName`/`deleteRule`/`updateRule`；失败 toast、保持原值；同旧 `constraintName` 拆边同步改名与规则；重名拦截；禁本地 mutate 即换元数据
- ✅ 数据类型字典 CRUD：仅 `saveProject` code===200 写 store + 成功 toast/关窗；失败 toast、窗 keep、表不增行；禁本地 mutate 即「提交成功」；枚举 kind/`values[]` 同闸（`buildEnumApply`）；逻辑类型按方言密表编 `apply[code].type`（禁原始 JSON）
- ✅ 字段类型选型区分枚举：画布 `<select>` optgroup「逻辑类型|枚举」；表设计/默认字段 JExcel dropdown group；选中写 `fields[].type=code`；浏览态枚举徽章；禁假成功（仍走既有 persist）
- ✅ 逆向导入（数据源选表 / ERD·PdMan·DBML 文件）：仅 `saveProject` code===200 写 store + 成功 toast；失败 toast、不写 store、窗/页保持可重试；禁本地 `setProjectJson`/`importReverseTable` 即「导入/操作成功」
- ✅ 默认数据源切换 / WORD 模板路径：仅 `saveProject` code===200 写 store（模板另 toast「WORD模板已更新」）；失败 toast、Radio/列表回滚可重试；禁仅本地 mutate（`needSave=false` 时 autosave 不触发）
- ✅ 版本回滚：仅 `saveProject` code===200 写 store + toast「成功回滚」+ 关窗；失败 toast、不写 store、确认窗不关可重试；禁先 `setModules` 再异步 save
- ✅ WORD 模板下载：仅非空且 ZIP 魔数 `PK` 的 blob 落盘 `.docx`；空体 / JSON 错误体 toast「下载模板出错」且不触发下载；禁假成功文件
- ✅ Word 文档导出（`gendocx`）：同 ZIP 闸（`docxBlobGate`）；空体 / JSON / 非 `PK` → toast「Word导出失败!请重试！」且不触发下载；禁假成功文件
- ❌ 登录失败无任何提示，用户以为网络断了（历史问题）
- ❌ 静默自动保存，用户不知道建模成果是否已落库（历史问题）
- ❌ 逆向解析失败 toast「数据库解析失败:[object Object]」且页内仅「解析失败」无重试（历史问题）
- ❌ 添加成员非 200 仍关窗，漏 toast 时像邀请成功（历史问题）
- ❌ 重建基线业务失败仍弹成功 toast 并 rebaseline；初始化基线先关窗再存（历史问题）
- ❌ 分享创建失败后「复制链接」禁用、只能关窗重开（历史问题）
- ❌ 修改密码非 200 仍关窗，漏 toast 时像改密成功（历史问题）
- ❌ 同步配置仅本地改 `upgradeType` 即 toast「设置成功」并关窗，落库失败像已设置（历史问题）
- ❌ 默认项设置仅本地改 profile 即 toast「设置成功」并关窗，落库失败像已设置（历史问题）
- ❌ EntityModal / 模块树本地 mutate 即 toast「模型添加成功」并关窗，autosave 失败像已保存（历史问题）
- ❌ 画布新建关系图本地 mutate 即关窗，autosave 失败像已建图（历史问题）
- ❌ 画布建表/行内加字段本地 mutate 即成功，autosave 失败像已上图/加字段（历史问题）
- ❌ 画布既有字段改名/删字段本地 mutate 即成功，autosave 失败像已改名/已删（历史问题）
- ❌ 画布/左树删表本地 mutate 即 toast「表删除成功」，autosave 失败像已删表（历史问题）
- ❌ 左树删模型/关系图本地 mutate 即 toast，autosave 失败像已删（历史问题）
- ❌ 左树剪切/粘贴本地 mutate 即成功 toast，autosave 失败像已剪/已粘（历史问题）
- ❌ 画布拖表本地 mutate 即写 layout，autosave 失败像坐标已落盘（历史问题）
- ❌ 画布对齐/自动布局本地 mutate 即写 layout，autosave 失败像坐标已落盘（历史问题）
- ❌ Frame 改名/适应成员本地 mutate 即成功（适应成员先 toast），autosave 失败像已改名/已缩边（历史问题）
- ❌ Frame 新建/成员加减本地 mutate 即 toast，autosave 失败像已建组/已加入（历史问题）
- ❌ 画布拖连线本地 mutate 即上边，autosave 失败像已建关联（历史问题）
- ❌ 画布改边基数本地 mutate 即换 chip，autosave 失败像已改基数（历史问题）
- ❌ 数据类型字典本地 mutate 即 toast「提交成功」，autosave 失败像已写入（历史问题）
- ❌ 逆向导入本地 `setProjectJson`/`importReverseTable` 即 toast「导入/操作成功」，autosave 失败像已导入（历史问题）
- ❌ 默认数据源 / WORD 模板路径仅本地 mutate，`needSave=false` 时永不落盘或 autosave 失败像已切换/已配置（历史问题）
- ❌ 版本回滚先 `setModules` 再异步 save 并立即关窗，落盘失败像已回滚（历史问题）
- ❌ WORD 模板下载把空 blob / JSON 错误体直接存成 `wordTemplate.docx`（历史问题）

## 2. 键盘优先

完整快捷键体系 + `Cmd/Ctrl+K` 命令面板。高手应能不碰鼠标完成建模。

- ✅ `Cmd+Z` / `Cmd+Shift+Z` 撤销重做、`Delete`/`Backspace` 删除选中（二次确认）、`Cmd/Ctrl+K`/`Cmd/Ctrl+F` 命令面板（可搜表定位）、`?` 呼出快捷键速查卡（`role=dialog`「快捷键」；工具栏「?」同入口）
- ✅ 命令面板键盘闭环：开面板首焦搜索；↑↓ + `aria-activedescendant` 选中；Enter 执行；无匹配「无匹配结果」+ 提示；Esc 关并归还触发器；Tab/⇧Tab 困在搜索（选项不走 Tab）
- ✅ 表设计内签直切：`Cmd/Ctrl+1` 字段 · `2` 索引 · `3` 元数据应用（仅表设计签挂载时拦截；输入框内不拦；画布上不抢浏览器签页）；速查卡已登记
- ✅ 表设计 JExcel（字段/索引/默认字段共用）：工具栏 `role=toolbar`「表格编辑工具栏」+ 7 项均可 Tab + Enter/Space 激活；网格 `jexcel-grid` 可聚焦，Enter 进 A1；Shift+Tab 退回工具栏（无 trap）；编辑态 Escape 丢弃草稿并焦点归还网格（禁落隐藏 textarea）；「快捷操作」`Modal.info` 首焦「知道了」+ Esc 归还 + Tab trap
- ✅ 设计器 Skip：首项 Tab「跳到模型树 / 跳到主工作区」落 `erd-design-tree` / `erd-design-workspace`（`tabIndex=-1`）；绕开顶栏 chrome；地标→下一 Tab 进搜索/签·画布（无 trap）；设计器内 `:focus-visible` brand 环（签栏/画布工具栏/可聚焦控件）
- ✅ CommonTabs 签头键盘：`navigation`「已打开的签页」；←/→ roving 切实体签；关闭钮 `aria-label=关闭 {表名}`（禁英文 `remove`）；关签焦点归还下一签或主工作区地标；关闭钮 `:focus-visible`；内签方向键不回归
- ✅ 分享壳键盘：首项 Tab Skip「跳到关系图」落 `#share-canvas-stage`（`tabIndex=-1`）；绕开顶栏 chrome；Controls（放大/缩小/适应）进序、MiniMap 出序；Fork/登录/注册可达；壳内 `:focus-visible` brand 环；模块/切图 Segmented `role=group` 有名；无 trap
- ✅ 登录壳键盘：首项 Tab Skip「跳到登录表单」落 `#auth-form-anchor`（`tabIndex=-1`）；绕开左品牌面板；用户名→密码→登录→footer 链进序；密码框 Enter 提交；壳内 `:focus-visible` brand 环（暗面板 surface 环）；无 trap
- ✅ 注册壳键盘：同壳 Skip「跳到注册表单」；用户名→密码→确认→邮箱→手机→注册→footer；Form tip 问号出序（悬停保留）；末字段 Enter 提交/校验；focus-visible brand 环；无 trap
- ✅ 落地页键盘：首项 Tab Skip「跳到主操作」落 `#landing-main-cta`（`tabIndex=-1`）；绕开顶栏；试用→注册→登录（已登录：工作台→演示）；壳内 `:focus-visible` surface 环（深色门面）；地标 brand；不按 Skip 仍可达品牌链；无 trap
- ✅ `/compare` 竞品对照页键盘：同壳 Skip→ `#landing-main-cta`；打开演示→自部署指南→返回首页；surface focus-visible；无 trap
- ✅ Home 工作台键盘：首项 Tab Skip「跳到主内容」落 `#home-main-content`（`tabIndex=-1`）；绕开顶栏；继续建模→新建→示例→二级入口→项目卡；壳内 `:focus-visible` brand 环；无 trap
- ✅ GroupLayout 壳键盘：首项 Tab Skip「跳到主内容」落 `#group-main-content`（`tabIndex=-1`）；绕开顶栏+侧栏；基本设置表单字段进序；壳内 `:focus-visible` brand 环；无 trap
- ✅ 项目列表行键盘：个人/最近/团队行 stretched link（点描述亦开项目）；Enter 开设计器；Tab 行内动作（修改/删除/管理/打开）可逆；行 `:has(:focus-visible)` inset brand 环（抗 ant List outline 重置）；无 trap/死卡
- ✅ 账号设置壳键盘：`/account/settings` 首项 Tab Skip「跳到主表单」落 `#account-settings-form`（`tabIndex=-1`）；绕开顶栏+左侧页签；邮箱→电话→更新基本信息；壳内 `:focus-visible` brand 环；无 trap
- ✅ 项目动作弹窗键盘：新建/修改 Modal 打开首焦首字段；删除确认首焦「是」；Esc 关窗；焦点归还触发器；Tab 困在 `role=dialog` 内
- ✅ 导入/导出弹层键盘（DBML）：导入首焦文本区；导出首焦模型 Select；Esc 关窗；空态 CTA /「项目菜单」焦点归还；Tab 困在 dialog
- ✅ 版本动作弹窗键盘：新增→版本号；编辑→版本号（非最新只读号→描述）；删除/回滚确认→「是」；Esc 关窗；焦点归还触发器；Tab 困在 `role=dialog` 内
- ✅ 版本对比/详情 diff 弹层键盘：比对→「初始版本」Select；详情→「导出变更清单」；Esc 关窗；焦点归还触发器；Tab 困在 `role=dialog` 内
- ✅ 同步配置/重建版本弹层键盘：同步配置→首焦「字段增量」；重建版本→首焦「版本号」；Esc 关窗；焦点归还触发器；Tab 困在 `role=dialog` 内
- ✅ 初始化基线弹层键盘：首焦「版本号」；Esc 关窗；焦点归还触发器；Tab 困在 `role=dialog` 内
- ✅ 复刻弹层键盘：首焦「项目名」；Esc 关窗；焦点归还触发器；Tab 困在 `role=dialog` 内
- ✅ 数据源设置弹层键盘：首焦「新增数据源」；Esc 关窗；焦点归还「项目菜单」；Tab 困在 `role=dialog` 内
- ✅ 默认项设置弹层键盘：首焦「默认字段」Tab；Esc 关窗；焦点归还「项目菜单」；Tab 困在 `role=dialog` 内
- ✅ 数据源逆向解析弹层键盘：首焦「数据源」Select；Esc 关窗；焦点归还「项目菜单」；Tab 困在 `role=dialog` 内
- ✅ 导出DDL弹层键盘：首焦「数据源」Select；Esc 关窗；焦点归还「项目菜单」；Tab 困在 `role=dialog` 内
- ✅ 解析ERD文件弹层键盘：首焦上传区「选择ERD文件」；Esc 关窗；焦点归还「项目菜单」；Tab 困在 `role=dialog` 内
- ✅ 解析PdMan文件弹层键盘：首焦上传区「选择PdMan文件」；Esc 关窗；焦点归还「项目菜单」；Tab 困在 `role=dialog` 内
- ✅ 修改密码弹层键盘：首焦「密码」；Esc 关窗；焦点归还触发器；Tab 困在 `role=dialog` 内
- ✅ 发起SQL审批弹层键盘：首焦「审批人」；Esc 关窗；焦点归还触发器（父详情仍开）；Tab 困在 `role=dialog` 内
- ✅ 添加成员弹层键盘：首焦「选择用户」；Esc 关窗；焦点归还触发器；Tab 困在 `role=dialog` 内
- ✅ 只读分享弹层键盘：首焦「分享链接」；Esc 关窗；焦点归还触发器；Tab 困在 `role=dialog` 内
- ✅ EntityModal 弹层键盘：新增模型首焦「名称」（新增表首焦「所属模型」）；Esc 关窗；焦点归还触发器；Tab 困在 `role=dialog` 内
- ✅ 画布关系图弹层键盘：新建/重命名首焦「关系图名称」；Esc 关窗；焦点归还触发器；Tab 困在 `role=dialog` 内；提交中禁 Esc；「加入分组」首焦「选择分组」同构
- ✅ 数据类型字典弹层键盘：新增/编辑首焦「类型名称」；Esc 关窗；焦点归还触发器；Tab 困在 `role=dialog` 内；提交中禁 Esc
- ✅ 画布删表确认弹层键盘：选中表 Delete → 首焦「删除」；Esc 关窗；焦点归还触发器；Tab 困在 `role=dialog` 内（二次确认保留）
- ✅ 画布删边/删分组确认弹层键盘：选中边/分组 Delete → 首焦「删除」；Esc 关窗；焦点归还触发器；Tab 困在 `role=dialog` 内（二次确认保留）
- ✅ 画布删字段确认弹层键盘：字段浏览器 ×「删除字段」→ 首焦「删除」；Esc 关窗；焦点归还触发器；Tab 困在 `role=dialog` 内（二次确认保留）
- ✅ 表设计删索引确认弹层键盘：索引签「删除索引 `{name}`」→ 首焦「删除」；Esc 关窗；焦点归还触发器；Tab 困在 `role=dialog` 内（二次确认保留）
- ✅ JExcel 工具栏删行确认弹层键盘：「删除选中行」→ 首焦「删除」；Esc 关窗；焦点归还触发器；Tab 困在 `role=dialog` 内（二次确认保留）
- ✅ 左树删模型/表/关系图确认弹层键盘：「…操作→删除…」→ 首焦「删除」；Esc 关窗；焦点归还行触发器；Tab 困在 `role=dialog` 内（二次确认保留）
- ✅ 数据源设置删确认弹层键盘：行「删除数据源」→ 首焦「删除」；Esc 关确认不删、归还删钮；外层配置窗仍开；Tab 困在确认 `role=dialog` 内
- ✅ 工作台 databaseConfig 删/批删确认弹层键盘：行「删除连接」/「批量删除」→ 首焦「删除」；Esc 关确认不删、归还触发器；Tab 困在确认 `role=dialog` 内
- ✅ 只读分享吊销确认弹层键盘：「吊销分享」→ 首焦「吊销」；Esc 关确认不吊销、归还吊销钮；外层分享窗仍开；Tab 困在确认 `role=dialog` 内
- ✅ 团队项目删确认弹层键盘：基本设置「删除团队项目」→ 首焦「删除」；Esc 关确认不删、归还删钮；Tab 困在确认 `role=dialog` 内
- ✅ 团队成员移除确认弹层键盘：用户组成员「移除成员」→ 首焦「移除」；Esc 关确认不移、归还移除钮；Tab 困在确认 `role=dialog` 内
- ✅ 审批动作确认弹层键盘：审批「通过/拒绝」/工单「撤销」→ 首焦主操作；Esc 关确认不落盘、归还触发器；Tab 困在确认 `role=dialog` 内（复批同构 `confirmDestructive`）
- ✅ 审批/工单 SQL 明细键盘：行「查看SQL」→ `Modal.info` 首焦「知道了」；Esc/OK 关窗归还触发器；Tab 困在 `role=dialog` 内（`showSqlDetailModal`）
- ✅ 导入跳过校验键盘：二次导入已存在模型 → `Modal.warning` 首焦「知道了」；Esc/OK 关提示归还「解析并导入」；Tab 困在 `role=dialog` 内（`showImportSkipWarning`）
- ✅ 工作台 databaseConfig Drawer 键盘：新建/编辑打开首焦「连接名称」；Esc 关 Drawer；焦点归还触发器（Drawer 无 `focusTriggerAfterClose`，`afterOpenChange` 手动归还）；Tab 困在 Drawer `role=dialog` 内
- ✅ 版本同步结果弹层键盘：同步成功/失败 `Modal.success`/`Modal.warn` 首焦「知道了」；Esc/OK 关窗归还「同步」；Tab 困在 `role=dialog` 内（`showSyncResultModal`；打开前钉回同步钮）；`SyncVersion` 必传行数据、点击钉 `currentVersion`（禁只靠悬停，否则 `projectJSON.modules` 空炸）
- ✅ 破坏性确认统一 `confirmDestructive`：`frontend/src` 裸 `Modal.confirm` 仅留工具函数本体；版本「重建基线/同步确认」、逆向覆盖、画布/JExcel/索引删等均首焦 OK + Esc 归还 + Tab trap
- ✅ 404/403 壳键盘：首项 Tab Skip「跳到主操作」落 `#exception-main-cta`（`tabIndex=-1`）；绕开左品牌面板；打开示例 demo→返回首页；壳内 `:focus-visible` brand 环；`/403` 深链可达；无 trap
- ✅ 分享失效门键盘：同构 Skip「跳到主操作」→ `#exception-main-cta`（`share-invalid-gate`）；打开示例→返回首页；focus-visible brand；无 trap
- ✅ 画布字段浏览器 Tab 环：仅**选中**表的字段行 / 添加字段 / 打开表设计进序；行内 PK·✎·× `tabIndex=-1`（Enter 进编辑、Delete 删字段）；未选中表 `tabIndex=-1` 防画布 trap；字段行 `:focus-visible` brand 环；速查卡已登记
- ✅ 画布 chrome Tab 序：Controls（放大/缩小/适应/交互）→ 工具栏；MiniMap（d3-zoom）`tabindex=-1` 装饰出序、鼠标仍可拖；Controls `:focus-visible` brand 环；无 trap
- ✅ 画布节点级 Tab：`nodesFocusable`/`edgesFocusable=false`（RF wrapper 不出序）；仅**选中**表控件 / 邻接边基数 chip / Frame 重命名进序；未选中 `-1`；无密图 trap
- ✅ 左树键盘漫游：Skip「跳到模型树」后 ↓/↑/Enter 切入树键盘面；方向键漫游、←→ 展开收起、Enter 定位表 / 打开关系图（同 `focusTable` / `tree-open-relation`）；active 行 brand 环；地标→Tab 仍进搜索（无 trap）
- ❌ 设计原则写了 `?` 速查卡却无实现，Cmd+K / Delete 确认 / Tab 字段导航只能靠走查发现（历史问题）
- ❌ 表设计字段网格工具栏 6/7 图标键盘不可达、remove 可聚焦但 Enter 无效、网格无 Tab 入口（历史问题）
- ❌ 进设计器 Tab 先扫冗长顶栏，模型树/画布无 Skip、焦点环不可见（历史问题）
- ❌ 表设计三签只能鼠标点，高手手不离键却要绕画布底栏（历史问题）
- ❌ 画布未选中表字段与行内微按钮全进 Tab 序，密图键盘 trap（历史问题）
- ❌ Controls→工具栏 Tab 经 MiniMap SVG trap；Controls 键盘环不可见（历史问题）
- ❌ RF 默认每个节点/边 wrapper `tabindex=0` + 边 chip 无条件进序 → 密图扫完全图才到工具栏（历史问题）
- ❌ Skip 到模型树后只能 Tab 进搜索，方向键无法入树漫游、无法键盘开表/关系（历史问题）
- ❌ 分享页进 Tab 先扫顶栏，无 Skip、Controls/MiniMap 序与焦点环未对齐设计器（历史问题）
- ❌ 登录/注册壳进 Tab 先扫左品牌面板，无 Skip、暗面板焦点环不可见（历史问题）
- ❌ 落地页进 Tab 先扫完整顶栏，无 Skip 直达主 CTA、深色门面焦点环缺（历史问题）
- ✅ 命令面板搜表名 → 选中节点 + `fitView` 对准 + `locate-flash` 脉冲高亮（禁整图画布无反馈）
- ✅ 左树点表名 → 同语言定位到画布（切关系图签 + 选中 + fitView + `data-locate-flash`）；表设计走菜单「编辑表」
- ❌ undo/redo 方法已实现却从未接线到 UI 和键盘（历史问题）
- ❌ 命令面板只能建表/布局，搜表名无匹配、大图画布找不到表（历史问题）

## 3. 上下文即工具

右键菜单、悬停操作、内联编辑优先；能不用弹窗就不用弹窗。

- ✅ 画布表节点上直接内联编辑字段：hover ✎ / 双击进编辑；空名有 toast 不静默丢改动；Enter 提交；Escape 取消未提交改名（拦 blur，禁止取消变落盘）；Tab/Shift+Tab 跳下一/上一行；末行 Tab 开新建字段；仅改类型/PK/非空/自增/隐藏即时落盘（save-status，`persist:true` 失败回滚）；隐藏有 toast + 表底「已隐藏」可恢复（仅 save 成功）；默认值（defaultValue）编辑态次行内联（主栏已满不挤横向）；浏览态选中字段 Delete/Backspace（及 ×）二次确认删除，编辑态 Backspace 只改字
- ✅ 关系基数：点边标签 chip 内联选 `1:1`/`1:n`/`n:1`/`n:n`（不弹窗）；拖连线默认 `n:1`；两端 Crow's foot（IE）随基数变；同编辑器可编约束名 + ON DELETE/UPDATE（空规则=方言默认；空名导出生成）
- ✅ Frame 标题双击内联重命名
- ❌ 建一条关系要打开弹窗手工配置基数（历史问题）
- ❌ FK 参照动作只能逆向看 title、画布无法改 CASCADE（历史问题）
- ❌ 关系线只有闭合箭头、扫一眼读不出基数（历史问题）
- ❌ 双击打开表的方法存在但从未传入组件，双击是死链（历史问题）

## 4. 零摩擦默认

模板、智能默认值、一切皆可拖拽；任何页面都不该让用户面对无从下手白屏。

- ✅ 新建项目向导：空白 / 导入数据库 / 从模板，三步内完成
- ✅ 空态 = 插画 + 一句话引导 + 行动按钮
- ✅ 非空画布工具栏「新建表」一键上图（`canvas-create-table`）；`persist:true` 仅 save 成功上图；不必再绕左树或 Cmd+K
- ✅ 拖连线失败有 toast：重复关联 / 非法锚点（同类型或未对准接入点）；空白处松开=取消不打扰
- ✅ 字段行 ✎ 与表头改名同形；改已有字段空名 toast「字段名不能为空」；Enter 提交；Escape 取消（不经 blur 落盘）；Tab 字段名→中文名→类型→默认值→跳行；末行 Tab 新建；中文名（chnname）/默认值（defaultValue）行内编辑；类型/PK/非空/自增/隐藏 onChange 即时 save-status；隐藏 toast + 表底恢复；选中字段 Delete/Backspace / × 二次确认删；**行内新建/改名字段** `persist:true`（失败不退出编辑、草稿保留）；**删字段** 确认后 `persist:true`（失败窗仍开、行不消失）；**类型/PK/非空/自增/隐藏/浏览 PK** `persist:true`（失败编辑草稿回滚；隐藏失败不退出、不 toast「已隐藏」）
- ✅ 表头 ✎ / 双击：表名 + 实体中文名双栏内联；Tab 表名→中文名→提交；Escape 丢弃（拦 blur）；仅改 chnname 亦 save-status；改名 `persist:true`（失败不退出编辑、草稿保留）
- ✅ 表节点底栏并排「字段 | 索引 | 元数据 | 触发器」→ 表设计对应签（`canvas-open-field` / `canvas-open-index` / `canvas-open-code` / `canvas-open-trigger`）；禁画布无入口只能绕左树 / 签头点选
- ✅ 触发器签可编辑已有行：行「编辑」弹层改名/时机/事件/粒度/语句体/DDL；结构变而 DDL 文本未动时强制重建；仅 `saveProject` code===200 写 store；失败不关窗可重试；首焦名称 + Esc 归还；禁只能删重建
- ✅ 索引签空态：`还没有索引` + 主 CTA「添加第一个索引」（种子首字段索引）；禁空 `indexs[]` 白屏死表
- ✅ 索引签字段/表达式：JExcel「字段/表达式*」文本格；分号混写列名与表达式（如 `id;LOWER(email)`）→ `indexs[].fields[]`；禁 dropdown 丢失表达式；persist-on-200
- ✅ 字段签空态：`还没有字段` + 主 CTA「添加第一个字段」（种子首个 defaultField / id）；禁空 `fields[]` 白屏死表
- ✅ 画布空表字段引导：可见字段 0 →「还没有字段」+「添加第一个字段」品牌 CTA；禁仅灰虚线埋进白壳
- ✅ 索引签已有行：表下「+ 再添加一条索引」明确 CTA；禁只靠 JExcel 工具栏无文案加号
- ✅ 索引签删除：表下「删除索引 `{name}`」+ Modal 二次确认（对齐画布删字段）；取消保留；清空回空态
- ✅ 左树关系图「重命名关系图」→ `renameDiagram`（名称-only；禁空 FK「表1/表2」死弹层）；无未接线的复制/剪切
- ✅ 左树树头「新建 → 新建关系图」→ EntityModal 名称-only → `createDiagram`（与画布工具栏同路径；禁空 FK 弹层）
- ✅ 左树「关系」文件夹旁 `+`（`aria-label=新建关系图`）→ 同路径 `createDiagram`；与「表」文件夹旁 `+` 对称
- ✅ 左树表菜单「编辑表」→ 表设计字段签（`designPane: 'field'`，与画布 `canvas-open-field` 同路径）；「重命名表」另项走 EntityModal
- ✅ 左树搜索：Enter 过滤表名；× / 清空立刻清 `searchKey`（antd Search `onSearch` 不随 clear 触发）；无匹配 →「未找到匹配的表」（`tree-search-empty`）；禁过滤残留空文件夹白屏
- ✅ 命令面板搜表定位：`Cmd/Ctrl+K`/`F` → 输入表名 → 定位到画布（选中 + fitView + `data-locate-flash`）；禁只筛选命令、找不到表
- ✅ 左树点表定位：点表节点 → 切关系图 + 选中 + fitView + flash（与命令面板同 `focusTable`）；禁点表只能开表设计、密图难找
- ✅ 字段级 unique 说明：字段签 hint「无独立唯一列」+「去索引签设置唯一」；索引空态「添加唯一索引」；画布字段 UK 徽章（只读，编辑在索引签）
- ✅ 元数据应用子签「修改字段」=`updateFieldTemplate`（MODIFY）、「删除字段」=`deleteFieldTemplate`（DROP）；禁标签与模板对调诱导误执行；差异脚本与版本页同 dbKey（含快照通道）；拉取失败有 toast
- ❌ 首页快捷入口指向不存在的路由（404）（历史问题）
- ❌ 首张表建完后画布无建表 CTA，只能左树/命令面板（历史问题）
- ❌ 重复连线或拖到错误锚点静默无反馈（历史问题）
- ❌ 字段只能双击编辑、空名静默退出丢类型/PK 改动；仅改类型/PK/非空/自增/隐藏要等 blur 才保存或只能绕表设计；中文名/默认值只能开 EntityModal 或表设计；表头中文名只能开 EntityModal；末行 Tab 退出要再点「+ 添加字段」；Escape 卸编辑后 blur 仍 commit（取消变落盘）；× 删字段无确认；索引/字段/元数据应用只能绕左树开表设计（历史问题）

## 5. 掌控感

一切可撤销；危险操作先预览或确认；用户永远可以回到过去。

- ✅ 画布删关系边二次确认（选中边 Delete·Backspace / 基数 chip 聚焦 Delete·Backspace；取消保留；确认后 `removeAssociation` `persist:true`，失败拒关窗可重试）
- ✅ 删除画布表前确认（模型树菜单 / 画布选中后 Delete·Backspace；文案「不可逆」；`selectNodesOnDrag=false` 使表头可点选；确认后 `removeEntity` `persist:true`，失败拒关窗可重试）
- ✅ 画布删分组（Frame）二次确认（选中后 Delete·Backspace；文案标明仅删框不删表；取消保留；确认后 `removeFrame` `persist:true`，失败拒关窗可重试）
- ✅ 左树删除模型/关系图二次确认（模型：标明级联删表与图；非主关系图：仅删图不删表；主图无删除项；确认后 `persist:true`，失败拒关窗可重试）
- ✅ 左树剪切/粘贴表与模型：`cutEntity`/`pastEntity`/`cutModule`/`pastModule` `persist:true`；仅 save 成功后改树；失败可重试（复制不落盘）
- ✅ 画布拖表/拖框坐标：`commitDiagramGeometry` `persist:true`；仅 save 成功写 layout/Frame bounds；失败 RF 回滚到 store 坐标（禁本地 mutate 即落盘）
- ✅ Frame 改名/缩放/适应成员：`renameFrame`/`commitDiagramGeometry` `persist:true`；仅 save 成功关编辑态 / 写 bounds +「已适应成员」；失败草稿保留 / RF 回滚
- ✅ Frame 新建/成员加减：`createFrame`/`addFrameMembers`/`removeFrameMembers` `persist:true`；仅 save 成功写 store + toast；失败不上图/不改成员；加入 Modal 拒关窗
- ✅ 画布拖连线：`addAssociation` `persist:true`；仅 save 成功写 store；失败不上边可重试
- ✅ 画布改边基数：`updateAssociationRelation` `persist:true`；仅 save 成功写 store；失败保持原基数可再选
- ✅ 画布删字段二次确认（按钮 / 选中后 Delete·Backspace），编辑态 Backspace 不误删
- ✅ 索引签「删除索引 `{name}`」Modal 二次确认；取消保留；删空回空态
- ✅ JExcel 工具栏「删除选中行」Modal 二次确认（字段/索引/默认字段表共用；未选中有 toast）
- ✅ 表设计字段签半成品行：缺英文名/类型时 toast + 中止写回（禁静默 discard 丢字段）；全空草稿可丢；网格内 Esc 不冒泡；必填 `name`+`typeName`（对齐画布空名反馈）
- ✅ 表设计字段签 JExcel meta（类型/PK/NN/AI/隐藏等）与空态「添加第一个字段」：`updateEntityFields` `persist:true`；仅 save code===200 写 store；失败 toast + 重挂网格回滚草稿（禁本地 mutate 即成功）
- ✅ 表设计索引签（空态添加 / JExcel 改名·字段·唯一 / 再加 / 删除）：`updateEntityIndex` `persist:true`；仅 save code===200 写 store +「索引更新成功」；失败 toast + 空态保留或重挂网格回滚；删确认失败拒关窗
- ✅ 默认字段设置（页路由 JExcel / 项目菜单弹窗 HotTable）：`updateDefaultFields` `persist:true`；仅 save code===200 写 store +「默认字段已更新」；失败 toast + 重挂网格回滚（禁本地 mutate 即成功）
- ✅ 表设计索引签半成品行：缺索引名/字段时 toast + 中止写回（禁静默 discard 丢索引）；`fields` 空数组/「;」空串亦算未填；全空草稿可丢；网格内 Esc 不冒泡
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
- ✅ 表名/字段名等宽（`--erd-font-mono`）；字段名扫读主列 500（PK 行 600）、类型右对齐次要栏；**PK/FK 徽章角色标列** 10/700 + `min-width` 22（琥珀/青绿，截图先扫角色再扫名）；表头 `surfaceMuted` + 字段发丝分隔 + PK 左边条；自定义 `erdSmooth`（圆角肘 + 同表对多 FK 分流 + 中间表障碍避让 + 干道 bundling + 两弯/mid-corridor + 稀疏 Hanan A* + 密障绕行竞短 + 高度数 hub 按对端 Y 扇出 + **几何择柄**：竖叠同列同侧短 U，消固定右→左绕圈）+ **Crow's foot 端点**（IE：one=竖线 / many=鸦爪，随 `association.relation`）；设计器与分享只读同路由；**表节点密表再压**：表头 pad 6、字段行 `min-height` 20 / lh 15 / pad 1、`FIELD_ROW_H` 24（标题 14/700 与徽章层次不动）；**底栏/空表井碎距**：添加字段 margin 2×6 + minH 22、打开表设计 margin 0×6×4 + btn minH 22、空表虚线井 pad 6 / gap 4 / margin 4×6；`NODE_FOOTER_H` 28；禁再压表头/字段行伤命中
- ❌ 字段行 PK/FK 徽章 9px 无列宽、角色标糊进字段名（历史问题）
- ✅ Frame 色板走 `frameFill*` tokens（success/ink/warning/brand 浅底轮换）；禁 demo/画布散落 Ant 蓝 Frame；命令面板 hover 禁 `#f0f5ff`
- ✅ 边基数标签 chip：白底 `surface` + `line` 描边 + `ink900` 字 / 12px / 600；padding `[4,2]` / radius 3（密图再压）；禁与画布 sunk 同色、禁整块半透明冲淡字；**可点选改基数**（设计器）；**干道 bundle 拉伸 + AABB 迭代避让**（`resolveEdgeLabelOffsets`），密图 chip 不叠字
- ✅ Frame 标题栏 chrome：height 22 / **label 12/700** vs **meta 10/400+0.88**（分组名主标题、张数 muted）；pad 0 8；轻表面条；禁占高顶栏挤成员；**双击标题重命名**
- ✅ 边路由：同侧短 U 外肘避障（`sameSide`）；bypass 叠表缝显式 mid-corridor；绕行倍率 1.85 竞短
- ✅ MiniMap：底色 `surfaceSunk` + `line` 描边 + 128×96 紧凑（概览不缩）；panel **margin 8**（禁 RF 默认 15）；禁默认白底与 sunk 画布割裂
- ❌ MiniMap panel 贴 RF 默认 margin 15，与 ADR-0016 8–12 族偏松（历史问题）
- ❌ Controls / 画布工具栏 Panel 贴 RF 默认 margin 15，相对 MiniMap 已密 8 / 8–12 族偏松（历史问题）
- ❌ 画布空态 compact 剪影 132（及更早 168），相对已密 CTA pad / panel 顶距仍偏大盖首屏（历史问题）
- ✅ Controls：按钮 22×22、`surface` + `line` 描边圆角；图标 12px；**panel margin 8**（对齐 MiniMap；禁 RF 默认 15）；**适应画布** muted 底 + ink900 主操作，缩放/锁次要 ink600；禁 RF `#fefefe` 松柱与画布割裂
- ✅ 画布工具栏：单块 surface chrome（与 Controls 同语言）；**Panel margin 8**；按钮 height 22 / font 11；次要 ink600，**自动布局** 600/ink900；禁散粒描边钮 + 5×12 松按钮盖截图 / 禁 RF panel margin 15
- ✅ 空态剪影 compact：**112**（原 132）；hero 176 / Auth logo 48 / 欢迎 pad 不动；禁 ≥132 回退；≥96 保留存在感；`testid=erd-empty-diagram`
- ✅ 边基数 Select：编辑态高 **24**（≤28）；EntityModal / io-modal 表单项 mb **12**、输入·Select·OK **28**（量测已贴；E2E 锁禁回退）
- ✅ 选中光晕：表 / Frame 共用 `--erd-selection-ring`（brand a18）；禁 Frame a12 弱环分叉
- ✅ 导入/逆向后 Frame 自动建议：表名前缀（`sys_*`/`biz_*`）优先，否则 ≥2 连通分量；禁单前缀/单分量整图大框
- ✅ 空态构图：设计器欢迎与关系图画布共用 ER 剪影（`ErdEmptyDiagram`）+ 主标题（14/700）+ 一句 muted 引导 + **唯一**实心主 CTA「新建第一张表」+ 次链「导入 DBML · 从数据源逆向」（ink600 文字）；分享空态同构（标题 + hint +「打开示例 demo」）；禁粉红卡通 / 描边第二钮 / 空态 MiniMap clutter
- ✅ 空态面板密度：padding 10×12（ADR-0016 8–12；原 14/18/12）、max-width 300、标题 14/700 / CTA height 26（hit ≥26）、剪影 compact **112**（原 132 / 更早 168）；禁 14×18 / 28/32 松卡片 / ≥132 松剪影盖首屏；Auth logo 48 / 欢迎 pad·hero 176 不动
- ✅ 空态 panel 顶距次密：`.erd-empty-panel` `min(8vh, 64)`（原 `min(10vh, 88)`）；保留顶区存在感 ≥32；禁 10vh/88 松顶；Auth logo / 欢迎 pad / CTA pad 10×12 不动；`testid=canvas-empty-panel`
- ✅ 空态纵节奏：`.erd-empty-title` mt≈8、`.erd-empty-desc` mb≈12（量测已贴 ADR-0016；历史 16 / 8×18）；禁回退松距；Auth logo / 欢迎 pad / CTA pad / panel 顶距不动；`testid=canvas-empty-state`
- ✅ 空态次链区：`.erd-empty-links` mt≈10（8–12 族；Controls chrome 量测已密故不次密 Controls）；禁回退 >12；Auth logo / 欢迎 pad / CTA / panel / title·desc 不动；`testid=canvas-empty-links`
- ✅ 命令面板密度：宽 ≤440、max-height 360、输入 36/13、行 pad 6/8 / font 12、footer 4×8 / font 10（与 `?` 速查 footer 同阶）；禁 48 高输入 + 10/12 松行 + footer 6×10 松井盖快捷回路
- ✅ 命令面板空态：有关键字无命中 →「无匹配结果」+「试试表名、定位、建表或布局」；empty pad ≤8×8 / gap ≤2、list pad ≤2；禁仅「无匹配命令或表」一句无指引；禁 16×12 空井 + 4px 列表井
- ✅ 快捷键速查卡密度：`?` dialog maxH ≤360、header 6×10、list pad ≤2×4、row padY ≤6 / gap ≤8、footer 4×8；关闭钮 focus-visible；禁 list 6×8 + row padY 10 / gap 12 松井；Esc / 与 Cmd+K 互斥不弱化
- ✅ 实体新建弹层密度：宽 400、标题 13/22、头/身/脚 pad **8×12**（原头 10×14×8 / 脚 8×14 / body 12×14）、表单项 margin 12、输入/OK 高 28 / font 12；禁头 10×14×8 / 脚 8×14 / body 12×14 / 默认 520 宽 + 24 pad 松卡片盖建模回路
- ✅ 导入/导出弹层密度：共享 `.erd-io-modal`（标题 13/22、头/身/脚 pad **8×12**（原头 10×14×8 / 脚 8×14 / body 12×14）、footer 钮 28、Select/单行 Input 28、Dragger 收紧；Steps mt/mb ≤10/12 · 标题 12，与次屏同阶）；禁头 10×14×8 / 脚 8×14 / body 12×14 / Steps 16/24 盖项目菜单回路
- ✅ 左树行高密度：`QueryTree` 行高 22 / font 12、工具条控件 24 / 次密距 pad 4、sider-inner pad 4×6×0×8；虚拟滚动 `itemHeight` 与视觉对齐；禁默认 ~28 松行 + pad 8/控件 28；禁 clip 图标；保留工具条/树 focus-visible
- ✅ CommonTabs / 表设计签头密度：签栏 `--erd-tabs-h` 24（再压，原 40→28）、字 12、flex 居中；表头 pad 2×8 / gap4 / title 12；内签 gutter/marginR 2（禁 8）；禁 clip 标签/关闭钮；禁历史 40 松栏 + 10×16 签头
- ✅ 版本列表行密度：行 pad 4×8、标题 13/行高 22、工具条控件 24；hint/摘要色走 `--erd-ink-*` / success·brand·warning；禁 8×12 松行 + 16 标题、禁工具条 28 + livecam/`#389e0d` 碎色；禁 clip 图标；保留工具条 focus-visible
- ✅ 版本列表空态井次密：`.version-page__list .ant-list-empty-text` pad 12×8（对齐工作台列表空态）；保留「还没有版本」+「保存第一个版本」CTA；禁 16×12 松井；`testid=version-empty`
- ✅ 版本工单/审批列表密度：共享 `.approval-workorder-page` 标题 13/22、标题栏 ~24、表头/行 pad 4×8、动作钮 22；禁默认松表 + `marginBottom:16`；禁 clip 图标；保留动作钮 focus-visible
- ✅ 设计器次屏表密度：JExcel（字段/索引/默认字段）工具栏 ~24、表头/行 pad 4×8、字 12、token 斑马；版本 diff 实体组头/行 ~24 + success/brand/warning；禁 datatables 头 10/行 8 + `#fbf8fb`；禁 clip；保留工具栏 Tab/focus-visible
- ✅ 元数据应用子签密度：`CodeTab`/`DbTab` 签栏 `--erd-sub-tabs-h` 24、字 12、flex 居中；禁默认 antd 松签 + 字 11；禁 clip；保留子签 Tab focus-visible + Cmd+1/2/3 表设计签
- ✅ 表设计内签密度：`#tableNav` 字段/索引/元数据 `--erd-inner-tabs-h` 24、字 12、flex 居中；`tabBarGutter`/marginR 2（对齐子签）；禁 pad 堆高无固定栏 + marginR 8；禁 clip；保留内签 Tab focus-visible + Cmd+1/2/3
- ✅ 表设计签体内容次密距：`--erd-tab-body-pad-x/b` 6/4、unique-hint pad 4×8 / mb 4、空态 pad 贴 tab-body、元数据 tip `.erd-meta-ddl-hint` ~24、工作区井 6；禁 10/12 松井 + Paragraph 大底距；禁 clip JExcel；保留空字段 CTA / 空名 toast
- ✅ 设计器空态次密距：兜底 `.erd-pane-empty`（禁 `marginTop:100` / 高 200 插画）；字段/索引 `.ant-empty` margin-block 0 + pad 对齐 `--erd-tab-body-pad`；保留空态 CTA；禁 antd `marginXL` 次屏松井
- ✅ 欢迎空态次密距：`.erd-welcome-empty__inner` pad 20×16、标题 18/mt12·lh22（贴 page-title 13/22 节奏）、引导 mt8、hero 剪影 176；保留「从数据源逆向」链 + 左树「新增模型」；禁 32×24 / 48+ 松井 / 20·mt14 / 22 标题 mt20 / hero 220；禁压成画布空态 10×12
- ✅ AuthBrandShell 次密距：品牌/表单 pad 20×16 / gap12、缩略 pad12、门头 mb12；表单 Title mt6 + `.auth-shell-form` 项 mb12 / Input·钮 28；登录/注册/分享失效/404·403 同源；禁 32×28 / 48×40 松井 / gap14 / mb16 / Title mt10 / antd 项 mb24 / large 40；品牌字号/~40%/Skip·Tab 不弱化
- ✅ LandingChrome / `/compare` 次密距：次屏 section 2.75rem、pillars gap 1.5、对照行 0.5、nav/footer 收；compare hero padT 1.5；禁压 hero 品牌级字号/全幅构图/CTA；Skip·Tab 不弱化
- ✅ 设计器菜单密度：共享 `.erd-dense-menu`（树操作 / 签右键 / 新建 / 项目菜单·子菜单 / 顶栏更多）；项高 ~28 / 字 12 / padX 8；`border-box` + padY 0（禁 antd dropdown `content-box`+padY5 把 height:28 撑到 ~33）；禁默认 ~40 松项；禁 clip；保留 `role=menuitem` + 方向键/Esc`
- ✅ 普通导出页密度：`.export-common-page` 标题 13/22、卡片 pad 8×10 / gutter 8；图标 `currentColor` → `--erd-brand`；禁 16 pad + Title level4 松卡片 / 裸 `#DE2910`
- ✅ Home / Group 主导航图标：`erdColors.brand`（与 DesignLayout / `--erd-brand` 同源）；禁组件内硬编码 `#DE2910`
- ✅ dataTypeDomains 树图标：`getDataTypeTree` 走 `erdColors.brand`；禁裸 `#DE2910`
- ✅ 设置页 chrome 密度：`.setting-common-page` 标题 13/22、页 pad 8×12、表单项 margin 12、Input/按钮 28；菜单「默认项设置」挂 `.erd-io-modal`；禁默认 Form 24 间距 + 大号控件
- ✅ 数据库配置页密度：`.database-config-page` 标题 13/22、页 pad 8×12、工具条钮 28、表行 pad 4×8；抽屉表单同阶；菜单「数据源设置」挂 `.erd-io-modal`；禁 Title level4 + 松 Card
- ✅ 账号设置 / Home 项目卡密度：`/account/settings` 标题 13/22、页 pad 8×12、表单/安全行 28；BaseView 列 gap 16（窄屏 12）；授权类型密度面板（`--erd-brand` + 13/22，禁裸 `Result` / `#DE2910`）；Home「进行中的项目」卡 pad 10×12 / 标题 13/22；修改密码挂 `.erd-io-modal`；禁 20 标题 + 14 松行 / 16×18 松卡 / BaseView gap24
- ✅ 项目列表行密度：个人/最近/团队/公告共用 `.project-list-page`（标题 13/22、行 pad 4×8、工具条/打开钮 28）；公告 `notice-row` gap 8；禁 Title level4 + List `large` + notice gap12
- ✅ 项目列表工具条碎距：`.project-list-page__toolbar` Space gap 8 + 搜索控件高 28（禁 antd 默认 32 撑到 34）；钮 padX 8；`data-testid=project-list-toolbar`；命中/键盘不弱化
- ✅ 团队成员工具条碎距：`.group-user-list__toolbar` mb8 + Space gap 8 + 搜索/钮高 28；钮 padX 8；禁 mb16 + Search 默认 32；`data-testid=group-user-toolbar`；命中/键盘不弱化
- ✅ Group 用户组 Title/左角色签碎距：`.group-setting-page` 标题 13/22·mb8；左签 padX12·高28·字12；禁 Title level4 + Space large + br + padX24；`data-testid=group-setting-page`；键盘不弱化
- ✅ Group 基本设置页头碎距：`.basic-setting-page` 标题 13/22·mt0·mb8；同文件「删除项目」同阶；禁 Title level4；`data-testid=basic-setting-page`；键盘/保存不弱化
- ✅ Group 基本设置 Form 碎距：`.basic-setting-form` 项 mb12 / Input·Select·钮 28 / label 12；对齐 `.setting-common-form`；禁 antd 默认 24/32；键盘/保存不弱化
- ✅ Group 基本设置删区碎片：Divider 12 + body gap8 + 次文 12/18；禁 Divider 24 + Space 叠标题 mb；`data-testid=basic-setting-delete-zone`；确认/aria 不弱化
- ✅ 分享成功态 meta / 表清单次密：stage pad 6×10、meta gap2 / hint·描述 12·16、描述单行 ellipsis；表清单标题 12/18 + panel pad 6×10、行 pad 3×8（行高 ∈20–26）；默认仍折叠；弹层 `.erd-io-modal`（body 8×12 / hint mb8 / 链接行 mb10 / 钮 28）；禁 12×14 body / 8×12 stage 外松井 / Paragraph·Compact 松井；键盘·吊销不弱化
- ✅ Home hero CTA 簇次密：hero gap24 / mb·pb16；actions gap8；secondary 4×12 + 钮 4×10；stats mt12；禁 gap32·actions12 / 次钮 6×14；主 CTA large + 问候 ≥28 + Skip·Tab 不弱化
- ✅ Home 空态/公告次密：空态 pad 24×12；二级入口 mb16；项目区 mb20；区块头 mb8；公告 pt4 / 行 pad4·gap10 / 标题 13；禁 40×16 空井 / 行 8×16；保留空态 CTA +「更多公告」
- ✅ 设计器次屏碎密度：`.erd-secondary-pane`（逆向 / ERD·PdMan / 高级导出 DDL）pad 8×12 · Steps ≤10/12 · 表单 28；`ReverseTable` meta+表行次密；`SyncConfig`→`.erd-io-modal`；设置 hint mb8；禁 Steps 16/24 + Card mb16 + 裸 Modal
- ✅ 分享失效/空态：无效·吊销 → `AuthBrandShell`（左暗色品牌面板 + 右「分享不可用」+ 主 CTA「打开示例 demo」）；无模型/无表 → `ErdEmptyDiagram` + 同 CTA；禁裸 antd `Result` 403 与登录壳割裂
- ✅ 404/403：未知路径 / 无权访问 → `AuthBrandShell`（「页面不存在」/「无权访问」+ 同 CTA）；禁裸 `Result` 与三壳 token 割裂
- ✅ 导入后首屏：DBML 导入直开关系图 + `fitView`（多表 padding 0.08 / maxZoom 1.15，与分享只读同密）；切图/一键布局同样铺满
- ✅ 竞品对照子页 `/compare`：诚实差异化（协作/版本/开放/自部署）；落地保留摘要表；禁夸大、禁复刻 dbdiagram 叙事
- ✅ Home / Group / Design 三壳共用 `erd-chrome-*`：顶栏 64、`--erd-*` 表面；禁全页 Watermark / shields 徽标 clutter
- ✅ 工作台壳外井次密：HomeLayout shell 12×16×10 / body 12×16 / footer 10×6；GroupLayout content·body 12×16；列表空态 12×8；禁 shell 24 + body 20 叠页内 8×12 双松井；Skip/顶栏 64 不弱化
- ✅ 账号 BaseView 左右列次密：表单/头像列 gap 16（窄屏 12）；禁 gap24；表单项/控件 28 不动；Skip/保存不弱化
- ✅ 顶栏 `erd-chrome-actions` 次密：gap 12（Design 覆写 8）；禁 gap16；顶栏 64 / brand·用户菜单 hit / Skip 不弱化
- ✅ 顶栏 `erd-chrome-header` 次密：padX 16 + brand–nav gap 12（Design gap8 / 右井 16）；禁 padX20 / gap16；顶栏 64 / Skip 不弱化
- ✅ Home 水平导航 Menu 项次密：padX 12（8–12 族）；禁 padX16；项高 64 / 命中宽 ≥44 / Skip·键盘不弱化
- ✅ Group 侧栏 nav 行距次密：项高 28 / padX 12 / marginY 2 / 字 12（与账号左栏同阶）；禁高 40 + pad 24·16；命中 ≥28 / Skip·键盘不弱化
- ✅ 设计器侧栏 nav 行距次密：`.design-layout__sider-menu` 项高 28 / padX 12 / marginY 2 / 字 12（与 Group 侧栏同阶）；版本/导入/导出/设置同源；禁高 40 + pad 24；命中 ≥28 / `menuitem` 键盘不弱化；`testid=design-layout-sider-menu`
- ✅ Home 一构图：hero CTA 簇 + 项目网格锚点；禁快速操作竖排中文磁贴 / 陈旧公告占位；导航选中走 brand
- ✅ 设计器下拉用 antd `Menu`/`Dropdown` `items`：单行标题、紧凑密度（`.erd-dense-menu` ~28）；弹窗外置；禁「大图标+副标题」卡片项；禁默认 ~40 松项；子菜单不得串台（导出≠导入）
- ❌ 工作台壳 shell 24×24 + body 20×24 / Group 24+20，叠页内 8×12 成双松井（历史问题）
- ❌ 账号 BaseView 表单/头像列 gap24，与壳 12×16 次密不同阶（历史问题）
- ❌ 顶栏 `erd-chrome-actions` gap16，相对 brand gap8 / Design gap8 偏松（历史问题）
- ❌ 顶栏 `erd-chrome-header` padX20 + brand–nav gap16，相对壳 12×16 / actions gap12 偏松（历史问题）
- ❌ Home 水平 Menu 项 padX16，相对顶栏 8–12 族偏松（历史问题）
- ❌ Group 侧栏 Menu 高 40 / pad 24·16 / marginY4，相对账号左栏 28·12 与 8–12 族偏松（历史问题）
- ❌ 设计器侧栏 Menu 高 40 + 默认 pad，相对 Group 侧栏 28·12 与 8–12 族偏松（历史问题）
- ❌ 团队成员工具条 mb16 + Search 默认 32，相对项目列表工具条 28 / 8–12 族偏松（历史问题）
- ❌ Group 用户组 Title level4 + Space large + br + 左签 padX24·高38，相对 13/22·28 / 8–12 族偏松（历史问题）
- ❌ 欢迎空态内井 pad 32×24 / 标题 20/mt14·lh≈26（及更早 mt20 / 22 字）+ hero 220，盖首屏扫读（历史问题）
- ❌ AuthBrandShell 品牌/表单 pad 32×28 / 48×40 + gap20 松井，与欢迎次密/chrome 断裂（历史问题）
- ❌ AuthBrandShell 表单 Title mt10 + Form 项 mb24 + `size=large`≈40，与 `.setting-common-form` 12/28 断裂（历史问题）
- ❌ 落地次屏 4.5rem section + 0.85 对照行 / compare 头松距，与 AuthBrandShell 次密断裂（历史问题）
- ❌ 分享成功态 meta gap4 / stage 8×12 + 表清单 8×12·13 标题 / 弹层 Paragraph 12·Compact 16，与 LandingChrome 次密断裂（历史问题）
- ❌ Home hero actions gap12 / secondary 6×14 / hero 32·20 松井，与分享成功态次密断裂（历史问题）
- ❌ Home 空态 40×16 + 公告行 8×16 / 区块 32 底距松井，与 hero CTA 次密断裂（历史问题）
- ❌ 设计器次屏逆向 Steps 16/24 + 实体表 Card mb16 / 高级导出 DDL 无壳 / SyncConfig 裸 Modal，与 setting/export 次密断裂（历史问题）
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
- ❌ 空态 panel `margin-top: min(10vh, 88px)` 首屏顶区偏松（历史问题）
- ❌ 空态 title mt16 / desc mb18 纵节奏松井（历史问题）
- ❌ 命令面板输入 height 48 / 行 pad 10×12 松卡片，与 22 chrome 不同阶（历史问题）
- ❌ 命令面板无匹配空态 pad 16×12 + list pad 4，与行 pad 6/8 / 22 chrome 不同阶（历史问题）
- ❌ 实体新建弹层默认 520 宽 + Form 24 间距松卡片，与 22 chrome 不同阶（历史问题）
- ❌ 导入/导出 Modal 默认头脚松距 + 大号控件，与 22–28 chrome 不同阶（历史问题）
- ❌ 导入/导出弹层 Steps 仅 mb12、标题默认字号，与次屏 Steps ≤10/12 断裂（历史问题）
- ❌ 左树默认 ~28 行高 + 16 工具条松距，与 22 chrome 不同阶（历史问题）
- ❌ CommonTabs 栏 40px + 表设计签头 10×16 松距，与 22 chrome 不同阶（历史问题）
- ❌ 版本列表 8×12 松行 + 16 标题 / 工具条 28 + rgba 碎色，与 22–28 chrome / `--erd-*` 不同阶（历史问题）
- ❌ 版本列表空态 pad 16×12，相对工作台列表空态 12×8 / 8–12 族偏松（历史问题）
- ❌ 工单/审批默认 Table 松行 + `marginBottom:16` 标题，与 22–28 chrome 不同阶（历史问题）
- ❌ JExcel datatables 头 pad10/行 pad8 + `#fbf8fb` 斑马 / 版本 diff 碎 hex，与 22–28 chrome / `--erd-*` 不同阶（历史问题）
- ❌ 元数据应用 CodeTab/DbTab 默认 antd 松签 + 字 11，与 CommonTabs ~24 不同阶（历史问题）
- ❌ 普通导出页 16 pad + Title level4 松卡片 / 图标裸 `#DE2910`，与 22–28 chrome / `--erd-*` 不同阶（历史问题）
- ❌ Home / Group 导航图标硬编码 `#DE2910`，与 DesignLayout `erdColors.brand` 割裂（历史问题）
- ❌ dataTypeDomains 树图标硬编码 `#DE2910`，与 `erdColors.brand` 割裂（历史问题）
- ❌ 设置页默认 Form 24 间距 + 大号控件，与 22–28 chrome 不同阶（历史问题）
- ❌ 账号设置 20 标题 + 14 松行 / Home 项目卡 16×18 pad，与 22–28 chrome 不同阶（历史问题）
- ❌ 授权类型裸 `Result` + 硬编码 `#DE2910`，与账号设置密度 / `--erd-*` 割裂（历史问题）
- ❌ 公告行标题↔时间 gap12，相对行 pad 4×8 / 8–12 族偏松（历史问题）
- ❌ 个人/最近/团队/公告列表 Title level4 + List large 松行，与 22–28 chrome 不同阶（历史问题）
- ❌ 分享页 hint 13px + 12 间距 / 描述无 ellipsis 抢画布高（历史问题）
- ❌ 分享展开表清单 16 pad + 14 标题 + antd 默认松行，与 22–28 / project-list 不同阶（历史问题）
- ❌ 分享失效页裸 `Result` 403，与登录 `AuthBrandShell` / 三壳 token 割裂（历史问题）
- ❌ 404/403 裸 `Result`，与登录 / 分享失效 `AuthBrandShell` 割裂（历史问题）
- ❌ 表选中 a18、Frame 选中 a12 光晕分叉（历史问题）
- ❌ 工作台铺满水印 + GitHub stars 外链图，模板脸盖过产品感（历史问题）

---

## 8. 精密工具站（ADR-0026）

营销壳与工作台共用「工程级精度」语言；**浅色工作台精密化 ≠ 全局暗色**（ADR-0010）。

- ✅ 落地 / AuthBrandShell：`--erd-void` + 细网格 + IBM Plex + 品牌红 CTA；产品窗/hero 锐利，不做霓虹 glow
- ✅ Home / Design chrome：hairline 顶栏、mono 状态 chip、项目卡细边框弱阴影（非厚卡片堆）
- ✅ Token 真相源：`theme/tokens.ts` + `css-vars.less`（`--erd-hairline` / `--erd-chrome-blur` / kicker）
- ❌ 本阶段给设计器/工作台加暗色 toggle 或 `prefers-color-scheme` 半套换皮
- ❌ 用紫色渐变 / 赛博霓虹 / 厚多层阴影「模板营销页」盖过产品感
- ❌ 为炫酷重画 ReactFlow 表节点皮肤（与分享图、视觉 E2E 基线冲突；后置）

---

## 评审检查单

提交涉及 UI 的 PR 前自问：

1. 操作失败时用户会看到什么？
2. 这个操作能用键盘完成吗？
3. 这个弹窗能不能用内联/右键替代？
4. 第一次来的用户知道这个页面该点哪吗？
5. 误操作能撤销吗？危险操作有确认吗？
6. 等待超过 300ms 的地方有加载态吗？
7. 壳层是否仍是「精密工具站」而非暗色半套或模板卡片堆？
