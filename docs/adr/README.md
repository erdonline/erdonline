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
| [0011](./0011-defer-composite-fk-fields-array.md) | 复合 FK 暂不改为 fields[]（允许约束元数据加法） | 已接受 |
| [0012](./0012-ai-era-data-structure-platform.md) | 升级为「AI 时代的数据结构平台」（Git+Figma+agent 事实源） | 已接受 · B |
| [0013](./0013-public-api-mcp.md) | 公开 API / MCP（鉴权·限流·scope） | 🚧 进行中（切片 1–5 + write REST/MCP + Redis + OAuth A+B + client/PAT 管理 UI ✅；余同意页） |
| [0014](./0014-drop-or-strangle-ant-pro.md) | @ant-design/pro-components Strangler 摘除（依赖已移除） | ✅ 已落地 · B |
| [0015](./0015-tomcat-max-http-header-size.md) | Boot 3 提高 `max-http-request-header-size`（JWT 头溢出→HTML 400） | 已接受 |
| [0016](./0016-experience-first-shareable-diagram.md) | 体验优先：「敢分享的美图」主线（ICP 混合） | 已接受 |
| [0017](./0017-multi-diagram-and-entity-editor.md) | 多关系图 + 实体编辑器（含图内分组 Frame） | 已接受 · 分阶段 |
| [0018](./0018-hosting-topology-no-vps.md) | 托管拓扑：GitHub + Cloudflare 免费档，不买生产 VPS | 已接受 |
| [0019](./0019-demo-runtime-railway.md) | 官方 Demo 运行时：Railway-only（真 MySQL 8）；拒三厂商；Zeabur 为 CN 备选 | 已接受 |
| [0020](./0020-single-database.md) | 单一业务库 `erd`（取消 martin/erd 双库）；init schema-only；种子走 Flyway | 已接受 |
| [0021](./0021-idp-federation-google-wechat.md) | 第三方登录 IdP 联邦（GitHub + Google OIDC + 微信开放平台扫码） | ✅ 已接受 · MVP |
| [0022](./0022-dual-layer-consistency.md) | 双层一致性（工作区↔版本↔实库）；禁止自动双向同步 | ✅ 已接受 |
| [0023](./0023-i18n-foundation.md) | i18n 奠基：默认 zh-CN；英文优先 ≠ 切默认；B 层后一个切片 | 已接受 |
| [0024](./0024-datasource-credential-encryption.md) | 数据源凭证落库加密（AES-256-GCM，`ERD_DB_CONFIG_SECRET`） | 已接受 |
| [0025](./0025-og-social-unfurl.md) | OG / 社交展开卡片 | 已接受 |
| [0026](./0026-precision-tooling-visual-language.md) | 精密工具站视觉语言（营销深色 + 工作台浅色精密化；≠ 全局暗色） | 已接受 |
| [0027](./0027-designer-chrome-ia.md) | 产品 Chrome IA（全站 Theme + 状态仪器盘 + 单一项目浏览 + 表设计层级） | 已接受 |
| [0028](./0028-official-template-catalog.md) | 官方模板广场（Open VSX；浏览/安装/评分/发布审核；MCP 四工具） | ✅ 已接受 · MVP |
| [0029](./0029-designer-readonly-query.md) | 设计器只读查询（探库）设计简报：改名为「表数据预览」+ 驱动管理（核心层 + 部署期扩展包，不阻塞建模者） | 提议中 · 设计简报 |
| [0030](./0030-ddl-template-engine-isomorphism.md) | DDL 模板引擎（Freemarker 终态；BE 权威；Pebble+Translator 过渡；拒 Handlebars 终态） | 已接受 |
| [0031](./0031-ddl-api-surface.md) | DDL 生成 API 与版本 API 分域（`ProjectDdlController` / `/projectDdl/*`；拒并入 Connector） | ✅ 已实施 |
| [0032](./0032-field-library-data-dict.md) | 字段库 data_dict（平台/团队/个人；copy-on-apply；含库管理 UI） | ✅ 已接受 · MVP |
