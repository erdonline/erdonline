# ERD Online 增长 SOP（可重复执行）

> **执行人**：便宜的模型 / 运营助理  
> **监督人**：你（Devin）  
> **核心目标**：从 4 star → 100 star（30 天内），建立可持续的获客通道  
> **北极星指标**：每周活跃建模项目数（非空 diff 的版本保存）  
> **核心策略**：**AI 方向优先**，用 MCP 集成（Cursor / Claude / Cline）作为差异化获客钩子

---

## 一、现状诊断（数据说话）

| 指标 | 数值 | 结论 |
|---|---|---|
| GitHub Star | 4 | 几乎无人知道产品存在 |
| Cloudflare Visits（6小时） | 0 | 零真实流量 |
| Cloudflare Page Views（6小时） | 4 | 仅爬虫/健康检查 |
| HTTP Requests（昨天） | 5,645 | 静态资源/爬虫请求，非用户 |
| Landing 页 i18n | 显示原始 key（`landing.compare.cta.primary`） | **致命信任 bug** |
| Demo 页 CTA | 只有"Sign in"，无"Fork 开始编辑" | 转化断点 |

**核心结论**：不是转化率问题，是**零流量 + 零曝光**。先解决"让人知道"，再解决"让人喜欢"。

**差异化优势**：MCP 集成（AI Agent 读写 schema）是**2026 年最热的技术方向**，也是我们唯一比 dbdiagram / Navicat / drawio 强的地方。

---

## 二、增长漏斗（每周复盘）

```
曝光（Impressions）
  ↓ 点击率（CTR）
访问（Visits to erdonline.com）
  ↓ 跳出率（Bounce Rate）
Demo 打开（Demo Views）
  ↓ Demo 完成率（改表→存版本→看 diff）
注册（Signups）
  ↓ 激活率（创建第一个项目）
MCP 接入（PAT 铸造 + mcp.json 配置）
  ↓ AI Agent 使用率（list_projects / create_version 调用）
留存（Weekly Active Projects）
  ↓ 推荐意愿（NPS / Star / Share）
```

**当前断点**：曝光 → 访问（0 visits）

**关键转化点**：MCP 接入（这是差异化优势，必须强化）

---

## 三、可重复执行 SOP（每周循环，集中执行）

### Phase A：数据采集与诊断（每周一，30 分钟）

**执行者**：cheap model / 脚本  
**工具**：Cloudflare GraphQL API + 本地脚本

1. **运行数据拉取脚本**（见附录 A）：
   - 拉取过去 7 天：Visits、Page Views、Top Pages、Traffic Sources
   - 拉取 GitHub API：Stars、Forks、Issues、Traffic
   - 拉取 MCP 使用数据：PAT 铸造数、`list_projects` 调用数、`create_version` 调用数
   - 输出到 `docs/growth-data/YYYY-MM-DD.md`

2. **人工诊断**（你，10 分钟）：
   - 对比上周数据，标记异常（流量下跌？跳出率上升？MCP 接入率低？）
   - 决定本周重点：修 bug / 写内容 / 发渠道

---

### Phase B：产品体验优化（每周集中 2-4 小时）

**执行者**：cheap model  
**优先级**：P0（阻断转化）→ P1（影响信任）→ P2（锦上添花）

**P0 清单（本周必须完成）**：
- [ ] **修复 Landing 页 i18n bug**：`landing.compare.cta.primary`、`landing.pillar.*.title` 显示原始 key
  - 文件：`frontend/src/pages/landing/index.tsx`、`frontend/src/locales/zh-CN.ts`、`frontend/src/locales/en-US.ts`
  - 验证：`yarn build:prod` + Playwright 检查无原始 key
- [ ] **Demo 页增加"Fork 开始编辑"强引导**：
  - 在 Demo 页顶部增加 banner："这是公开演示。Fork 到你的项目，开始编辑、保存版本、邀请协作。"
  - CTA：`Fork 开始编辑`（跳转注册，带 redirect）
- [ ] **Landing 页 CTA 收敛 + AI 强化**：
  - 未登录：主 CTA = `打开在线 Demo`，次 CTA = `给 Cursor 配 MCP`
  - 移除"查看完整对照"（放到 footer）
  - 在 Hero 下方增加"MCP 集成"卡片：展示 Cursor / Claude / Cline 图标 + "30 秒接入"链接

