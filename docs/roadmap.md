# 路线图 / Roadmap

> 公开路线图。欢迎通过 [Issues](https://github.com/erdonline/erdonline/issues) 与 [Discussions](https://github.com/erdonline/erdonline/discussions) 影响它。
> 状态标记：✅ 已完成 · 🚧 进行中 · 📋 已规划

## 当前状态

工程与设计器为**可用雏形**：核心旅程可跑；数据源已按 ADR-0008 隔离。联调基线：`./scripts/audit-fe-apis.sh`。

**下一阶段战略（服务北极星，不推翻愿景）**：P4 文档站已齐；Issue 草稿待投放 27–28（2 条）；正式仓就绪后 `REPO=… ./scripts/seed-good-first-issues.sh`；AI / i18n 后置。

## 阶段总览

| 阶段 | 目标 | 关键交付 | 状态 |
|---|---|---|---|
| 第 0 轮：验证基建 | 一切迭代的前提 | 全栈一键起；Playwright 核心旅程冒烟进 CI | ✅ 2026-08-01 |
| 第 1 轮：交互急救包 + P0 安全 | 现有页面不闹心；让别人敢用 | ~~静默失败补反馈~~✅；~~undo/redo 接线~~✅；~~删除确认~~✅(代码)；~~CORS/CSRF 收敛~~✅；~~硬编码密码清除~~✅(prod fail-fast)；~~/oauth/token 500→401~~✅；~~关系图入口~~✅；~~fastjson→Jackson~~✅(第 2 轮完成)；~~create_time 填充~~✅；~~卡片死链~~✅；~~dev 回路提速~~✅ | ✅ |
| 第 2 轮：质量基线 | 让贡献者敢改 | ~~Boot 3.5.16 + JDK 17 + JWT~~✅；~~删死代码~~✅；~~fastjson→Jackson~~✅；~~核心单测≥50%+Jacoco~~✅；~~CI coverage/lint:js:ci~~✅；~~版本快照零摩擦~~✅ | ✅ |
| 第 3-6 轮：ReactFlow 画布 | 设计器现代化 | ~~R0~~✅ → ~~R1~~✅ → ~~R2~~✅ → ~~R3~~✅（画布 + 导出去 G6） | ✅ 闭环 |
| 第 3 轮：版本时光机 | 抬升「每周有版本保存」 | ~~快照零摩擦~~✅；~~版本 diff 可视化~~✅；~~工单/审批打磨~~✅ | ✅ 2026-08-01 |
| P2：体验深水区 | 让用户爱用 | ~~首页示例项目 30s 激活~~✅；~~自动保存状态可见~~✅；~~开源不限项目数~~✅；~~项目空态引导 + 新建表单减负~~✅；~~缩短建表链路~~✅；~~加载骨架统一~~✅；~~暗色延期（ADR-0010）~~✅；~~清 MUI/Blueprint→antd~~✅；~~连线后改字段名跟边~~✅；~~性能预算 / 视口裁剪~~✅；~~eslint 热路径 console / 存量 log 清零~~✅（其余 warn→P4）；~~核心接口连通~~✅；~~数据源隔离（ADR-0008）~~✅ | ✅ |
| P3：功能深度 | 比竞品强 | ~~版本 diff 可视化~~✅（第 3 轮）；~~协作 presence+光标+增量 sync（ADR-0009）~~✅；~~远端同步冲突提示~~✅；~~只读分享链接~~✅（ADR-0007）；~~反向解析 + P0 四库字典 FK~~✅（ADR-0006；~~复合 fields[] 延期 ADR-0011~~✅）；AI📋；i18n📋 | 🚧 |
| P3a：获客与传播 | 陌生人能试用并产生版本 | ~~在线 demo（`/demo`→`/s/public-demo`）~~✅；~~分享页 → fork + autofork~~✅；~~注册转化（redirect 闭环）~~✅；~~双周发版笔记~~✅ | ✅ |
| P4：社区与生态 | 让项目长大 | ~~文档站骨架 / Pages / 本地搜索~~✅；~~good-first-issue 运营清单（`docs/community.md` + Issue 模板）~~✅；~~Issue 草稿 + `seed-good-first-issues.sh`~~✅；正式 GitHub 仓就绪后投放 3–8 个标签 Issue📋；发版节奏固化✅ | 🚧 |

## 完整用户旅程（我们关注用户的每一步）

首次接触（落地页/README）→ 试用（在线 demo）→ 注册登录 → 新手激活（示例项目）→ 日常创作（设计器）→ 团队协作（邀请/权限/通知）→ 分享传播（只读链接/导出）→ 留存回访（动态/What's New）→ 自部署运维（升级/备份）→ 社区共建。

每个阶段的断点都有对应阶段承接，详见各阶段交付物。

## 版本政策

- 语义化版本（semver）；破坏性变更提前一个 minor 版本公告，并附迁移指南
- 数据库 schema 变更一律走 Flyway 迁移脚本，自部署用户可平滑升级
- 每双周一个 release，发布笔记附改动前后对比

## 如何影响路线图

- 提需求：开 Issue 并说明它服务哪类用户价值（见 [vision.md](./vision.md)）
- 参与讨论：Discussions 区回复路线图帖
- 直接贡献：认领 `good first issue`，阅读仓库根目录 [CONTRIBUTING.md](https://github.com/erdonline/erdonline/blob/main/CONTRIBUTING.md)
