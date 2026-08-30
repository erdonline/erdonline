# 发版路径 Runbook（2026-08-29 冻结）

**单一真相源。** Agent 发版：**开 URL → 点命名控件 → 填已知字段 → 提交 → 公网 URL 验正文**。禁止 UI 探索、禁止 Playwright。

环境细节见 [`post-via-chrome-devtools.md`](post-via-chrome-devtools.md)（Node 22、`--autoConnect`、native setter 纪律）。

---

## 编辑器类型 → 填法（**先查这张表**）

决策依据 [ADR-0035](../adr/0035-publishing-adapters-md-vs-wysiwyg.md)：**按编辑器能力选适配器，不是按心情**。四类填法互不混用。

| 类 | 判定 | 填法 | 验收 |
|---|---|---|---|
| **A · MD 一次** | 有真 Markdown 源码框 | 序列化 md → native setter **只填一次**，保留 `\n` | 公网正文 |
| **B · WYSIWYG 逐块** | 无 md 框，有块级富文本 | **block IR 逐块** + 平台原生快捷键/工具栏，段间 Enter 一次 | **Preview 必过** → 公网正文 |
| **C · API** | DOM 不可靠，但有落库草稿 API | block IR → API 要求的 HTML，PATCH → reload → 更新 | 公网正文 |
| **D · import** | 有官方 URL 导入通道 | **优先 import**，失败才降级 B/C | 公网正文 |

| 平台 | 类 | 填目标 / 通道 |
|---|---|---|
| Dev.to | **A** | `#article_body_markdown` |
| Hashnode | **A** | 草稿页 **Markdown** tab |
| 掘金 | **A** | Markdown 编辑器 |
| CSDN | **A** | `editor.csdn.net/md` → `pre.editor__inner` `textContent` + `input`（**勿**切富文本） |
| 开源中国 | **A** | swap → **确定切换** → **可见 `textarea`** native setter（**禁** `pre.textContent`，公网会空） |
| Reddit | **A** | 先「切换到 Markdown」→ shadow `textarea` 填一次；**Fancy Pants 禁贴 md** |
| X — 长文 Article | **B** | `compose/articles` → 行首 marker + 官方快捷键，见 [`x-article-playbook.md`](x-article-playbook.md)（**B 类范本**） |
| Medium | **D** → 失败降 B | `medium.com/p/import` + Hashnode live URL；**禁** `type_text` 手填长文（save error = HARD STOP） |
| 知乎专栏 | **C** | `PATCH /api/articles/<id>/draft` 写 HTML → reload edit → **更新**（`zhihu-patch-draft.mjs`）；**禁**只涂 contenteditable |
| X — 短讯 Post | 表单 | ≤280 字，不适用正文分类 |
| Product Hunt / Hacker News | 表单 | 字段 native setter，不适用正文分类 |

**四条硬规则：** A 类**不逐段**（有 md 框还模仿 X = 倒退）· B 类**不整篇 paste**（`#` `**` 会成字面量或字号全乱）· C 类**不只涂 DOM**（编辑器有字≠公网有字）· 一律**以公网正文为唯一验收**。

---

## Live URL 速查

| 平台 | 状态 | 公网 URL |
|---|---|---|
| Product Hunt | 已排期 2026-08-29 12:01 AM PDT | https://www.producthunt.com/products/erd-online?launch=erd-online |
| X | 已发 | https://x.com/BuilderLiang/status/2093575187761713453 |
| Hacker News | blocked（showlim） | 无 item URL |
| Reddit r/cursor | 已发（Showcase 评论） | https://www.reddit.com/r/cursor/comments/1sx30zw/comment/p6kave5/ |
| Reddit r/ClaudeAI | pending AutoMod | https://www.reddit.com/r/ClaudeAI/comments/1w1ey7w/oss_erd_online_let_claude_readwrite_your_database/ |
| Reddit r/programming | **SKIP** | 无 |
| Dev.to | 已发 | https://dev.to/erdonline/how-to-let-ai-agents-manage-your-database-schema-with-mcp-12k1 |
| Hashnode | 已发 | https://erdonline.hashnode.dev/how-to-let-ai-agents-manage-your-database-schema-with-mcp |
| Medium | 已发 | https://medium.com/@builderliang/how-to-let-ai-agents-manage-your-database-schema-with-mcp-5c850646273f |
| 掘金 | 已发 | https://juejin.cn/post/7679054762877763635 |
| CSDN | 已发（审核中） | https://blog.csdn.net/qq_30054961/article/details/164169329 |
| 知乎 | 已发 | https://zhuanlan.zhihu.com/p/2077045243858392500 |
| 开源中国 | 已发（canonical） | https://my.oschina.net/u/3339242/blog/19750364 |