**P1 清单（下周完成）**：
- [ ] 注册页文案优化："注册后即可保存、分享、协作、给 AI Agent 配 MCP"
- [ ] 错误/空态文案统一（参考 `.cursor/rules/copywriting-style.mdc`）
- [ ] `cursor-mcp` 页增加"手动复制" fallback 提示
- [ ] PAT 铸造弹层增加"已复制。现在把 erd_pat_… 换成你的明文 PAT。"成功反馈

---

### Phase C：内容生产与推广（每周集中 4-6 小时，一天完成）

**执行者**：cheap model + 你（审核）  
**核心策略**：**AI 方向优先**，所有内容围绕"AI Agent 管理数据库 schema"

#### 渠道优先级（按 ROI 排序）

| 渠道 | 频率 | 内容类型 | 目标 | AI 重点 |
|---|---|---|---|---|
| **Product Hunt** | 一次性（本周） | Launch post | 首日曝光 500+ | ✅ 强调 MCP |
| **Hacker News** | 每两周 | Show HN | 首页曝光 | ✅ 强调 MCP |
| **Reddit r/programming** | 每周 | 技术深度 | 精准流量 | ✅ 强调 MCP |
| **Reddit r/ClaudeAI** | 每周 | MCP 集成 | 精准流量 | ✅✅ 核心渠道 |
| **Reddit r/cursor** | 每周 | MCP 集成 | 精准流量 | ✅✅ 核心渠道 |
| **X/Twitter** | 每日 | 短内容 + GIF 演示 | 持续曝光 | ✅ 强调 MCP |
| **技术博客** | 每周 | Dev.to / Hashnode / Medium | SEO + 长尾 | ✅ 强调 MCP |
| **中文社区** | 每周 | 掘金、V2EX、知乎 | 中文用户 | ✅ 强调 MCP |

#### 1. Product Hunt Launch（本周执行）

**准备材料**（cheap model 生成，你审核）：
- [ ] Tagline（60 字符）：`Git + Figma for database design, with MCP for AI agents`
- [ ] Description（260 字符）：`Open-source ERD tool with versioning, real-time collaboration, and MCP integration. Let Cursor, Claude, and Cline read/write your schema. Try the live demo in 30 seconds — no signup required.`
- [ ] 3 张截图：Landing / Demo / MCP 集成（Cursor 中调用 `list_projects`）
- [ ] 1 个 GIF：30 秒 demo 动线（改表→存版本→看 diff→给 Cursor 配 MCP）
- [ ] First comment：详细介绍 + 技术栈 + 差异化 + **MCP 是核心卖点**

**发布 checklist**：
- [ ] 周二 00:01 PST 发布（流量高峰）
- [ ] 发布后 1 小时内回复所有评论
- [ ] 在 X/Twitter/LinkedIn 同步宣传
- [ ] 邀请朋友/upvote（合规范围内）

#### 2. Hacker News（Show HN）

**标题模板**：
```
Show HN: ERD Online – Open-source database design with MCP for AI agents
```

**正文模板**：
```
I built ERD Online because existing tools force a trade-off:

- dbdiagram: pretty but closed, no versioning, no AI integration
- Navicat/PDManer: powerful but heavy, desktop-only, no AI integration
- drawio: free but doesn't understand databases, no AI integration

ERD Online is Git + Figma for database design, with MCP for AI agents:

**Versioning**: Every save creates a version you can diff and rollback

**Collaboration**: Real-time multiplayer editing (like Figma)

**MCP Integration**: AI agents (Cursor, Claude, Cline) can read your schema via MCP and suggest changes via create_version. You still diff and approve in the designer.

This is the key difference: AI agents read/write the same projectJSON the canvas uses. No black-box magic. You stay in control.

Try the live demo (no signup): https://www.erdonline.com/demo

Tech stack: React 18 + UmiJS + Spring Boot 3.5 + PostgreSQL
License: MIT

Would love feedback on the MCP integration. Is this the right boundary for AI agents?
```

