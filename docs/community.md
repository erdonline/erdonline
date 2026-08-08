# 社区与新手任务

> 目标：让第一次提 PR 的人 **2 小时内能合入** 有意义的改动，抬升贡献者留存（愿景第三层用户价值）。

## 社区入口

产品面统一指向 [GitHub Issues](https://github.com/erdonline/erdonline/issues)（提问、想法、路线图反馈）。维护者请确保仓库 **Issues 对公众开放**（Settings → Features → Issues）。

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

### Issue 草稿投放规则

- 源文件：`.github/ISSUE_DRAFTS/NN-*.md`（见同目录 `README.md`）
- **跳过**：正文以 `> **已合入**` 开头的引用块（仅行首匹配；正文其它「已合入」字样不跳过）
- **目标**：正式仓始终保持 **3–8** 个开放的 `good first issue`
- Dry-run：`DRY_RUN=1 REPO=owner/name ./scripts/seed-good-first-issues.sh`

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
18. ~~**`projectJsonSlice` eslint warn 清零**~~（已合入；草稿 `06` 已标完成）
19. ~~**`useProjectStore` eslint warn 清零**~~（已合入；草稿 `07` 已标完成）
20. ~~**`modulesSlice` eslint warn 清零**~~（已合入；`src/store/project` eslint warn=0）
21. ~~**项目菜单「版本」入口**~~（已合入：跳转版本管理 + E2E）
22. ~~**默认项设置保存反馈**~~（已合入 E2E「设置成功」；草稿 `10`）
23. ~~**版本管理页骨架**~~（已合入；`loading.spec.ts`）
24. ~~**模型树删表二次确认 E2E**~~（已合入 `smoke` 取消/确认）
25. ~~**导入/导出开弹窗关下拉遮罩**~~（已合入）
26. ~~**删除确认主按钮改「删除」**~~（已合入；E2E `/删\s*除/`）
27. ~~**侧栏与项目菜单「版本」叙事对齐**~~（已合入）
28. ~~**导出 DDL 向导按钮 aria-label**~~（已合入）
29. ~~**ISSUE_DRAFTS README 与投放清单**~~（已合入；seed 仅认行首 `> **已合入**`）
30. ~~**版本排序页 eslint**~~（已合入）
31. ~~**canvasHistory 去 any**~~（已合入）
32. ~~**关系图边热区**~~（已合入 `interactionWidth=24`）
33. ~~**导出 DDL 第二步 E2E**~~（已合入；ExportDDL 对齐 ADR-0008）
34. ~~**community seed 规则说明**~~（已合入本文「投放规则」）
35. ~~**PK 徽标切换 E2E**~~（已合入 `relation.spec`「PK」）
36. ~~**表头改名 E2E**~~（已合入 `relation.spec`「改名」）
37. ~~**版本管理页 eslint**~~（已合入）
38. ~~**ExportDDL 剩余 eslint**~~（已合入）
39. ~~**PageSkeleton aria-busy**~~（已合入）
40. ~~**json2code 入口类型收窄**~~（已合入）
41. ~~**share.spec 清理更稳**~~（已合入）
42. ~~**canvasHistory 单测**~~（已合入 `yarn test:unit:canvas-history`）
43. ~~**项目菜单关闭态 CSS class**~~（已合入 `erd-project-menu--closed`）
44. ~~**version/approval goto 抽 helpers**~~（已合入；回滚同步落库）
45. ~~**CHANGELOG Unreleased 整理**~~（已合入：按日 `### YYYY-MM-DD` + 文首维护约定；草稿 `32`）
46. ~~**控件矩阵 🚧 行**~~（P2b 矩阵 🚧=0；余 📋 延期不拆阻断 Issue）
47. ~~**画布「删除字段」可访问按钮**~~（已合入；`relation.spec`「删除字段」；草稿 `33`）
48. ~~**ReactFlow Controls 中文 aria**~~（已合入；`ZhControls` + `relation.spec`「Controls」；草稿 `34`）
49. ~~**ReactFlow MiniMap 中文 aria**~~（已合入；`ariaLabel="画布缩略图"` + `relation.spec`「MiniMap」；草稿 `35`）
50. ~~**画布工具栏撤销/重做/排布/对齐 aria**~~（已合入；`relation.spec`「工具栏」；草稿 `36`）
51. ~~**顶栏 SaveStatus aria-live**~~（已合入；`role="status"` + `aria-live="polite"`；`relation.spec`「save-status」；草稿 `37`）
52. ~~**顶栏 CollabPresence aria-live**~~（已合入；`role="status"` + `aria-live="polite"`；`presence.spec`；草稿 `38`）
53. ~~**命令面板 listbox 语义**~~（已合入；`role="listbox"` + 空态 `aria-live`；`relation.spec`「命令面板」；草稿 `39`）
54. ~~**`lint:js:ci` 分享页 Array 类型 + DataDomain hooks**~~（已合入；`yarn lint:js:ci` 0 error；`share.spec`）
55. ~~**编辑版本号校验失败仍关弹窗**~~（已合入；`RenameVersion` `onFinish` 失败返回 false；`version.spec`「重命名」）

> 种子池（2026-08-08 推广切片）：开放 good-first 草稿 `40`–`42`；路线图社区票 `43`。历史合入项见下方列表。

## 种子任务池（可直接开 Issue）

下列为当前仓库已知低风险债，开 Issue 时复制「接受标准」即可：

**待投放（good first · 草稿 40–42）**

1. **分享页转化 CTA**（`40-share-cta-prominence.md`）：fork/login testid + 窄屏可见 + 失败 toast E2E
2. **GitHub social-preview 1280×640**（`41-github-social-preview-1280.md`）：静态预览图 + 文档说明
3. **落地页页脚贡献者 CTA**（`42-landing-footer-contributor-cta.md`）：Star / good-first 外链 + landing E2E

**社区投票（非 good-first · 草稿 43）**：`43-roadmap-community-vote-q3.md` → 标签 `roadmap`

> 上表 `#1`–`#55` 为历史已合入条目，见本文件上文列表。

## 贡献者怎么认领

1. 在 Issue 下留言「我来做」
2. Fork → `feat/...` 分支 → PR 勾选模板
3. 按 Issue 验证命令在描述里贴结果摘要

详见 [CONTRIBUTING.md](https://github.com/erdonline/erdonline/blob/main/CONTRIBUTING.md)。
