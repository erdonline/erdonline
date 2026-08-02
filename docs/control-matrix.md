# 全站控件矩阵（单一事实源）

> 服务 P2b「全站控件闭环」。每波收口同步改本表。  
> 状态：✅ 已有 E2E/自动化覆盖 · 🚧 开放待闭环 · 💀 已知死表面 · 🗑 待删除 · 📋 延期  
> 采集：手工可跑 `frontend/tests/e2e/control-inventory.spec.ts`（默认 skip，不进 CI）。

## 波次索引

| 波 | 范围 | roadmap |
|---|---|---|
| W0 | HomeLayout / GroupLayout 子路由壳 | ✅ |
| W1 | 获客与会话（登录/注册/退出/头像） | ✅ |
| W2 | 项目面（home / person / group / recent / new） | 🚧 |
| W3 | 设计器核心（模型树/关系图/项目菜单） | 🚧 |
| W4 | 版本时光机（版本/工单/审批） | 🚧 |
| W5 | 导入导出 + 数据源 | 🚧 |
| W6 | 外围裁剪（dataDomain/query/ChatSQL/account/占位） | 🚧 |

---

## W0 — 布局壳

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| HomeLayout | 子路由内容区 | 渲染 `props.children`，主内容可见（非仅 slogan） | `/home` 等 Home 路由 | ✅ | `layout-outlet.spec` `/home` |
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
| HomeLayout 菜单 | 首页 | → `/home` 主内容 | W0 | 🚧 | |
| HomeLayout 菜单 | 数据模型 | → `/dataModels` | 项目列表别名面 | 🚧 | |
| HomeLayout 菜单 | 数据查询 | → `/dataQuery` | W6 | 🚧 | |
| HomeLayout 菜单 | 数据源 | → `/databaseConfig` | ADR-0008 / W5 | 🚧 | |
| HomeLayout 菜单 | ERD Online 论坛 | 外链 Discussions | 社区 | 📋 | 外链不测 |

### `/home` 快捷

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| `/home` | 新建模型 `home-link-new-project` | → `/project/person` | 空态新建 | ✅ | `activation` / `project-activation` |
| `/home` | 示例项目 `home-link-example` | 建示例并进设计器见表 | 30s 激活 | ✅ | `activation.spec` |
| `/home` | 导入模型 | → `/project/person`（引导） | 导入在设计器 | 🚧 | 仅导航 |
| `/home` | 最近项目 | → `/project/recent` | | 🚧 | `ux-audit` 曾 goto |
| `/home` | 个人项目 | → `/project/person` | | ✅ | `project-activation` / `smoke` |
| `/home` | 团队项目 | → `/project/group` | | 🚧 | `ux-audit` goto |
| `/home` | VIP/授权角标 | → account identification | | 🚧 | |

### 项目列表路由

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| `/project/person` | 空态「新建」 | 弹窗→创建→列表可见 | VIP/开源不限数 | ✅ | `project-activation`「新建」 |
| `/project/person` | 一键示例 | 示例进设计器 | | ✅ | `project-activation` / `activation` |
| `/project/person` | 项目卡片打开 | 进 `/design/table/model?projectId=` | 死链已修 | ✅ | `smoke`「登录→新建→设计器」 |
| `/project/person` | 删除项目 | 确认后列表消失；可再建 | 缓存 | ✅ | `smoke` 清理路径 |
| `/project/recent` | 列表/打开 | 打开最近项目进设计器 | | 🚧 | |
| `/project/group` | 团队项目列表/打开 | 进设计器或设置 | 权限 | 🚧 | `empty-projectjson` API 侧 |
| `/project/group` | 进入团队设置 | → `/project/group/setting/basic` | GroupLayout | 🚧 | 依赖 W0 |
| `/project/notice` | 通知列表 | 可读/可点处理 | | 🚧 | |
| `/project/new` | （整页） | 无真实新建闭环（ZeroCode 占位栅格） | 应删或 redirect→person | 💀 | W2：🗑 或 redirect |
| `/dataModels` | 模型列表入口 | 与项目列表等价可用 | | 🚧 | |

---