**SEO essay（2026-08-29 · 非 MCP 帖）：**

| 平台 | 状态 | 公网 URL |
|---|---|---|
| Hashnode | 已发 | https://erdonline.hashnode.dev/average-position-1-zero-clicks-eight-urls-one-identity |
| Dev.to | 已发 | https://dev.to/erdonline/average-position-1-zero-clicks-eight-urls-one-identity-25f4 |
| Medium | 已发 | https://medium.com/@builderliang/search-console-told-us-we-were-ranking-38a6be9a8a9c |
| X Premium | 已发 | https://x.com/BuilderLiang/article/2093670417458491425 |
| 掘金 | 已发 | https://juejin.cn/spost/7679223034338967562 |
| CSDN | 已发 | https://blog.csdn.net/qq_30054961/article/details/164172342 |
| 知乎 | 已发 | https://zhuanlan.zhihu.com/p/2077104111452006080 |
| 开源中国 | 已发 | https://my.oschina.net/u/3339242/blog/19750424 |

**失败样例（勿当成功）：** Reddit 乱码顶帖 https://www.reddit.com/r/cursor/comments/1w1e64s/…；OSChina 空帖 https://my.oschina.net/u/3339242/blog/19750362

---

## 全局纪律

| 项 | 值 |
|---|---|
| Node | `export PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH"` |
| Daemon | `npx -y --package=chrome-devtools-mcp chrome-devtools start --autoConnect --no-usage-statistics --no-headless` |
| Fallback | `./scripts/start-chrome-debug.sh --force-9222` + `CHROME_DEVTOOLS_BROWSER_URL=http://127.0.0.1:9222` |
| 工具 | chrome-devtools MCP/CLI；**禁止** Playwright / `connectOverCDP` |
| 填表 | native value setter + `input`/`change`；**只填一次**；**保留 `\n`**；禁止 MCP `fill()` 填长正文 |
| 语言 | **国内 = 中文**（掘金/CSDN/知乎/OSChina）；**国际 = 英文**（PH/HN/X/Reddit/Dev.to/Hashnode/Medium） |
| 验收 | **编辑器读回不算**；必须以**公网 URL 正文**为准（articleLen≈3000+ 中文 / 4000+ 英文；`hasMcp=true` 或关键段落可见） |
| 硬停 | lock / unusual activity / password-reset / captcha / phone-verify → **立即停止**；禁止 Agent 代 reset / 过验证 |
| **X 长文** | **Article only**（见 [`x-article-playbook.md`](x-article-playbook.md)）；SEO essay **禁止** `compose/post`；官方快捷键填 block + **Preview 通过才 Publish**；公网必须 `/article/` |
| 节奏 | 操作间隔数秒；每 sub **一次** submit；禁止 rapid re-fill / post-then-delete 循环 |

**缺稿才停：** 无对应语言稿 → 停；禁止输入框现翻。

稿件目录：
- 国际英文：`docs/growth-content/2026-08-29-*.md`
- 国内中文：`content/articles/cursor-mcp-read-and-suggest-version.juejin.md`（去 `# 标题` 行）

---

## Product Hunt

