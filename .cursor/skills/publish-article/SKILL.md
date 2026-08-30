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
# node scripts/fill-x-article-shortcuts.mjs --slug=dont-give-agent-prod-db [--audit] [--compile-only]
# 见下方「已验证路径（X Article 草稿）」— 默认草稿-only，--submit 硬 block

# PH / HN / Reddit / X 短讯 Post（≤280 字；长文走 Article，脚本会 throw）
node scripts/post-all-browser.mjs --platform <name> --title "..." --body-file ... [--submit]
```

填稿前先判 **ADR-0035** 适配器类：**A** MD 一次填入 / **B** WYSIWYG 逐块 / **C** API / **D** import。**禁止跨类混用**。

### HARD RULE — X 长文（B 类 WYSIWYG）

> **长文 = Article only；Post composer 发长文 = 失败。**

**运行时硬停：** `assert-x-article-composer.mjs` — 长文走 Post composer 会 throw；`compose/post` 上 fill 会 throw；未 `attachToEditEditor()`（含复用 tab 的 `markCreateClicked`）就打字会 throw。

**后续每一次 `/publish-article` X 长文都必须遵守（永久，非一次性提醒）：**

### HARD RULE — 已验证路径（X Article 草稿 · 2026-08-30）

### Gold standard（只读样板 · 2026-08-30）

**写法对照稿：** `https://x.com/compose/articles/edit/2093880046998130688` · 标题 **X样式学习贴** · 用户手工 · **agent 禁止改写**。

| 类型 | 样板计数 | 做法 | Job1 长文 |
|---|---:|---|---|
| Title | 1 | `textarea[name="Article Title"]` | pack.title |
| 加粗/斜体/删线 | 各 1 | ⌘B / ⌘I / ⌘⇧X | 仅 IR `markPhrases` ⌘B |
| Subheading | 1×H2 | `##`+space | 各节 `##` |
| Quote | 1×BLOCKQUOTE | `>`+space / ⌘⇧9 | 可选 0–1 |
| UL / OL | 各 1 | `-` / `1.` 或 ⌘⇧7/8 | IR 列表块 |
| Link | 1 | `btn-link` | IR `links[]` |
| Code | 4×`markdown-code-block` | Insert→Code→**Search programming language**→**SQL**→**Add code here**→overlay **Insert** | **1** ERROR 行 · language **SQL** |
| Table | 1×4×4 | Insert→Table | **1** 3 列对照 |
| Media / GIF | 各 1 | Insert 菜单 | Job1 **0**（无真图） |
| Divider | 0 | — | Job1 **0** |

**Drill / fill：** 对照此稿学控件；**练习与 Job1 fill 用其它 edit tab**（末尾 sandbox），勿动 `2093880046998130688`。详见 playbook § Gold standard 写法图。

**续编 Job1 草稿例：** `…/edit/2093874865606709248` — `resolveEditPageId()` 复用，勿 Create。

1. **复用 edit URL** — Chrome 已有 `compose/articles/edit/{id}` → `resolveEditPageId()` 或 `--pageId=` → `attachToEditEditor()`。**重试禁止点 Create**（会开新稿丢 autosave）。
2. **首启才 Create** — 仅 hub 空白且无 edit tab：`compose/articles` → **`button[aria-label="create"]`** → 等 href 变 `…/edit/{id}`。
3. **Never** `compose/post`。
4. **Title-first（S4）** — `setTitleOnce()`：focus `textarea[name="Article Title"]` → 清空 → **`type_text`**；空则 CLI 侧重试一次；非空 mismatch → throw。
5. **编译 payload（S0 · 无 Chrome）** — `compileArticle(slug)` → `{ title, html, plain, insertPlan[{playOrder}], postPasteActions[{type:'link'}], meta.markPhrases }`；bold 先进 HTML `<strong>`；paste 保留 strong 则不再 ⌘B，剥掉则 S7b `selectPhrase`+⌘B 一次；`--compile-only` / `--dump-payload=`。
6. **正文播放（S5–S9）** — `runFill()`：`clearBody`（⌘A+Delete）→ **一次** `pasteRich` → `classifyPaste` → S7b bold（仅 strongCount=0）→ links postPaste → insertPlan 按 playOrder；weak/empty 全量 replay 一次。
7. **对象走 Insert plan** — Code = fiber **MARKDOWN**（`probeDraftJs` → `insertCodeAtomic`；失败才 overlay Insert→SQL）；Table = Insert → **Edit block** → markdown → overlay **Update** → Escape → `resetToBodyPlain()`。语言搜不到且非 `plaintext` → throw（仅 overlay fallback）。
8. **Preflight（S3）** — `preflightArticleEditor()`：`compose/articles/edit/{id}` + 非 `compose/post`；**禁止 Publish / Save draft / Create**；gold draft `2093880046998130688` 在 `resolveEditPageId` + `attachEditor` 硬拒。
9. **收尾审计（S10 · 读路径）** — 始终 `auditSnapshot()` 一次；`--audit` 使 errors fatal（exit 1）；默认 warnings + exit 0。
10. **Job1 IR** — 1 code（`ERROR: column…` · `language: 'SQL'`）+ 1 table（catalog vs contract）；0 media；见 `x-article-block-ir.mjs`。
11. **草稿-only** — X autosave；**禁止 Publish**（除非用户明确说「正式发布 / Publish」）；`--submit` → **spawn 前 exit 1**。
12. **入口** — `node scripts/fill-x-article-shortcuts.mjs --slug=<slug>`（可加 `--audit` / `--compile-only`；**不加** `--submit` / `--preview`）。