**发布时间**：周二 9-11 AM PST（与 Product Hunt 同一天）

#### 3. Reddit（每周集中发布，一天完成）

**Subreddit 清单**（按优先级排序）：
- **r/cursor**（AI 编辑器用户，MCP 核心用户）
- **r/ClaudeAI**（Claude 用户，MCP 核心用户）
- **r/programming**（技术深度，MCP 技术细节）
- **r/webdev**（前端技术，MCP 集成）
- **r/selfhosted**（自部署，MCP 自部署）
- **r/Database**（数据库专业，MCP 应用）
- **r/opensource**（开源社区，MCP 开源）

**标题模板**（按 subreddit 调整）：

**r/cursor**：
```
[OSS] ERD Online – Let Cursor read/write your database schema via MCP
```

**r/ClaudeAI**：
```
[OSS] ERD Online – Let Claude read/write your database schema via MCP
```

**r/programming**：
```
[OSS] ERD Online – Git + Figma for database design, with MCP for AI agents
```

**正文要点**（所有 subreddit 通用）：
- **先说痛点**：现有工具没有 AI 集成
- **再说差异化**：MCP 集成，AI Agent 读写 schema
- **给 Demo 链接**：不要直接给 GitHub，先让人体验
- **最后给 GitHub 链接**：求 star

**发布策略**：
- **集中在一天发布**（比如周二下午）
- **每个 subreddit 间隔 30 分钟**（避免被标记为 spam）
- **发布后 1 小时内回复所有评论**

#### 4. X/Twitter（每日一条，集中在同一天发布）

**内容日历**（AI 方向优先）：

**周一**：功能演示 GIF（改表→存版本→看 diff→给 Cursor 配 MCP）
```
🎯 ERD Online demo in 30 seconds:

1. Open the live demo (no signup)
2. Edit a table
3. Save a version
4. See the diff
5. Give Cursor MCP access

AI agents read/write your schema. You stay in control.

Try it: https://www.erdonline.com/demo

#opensource #database #ai #mcp
```

**周二**：用户场景（"如何用 ERD Online + Cursor 让 AI 帮你改 schema"）
```
💡 How to use ERD Online + Cursor to let AI manage your schema:

1. Mint a PAT in ERD Online
2. Add MCP config to Cursor
3. Ask Cursor: "List my ERD projects"
4. Ask Cursor: "Suggest a new version"
5. You diff and approve in the designer

AI agents read/write the same projectJSON. No black-box magic.

Docs: https://doc.erdonline.com/docs/guide/api-and-mcp/

#ai #database #mcp #cursor
```

**周三**：技术细节（"为什么我们用 projectJSON 作为 AI Agent 的事实源"）
```
🔧 Why we use projectJSON as the source of truth for AI agents:

- Language-agnostic (any AI agent can read/write)
- Versioned (never breaks in-place)
- Open (public format, not proprietary)
- Both humans and AI agents read/write the same format

This is the key to "Git + Figma for database design, with MCP for AI agents".

Tech details: https://doc.erdonline.com/docs/data-format

#database #architecture #ai #mcp
```

**周四**：对比（"ERD Online vs dbdiagram vs drawio: AI integration"）
```
🆚 ERD Online vs dbdiagram vs drawio: AI integration

ERD Online:
✅ MCP integration (Cursor, Claude, Cline)
✅ AI agents read/write schema
✅ You diff and approve in the designer

dbdiagram:
❌ No AI integration

drawio:
❌ No AI integration

Choose the right tool for your AI-powered workflow.

Full comparison: https://www.erdonline.com/compare

#database #devtools #ai #comparison
```

**周五**：社区互动（"你最想用 AI Agent 做什么数据库操作？"）
```
🤔 Question for database developers:

What would you want an AI agent to do with your database schema?

A) Generate migration scripts
B) Suggest index optimizations
C) Detect schema drift
D) Review schema changes
E) Something else (reply below)

Building ERD Online to solve this with MCP integration.

#database #devtools #ai #community
```

