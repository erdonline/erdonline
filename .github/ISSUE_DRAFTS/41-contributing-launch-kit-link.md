# [good first] CONTRIBUTING 增加 LAUNCH.md 推广物料入口

## 背景

仓库根目录已有 `LAUNCH.md`（Show HN / Reddit 等即发文案），但贡献指南未指向它，维护者与大使找不到统一推广入口。

## 接受标准

- [ ] `CONTRIBUTING.md`「社区」或文末增加指向 `./LAUNCH.md` 的一节（说明：推广文案维护在此，Issue/PR 仍走 GitHub）
- [ ] `docs/community.md` 维护者节奏清单增加「推广物料：`LAUNCH.md`」勾选项
- [ ] 链接在 GitHub 渲染可点（相对路径 `./LAUNCH.md`）

## 验证命令

```bash
test -f LAUNCH.md && grep -q 'LAUNCH.md' CONTRIBUTING.md docs/community.md
```

## 相关文件

- `CONTRIBUTING.md`
- `docs/community.md`
