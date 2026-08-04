# ADR-0023：i18n 奠基（默认 zh-CN；英文优先 ≠ 切默认）

- 状态：**已接受**（2026-08-04；审查锁定，B 层后一个切片落地）
- 相关：[ADR-0005](./0005-ui-architecture.md)（antd 唯一）

## 决策

| 议题 | 决策 |
|---|---|
| 时机 | B 层五态闭环后**一个**奠基切片；双层 A/B 信任工作期间**不做** i18n MVP |
| 默认 locale | 产品默认 **zh-CN** 不变；「英文优先」= 未来新 key 同时写 EN+ZH，**不**现在切默认 EN |
| 后端文案 | 结构化 error code 为真相；FE 映射 copy；**不用** Accept-Language 透传 JDBC 错误 |
| 奠基三步 | (1) Theme locale 可配置仍默认 zh-CN (2) 清/换死 `locales/` 骨架 (3) E2E 反脆弱规则 |
| 完整 i18n | P3 后置（语言切换 UI、全站 key 化） |
