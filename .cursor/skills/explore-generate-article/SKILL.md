---
name: explore-generate-article
description: >-
  Explores user Jobs, 痛点/痒点/爽点, last30days research, and drafts growth/MCP
  journey articles for ERD Online. Use when the user asks to 选题, 探索旅程, 写文章,
  generate an article, Job 1–4 content, or work in content/articles/.
---

# Explore & Generate Articles

**Scope:** 选题 → 起草 → `ready`。**不发布** — 发布走 [publish-article](../publish-article/SKILL.md)。

## Authority (read, do not paste)

| Topic | File |
|---|---|
| Job spine, 角色×痛×痒×爽, 标题 AI 词, 7-step 结构, 禁止项, CTA=保存版本 | [mcp-journey-articles.mdc](../../rules/mcp-journey-articles.mdc) |
| 语气、术语、CTA 纪律 | [copywriting-style.mdc](../../rules/copywriting-style.mdc) |
| `new-article.mjs`, `{{CTA}}` / `{{DOC:}}`, status draft→ready | [content/articles/README.md](../../../content/articles/README.md) |
| Job 1 范本（七步、非手册结构） | [dont-give-agent-prod-db.md](../../../content/articles/dont-give-agent-prod-db.md) |

**Job 主轴 = 一件工作**，不是「一角色一篇文章」。多平台发**同一锁定标题**，不拆第二个 cinematic moment。

## last30days

选题虚、标题缺证据时，用户可 invoke `/last30days`（`~/.agents/skills/last30days/SKILL.md`）。**禁止**自造 last30days 引擎或臆造 engagement 数字。

## MCP 与契约

正文若承诺 MCP 能力，须与仓库真实工具一致（契约读，**不连 live DB**）。缺口按 Job MCP 建设顺序补实现，遵守 [ADR-0013](../../../docs/adr/0013-public-api-no-connector-mutate-sql.md)（公开 API 不 execute SQL）。写路径文案里只有 `create_version`，**永不**把 `put_project_json` 当教程路径。

## platforms（YAML 仅登记，本 skill 不发帖）

`platforms:` = [platform-post-recipes.md](../../../docs/growth-templates/platform-post-recipes.md) 有 chrome-devtools 路径卡 **且** `docs/growth-data/` 有**公网 permalink** 的交集。中文长文 proven 集：`juejin, csdn, oschina, zhihu`。勿从旧稿抄不在 proven 集的平台名。

## Workflow

```
- [ ] 1. 选 Job（1–4）— 读 mcp-journey-articles 该 Job 的现场/痛点/痒点/爽点/锁定标题
- [ ] 2. 写「现场」— 若只有口号，补具体时刻与命名失败（如 column does not exist）
- [ ] 3. 定标题 — 用锁定标题，或新标题含且只突出一个 AI 领域词（Agent/幻觉/MCP/Cursor…）
- [ ] 4. 开稿 — node scripts/growth/new-article.mjs --slug … --title … --platforms juejin,csdn,oschina,zhihu --cta demo
- [ ] 5. 按七步结构写正文 — 场景→命名失败→已试过→实时目录只做一半→契约动作→MCP 后出现→CTA=保存版本
- [ ] 6. 自检 — grep 禁止开头/CTA（「安装我们的 MCP」、PAT→mcp.json 手册克隆、功能清单开场）
- [ ] 7. status: ready；node scripts/growth/build-package.mjs <slug>；CHANGELOG Unreleased 验证点
```

### 七步结构（摘要）

1. 钩子场景（具体报错/时刻）
2. 命名失败（可复述）
3. 他们已经试过的（prompt、@schema.sql、实时目录 MCP）
4. 为什么实时目录错/只做一半
5. ERD 契约动作（读已批准版本、`create_version`、设计器 diff）
6. **MCP 最后才出现**
7. CTA = **保存一个版本**（demo 旅程），不是装 MCP

### 禁止项（快速 grep）

- 开头：「MCP 使用教程」「我们很高兴地宣布」「MCP 是什么」、功能清单
- CTA：「安装我们的 MCP」「立即体验」、把 `put_project_json` 写成写路径
- 结构：克隆 [cursor-mcp-read-and-suggest-version.md](../../../content/articles/cursor-mcp-read-and-suggest-version.md) 的 PAT→mcp.json 三步手册

### 占位符

正文只用可构建占位符：`{{CTA}}` `{{REPO}}` `{{DOCS}}` `{{DOC:…}}` `{{GH:…}}`。禁止读者打不开的仓库内相对路径。
