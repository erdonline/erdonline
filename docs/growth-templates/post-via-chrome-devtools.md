# chrome-devtools 发帖 Runbook（禁止 Playwright）

发 Product Hunt / HN / Reddit / X 时，**只**用 [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp/) 接管**已登录**的 Chrome。禁止 `playwright.connectOverCDP`、禁止 `@playwright/mcp`、禁止 Playwright MCP 填表。

平台特例见 [`platform-post-recipes.md`](platform-post-recipes.md)。国内平台用中文稿（掘金见 platform-post-recipes）。

---

## 一次性准备

| 项 | 要求 |
|---|---|
| Chrome | **152+**（144+ 支持 `--autoConnect`），已登录目标站 |
| Remote debugging | `chrome://inspect/#remote-debugging` → **Allow**；或 `./scripts/start-chrome-debug.sh` |
| Node | **≥ 20.19**；本机默认 v20.18.0 **不够**，必须 Node 22 |
| MCP | Cursor 加载 `.cursor/mcp.json` 的 `chrome-devtools`（包装脚本 `scripts/chrome-devtools-mcp.sh`） |
| 端口 | 首选 `--autoConnect`（读 `DevToolsActivePort`）；fallback：`CHROME_DEVTOOLS_BROWSER_URL=http://127.0.0.1:9222` + `./scripts/start-chrome-debug.sh --force-9222` |

### Node 22 PATH（脚本与 CLI 共用）

```bash
# 任选其一在 PATH 最前
export PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH"
# 或
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"

node -v   # 应 ≥ v20.19，推荐 v22.x
npx -y chrome-devtools-mcp@latest --help   # 退出 0
./scripts/chrome-devtools-mcp.sh --help      # 退出 0
```

### 验证 MCP 已连上

```bash
npx -y --package=chrome-devtools-mcp chrome-devtools list_pages
# 或 Cursor 里调 list_pages / take_snapshot
```

失败 `Could not find DevToolsActivePort` / `Could not connect to Chrome` → 先 Allow remote debugging，**不要**换 Playwright。

---

## Agent 标准流程

对每个平台：

1. `new_page` 打开 composer URL（见下表）
2. `take_snapshot` 确认登录态与 DOM
3. **平台特例**（Reddit 先切 Markdown 等，见 recipes）
4. **填表一次**（见「填表纪律」）
5. **读回校验**（见「提交前读回」）
6. **停在提交按钮前**；仅用户明确说「提交」才 `click` Publish/Submit

| 平台 | URL | 稿件 |
|---|---|---|
| Product Hunt | `https://www.producthunt.com/posts/new` | `docs/growth-content/2026-08-29-product-hunt.md` |
| Hacker News | `https://news.ycombinator.com/submit` | `docs/growth-content/2026-08-29-hacker-news.md` |
| Reddit | `https://www.reddit.com/r/<sub>/submit/?type=TEXT` | `docs/growth-content/2026-08-29-reddit.md` |
| X | `https://x.com/compose/post` | 各稿 `X/Twitter Sync` 段 |

### CLI 入口（同样走 chrome-devtools，不是 Playwright）

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH"

# 只填表，不点提交（默认）
node scripts/post-all-browser.mjs --platform hackernews \
  --title "Show HN: ERD Online – Open-source database design with MCP for AI agents" \
  --url https://www.erdonline.com \
  --body-file docs/growth-content/2026-08-29-hacker-news.md

node scripts/post-all-browser.mjs --platform reddit \
  --subreddit cursor \
  --title "[OSS] ERD Online – Let Cursor read/write your database schema via MCP" \
  --body-file docs/growth-content/2026-08-29-reddit.md

