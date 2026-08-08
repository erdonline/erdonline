# Good-first Issue 草稿

正式 GitHub 仓就绪后，用仓库根目录脚本一键投放（保持开放 **3–8** 个）：

```bash
REPO=owner/repo ./scripts/seed-good-first-issues.sh
# dry-run（只打印将创建的标题）
DRY_RUN=1 REPO=owner/repo ./scripts/seed-good-first-issues.sh
```

每个 `NN-*.md` 首行必须是 `# 标题`，正文即 Issue body。  
标签默认：`good first issue`。

## 跳过规则

草稿正文以 `> **已合入**` 开头的引用块标记为已完成时，脚本会 `SKIP (done)`，不会投放。  
正文其它处出现「已合入」字样**不会**跳过。

## 当前待投放（未标已合入）

| 草稿 | 主题 |
|------|------|
| `40-share-cta-prominence.md` | 分享页 fork/登录 CTA 更显眼 + testid |
| `41-github-social-preview-1280.md` | GitHub social-preview 1280×640 静态图 |
| `42-landing-footer-contributor-cta.md` | 落地页页脚 Star / good-first 链 |
| `43-roadmap-community-vote-q3.md` | 社区路线图投票帖（`roadmap` 标签，非 good-first） |

`01`–`39` 已标合入。正式仓投放：`REPO=erdonline/erdonline ./scripts/seed-good-first-issues.sh`（`43` 需 `LABELS=roadmap` 单独创建）。

合入后在对应草稿顶部加：

```markdown
> **已合入**（勿再投放）：一句话说明。
```

并与 `docs/community.md` 种子池同步。
