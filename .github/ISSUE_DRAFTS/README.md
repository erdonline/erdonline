# Good-first Issue 草稿

正式 GitHub 仓就绪后，用仓库根目录脚本一键投放（保持开放 **3–8** 个）：

```bash
REPO=owner/repo ./scripts/seed-good-first-issues.sh
# dry-run（只打印将创建的标题）
DRY_RUN=1 REPO=owner/repo ./scripts/seed-good-first-issues.sh
```

每个 `*.md`（除本 README）首行必须是 `# 标题`，正文即 Issue body。  
标签默认：`good first issue`；可用 frontmatter 覆盖（见脚本注释）。

草稿与 `docs/community.md` 种子池同步；合入后把对应草稿标为已完成或删除。
