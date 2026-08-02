# 架构决策记录 / ADR

> 重大技术决策的留痕。每篇一页：状态、背景、决策、后果。
> 决策可以被推翻，但必须新增一篇 ADR 说明推翻理由，禁止原地修改历史记录。

| 编号 | 决策 | 状态 |
|---|---|---|
| [0001](./0001-designer-reactflow.md) | 设计器画布迁移至 ReactFlow | 已接受 |
| [0002](./0002-backend-upgrade-path.md) | 后端升级路径：先 Boot 2.7，后 3.x 独立里程碑 | 已接受 |
| [0003](./0003-docs-docusaurus.md) | 文档发布体系选型 Docusaurus | 已接受 |
| [0004](./0004-license-mit.md) | 维持 MIT 许可证 | 已接受 |
| [0005](./0005-ui-architecture.md) | UI 架构：antd 守 CRUD，设计器域自研 | 已接受 |
| [0006](./0006-reverse-dialect-spi.md) | 多库逆向 Dialect SPI（P0 四库 + Generic 兜底） | 已接受 |
| [0007](./0007-readonly-project-share.md) | 项目只读分享链接 | 已接受 |
| [0008](./0008-datasource-isolation.md) | 数据源与 projectJSON 隔离（不落 profile.dbs） | 已接受 |
| [0009](./0009-collab-presence-socketio.md) | 协作 Presence：后端 SocketIO + 短票 | 已接受 |
| [0010](./0010-defer-dark-mode.md) | 暗色模式延期（不阻塞 P2） | 已接受 |
| [0011](./0011-defer-composite-fk-fields-array.md) | 复合 FK 暂不改为 fields[] | 已接受 |
| [0012](./0012-ai-era-data-structure-platform.md) | 升级为「AI 时代的数据结构平台」（Git+Figma+agent 事实源） | 已接受 · B |
| [0013](./0013-public-api-mcp.md) | 公开 API / MCP（鉴权·限流·scope） | 📋 已规划 |
| [0014](./0014-drop-or-strangle-ant-pro.md) | @ant-design/pro-components Strangler 摘除（冻结新增、不随 umi/antd 升级） | ⏳ 待确认 · 建议 B |