| 字段 | 值 |
|---|---|
| **语言** | 英文 |
| **稿件路径** | `docs/growth-content/2026-08-29-product-hunt.md` |
| **登录检查** | Maker 账号已登录 |
| **compose/edit URL** | 新建 `https://www.producthunt.com/posts/new`；已排期 `https://www.producthunt.com/products/erd-online?launch=erd-online` |
| **编辑器模式** | 表单字段（非 Markdown） |
| **填目标** | Title、Tagline、Website URL 等 |
| **填法** | native setter；Website URL 框**自带 `https://` 前缀** → 填 `www.erdonline.com`，**勿**填完整 URL |
| **提交按钮** | Schedule / Launch（用户确认后） |
| **公网验正文** | 排期页可见 tagline/description；launch 后产品页正文完整 |
| **本次 live URL** | https://www.producthunt.com/products/erd-online?launch=erd-online |
| **硬停** | Interactive demo 拒泛 `/demo`（要 Storylane/Arcade/Supademo） |

---

## X (Twitter)

**长文 = Article only；Post composer 发长文 = 失败。**

SEO essay / 博客稿 **禁止** `x.com/compose/post` 或 280 字 composer；公网 URL 必须是 `/article/<id>`，不是 `/status/<id>`。`content/articles/`、`docs/growth-content/*-x.md`、`fill-x-article-shortcuts` 来源的稿件 **只能** 走 Article。CLI 误走 Post 路径时 `assert-x-article-composer.mjs` 会 **throw**，不打开浏览器。

### X — 短讯 Post（≤280 字）

| 字段 | 值 |
|---|---|
| **语言** | 英文 |
| **稿件路径** | 各稿 `X/Twitter Sync` 段（短 teaser） |
| **登录检查** | @BuilderLiang 已登录 |
| **compose URL** | `https://x.com/compose/post` |
| **编辑器** | `[data-testid="tweetTextarea_0"]` contenteditable |
| **填法** | `execCommand('insertText')` **一次** |
| **提交** | `[data-testid="tweetButton"]` **Post** |
| **公网验正文** | `x.com/<user>/status/<id>` |
| **MCP 帖 live URL** | https://x.com/BuilderLiang/status/2093575187761713453 |
| **硬停** | captcha / lock → STOP |

### X — 长文 Article（Premium · SEO essay 等）

**完整 playbook（Agent 照此逐步执行）：** [`x-article-playbook.md`](x-article-playbook.md) — **Insert** 菜单（Media / GIF / Posts / Divider / Code / LaTeX / Table）见 playbook § Insert 下拉菜单

| 字段 | 值 |
|---|---|
| **何时用** | 长文 / 精品 essay → **Article only**（`/article/<id>`）；短讯 ≤280 → Post（上节）；**禁止**长文走 `compose/post` / `/status/` |
| **语言** | 英文 |
| **稿件路径** | `docs/growth-content/*-seo-essay-x.md`（`## X title` + `## X body`）；**禁止**整篇 `.md` 粘贴 |
| **登录检查** | @BuilderLiang 已登录 |
| **compose/edit URL** | 新建：`https://x.com/compose/articles` → **`button[aria-label="create"]`** → 等 URL **`compose/articles/edit/{id}`**（例 `…/edit/2093728235884605440`）；续编：已在 edit URL；Preview：`…/edit/<id>/preview` |
| **Create 控件** | `button[aria-label="create"][role="button"]` — 点 Create 后 **必须**等到 edit URL 再 type；hub-only 或 `compose/post` → throw |
| **标题框** | `textarea[name="Article Title"]`（`placeholder="Add a title"` · `maxlength="100"`）— **只填标题**；禁止把 title 打进 body |
| **编辑器** | 富文本 WYSIWYG（`#toolbar-styling-buttons`）；Style dropdown **Heading / Subheading / Body**；正文默认 Body |
| **Toolbar testid** | `btn-bold` `btn-italic` `btn-strikethrough` `btn-blockquote` `btn-ul` `btn-ol` `btn-link` `btn-emoji`；Insert = `button[aria-label="Add Media"]`；Style = 含 **Body** 文案的下拉；**禁止** `css-*` 哈希类 |
| **填法** | title → `textarea[name="Article Title"]`；正文 → 读者扫读表 + **Insert 纪律**（链接 `btn-link`/⌘K、媒体 Insert→Media；**禁止** markdown `[text](url)` / `![]()`）；详见 playbook § 插入走编辑器 Insert |
| **脚本（唯一入口）** | `node scripts/fill-x-article-shortcuts.mjs --slug=<slug> [--pageId=N] [--compile-only] [--audit] [--dump-payload=path.json]` — **复用已有 edit tab，Never Create**；`--submit` spawn 前 exit 1 |
| **Preview** | **强制**；字号像杂志、无 `\n{3,}`、Heading 层级 OK → 才 Publish |
| **提交** | 工具栏 **Publish** → 对话框 **Publish** |
| **公网验正文** | `https://x.com/BuilderLiang/article/<id>`（**必须** `/article/`）；articleLen≈12000+ |
| **SEO essay live URL** | https://x.com/BuilderLiang/article/2093670417458491425 |
| **硬停** | Playwright；整篇 md paste；Preview 未过就发；误开 `compose/post` → 关闭改 Article |

