# 落地页（IA + hero 文案）

> 依据 [ADR-0012](./adr/0012-ai-era-data-structure-platform.md)（已接受 · 选项 B）。实现：`/` → `frontend/src/pages/landing`（`layout: false`）；登录页「了解产品」回链。

## 信息架构（IA）

主叙事在 `/`，对照深链 `/compare`（共用落地壳，不做更多营销子页）：

1. **Hero**：品牌 ERD Online（hero 级）+ 一句定位 + 主/次 CTA；**全幅**真实设计器截图作背景（`/landing-hero.jpg`），非侧栏嵌图
2. **三卖点**：版本 / 协作 / 开放（API/MCP 路线图，见 ADR-0013）
3. **30 秒动线**：`/demo` + 自部署文档外链
4. **对比摘要**：vs dbdiagram / dbml 四行表 +「查看完整对照」→ `/compare`
5. **Footer**：文档、Roadmap、对照、社区、登录（已登录则「进入工作台」）

### `/compare` 子页

- 诚实对照表：协作 / 版本 / 审批审计 / 只读分享 / 开源自部署 / DBML / Agent 事实源
- CTA：打开演示 / 自部署指南 / 返回首页
- 键盘：同壳 Skip「跳到主操作」→ `#landing-main-cta`；CTA Tab 序演示→自部署→返回首页；surface focus-visible；无 trap（E2E `compare`「竞品对照页键盘」）
- 实现：`frontend/src/pages/landing/compare.tsx` + `LandingChrome`；E2E `compare.spec.ts`

## Hero 文案

- 品牌：ERD Online（hero 级，压过副标题）
- 主标题：数据库设计的 Git + Figma
- 副标题：版本、协作、开放格式——人和 AI agent 共用同一份数据结构。30 秒免注册试用。
- 未登录 CTA：在线试用（主）/ 注册（次）/ 已有账号？登录（文本）；GitHub 仅在顶栏
- 已登录 CTA：进入工作台（主）/ 打开演示（次）；顶栏与页脚同步「进入工作台」

## 视觉约束

- 全幅产品截图 + 左侧可读 scrim；禁止 inset/卡片式 hero、紫色渐变 AI slop
- 色板同源 `theme/css-vars.less`：底 `--erd-ink-900`、主 CTA `--erd-brand`、点缀 success/warning；字族 `--erd-font-ui` / `--erd-font-display`；禁止落地页自造第二套色
- 次密距：次屏 section ~2.75rem、对照行 0.5、nav/footer 收；`/compare` 头区 padT 1.5；**勿压** hero 品牌级字号 / 全幅构图 / CTA 层级
- 键盘：首焦 Skip「跳到主操作」→ hero `#landing-main-cta`（`/compare` CTA 同锚）；壳内 `:focus-visible` surface 环；不人为正 `tabIndex`

## 不做

- 不做多页营销站（`/` 主叙事 + 仅允许 `/compare` 对照深链；其余进文档站）
- 不做夸大的 AI 生成演示动画；AI 叙事只讲「开放 + 可审计」
- 不做硬跳转把已登录用户踢出落地页（用主 CTA 疏导即可）
