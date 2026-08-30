# X Article Playbook（Premium 长文 · 可复用）

**长文 = Article only；Post composer 发长文 = 失败。**

**运行时：** `post-seo-essay.mjs x` / `post-all-browser.mjs --platform x` 对长文或 `*-x.md` 会 **throw**（见 `scripts/growth/lib/assert-x-article-composer.mjs`）；`fill-x-article-shortcuts.mjs` 仅在 `compose/articles` 才填稿。

**Agent 下次发 X 长文照此执行，禁止重新摸索 UI。** 环境准备见 [`post-via-chrome-devtools.md`](post-via-chrome-devtools.md)；路径卡摘要见 [`platform-post-recipes.md`](platform-post-recipes.md) § X — 长文 Article。

---

## 何时用 Article vs Post

| 场景 | 形态 | 公网 URL 形态 |
|---|---|---|
| **长文 / 精品 essay**（SEO 文、博客同步、3000+ 字） | **Article only** | `https://x.com/<user>/article/<id>` |
| **短讯**（≤280 字 teaser、launch 一句话） | Post | `https://x.com/<user>/status/<id>` |
| **Premium 长帖但非 essay**（无 Heading 层级、非杂志排版） | Post（或 Thread） | `/status/` |

**硬规则：**

- SEO essay / 博客长稿 → **只用 Article**；**禁止** `x.com/compose/post`、`/status/`、`tweetTextarea_0`
- 误开 Post composer → **关闭**，改开 Article；不要把长文硬塞进 280 字框或分块 dump 到 Post

---

## 入口 URL

| 用途 | URL |
|---|---|
| **新建** | `https://x.com/compose/articles` → **`button[aria-label="create"]`** → URL 变为 **`compose/articles/edit/{id}`**（例 `…/edit/2093728235884605440`）→ 再填稿 |
| **续编草稿（默认）** | 已在 `https://x.com/compose/articles/edit/<draftId>` — **跳过 Create**；脚本 `resolveEditPageId()` / `--pageId=`；X autosave |
| **Preview（可选）** | 编辑器内 **Preview** 链接 → `/compose/articles/edit/<draftId>/preview` — 草稿 fill 不强制 |
| **Live 验收例** | https://x.com/BuilderLiang/article/2093670417458491425（2026-08-29 · SEO essay · shortcuts + Preview ✓） |

不确定入口时：从 X 左侧 **Write Article** 或 `compose/articles` 进入，**不要**从首页发帖框。

---

## 已验证路径（X Article 草稿 · 2026-08-30）

与 `.cursor/skills/publish-article/SKILL.md` 同步。

### Gold standard 写法图（只读 · 2026-08-30）

**用户手工样板（只读，禁止 agent 覆盖）：** `https://x.com/compose/articles/edit/2093880046998130688` · 标题 **「X样式学习贴」** · 23 blocks。

用途：**对照每种控件长什么样**；**不是**每篇都要堆满全部类型。Job1 / SEO 长文 = 按需取用 + **稀疏 Insert**（见下）。

| 顺序 | 块类型 | DOM / 验收 | 怎么做的 |
|---:|---|---|---|
| 1 | 加粗短语 | `span[style*="font-weight: bold"]` | 打字 → 选中 → **⌘B** → `assertBodyPlain` |
| 2 | 斜体 | `em` / italic span | **⌘I** |
| 3 | 删除线 | `s` / line-through span | **⌘⇧X** |
| 4 | Heading | `<H1>` | Style **Heading** 或 `#`+space（Job1 节名用 **`##` Subheading**） |
| 5 | Subheading | `<H2>` | **`##`+space** |
| 6 | 引用 | `<BLOCKQUOTE>` | **`>`+space** 或 **⌘⇧9** → Enter → 关 toggle |
| 7 | 无序列表 | `<LI>` in `<ul>` | **`-`+space** 或 **⌘⇧7** |
| 8 | 有序列表 | `<LI>` in `<ol>` | **`1.`+space** 或 **⌘⇧8** |
| 9 | 链接 | `<a href>` | 选中 → **`[data-testid="btn-link"]`** → URL（**禁止** ⌘K — 全局跳 /explore） |
| 10 | emoji | DIV | 可选；Job1 **跳过** |
| 11 | Media | SECTION + `<img>` | **Insert → Media** |
| 12 | GIF | SECTION | **Insert → GIF** |
| 13–16 | Code ×4 | SECTION `markdown-code-block` + `<pre>` | **Insert → Code** → overlay 打字 → overlay **Insert** |
| 17 | Table 4×4 | SECTION + `<table>` | **Insert → Table** → 点 `Insert a N by M table` → **Edit block** → markdown → overlay **Update**（填完必点；不是 Insert）→ Escape |
| — | Divider | 本稿 **0** | 大段间才用 |

