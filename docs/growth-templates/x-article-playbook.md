# X Article Playbook（Premium 长文 · 可复用）

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
| **新建** | `https://x.com/compose/articles` → 左侧 **Write** / **Write Article** |
| **续编草稿** | `https://x.com/compose/articles/edit/<draftId>`（例 `…/edit/2093657683534745600`） |
| **Preview（强制）** | 编辑器内 **Preview** 链接 → `/compose/articles/edit/<draftId>/preview` |
| **Live 验收例** | https://x.com/BuilderLiang/article/2093670417458491425（2026-08-29 · SEO essay · shortcuts + Preview ✓） |

不确定入口时：从 X 左侧 **Write Article** 或 `compose/articles` 进入，**不要**从首页发帖框。

---

## 编辑器模型

X Article 是 **富文本 WYSIWYG**，**不是** Markdown 源码编辑器。

| 项 | 说明 |
|---|---|
| **Toolbar** | `#toolbar-styling-buttons`（Bold / Italic / lists / link / size dropdown）；其旁 **Insert** 按钮 → `data-testid="Dropdown"`；**Keyboard shortcuts** 按钮（`aria-label="Keyboard shortcuts"`）→ 见 § 官方快捷键 |
| **标题** | `textarea[placeholder*="title" i]` — **只填一次**；正文里**不要再做一遍大标题** |
| **正文** | `[contenteditable="true"]` — 按 **block** 打字，不是整篇 paste |
| **字号三档** | **Heading** / **Subheading** / **Body** — 正文段落默认 **Body**；若全文都是 Heading → 字号异常、像标题墙 |
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
| **何时用** | **各大 Heading 之间**作节间分隔；代替连按 Enter 造空行 |
| **何时不用** | 段内小间距（Enter 一次即可）；全文 Divider 过密 |
| **怎么点** | **Insert** → **Divider**（光标在上一节末或下一 Heading 前） |

### Code

| | |
|---|---|
| **何时用** | `curl` 命令、`_redirects`、配置片段等 SEO/工程文**正文必需**的可复制块；**不是**行内 markdown 反引号 |
| **何时不用** | 整篇文章、长 prose、可用 Body + ⌘B 强调的短语 |
| **怎么点** | **Insert** → **Code** → 在代码块内粘贴/打字 |

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

**ERD Online SEO essay 速查：** Divider（Heading 间）· Code（curl / redirects / 配置）· Table（GSC 数字）· Media（有真图才插）· GIF / LaTeX 一般跳过 · Posts（仅嵌入自己的相关帖）。

---

## 官方快捷键（Mac · 编辑器内 Keyboard shortcuts 对话框 · 1:1）

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
- 链接：选中文本 → **Insert link**（⌘ + K）→ 填 URL → Enter（勿用 markdown `[]()`）
- **Preview 强制**；长文 **Article only**，禁止 Post（见 § 何时用 Article vs Post）

---

## In-text 行首 marker（非 Keyboard shortcuts 对话框 · 单独保留）

对话框**不含**下列 marker；须在**新 block 开头**打 marker + 空格。禁止把 `# ` 糊进段中当字面量。

| 效果 | 行首 marker |
|---|---|
| **Heading** | `# ` + 标题（仅 4–8 个节名） |
| **Subheading** | `## ` + 标题 |
| Bulleted list | `- ` / `+ ` / `* `（或对话框 **Bulleted list** ⌘⇧7） |
| Numbered list | `1. ` / `2) `（或对话框 **Numbered list** ⌘⇧8） |
| Quote block | `> ` / `>> `（或对话框 **Quote block** ⌘⇧9） |
| **Body（默认）** | 新 block **无 marker** |

**Block 纪律：**

- stats hook / 金句 → `> ` blockquote block
- 清单 → ⌘⇧7/8 或 marker；填完 list 后 **Enter 两次** 退出 list 再继续 Body
- 段间 **Enter 一次**；`\n{3,}`（triple newline）**禁止** — Preview 会出现巨大空行
- URL 文本 → 选中 → ⌘K，不要裸 paste `https://…` 指望自动 link

