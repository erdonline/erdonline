# 推广平台自动化方案调研（2026-08-29）

## TL;DR 推荐

| 平台 | 最佳自动化方式 | 难度 | 成本 | 需要用户提供 |
|------|---------------|------|------|-------------|
| **Reddit** | 官方 OAuth2 + PRAW / `praw` | ⭐ 低 | 免费 | client_id / client_secret / username / password |
| **Hacker News** | `meysam81/submit-hackernews` CLI / GitHub Action | ⭐ 低 | 免费 | username / password |
| **X/Twitter** | 第三方浏览器自动化：保存 cookies 后用 `xtea/auto-x` 或 `elnino-hub/x-automation` | ⭐⭐⭐ 中 | 免费（自己维护）或 $12-30/月（托管） | `auth_token` / `ct0` cookies |
| **Product Hunt** | 官方 OAuth2 申请 `write` scope，或 Apify `product-directory-submitter` | ⭐⭐ 中-高 | 免费（自己维护）或 $0.9-2.4/次（Apify） | OAuth token / 浏览器 session |
| **博客（Dev.to / Hashnode）** | 官方 API token | ⭐ 低 | 免费 | API token |

**最低成本、最稳定的组合**：先跑通 Reddit + HN 的脚本，再处理 X 和 PH。X 和 PH 都有反自动化风险，建议配合真实浏览器 session。

---

## 1. Reddit（最容易自动化）

### 官方支持

Reddit 官方提供 **OAuth2 API**，有 `submit` scope，可以发 text / link 帖。

### 工具

- **PRAW**（Python）: 最成熟
- **meysam81/reddit-scheduled-submit**: GitHub Action，也可以直接用 CLI
- **reddit-easy-post**: YAML 配置 + cron

### 获取凭据步骤

1. 登录 Reddit，访问 https://www.reddit.com/prefs/apps/
2. 点击 `create another app...`
3. 选择类型 **script**
4. 填写 name 和 redirect URI（`http://localhost:8080`）
5. 记下 `client_id`（一串 14 位字符）和 `client_secret`
6. 在仓库 secrets 里设置：
   - `REDDIT_CLIENT_ID`
   - `REDDIT_CLIENT_SECRET`
   - `REDDIT_USERNAME`
   - `REDDIT_PASSWORD`

### PRAW 示例

```python
import praw

reddit = praw.Reddit(
    client_id=os.getenv("REDDIT_CLIENT_ID"),
    client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
    username=os.getenv("REDDIT_USERNAME"),
    password=os.getenv("REDDIT_PASSWORD"),
    user_agent="script:erdonline-growth:v1.0 (by u/your_username)",
)

reddit.subreddit("cursor").submit(
    title="[OSS] ERD Online – Let Cursor read/write your database schema via MCP",
    selftext="...",
    flair_id=None,
)
```

### 注意

- 新账号 / 低 karma 会触发 captcha，无法 API 绕过
- 不要在同一 subreddit 短时间内发重复内容
- 遵守各 subreddit 规则，r/programming 对 self-promotion 有 10% 限制

---

## 2. Hacker News（有现成 CLI）

### 官方支持

HN 没有官方 write API，但表单提交基于 HTTP + CSRF token，容易模拟。

### 工具

- **`meysam81/submit-hackernews`**: Go CLI，读取表单 `fnid` 和 `fnid` 后提交
- **`higgins/action-hackernews-post`**: GitHub Action
- **`gojiplus/ycombo`**: 用 HN session cookie（`user`）提交

### 获取凭据

只需要：
- `HACKERNEWS_USERNAME`
- `HACKERNEWS_PASSWORD`

### CLI 示例

```bash
# 二进制
submit-hackernews \
  --username "$HACKERNEWS_USERNAME" \
  --password "$HACKERNEWS_PASSWORD" \
  --title "Show HN: ERD Online – Open-source database design with MCP for AI agents" \
  --url "https://www.erdonline.com"
```

### GitHub Actions 示例

```yaml
name: Post to Hacker News
on:
  workflow_dispatch:
    inputs:
      title:
        required: true
      url:
        required: true
jobs:
  post:
    runs-on: ubuntu-latest
    steps:
      - uses: meysam81/submit-hackernews@v1
        with:
          username: ${{ secrets.HACKERNEWS_USERNAME }}
          password: ${{ secrets.HACKERNEWS_PASSWORD }}
          title: ${{ github.event.inputs.title }}
          url: ${{ github.event.inputs.url }}
```

### 注意

- 刚注册的新账号可能没有 `submit` 权限（karma / 时间限制）
- HN 会触发 2FA / captcha，CLI 可能失败
- 最佳发布时间：周二-周四上午 9-11 AM PST

---

