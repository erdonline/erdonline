---
name: publish-article
description: >-
  Publishes ERD Online growth articles via chrome-devtools MCP and frozen path
  cards only. Use when the user asks to 发布, 发帖, post to 掘金/CSDN/OSChina/知乎/X
  Article/Dev.to/Hashnode/Medium, or run post-seo-essay / post-all-browser /
  fill-x-article-shortcuts.
---

# Publish Articles

**Scope:** 已 `ready` 稿件 → 按路径卡填表 → 公网验正文 → 写 growth-data。**不选题、不改稿结构** — 生成走 [explore-generate-article](../explore-generate-article/SKILL.md)。

## Authority (read, do not paste)

| Topic | File |
|---|---|
| 路径卡、适配器 A/B/C/D、硬停、platforms 纪律 | [growth-post-paths.mdc](../../rules/growth-post-paths.mdc) |
| 各平台 compose URL、填法、提交、公网验、live URL | [platform-post-recipes.md](../../../docs/growth-templates/platform-post-recipes.md) |
| Node 22、daemon、`--autoConnect`、native setter | [post-via-chrome-devtools.md](../../../docs/growth-templates/post-via-chrome-devtools.md) |
| X Article：Preview 门禁、block IR、禁止 compose/post 长文 | [x-article-playbook.md](../../../docs/growth-templates/x-article-playbook.md) |

**单一栈：** 只用 **chrome-devtools MCP/CLI** + 冻结路径卡。**路径卡优先** — 已有步骤 → **照做**；**禁止** snapshot 后自行摸索 DOM。

**禁止：** Playwright；任何非 chrome-devtools 的发帖扩展、同步器或 MCP。

## platforms = permalink 子集

`content/articles/*.md` 的 `platforms:` = [platform-post-recipes.md](../../../docs/growth-templates/platform-post-recipes.md) 有路径卡 **且** `docs/growth-data/` 有**成功公网 permalink** 的平台交集。无路径卡或无 permalink 的平台 **不在集合内**，勿写进 YAML。

| 轨道 | proven 集 |
|---|---|
| 中文长文 | `juejin, csdn, oschina, zhihu` |
| 国际英文长文 | `hashnode, devto, medium`（D 类：Hashnode import）、X Article |

**Never** 从旧 YAML 抄不在上表 proven 集的平台名。**Never** HN Show HN 新号、Reddit u/MeanAbbreviations645、r/programming、OSChina 19750362 空帖、Medium 手填长文（save error → 改 Hashnode import）。

## 语言与双轨

- 国内平台 → **中文**（`content/dist/<slug>/*.md`）
- 国际平台 → **英文**（`content/articles/<slug>.en.md`）
- 中文 YAML 的 `platforms:` **仍只写国内四家**；国际走 EN 稿 + 上表 proven 集
- 发长文时 **两条轨道都跑**（有对应语言稿才发；缺 EN 就先写 EN 再发，**禁止**默默跳过国外）

## 硬跳过（永不尝试）

| 场景 | 动作 |
|---|---|
| Reddit **u/MeanAbbreviations645** | HARD STOP — 账号已 LOCKED |
| Reddit **r/programming** | 不发 — Rule 5 product demo off-topic |
| **HN Show HN（新号）** | 勿重试 — 换有 karma 老号 |
| **OSChina 19750362** | 勿再编辑空帖 — 新帖走 `post-seo-essay.mjs oschina` |
| **Medium save error**（手动填正文） | HARD STOP — 改 **Hashnode import** |
| lock / captcha / phone-verify / password-reset | **立即停止** — 禁止代过验证 |

Reddit 当前账号：**u/erdonline**（发帖前 username ≠ MeanAbbreviations645）。

## CLI 入口

```bash
# 中文长文（掘金/CSDN/OSChina/知乎）— 正向路径
node scripts/post-seo-essay.mjs <platform> --slug=<slug> [--submit]

# 国际英文长文 A/D 类（Hashnode / Dev.to / Medium import）— 同一脚本，必须 --slug= 指向 EN 稿
node scripts/post-seo-essay.mjs hashnode --slug=dont-give-agent-prod-db --submit
node scripts/post-seo-essay.mjs medium-import --slug=dont-give-agent-prod-db --hashnode-url=<url> --submit
node scripts/post-seo-essay.mjs devto --slug=dont-give-agent-prod-db --submit

# X Article（B 类 WYSIWYG）— 独立脚本 + playbook，禁止 post-seo-essay.mjs x
# 见下方 HARD RULE

# PH / HN / Reddit / X 短讯 Post（≤280 字；长文走 Article，脚本会 throw）
node scripts/post-all-browser.mjs --platform <name> --title "..." --body-file ... [--submit]
```

填稿前先判 **ADR-0035** 适配器类：**A** MD 一次填入 / **B** WYSIWYG 逐块 / **C** API / **D** import。**禁止跨类混用**。

### HARD RULE — X 长文（B 类 WYSIWYG）

> **长文 = Article only；Post composer 发长文 = 失败。**

> **正文不是一下全部复制进去的。**

| 禁止 | 必须 |
|---|---|
| 整篇复制 / paste 全文进 `[contenteditable="true"]` | `node scripts/fill-x-article-shortcuts.mjs` + [x-article-playbook.md](../../../docs/growth-templates/x-article-playbook.md) **8 步** |
| `setNative` 全文 / `insertText` 全文 dump markdown | block IR **逐块** + 官方快捷键（`# ` / `## ` / Body） |
| `post-seo-essay.mjs x`（会 throw） | 打开 `compose/articles` → shortcuts 填稿 → **Preview 强制** → 才 Publish |
| `x.com/compose/post` 发 SEO essay | Article editor only |

国内 **A 类**（掘金 `CM.setValue`、Dev.to markdown textarea、CSDN `pre.textContent`）**可以**一次填 MD；**不要把 A 类填法用到 X**。

Live 例：https://x.com/BuilderLiang/article/2093670417458491425

## Workflow

```
- [ ] 1. 确认 slug + frontmatter status: ready + platforms 为 proven 子集
- [ ] 2. node scripts/growth/build-package.mjs <slug> — 取 content/dist/<slug>/ 平台包
- [ ] 3. Node 22 + chrome-devtools MCP/CLI（见 post-via-chrome-devtools.md）
- [ ] 4. 打开对应路径卡 — 按 recipe 填标题/正文/标签；不发明 selector
- [ ] 5. 提交（仅用户授权或 --submit 时）
- [ ] 6. 公网 URL 验正文 — 编辑器读回不算；空正文 = 失败
- [ ] 7. 写入 docs/growth-data/YYYY-MM-DD.md（permalink、username、click 序列）
- [ ] 8. CHANGELOG 验证点；frontmatter status → published（若流程要求）
```

## 硬停

遇 captcha / lock / phone-verify / unusual activity → **立即停止**，汇报用户。**禁止**代过验证、代 reset 密码、rapid re-fill。

## 新 selector

Job 中确认的新 compose URL 或控件 → **立刻追加**到 [platform-post-recipes.md](../../../docs/growth-templates/platform-post-recipes.md) 对应路径卡，勿只留在对话里。
