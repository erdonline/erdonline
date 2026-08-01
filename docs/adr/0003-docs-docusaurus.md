# ADR-0003：文档发布体系选型 Docusaurus

- 状态：已接受（2026-08-01）
- 决策者：项目维护者

## 背景

需要一套文档发布体系承载：落地页、使用文档、贡献者文档、ADR、发布日志。候选：VitePress（Vue 栈）、Nextra（绑死 Next.js）、MkDocs Material（Python 工具链）、GitBook/Mintlify（SaaS 自主权弱）、裸 GitHub 渲染（无搜索/版本化）。

## 决策

**Docusaurus + GitHub Pages**，一套系统三个职能：

- 首页 = 落地页（hero + 截图 + demo 入口）
- docs = 文档站，直接消费仓库 `docs/` 目录（单一事实源，GitHub 上同样可读）
- blog = 发布日志 / devlog

配套：早期 docusaurus-search-local（中文分词），公开后申请 Algolia DocSearch；版本化随首个大版本开启（不早产）；i18n 默认 zh-CN，P3 开英文；docs 构建进 CI（死链即失败）。

## 后果

- 正面：React 同构降低贡献者门槛；MDX 可嵌入真实设计器只读画布，实现"文档即 demo"
- 代价：仓库新增 website/ Node 工具链（与前端同构，成本可控）