**周六**：开源社区（"ERD Online 寻求 AI 方向的贡献者"）
```
🌟 ERD Online is looking for contributors interested in AI integration!

Good first issues:
- Add support for more AI agents (Gemini, GPT-4)
- Improve MCP tool descriptions
- Add more MCP tools (e.g., generate_migration, suggest_indexes)
- Improve AI agent prompts

Tech stack: React 18 + Spring Boot 3.5 + PostgreSQL + MCP

GitHub: https://github.com/erdonline/erdonline

#opensource #contributors #ai #mcp
```

**周日**：用户故事（"如何用 ERD Online + Cursor 让 AI 帮你管理 500+ 表"）
```
📖 How Team X uses ERD Online + Cursor to manage 500+ tables:

"We used to manually review schema changes. Now we use ERD Online + Cursor.

AI agents read our schema via MCP and suggest changes. We diff and approve in the designer. It's like having a junior DBA that never sleeps."

Read the full story: [blog post link]

#database #casestudy #ai #mcp
```

**统一登录**：用 Google 账号登录 X/Twitter（`Erdonline154@gmail.com`）

#### 5. 技术博客（每周一篇，集中在同一天发布）

**平台**：Dev.to / Hashnode / Medium / 掘金 / 知乎

**文章模板**（cheap model 生成初稿，你审核）：

**标题**：
```
How to let AI agents manage your database schema (with MCP)
```

**结构**：
1. **Hook**：AI Agent 是 2026 年最热的技术方向，但数据库 schema 管理还是手动（200 字）
2. **Solution**：ERD Online + MCP 让 AI Agent 读写 schema（300 字）
3. **Technical Deep Dive**：
   - MCP 协议介绍（300 字）
   - ERD Online 的 MCP 集成（`list_projects`、`get_project`、`create_version`）（500 字）
   - 为什么 AI Agent 读写 projectJSON 而不是生成 ER 图（200 字）
4. **Demo**：30 秒动线截图/GIF（改表→存版本→看 diff→给 Cursor 配 MCP）
5. **Call to Action**：GitHub 链接 + Demo 链接 + MCP 文档链接

**SEO 关键词**：
- `mcp for database schema`
- `ai agent database management`
- `cursor mcp integration`
- `claude mcp integration`
- `database schema versioning with ai`

#### 6. 中文社区（每周一次，集中在同一天发布）

**平台**：掘金、V2EX、知乎、SegmentFault

**标题模板**：
```
开源项目推荐：ERD Online - 让 AI Agent 帮你管理数据库 schema（支持 MCP 协议）
```

**正文要点**：
- **痛点**：现有工具没有 AI 集成
- **差异化**：MCP 集成，AI Agent 读写 schema
- **Demo**：30 秒免注册体验
- **求 star**：GitHub 链接

**发布策略**：
- **集中在一天发布**（比如周二下午）
- **每个平台间隔 30 分钟**（避免被标记为 spam）
- **发布后 1 小时内回复所有评论**

---

### Phase D：数据复盘与迭代（每周日，30 分钟）

**执行者**：你 + cheap model  
**输出**：`docs/growth-data/weekly-review-YYYY-MM-DD.md`

**复盘清单**：
- [ ] 本周新增 star 数
- [ ] 本周新增注册数
- [ ] 本周 Demo 完成率
- [ ] 本周 MCP 接入数（PAT 铸造数）
- [ ] 本周 AI Agent 使用数（`list_projects` / `create_version` 调用数）
- [ ] 本周流量来源（哪个渠道效果最好）
- [ ] 本周用户反馈（issue / 评论 / 私信）
- [ ] 下周重点（修 bug / 写内容 / 发渠道）

---

## 四、自动化脚本

### 附录 A：Cloudflare 数据拉取脚本

见 `scripts/growth-data.sh`（已存在，无需修改）

---

## 五、执行清单（给 cheap model）

### 本周任务（Week 1：Launch Week，集中执行）

**Day 1（周一）**：
- [ ] 运行 `scripts/growth-data.sh` 拉取数据
- [ ] 修复 Landing 页 i18n bug（P0）
- [ ] 准备 Product Hunt 材料（tagline、description、截图、GIF）

**Day 2（周二，集中执行）**：
- [ ] **上午**：
  - [ ] 修复 Demo 页"Fork 开始编辑"引导（P0）
  - [ ] 修复 Landing 页 CTA 收敛 + AI 强化（P0）
  - [ ] 验证所有修复（`yarn build:prod` + `yarn test:e2e`）