**Job1 模仿：** code/table **渲染形态**，不是连排 4 code。IR = **1** ERROR code + **1** 对照 table；**0** media；Insert 块之间必须有正文（`validateSparseInserts`）。

**Code 提交：** overlay **Search programming language** → 选语言（Job1 ERROR → **SQL**；缺 language 则保持 Plaintext）→ **Add code here** → `type_text` → 点 overlay 顶栏 **Insert**（Preview 旁）→ Escape。仅 Escape **不**写入正文。语言搜不到且非 `plaintext` → throw。

**Table 提交：** **Edit block** → markdown 填完 → overlay 顶栏 **Update**（可见文案 `Update`，不是 `Insert`）→ Escape。`insertTable()` 必须点 **Update** 才会把表格写入正文。

1. **复用 edit tab** — `resolveEditPageId()`；重试**禁止 Create**。
2. **首启才 Create** — hub 无 edit tab → `button[aria-label="create"]` → 等 `…/edit/{id}`。
3. **Title（S4）** — `setTitleOnce()` + **`type_text`** on title textarea（禁止 setNative）。
4. **Compile → Play** — `compileArticle(slug)` → S5 `clearBody` → S6 **一次** `pasteRich` → S9 `insertPlan`；weak/empty 全量 replay 一次；S10 `auditSnapshot`。
5. **样式在 HTML / postPaste** — 节名 `<h2>`、引用 `<blockquote>`、加粗 `<strong>` 进 compile HTML；**paste 保留 `<strong>` 则不再 ⌘B**；若 paste 剥掉 strong → S7b `selectPhrase` + **⌘B 一次**（禁止 HTML+⌘B 双写）；链接走 paste 后 `postPasteActions`（**`btn-link`**，禁止 ⌘K）；Code/Table = Insert plan。
6. **收尾审计** — 默认无 perceive；`--audit` 一次 `auditPayload()`；drills 仍逐块 observe。
7. **Insert = palette** — Job1：**1 code + 1 table**；0 media；禁止连续 Insert 块（`validateSparseInserts`）。
8. **草稿-only** — autosave；**禁止 Publish**（除非用户明示）；`--submit` **硬 block**。

### Draft.js 输入精度（2026-08-30 · compile-once / batch-emit）

X Article 正文是 **Draft.js** — **禁止** `setNative` / `.value=` / 直接改 DOM 当填稿手段。

| 路径 | 用法 |
|---|---|
| **compile（无 Chrome）** | `compileArticle(slug)` → `{ html, plain, insertPlan }` — 同 slug 确定性复用 |
| **paste（播放首选）** | **一次** `ClipboardEvent` + `text/html` + `text/plain` 写入全部文本块 |
| **insertText / slow** | paste 空或截断时 fallback — 仍走编辑器管道 |
| **type_text** | 仅 title textarea |
| **Insert plan** | Code = fiber **MARKDOWN** atomic；Table = overlay **Update**；Media 锚点插入；尾部多 object → 降序 |
| **audit（可选）** | `--audit` 收尾一次 — hook / h2Count / garbage；**非**逐块 typer 环 |
| **preflight** | `preflightArticleEditor()` — 锁定 `edit/{id}`，非 `compose/post`，草稿-only |

**Gap（已知）：** X paste 若剥离 `<h2>`，audit 会报 `h2Count` — 需补 keyboard `##` style pass（待 live 验证）。

---

## 编辑器模型

X Article 是 **富文本 WYSIWYG**，**不是** Markdown 源码编辑器。