---

## 填稿步骤（编号 · copy-paste 照做）

1. **开 Article composer**（`compose/articles` 或 `compose/articles/edit/<id>`）— **非** Post / `compose/post`
2. **标题框**填 `## X title` 段内容（例：`Average position 1. Zero clicks…`）
3. **按块插入正文：**
   - 新段、无 marker → **Body**（开篇 stats hook 可用 `> ` quote block）
   - 大节名 → 新 block 行首 `# ` → Heading
   - 小节名 → 新 block 行首 `## ` → Subheading
   - 数据钩子 / 金句 → `> `
   - 清单 → `- ` 或 ⌘⇧7；编号步骤 → `1. ` 或 ⌘⇧8
4. **选词加粗 / 链接：** 选中短语 → ⌘B；URL → ⌘K
5. **字号不对：** 选中段落 → **⌘⇧,** 重复直到 **Body**（全文 Heading = 失败态）
6. **段间只 Enter 一次**；禁止 chunk `insertText` 夹 `\n\n\n`
7. **Preview 强制** — 点 Preview → 检查：
   - 字号像杂志（Heading 少、Body 为主）
   - 无巨大空行（triple `\n` ≤ 2）；Heading 间优先 **Insert → Divider**，勿靠连按 Enter
   - Heading 层级可见（H1 节 + H2 小节）
   - **Insert 块真渲染**：Divider 为横线、Code 为代码块、Table 为表格 — 非字面量
   - 关键段可见（例：Search Console、github.com/erdonline）
   - **不过就改，禁止直接 Publish**
8. **Publish** → 对话框再点 **Publish** → 打开公网 URL 验正文：
   - URL **必须**含 `/article/`，不是 `/status/`
   - articleLen ≈ 12000+（英文 SEO essay 量级）
   - 含预期关键词 / 链接

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

**存在。** 用 chrome-devtools CLI 在已打开的 Article 编辑器里**模拟官方快捷键 + 行首 marker** 填 block，比裸 `insertText` dump 可靠。

### 何时调用

- 同一篇 SEO essay **已验证过的 block 结构**需要复填（续编草稿、误清编辑器后重填）
- 人手填太长、但 block 映射规则已在脚本里写死（当前绑定 `2026-08-29-seo-essay-x.md`）

### 用法

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH"
# 填稿（默认打开 EDIT_URL 草稿）
node scripts/fill-x-article-shortcuts.mjs
# 指定已开 page
node scripts/fill-x-article-shortcuts.mjs --pageId=12
# 填完跑 Preview 断言（不过则 exit 1）
node scripts/fill-x-article-shortcuts.mjs --preview
# Preview 通过才 Publish（不过禁止提交）
node scripts/fill-x-article-shortcuts.mjs --preview --submit
```

### 它做什么

- 读 `docs/growth-content/2026-08-29-seo-essay-x.md` 的 `## X body` 段，按段落语义 emit：
  - `# ` / `## ` Heading / Subheading
  - `> ` quote（开篇 stats、金句）
  - ⌘⇧7/8 列表
  - ⌘B / ⌘⇧X / ⌘K 加粗、删除线、链接
  - 每 Body 段前 **⌘⇧,** 降至 Body
- `--preview`：点 Preview，断言 `spacingOk`（triple `\n` ≤ 2）、articleLen > 8000、含 Search Console + github
- `--submit`：仅 Preview 通过才 double-click Publish

### 不能替代 Preview

脚本 `--preview` 是**自动化辅助**，Agent **仍须**肉眼过 Preview（杂志感、层级、无截断）。新稿 block 映射未写进脚本前 → **手工按本文 § 填稿步骤** 填，不要硬跑旧脚本。

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
- 短讯 Post CLI：`node scripts/post-all-browser.mjs --platform x --body-file …`