**读者扫读（冻结 · 见 playbook § 按读者扫读选格式）：**

| 读者要干什么 | 写在哪 | 快捷键 |
|---|---|---|
| 认出文章 | Title 框 | 只打 `textarea[name="Article Title"]`；正文不要再 `#` 一遍标题 |
| 扫下一节 | 小节标题 | 行首 `##` + 空格；一节一个，不要每段当标题；**打完 Enter → Style dropdown 点 Body** |
| 读故事/论证 | 普通段 | 纯正文，不加 `#`/`##`/`-`/`>`，不要整段 ⌘B |
| 抓住短标签 | 短语 | 只选那几个词 ⌘B → 收拢选区 |
| 并列/步骤 | 列表 | `-` + 空格 或 `1.` + 空格 → 退出后 **点 Body** |
| 报错原话 | 引用 | `>` + 空格 → 退出后 **点 Body** |
| 可点 URL | 链接 | 选中锚文本 → `btn-link` 或 ⌘K → 对话框 URL；**禁止** `[text](url)` |
| Insert 块 | Insert | `button[aria-label="Add Media"]` → 冻结 7 项 menuitem（见 playbook § Insert）；`insertMenu(pageId, itemName)` |
| 段与段 | | **一个** Enter，禁止空多行 |

**Insert 菜单（7 项冻结 · IR → menuitem）：**

| IR kind / need | Menu |
|---|---|
| `image` / photo / video | **Media** |
| `gif` | **GIF** |
| `posts` | **Posts** |
| `divider` | **Divider** |
| `code` | **Code** |
| `latex` | **LaTeX** |
| `table` | **Table** |

**插入纪律：** 链接 → `btn-link`/⌘K；Insert → `insertMenu()` 按名点 menuitem（缺项 throw 列 7 名）；Code 块禁止 markdown fence；CTA URL 走 IR `links[]`；关后 **`assertBodyPlain`**。**Insert 七项按需一条，禁止连续堆叠、禁止节前默认 Divider。**

**开/关：** 默认 Body；命中上表才开；开完立刻关（playbook § 开/关）。

IR：`x-article-block-ir.mjs` → `compileArticle()`（text → HTML；links → postPaste ⌘K；objects → `insertPlan[]`）。

CLI（短讯 Post ≤280 字）：`node scripts/post-all-browser.mjs --platform x --body-file … [--submit]` — **长文 / growth-content / content/articles 会 throw**；长文走 `fill-x-article-shortcuts.mjs`

---

## Hacker News

| 字段 | 值 |
|---|---|
| **语言** | 英文 |
| **稿件路径** | `docs/growth-content/2026-08-29-hacker-news.md` |
| **登录检查** | 已登录可填表；未登录 → 停 |
| **compose/edit URL** | `https://news.ycombinator.com/submit` |
| **编辑器模式** | 纯文本，无 Markdown 切换 |
| **填目标** | `input[name="title"]`、`input[name="url"]`、`textarea[name="text"]` |
| **填法** | native setter + `input`/`change`；各**一次** |
| **提交按钮** | `input[type="submit"]` **Submit** |
| **公网验正文** | item 页可见 title + text |
| **本次 live URL** | **无** — Submit 后重定向 `https://news.ycombinator.com/showlim` |
| **硬停** | 新号 Show HN → showlim → **勿重试 Show HN**；换有 karma 老号 |

