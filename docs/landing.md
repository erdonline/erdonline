# 落地页（IA + hero 文案）

> 依据 [ADR-0012](./adr/0012-ai-era-data-structure-platform.md)（已接受 · 选项 B）。实现纪律：品牌优先、一个构图；用真实产品画布截图做 hero，禁止通用紫色渐变 AI 模板；静态优先、受性能预算约束。

## 信息架构（IA）

单页叙事，自上而下：

1. **Hero**：一句话定位 + 主 CTA「在线试用 demo」+ 次 CTA「GitHub」；背景为真实设计器画布构图
2. **三卖点**（各一段图标 + 短句 + 截图）：
   - 版本：每次保存自动生成版本，diff 可见，随时回滚
   - 协作：多人同图实时编辑，像 Figma 一样
   - 开放：projectJSON 公开格式，API 读写，agent 可直接消费
3. **30 秒动线**：demo 直达链接（现有 `/demo`），强调免注册
4. **自部署**：docker-compose 一键起，MIT，数据在你手里
5. **对比**：vs dbdiagram / dbml 诚实对照表（协作✅/版本✅/开源✅/API✅）
6. **Footer**：文档、Roadmap、社区、License

## Hero 文案（bullet 方向，非终稿）

- 主标题方向：数据库设计的 Git + Figma
- 副标题方向：版本、协作、开放 API——人和 AI agent 共用同一份数据结构事实源
- CTA：在线试用（免注册） / 自部署指南

## 不做

- 不做多页营销站（单页 + 文档站分流）
- 不做夸大的 AI 生成演示动画；AI 叙事只讲「开放 + 可审计」
