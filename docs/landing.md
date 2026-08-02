# 落地页（IA + hero 文案）

> 依据 [ADR-0012](./adr/0012-ai-era-data-structure-platform.md)（已接受 · 选项 B）。实现：`/` → `frontend/src/pages/landing`（`layout: false`）；登录页「了解产品」回链。

## 信息架构（IA）

单页叙事，自上而下：

1. **Hero**：品牌 ERD Online + 一句话定位 + 主 CTA「在线试用 demo」+ 注册/登录/GitHub；全幅真实设计器截图（`/landing-hero.jpg`）
2. **三卖点**：版本 / 协作 / 开放（API/MCP 路线图，见 ADR-0013）
3. **30 秒动线**：`/demo` + 自部署文档外链
4. **对比**：vs dbdiagram / dbml
5. **Footer**：文档、Roadmap、社区、登录

## Hero 文案

- 品牌：ERD Online（hero 级）
- 主标题：数据库设计的 Git + Figma，AI 时代的开源事实源
- 副标题：版本、协作、开放格式——人和 AI agent 共用同一份数据结构
- CTA：在线试用（免注册） / 注册 / 登录 / GitHub

## 不做

- 不做多页营销站（单页 + 文档站分流）
- 不做夸大的 AI 生成演示动画；AI 叙事只讲「开放 + 可审计」
- 不做紫色渐变 AI slop / cream-serif-terracotta / broadsheet 模板
