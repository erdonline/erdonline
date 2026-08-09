# ADR-0028：官方模板广场（Open VSX 模式）

- 状态：**✅ 已接受**（MVP 2026-08-09）
- 决策者：项目维护者（推翻 vision「不做广场/社交」专项解封）
- 前置：[ADR-0007](./0007-readonly-project-share.md) 分享 fork 脱敏；[ADR-0013](./0013-public-api-mcp.md) PAT scope；[ADR-0021](./0021-idp-federation-google-wechat.md) GitHub 身份

## 背景

新用户「创建项目」空态转化低；官方示例 projectJSON 藏在代码/文档里，不可浏览、不可一键安装。Figma Community 类比：浏览 → 预览 → 安装（=fork）→ 编辑 → 存版本。历史 vision 写「不做广场/社交」；维护者拍板解封 **官方 networked 模板 catalog**（非 LLM 模型市场）。

与 ADR-0007 关系：分享链接服务「只读传播」；模板广场服务「可发现 + 可安装起跑」。二者复用 `ProjectShareServiceImpl.sanitizeProjectJson` 脱敏纪律。

## 决策

| 议题 | 决策 |
|---|---|
| 形态 | **Open VSX 模式**：catalog 代码 MIT 在主仓；`ERD_CATALOG_API_URL` 可选（空 = 仅本地 Flyway/种子 offline）；不做闭源 cloud fork |
| 数据 | Flyway `catalog_template` / `catalog_rating` / `catalog_install` / `catalog_submission`；官方种子来自 `schema/examples` + `backend/.../catalog-seed/` |
| API | 浏览器 `GET/POST /catalog/v1/**`（会话 JWT）；MCP/PAT `GET/POST /api/v1/catalog/**`（读 `projects:read`，安装 `projects:write`） |
| 创建 IA | `/project/new` → `/catalog`；Home CTA、空态「从模板创建」；首 tile = 空白项目 |
| 发现面 IA | **`/catalog` 公开 CatalogLayout**（Landing 品牌壳，非 HomeLayout）；匿名浏览；安装/评分/评论须登录；维护者审核 `/catalog/review` 须登录 |
| 安装 | `POST …/install` → `initPersonProject` + fork 等价 scrubbing；tags 含 `sourceTemplateId=<id>` |
| 社交 P0 | 评分（须已安装，1 票/用户）；安装数去重；作者页 `GET …/creators/{handle}`（GitHub handle） |
| 社交 P1 | 评论（须安装+限频）、举报自动隐藏、作者开关/限制评论者、hot 排序 + 官方/社区筛选 → ✅ 2026-08-09 |
| 发布 | 项目主提交 → `pending` → 维护者（默认 `admin`）approve/reject；须绑定 GitHub（ADR-0021） |
| MCP | `list_templates` / `get_template` / `install_template` / `get_creator`；**无** `publish_template`；**无** PAT 评分/评论 |
| 明确不做 | 付费模板、LLM 生成、模板版本继承、follow/DM、Agent 自动发布 |

## 后果

- 正面：30s 惊艳入口；示例可发现；agent 可 `install_template` 起跑；自托管 offline 可用
- 代价：新表 + 审核运维；社区模板质量靠 maintainer gate；远程 catalog 合并在 `ERD_CATALOG_API_URL` 非空时再迭代
- 与 discoverability：补全「从 0 到第一个版本」漏斗，不替代分享/文档站

## 切片

| # | 交付 | 状态 |
|---|---|---|
| 0 | 本 ADR + roadmap/CHANGELOG/architecture/deployment | ✅ |
| 1 | 列表/详情 API + 种子 + `/catalog` UI | ✅ |
| 2 | install + 创建 IA 重定向 | ✅ |
| 3 | 评分/安装数/作者页 | ✅ |
| 4 | 发布队列 + 维护者审核 | ✅ |
| 5 | MCP 四工具 | ✅ |
| P1 | 评论、举报、hot tab、官方/社区筛选 | ✅ |
