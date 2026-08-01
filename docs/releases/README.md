# 双周发版笔记

面向使用者的变更摘要，与 `CHANGELOG.md`（工程向）互补。

## 节奏

每两周（或发 tag 前）生成一篇：`docs/releases/YYYY-MM-DD.md`。

```bash
# 预览
./scripts/cut-release-notes.sh --dry-run

# 写入（日期默认今天；已存在则拒绝覆盖）
./scripts/cut-release-notes.sh
./scripts/cut-release-notes.sh 2026-08-16
```

生成后请人工改写「本周期你能感知到的变化」为 3–7 条用户语言，再随 release / Discussions 公告。

## 与 semver

打 tag 时再把 `CHANGELOG` 里对应 Unreleased 收成版本号；发版笔记文件名用发布日即可，不必与版本号一致。
