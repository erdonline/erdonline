---
title: CI 里用 REST 拉 projectJSON 做 schema lint：不必把流水线绑死在 MCP
slug: ci-rest-projectjson-schema-lint
status: ready
platforms: [juejin, csdn, oschina, weixin, zhihu, segmentfault]
cta: mcp
utm_campaign: mcp-agent
created: 2026-08-28
guide: docs/data-format.md
---

## 开场：GitHub runner 上没有 Cursor

上一篇把 Cursor 接到 MCP，是为了让人和 Agent **读同一张图**。今晚换一条更土、也更稳的路：**CI 用 REST 把 projectJSON 拉下来，跑仓库里现成的 schema lint。** MCP 是给对话用的旁路进程，GitHub Actions 的 Ubuntu runner 上没有 Cursor，也不该在流水线里起一个 stdio Agent。

写给谁：你已经有一个可登录的 ERD 项目（自托管或 [www.erdonline.com](https://www.erdonline.com/)），愿意把「模型还像不像合法 projectJSON」写进 PR 门禁。官方 Demo 是只读分享，**铸不了 PAT**，分享链接也不是 API 密钥。

不做的事：一句话生成 ER 图、ChatSQL、把真实 PAT 提交进 git、让 Agent 在 CI 里静默 `put_project_json` 覆盖工作区。

## 为什么不是「再装一个 MCP」

MCP 适合本地：铸造 PAT → 把 `npx -y --package` 的 `mcp.json` 粘进 Cursor → 对 Agent 说「列出我的项目」。不必 clone。那条路径的逐步说明仍在文档页：[用 MCP 让 Cursor / Claude 读取 ER 图]({{DOC:guide/api-and-mcp}})。

CI 要的是另一件事：

1. **可重复**：每次 push / 定时任务打同一条 HTTP，不依赖本机 Cursor 是否开着。
2. **最小权限**：只要 `projects:read`。不必给流水线 `versions:write`。
3. **同一份事实源**：公开 API 返回的 `projectJson` 已经清掉 `profile.dbs`（连接密钥不进 JSON）。人和校验脚本看到的结构和设计器里那份一致，只是密钥被拿掉了。

格式承诺见 [projectJSON 数据格式]({{DOC:data-format}})。机器可校验的定义在仓库 [`schema/projectjson.schema.json`]({{GH:schema/projectjson.schema.json}})；本地命令是 `node scripts/validate-projectjson.mjs`。

## 今晚三件可见的结果

1. 用只读 PAT 调 `GET /api/v1/me`，确认 200，而不是会话 JWT。
2. `GET /api/v1/projects/{id}` 抽出 `data.projectJson`，落成一个 JSON 文件。
3. 对这个文件跑 `node scripts/validate-projectjson.mjs`，合法退出 0，坏文件非零。

## 第一步：只读 PAT，放进 CI Secret

登录后打开 **账户设置 → 访问令牌**：<https://www.erdonline.com/account/settings?selectKey=personalAccessTokens>

铸造时默认 `projects:read` / `versions:read` 就够今晚的 lint。明文以 `erd_pat_` 开头，**只显示一次**。把它放进 GitHub Actions 的 Repository secret，例如 `ERD_PAT`，不要写进 workflow YAML，不要写进 `mcp.json` 再提交。

会话里的 JWT **不能**调 `/api/v1/**`。分享链接能看图、调 API 却 401：两套 token，别混用。

自检：

```bash
export ERD_API_URL=https://erdonline-production.up.railway.app
export ERD_PAT=erd_pat_…   # 只在本机 shell，勿入库

curl -fsS -H "Authorization: Bearer $ERD_PAT" \
  "$ERD_API_URL/api/v1/me"
```

成功时 JSON 里有 `username` 和 `scopes`。自托管把 `ERD_API_URL` 换成 `http://127.0.0.1:9502`。

## 第二步：拉 projectJSON，不要整段响应当模型

列表：

```bash
curl -fsS -H "Authorization: Bearer $ERD_PAT" \
  "$ERD_API_URL/api/v1/projects?page=1&size=20"
```

记下要守门的项目 `id`。详情接口的包装是 `{ "code": 200, "data": { "id", "projectName", "projectJson": { … } } }`。校验脚本吃的是 **内层模型**，不是整段 `R`：

```bash
curl -fsS -H "Authorization: Bearer $ERD_PAT" \
  "$ERD_API_URL/api/v1/projects/$ERD_PROJECT_ID" \
  | jq '.data.projectJson' > /tmp/ci-project.json

node scripts/validate-projectjson.mjs /tmp/ci-project.json
```

无参跑 `node scripts/validate-projectjson.mjs` 会校验仓库自带的正例和负例：demo 必须过，`invalid.projectjson.json` 必须失败。先 clone [ERD Online]({{REPO}}) 再跑这条，第一次会在 `schema/` 下装 `ajv@8`。

通过只表示 JSON **形状**合法。外键指向是否存在、业务上该不该加那张表，仍由设计器里的版本 diff 和人来判。这是文档里写明的边界，不是脚本漏检。CI 守的是「还能被设计器读进去」，不是替你做建模。

## 第三步：GitHub Actions 里定时或跟 PR 跑

下面这份只读、不写库。`ERD_PAT` 用 secret；项目 id 用 variable 即可。

```yaml
name: lint-erd-projectjson
on:
  workflow_dispatch:
  schedule:
    - cron: "17 2 * * *"
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Fetch projectJSON
        env:
          ERD_API_URL: https://erdonline-production.up.railway.app
          ERD_PAT: ${{ secrets.ERD_PAT }}
          ERD_PROJECT_ID: ${{ vars.ERD_PROJECT_ID }}
        run: |
          curl -fsS -H "Authorization: Bearer $ERD_PAT" \
            "$ERD_API_URL/api/v1/projects/$ERD_PROJECT_ID" \
            | jq '.data.projectJson' > ci-project.json
      - run: node scripts/validate-projectjson.mjs ci-project.json
```

限流默认约 60 次/分钟/token。定时一天一次足够。403：scope 不够或你不是该项目成员。401：secret 填错、过期、或打到了错误环境。

想对比「上一版」而不是只 lint 当前工作区：用 `GET /api/v1/projects/{id}/versions/{versionId}`，同样取 `data.projectJson`。写版本仍走 `versions:write` + 人在设计器里看 diff；**不要**为了让 CI 变绿就在 runner 里 `PUT …/projectJSON`。

{{CTA}}

## 收尾：MCP 是期权，REST 才是门禁

今晚如果三步都通了，你验证的不是「AI 会画图」，而是：**同一份可审计的 JSON，既能给 Cursor 读，也能给 curl + ajv 守门。** 对话客户端用 MCP；流水线用 REST。人还是版本的主人。

铸造 PAT、复制配置、工具清单仍以文档页为准（文末主链接，带尾斜杠）。schema 字段含义以 [data-format]({{DOC:data-format}}) 为准。

#CI #projectJSON #数据库设计 #ER图 #GitHubActions
