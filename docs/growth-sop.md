# ERD Online 增长 SOP（可重复执行）

> **执行人**：便宜的模型 / 运营助理  
> **监督人**：你（Devin）  
> **核心目标**：从 4 star → 100 star（30 天内），建立可持续的获客通道  
> **北极星指标**：每周活跃建模项目数（非空 diff 的版本保存）

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
留存（Weekly Active Projects）
  ↓ 推荐意愿（NPS / Star / Share）
```

**当前断点**：曝光 → 访问（0 visits）

---

## 三、可重复执行 SOP（每周循环）

### Phase A：数据采集与诊断（每周一，30 分钟）

**执行者**：cheap model / 脚本  
**工具**：Cloudflare GraphQL API + 本地脚本

1. **运行数据拉取脚本**（见附录 A）：
   - 拉取过去 7 天：Visits、Page Views、Top Pages、Traffic Sources
   - 拉取 GitHub API：Stars、Forks、Issues、Traffic
   - 输出到 `docs/growth-data/YYYY-MM-DD.md`

2. **人工诊断**（你，10 分钟）：
   - 对比上周数据，标记异常（流量下跌？跳出率上升？）
   - 决定本周重点：修 bug / 写内容 / 发渠道

### Phase B：产品体验优化（每周二-三，2-4 小时）

**执行者**：cheap model  
**优先级**：P0（阻断转化）→ P1（影响信任）→ P2（锦上添花）

**P0 清单（本周必须完成）**：
- [ ] **修复 Landing 页 i18n bug**：`landing.compare.cta.primary`、`landing.pillar.*.title` 显示原始 key
  - 文件：`frontend/src/pages/landing/index.tsx`、`frontend/src/locales/zh-CN.ts`、`frontend/src/locales/en-US.ts`
  - 验证：`yarn build:prod` + Playwright 检查无原始 key
- [ ] **Demo 页增加"Fork 开始编辑"强引导**：
  - 在 Demo 页顶部增加 banner："这是公开演示。Fork 到你的项目，开始编辑、保存版本、邀请协作。"
  - CTA：`Fork 开始编辑`（跳转注册，带 redirect）
- [ ] **Landing 页 CTA 收敛**：
  - 未登录：主 CTA = `打开在线 Demo`，次 CTA = `浏览模板`
  - 移除"查看完整对照"（放到 footer）

**P1 清单（下周完成）**：
- [ ] 注册页文案优化："注册后即可保存、分享、协作"
- [ ] 错误/空态文案统一（参考 `.cursor/rules/copywriting-style.mdc`）
- [ ] `cursor-mcp` 页增加"手动复制" fallback 提示

### Phase C：内容生产与推广（每周四-五，4-6 小时）

**执行者**：cheap model + 你（审核）  
**渠道优先级**：

| 渠道 | 频率 | 内容类型 | 目标 |
|---|---|---|---|
| **Product Hunt** | 一次性（本周） | Launch post | 首日曝光 500+ |
| **Hacker News** | 每两周 | Show HN | 首页曝光 |
| **Reddit** | 每周 | r/programming, r/webdev, r/selfhosted | 精准流量 |
| **X/Twitter** | 每日 | 短内容 + GIF 演示 | 持续曝光 |
| **技术博客** | 每周 | Dev.to / Hashnode / Medium | SEO + 长尾 |
| **中文社区** | 每周 | 掘金、V2EX、知乎 | 中文用户 |

#### 1. Product Hunt Launch（本周执行）

**准备材料**（cheap model 生成，你审核）：
- [ ] Tagline（60 字符）：`Git + Figma for database design`
- [ ] Description（260 字符）：`Open-source ERD tool with versioning, real-time collaboration, and MCP for AI agents. Try the live demo in 30 seconds.`
- [ ] 3 张截图：Landing / Demo / Designer
- [ ] 1 个 GIF：30 秒 demo 动线（改表→存版本→看 diff）
- [ ] First comment：详细介绍 + 技术栈 + 差异化

**发布 checklist**：
- [ ] 周二 00:01 PST 发布（流量高峰）
- [ ] 发布后 1 小时内回复所有评论
- [ ] 在 X/Twitter/LinkedIn 同步宣传
- [ ] 邀请朋友/upvote（合规范围内）

#### 2. Hacker News（Show HN）

**标题模板**：
```
Show HN: ERD Online – Open-source database design with versioning and MCP
```

**正文模板**：
```
I built ERD Online because existing tools force a trade-off:

