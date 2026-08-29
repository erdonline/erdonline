# Cheap Model 执行清单

> **执行人**：便宜的模型 / 运营助理  
> **监督人**：你（Devin）  
> **频率**：每周循环  
> **核心策略**：**AI 方向优先**，集中执行（不要分散到周三、周四、周五）

---

## 每周循环（Week N）

### Day 1（周一）：数据采集与诊断

**任务**：
1. 运行 `scripts/growth-data.sh` 拉取数据
2. 生成数据报告（`docs/growth-data/YYYY-MM-DD.md`）
3. 对比上周数据，标记异常

**输出**：
- `docs/growth-data/YYYY-MM-DD.md`

**验收标准**：
- [ ] 数据报告生成成功
- [ ] 包含 Cloudflare 流量数据
- [ ] 包含 GitHub star/fork/issue 数据
- [ ] 包含 MCP 使用数据（PAT 铸造数、`list_projects` 调用数）
- [ ] 标记异常（流量下跌？star 不涨？MCP 接入率低？）

---

### Day 2（周二）：集中执行日（产品优化 + 推广发布）

**上午（产品优化，2-4 小时）**：

**P0 清单**（本周必须完成）：
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

**验收标准**：
- [ ] `yarn build:prod` 绿
- [ ] `yarn test:e2e` 绿
- [ ] Playwright 走查 Landing 页，无原始 key
- [ ] Playwright 走查 Demo 页，有"Fork 开始编辑"按钮
- [ ] Playwright 走查 Landing 页，有"MCP 集成"卡片

**下午（推广发布，2-3 小时）**：

**渠道清单**（按优先级排序，集中在一天发布）：

| 渠道 | 时间 | 内容 | AI 重点 |
|---|---|---|---|
| Product Hunt | 00:01 PST | Launch post | ✅ 强调 MCP |
| Hacker News | 9-11 AM PST | Show HN | ✅ 强调 MCP |
| Reddit r/cursor | 2:00 PM PST | MCP 集成 | ✅✅ 核心渠道 |
| Reddit r/ClaudeAI | 2:30 PM PST | MCP 集成 | ✅✅ 核心渠道 |
| Reddit r/programming | 3:00 PM PST | 技术深度 | ✅ 强调 MCP |
| X/Twitter | 4:00 PM PST | 功能演示 GIF | ✅ 强调 MCP |
| 技术博客 | 5:00 PM PST | Dev.to | ✅ 强调 MCP |
| 掘金 | 6:00 PM PST | 中文社区 | ✅ 强调 MCP |

**输出**：
- 发布链接列表（`docs/growth-data/week-N-links.md`）

**验收标准**：
- [ ] 所有渠道发布成功
- [ ] 每个渠道间隔 30 分钟（避免被标记为 spam）
- [ ] 所有内容都强调 MCP 集成（AI 方向优先）

**晚上（互动回复，1-2 小时）**：
- [ ] 回复所有评论（Product Hunt / HN / Reddit / X）
- [ ] 统计数据（流量、注册、star、MCP 接入数）

---

### Day 3-5（周三-五）：持续互动

**任务**：
1. 继续回复评论
2. 发布 X/Twitter（每日一条，AI 方向优先）
3. 发布其他渠道（Reddit r/webdev、r/selfhosted 等）；Hashnode / Medium / 开源中国待 Chrome 登录后补发

**X/Twitter 内容日历**（AI 方向优先）：
- **周三**：用户场景（"如何用 ERD Online + Cursor 让 AI 帮你改 schema"）
- **周四**：技术细节（"为什么我们用 projectJSON 作为 AI Agent 的事实源"）
- **周五**：对比（"ERD Online vs dbdiagram vs drawio: AI integration"）

**验收标准**：
- [ ] 每日 X/Twitter 发布成功
- [ ] 所有评论回复完毕
- [ ] 其他渠道发布成功

---

### Day 6（周六）：数据复盘

**任务**：
1. 拉取本周数据
2. 对比上周数据
3. 写复盘报告
4. 制定下周计划

**复盘清单**：
- [ ] 本周新增 star 数
- [ ] 本周新增注册数
- [ ] 本周 Demo 完成率
- [ ] 本周 MCP 接入数（PAT 铸造数）
- [ ] 本周 AI Agent 使用数（`list_projects` / `create_version` 调用数）
- [ ] 本周流量来源（哪个渠道效果最好）
- [ ] 本周用户反馈（issue / 评论 / 私信）
- [ ] 下周重点（修 bug / 写内容 / 发渠道）

**输出**：
- `docs/growth-data/week-N-review.md`

**验收标准**：
- [ ] 复盘报告生成成功
- [ ] 包含本周数据 vs 上周数据
- [ ] 包含下周计划

---

## 每周任务清单（Week 1 示例）

### Week 1：Launch Week（集中执行）

**Day 1（周一）**：
- [ ] 运行 `scripts/growth-data.sh`
- [ ] 修复 Landing 页 i18n bug（P0）
- [ ] 准备 Product Hunt 材料（tagline、description、截图、GIF）

**Day 2（周二，集中执行）**：
- [ ] **上午**：
  - [ ] 修复 Demo 页"Fork 开始编辑"引导（P0）
  - [ ] 修复 Landing 页 CTA 收敛 + AI 强化（P0）
  - [ ] 验证所有修复（`yarn build:prod` + `yarn test:e2e`）