## W3 — 设计器核心

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| DesignLayout 菜单 | 模型 | → `/design/table/model` | 关系图 | ✅ | `relation` / `smoke` |
| `/design/table/model` | 树「关系图」`tree-open-relation` | 打开画布标签 | RF | ✅ | `relation.spec` |
| `/design/table/model` | 空态建表 CTA | 表节点出现 | | ✅ | `relation` 全旅程 |
| `/design/table/model` | 内联字段/连线/守卫 | 持久化刷新仍在 | | ✅ | `relation` |
| `/design/table/model` | 表头 ✎ 改名 | 名称更新 | | ✅ | `relation`「改名」 |
| `/design/table/model` | PK 徽标切换 | 取消/恢复 | | ✅ | `relation`「PK」 |
| `/design/table/model` | 树删表 | 二次确认；确认后移除+toast | | ✅ | `smoke` 取消/确认 |
| `/design/table/model` | undo/redo | 可撤销画布操作 | canvasHistory | 🚧 | 单测有；E2E 待 |
| `/design/table/model` | 删边 | 确认后边消失并落库 | | 🚧 | |
| DesignLayout | 项目菜单按钮 | 下拉打开 | | ✅ | `project-menu.spec` |
| 项目菜单 | 版本 | → 版本管理 | | ✅ | `project-menu`「版本」 |
| 项目菜单 | 导入→三项 | 弹窗可开、关下拉不挡 | | ✅ | `project-menu`「导入」 |
| 项目菜单 | 导出→五项 | 可见；DDL 可开 | | ✅ | `project-menu`「导出」 |
| 项目菜单 | 设置→数据源设置 | 弹窗可开 | ADR-0008 | ✅ | `project-menu`「数据源设置」 |
| 项目菜单 | 设置→默认项设置 | 打开+保存成功提示 | | ✅ | `project-menu`「默认项」 |
| DesignLayout | 自动保存状态 | 可见保存中/已保存 | P2 | 🚧 | checklist |
| DesignLayout | 命令面板/快捷键 | 面板切换有反馈 | shortcut store | 🚧 | |
| `ProjectSortMenu` | 创建时间/最近修改 | 无调用方；项无排序行为 | 死代码 | 💀 | W6 🗑 |
| `ProjectFilterMenu` | 过滤1/过滤2 | 无调用方；仅切 shortcut 面板 | 死代码 | 💀 | W6 🗑 |
| `NavigationMenu` | （空水平菜单） | 占位防白屏，无入口 | | 💀 | W6 🗑 |

---

## W4 — 版本时光机

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| DesignLayout 菜单 | 版本管理 | → `/design/table/version/all` | | ✅ | `project-menu` / `version` / `loading` |
| `/design/table/version/all` | 新增版本（无数据源） | 列表可见新版本 | 北极星 | ✅ | `version.spec`「新增」 |
| `/design/table/version/all` | 版本详情 diff | 增删改着色 | | ✅ | `version.spec`「diff」 |
| `/design/table/version/all` | 重命名/删除版本 | 列表更新+toast | VersionHandle | 🚧 | |
| `/design/table/version/all` | 对比版本 | 对比结果可见 | | 🚧 | |
| `/design/table/version/all` | 回滚 | 落库；刷新后模型仍回滚 | | ✅ | 回滚落库；version/approval 绿 |
| DesignLayout 菜单 | 我的工单 | → `/design/table/version/order` 空态引导 | | ✅ | `approval.spec` |
| DesignLayout 菜单 | 我的审批 | → `.../approval` 空态引导 | | ✅ | `approval.spec` |
| 工单/审批 | 提交→通过/拒绝全链路 | 状态变更可见 | 需有数据 | 🚧 | 空态已覆盖；有数据链路待 |

---

## W5 — 导入导出 + 数据源

### 侧栏导入/导出页

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| `/design/table/import/reverse` | 逆向解析提交 | 表进入模型 | ADR-0006 | 🚧 | 待「假库/文件→模型可见」 |
| `/design/table/import/pdman` | 上传 PdMan | 模型可见 | | 🚧 | |
| `/design/table/import/erd` | 上传 ERD | 模型可见 | | 🚧 | |
| `ReverseERWin` | 解析 ERWin 文件 | 仅 toast「开发中」；菜单未挂 | stub | 💀 | W6 🗑 |
| `/design/table/export/common` | 导出 Markdown | 文件下载 | 无 G6 | ✅ | `export.spec` |
| `/design/table/export/common` | 导出 HTML/Word/ERD | 下载或明确失败 | | 🚧 | 菜单入口✅；终步待 |
| `/design/table/export/more` | 高级导出 DDL | 有源+表时可进第二步 | ADR-0008 | ✅ | `project-menu`「DDL 第二步」 |
| `/design/table/export/more` | DDL 终步下载 | 产出 SQL 文件 | | 🚧 | 终步待 |

