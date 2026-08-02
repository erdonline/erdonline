# 落地页（IA + hero 文案）

> 依据 [ADR-0012](./adr/0012-ai-era-data-structure-platform.md)（已接受 · 选项 B）。实现：`/` → `frontend/src/pages/landing`（`layout: false`）；登录页「了解产品」回链。

## 信息架构（IA）

单页叙事，自上而下：

1. **Hero**：品牌 ERD Online（hero 级）+ 一句定位 + 主/次 CTA；**全幅**真实设计器截图作背景（`/landing-hero.jpg`），非侧栏嵌图
2. **三卖点**：版本 / 协作 / 开放（API/MCP 路线图，见 ADR-0013）
3. **30 秒动线**：`/demo` + 自部署文档外链
4. **对比**：vs dbdiagram / dbml
5. **Footer**：文档、Roadmap、社区、登录（已登录则「进入工作台」）

## Hero 文案

- 品牌：ERD Online（hero 级，压过副标题）
- 主标题：数据库设计的 Git + Figma
- 副标题：版本、协作、开放格式——人和 AI agent 共用同一份数据结构。30 秒免注册试用。
- 未登录 CTA：在线试用（主）/ 注册（次）/ 已有账号？登录（文本）；GitHub 仅在顶栏
- 已登录 CTA：进入工作台（主）/ 打开演示（次）；顶栏与页脚同步「进入工作台」

## 视觉约束

- 全幅产品截图 + 左侧可读 scrim；禁止 inset/卡片式 hero、紫色渐变 AI slop
- 色板：墨蓝底 + 橙强调（非紫 / 非 cream-serif）

## 不做

- 不做多页营销站（单页 + 文档站分流）
- 不做夸大的 AI 生成演示动画；AI 叙事只讲「开放 + 可审计」
- 不做硬跳转把已登录用户踢出落地页（用主 CTA 疏导即可）