- [ ] **下午**：
  - [ ] 发布 Product Hunt（00:01 PST）
  - [x] 发布 Hacker News（9-11 AM PST）— **blocked**：showlim / 新号 Show HN 限制，无 item URL
  - [x] 发布 Reddit r/cursor（2:00 PM PST）— **failed + 账号锁定**：乱码顶帖 https://www.reddit.com/r/cursor/comments/1w1e64s/…；应发 Weekly Showcase 评论；u/MeanAbbreviations645 需人工 reset
  - [ ] 发布 Reddit r/ClaudeAI（2:30 PM PST）
  - [ ] 发布 Reddit r/programming（3:00 PM PST）
  - [ ] 发布 X/Twitter（功能演示 GIF，4:00 PM PST）
  - [ ] 发布技术博客（Dev.to，5:00 PM PST）
  - [ ] 发布掘金（6:00 PM PST）
- [ ] **晚上**：
  - [ ] 回复所有评论（Product Hunt / HN / Reddit / X）
  - [ ] 统计数据（流量、注册、star、MCP 接入数）

**Day 3（周三）**：
- [ ] 继续回复评论
- [ ] 发布 X/Twitter（用户场景）
- [x] 发布知乎 — **已发** https://zhuanlan.zhihu.com/p/2077045243858392500（2026-08-29 提前执行）
- [x] 发布 Hashnode — **已发** https://erdonline.hashnode.dev/how-to-let-ai-agents-manage-your-database-schema-with-mcp
- [ ] 发布 Medium — **blocked** save error「Something is wrong and we cannot save your story」
- [x] 发布开源中国 — **已发** https://my.oschina.net/u/3339242/blog/19750362

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

### Week 2：Content Week（集中执行）

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
- [ ] 发布 X/Twitter（每日一条，AI 方向优先）
- [ ] 数据复盘，准备下周计划

---

## 质量标准

### 内容质量

- **技术准确性**：所有技术细节必须正确
- **文案风格**：遵守 `.cursor/rules/copywriting-style.mdc`
- **AI 方向优先**：所有内容都强调 MCP 集成
- **SEO**：包含关键词，但不过度堆砌
- **CTA**：每篇文章必须有 Demo 链接和 GitHub 链接

### 代码质量

- **验证**：所有改动必须通过 `yarn build` + `yarn test:e2e`
- **测试**：所有改动必须有 E2E 测试
- **文档**：所有改动必须更新文档

### 推广质量

- **时机**：在渠道活跃时间发布
- **集中执行**：不要分散到周三、周四、周五，集中在周二一天发布
- **互动**：发布后 1 小时内回复所有评论
- **一致性**：每天同一时间发布 X/Twitter
- **提交前（browser 渠道）**：Reddit 先 **Markdown 模式** → **读回一次**（换行数、无 duplicate）→ 用户确认后再 `--submit`；Reddit lock / password-reset 墙 = 硬停，跳过 reddit.com

---

## 失败处理

### 如果 Product Hunt 反响平平

- 不要放弃，继续发 HN / Reddit
- 复盘问题（标题？配图？时机？）
- 下周再试一次

### 如果 Landing i18n bug 修复后仍有其他 bug

- 每周走查一遍
- 建立 E2E 测试
- 不要一次性修所有 bug，按优先级修

### 如果内容生产质量不高

- cheap model 生成初稿，你审核后发布
- 不要直接发布初稿
- 建立审核流程

### 如果没有真实用户反馈

- 主动 outreach（发邮件给潜在用户）
- 在 Reddit / X 上问问题
- 不要等用户来找你

---

## 工具清单

### 数据采集

- `scripts/growth-data.sh`：Cloudflare + GitHub 数据
- `gh` CLI：GitHub 数据

### 内容生产

- `docs/growth-templates/`：内容模板库
- GPT-4 / Claude：生成初稿

### 推广发布

- Product Hunt / HN / Reddit / X：`chrome-devtools-mcp`（`.cursor/mcp.json` + `scripts/post-all-browser.mjs`）。禁止 Playwright。
- Dev.to / Hashnode：官方 API token
- 掘金 / 知乎 / CSDN / 开源中国：`chrome-devtools-mcp` + `scripts/post-seo-essay.mjs`（路径卡见 `platform-post-recipes.md`）

### 数据分析

- Cloudflare Dashboard：Web Analytics
- GitHub Insights：Traffic / Stars
- Google Analytics（可选）：更详细的流量分析

---

## 下一步行动

1. **立即执行**：修复 Landing 页 i18n bug（P0）
2. **今天准备**：Product Hunt 材料（tagline、description、截图、GIF）
3. **明天集中发布**：Product Hunt + Hacker News + Reddit + X/Twitter + 技术博客 + 掘金（全部在周二一天完成）
4. **本周持续**：回复评论 + X/Twitter 每日一条（AI 方向优先）
5. **每周复盘**：数据驱动迭代

**你负责**：审核内容、决策优先级、回复评论  
**cheap model 负责**：生成内容初稿、执行发布、拉取数据、修复 bug

开始执行吗？
