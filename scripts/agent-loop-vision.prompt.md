# Vision 自我迭代（每 tick 现场选题，禁止写死主线）

## 北极星（不变）

服务 `docs/vision.md`：数据库设计的 Git + Figma；指标=每周有版本保存的活跃建模项目。

## 每轮必须做（顺序）

1. **读现状，不读记忆**  
   - `docs/roadmap.md`：找出仍为 🚧 / 📋 的项及括号内「待续」子项  
   - `CHANGELOG.md` Unreleased 最近几条 + `git log -5 --oneline` + `git status -sb`  
   - 勿沿用对话或旧 prompt 里的「当前主线优先级」清单（Dialect / 只读分享等），**除非** roadmap 仍明确标 🚧

2. **选题（唯一目标）**  
   - **P2b 优先**：若 `docs/roadmap.md` 有 **P2b：全站控件闭环** 🚧，且 `docs/control-matrix.md` 存在未 ✅ 的 🚧 行 → **优先啃矩阵下一行可验证切片**（修闭环 / 补 E2E / 删 💀），高于 AI、i18n、Issue 草稿投放与 CHANGELOG 整理类杂务  
   - 否则优先：已 🚧 且未收口的最高 ROI 子项（对照 CHANGELOG/代码是否真做完；做完则推进 roadmap ✅）  
   - 再否则：在 📋 / P2 / P3 未完成中，按「对北极星杠杆 × 切片可验证性」选**一刀**  
   - 一次只做一件事；切片须本 tick 内可验证；仍禁止写死功能清单，以矩阵/roadmap 状态为准

3. **执行**  
   - 若该目标已在推进：继续做到可验证收口  
   - 若停滞 / 无 WIP：立刻开做，不要只汇报计划

4. **收口**  
   验证（curl/单测/相关 E2E）+ CHANGELOG 验证点 + 文档同轮 + roadmap 状态推进 + `git commit`（遵守仓库 commit/入口规则）

5. **简报（短）**  
   本轮目标对应 roadmap 哪一行 → 做了什么 → 证据（命令/提交）→ 下一刀候选（仍从 roadmap 推导，不写死）

## 停止条件

连续两轮指标/体验变差、与用户方向冲突、或用户叫停 → 停下并说明。