## 3. X / Twitter（最麻烦）

### 官方 API

官方 X API 已经取消免费 tier：
- Basic: $100/月
- Pro: $5,000/月

太贵，不推荐。

### 绕过方案

用浏览器自动化 + session cookies 模拟真实用户发帖：

- **`xtea/auto-x`**: Python + Patchright（Playwright 分支）+ cookies
- **`elnino-hub/x-automation`**: FastAPI + `curl_cffi` + cookies

### 获取 cookies

1. 在本地浏览器登录 X
2. 打开 DevTools → Application → Cookies
3. 复制 `auth_token` 和 `ct0`（以及 `twid`）
4. 存到 `.env` 或 secrets

### curl 示例（底层）

```bash
curl -X POST "https://x.com/i/api/graphql/.../CreateTweet" \
  -H "authorization: Bearer AAAAAAAAA..." \
  -H "x-csrf-token: $CT0" \
  -H "cookie: auth_token=$AUTH_TOKEN; ct0=$CT0" \
  -d '{"variables":{"tweet_text":"..."},...}'
```

### 托管服务（省时但花钱）

- **OpenTweet**: $11.99/月，简单 REST API
- **Zernio / letmepost**: 按条计费
- **Postiz**: 多平台，有 7 天免费 trial

### 建议

初期先用免费方案：把 cookies export 出来，用 Python + Playwright 发帖。稳定后再考虑托管。

---

## 4. Product Hunt（最复杂）

### 官方 API

Product Hunt API v2 是 GraphQL：
- 默认只读 `public` scope
- `write` scope 需发邮件到 `hello@producthunt.com` 申请
- 申请理由要合理（如：定期同步产品信息）

流程：
1. 创建 OAuth app: https://www.producthunt.com/v2/oauth/applications
2. 设置 `redirect_uri`
3. 获取 `client_id` / `client_secret`
4. 走 OAuth2 获取 `access_token`
5. 发邮件申请 `public private write` scope

### 第三方方案

- **Apify `prodmarkllc/product-directory-submitter`**: 
  - 用 AI agent 自动填表、登录、提交
  - 支持 Product Hunt, BetaList, Indie Hackers 等
  - 成本 ~$0.9-2.4/站点
  - 需要上传浏览器 session（处理 Google OAuth / Gmail 验证）

- **AutoSaaSLaunch Chrome 扩展**: 
  - 自动填充 Product Hunt 表单
  - 不自动提交，仍需你点按钮

### 建议

如果着急：用 Apify actor 一次性提交，配合浏览器 session。想长期维护：申请 Product Hunt 官方 write API。

---

## 5. 博客平台（Dev.to / Hashnode / 掘金）

### 官方 API

- **Dev.to**: https://dev.to/api/articles （需要 API key）
- **Hashnode**: GraphQL API（需要 token）
- **掘金**: 无官方 API，只能模拟登录
- **知乎**: 无官方 API

### 建议

Dev.to / Hashnode 可直接 API 发。中文社区（掘金、知乎、V2EX）需要浏览器自动化或手动。

---

## 6. 一体化工具

如果你不想自己维护脚本：

| 工具 | 支持平台 | 价格 | 特点 |
|------|---------|------|------|
| **Postiz** | X, Reddit, LinkedIn 等 28+ | 付费 | 有公开 API 和 MCP server |
| **EveryFeed** | 35+ 渠道 | 付费 | 和 Cursor/Claude 集成 |
| **welaunch.sh** | 50+ 平台 | 付费 | 9 个 AI agent 自动发布 |
| **Nova Labs** | 内容生成 | 免费/付费 | 不直接发布 |

---

## 7. 实施建议

### Phase 1（今天就能跑）

1. 收集凭据
   - Reddit: client_id / client_secret / username / password
   - HN: username / password
   - X: auth_token / ct0 cookies
2. 写 `scripts/post-reddit.py` 和 `scripts/post-hackernews.sh`
3. 用 GitHub Actions 或本地手动跑

### Phase 2（本周）

1. 申请 Product Hunt write API
2. 设置 Dev.to / Hashnode API
3. 把 X 的 cookies 导出，写 `scripts/post-x.py`

### Phase 3（长期）

1. 统一成一个 `scripts/post-all.py`，读 `docs/growth-content/*.md`
2. 配合 `growth-data.sh` 做 A/B 测试
3. 低 karma/新账号问题：先用老账号养权重

---

## 8. 风险提醒

- 所有平台都反感 spam，要控制频率
- 用新账号 API 发帖会被 captcha/限流/封号
- 不要用主邮箱/主账号测试，先建小号
- X/PH/Reddit 都可能要求 2FA，提前绑定 TOTP 而不是短信
- 登录状态可能过期，cookies 要定期更新