- dbdiagram: pretty but closed, no versioning
- Navicat/PDManer: powerful but heavy, desktop-only
- drawio: free but doesn't understand databases

ERD Online is Git + Figma for database design:
- Every save creates a version you can diff and rollback
- Real-time multiplayer editing (like Figma)
- Open projectJSON format + MCP for AI agents

Try the live demo (no signup): https://www.erdonline.com/demo

Tech stack: React 18 + UmiJS + Spring Boot 3.5 + PostgreSQL
License: MIT

Would love feedback on the versioning approach and MCP integration.
```

**发布时间**：周二或周三 9-11 AM PST

#### 3. Reddit（每周一次）

**Subreddit 清单**：
- r/programming（周二）
- r/webdev（周三）
- r/selfhosted（周四）
- r/Database（周五）
- r/opensource（周六）

**标题模板**（按 subreddit 调整）：
```
[OSS] ERD Online – Git + Figma for database design (versioning, collaboration, MCP)
```

**正文要点**：
- 先说痛点（现有工具的不足）
- 再说差异化（版本 + 协作 + MCP）
- 给 Demo 链接（不要直接给 GitHub，先让人体验）
- 最后给 GitHub 链接（求 star）

#### 4. X/Twitter（每日一条）

**内容日历**：
- 周一：功能演示 GIF（改表→存版本→看 diff）
- 周二：用户场景（"如何用 ERD Online + Cursor 让 AI 帮你改 schema"）
- 周三：技术细节（"为什么我们用 projectJSON 作为开放格式"）
- 周四：对比（"ERD Online vs dbdiagram vs drawio"）
- 周五：社区互动（"你最想要的数据库设计功能是什么？"）

**统一登录**：用 Google 账号登录 X/Twitter（`Erdonline154@gmail.com`）

#### 5. 技术博客（每周一篇）

**平台**：Dev.to / Hashnode / Medium / 掘金 / 知乎

**文章模板**（cheap model 生成初稿，你审核）：

**标题**：
```
How I built an open-source ERD tool with versioning and MCP integration
```

**结构**：
1. **Hook**：现有工具的痛点（200 字）
2. **Solution**：ERD Online 的核心差异化（300 字）
3. **Technical Deep Dive**：
   - 版本系统设计（Git-like snapshots + diff）
   - 实时协作（WebSocket + CRDT）
   - MCP 集成（PAT + stdio server）
   - 技术栈（React + Spring Boot）
4. **Demo**：30 秒动线截图/GIF
5. **Call to Action**：GitHub 链接 + Demo 链接

**SEO 关键词**：
- `open source erd tool`
- `database design with versioning`
- `erd tool with collaboration`
- `mcp for database schema`

#### 6. 中文社区（每周一次）

**平台**：掘金、V2EX、知乎、SegmentFault

**标题模板**：
```
开源项目推荐：ERD Online - 数据库设计的 Git + Figma
```

**正文要点**：
- 痛点：dbdiagram 闭源、Navicat 太重、drawio 不懂数据库
- 差异化：版本 + 协作 + MCP
- Demo：30 秒免注册体验
- 求 star：GitHub 链接

### Phase D：数据复盘与迭代（每周日，30 分钟）

**执行者**：你 + cheap model  
**输出**：`docs/growth-data/weekly-review-YYYY-MM-DD.md`

**复盘清单**：
- [ ] 本周新增 star 数
- [ ] 本周新增注册数
- [ ] 本周 Demo 完成率
- [ ] 本周流量来源（哪个渠道效果最好）
- [ ] 本周用户反馈（issue / 评论 / 私信）
- [ ] 下周重点（修 bug / 写内容 / 发渠道）

---

## 四、自动化脚本

### 附录 A：Cloudflare 数据拉取脚本

```bash
#!/bin/bash
# scripts/growth-data.sh
# 每周一运行，拉取过去 7 天数据

