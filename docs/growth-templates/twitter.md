# X/Twitter 内容日历

> **频率**：每日一条  
> **执行人**：cheap model 生成初稿，你审核  
> **统一登录**：Google 账号 `builderliang@gmail.com`

---

## 内容日历

### 周一：功能演示 GIF

**文案**：
```
🎯 ERD Online demo in 30 seconds:

1. Open the live demo (no signup)
2. Edit a table
3. Save a version
4. See the diff

Git + Figma for database design. Open source (MIT).

Try it: https://www.erdonline.com/demo

#opensource #database #devtools
```

**配图**：30 秒 demo GIF（改表→存版本→看 diff）

---

### 周二：用户场景

**文案**：
```
💡 How to use ERD Online + Cursor to let AI manage your schema:

1. Mint a PAT in ERD Online
2. Add MCP config to Cursor
3. Ask Cursor: "List my ERD projects"
4. Ask Cursor: "Suggest a new version"
5. You diff and approve in the designer

AI agents read/write the same projectJSON. No black-box magic.

Docs: https://doc.erdonline.com/docs/guide/api-and-mcp/

#ai #database #mcp
```

**配图**：Cursor 中调用 `list_projects` 的截图

---

### 周三：技术细节

**文案**：
```
🔧 Why we use projectJSON as the source of truth:

- Language-agnostic (any backend can read/write)
- Versioned (never breaks in-place)
- Open (public format, not proprietary)
- Both humans and AI agents read/write the same format

This is the key to "Git + Figma for database design".

Tech details: https://doc.erdonline.com/docs/data-format

#database #architecture #opensource
```

**配图**：projectJSON 格式截图

---

### 周四：对比

**文案**：
```
🆚 ERD Online vs dbdiagram vs drawio:

ERD Online:
✅ Open source (MIT)
✅ Versioning (Git-like)
✅ Collaboration (Figma-like)
✅ MCP integration

dbdiagram:
❌ Closed source
❌ No versioning
❌ No collaboration

drawio:
✅ Open source
❌ No database semantics
❌ Limited collaboration

Choose the right tool for your team.

Full comparison: https://www.erdonline.com/compare

#database #devtools #comparison
```

**配图**：对比表格截图

---

### 周五：社区互动

**文案**：
```
🤔 Question for database developers:

What's the most painful part of managing database schema changes?

A) Tracking who changed what
B) Rolling back mistakes
C) Collaborating with team
D) Generating migration scripts
E) Something else (reply below)

Building ERD Online to solve this. Would love your input.

#database #devtools #community
```

**配图**：无（纯文本互动）

---

### 周六：开源社区

**文案**：
```
🌟 ERD Online is looking for contributors!

Good first issues:
- Add support for MongoDB
- Improve diff visualization
- Add export to Liquibase/Flyway
- Improve accessibility

Tech stack: React 18 + Spring Boot 3.5 + PostgreSQL

GitHub: https://github.com/erdonline/erdonline

#opensource #contributors #hacktoberfest
```

**配图**：GitHub Issues 截图

---

### 周日：用户故事

**文案**：
```
📖 How Team X uses ERD Online to manage 500+ tables:

"We used to lose track of schema changes. Who changed this table? When? Why? How do we rollback?

Now we use ERD Online. Every save creates a version. We can diff any two versions. We can rollback to any version. Reviews and approvals are built-in.

It's like Git for database design."

Read the full story: [blog post link]

#database #casestudy #testimonial
```

**配图**：用户团队截图（需要授权）

---

## 发布 Checklist

### 每日发布

- [ ] 选择当天的内容类型
- [ ] 使用对应的模板生成初稿
- [ ] 你审核并修改
- [ ] 添加配图（GIF / 截图）
- [ ] 发布
- [ ] 回复评论

### 每周复盘

- [ ] 统计每条的 impressions、engagements、clicks
- [ ] 找出效果最好的内容类型
- [ ] 下周加大该类型的投入

---

## 成功指标

- **最低目标**：每条 100+ impressions，5+ engagements
- **理想目标**：每条 1000+ impressions，50+ engagements
- **失败线**：< 50 impressions → 复盘问题（文案？配图？时机？）

---

## 注意事项

- **不要刷屏**：每天最多一条
- **不要自夸**：用"我构建了这个"而不是"这是最好的"
- **不要争辩**：如果有人批评，礼貌回应，不要争辩
- **保持一致性**：每天同一时间发布（建议美东时间上午 9-11 点）