CLI：

```bash
node scripts/post-all-browser.mjs --platform hackernews \
  --title "Show HN: ERD Online – Open-source database design with MCP for AI agents" \
  --url https://www.erdonline.com \
  --body-file docs/growth-content/2026-08-29-hacker-news.md
```

---

## Reddit — 全局

| 字段 | 值 |
|---|---|
| **语言** | 英文 |
| **稿件路径** | `docs/growth-content/2026-08-29-reddit.md`（按 `## r/<sub>` 段取 Body；r/cursor 仅评论正文，无 Title） |
| **登录检查** | `https://www.reddit.com/settings/account` → username **必须** = u/erdonline；**若** MeanAbbreviations645 或 lock/password-reset 墙 → **HARD STOP** |
| **硬停** | unusual activity / reset password / captcha / phone-verify → STOP；禁止 Agent 代 reset |

**旧账号（禁用）：** u/MeanAbbreviations645 — LOCKED，**永不使用**。

**新账号：** u/erdonline；Profile `https://www.reddit.com/user/erdonline/`

**失败顶帖（勿当成功）：** https://www.reddit.com/r/cursor/comments/1w1e64s/oss_erd_online_let_cursor_readwrite_your_database/

---

## Reddit — r/cursor（Weekly Showcase **评论**）

| 字段 | 值 |
|---|---|
| **语言** | 英文 |
| **稿件路径** | reddit.md `## r/cursor` → `### Body` |
| **登录检查** | 同 Reddit 全局 |
| **compose/edit URL** | Showcase 帖 `https://www.reddit.com/r/cursor/comments/1sx30zw/weekly_cursor_project_showcase_thread/`（搜索 `title:"Weekly Cursor Project Showcase Thread"` sort=new） |
| **编辑器模式** | **Markdown**（`显示格式设置选项` → `切换到 Markdown`；读回 **Markdown 编辑器**） |
| **填目标** | Shadow DOM 内 `textarea[placeholder="加入对话"]`（offsetWidth > 100）；**never** contenteditable |
| **填法** | 遍历 shadowRoot 找 textarea → native value setter + `input`/`change`；**一次** |
| **提交按钮** | **评论** |
| **公网验正文** | comment permalink 可见正文；换行数 ≈ 源稿 |
| **本次 live URL** | https://www.reddit.com/r/cursor/comments/1sx30zw/comment/p6kave5/ |
| **硬停** | AutoMod「repost in Weekly Showcase」= 发错位置；**禁止** `r/cursor/submit/?type=TEXT` 开新帖 |

读回基准（2026-08-29）：bodyLen=1035、newlineCount=34、possibleDuplicate=false

---

## Reddit — r/ClaudeAI（TEXT 帖）

| 字段 | 值 |
|---|---|
| **语言** | 英文 |
| **稿件路径** | reddit.md `## r/ClaudeAI` |
| **登录检查** | 同 Reddit 全局 |
| **compose/edit URL** | `https://www.reddit.com/r/ClaudeAI/submit/?type=TEXT` |
| **编辑器模式** | **Markdown**（`button[aria-label="切换到 Markdown"]`.click()） |
| **填目标** | Shadow DOM：`textarea[placeholder*="标题"]`、`textarea[placeholder*="正文"]` |
| **填法** | native setter + `InputEvent` + `input`/`change`；title/body 各**一次** |
| **提交按钮** | **发帖**（flair 必填：**Claude Workflow** → **添加**） |
| **公网验正文** | permalink 对公众可见（banner 消失且 feed 可见）；pending 时作者可见但公众不可见 |
| **本次 live URL** | https://www.reddit.com/r/ClaudeAI/comments/1w1ey7w/oss_erd_online_let_claude_readwrite_your_database/ |
| **硬停** | 「筛选器移除」banner = **pending/held**，非 spam-kill；**等待数分钟**；**禁止**立即重发 / panic modmail；karma/age/captcha/lock → STOP |

