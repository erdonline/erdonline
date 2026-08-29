# 文案整改计划（提升注册与使用量）

> 依据 `.cursor/rules/copywriting-style.mdc`。目标：北极星 = 每周产生版本保存的活跃建模项目数；辅助 = 注册率、Demo 完成率、PAT 铸造数、MCP 接入数。

## 现状诊断（抽样）

| 位置 | 问题 | 风险 |
|---|---|---|
| Landing Hero | 「在线绘制 ER 图」偏功能描述，未突出「版本 + 协作 + Agent 共用」差异化 | 首访不知道为何要留下 |
| Landing Pillars | 「三件事，构成壁垒」偏内部语言，用户不知道「我得到什么」 | 价值主张不清晰 |
| Demo 空态/CTA | 「在线试用」 vs 「打开演示」混用；未明确「不用注册」 | 首访流失 |
| README MCP | 只列 Cursor，未列 Claude/Cline/Windsurf；未强调「不是 ChatSQL」 | 预期错误、Agent 生态窄 |
| 注册页 | 未给出「先看 Demo 再注册」路径 | 注册率被 Demo 漏斗截断 |
| PAT 弹层 | 成功文案弱；未强调「明文只显示一次」 | 用户忘存 PAT，MCP 接入失败 |
| cursor-mcp 页 | 刚重写，但「Open in Cursor」失败路径不够明显 | 转化率损耗 |
| 错误/空态 | 部分仍写「出错了」「无数据」 | 用户卡住，直接关闭 |

## 整改原则

1. **先修流量入口**：Landing → Demo → 注册 是最大漏斗。
2. **先修信任**：诚实边界（不做什么）比「我们很强」更能建立信任。
3. **先修 Agent 路径**：MCP/PAT 是 2026 年差异化入口，必须低摩擦。
4. **每处改动可度量**：能加埋点就加，不能就前后对比。

## 分阶段计划

### Phase 0 — 统一术语与 CTA（1–2 天，无 UI 改动）

- [ ] 全局 grep 术语不一致：`智能` / `一键生成` / `AI 自动` / `平台`（非事实源语境）
- [ ] 统一 CTA 文案：
  - Landing 未登录：`打开在线 Demo`（弃用「在线试用」）
  - Landing 已登录：`进入工作台`（已统一）
  - Demo 页：`改一张表，存一个版本，看一次 diff`
  - README：`Add ERD Online MCP to Cursor` → `Open in Cursor`（已改）
- [ ] 更新 `llms.txt` 与 SEO description 与新文案一致

**验证点**：`frontend/src/locales/zh-CN.ts` 与 `en-US.ts` 关键 key 文案对齐；E2E `prod-smoke` 不红。

### Phase 1 — Landing 页价值主张重写（2–3 天）

**目标**：首访 30 秒内知道「这是什么、能给我什么、我下一步做什么」。

- [ ] Hero Lead 强化差异化：
  - 中：`在线绘制 ER 图：版本、协作、开放格式——人和 AI agent 共用同一份数据结构。`
  - 英：`Draw ER diagrams online — versioning, collaboration, and an open format humans and AI agents share.`
- [ ] Pillars 从「我们有什么」改为「你能做什么」：
  - 版本：「每次保存自动生成版本，diff 可见，随时回滚」
  - 协作：「多人同图实时编辑，评审与审批流把变更收进可审计的版本」
  - 开放：「projectJSON 公开格式；Agent 通过 MCP 读取同一份模型，用 create_version 提交一版，人再 diff」
- [ ] 增加「先看 Demo 再注册」微文案，主 CTA 永远指向 Demo。
- [ ] 注册 CTA 文案：`注册后即可保存、分享、协作`（副标题）。

**验证点**：Playwright 走查 landing；统计 `landing_view` → `demo_open` → `register_click` 转化率。

### Phase 2 — Demo 与注册闭环（2–3 天）

**目标**：让 Demo 页明确引导注册，注册页明确价值。

- [ ] Demo 页顶部条（非登录）：`这是公开演示。想保存、分享、协作？注册一个账号。`
- [ ] Demo 页 CTA：`注册后保存我的项目`（跳转注册，带 redirect）
- [ ] 注册页 Hero：
  - 标题：`保存你的第一张 ER 图`
  - 副标题：`无需信用卡。可先打开 Demo 看图，满意再注册。`
  - 表单下方微文案：`注册即同意服务条款与隐私政策`（合规）
