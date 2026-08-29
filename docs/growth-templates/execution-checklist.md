# Cheap Model 执行清单

> **执行人**：便宜的模型 / 运营助理  
> **监督人**：你（Devin）  
> **频率**：每周循环

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
- [ ] 标记异常（流量下跌？star 不涨？）

---

### Day 2（周二）：产品体验优化

**任务**：
1. 检查 P0 清单（阻断转化的 bug）
2. 修复 P0 问题
3. 验证修复（build + E2E）

**P0 清单**（本周必须完成）：
- [ ] **修复 Landing 页 i18n bug**：`landing.compare.cta.primary`、`landing.pillar.*.title` 显示原始 key
  - 文件：`frontend/src/pages/landing/index.tsx`、`frontend/src/locales/zh-CN.ts`、`frontend/src/locales/en-US.ts`
  - 验证：`yarn build:prod` + Playwright 检查无原始 key
- [ ] **Demo 页增加"Fork 开始编辑"强引导**：
  - 在 Demo 页顶部增加 banner："这是公开演示。Fork 到你的项目，开始编辑、保存版本、邀请协作。"
  - CTA：`Fork 开始编辑`（跳转注册，带 redirect）
- [ ] **Landing 页 CTA 收敛**：
  - 未登录：主 CTA = `打开在线 Demo`，次 CTA = `浏览模板`
  - 移除"查看完整对照"（放到 footer）

**验收标准**：
- [ ] `yarn build:prod` 绿
- [ ] `yarn test:e2e` 绿
- [ ] Playwright 走查 Landing 页，无原始 key
- [ ] Playwright 走查 Demo 页，有"Fork 开始编辑"按钮

---

### Day 3（周三）：内容生产

**任务**：
1. 选择内容类型（技术深度 / 教程 / 对比）
2. 使用模板生成初稿
3. 提交给你审核

**内容日历**：
- **Week 1**：技术深度文章（"How I built ERD Online"）
- **Week 2**：教程文章（"How to version your database schema like Git"）
- **Week 3**：对比文章（"ERD Online vs dbdiagram vs drawio"）
- **Week 4**：用户故事（"How Team X uses ERD Online"）

**输出**：
- `docs/growth-content/week-N-article.md`

**验收标准**：
- [ ] 初稿生成成功
- [ ] 包含 Demo 链接和 GitHub 链接
- [ ] 包含 SEO 关键词
- [ ] 字数 1500-2500 字

---

### Day 4（周四）：推广执行

**任务**：
1. 发布内容到各渠道
2. 回复评论
3. 统计流量

**渠道清单**：

| 渠道 | 频率 | 本周任务 |
|---|---|---|
| Product Hunt | 一次性 | 发布（周二 00:01 PST） |
| Hacker News | 每两周 | 发布（周二 9-11 AM PST） |
| Reddit | 每周 | r/programming（周二） |
| X/Twitter | 每日 | 每日一条（美东时间上午 9-11 点） |
| 技术博客 | 每周 | Dev.to（周四） |
| 中文社区 | 每周 | 掘金（周四） |

**输出**：
- 发布链接列表（`docs/growth-data/week-N-links.md`）

**验收标准**：
- [ ] 所有渠道发布成功
- [ ] 回复所有评论（前 1 小时最重要）
- [ ] 统计流量和注册

---

### Day 5（周五）：数据复盘

**任务**：
1. 拉取本周数据
2. 对比上周数据
3. 写复盘报告
4. 制定下周计划

**复盘清单**：
- [ ] 本周新增 star 数
- [ ] 本周新增注册数
- [ ] 本周 Demo 完成率
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

### Week 1：Launch Week

**Day 1（周一）**：
- [ ] 运行 `scripts/growth-data.sh`
- [ ] 修复 Landing 页 i18n bug（P0）
- [ ] 准备 Product Hunt 材料（tagline、description、截图）

**Day 2（周二）**：
- [ ] 发布 Product Hunt（00:01 PST）
- [ ] 修复 Demo 页"Fork 开始编辑"引导（P0）
- [ ] 发布 Hacker News（Show HN）

**Day 3（周三）**：
- [ ] 发布 Reddit r/programming
- [ ] 生成第一篇技术博客初稿（"How I built ERD Online"）
- [ ] 发布 X/Twitter（功能演示 GIF）

**Day 4（周四）**：
- [ ] 发布技术博客（Dev.to）
- [ ] 发布掘金
- [ ] 发布 X/Twitter（用户场景）
- [ ] 回复 Product Hunt / HN 评论

**Day 5（周五）**：
- [ ] 发布 Reddit r/webdev
- [ ] 发布知乎
- [ ] 发布 X/Twitter（技术细节）
- [ ] 数据复盘，准备下周计划

---

### Week 2：Content Week

**Day 1（周一）**：
- [ ] 运行 `scripts/growth-data.sh`
- [ ] 分析 Week 1 数据，找出效果最好的渠道
- [ ] 优化 Landing 页（P1 清单）

**Day 2（周二）**：
- [ ] 生成第二篇技术博客初稿（"How to version your database schema like Git"）
- [ ] 发布 X/Twitter（对比）

**Day 3（周三）**：
- [ ] 发布技术博客（Dev.to / Hashnode）
- [ ] 发布 Reddit r/selfhosted
- [ ] 发布 X/Twitter（社区互动）

**Day 4（周四）**：
- [ ] 发布掘金
- [ ] 发布 X/Twitter（开源社区）

**Day 5（周五）**：
- [ ] 发布 Reddit r/Database
- [ ] 发布知乎
- [ ] 发布 X/Twitter（用户故事）
- [ ] 数据复盘，准备下周计划

---

## 质量标准

### 内容质量

- **技术准确性**：所有技术细节必须正确
- **文案风格**：遵守 `.cursor/rules/copywriting-style.mdc`
- **SEO**：包含关键词，但不过度堆砌
- **CTA**：每篇文章必须有 Demo 链接和 GitHub 链接

### 代码质量

- **验证**：所有改动必须通过 `yarn build` + `yarn test:e2e`
- **测试**：所有改动必须有 E2E 测试
- **文档**：所有改动必须更新文档

### 推广质量

- **时机**：在渠道活跃时间发布
- **互动**：发布后 1 小时内回复所有评论
- **一致性**：每天同一时间发布

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

- Product Hunt：手动发布
- Hacker News：手动发布
- Reddit：手动发布
- X/Twitter：手动发布（或 Buffer）
- Dev.to / Hashnode：手动发布
- 掘金 / 知乎：手动发布

### 数据分析

- Cloudflare Dashboard：Web Analytics
- GitHub Insights：Traffic / Stars
- Google Analytics（可选）：更详细的流量分析

---

## 下一步行动

1. **立即执行**：修复 Landing 页 i18n bug（P0）
2. **今天准备**：Product Hunt 材料（tagline、description、截图）
3. **明天发布**：Product Hunt + Hacker News
4. **本周持续**：Reddit + 技术博客 + X/Twitter
5. **每周复盘**：数据驱动迭代

**你负责**：审核内容、决策优先级、回复评论  
**cheap model 负责**：生成内容初稿、执行发布、拉取数据、修复 bug

开始执行吗？
