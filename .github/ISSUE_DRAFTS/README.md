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

| 文件 | 标题摘要 |
|---|---|
| `20-edge-hit-area.md` | 关系图边热区 / 文档说明 |
| `21-export-ddl-step2-e2e.md` | 导出 DDL 第二步 E2E |
| （共 2 条；建议再补 1–6 条后投放以落在 3–8） |

合入后在对应草稿顶部加：

```markdown
> **已合入**（勿再投放）：一句话说明。
```

并与 `docs/community.md` 种子池同步。
