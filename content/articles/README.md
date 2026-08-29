# 增长文章流水线

> **公开发布**以 chrome-devtools 路径卡为准，见 [publish-article skill](../../.cursor/skills/publish-article/SKILL.md)；该 skill 不走 Wechatsync 草稿同步。
> 方案全貌与选题包见 [`docs/growth.md`](../../docs/growth.md)。
> 定位纪律：CTA 永远只有一个主链接 = demo；star/repo 只放文末次要位置。

## 用法

```bash
# 1. 开新稿（从模板生成 frontmatter + 大纲骨架）
node scripts/growth/new-article.mjs --slug git-style-version-diff \
  --title "数据库表结构改崩了谁背锅？" --platforms juejin,zhihu --cta demo

# 2. 写正文（{{CTA}} / {{REPO}} / {{DOCS}} 占位符，构建时按平台注入 UTM 链接）
#    写作纪律：禁止读者打不开的仓库内相对路径（docs/foo.md、frontend/...、./backend/...）
#    外链只用 {{DOC:}} / {{GH:}} / {{GH_TREE:}} / {{DOCS}} / {{REPO}} / {{CTA}}
#    {{DOCS}}/{{REPO}} 必须用 Markdown 链接或独立列表行，禁止同一句塞两个裸 URL
#    写完把 frontmatter status 改为 ready

# 3. 打包（单篇 / 全部 ready / 预览草稿）
node scripts/growth/build-package.mjs git-style-version-diff
node scripts/growth/build-package.mjs --all
node scripts/growth/build-package.mjs --all --status draft

# 4. 产物在 content/dist/<slug>/（gitignored）：
#    juejin.md / zhihu.md / wechat.md / v2ex.txt + publish-checklist.md

# 5. （可选）Wechatsync 推到各平台草稿箱 — 见 docs/growth.md
cd scripts/growth && npm install   # 一次性
node scripts/growth/sync-wechatsync.mjs git-style-version-diff --dry-run
# export WECHATSYNC_TOKEN=... && node scripts/growth/sync-wechatsync.mjs git-style-version-diff

# 6. V2EX 仍人工帖 v2ex.txt；草稿箱核对后点发布；评论区答疑与数据回填
```

## 自动 vs 人工

| 环节 | 谁做 |
|---|---|
| 选题、模板、UTM 链接注入、平台包生成 | 脚本（本目录 + `scripts/growth/`） |
| PR 打 `growth-publish` 标签 → CI 出发布包 artifact | GitHub Action（`.github/workflows/growth-publish.yml`） |
| 正文写作（AI 起草 + 人改）| 半自动 |
| 掘金/知乎/思否/开源中国/公众号 → **草稿箱** | **Wechatsync**（`sync-wechatsync.mjs` + Chrome 扩展，本机 Token） |
| V2EX 发帖、草稿箱点发布、评论区答疑、数据回填 | **人工** |

## Frontmatter 规范

```yaml
---
title: 标题
slug: kebab-case            # 文件名 = slug.md；进 utm_content 归因单篇
status: draft               # draft → ready → published
platforms: [juejin, csdn, oschina, zhihu]  # 仅列 growth-data 有公网 permalink 的 chrome-devtools 路径卡平台
cta: demo                   # demo/compare/docs/mcp/deploy/repo（见 scripts/growth/lib/utm.mjs）
utm_campaign: launch
guide: docs/guide/save-version-and-diff.md   # 可选：蒸馏到文档站 How-to（不整篇搬营销稿）
created: 2026-08-09
---
```

**platforms = 有公网 permalink 的 chrome-devtools 路径卡平台。** 以 `docs/growth-data/` + `platform-post-recipes.md` Live URL 为准；旧稿 frontmatter 若含不在 proven 集的平台名，新稿勿抄。

长文进平台；可复用的「怎么做」写进 `docs/guide/`，并在 [`docs/growth.md`](../../docs/growth.md) 选题表「指南页」列登记。索引见文档站 Blog。