### 按读者扫读选格式

X Article 读者先看到 **Title 栏**，再扫正文。**哪块该用什么快捷键，看读者要干什么** — 方便扫读，不是给每块叠遍所有键。

| 读者要干什么 | 写在哪 | 快捷键 |
|---|---|---|
| 认出文章 | Title 框 | 只打 `textarea[name="Article Title"]`；正文不要再 `#` 一遍标题 |
| 扫下一节 | 小节标题 | 行首 `##` + 空格；一节一个；块后 **`assertBodyPlain()`**（⌘⇧,，禁止点 Body menuitem） |
| 读故事/论证 | 普通段 | 纯正文，不加 `#`/`##`/`-`/`>`，不要整段 ⌘B |
| 抓住短标签 | 短语 | 只选那几个词 ⌘B → 收拢选区 |
| 并列/步骤 | 列表 | `-` + 空格 或 `1.` + 空格 → Enter 退出 → **`assertBodyPlain()`** |
| 报错原话 | 引用 | `>` + 空格 → Enter 退出 → **`assertBodyPlain()`** |
| 可点 URL | 链接 | 选中锚文本 → **`[data-testid="btn-link"]`** → 对话框 URL；**禁止** ⌘K（全局跳 /explore）与 `[text](url)` |
| 配图 / 代码 / 分隔等 | Insert | 见下表 **Insert 菜单（7 项冻结）**；无 IR 则跳过；**禁止** `![]()` / markdown fence |
| 段与段 | | **`newParagraph()`**（End+Enter），禁止空多行 |

**默认不用：** 删除线、改字号、emoji、整段加粗（除非稿 IR 明确写了）；媒体仅 IR `kind: 'image'` 时走 Insert。

**禁止：** 把 markdown `**`、`##` 当可见字打进去；对每块按遍所有快捷键。

### HARD RULE — 编译 payload 再播放（禁止逐块 observe 当默认 fill）

**写路径 = compile-once / batch-emit；感知只做收尾 QA，不是 typer。**

| 阶段 | 模块 | 动作 |
|---|---|---|
| **源稿（控制面）** | `docs/growth-content/*-x.md` | Markdown 即控制面：`##` / fenced code / `\|table\|` / `**bold**` / `[text](url)` — **禁止**压成 prose 再猜回 widgets |
| **MD → IR** | `x-article-md-map.mjs` | 解析 MD tokens → block IR（fence → `code`+`markdown`；table → `table`） |
| **编译（无 Chrome）** | `x-article-compile.mjs` | IR → `{ title, html, plain, insertPlan[{playOrder}], postPasteActions[{type:'link'}] }` |
| **播放** | `x-article-play.mjs` | `runFill()`：S4 title → S5 clearBody → S6 pasteRich → S8 links → S9 insertPlan |
| **审计** | `x-article-audit.mjs` | S10 `auditSnapshot()` 一次；`--audit` 使 errors fatal |
| **Drill 专用** | `x-article-control-drills.mjs` | 逐 primitive；**禁止** import compile/play |

**禁止：** 生产 fill 每块 `assertPerceiveAfterEmitBlock`；把用户当 DOM 传感器等 perceive 结果再改。

**仍 HARD STOP：** CDP 垃圾前缀；`--audit` 失败；preflight 非 edit URL / gold draft。