**顺序：** r/cursor 评论成功且无 lock 后 → 等数秒 → r/ClaudeAI

---

## Reddit — r/programming（**SKIP 永久**）

| 字段 | 值 |
|---|---|
| **语言** | — |
| **稿件路径** | — |
| **登录检查** | — |
| **compose/edit URL** | **禁止** navigate 到 `r/programming/submit` |
| **编辑器模式** | — |
| **填目标** | — |
| **填法** | — |
| **提交按钮** | — |
| **公网验正文** | — |
| **本次 live URL** | 无 |
| **硬停** | Rule 5: "I made this" / product demo off-topic；已开 composer → `close_page`，不点发帖 |

---

## Dev.to

| 字段 | 值 |
|---|---|
| **语言** | 英文 |
| **稿件路径** | `docs/growth-content/2026-08-29-blog-post.md` |
| **登录检查** | @erdonline 已登录 |
| **compose/edit URL** | `https://dev.to/new`（onboarding → **Skip for now**） |
| **编辑器模式** | Markdown textarea（无 Fancy Pants） |
| **填目标** | `#article_body_markdown` |
| **填法** | native setter + `input`/`change`；**一次** |
| **提交按钮** | **Publish** |
| **公网验正文** | 文章页全文可见 |
| **本次 live URL** | https://dev.to/erdonline/how-to-let-ai-agents-manage-your-database-schema-with-mcp-12k1 |
| **硬停** | captcha → STOP |

---

## Hashnode

| 字段 | 值 |
|---|---|
| **语言** | 英文 |
| **稿件路径** | `docs/growth-content/2026-08-29-blog-post.md`（Body 段） |
| **登录检查** | 侧边栏见 `erdonline`；**若** **Sign in** → **HARD STOP** |
| **compose/edit URL** | `https://hashnode.com/new` → **Write** → `hashnode.com/draft/<id>`（首次需 Create publication：Name `ERD Online` / Subdomain `erdonline`） |
| **编辑器模式** | **Markdown** tab（`tab "Markdown"`；非 Rich） |
| **填目标** | 标题 `textarea[placeholder*="Article Title"]`；正文 `textarea[placeholder*="markdown"]` |
| **填法** | native setter + `input`/`change`；UTF-8 base64 注入；**一次** |
| **提交按钮** | **Publish** → Draft settings → **Select a publication** → **ERD Online** → dialog **Publish** |
| **公网验正文** | `erdonline.hashnode.dev` 文章页全文 |
| **本次 live URL** | https://erdonline.hashnode.dev/how-to-let-ai-agents-manage-your-database-schema-with-mcp |
| **硬停** | captcha / phone-verify → STOP |

读回基准：bodyLen≈4477、newlineCount≈112、无 duplicate

---

## Medium

| 字段 | 值 |
|---|---|
| **语言** | 英文 |
| **稿件路径** | `docs/growth-content/2026-08-29-blog-post.md`（**优先** Hashnode live URL 导入） |
| **登录检查** | @Builderliang 已登录；**若** `medium.com/m/signin` → **HARD STOP** |
| **compose/edit URL** | **Import（推荐）：** `https://medium.com/p/import` → Hashnode live URL → `medium.com/p/<id>/edit`；**手动：** `https://medium.com/new-story` |
| **编辑器模式** | 富文本（import 后 `main h3` + `main p`；**无** Markdown 切换） |
| **填法（推荐 · import）** | `medium.com/p/import` → contenteditable 填 Hashnode URL → **Import** → 等 **Saved**（无 save error banner）→ **Publish** → submission 页 **Publish** |
| **填法（手动 · 易 blocked）** | 标题 `execCommand('insertText')`；正文 **`type_text`** — native setter / paste / beforeinput **均失败**；易触发 save error |
| **提交按钮** | 编辑器 **Publish** → `/submission` 页 **Publish**（非 Schedule） |
| **公网验正文** | `@builderliang/...` 文章页 articleLen≈4000+、`hasMcp=true` |
| **本次 live URL** | https://medium.com/@builderliang/how-to-let-ai-agents-manage-your-database-schema-with-mcp-5c850646273f |
| **硬停** | save error banner **「Something is wrong…」** → **HARD STOP**（勿重试 storms）；Cloudflare Turnstile（`me/stories`）→ STOP |

