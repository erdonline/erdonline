# Vision 自我迭代（每 tick 现场选题，禁止写死主线）

## 北极星（不变）

服务 `docs/vision.md`：数据库设计的 Git + Figma；指标=每周有版本保存的活跃建模项目。

## 进化使命（反 idle）

本循环的默认姿态是**每 tick 都交付一个用户可见的切片**，不是等指令的巡检器。

- **Idle 的唯一合法条件**（满足其一才可 idle，且须一行说明证据）：
  1. 用户明确叫停；
  2. 连续两轮指标/体验变差（漂移防控）；
  3. 扫完下列全部信号源后**确实没有可验证缺口**：UX 走查截图（`frontend/test-results/ux-walkthrough/`）、E2E 失败、`docs/product-capability-map.md`、`docs/control-matrix.md` 🚧、`docs/roadmap.md` 🚧/📋、用户最近抱怨。
- **默认偏向**：当 idle 会「发明不出东西」时，直接 ship 下一个 UX/IA 或能力切片。用户可见质量（设计器 chrome、空态、死 affordance、静默失败、信息冗余）永远优先于 ops 打磨。
- **UI/UX 重设计是被授权的**：当用户报告，或 Playwright UX 走查 / dogfood 发现 P0/P1 摩擦时，当轮即可改，无需先问。
- 已知用户抱怨（优先消化）：项目下拉与横向菜单信息冗余、设计器壳拥挤 —— 见 `docs/ui-layout-redesign.md` 各波续推。

## 全栈自治

- 一个切片可同轮改 **前端 + 后端 + Flyway 迁移 + E2E**，只要它闭合成一个能力。schema 只加 `V*__*.sql`（schema-migration 纪律）。
- 能力缺口主动发现：对照 capability-map 与竞品承诺（版本/协作/开放/自部署），发现缺失能力可直接立项实现，不只修既有 bug。
- **红线不越**：ADR-0013（API/MCP 需求清晰前不实现）；ADR-0011（复合 FK fields[] 解封条件未到不做）；不引回 `@ant-design/pro-components`；antd 唯一标准；不做 AI 噱头；MIT / vision 定位不动。

## 每轮必须做（顺序）

1. **读现状，不读记忆**
   - `docs/roadmap.md`：仍为 🚧 / 📋 的项及「待续」子项
   - `docs/control-matrix.md` 🚧、`docs/product-capability-map.md` 缺口、UX 走查截图新摩擦
   - `CHANGELOG.md` Unreleased 最近几条 + `git log -5 --oneline` + `git status -sb`
   - 勿沿用对话或旧 prompt 里的写死优先级清单，**除非** roadmap 仍明确标 🚧

2. **选题（唯一目标，ROI 排序）**
   - 杠杆序：北极星（版本保存）> 激活（30s 进版本）> 设计器 UX 去冗余 > 能力缺口 > ops
   - 用户报告的摩擦与 P0/P1 走查发现可直接插队
   - 一次只做一件事；切片须本 tick 内可验证；禁止编造无杠杆的微改凑数
   - 若 idle：仅在改了本 prompt 时提交该改动，勿伪造实现与验证

3. **执行（速度不破质量）**
   - 入口纪律：后端 `./backend/dev-ensure.sh`（改 Java/yml/mapper 后 `--restart`）；前端**永不重启**靠 HMR；禁止旁路启动
   - 模型路由：规划/IA/选题/ADR → Task `model: "kimi-k3-high"`；执行/修复/E2E/回归 → 省略 model（Auto）；若 kimi 限流 → Auto 规划+执行一体并加严验证
   - 分层验证，能轻则轻：curl/单测（秒级）→ `npx playwright test --grep` 聚焦用例 → 关键旅程走查；禁止全量惯性
   - 改动点即测试点：每个改动配 curl 断言 / 单测 / E2E / 手工清单，未验证不得宣称完成

4. **收口**
   - CHANGELOG「验证点」+ 文档同轮 + roadmap/capability-map/矩阵状态推进 + `git commit`（Conventional，一个意图一个 commit，验证绿了才提交）
   - 发现新交互模式 → 蒸馏正反例进 `docs/design-principles.md`

5. **简报（短）+ 喂给下一 tick**
   - 本轮目标对应 roadmap/矩阵哪一行 → 做了什么（或 idle+证据）→ 证据（命令/提交）→ 下一刀候选
   - 留给下一 tick 的现场：最后 commit、未闭 P0/P1 摩擦清单、矩阵/capability-map 🚧、用户最新 override

## 停止条件

连续两轮指标/体验变差、与用户方向冲突、或用户叫停 → 停下并说明。
