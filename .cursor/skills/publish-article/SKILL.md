---
name: publish-article
description: >-
  Publishes ERD Online growth articles to platforms via frozen chrome-devtools path
  cards. Use when the user asks to 发布, 发帖, post to 掘金/CSDN/OSChina/知乎/X
  Article/Dev.to, or run post-seo-essay / post-all-browser.
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

**路径卡优先：** 已有步骤 → **照做**；**禁止** snapshot 后自行摸索 DOM。**禁止 Playwright**。

## platforms = permalink 子集

`content/articles/*.md` 的 `platforms:` 必须是 recipes + `docs/growth-data/` 有**成功公网 permalink** 的平台。

| 轨道 | proven 集 |
|---|---|
| 中文长文 | `juejin, csdn, oschina, zhihu` |
| 国际英文 | 另轨（HN/Reddit/X Article/Dev.to 等），无 EN 稿勿硬发 |

**Never** 从旧 YAML 加 weixin/segmentfault（微信仅草稿、思否无成功 permalink）。

## 语言

- 国内平台 → **中文**
- 国际平台 → **英文**
- 例：Job 1 [dont-give-agent-prod-db.md](../../../content/articles/dont-give-agent-prod-db.md) 中文 only，除非存在 EN 稿

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
# 中文 SEO 长文（掘金/CSDN/OSChina/知乎等）— 正向路径
node scripts/post-seo-essay.mjs <platform> [--submit]

# PH / HN / Reddit / X 短讯 Post
node scripts/post-all-browser.mjs --platform <name> --title "..." --body-file ... [--submit]

# X Article 长文（B 类 WYSIWYG — Preview 后再 Publish）
node scripts/fill-x-article-shortcuts.mjs ...
```

填稿前先判 **ADR-0035** 适配器类：**A** MD 一次填入 / **B** WYSIWYG 逐块 / **C** API / **D** import。**禁止跨类混用**。

X 长文：**只用** Article editor（`compose/articles` + Preview）；**禁止** `x.com/compose/post` 发 SEO essay。

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