### `/databaseConfig`

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| `/databaseConfig` | 新建/保存数据源 | POST dataSources；profile 无 password | ADR-0008 | ✅ | `adr0008-datasource.spec` |
| `/databaseConfig` | 测试连接 | 成功/失败 toast | | 🚧 | |
| `/databaseConfig` | 编辑/删除/批量删 | 列表更新 | | 🚧 | |
| `/databaseConfig` | 同步状态钮 | 状态刷新 | | 🚧 | |
| `/databaseConfig` 顶栏 | 「统计」按钮 | 无 onClick | 死 affordance | 💀 | W6 接线或 🗑 |
| `/databaseConfig` 顶栏 | 「帮助」按钮 | 无 onClick | 死 affordance | 💀 | W6 接线或 🗑 |

---

## W6 — 外围与账户

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| DesignLayout 菜单 | 数据域 | → `/design/dataDomain` 可编辑保存 | | 🚧 | 无价值则裁剪导航 |
| DesignLayout 菜单 | 查询 | → `/design/table/query` 执行有结果/错误 | | 🚧 | |
| DesignLayout 菜单 | Chat SQL | 实验面；默认不扩能力 | AI 后置 | 💀 | 隐藏或标实验 |
| `/design/table/chatsql` | 页内发送等 | 实验；不作为北极星闭环 | | 📋 | 不扩模型 |
| `/design/table/setting/defaultField` | 默认字段保存 | toast + 新表带默认字段 | | 🚧 | |
| `/design/table/setting/default` | 系统默认项 | 同项目菜单默认项 | | ✅ | `project-menu`「默认项设置」 |
| `/dataQuery` | 查询 CRUD/执行 | 有反馈 | Home 菜单 | 🚧 | |
| `/account/settings` | 基本资料保存 | toast | | 🚧 | |
| `/account/settings` | 「更换头像」Upload | 无 action/上传逻辑（空壳） | | 💀 | W6 接线或 🗑 |
| `/account/settings` | 其它 selectKey 页签 | 可切换有内容 | | 🚧 | |
| `/project/group/setting/basic` | 保存基本设置 | toast | GroupLayout/W0 | 🚧 | |
| `/project/group/setting/permission` | 权限组维护 | 成员可见 | access | 🚧 | |
| GroupLayout 菜单 | 返回项目列表 | → `/dataModels` | | 🚧 | |
| GroupLayout 菜单 | 打开模型 | → 设计器 | projectId | 🚧 | |
| `/*` | 404 页 | 未知路径友好提示 | | 🚧 | |

---

## 其它已覆盖横切

| 表面 | 控件 | 预期闭环 | 关联链路 | 状态 | 验证 |
|---|---|---|---|---|---|
| 已删认证路径 | `/login/success` 等 | 前端无页；后端不可用 | 清死代码 | ✅ | `dead-auth-routes.spec` |
| 画布大项目 | 视口裁剪 | 离屏节点不渲染 | 性能预算 | ✅ | `canvas-scale.spec` |
| 协作 sync | 远端改动 toast | info / warning | ADR-0009 | ✅ | `sync-toast.spec` |
| 加载骨架 | 列表/设计器/版本 | `aria-busy` + 可访问名 | | ✅ | `loading.spec` |
| UX 不变量 | 死 affordance/账密 | 全旅程截图+断言 | | ✅ | `ux-audit.spec` |
| 空 projectJSON | 团队项目加模型 | 可新增模型 | | ✅ | `empty-projectjson.spec` |

---

## 统计（v1 初版）

| 状态 | 行数 |
|---|---|
| ✅ | 45 |
| 🚧 | 44 |
| 💀 | 9 |
| 📋 | 2 |
| **合计** | **100** |

Vision loop：有 P2b 🚧 时，优先啃本表下一行可验证 🚧 切片（见 `scripts/agent-loop-vision.prompt.md`）。
