# [good first] 补 GitHub 仓库 social-preview 图（1280×640）

## 背景

GitHub 仓库卡片与 Slack/社交 unfurl 使用 **1280×640** 预览图。我们已有动态 `og:image`（1200×630 PNG，`OgImageRenderer`），但 GitHub **Settings → Social preview** 仍需静态资产，否则 star/issue 外链展示偏 generic。

定位：**数据库设计的 Git + Figma**；图里应有品牌 logo、标语、示意 ER 网格（可复用 `docs/` 现有截图风格，勿 AI slop 渐变）。

## 接受标准

- [ ] 新增 `docs/images/social-preview.png`（1280×640，<500KB）
- [ ] `README.md` / `README.en-US.md` 贡献区或文档区注明：维护者将此图上传到 GitHub Social preview
- [ ] `docs/deployment.md` 或 `docs/community.md` 增加一步「上传 social preview」可复制说明
- [ ] 不破坏现有 `/og/s/{token}/image.png` 动态路由

## 验证命令

```bash
file docs/images/social-preview.png | grep -E 'PNG.*1280 x 640'
ls -lh docs/images/social-preview.png
# 可选：identify docs/images/social-preview.png  # ImageMagick
```

## 相关文件 / 目录

- `docs/images/social-preview.png`（新增）
- `docs/deployment.md` 或 `docs/community.md`
- `README.md`
