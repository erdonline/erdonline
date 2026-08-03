# ADR-0011：复合 FK 暂不改为 AssociationEnd.fields[]

- 状态：已接受（2026-08-02）；**仍延期** `fields[]`（2026-08-03 复查：解封条件未满足）
- 决策者：项目维护者

## 背景

P0 四库已用字典 SQL 拉取 FK；复合键按 `ORDINAL_POSITION` **拆成多条**单字段 `Association`（`from.field` / `to.field`），与 ReactFlow 字段级连线一致。若改为单条边 + `fields[]`，需同步改画布多锚点/边模型，ROI 低于继续获客与文档站。

## 决策

1. **维持**「一列一对边」；字典层已保序，精度够用
2. **不做**本阶段 `AssociationEnd.fields[]` / 单逻辑 FK 聚合
3. 需要时另开里程碑：先 FE 多字段边协议，再改逆向聚合
4. **允许加法元数据**（不改变边粒度）：`constraintName` / `deleteRule` / `updateRule` 挂在每条拆边 association 上；复合 FK 多条边共享同名 `constraintName`（见 data-format）

## 后果

- 正面：画布与导入无需大改；四库字典 FK 可标完成；约束名与引用动作可逆向保真且不碰 `fields[]`
- 负面：复合 FK 在 JSON 里仍是多条 association（逻辑聚合待里程碑）

## 解封条件（`fields[]`）

须同时满足才另开里程碑：**FE 多字段边协议**（单逻辑 FK → 多锚点/路由）落地，且北极星 ROI 高于当前其它逆向缺口。在此之前禁止把拆边改成 `from.fields[]`/`to.fields[]`。
