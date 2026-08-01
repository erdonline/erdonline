# ADR-0001：设计器画布迁移至 ReactFlow

- 状态：已接受（2026-08-01）
- 决策者：项目维护者

## 背景

设计器核心基于 G6 1.x（2019 年停止维护），以 script 标签全局变量引入，核心文件为约 1550 行的 class 组件（`frontend/src/pages/design/relation/g6.js`），无类型、无测试。体验规划中的画布内联编辑、富节点样式、虚拟化等在现代框架上是顺水推舟，在 G6 1.x 上要么不可行要么事倍功半。

## 决策

迁移至 **ReactFlow**，采用 **Strangler（绞杀者）策略**：

- R0 探针：验证 projectJSON → ReactFlow nodes/edges 映射（字段级锚点用 Handle 原生实现）✅
- R1 功能对等：拖拽、缩放、小地图、连线、删除守卫、自动保存、dagre ✅
- R2 超越旧版：undo/redo、内联编辑、多选对齐、命令面板 ✅
- R3 切换：关系图入口唯一 ReactFlow；删除 `g6.js` 及右键/关系编辑附属文件 ✅（2026-08-01）
  - 导出：`relation2file` 已改为 DOM+SVG+html2canvas，全局 `g6*.js` 已从入口卸除 ✅

迁移期旧 G6 只做 S 级止血修复，不做 M 级以上投入（画布与导出均已切完）。

## 补充（2026-08-01 走查发现的既有断裂，新画布必须根治）

走查证实旧画布建模回路已完全断裂：① 文件夹模式树下「关系图」入口缺失（已 S 级止血修复）；② 前端无任何拖拽源，实体永远无法上图；③ `addEntity` 不写 `graphCanvas`。新画布数据模型必须改为：**nodes 派生自 `module.entities` 全集（实体即节点，创建即上图），`graphCanvas` 只存布局（坐标/折叠态），无坐标节点自动布局**。禁止沿袭"实体 ≠ 画布节点"的双写模型。

## 后果

- 正面：自定义节点 = React 组件，内联编辑/富样式天然可行；社区势能利于吸引贡献者；undo 自研比 G6 黑盒更可控
- 代价：2-4 周迁移期，期间旧画布功能冻结；500 表大图需 `onlyRenderVisibleElements` + 节点 memo 手工优化
- 风险与对策：数据格式兼容 → projectJSON schema 版本化（见 data-format.md）；迁移质量 → Playwright 冒烟先行