| 项 | 说明 |
|---|---|
| **Toolbar** | `#toolbar-styling-buttons`（Bold / Italic / lists / link / size dropdown）；其旁 **Insert** 按钮 → `data-testid="Dropdown"`；**Keyboard shortcuts** 按钮（`aria-label="Keyboard shortcuts"`）→ 见 § 官方快捷键 |
| **标题** | `textarea[name="Article Title"]`（`placeholder="Add a title"` · `maxlength="100"`）— **只填一次**；正文里**不要再做一遍大标题** |
| **正文** | `[contenteditable="true"]` — **compile 后一次 rich paste** + Insert plan；不是逐段 type 环 |
| **字号三档** | Style dropdown（当前显示 **Body** / **Heading** / **Subheading** 的按钮）— 正文段落默认 **Body**；若全文都是 Heading → 字号异常、像标题墙 |
| **备用 testid** | `btn-bold` `btn-italic` `btn-strikethrough` `btn-blockquote` `btn-ul` `btn-ol` `btn-link`；Size dropdown = Heading / Subheading / **Body** |

**稿件来源：** `docs/growth-content/*-seo-essay-x.md` 的 `## X body` 段 — 源稿是**纯段落 prose**（无 `#` 标题行）；Agent 填稿时**按语义**映射为 Heading / Subheading / Body / quote / list，**禁止**把 `.md` 文件整篇贴进编辑器（`**` `#` 会当字面量或字号全乱）。

---

## Insert 下拉菜单（toolbar · 仅列 7 项）

**位置：** 工具栏 **Insert** 按钮在 `#toolbar-styling-buttons` **旁**；点开后弹出 `data-testid="Dropdown"`，内含 `role=menuitem` 项。**禁止**臆造其它 Insert 类型。

**操作通式：** 光标置于目标 block → 点 **Insert** → 点对应 menuitem 文案 → 填内容 / 上传。

**Preview 验收：** Divider / Code / Table 等必须在 Preview 里看到**真渲染**（横线、等宽代码块、表格格线），**不是**字面量文本或 Markdown 符号。

### Media

| | |
|---|---|
| **何时用** | 正文需要**真实配图/视频**时（例：落地页截图 `frontend/public/landing-hero.webp`） |
| **何时不用** | 无可用真图；占位图、stock、模糊截图 |
| **怎么点** | **Insert** → **Media** → 选文件或粘贴 URL |

### GIF

| | |
|---|---|
| **何时用** | 极少 — 需展示短动画交互且 GIF 已备好 |
| **何时不用** | ERD Online 工程/SEO 叙事文**默认不用** |
| **怎么点** | **Insert** → **GIF** |

### Posts

| | |
|---|---|
| **何时用** | 嵌入**自己已发**的相关 Post 或 Article 短链，作上下文引用 |
| **何时不用** | 无对应已发帖；借他人帖凑互动 |
| **怎么点** | **Insert** → **Posts** → 填 X 帖 URL |

### Divider

| | |
|---|---|
| **何时用** | **大段之间**作视觉休息（例：论证段 vs 清单段）；**不是**每个 Subheading 前 |
| **何时不用** | 段内小间距（Enter 一次即可）；每个 `##` 节前；全文 Divider 过密 |
| **怎么点** | **Insert** → **Divider**（光标在上一节末或下一 Subheading 前） |

### Code

| | |
|---|---|
| **何时用** | `curl` 命令、`_redirects`、配置片段等 SEO/工程文**正文必需**的可复制块；**不是**行内 markdown 反引号 |
| **何时不用** | 整篇文章、长 prose、可用 Body + ⌘B 强调的短语 |
| **怎么点** | **首选：** Draft.js fiber → entityType **MARKDOWN** · `data.markdown = "\`\`\`sql\\n…\\n\`\`\`"` · 锚在 Friday hook 后（`insertCodeAtomic`）。**Fallback：** Insert → Code → **Search programming language** → **SQL**（ArrowDown+Enter）→ **Add code here** → overlay **Insert** → Escape |
| **DOM** | SECTION `data-testid="markdown-code-block"` · `<pre>` · 可选语言行（sql/javascript/…） |

### LaTeX

