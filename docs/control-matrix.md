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
| `/project/notice` | 通知列表 | 首页「更多公告」→列表可读；失败 toast | | ✅ | `project-notice.spec` |
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
| `/design/table/model` | 表头 ✎ 改名 | 名称更新；chnname 双栏内联 | | ✅ | `relation`「改名」/「表头中文名」 |
| `/design/table/model` | PK 徽标切换 | 取消/恢复 | | ✅ | `relation`「PK」 |
| `/design/table/model` | 树删表 | 二次确认；确认后移除+toast | | ✅ | `smoke` 取消/确认 |
| `/design/table/model` | undo/redo | 可撤销画布操作 | canvasHistory | ✅ | `relation` 全旅程 Meta+z |
| `/design/table/model` | 删边 | 确认后边消失并落库 | | ✅ | `relation`「删边后刷新仍无边」 |
| DesignLayout | 项目菜单按钮 | 下拉打开 | | ✅ | `project-menu.spec` |
| 项目菜单 | 全部项目 | → `/project/recent` | | ✅ | `project-menu`「全部项目」 |
| 项目菜单 | 最近项目 | 最多 5 条；当前 ✓；点其它项切设计器 | | ✅ | `project-menu`「最近项目可切换」 |
| 项目菜单 | 版本（已迁顶栏） | 顶栏「版本」→ 版本管理；菜单内无「版本」 | | ✅ | `project-menu`「全部项目…顶栏版本」 |
| 项目菜单 | 导入→三项 | 弹窗可开、关下拉不挡 | | ✅ | `project-menu`「导入」 |
| 项目菜单 | 导出→五项 | 可见；DDL 可开 | | ✅ | `project-menu`「导出」 |
| 项目菜单 | 设置→数据源设置 | 弹窗可开 | ADR-0008 | ✅ | `project-menu`「数据源设置」 |
| 项目菜单 | 设置→默认项设置 | 打开+保存成功提示 | | ✅ | `project-menu`「默认项」 |
| DesignLayout | 自动保存状态 | 顶栏可见保存中/已保存 | P2 | ✅ | `relation.spec`「保存中…→已保存」 |
| DesignLayout | 命令面板/快捷键 | Cmd/Ctrl+K 开合；执行有结果 | RF CommandPalette | ✅ | `relation.spec`「命令面板」；全旅程亦覆盖 |
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

---

## W5 — 导入导出 + 数据源

### 侧栏导入/导出页

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| `/design/table/import/reverse` | 逆向解析提交 | 表进入模型 | ADR-0006 | ✅ | `import-reverse.spec`（MySQL `reverse_demo`） |
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
| `/design/table/setting/defaultField` | 默认字段保存 | toast + 新表带默认字段 | | ✅ | `default-field.spec`「编辑保存有 toast」 |
| `/design/table/setting/default` | 系统默认项 | 同项目菜单默认项 | | ✅ | `project-menu`「默认项设置」 |
| `/dataQuery` | 页内运行/CRUD | 实验；失败有 toast；不扩真·DS SELECT | | 📋 | 不扩 JDBC 查询台 |
| `/account/settings` | 基本资料保存 | toast | | ✅ | `account-settings.spec` |
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
