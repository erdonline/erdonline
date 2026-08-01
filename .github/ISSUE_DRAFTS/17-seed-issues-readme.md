# [good first] 更新 ISSUE_DRAFTS README 与投放清单

## 背景

01–15 多数已合入；`README.md` / `docs/community.md` 需标明「仅未标已合入的编号会投放」，并列出当前待投放文件。

## 接受标准

- [ ] `.github/ISSUE_DRAFTS/README.md` 写明跳过 `**已合入**` 草稿
- [ ] 列出当前待投放文件名
- [ ] `DRY_RUN=1 REPO=example/x ./scripts/seed-good-first-issues.sh` 打印条数与 README 一致

## 验证命令

```bash
DRY_RUN=1 REPO=example/erdonline ./scripts/seed-good-first-issues.sh
```

## 相关文件

- `.github/ISSUE_DRAFTS/README.md`
- `docs/community.md`
- `scripts/seed-good-first-issues.sh`
