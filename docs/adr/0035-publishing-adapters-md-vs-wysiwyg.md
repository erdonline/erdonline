# ADR-0035：发布适配器 — Markdown 一次填入 vs 原生编辑器逐块

- 状态：**已接受**（2026-08-29）
- 相关：[platform-post-recipes](https://github.com/erdonline/erdonline/blob/main/docs/growth-templates/platform-post-recipes.md)（路径卡 · 单一真相源）、[x-article-playbook](https://github.com/erdonline/erdonline/blob/main/docs/growth-templates/x-article-playbook.md)（WYSIWYG 逐块**范本**）、[growth-post-paths](https://github.com/erdonline/erdonline/blob/main/.cursor/rules/growth-post-paths.mdc)

## 背景

同一篇精品稿（例 `docs/growth-content/2026-08-29-seo-essay.{en,zh}.md`）要发到 13 个平台，2026-08-29 一天内把四类失败都踩了一遍：

| 失败 | 平台 | 根因 |
|---|---|---|
| md 字面量 `**` / 空行被吞 / duplicate | Reddit Fancy Pants | 往富文本 contenteditable 灌 Markdown 源码 |
| 编辑器有字、**公网空** | 开源中国（`pre.textContent`） | 写了 DOM 但没触发编辑器状态机，提交时取的是内部 model |
| 编辑器有字、**公网仅标签** | 知乎专栏（Draft.js `beforeinput` paste） | 同上；Draft.js 的 EditorState 不认 DOM 涂改 |
| 全文字号异常 | X Article | 整篇当 Heading 灌进去，未按 block 映射 |
| 长文 save error | Medium（`type_text` 手填） | 逐字打字触发过多自动保存，超出编辑器承受 |

**成功的只有两种形态：**

- **一次 native setter 写进真正的 Markdown 输入框**（Dev.to `#article_body_markdown`、Hashnode Markdown tab、掘金、CSDN `editor.csdn.net/md`、OSChina swap→可见 `textarea`）
- **按 block 走平台原生编辑能力 + Preview**（X Article：行首 marker `# ` `## ` `- ` `1. ` `> ` + 官方快捷键 10 键 + Insert 菜单；Preview 过了才 Publish）

X Article 那套「逐段录入、细节可控」之所以好，**不是因为逐段本身好**，而是因为它是**唯一能让富文本编辑器自己产生正确内部状态**的办法。反过来，对已经提供 Markdown 输入框的平台改用逐段，是把一次可验证的写入拆成几十次可失败的交互——**是倒退**。

## 决策

**按编辑器能力选适配器，不是按心情。** 发帖前先判定平台属于哪一类，然后照该类的唯一填法执行；不允许跨类混用。

| 适配器 | 判定条件 | 填法 | 验收 |
|---|---|---|---|
| **A · MD 一次填入** | 存在真正的 Markdown 源码输入框（`textarea` / 可切 Markdown 模式） | 序列化 md → **native value setter + `input`/`change`，只填一次**；保留 `\n` | 公网 URL 正文 |
| **B · WYSIWYG 逐块** | 无 Markdown 模式，但有**块级**富文本能力（行首 marker / 快捷键 / 工具栏） | **block IR 逐块**录入，走平台原生快捷键与工具栏；段间 Enter **一次** | **Preview 必过** → 公网 URL 正文 |
| **C · API 持久化** | DOM 不可靠（Draft.js 类），但存在会**真正落库**的草稿 API | block IR → **该 API 要求的 HTML**，PATCH 写入 → reload 编辑器 → 点更新/发布 | 公网 URL 正文 |
| **D · 官方 import** | 平台提供从已发布 URL 导入的官方通道 | **优先 import**，失败才降级到 B/C | 公网 URL 正文 |

**硬规则：**

- **A 类禁止逐段。** 有 md 框还去模仿 X 逐块 = 慢且易错，直接否决。
- **B 类禁止整篇 paste。** 把 `.md` 灌进富文本 → `#` `**` 字面量或字号全乱。
- **C 类禁止只涂 contenteditable。** 「编辑器读回有字」不是证据；只有会落库的通道算数。**公网持久化是最高优先级**——知乎的可靠通道是 draft PATCH，那么「逐段」这件事就应该发生在**生成结构化 HTML 的那一步**，而不是假装 Draft.js 和 X 一样可控。
- **任何类都以公网正文为唯一验收。** 编辑器读回一律不算。

## 共享中间表示（block IR）

四类适配器消费**同一份** IR，从精品 md 解析一次得来：

```
heading · subheading · paragraph · quote · list(ordered|bulleted) · code · divider · table · link(inline)
```

各适配器的消费方式：

| IR 节点 | A（md） | B（X Article） | C（知乎 HTML） |
|---|---|---|---|
| heading / subheading | `# ` / `## ` | 新 block 行首 `# ` / `## ` | `<h2>` |
| paragraph | 原文 | 新 block 无 marker（必要时 ⌘⇧, 降到 Body） | `<p>` |
| quote | `> ` | `> ` 或 ⌘⇧9 | `<blockquote><p>` |
| list | `- ` / `1. ` | `- ` / `1. ` 或 ⌘⇧7 / ⌘⇧8；填完 **Enter 两次**退出 | `<ul>` / `<ol>` |
| code | ``` 围栏 | **Insert → Code** | `<pre><code>` |
| divider | `---` | **Insert → Divider**（勿连按 Enter 造空行） | `<hr>` |
| table | md 表格 | **Insert → Table** | `<table>` |
| link | `[](…)` | 选中 → ⌘K（**不要**裸 md 语法） | `<a href>` |

**现状：** X 的 IR 是**手工**的（`fill-x-article-shortcuts.mjs` 里按段落语义硬编码映射，绑定 `2026-08-29-seo-essay-x.md`）；知乎的 IR 是**局部**的（`zhihu-patch-draft.mjs` 里内联的 md→HTML 逐行映射）。两者已经在事实上做同一件事，只是各写了一遍。

## 各平台归类（冻结）

| 平台 | 适配器 | 关键落点 |
|---|---|---|
| Dev.to | **A** | `#article_body_markdown` |
| Hashnode | **A** | 草稿页 **Markdown** tab |
| 掘金 | **A** | Markdown 编辑器 |
| CSDN | **A** | `editor.csdn.net/md`（`pre.textContent` + `input`；**非** 富文本） |
| 开源中国 | **A** | swap → **确定切换** → **可见 `textarea`** native setter（**禁** `pre.textContent`） |
| Reddit | **A**（有 Markdown 模式时） | 先点「切换到 Markdown」再填一次；**Fancy Pants 禁贴 md**。不是「每个 sub 逐块」 |
| X Article | **B** | canonical 范本；Preview 强制；公网必须 `/article/` |
| Medium | **D** → 失败降 B | `medium.com/p/import` + Hashnode live URL；**禁** `type_text` 手填长文（save error = HARD STOP） |
| 知乎专栏 | **C** | `PATCH /api/articles/<id>/draft` 写 HTML → reload edit → **更新** |
| Product Hunt | 表单（非正文类） | 字段 native setter；不适用本 ADR 的正文分类 |
| Hacker News | 表单（非正文类） | 同上 |

## 备选与否决

- **全平台统一逐段（把 X 那套推给所有人）**：用户直觉上「细节可控」，但对 A 类平台是把 1 次可验证写入变成 N 次可失败交互，且 md 平台的渲染本来就正确。**否决**——逐块是对富文本的补偿手段，不是审美偏好。
- **全平台统一 md 一次填入**：B/C 类平台已实测失败（Reddit 字面量、OSChina 公网空、知乎公网仅标签）。**否决**。
- **现在就写通用 IR parser + 重构所有发帖脚本**：本轮无发帖需求驱动，且 X / 知乎两处映射已能工作，提前抽象会在没有第三个消费者的情况下定错接口。**推迟**（见下「下一步」）。
- **靠人工判断每次怎么填**：正是 2026-08-29 五连踩的原因。**否决**。

## 后果

- 正面：发帖前的决策从「凭记忆试」变成「查平台归类表 → 照该类唯一填法」；四类失败模式各有对应的硬规则拦住；新平台接入只需回答一个问题「有没有 md 框 / 有没有块级能力 / 有没有落库 API / 有没有 import」。
- 代价：B 类和 C 类各自维护一份 IR 消费逻辑，短期有重复；A 类的「一次填入」把错误集中在一次，失败时需重填整篇（可接受——native setter 幂等）。
- 风险：平台改版可能让适配器归类失效（例：Reddit 移除 Markdown 模式、OSChina 换编辑器）。**缓解**：归类变化必须同轮更新 `platform-post-recipes.md` 路径卡（`growth-post-paths.mdc` 已有「新 selector 立刻追加」纪律）。
- 验证点：本 ADR 的四类归类已由 2026-08-29 SEO essay 8 个公网 URL 全部验证（Hashnode/Dev.to/掘金/CSDN/OSChina = A；X `/article/` = B；知乎 = C；Medium = D）；后续每次发帖以公网正文长度 + 关键段可见为断言，记入 `docs/growth-data/YYYY-MM-DD.md`。

## 下一步（≤3 条 · 有发帖需求时才做）

1. 把 `docs/growth-content/2026-08-29-seo-essay.{en,zh}.md` 解析成上表的 block IR（一个纯函数，无副作用），先只供 X 与知乎两个适配器消费。
2. `fill-x-article-shortcuts.mjs` 与 `zhihu-patch-draft.mjs` 改为消费该 IR，删掉各自内联的 md→block / md→HTML 映射（当前重复的两份）。
3. 出现**第三个** B 或 C 类平台时，才把 IR 消费层抽成共享 renderer；在此之前不抽象。
