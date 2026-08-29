# chrome-devtools 发帖环境

发 Product Hunt / HN / Reddit / X 及国内平台时，**只**用 [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp/) 接管**已登录** Chrome。禁止 Playwright / `connectOverCDP` / `@playwright/mcp`。

**各平台 compose URL、填目标、填法、提交按钮、公网验正文、硬停 — 一律以 [`platform-post-recipes.md`](platform-post-recipes.md) 为单一真相源。** 本文档仅覆盖环境准备与填表通用纪律；Agent 发版时打开 recipes 路径卡逐步执行，禁止 UI 探索。

## 环境准备

| 项 | 要求 |
|---|---|
| Chrome | **152+**（144+ 支持 `--autoConnect`），已登录目标站 |
| Remote debugging | `chrome://inspect/#remote-debugging` → **Allow**；或 `./scripts/start-chrome-debug.sh` |
| Node | **≥ 20.19**；本机必须 Node 22：`export PATH="$HOME/.nvm/versions/node/v22.22.0/bin:$PATH"` |
| MCP | Cursor 加载 `.cursor/mcp.json` 的 `chrome-devtools`（`scripts/chrome-devtools-mcp.sh`） |
| Daemon | `npx -y --package=chrome-devtools-mcp chrome-devtools start --autoConnect --no-usage-statistics --no-headless` |
| Fallback 9222 | `./scripts/start-chrome-debug.sh --force-9222` + `CHROME_DEVTOOLS_BROWSER_URL=http://127.0.0.1:9222` |

验证：`npx -y --package=chrome-devtools-mcp chrome-devtools list_pages` 退出 0。

## 填表通用纪律

1. **禁止** MCP `fill()` 填长正文 → native value setter + `input`/`change`；**只填一次**；**保留 `\n`**
2. 提交前读回：newlineCount ≈ 源稿、possibleDuplicate=false
3. 默认**停在提交按钮前**；用户明确说「提交」或 `--submit` 才 click
4. 提交后 **公网 URL 验正文**（见 recipes 各平台验收标准）

CLI 入口（PH/HN/Reddit/X 短讯 Post ≤280 字）：`scripts/post-all-browser.mjs` — **`--platform x` 发长文会 throw**；X 长文 Article：`scripts/fill-x-article-shortcuts.mjs`（见 [`x-article-playbook.md`](x-article-playbook.md)，**长文 = Article only；Post composer 发长文 = 失败**）；知乎补正文：`scripts/zhihu-patch-draft.mjs`。

## 故障排除

| 现象 | 处理 |
|---|---|
| `DevToolsActivePort` / 连不上 Chrome | Allow remote debugging 或 `./scripts/start-chrome-debug.sh` |
| 填表后 React 不认 | 确认 native setter + `input`/`change` |
| 正文乱码 / 无换行 / 重复 | 见 recipes 对应平台填法；不要 `--submit` |
| Reddit lock / password-reset | **硬停**；跳过 reddit.com 直到用户确认已登录 |

相关：[`platform-post-recipes.md`](platform-post-recipes.md)、[`execution-checklist.md`](execution-checklist.md)、`docs/growth-data/YYYY-MM-DD.md`
