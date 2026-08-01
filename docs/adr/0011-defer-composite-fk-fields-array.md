# ADR-0011：复合 FK 暂不改为 AssociationEnd.fields[]

- 状态：已接受（2026-08-02）
- 决策者：项目维护者

## 背景

P0 四库已用字典 SQL 拉取 FK；复合键按 `ORDINAL_POSITION` **拆成多条**单字段 `Association`（`from.field` / `to.field`），与 ReactFlow 字段级连线一致。若改为单条边 + `fields[]`，需同步改画布多锚点/边模型，ROI 低于继续获客与文档站。

## 决策

1. **维持**「一列一对边」；字典层已保序，精度够用
2. **不做**本阶段 `AssociationEnd.fields[]` / 单逻辑 FK 聚合
3. 需要时另开里程碑：先 FE 多字段边协议，再改逆向聚合

## 后果

- 正面：画布与导入无需大改；四库字典 FK 可标完成
- 负面：约束名/ON DELETE 等元数据仍未进模型；复合 FK 在 JSON 里是多条 association