| | |
|---|---|
| **何时用** | 正文确有**数学公式**需排版 |
| **何时不用** | SEO 叙事文、无公式的工程文 — **默认跳过** |
| **怎么点** | **Insert** → **LaTeX** → 填公式 |

### Table

| | |
|---|---|
| **何时用** | 数字对照表（例：GSC **position / clicks / impressions** 前后对比） |
| **何时不用** | 两三行可用列表（`-` / ⌘⇧7）说清的数据；假表格撑版面 |
| **怎么点** | **Insert** → **Table** → 填行列与单元格 |

**ERD Online SEO essay 速查：** Divider（大段间，≤2）· Code（curl / redirects / 配置）· Table（GSC 数字）· Media（有真图才插）· GIF / LaTeX 一般跳过 · Posts（仅嵌入自己的相关帖）。

### Insert 按需一条（palette · 永久）

Insert 七项是**能力清单**，不是**每篇必插清单**。**默认不插**；IR 显式写了 `kind` 且读者需要那个对象时才 emit **一条**。禁止连续堆叠 Divider+Code+Media；**禁止**在每个 `##` 节前默认 Divider。Job1：**1 code（ERROR）+ 1 table（catalog vs contract）**；0 media；0 divider（ERROR code 已做视觉断点，divider 会与 code 连排违规）。

---

## 冻结定位器（path card · 2026-08-30）

**禁止** `class="css-g5y9jx …"` 等哈希类名；**禁止**把标题打进正文 `[contenteditable="true"]`。

### 标题框

```html
<textarea name="Article Title" placeholder="Add a title" maxlength="100">
```

| 字段 | 定位器 |
|---|---|
| **Title** | `textarea[name="Article Title"]`（或 `textarea[placeholder="Add a title"]`） |

### 工具栏（`#toolbar-styling-buttons`）

| 控件 | 定位器 |
|---|---|
| Bold | `[data-testid="btn-bold"]` |
| Italic | `[data-testid="btn-italic"]` |
| Strikethrough | `[data-testid="btn-strikethrough"]` |
| Style（H1/H2/Body） | `#toolbar-styling-buttons` 内可见文案为 **Body** / **Heading** / **Subheading** 的下拉按钮 |
| Blockquote | `[data-testid="btn-blockquote"]` |
| Unordered list | `[data-testid="btn-ul"]` |
| Ordered list | `[data-testid="btn-ol"]` |
| Link | `[data-testid="btn-link"]` |
| Emoji | `[data-testid="btn-emoji"]` 或 `aria-label="Add emoji"` |
| Insert media | `aria-label="Add Media"` |
| Keyboard shortcuts help | `aria-label="Keyboard shortcuts"` |

**填稿纪律：** **优先**官方 Keyboard shortcuts + In-Text Shortcuts（见下表）；`data-testid` toolbar **仅作 click fallback**。**禁止**把 `**bold**` / `# title` markdown 当字面量打进正文；**禁止**把 title 打进 body editor。

---

## 官方快捷键（Mac · `aria-label="Keyboard shortcuts"` 对话框 · 用户冻结 verbatim）

**Inline / selection（Keyboard shortcuts 表）：**

| Action | Keys |
|---|---|
| Bold | ⌘+B |
| Italicize | ⌘+I |
| Underline | ⌘+U |
| Strikethrough | ⌘+shift+X |
| Insert link | ⌘+K |
| Bulleted list | ⌘+shift+7 |
| Numbered list | ⌘+shift+8 |
| Quote block | ⌘+shift+9 |
| Increase text size | ⌘+shift+. |
| Decrease text size | ⌘+shift+, |

**In-Text Shortcuts**（官方原文：*"Enter at the start of a new line or block, followed by a space"*）：

| Action | Type then space |
|---|---|
| Heading | `#` |
| Subheading | `##` |
| Bulleted list | `-` or `+` or `*` |
| Numbered list | `1.` or `2)` |
| Quote block | `>` or `>>` |

> **Fill 纪律：** Title 已在 `textarea[name="Article Title"]` 时，正文**不用** `#`（Heading）；节名一律 `##`（Subheading）。上表 `#` 仅作 X 官方对照，非 fill 路径。

**用法速记（darwin 主机 CDP 发 Meta · 正文节一律 Subheading）：**