Import 命令序列（2026-08-29 成功）：

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH"
# new_page https://medium.com/p/import → 填 Hashnode URL → click Import
# 等 Saved → Publish → submission Publish → 验公网 URL
```

读回基准（import）：editor bodyLen≈4285 / 公网 articleLen≈4218 / hasMcp=true

---

## 掘金

| 字段 | 值 |
|---|---|
| **语言** | 中文 |
| **稿件路径** | `content/articles/cursor-mcp-read-and-suggest-version.juejin.md` |
| **登录检查** | 梁工造物账号已登录 |
| **compose/edit URL** | `https://juejin.cn/editor/drafts/new` 或草稿 URL |
| **编辑器模式** | ByteMD + CodeMirror 5 Markdown（`.bytemd`；**非**裸 `textarea` / 裸 `contenteditable`） |
| **填目标** | 标题 `input[placeholder*="标题"]`（`input.title-input`，**勿**当正文）；正文 **`.bytemd .CodeMirror textarea`**（CM5 源码框）；备选 CM6 **`.bytemd .cm-content[contenteditable="true"]`**（仅 `.bytemd` 内，非 preview） |
| **填法** | 标题：native setter + `input`/`change`；正文：`.bytemd .CodeMirror textarea` → **`CodeMirror.setValue(body)`**（CM5 隐藏 textarea 的 `value` 读回恒为 0，勿 `setNative`）；备选 CM6：`.bytemd .cm-content` → `textContent` + `input`；**禁止** `querySelector('textarea')`、裸 `[contenteditable="true"]`、`execCommand('insertText')`（吞 `\n`）；**一次** |
| **提交按钮** | **发布** → 弹窗：分类 **后端** + 标签（数据库、MCP 等）→ **确定并发布** |
| **公网验正文** | `juejin.cn/post/<id>` 正文可见；isChinese=true |
| **本次 live URL** | https://juejin.cn/post/7679054762877763635 |
| **硬停** | captcha / phone-verify → STOP |

读回基准：3032 字 / 72 换行 / isChinese=true / 无 duplicate

---

## CSDN

| 字段 | 值 |
|---|---|
| **语言** | 中文 |
| **稿件路径** | `content/articles/cursor-mcp-read-and-suggest-version.juejin.md`（去 `# 标题` 行） |
| **登录检查** | qq_30054961 已登录 |
| **compose/edit URL** | `https://editor.csdn.net/md`（新建）或 `?articleId=164169329`（续编） |
| **编辑器模式** | **Markdown**；**禁止**切「使用富文本编辑器」 |
| **填目标** | 标题 `input.article-bar__title`；正文 `pre.editor__inner` |
| **填法** | 标题：native setter + `input`/`change`；正文：**`pre.textContent = body` + `input` 事件**；**禁止** `execCommand('insertText')`（吞 `\n`） |
| **提交按钮** | **发布文章** → 弹窗加标签 → 弹窗内 **发布文章** |
| **公网验正文** | `blog.csdn.net/.../details/<id>` 正文可见 |
| **本次 live URL** | https://blog.csdn.net/qq_30054961/article/details/164169329 |
| **硬停** | 验证码 / 手机验证 → STOP |

读回基准：3033 字 / 73 换行 / isChinese=true

---

## 知乎

