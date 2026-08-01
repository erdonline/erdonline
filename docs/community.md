# 社区与新手任务

> 目标：让第一次提 PR 的人 **2 小时内能合入** 有意义的改动，抬升贡献者留存（愿景第三层用户价值）。

## 标签约定

| 标签 | 含义 |
|---|---|
| `good first issue` | 范围清晰、本地可验证、无需深架构上下文 |
| `help wanted` | 欢迎外部认领，可稍大 |
| `docs` / `frontend` / `backend` | 域 |
| `area:designer` / `area:share` / `area:reverse` | 子域（可选） |

Issue 标题建议：`[good first] <一句话结果>`。正文必含：**背景 / 接受标准 / 验证命令 / 相关文件**。

## 维护者运营节奏（双周）

- [ ] 扫一遍打开 Issue，给合格项打上 `good first issue`（保持 **3–8** 个开放）
- [ ] 正式仓就绪后：`REPO=owner/name ./scripts/seed-good-first-issues.sh`（草稿在 `.github/ISSUE_DRAFTS/`）
- [ ] 合并后立刻关 Issue，并在 PR 描述链回 Issue
- [ ] 双周发版笔记里点名合入的新手 PR（`docs/releases/`）
- [ ] 文档站「社区」页与本清单同步（改本文件即可）

## 什么样的任务适合 good first

- 改文案、补 aria-label / `data-testid`、修死链、补单测断言
- 清一处明确 eslint warn（附文件路径）
- 补 E2E 单条旅程（现有 helpers 可复用）
- 文档示例可复制命令

**不适合**：改 Security/OAuth、改 projectJSON 主结构、画布协议大改、无复现步骤的模糊 UX。

## 种子任务池（可直接开 Issue）

下列为当前仓库已知低风险债，开 Issue 时复制「接受标准」即可：

1. ~~**文档站相对链接**~~（仓库根路径已改绝对 GitHub URL；`docs/` 内 `./` 同目录链路由 `onBrokenLinks=throw` 门禁）
2. ~~**登录/注册页副标题去 ChatGPT 噱头**~~（已合入；回归见 `smoke.spec.ts`）
3. ~~**`presence.spec` 清理项目**~~（已合入 `deleteOwnPersonProjects`）
4. ~~**协作 sync toast E2E**~~（已合入 `sync-toast.spec.ts`；info 路径）
5. ~~**前端 eslint warn 定点清零（configJsonSlice）**~~（已合入；其它 store 文件仍可认领）
6. ~~**`databaseDomainsSlice` eslint warn 清零**~~（已合入）
7. ~~**协作 sync warning toast E2E**~~（已合入 `sync-toast.spec.ts`）
8. ~~**后端创建项目默认 projectJSON**~~（已合入 `ensureDefaultProjectJson` + 单测）
9. ~~**去掉开源版「升级至尊」CTA**~~（已合入；`dialog/upgrade` 已删）
10. ~~**`exportSlice` eslint warn 清零**~~（已合入）
11. ~~**`profileSlice` eslint warn 清零**~~（已合入）
12. ~~**`dataTypeDomainsSlice` eslint warn 清零**~~（已合入）
13. ~~**设计器顶栏 Gitee star 链更新**~~（已合入 → GitHub `erdonline/erdonline`）
14. ~~**社交登录已删路径 E2E**~~（已合入 `dead-auth-routes.spec.ts`）
15. ~~**页脚/ChatSQL 去「零代科技」商业文案**~~（已合入；页脚 `ERD Online · MIT`）
16. ~~**`entitiesSlice` eslint 清零**~~（已合入；warn=0）
17. ~~**设计器「项目」菜单接线**~~（已合入；数据源设置可开）

## 贡献者怎么认领

1. 在 Issue 下留言「我来做」
2. Fork → `feat/...` 分支 → PR 勾选模板
3. 按 Issue 验证命令在描述里贴结果摘要

详见 [CONTRIBUTING.md](https://github.com/erdonline/erdonline/blob/main/CONTRIBUTING.md)。
