# 各平台发帖配方

与 [`post-via-chrome-devtools.md`](post-via-chrome-devtools.md) 配套。填表通用纪律（native setter、只填一次、读回）在主 runbook；此处写**平台特例**。

稿件目录：`docs/growth-content/2026-08-29-*.md`（国际渠道）；掘金中文稿见下方「2026-08-29 掘金中文稿」。

## 语言纪律（常驻）

**国内平台用中文发布**（掘金、知乎、开源中国、CSDN 等）。英文稿只用于 HN / PH / X / Reddit / Dev.to。**禁止**把 Reddit 英文正文贴到掘金。

**2026-08-29 掘金中文稿（canonical）：** `content/articles/cursor-mcp-read-and-suggest-version.juejin.md` — 标题「Cursor 连上 MCP：读一张 ER 图，提交一版建议」；草稿 https://juejin.cn/editor/drafts/7679014321104683054。**勿**复制整篇进 `docs/growth-content/`，以 `content/articles/` 为准。

**缺稿才停（未来日期）：** 若某日 `docs/growth-content/` 与 `content/articles/*.juejin.md` 均无对应中文稿 → **停**，禁止在输入框里现翻。

---

## Reddit

**账号（2026-08-29）：** u/MeanAbbreviations645

### 账号锁定 — 硬停（2026-08-29）

自动化填表/提交后（正文乱码重复、疑似 rapid `evaluate_script` + 删帖重发），Reddit 弹出：

> For your security, we've locked your account after detecting some unusual activity. To keep using Reddit, reset your password.

| 规则 | 说明 |
|---|---|
| **硬停** | 出现 account lock / unusual activity / password-reset 墙 → **立即停止**一切 Reddit 自动化 |
| **禁止** | Agent **不得**自动走密码重置流程 |
| **节奏** | 每个 sub **最多一次**、**人工节奏**提交；禁止 rapid re-fill、禁止 duplicate assign、禁止 post-then-delete 循环 |
| **恢复前** | 锁定后 **跳过所有 reddit.com** 操作，直到用户明确说已 reset 密码并重新登录 |

### 编辑器：Fancy Pants vs Markdown

Reddit composer 默认 **Fancy Pants**（contenteditable）。错误做法与后果：

| 做法 | 后果 |
|---|---|
| 把 Markdown 灌进 contenteditable | 整墙纯文本；literal `**`、反引号；**换行被吞** |
| `innerText` / `textContent` 赋值 | 段落折叠 |
| 重复填表 / 快速多次 `evaluate_script` | 正文**粘贴两遍**（2026-08-29 r/cursor 真实事故） |

**正确路径：**

1. 在 composer UI **先切到 Markdown 模式**
2. 对 `<textarea>` 用 native value setter + `input`/`change`（保留 `\n`）
3. **只填一次** → 读回 → 用户确认后再 Submit

评论默认 Markdown，同样只填一次。

### r/cursor：Weekly Showcase，不是独立帖

Standalone Showcase 帖会触发 AutoModerator：

> Please repost this in the Weekly Showcase Thread.

**正确位置：** 在当前 **Weekly Showcase Thread**（置顶 / AutoMod 链接）下**发评论**，不要新开 TEXT 帖。

若已发出乱码顶帖且为作者 → 删除；**不要**立刻自动化重发（易触发 lockout）。

### 失败样例（勿当成功）

- 乱码重复顶帖：https://www.reddit.com/r/cursor/comments/1w1e64s/oss_erd_online_let_cursor_readwrite_your_database/

### 命令

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH"

# 填表 only；Reddit 须先人工/脚本切 Markdown 再跑
node scripts/post-all-browser.mjs --platform reddit \
  --subreddit cursor \
  --title "[OSS] ERD Online – Let Cursor read/write your database schema via MCP" \
  --body-file docs/growth-content/2026-08-29-reddit.md
```

---

## Hacker News

**2026-08-29 结论：** 新号提交 Show HN → 重定向 `https://news.ycombinator.com/showlim`，**无 item URL**。**勿在该账号重试 Show HN**；需有 karma 的老号。

```bash
node scripts/post-all-browser.mjs --platform hackernews \
  --title "Show HN: ERD Online – Open-source database design with MCP for AI agents" \
  --url https://www.erdonline.com \
  --body-file docs/growth-content/2026-08-29-hacker-news.md
```

HN 正文为**纯文本**，无 Markdown。`--submit` 前读回 title / url / text。

---

## Product Hunt

**2026-08-29：** 已排期 **2026-08-29 12:01 AM PDT**（平台最早档）。

| 字段 | 注意 |
|---|---|
| Website URL | 输入框自带 `https://` 前缀 → 填 `www.erdonline.com`，**不要**填完整 URL |
| Interactive demo | 不接受本站泛 `/demo` URL；要 Storylane / Arcade / Supademo 类链接 |
| Gallery / Video | 加分项，不挡排期 |

产品页：https://www.producthunt.com/products/erd-online?launch=erd-online

```bash
node scripts/post-all-browser.mjs --platform producthunt \
  --title "ERD Online" \
  --url www.erdonline.com \
  --body-file docs/growth-content/2026-08-29-product-hunt.md
```

---

## X (Twitter)

**2026-08-29 已发：** https://x.com/BuilderLiang/status/2093575187761713453（280 字缩短版）

compose 框为 contenteditable；脚本用 `execCommand('insertText')`。发前读回字符数 ≤ 280。

---

## Dev.to / 掘金

Dev.to 可走 API；掘金用 chrome-devtools 点发布弹窗（Wechatsync 只到草稿箱）。

- Dev.to / Hashnode：英文稿 `docs/growth-content/2026-08-29-blog-post.md`；官方 API token
- 掘金 / 知乎 / CSDN：**须独立中文稿**（见上方「语言纪律」）。**2026-08-29** 用 `content/articles/cursor-mcp-read-and-suggest-version.juejin.md`；未来日期缺中文稿则停、禁止输入框现翻

---

## CSDN

**语言：** 中文 only（与国内平台纪律一致）。**Canonical 稿：** `content/articles/cursor-mcp-read-and-suggest-version.juejin.md`（标题行单独填，正文去掉 `# 标题`）。

| 项 | 要求 |
|---|---|
| URL | `https://editor.csdn.net/md`（新建）或 `?articleId=…`（续编草稿） |
| 模式 | 保持 **Markdown** 编辑器；**禁止**切「使用富文本编辑器」 |
| 标题 | `input.article-bar__title` — native value setter + `input`/`change` |
| 正文 | `pre.editor__inner`（contenteditable）— **`pre.textContent = body` + `input` 事件**；`execCommand('insertText')` 会吞 `\n`（2026-08-29 踩坑：读回仅 2 换行） |
| 填表 | **只填一次** → 读回：换行数 ≈ 源稿、`possibleDuplicate=false`、含汉字 |
| 发布 | 点「发布文章」→ 弹窗加标签（如 后端/数据库/开源/MCP/Cursor，UI 有则选）→ 弹窗内「发布文章」 |
| 硬停 | 未登录 / 验证码 / 手机验证 / unusual activity → **立即停止**（同 Reddit lockout；禁止 Agent 代过验证） |

**2026-08-29 已发：** https://blog.csdn.net/qq_30054961/article/details/164169329（审核中）

---

## 提交前速查（全平台）

1. Reddit：**Markdown 模式** + 读回一次 + 无 duplicate
2. 换行数与源稿一致
3. 无 account lock / showlim 等 blocker
4. 用户明确说「提交」才 `--submit`