TOKEN=$(cat ~/.cloudflare_token)
ZONE_ID="e87a9219db971c46a51c33530605212c"
OUTPUT_DIR="docs/growth-data"
DATE=$(date +%Y-%m-%d)

mkdir -p "$OUTPUT_DIR"

# 拉取过去 7 天数据
for i in {0..6}; do
  DAY=$(date -v-${i}d +%Y-%m-%d)
  START="${DAY}T00:00:00Z"
  END="${DAY}T23:59:59Z"
  
  # 总请求数
  TOTAL=$(curl -s "https://api.cloudflare.com/client/v4/graphql" \
    -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"query { viewer { zones(filter: {zoneTag: \\\"$ZONE_ID\\\"}) { httpRequestsAdaptiveGroups(limit: 1, filter: {datetime_geq: \\\"$START\\\", datetime_leq: \\\"$END\\\"}) { count } } } }\"}" | jq -r '.data.viewer.zones[0].httpRequestsAdaptiveGroups[0].count // 0')
  
  echo "$DAY: $TOTAL requests" >> "$OUTPUT_DIR/$DATE.txt"
done

# GitHub 数据
gh api repos/erdonline/erdonline --jq '{stars: .stargazers_count, forks: .forks_count, issues: .open_issues_count}' > "$OUTPUT_DIR/$DATE-github.json"

echo "Data saved to $OUTPUT_DIR/$DATE.txt"
```

### 附录 B：推广内容模板库

见 `docs/growth-templates/` 目录（待创建）：
- `product-hunt.md`
- `hacker-news.md`
- `reddit.md`
- `twitter.md`
- `blog-post.md`
- `chinese-community.md`

---

## 五、执行清单（给 cheap model）

### 本周任务（Week 1）

**Day 1（周一）**：
- [ ] 运行 `scripts/growth-data.sh` 拉取数据
- [ ] 修复 Landing 页 i18n bug（P0）
- [ ] 准备 Product Hunt 材料（tagline、description、截图）

**Day 2（周二）**：
- [ ] 发布 Product Hunt（00:01 PST）
- [ ] 修复 Demo 页"Fork 开始编辑"引导（P0）
- [ ] 发布 Hacker News（Show HN）

**Day 3（周三）**：
- [ ] 发布 Reddit r/programming
- [ ] 发布第一篇技术博客（Dev.to）
- [ ] 发布 X/Twitter（功能演示 GIF）

**Day 4（周四）**：
- [ ] 发布 Reddit r/webdev
- [ ] 发布掘金/V2EX
- [ ] 回复 Product Hunt / HN 评论

**Day 5（周五）**：
- [ ] 发布 Reddit r/selfhosted
- [ ] 发布知乎
- [ ] 数据复盘，准备下周计划

### 下周任务（Week 2）

- [ ] 分析 Week 1 数据，找出效果最好的渠道
- [ ] 加大该渠道投入（如果 Reddit 效果好，每周发 2-3 次）
- [ ] 优化 Landing 页（P1 清单）
- [ ] 写第二篇技术博客（深度技术文章）

---

## 六、度量指标（北极星 + 辅助）

| 指标 | 当前 | Week 1 目标 | Week 4 目标 |
|---|---|---|---|
| GitHub Star | 4 | 20 | 100 |
| Cloudflare Visits（周） | ~0 | 500 | 2,000 |
| Demo 打开数（周） | ? | 100 | 500 |
| 注册数（周） | ? | 20 | 100 |
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
| 竞品抄袭 | 低 | 保持技术领先（版本 + 协作 + MCP） |

---

## 八、下一步行动

1. **立即执行**：修复 Landing 页 i18n bug（P0）
2. **今天准备**：Product Hunt 材料（tagline、description、截图）
3. **明天发布**：Product Hunt + Hacker News
4. **本周持续**：Reddit + 技术博客 + X/Twitter
5. **每周复盘**：数据驱动迭代

**你负责**：审核内容、决策优先级、回复评论  
**cheap model 负责**：生成内容初稿、执行发布、拉取数据、修复 bug

开始执行吗？