- 节名 → 新 block 行首 **`## ` + 标题** → **`assertBodyPlain()`**（⌘⇧,，禁止点 Body menuitem）→ 再写下一段故事
- 正文段落 → 无 marker（Body 默认）
- 金句 / 报错 → **`> `** 或 **⌘+shift+9** → Enter 退出 → **`assertBodyPlain()`**
- 清单 → **⌘+shift+7/8** 或 `- ` / `1. ` marker → Enter 退出 → **`assertBodyPlain()`**
- 加粗 → 选中短 span → **⌘+B**（勿打 `**` 字面量）→ 收拢选区、caret 到段末；链接 → **⌘+K** → 同上
- **草稿 fill 不强制 Preview**；Publish **仅用户明示**；长文 **Article only**，禁止 Post

### 开/关（Agent 只会开不会关 · 永久纪律）

**默认 = Body，无 mark。** 特殊样式**临时** — 命中读者扫读表才开，**开完立刻关**。

1. **节标题块后：** `##`+space 打节名 → Enter → **`assertBodyPlain()`**（⌘⇧, 至 Body；toggle chord 关 mark）。**禁止**点 Style menuitem；**禁止**三项 menuitem 仍可见时打字。
2. **列表 / 引用块后：** Enter 退出 → **`assertBodyPlain()`**（⌘⇧9/7/8 关 toggle）。
3. **⌘B / ⌘I / ⌘K 后：** collapse selection，caret 到段末；下一字符不得仍加粗/斜体/链接。
4. **脚本：** compile HTML paste 写入 text 块；Insert 块走 `insertMenu()` 族 → Escape → `resetToBodyPlain()`；links 走 S8 `applyLinkChord`。

---

## 官方快捷键（Mac · 编辑器内 Keyboard shortcuts 对话框 · 1:1）【deprecated · 见上 verbatim 表】

**打开方式：** 工具栏 **Keyboard shortcuts** 按钮（`aria-label="Keyboard shortcuts"`）→ 弹出 `role="table"` 对照表。**仅列下列 10 行** — 禁止臆造其它键位。

| Action | Keys |
|---|---|
| Bold | ⌘ + B |
| Italicize | ⌘ + I |
| Underline | ⌘ + U |
| Strikethrough | ⌘ + shift + X |
| Insert link | ⌘ + K |
| Bulleted list | ⌘ + shift + 7 |
| Numbered list | ⌘ + shift + 8 |
| Quote block | ⌘ + shift + 9 |
| Increase text size | ⌘ + shift + . |
| Decrease text size | ⌘ + shift + , |

**用法速记：**

- 正文段落默认 **Body**（无 marker 的新 block）；若字号过大 → 选中段落 → **Decrease text size**（⌘ + shift + ,）重复直到 Body
- 链接：选中文本 → **`[data-testid="btn-link"]`** → 填 URL → Enter → 关对话框 → **Body**（**禁止** ⌘K 与 markdown `[]()`）
- **草稿 fill 不强制 Preview**；长文 **Article only**，禁止 Post（见 § 何时用 Article vs Post）

---

## In-text 行首 marker（附录 · 非 Keyboard shortcuts 对话框）

对话框**不含**下列 marker；须在**新 block 开头**打 marker + 空格。禁止把 marker 当字面量打进段中。

| 效果 | 行首 marker |
|---|---|
| **Subheading（正文节名）** | `## ` + 标题 — Title 已在 title 框，正文**不用** `#` |
| Bulleted list | `- ` / `+ ` / `* `（或对话框 **Bulleted list** ⌘⇧7） |
| Numbered list | `1. ` / `2) `（或对话框 **Numbered list** ⌘⇧8） |
| Quote block | `> ` / `>> `（或对话框 **Quote block** ⌘⇧9） |
| **Body（默认）** | 新 block **无 marker** |

**Block 纪律：**

- stats hook / 金句 → `> ` blockquote block → Enter → **`assertBodyPlain()`**
- 清单 → ⌘⇧7/8 或 marker；填完 list 后 **Enter 一次** 退出 list → **`assertBodyPlain()`** 再继续
- 段间 **`newParagraph()`**（End+Enter）；`\n{3,}` **禁止**
- URL 文本 → 选中 → **`btn-link`**，不要裸 paste `https://…` 指望自动 link；**禁止** ⌘K（全局跳 /explore）