**实现：** `fill-x-article-shortcuts.mjs` → `compileArticle` + `runFill`；`x-article-audit.mjs` 供 classify/audit。

### HARD RULE — 工具栏开/关状态机（填每段正文前断言全关 + Body）

X Article 工具栏按钮是 **toggle**（蓝 `rgb(29,155,240)` / `aria-pressed=true` = ON）。Agent **只会开、不会关** 时，引用/列表/加粗会污染后续整篇。**不要等用户指出某个 toggle 再修** — fill 路径必须自带完整状态机。

**填每段 `kind: 'body'` 正文前**，以及 **heading / quote / ul / ol 块结束后**，调用 `assertBodyPlain(pageId)`：

1. `btn-blockquote`、`btn-ul`、`btn-ol`、`btn-bold`、`btn-italic`、`btn-strikethrough` 全部 **OFF**（非蓝、非 pressed）
2. Style 下拉可见文案 = **Body**（或 Enter 新段后已是 Body）
3. 任一仍 ON → **同 chord 再按**关掉（⌘⇧9/7/8、⌘B 等）→ 仍大字则 **⌘⇧,** → **禁止打字**直到 `ok`

| Control | 键盘 | 纪律 |
|---|---|---|
| Bold / Italic / Strike | ⌘B / ⌘I / ⌘⇧X | 短 span ⌘B 后立刻 `assertBodyPlain`；strike **默认永不 ON** |
| Style | in-text `#` / `##`；关 = Enter + **⌘⇧,** | `##`+space 后 Enter → `assertBodyPlain`；**禁止**点 Style menuitem |
| Blockquote | `>`+space / ⌘⇧9 | Job1 仅 **1** 个 error quote；`>` 后 Enter → ⌘⇧9 关 |
| UL / OL | `-`/⌘⇧7、 `1.`/⌘⇧8 | 列表块后 Enter → toggle chord 关 |
| Link | **`btn-link` only** | 对话框填 URL → Enter → Escape → `assertBodyPlain`；**禁止** ⌘K（全局跳 /explore）与 `[text](url)` 字面量 |
| Insert | **`insertMenu()` 族** | Code / Table / Media / Divider 等 — 见下表；块后 **`assertBodyPlain()`**；禁止 markdown fence 冒充 |

**读者扫读映射不变：** Title → `textarea[name="Article Title"]`；节 → `##`+space；故事 → 纯正文；报错 → 单块 quote；并列 → ul/ol；短标签 → ⌘B；URL → `btn-link`；块间 **一次** Enter。

**Insert 菜单（7 项 · 对象专用）：** 样式走快捷键；**Code / Table / Media / Divider** 走 `button[aria-label="Add Media"]` → 冻结 menuitem → 填 widget → Escape → **`assertBodyPlain()`**。Job1：**1 code + 1 table**；无稿内真图则 **0 media**；禁止连续 Insert 块。

**实现：** `fill-x-article-shortcuts.mjs` → `setTitleOnce()` + `resetToBodyPlain()`；Insert IR → `x-article-insert-menu.mjs`；bold 在 compile HTML，paste 剥 strong 时 S7b `applyPostPasteBold`（⌘B），links 在 S8 `applyLinkChord`。

### HARD RULE — 插入走编辑器 Insert，禁止 markdown 冒充

IR 节点**不是**纯正文时，必须用编辑器**真实插入能力**，**禁止**把 markdown / HTML 当可见字打进 `[contenteditable="true"]`。

| 需要 | 用法 |
|---|---|
| **链接** | 选中锚文本 → **`btn-link`** → 对话框填 URL → Enter → Escape → **`assertBodyPlain`**；**禁止** ⌘K 与 `[text](url)` |
| **Insert 块** | **`insertMenu()` 族** — Media / Code / Table / Divider 等；填完 Escape → **`assertBodyPlain`**；禁止 markdown fence |
| **节标题 / 列表 / 引用 / 加粗** | in-text marker + 官方 chord；块结束后 **`assertBodyPlain`**（纯键盘关） |

Job1 pack 里 CTA / erd.cloud / github 等 URL → IR **`links: [{ label, url }]`**，由 `applyLink()` 走 **`btn-link`**（**禁止** ⌘K），**禁止**在 `text` 里写 markdown 链接语法。

**任何** insert 对话框关闭后：**`assertBodyPlain`**（toggle 全 OFF + Style **Body**）再打下一段。

### HARD RULE — Title-first（S4 · edit URL 后、正文前）