| 字段 | 值 |
|---|---|
| **语言** | 中文 |
| **稿件路径** | `content/articles/cursor-mcp-read-and-suggest-version.juejin.md`（去 `# 标题` 行） |
| **登录检查** | ERDOnline 账号已登录 |
| **compose/edit URL** | 新发 `https://zhuanlan.zhihu.com/write`；补正文 `https://zhuanlan.zhihu.com/p/2077045243858392500/edit` |
| **编辑器模式** | Markdown 语法输入中（Draft.js contenteditable + 标题 textarea） |
| **填目标** | 标题 `textarea[placeholder*="标题"]`；正文 `[contenteditable="true"].public-DraftEditor-content` |
| **填法（新发）** | 标题：native setter；正文：`InputEvent('beforeinput', { inputType: 'insertFromPaste', data: body })` |
| **填法（补正文，可靠）** | **`scripts/zhihu-patch-draft.mjs`** → `PATCH /api/articles/<id>/draft` 写 HTML `content` → reload edit → 读回 wordCount≈3000+ → click **更新** |
| **提交按钮** | 新发：**发布**；已发补填：**更新**（非「发布」） |
| **公网验正文** | `zhuanlan.zhihu.com/p/<id>` articleLen≈3000+、`hasMcp=true`（「上一篇讲完」）；**编辑器读回有字但公网空 = 失败** |
| **本次 live URL** | https://zhuanlan.zhihu.com/p/2077045243858392500 |
| **硬停** | Draft.js paste / execCommand **不持久**；draft PATCH 200 但公网仍空 → 漏点 **更新**；验证码 → STOP |

补正文命令：

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH"
node scripts/zhihu-patch-draft.mjs <pageId>
# reload edit → click 更新 → 验公网 URL
```

---

## 开源中国（OSChina）

| 字段 | 值 |
|---|---|
| **语言** | 中文 |
| **日常脚本** | `node scripts/post-seo-essay.mjs oschina [--submit]` — **正向路径唯一入口** |
| **稿件路径** | MCP 帖：`content/articles/cursor-mcp-read-and-suggest-version.juejin.md`；SEO essay：`docs/growth-content/2026-08-29-seo-essay.zh.md` |
| **登录检查** | uid `3339242` 已登录；**若** 见 **登录** → **HARD STOP** |
| **compose/edit URL** | **`https://my.oschina.net/u/3339242/blog/ai-write`**（**无 `?id=`**；**勿**用 `/blog/write` — 404） |
| **正向路径（强制三步）** | ① 检测编辑器：若非 MD → `img[alt="swap"]`（或最近可点父级）→ **确定切换**（每步 sleep 1–3s）→ ② 找可见正文 `textarea`（`offsetWidth>100` 且 placeholder 非「标题」）→ **`setNative(ta, body)` 一次**（value setter + `input`/`change`）；**禁止** `pre.textContent` → ③ 读回 `textareaLen`≥1000 且含中文，否则 **abort submit** |
| **填目标** | 标题 `input[placeholder*="标题"]`；正文**可见 `textarea`**（MD 模式） |
| **提交按钮** | **发布文章** → 弹窗 **确定并发布** |
| **公网验正文** | 提交后 **必须** 打开 `my.oschina.net/u/3339242/blog/<id>`；`articleLen`≥1000 + 中文≥100；编辑器读回 **不算成功** |
| **本次 live URL** | MCP：https://my.oschina.net/u/3339242/blog/19750364 · SEO essay：https://my.oschina.net/u/3339242/blog/19750424 |
| **硬停** | **勿**用 `ai-write?id=<旧id>` 原地编辑；`/blog/edit/<id>` 404；19750362 空帖 **勿再编辑**；**`fix-oschina-zhihu-body.mjs` 仅修历史空帖，不是日常路径** |

读回基准：titleLen≈29、textareaLen≈3000+、newlineCount≈72；公网 articleLen≈3000+

---

## 提交前速查（全平台）

1. 路径卡步骤逐步执行；**禁止** snapshot 后自行摸索 DOM
2. 填表**一次**；读回 newlineCount ≈ 源稿、possibleDuplicate=false
3. Reddit：**Markdown 模式** + shadow textarea；无 literal `**` 墙
4. 无 account lock / showlim / captcha blocker
5. 用户明确说「提交」或 `--submit` 才点 Publish/Submit
6. 提交后：**打开公网 URL** 验正文（编辑器读回不算）