- [ ] **下午**：
  - [ ] 发布 Product Hunt（00:01 PST）
  - [ ] 发布 Hacker News（9-11 AM PST）
  - [ ] 发布 Reddit r/cursor（下午 2 点 PST）
  - [ ] 发布 Reddit r/ClaudeAI（下午 2:30 PST）
  - [ ] 发布 Reddit r/programming（下午 3 点 PST）
  - [ ] 发布 X/Twitter（功能演示 GIF）
  - [ ] 发布技术博客（Dev.to）
  - [ ] 发布掘金
- [ ] **晚上**：
  - [ ] 回复所有评论（Product Hunt / HN / Reddit / X）
  - [ ] 统计数据（流量、注册、star）

**Day 3（周三）**：
- [ ] 继续回复评论
- [ ] 发布 X/Twitter（用户场景）
- [ ] 发布知乎

**Day 4（周四）**：
- [ ] 继续回复评论
- [ ] 发布 X/Twitter（技术细节）
- [ ] 发布 Reddit r/webdev

**Day 5（周五）**：
- [ ] 继续回复评论
- [ ] 发布 X/Twitter（对比）
- [ ] 发布 Reddit r/selfhosted
- [ ] 数据复盘，准备下周计划

---

### 下周任务（Week 2：Content Week，集中执行）

**Day 1（周一）**：
- [ ] 运行 `scripts/growth-data.sh`
- [ ] 分析 Week 1 数据，找出效果最好的渠道
- [ ] 优化 Landing 页（P1 清单）

**Day 2（周二，集中执行）**：
- [ ] 生成第二篇技术博客初稿（"How to version your database schema like Git with AI agents"）
- [ ] 发布技术博客（Dev.to / Hashnode）
- [ ] 发布 Reddit r/Database
- [ ] 发布 X/Twitter（社区互动）
- [ ] 发布掘金

**Day 3-5（周三-五）**：
- [ ] 继续回复评论
- [ ] 发布 X/Twitter（每日一条）
- [ ] 数据复盘，准备下周计划

---

## 六、度量指标（北极星 + 辅助）

| 指标 | 当前 | Week 1 目标 | Week 4 目标 |
|---|---|---|---|
| GitHub Star | 4 | 20 | 100 |
| Cloudflare Visits（周） | ~0 | 500 | 2,000 |
| Demo 打开数（周） | ? | 100 | 500 |
| 注册数（周） | ? | 20 | 100 |
| **MCP 接入数（周）** | ? | 10 | 50 |
| **AI Agent 使用数（周）** | ? | 20 | 200 |
| 活跃建模项目数（周） | ? | 5 | 25 |
| Landing 跳出率 | ? | <60% | <50% |

---

## 七、风险与应对

| 风险 | 概率 | 应对 |
|---|---|---|
| Product Hunt 反响平平 | 中 | 继续发 HN / Reddit，不依赖单一渠道 |
| Landing i18n bug 修复后仍有其他 bug | 高 | 每周走查一遍，建立 E2E 测试 |
| 内容生产质量不高 | 中 | cheap model 生成初稿，你审核后发布 |
| 没有真实用户反馈 | 高 | 主动 outreach（发邮件给潜在用户） |
| 竞品抄袭 MCP 集成 | 低 | 保持技术领先（版本 + 协作 + MCP） |
| MCP 接入门槛太高 | 中 | 简化 PAT 铸造流程，提供更多客户端支持 |

---

## 八、下一步行动

1. **立即执行**：修复 Landing 页 i18n bug（P0）
2. **今天准备**：Product Hunt 材料（tagline、description、截图、GIF）
3. **明天集中发布**：Product Hunt + Hacker News + Reddit + X/Twitter + 技术博客 + 掘金
4. **本周持续**：回复评论 + X/Twitter 每日一条
5. **每周复盘**：数据驱动迭代

**你负责**：审核内容、决策优先级、回复评论  
**cheap model 负责**：生成内容初稿、执行发布、拉取数据、修复 bug

开始执行吗？
