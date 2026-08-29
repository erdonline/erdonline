---
title: 我们怎么设计 good first issue：让第一个 PR 两小时内合入
slug: good-first-issue-two-hours
status: ready
platforms: [juejin, csdn, oschina, zhihu]
cta: repo
utm_campaign: launch
xhs_title: good first issue 两小时合入
created: 2026-08-09
---

## 贡献者漏斗的真实瓶颈

很多项目贴 `good first issue`，新人点进去却发现：复现含糊、环境起不来、PR 晾一周——**第一个 PR 的摩擦比写代码还大**。[ERD Online](https://github.com/erdonline/erdonline) 把「两小时内合入首个 PR」当运营指标，而不只是贴标签。北极星是「每周有版本保存的活跃项目」；贡献者漏斗同样要可度量：**从 clone 到第一个绿勾 merge 的时间**。

## issue 四件套（缺一不算 good first）

1. **复现/期望**：一步截图或 curl；写清改前/改后。
2. **文件锚点**：如版本面板组件附近——减少「从哪下手」搜索（贡献者可查 GitHub 源码树）。
3. **验收标准**：对应 E2E 或 `mvn test` / `yarn test` 命令；能自动化就不写「应该没问题」。
4. **范围上限**：单 PR ≤200 行为宜；大了拆成「先补 testid / 先修文案」子 issue。

反例：「优化设计器体验」——黑洞，不是 good first。正例：「关系图画布空态 CTA 补 `data-testid=canvas-empty-cta`，并在自动化测试中断言可见」。

## CONTRIBUTING 写死入口

[贡献指南]({{GH:CONTRIBUTING.md}}) 与 [本地开发文档]({{DOC:development}}) 避免每人一套 npm 咒语：

- 后端：按开发文档用 tmux 保障进程（端口 9502）
- 前端：yarn start + HMR，勿为「生效」反复杀 8000
- MySQL/Redis：Colima + docker compose 起容器（勿 brew services 抢端口）

改 Java / yml 后按文档重启后端；改前端等 HMR。PR 描述贴「我跑了哪些验证」——维护者不用猜。定位纪律：E2E 优先 `getByRole` / `getByTestId`，禁止 `.ant-*` 碰运气。

## Review SLA

首个贡献者 48 小时没回音，大概率永久流失。纪律：

- **good first PR 目标 2 小时内 first review**（工作时段）
- 需要改则一次性列全 comment，避免「改完又来三条」
- 小 fix 过了就 merge，不为「显得严谨」拖天数

合入后立刻感谢 + 指下一个同主题 issue——让「第一个」变成「第二个」的入口，而不是一次性体验。

## 现在就能 pick

- ReactFlow 节点 aria-label / `data-testid`
- i18n 键补全、[CHANGELOG]({{GH:CHANGELOG.md}})「验证点」补全
- 文档错别字、`/compare` 对照维度更新
- 空态 / 键盘陷阱回归补强

GitHub Issues 筛 `good first issue`：

{{CTA}}

## 路线图与参与

- 文档 / 流程 / ADR：[文档站]({{DOCS}})
- Issue / PR / good first issue：[GitHub 仓库]({{REPO}})

第一个 PR 不需要完美，需要**可验证、可 review、可 merge**。提 PR 前先看仓库里 open 的 good first——我们会优先 review 带验证命令的 PR。
