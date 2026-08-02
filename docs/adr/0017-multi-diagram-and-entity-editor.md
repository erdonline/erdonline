# ADR-0017：多关系图 + 图内分组 + 实体编辑器与模型树密度

- 状态：已接受（2026-08-02）；Phase 1 ✅；Phase 2a（多图切换器 + `diagrams[]`）✅；Phase 2b（Frame 视觉框）✅；`includeEntities` 过滤 UI / 删图打磨仍可另切片
- 决策者：项目维护者；承接 ADR-0016「敢分享的美图」主线

## 背景

模型设计页 / 表设计页被用户点名：色调与 `erd-*` tokens 不一致、内容贴边无呼吸感、表设计三 tab 粗糙、模型树「表 / 关系」默认折叠且大量表/关系时滚动无虚拟化。同时提出能力诉求：**关系图要支持多个图；单图内支持分组**。

## 调研结论（公开最佳实践，2026-08 英文资料）

1. **多图 = 同一 schema 的多个「视图」，不是多份数据**。dbdiagram「Diagram Views」（2025-09 发布，2026-04 进 DBML as-code）与 MySQL Workbench「一模型多 EER Diagram tab」一致：实体/关联只有一份，图只存布局与过滤子集。dbdiagram 社区证实：几百张表时单图直接不可用，多视图是刚需而非增强。
2. **图内分组有两种正交形态**：逻辑分组（dbdiagram `TableGroup`，可折叠、可进视图过滤）与视觉分组（Workbench Layer 矩形、Figma Frame、draw.io 容器）。Workbench Layer 不可嵌套、拖入即归属；Figma Frame = 边界 + 成员。结论：先做**视觉框（frame）**，成员显式记录，不做坐标重父化。
3. **大列表必须虚拟滚动**。antd Tree 官方：`height` 属性即开虚拟滚动；代价是不支持横向自适应宽（本仓库标题本就 ellipsis 定宽，无冲突）。稳定 key + memo 渲染是配套纪律。
4. **实体编辑器 = 分页签的属性面板**。ER/Studio（Columns/Constraints/Indexes 三签）、Beekeeper Studio（schema/indexes/relations「pills」+ 脏标记 `*`）、Prisma Studio（侧栏 + 多签）一致：签要少而正交、签头有清晰层级、内容区有统一内边距。
5. **侧栏密度**：树默认展开到「可操作层级」（dbdiagram/Workbench 目录树均默认展开），折叠是用户主动行为；搜索时自动展开命中分支。
6. **关系（边）不该逐条堆进树**。Workbench 目录树只列对象不列边；边的归宿是画布。当前「关系」文件夹把每条边列成树节点，大模型下是噪音（Phase 2 随多图列表一并替换）。

## 决策

### Phase 1（已落地，本切片）

1. 模型树「表」「关系」**默认展开**（含新加模块自动展开；用户手动折叠不被回顶）；修复 `getExpandedKeys` 推送的 key（`module${name}`）与树 key 从不匹配的死逻辑。
2. 模型树开**虚拟滚动**（antd Tree `height` + ResizeObserver 量容器），支撑 100+ 表/边。
3. 模型设计 / 表设计内容区**统一 12px 留白 + 卡片化**（sunk 底 + surface 卡 + `--erd-line` 描边 + 8px 圆角），禁止内容贴边。
4. 表设计三签（字段 / 索引 / 元数据应用）美化：签头加表名 + 中文名 + 所属模型层级条，签体统一内边距，全部走 `erd-*` tokens。
5. 树图标 / 徽章 / 菜单图标色值从 antd 默认蓝绿黄切换到 `erdColors`（模块 ink900、表 warning、关系 success、删除 brand），与画布 PK/FK 徽章同语言。

### Phase 2a（已落地，schema-additive，纯前端 projectJSON）

1. **多关系图**：`module.diagrams?: Diagram[]` 新增可选字段；`Diagram = { id, name, includeEntities?: string[], layout: { nodes: [{ id, x, y }] }, groups?: Frame[] }`。
   - 实体与关联仍唯一存于 `module.entities` / `module.associations`（单一事实源，ADR-0001 不变）。
   - 旧 `module.graphCanvas` 视为「主关系图」布局，懒迁移进 `diagrams[0]`；无 `diagrams` 的项目行为完全不变（向后兼容、可回滚）。
   - 单一 selector：`getActiveDiagram(module, diagramId?)`（`frontend/src/utils/diagram.ts`）；写路径 `updateGraphCanvasLayout` 只写 `diagrams`。
   - UI：画布工具条图切换器（Select + 新建/重命名）；左树「关系」子节点为图列表（主图 `tree-open-relation`）；tab：`关系图-${module}` / `关系图-${module}-${diagramId}`。
   - `includeEntities` / 删除主图：类型与 API 已留，过滤 UI 与 Frame 渲染归 Phase 2b。
   - 同模块关系图 tab 就地切换（`switchRelationDiagram`），工具栏与左树不堆多 canvas。

### Phase 2b（已落地，schema-additive）

2. **图内分组（Frame）**：`Frame = { id, name, color?, x, y, w, h, memberEntityIds: string[] }`，存于 `diagram.groups[]`。
   - 渲染为 ReactFlow 自研底层框节点（`type: 'frame'`，z-index 低于表），**不做 RF subflow / parent 坐标重父化**（成员仍写绝对 `layout.nodes`）。
   - **拖框平移成员**：拖动 Frame 时按同一 Δ 平移 `memberEntityIds` 内表节点并持久化（Figma Frame 心智；仍非 parentId）。
   - **缩放**：选中 Frame 显示 NodeResizer 八角手柄，`w`/`h`（及 NW 侧 `x`/`y`）写入 `groups[]`。
   - **适应成员**：工具栏「适应成员」按成员包围盒 + padding 重算框；「加入分组」/拖表入框时只扩不缩。
   - **归属**：拖表中心落入框 → `addFrameMembers`；拖出原成员框 → `removeFrameMembers`；工具栏「新建分组」「加入分组」保留；Delete 删框。
   - 写路径：`createFrame` / `addFrameMembers` / `removeFrameMembers` / `updateFrameBounds` / `removeFrame`；实体改名/删除同步 `memberEntityIds`。
   - 分享只读画布同样渲染 `groups`（无缩放/拖框编辑）。

### 仍可另切片

- `includeEntities` 视图过滤 UI
- 删除非主图的确认流打磨（`removeDiagram` API 已有）
- Frame 折叠 / 嵌套 / 多框批量对齐

## 后果

- 正面：大模型可用性（虚拟滚动 + 默认展开 + 多图）与颜值（tokens + 留白 + 三签）双收；多图数据模型与 dbdiagram/Workbench 心智一致，分享图可按主题出图；Frame 可调大小、拖框带表、拖入拖出归属，分组与表配合接近 Figma。
- 代价：Phase 2 需动 tab key 规则与树「关系」子节点语义（有 E2E 覆盖点：`tree-open-relation`）；拖框带表会改写成员绝对坐标（可撤销）；仍非 RF parent，故无「相对坐标」与自动 clip。
- 风险：多图懒迁移若写路径遗漏会产生双写漂移 → 迁移收敛在单一 selector（`getActiveDiagram(module)`），写路径只写 diagrams。
