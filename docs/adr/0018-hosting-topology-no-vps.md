# ADR-0018：托管拓扑 — GitHub + Cloudflare 免费档，不买生产 VPS

- 状态：已接受（2026-08-02）
- 决策者：项目维护者

## 背景

开源项目需要可发现的文档站、可拉取的容器镜像，以及（可选）静态前端 demo。  
维护者明确约束：**不购买生产 VPS**；正式业务数据不由项目方托管；公网 demo API（如 Render）另步实施。

## 决策

| 表面 | 宿主 | 说明 |
|---|---|---|
| 文档站（Docusaurus） | **Cloudflare Pages** 主发（项目 `erdonline-docs`） | 免费档；`main` 经 Actions + Wrangler 部署 |
| 文档站回退 | **GitHub Pages** | 同一 `docs-site.yml` 继续部署；无 CF secrets 时仅 GH |
| 前端静态 demo | **Cloudflare Pages**（项目 `erdonline-demo`） | `yarn build:prod` + `env-config.js`；API 可空 |
| 运行时镜像 | **GHCR** | `ghcr.io/erdonline/erdonline-backend` / `…-frontend`；tag 发版推送 |
| 自托管数据面 | **用户自有机器** | `docker compose` 拉镜像；项目方不托管生产库 |

明确不做（本 ADR）：

- 不为文档/demo 购买 VPS
- 本切片不部署 Render（或其它）公网后端（后续独立步骤）
- 不把用户 projectJSON / 凭证落在项目方免费托管上当作「官方生产」

## 后果

- 正面：零固定服务器成本；文档与静态站可对外；自托管者有可复现镜像路径。
- 代价：完整在线试用依赖后续 demo API；CF / GH 免费额度与域名需维护 secrets。
- 风险：空 `DEMO_API_URL` 时静态站仅展示落地/引导，API 旅程不可用——须在文档写清，避免「坏掉的 demo」预期。
- 与既有 ADR：不推翻 ADR-0003（Docusaurus）；宿主从「仅 GH Pages」扩展为「CF 主 + GH 回退」。
