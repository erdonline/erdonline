# 增长文章流水线

> 方案全貌与选题包见 [`docs/growth.md`](../../docs/growth.md)。
> 定位纪律：CTA 永远只有一个主链接 = demo；star/repo 只放文末次要位置。

## 用法

```bash
# 1. 开新稿（从模板生成 frontmatter + 大纲骨架）
node scripts/growth/new-article.mjs --slug git-style-version-diff \
  --title "数据库表结构改崩了谁背锅？" --platforms juejin,zhihu --cta demo

# 2. 写正文（{{CTA}} / {{REPO}} / {{DOCS}} 占位符，构建时按平台注入 UTM 链接）
#    写完把 frontmatter status 改为 ready

# 3. 打包（单篇 / 全部 ready / 预览草稿）
node scripts/growth/build-package.mjs git-style-version-diff
node scripts/growth/build-package.mjs --all
node scripts/growth/build-package.mjs --all --status draft

# 4. 产物在 content/dist/<slug>/（gitignored）：
#    juejin.md / zhihu.md / wechat.md / v2ex.txt + publish-checklist.md
#    → 人工粘贴发布，按 checklist 核对
```

## 自动 vs 人工

| 环节 | 谁做 |
|---|---|
| 选题、模板、UTM 链接注入、平台包生成 | 脚本（本目录 + `scripts/growth/`） |
| PR 打 `growth-publish` 标签 → CI 出发布包 artifact | GitHub Action（`.github/workflows/growth-publish.yml`） |
| 正文写作（AI 起草 + 人改）| 半自动 |
| 粘贴发布、评论区答疑、数据回填 | **人工**（掘金/知乎/V2EX/公众号无官方发布 API，登录态自动化违反 ToS 且易碎，不做） |

## Frontmatter 规范

```yaml
---
title: 标题
slug: kebab-case            # 文件名 = slug.md；进 utm_content 归因单篇
status: draft               # draft → ready → published
platforms: [juejin, zhihu]  # juejin/zhihu/v2ex/wechat/segmentfault/oschina
cta: demo                   # demo/compare/docs/deploy/repo（见 scripts/growth/lib/utm.mjs）
utm_campaign: launch
created: 2026-08-09
---
```