---

## 按读者扫读选格式（fill 用此表 · 官方 In-text 附录见上）

| 读者要干什么 | 写在哪 | 快捷键 |
|---|---|---|
| 认出文章 | Title 框 | 只打 `textarea[name="Article Title"]`；正文不要再 `#` 一遍标题 |
| 扫下一节 | 小节标题 | 行首 `##` + 空格；块后 **`assertBodyPlain()`**（禁止点 Body menuitem） |
| 读故事/论证 | 普通段 | 纯正文，不加 `#`/`##`/`-`/`>`，不要整段 ⌘B |
| 抓住短标签 | 短语 | 只选那几个词 ⌘B → 收拢选区 |
| 并列/步骤 | 列表 | `-` + 空格 或 `1.` + 空格 → Enter 退出 → **`assertBodyPlain()`** |
| 报错原话 | 引用 | `>` + 空格 → Enter 退出 → **`assertBodyPlain()`** |
| 可点 URL | 链接 | 选中锚文本 → **`[data-testid="btn-link"]`** → 对话框 URL；**禁止** ⌘K 与 `[text](url)` |
| Insert 块 | Insert | `insertMenu(pageId, itemName)` — 7 项见 § Insert 下拉菜单；IR 无则跳过；**禁止** `![]()` / markdown fence |
| 段与段 | | **一个** Enter，禁止空多行 |

**默认不用：** 删除线、改字号、emoji、整段加粗（除非 IR 写了）；媒体仅 IR `kind: 'image'` 时走 Insert。

### 插入走编辑器 Insert，禁止 markdown 冒充（永久）

IR 节点不是纯正文时，fill **必须**用工具栏真实能力，**禁止** markdown / HTML 当可见字。

| 需要 | 用法 |
|---|---|
| **链接** | 选中锚文本 → **`btn-link`** → 对话框 URL → Enter → 关 → **`assertBodyPlain`**（**禁止** ⌘K） |
| **Insert 块** | `insertMenu(pageId, itemName)` — Media / GIF / Posts / Divider / Code / LaTeX / Table；Code 后 Escape→Body→`assertBodyPlain`；menuitem 缺失 → throw 列 7 名 |
| **Emoji** | 仅 IR 时 `[data-testid="btn-emoji"]` |
| **节标题 / 列表 / 引用 / 加粗** | 读者扫读表 + marker/⌘B；块后 **`assertBodyPlain`** |

CTA URL（erdonline.com/demo、github.com/…）→ block IR **`links: [{ label, url }]`**，由 `applyLink()` 插入，**禁止**在段落 `text` 写 markdown 链接。

IR：`x-article-md-map.mjs` 解析 `docs/growth-content/*-x.md`（MD 即控制面）→ `x-article-block-ir.mjs` → `compileArticle()`（text → HTML `<p>`/`<h2>`/`<strong>`；fence → `insertPlan` `code`+`markdown`；`\|table\|` → `insertPlan` `table`；`links[]` → postPaste **`btn-link`**；Title 在 title 框）。

**开/关：** 默认 Body；命中上表才开；开完立刻关（见 § 开/关）。

---

## 空多行禁止（独立步骤 · 永久纪律）

1. **块与块之间** — `newParagraph()`（End+Enter）；**禁止** `\n\n` / 双 Enter。
2. fill 脚本正文走 **`x-article-typer.mjs`**（insertText + End+Enter）；marker 才 keyboard `type_text`；禁止整段 dump。
3. junk 空行 → **同 edit tab** `clearBody` + 重 paste — **禁止** Create 新 Article 丢 autosave。
4. 肉眼 Preview 验收（无 `--preview` flag）：杂志感、层级、无截断。

---

## 填稿步骤（编号 · copy-paste 照做）

