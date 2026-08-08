# [good first] 文档补充 GitHub Social Preview 上传指引

## 背景

分享链接到 X/Slack/Discord 时，GitHub 默认预览图不够吸引人。Settings → Social preview 需 1280×640 图，但部署文档未写清步骤与推荐素材来源。

## 接受标准

- [ ] `docs/deployment.md` 或 `LAUNCH.md` 增加「Social Preview」小节：尺寸 1280×640、推荐用落地页 hero 截图、Settings 路径
- [ ] 若仓库有 `docs/images/`，可注明候选图路径（不要求实际上传 PNG 进仓）
- [ ] 链接可达，无死链

## 验证命令

```bash
grep -q 'Social [Pp]review' docs/deployment.md LAUNCH.md
```

## 相关文件

- `docs/deployment.md`
- `LAUNCH.md`