1. **`requireArticleEditEditor`** — href 必须是 `compose/articles/edit/<id>`
2. **`setTitleOnce(pageId, pack.title)`** — 一次 type_text；CLI `runFill` 空则重试一次；非空 mismatch → throw
3. **`clearBody`** — ⌘A+Delete 清正文（S5）
4. **`pasteRich`** — 一次 rich paste（S6）

**实现：** `x-article-typer.mjs` + `x-article-play.mjs`；`fill-x-article-shortcuts.mjs` 薄 CLI。

### HARD RULE — 开/关（默认 Body；命中才开；开完立刻关）

Agent **只会开、不会关** — 打了 `##`、进了列表/引用、⌘B 加粗后，下一段会继承 Subheading/列表/加粗，整篇变标题墙。**特殊样式是临时的，默认永远是 Body。**

| 刚做完什么 | 下一句正文前必须 |
|---|---|
| 任意 special block 或 inline mark | **`assertBodyPlain()`** — 全 toggle OFF + Style **Body** |
| 节标题 `##` + 空格 | Enter → `assertBodyPlain()` |
| 列表 `-` / `1.` 或 ⌘⇧7/8 | Enter 退出 → `assertBodyPlain()`（含 `btn-ul`/`btn-ol` OFF） |
| 引用 `>` + 空格 | Enter 退出 → `assertBodyPlain()`（含 `btn-blockquote` OFF） |
| 短语 ⌘B / ⌘I / btn-link | 收拢选区 → `assertBodyPlain()` |

### HARD RULE — 编辑器内只用快捷键（Create 是唯一点击）

**进入 edit URL 后禁止靠点击元素切样式。** 唯一允许点击：`button[aria-label="create"]` 进入 `/compose/articles/edit/{id}`。

| 格式 | 键盘路径 |
|---|---|
| Heading / Subheading | 行首 in-text `#` / `##` + space |
| Body 关 | Enter 新段 → 仍大字则 **⌘⇧,** 缩小至 Body（**禁止**点 Style menuitem Body） |
| Quote / 列表 关 | Enter 退出 → 仍 ON 则同 chord 再按（⌘⇧9 / ⌘⇧7 / ⌘⇧8） |
| Bold / Italic / Strike / Link | ⌘B / ⌘I / ⌘⇧X / `btn-link` |
| Dropdown 误开 | **Escape**（键，非点击） |
| Insert 块 | **`insertMenu()` 族** — Job1：`ERROR:` → **Code**；catalog vs contract → **Table**；有稿内真图才 **Media** |

**`assertBodyPlain`：** Escape 关 Dropdown → toggle chord 关 mark → ⌘⇧, 至 Body → **不点** testid / menuitem。

**纪律：** 默认 Body、无 mark；只有读者扫读命中时才开；**开完立刻 `assertBodyPlain()`**。禁止只开会关。

**IR：** 绝大多数 block 是 `kind: 'body'`、无 marks；仅真实节名才是 `subheading`；hook 报错是 `quote`；已试过的/步骤是 `ul`/`ol`；全文 **2–5 个**短 `markPhrases` 做 ⌘B，其余纯正文。

- **禁止空多行：** paste 后 block 结构由 HTML 决定；junk → **同 edit tab** `clearBody` + replay paste，勿 Create 新稿
- **Drill 正文：** `insertTextAtCaret` / `typeSlow` — **仅** `x-article-control-drills.mjs`；生产 fill **禁止**
- **入口：** 有 edit tab → `resolveEditPageId()`；**Never Create**
- **Fill 入口：** `fill-x-article-shortcuts.mjs` only

| 禁止 | 必须 |
|---|---|
| 裸 `type_text` 灌整篇正文 / 逐块 emit + 每块 perceive | `compileArticle` → **一次** `pasteRich` + insertPlan 按 playOrder |
| `fill-x-article-dont-give-agent-prod-db.mjs`（已删） | `fill-x-article-shortcuts.mjs` + compile/play 模块 |
| chrome-devtools 裸 dump 无 compile payload | `x-article-compile.mjs` 离线复用 + `x-article-play.mjs` |
| `setNative` / `.value=` / `.innerText=` 写正文 | **`typeTitle()` type_text** + 一次 rich paste（typer fallback） |
| 重试再点 Create / 默认 `--submit` Publish | **复用 edit URL**；草稿-only，`--submit` 硬 block |
| 生产 fill 逐块 `assertPerceiveAfterEmitBlock` | 默认无 perceive；`--audit` 收尾一次 |

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