# 用户确认读回无误后
node scripts/post-all-browser.mjs ... --submit
```

---

## 填表纪律（2026-08-29 踩坑总结）

### 1. 禁止依赖 chrome-devtools 的 `fill()` 填长正文

MCP `fill` / Playwright `fill` 对长文本会**丢字符**、吞换行。必须用 **native value setter + `input`/`change` 事件**，且 **保留 `\n`**。

`scripts/post-all-browser.mjs` 内 `FILL_FORM` 已采用此模式（`HTMLTextAreaElement.prototype` / `HTMLInputElement.prototype` 的 `value` descriptor）。

对 **contenteditable**（Reddit Fancy Pants、部分富文本）：`execCommand('insertText')` 仍可能丢段落；**Reddit 应切 Markdown 后写 `<textarea>`**（见 recipes）。不要对 Reddit 正文用 `innerText` / `textContent` 赋值。

### 2. 只填一次

**重复调用填表脚本会把正文粘贴两遍**（2026-08-29 r/cursor 真实事故）。流程：

- 填前 snapshot 确认字段为空
- 填一次
- 读回；若重复或乱码 → **清空再填一次**，不要叠加

### 3. 提交前读回（必做）

用 `evaluate_script` 读回字段，断言后再 `--submit`：

```javascript
() => {
  const ta = document.querySelector('textarea[name="text"], textarea');
  const body = ta?.value ?? document.querySelector('[contenteditable="true"]')?.innerText ?? '';
  const newlines = (body.match(/\n/g) || []).length;
  const dupHint = body.length > 0 && body.slice(0, Math.floor(body.length / 2)) === body.slice(Math.floor(body.length / 2));
  return {
    href: location.href,
    bodyLen: body.length,
    newlineCount: newlines,
    possibleDuplicate: dupHint,
    bodyPreview: body.slice(0, 120),
  };
}
```

| 检查项 | 通过标准 |
|---|---|
| 换行数 | 与源 `.md` 段落数大致一致（`newlineCount` 不应为 0 若源有多段） |
| 无重复 | `possibleDuplicate === false`；肉眼 snapshot 正文不连读两遍 |
| Markdown | Reddit 不应出现整段 literal `**` / `` ` `` 当纯文本（说明还在 Fancy Pants） |
| URL | PH 网站字段勿重复 `https://` 前缀 |

---

## MCP 与 daemon

```bash
# 包装脚本（Cursor MCP 用）
./scripts/chrome-devtools-mcp.sh   # 内部: --autoConnect --no-usage-statistics

# CLI daemon（post-all-browser.mjs 会 ensureDaemon）
npx -y --package=chrome-devtools-mcp chrome-devtools start \
  --autoConnect --no-usage-statistics --no-headless
```

Fallback 9222：

```bash
# 须先关闭所有 Chrome 窗口
./scripts/start-chrome-debug.sh --force-9222
export CHROME_DEVTOOLS_BROWSER_URL=http://127.0.0.1:9222
```

---

## 故障排除

| 现象 | 处理 |
|---|---|
| `DevToolsActivePort` / 连不上 Chrome | `chrome://inspect/#remote-debugging` → Allow；或 `./scripts/start-chrome-debug.sh` |
| MCP 无 `chrome-devtools` 工具 | 重载 MCP；确认 Node 22 在包装脚本 PATH 里 |
| 填表后 React 不认 | 确认用了 native setter + `input`/`change`，不是只改 `.value` |
| 正文乱码 / 无换行 / 重复 | 见 [`platform-post-recipes.md`](platform-post-recipes.md)；不要 `--submit` |
| HN 提交后跳转 `showlim` | 新号 Show HN 限流，**勿重试**；换有 karma 的账号 |
| Reddit「unusual activity」/ 账号锁定 / 要求 reset password | **硬停**；禁止 Agent 自动 reset；跳过所有 reddit.com 直到用户确认已登录 |

---

## Reddit 安全纪律（2026-08-29 lockout）

自动化填表若 **rapid 多次 `evaluate_script`、重复 assign、post-then-delete 重发**，Reddit 会锁号并要求 reset password。

| 必须 | 禁止 |
|---|---|
| 每个 sub **一次**、**人工节奏**提交 | rapid re-fill、duplicate assign、删帖后立即重发 |
| 锁定 / password-reset 墙出现 → **立即停止** | Agent 自动走密码重置 |
| 用户说已 reset 并登录前 → **跳过 reddit.com** | 锁定后继续尝试填表或提交 |

编辑器与 Showcase 放置见 [`platform-post-recipes.md`](platform-post-recipes.md#reddit)（Markdown 模式、Weekly Showcase 评论、fill-once、读回换行）。

---

## 相关文件

- 平台步骤：`docs/growth-templates/platform-post-recipes.md`
- 执行清单：`docs/growth-templates/execution-checklist.md`
- 脚本：`scripts/post-all-browser.mjs`、`scripts/chrome-devtools-mcp.sh`、`scripts/start-chrome-debug.sh`
- 当日记录：`docs/growth-data/YYYY-MM-DD.md`
