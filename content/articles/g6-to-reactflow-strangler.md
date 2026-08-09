---
title: 从 G6 到 ReactFlow：画布 Strangler 迁移实录
slug: g6-to-reactflow-strangler
status: ready
platforms: [juejin, csdn, oschina, xiaohongshu, weixin, zhihu, segmentfault]
cta: repo
utm_campaign: launch
xhs_title: G6 → ReactFlow Strangler 实录
created: 2026-08-09
---

## 为什么没搞「大爆炸重写」

[ERD Online](https://github.com/erdonline/erdonline) 设计器画布曾基于 AntV G6。G6 能跑，但 React 组合式 UI、社区示例、长期维护成本让我们决定迁到 **ReactFlow**。全量重写 = 数周功能冻结 + 回归爆炸。我们选了 **Strangler Fig**：旧画布与新画布并行，按里程碑切流量，随时可回滚。ADR 里写死：**旧 G6 只做 S 级止血；新功能一律进 RF 分支。**

## 四阶段（R0→R3）——已闭环

| 阶段 | 目标 | 状态 |
|---|---|---|
| **R0 探针** | RF 最小 POC：表节点、FK 连线、projectJSON 读写 | ✅ |
| **R1 对等** | 拖表、连 FK、删改、缩放与 G6 对齐 | ✅ |
| **R2 超越** | 选中态、键盘、边路由、导入 dagre 布局、空态构图 | ✅ |
| **R3 切换** | 默认画布切 RF，导出去 G6 | ✅ |

诚实短板仍在：**交互 polish 相对 dbdiagram 还有差距**（这是体验债，不是「还在迁移」）。迁移已完成，接下来是把 RF 画布磨到深度用户离不开。

## Strangler 比 Big-Bang 好在哪

**用户无感**——设计器 URL 不变，按里程碑切默认实现，不必「某天全体重学」。**测试可分层**——关系图、导入/分享等自动化测试逐条迁断言，不必等「全绿再上线」。**贡献者可切入**——「节点样式」「边路由」「补 testid」边界清晰，不必读懂整个 G6 历史。

若当年 Big-Bang：要么长期双写无人敢合，要么一次合入炸光回归。Strangler 把风险摊进每一周可 revert 的切片。

## 给想贡献画布的同学

- 代码在设计器 RF 路径；起栈方式见 [贡献指南]({{GH:CONTRIBUTING.md}}) 与 [本地开发文档]({{DOC:development}})。
- **事实源是 projectJSON**——画布只是视图；改渲染须保持 schema 仅加法兼容（见 [数据格式说明]({{DOC:data-format}})）。
- 当前高 ROI 方向：节点 `aria-label` / `data-testid`、边标签密度、大图性能、分享只读与设计器路由一致性。

{{CTA}}

## 路线图与参与

- 文档 / 路线图 / ADR 索引：[文档站]({{DOCS}})
- Issue / PR：[GitHub 仓库]({{REPO}})

欢迎 fork 提 PR——我们需要更多「小而可验证」的画布 PR，而不是再开 G6 分叉。
