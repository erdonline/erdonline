# 贡献指南 · Contributing

感谢你考虑为 ERD Online 做出贡献！/ Thanks for considering a contribution!

## 开发流程

1. Fork 本仓库并从 `main` 创建分支：`git checkout -b feat/your-feature`
2. 本地开发与自测（见下方「本地运行」）
3. 遵循提交规范提交代码
4. 推送分支并发起 Pull Request，填写 PR 模板

## 本地运行

见 [README](README.md#-快速开始) 的「本地开发」章节，或直接运行 `./scripts/dev.sh`。

## 分支模型

- `main`：稳定分支，始终可构建、可运行
- `feat/*`：新功能
- `fix/*`：缺陷修复
- `docs/*`：文档

## 提交规范（Conventional Commits）

提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <subject>

feat(erd): 支持从 JSON 生成表结构
fix(auth): 修复 token 刷新失败
docs(readme): 补充 Docker 部署说明
```

常用 type：`feat` · `fix` · `docs` · `refactor` · `test` · `chore` · `perf` · `style`

## 代码规范

- **后端**：遵循 Java 标准规范，4 空格缩进，类/方法保持单一职责
- **前端**：`yarn lint` 通过；组件与 hooks 命名清晰
- 提交前请确保：后端 `mvn compile` 通过，前端 `yarn build` 通过

## 报告问题

请使用 [Issue 模板](.github/ISSUE_TEMPLATE) 提交 Bug 或功能请求，附上复现步骤、环境信息与期望行为。