- [ ] 登录页增加「没有账号？先看 Demo」次级链接。

**验证点**：E2E 注册旅程；统计 `demo_view` → `register_start` → `register_success`。

### Phase 3 — MCP / Agent 路径强化（1–2 天）

**目标**：PAT 铸造数、MCP 接入数提升。

- [ ] PAT 弹层：
  - 标题：`铸造 Personal Access Token`
  - 正文：`明文只显示一次。复制下面 mcp.json 后，把 erd_pat_… 换成这串明文。`
  - 主 CTA：`复制 mcp.json`；次 CTA：`一键在 Cursor 中打开`
  - 成功反馈：`已复制。现在把 erd_pat_… 换成你的明文 PAT。`
- [ ] `cursor-mcp` 页面：
  - 三步结构已具备；增加「如果没打开 Cursor，复制上面 JSON 手动粘贴」的 fallback 文案加粗。
  - FAQ 加一条：`为什么我不能用一句话生成 ER 图？` → `因为这是数据库设计的 Git + Figma，不是 ChatSQL。`
- [ ] README MCP 章节：已加客户端列表；下一步在 README 加「先看 30 秒 Demo」链接。

**验证点**：`personal-access-tokens.spec.ts` 断言新文案；统计 PAT 铸造数与 MCP 接入数。

### Phase 4 — 错误与空态文案（1–2 天）

**目标**：减少用户卡住流失。

- [ ] 全局错误消息模板：
  - 网络：`网络连接失败。点击重试。`
  - 401/403：`PAT 已过期或权限不足。请重新铸造。`
  - 空项目：`还没有项目。先在建模器里创建第一个项目，再回到这里。`
  - Demo 不能当 PAT：`Demo 分享链接不能当 PAT。请登录后铸造自己的 PAT。`
- [ ] 空态统一结构：`图标 + 一句话解释 + 主 CTA + 次 CTA`
  - 项目列表空：`还没有项目 → 新建项目 / 从模板创建 / 打开 Demo`

**验证点**：E2E 空态断言；UX 走查 `playwright-ux-audit.mdc`。

### Phase 5 — 文档与 README 收口（1 天）

- [ ] `docs/guide/api-and-mcp.md`：保持现状，但把「30 秒接到 Cursor」标题改为「30 秒接到 AI Agent（Cursor / Claude / Cline）」。
- [ ] `docs/guide/what-is-erd-online.md`：增加「如果你用 AI Agent」小节，指向 MCP 指南。
- [ ] `README.md` / `README.en-US.md`：顶部 Demo 链接加 `utm_source=github`。

**验证点**：`yarn build` + `yarn test:seo` 绿；README 链接可点。

## 度量看板（每轮更新）

| 指标 | 当前 | 目标 | 测量方式 |
|---|---|---|---|
| Landing → Demo 点击率 | ？ | +20% | `track('landing_view')` vs `track('demo_open')` |
| Demo → 注册转化率 | ？ | +15% | `demo_open` vs `register_start` |
| 注册完成率 | ？ | +10% | `register_start` vs `register_success` |
| PAT 铸造数/周 | ？ | +30% | 后端统计 |
| MCP 接入数/周 | ？ | +30% | PAT 使用日志或 `mcp/tools/list` 调用 |
| 每周活跃建模项目数（北极星） | ？ | +25% | 版本保存日志 |

> 当前数据未收集；Phase 0 前先加埋点（如果还没有）。

## 不做

- 不做 A/B 测试框架（先手动前后对比）。
- 不做弹窗/浮层轰炸式注册引导（违背零摩擦）。
- 不做「AI 一键生成 ER 图」文案（违背定位）。
- 不在首页放超过 3 个 CTA。

## 触发评审

任何 Phase 的改动完成后，按 `iteration-protocol.mdc` 走：
1. commit（Conventional Commits）
2. E2E / 走查验证
3. CHANGELOG + 本文件状态标记（📋→🚧→✅）
4. 指标对比写入 `docs/growth.md`
