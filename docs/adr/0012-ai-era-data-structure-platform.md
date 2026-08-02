# ADR-0012：升级为「AI 时代的数据结构平台」

- 状态：**已接受**（2026-08-02）
- 决策者：项目维护者
- 决策：采纳 **选项 B**（定位升级：Git + Figma + Agent 的 schema 事实源）

## 背景

用户提出新的雄心：**AI 时代定义数据结构的平台（openness + security）**，并要求公开落地页（landing page）。这与 vision.md 既有表述存在张力：

1. vision 一句话定位是「数据库设计的 Git + Figma」，其中「不追 AI 噱头 —— AI 能力在功能深度阶段用真实力交付」
2. roadmap「依赖外部或后置」将 AI 列为后置项

本 ADR 不重写愿景骨架，只回答：**「AI 噱头」与「AI 时代平台」的区别是什么，以及后者是否值得升级定位。**

### 为什么现在谈这个

- Agent（Cursor / Claude Code / MCP 生态）正在成为数据库 schema 的主要**生产者与消费者**。LLM 生成的 schema 需要被审查、版本化、协作评审——这正是本项目已有的长板（版本 + 协作 + projectJSON schema 化）
- 既有的 projectJSON（schema 版本化、永不原地破坏）、版本 diff、审批流、只读分享，天然是「agent 可读、可审计的数据结构事实源」
- 竞品（dbdiagram/dbml）仍以「人写代码画图」为主，尚无开源工具把「agent 可编程访问」作为一等公民

## 决策选项

### A. 维持现状（AI 继续后置，只做落地页）

- 正面：不分散精力，P3 功能深度继续
- 负面：错失 agent 生态窗口；落地页没有差异化叙事，只能讲「协作 + 版本」

### B. 定位升级：Git + Figma +（Agent 的 schema 事实源）【已采纳】

愿景微调为：**数据库设计的 Git + Figma，以及 AI agent 读写数据结构的开源事实源（source of truth）。**「不做 AI 噱头」保留，但澄清：噱头 ≠ 平台级 AI 能力。

**平台级 AI 能力（要做，都是既有长板的延伸）：**

1. **schema-as-code**：projectJSON 即公开、稳定、版本化的数据格式，CLI/脚本可读写（已有地基：`data-format.md` 的 schema 版本化承诺）
2. **API/MCP 开放**：读 schema、读版本、写版本（保存 = 提交）的公开 API；MCP server 让 agent 直接「拉取项目当前 schema / 提交新版本」（鉴权/限流/scope 见 [ADR-0013](./0013-public-api-mcp.md)，📋 规划中）
3. **版本 = agent 的事实源**：每个版本可 diff、可回滚，agent 的每次改动都可审计、可评审（审批流已存在）
4. **分享 / fork**：只读分享（ADR-0007）+ fork 已存在，升级为「agent 可引用的永久链接」
5. **审计与安全**：agent 持 token 访问时的权限边界、SQL 执行信任链、密钥不落 projectJSON（ADR-0008 已隔离）

**AI 噱头（不做，与愿景一致）：**

- 不做「输入一句话生成 ERD」的黑盒魔法前置宣传
- 不做 ChatSQL 类对话玩具的营销包装（实验页维持 📋，不升级为卖点）
- 不在模型/向量库上自建投入；AI 生成走「agent 调 API」，我们只提供事实源与审计

### C. 全面转向 AI 产品（对话式建模为核心）

- 负面：推翻 Strangler 节奏与 antd/CRUD 投资，团队带宽不够，违背「不做 AI 噱头」初衷。**否决。**

## 决策（已接受 · 选项 B · 2026-08-02）

1. 愿景一句话定位追加 AI 时代维度（见 `vision.md`）
2. roadmap **P5：AI 时代数据结构平台** 🚧：落地页先行，其后 schema-as-code / 产品深度；API/MCP 受 ADR-0013 约束，本切片不实现
3. 「不做 AI 噱头」原条改写为更精确表述（见 `vision.md`）

## 后果

- 正面：差异化叙事（开源 + agent 可读 + 版本审计）；落地页有话可讲；复用既有投资，零推翻
- 代价：北极星指标需补充护栏（如「API/MCP 产生的版本保存数」）；公开 API 需要速率限制与 token 管理（新增安全面，见 ADR-0013）
- 风险：定位升级若只做叙事不做 API，会沦为新噱头 → P5 排序要求「先落地页 + schema-as-code 文档化，后 API/MCP 实现」
- 触发复审：MCP/API 设计前完成 ADR-0013（鉴权模型、速率限制、scope）

## 明确不做什么（本 ADR 范围内）

- 不做移动端/桌面端；不做闭源云版（维持愿景既有条款）
- 不换 UI 库（ADR-0005 约束不变）；暗色维持延期（ADR-0010 不变）
- 不做自研 LLM / 向量化检索；不做 AI 生成 schema 的产品内黑盒功能（agent 在外部，经 API 进出）