0. **导航** — 已有 edit tab → `resolveEditPageId()` / `--pageId=`（**跳过 Create**）；否则 `https://x.com/compose/articles` — **非** Post / `compose/post`
1. **首启才点 Create** — `button[aria-label="create"]` → 等 href `…/compose/articles/edit/{id}`。已在 edit URL → **禁止再 Create**
2. **标题框（S4 · Title-first）** — **`setTitleOnce()`**：focus title textarea → 清空 → **`type_text`**（≤100 字）；**必须在 paste 之前完成**
3. **编译 + 播放（S0–S9）：**
   - `compileArticle(slug)` → `{ html, plain, insertPlan[{playOrder}], postPasteActions[{type:'link'}] }`（无 Chrome）
   - S5 `clearBody`（⌘A+Delete）→ S6 **一次** `pasteRich` → S7 `classifyPaste` → S7b bold（paste 无 strong 时 `selectPhrase`+⌘B）→ S8 links → S9 insertPlan
4. **收尾（S10）** — 始终 `auditSnapshot()`；`--audit` 使 errors fatal
5. **草稿** — X autosave；脚本不点 Save draft
6. **Publish** — **仅用户明示**；`--submit` spawn 前 **exit 1**

**Drill 备用（非生产 fill）：** `x-article-control-drills.mjs` drills 1–9 only。

---

## 禁止

| 禁止项 | 原因 |
|---|---|
| **Playwright** / `connectOverCDP` | 仓库纪律；只用 chrome-devtools MCP/CLI |
| **整篇 `.md` 贴进 Article** | `#` `**` 字面显示或字号全乱 |
| **chunk `insertText` 夹多余空行** | Preview 巨大间距；2026-08-29 早期截断帖事故 |
| **280 字 Post 发长文** | 截断；公网 `/status/` 非 `/article/` |
| **Preview 没过就 Publish** | 字号/空行/层级错误会上线 |
| **误开 `compose/post`** | 立即关闭改 Article |
| **正文重复 title 大标题** | title field 已有；正文再 `# Title` = 双标题 |

---

## 脚本：`scripts/fill-x-article-shortcuts.mjs`

**标准** X 长文填稿入口（`fill-x-article-dont-give-agent-prod-db.mjs` 已删，勿再引用）。

**存在。** 薄 CLI → `compileArticle` + `runFill()`：`resolveEditPageId()` → `attachEditor()` → S4–S10；**Never Create / Publish / Save draft**。

### 用法

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH"
node scripts/fill-x-article-shortcuts.mjs --slug=dont-give-agent-prod-db
node scripts/fill-x-article-shortcuts.mjs --slug=dont-give-agent-prod-db --compile-only
node scripts/fill-x-article-shortcuts.mjs --slug=dont-give-agent-prod-db --audit --pageId=12
# --submit → exit 1 BEFORE chrome-devtools spawn
```

### 它做什么

- S0 compile → S1 resolveEditPageId（deny gold）→ S2 attachEditor → S3 preflight → S4 title → S5 clearBody → S6 pasteRich → S7 classify → S7b bold（paste 保留 strong 则跳过 ⌘B）→ S8 links → S9 insertPlan → S10 audit
- 未知 CLI flag → exit 1
- `--submit`：**spawn 前 exit 1** — 草稿-only 默认

### 不能替代 Preview

Agent **仍须**肉眼过 Preview（杂志感、层级、无截断）。

---

## 公网验收清单

```
✓ URL 含 /article/<id>
✓ articleLen ≈ 12000+（英文长文）
✓ 关键段：Search Console、github.com/erdonline、erdonline.com/demo
✓ 无 280 字截断感
✓ Heading 层级正常（非全文 giant text）
✗ 编辑器 innerText 读回不算 — 必须公网页
```

**硬停：** captcha / account lock → STOP；误发 `/status/` 截断帖 → 勿当成功，重发 Article。

---

## 相关

- 路径卡（Post vs Article 分流）：[`platform-post-recipes.md`](platform-post-recipes.md) § X
- Agent 规则：[`.cursor/rules/growth-post-paths.mdc`](../../.cursor/rules/growth-post-paths.mdc)
- 稿件例：[`docs/growth-content/2026-08-29-seo-essay-x.md`](../growth-content/2026-08-29-seo-essay-x.md)
- 短讯 Post CLI（≤280 字；长文会 throw）：`node scripts/post-all-browser.mjs --platform x --body-file …`
