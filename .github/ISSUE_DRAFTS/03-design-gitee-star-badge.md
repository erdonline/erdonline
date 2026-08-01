# [good first] 设计器顶栏 star 徽章指向更新

## 背景

设计器顶栏仍链到旧 Gitee `MARTIN-88/erd-online`，与开源主仓/文档叙事不一致，新用户点开易迷失。

## 接受标准

- [ ] 顶栏 star/仓库链改为文档站或正式 GitHub 仓（以 `docs/community.md` / README 权威链接为准）
- [ ] 无「升级至尊」类商业 CTA 回潮

## 验证命令

```bash
# 打开任意项目设计器，顶栏徽章/链接指向正确
cd frontend && npx playwright test tests/e2e/presence.spec.ts --project=chromium
```

## 相关文件

`frontend/src/layouts/DesignLayout/index.tsx`
