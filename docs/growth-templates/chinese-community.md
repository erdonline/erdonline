# 中文社区推广模板

> **平台**：掘金、V2EX、知乎、SegmentFault  
> **频率**：每周一次  
> **执行人**：cheap model 生成初稿，你审核

---

## 平台选择策略

| 平台 | 发布时间 | 内容类型 | 目标 |
|---|---|---|---|
| 掘金 | 周二 | 技术深度 | 开发者流量 |
| V2EX | 周三 | 产品发布 | 早期用户 |
| 知乎 | 周四 | 问答/专栏 | 长尾 SEO |
| SegmentFault | 周五 | 技术问答 | 开发者流量 |

---

## 掘金模板

### 标题

```
开源项目推荐：ERD Online - 数据库设计的 Git + Figma
```

**备选**：
- `我开源了一个数据库设计工具，支持版本管理和实时协作`
- `数据库设计工具的未来：版本化 + 协作化 + AI 集成`

### 正文

```markdown
## 为什么做这个项目

市面上的数据库设计工具都有明显的短板：

- **dbdiagram**：好看易用，但闭源、无版本管理
- **Navicat/PDManer**：功能强大，但太重、桌面端、单机
- **drawio**：免费灵活，但不懂数据库（没有外键语义）

我想要一个工具：
- 像 Git 一样管理 schema 版本
- 像 Figma 一样实时协作
- 懂数据库（外键、索引、约束）
- 开源、可自部署

于是有了 **ERD Online**。

## 核心特性

### 1. 版本管理（像 Git）

每次保存自动生成版本，可以：
- 对比任意两个版本的 diff
- 回滚到任意版本
- 查看谁在什么时候改了什么

### 2. 实时协作（像 Figma）

多人同时编辑同一个关系图，实时看到对方的光标和修改。支持评审和审批流。

### 3. MCP 集成（AI Agent）

AI Agent（Cursor、Claude）可以通过 MCP 读取你的 schema，并通过 `create_version` 建议变更。你仍然在设计器里 diff 和审批。

**关键边界**：AI Agent 读写的是设计器同一份 projectJSON，不会凭一句话生成新图。

### 4. 开源 + 自部署

- MIT 协议
- Docker Compose 一键部署
- 数据完全在你手里

## 技术栈

- 前端：React 18 + UmiJS + TypeScript
- 后端：Spring Boot 3.5 + PostgreSQL
- 实时：WebSocket + CRDT
- 部署：Docker Compose

## 快速体验

**在线 Demo**（无需注册）：https://www.erdonline.com/demo

**GitHub**：https://github.com/erdonline/erdonline

**文档**：https://doc.erdonline.com

## 求 Star

如果对你有帮助，欢迎 Star ⭐️

也欢迎提 Issue 和 PR！

## 反馈

我想听听你的看法：
1. 版本管理的方式（Git-like snapshots + diff）合理吗？
2. MCP 集成的边界（AI 读取 + 建议，人审批）合适吗？
3. 你会在什么场景下用这个工具？
```

---

## V2EX 模板

### 标题

```
[开源] ERD Online - 数据库设计的 Git + Figma（支持版本管理和实时协作）
```

### 正文

```markdown
大家好，我开源了一个数据库设计工具 ERD Online。

## 解决什么问题

现有工具的痛点：
- dbdiagram 闭源、无版本管理
- Navicat/PDManer 太重、单机
- drawio 不懂数据库

## 核心特性

1. **版本管理**：每次保存自动生成版本，可 diff、可回滚
2. **实时协作**：多人同时编辑，像 Figma
3. **MCP 集成**：AI Agent 可读写 schema（通过 MCP 协议）
4. **开源**：MIT 协议，Docker Compose 一键部署

## 技术栈

- React 18 + Spring Boot 3.5 + PostgreSQL
- WebSocket + CRDT（实时协作）
- projectJSON（开放格式）

## 在线体验

Demo（无需注册）：https://www.erdonline.com/demo

GitHub：https://github.com/erdonline/erdonline

## 求反馈

1. 你会在什么场景下用这个工具？
2. 什么功能会让你觉得"必须有"？
3. 有什么好建议？

谢谢大家！
```

---

## 知乎模板

### 问题 1：有什么好的数据库设计工具推荐？

**回答**：

```markdown
推荐 **ERD Online**，一个开源的数据库设计工具。

## 为什么推荐

市面上的工具都有短板：
- dbdiagram 闭源、无版本管理
- Navicat/PDManer 太重、单机
- drawio 不懂数据库

ERD Online 的优势：
1. **版本管理**：像 Git 一样管理 schema 版本，可 diff、可回滚
2. **实时协作**：像 Figma 一样多人同时编辑
3. **MCP 集成**：AI Agent 可读写 schema
4. **开源**：MIT 协议，可自部署

## 在线体验

Demo（无需注册）：https://www.erdonline.com/demo

GitHub：https://github.com/erdonline/erdonline

## 适合谁

- 需要版本管理的团队
- 需要实时协作的团队
- 需要自部署的团队
- 想用 AI Agent 管理 schema 的团队
```

### 问题 2：如何管理数据库 schema 的版本？

**回答**：

```markdown
推荐用 **ERD Online**，它把 schema 当代码一样管理。

## 核心思路

每次保存自动生成版本，可以：
- 对比任意两个版本的 diff
- 回滚到任意版本
- 查看谁在什么时候改了什么

## 具体做法

1. 在 ERD Online 里设计 schema
2. 每次修改后保存，自动生成版本
3. 需要回滚时，选择历史版本，一键恢复
4. 需要协作时，多人同时编辑，实时同步

## 技术优势

- projectJSON 开放格式，永不破坏
- Git-like snapshots + diff
- 支持评审和审批流

## 在线体验

Demo：https://www.erdonline.com/demo

GitHub：https://github.com/erdonline/erdonline
```

---

## SegmentFault 模板

### 问题：如何实现数据库 schema 的版本管理？

**回答**：

```markdown
可以用 **ERD Online**，它实现了 Git-like 的 schema 版本管理。

## 实现原理

1. **projectJSON**：语言无关的 schema 表示格式
2. **Snapshots**：每次保存生成完整快照（不是 delta）
3. **Diff**：按需计算两个版本的差异
4. **Rollback**：回滚生成新版本（不删除历史）

## 代码示例

```json
{
  "version": "1.0.0",
  "modules": [
    {
      "name": "用户模块",
      "entities": [
        {
          "name": "user",
          "fields": [
            { "name": "id", "type": "BIGINT", "pk": true },
            { "name": "email", "type": "VARCHAR(255)" }
          ]
        }
      ]
    }
  ]
}
```

## 开源实现

GitHub：https://github.com/erdonline/erdonline

核心代码：
- 版本管理：`backend/src/main/java/.../VersionService.java`
- Diff 计算：`backend/src/main/java/.../DiffService.java`
- 前端渲染：`frontend/src/pages/design/`

## 在线体验

Demo：https://www.erdonline.com/demo
```

---

## 发布 Checklist

### 发布前

- [ ] 选择平台（掘金 / V2EX / 知乎 / SegmentFault）
- [ ] 使用对应的模板生成初稿
- [ ] 你审核并修改
- [ ] 测试 Demo 链接可用性

### 发布

- [ ] 在平台活跃时间发布（通常是工作日晚上 8-10 点）
- [ ] 发布后 1 小时内回复所有评论
- [ ] 24 小时后再回复一轮

### 发布后

- [ ] 统计流量和注册
- [ ] 把有价值的评论整理到 GitHub Issues
- [ ] 把链接加到 README（如果反响好）

---

## 成功指标

- **最低目标**：100+ 阅读，5+ 注册
- **理想目标**：1000+ 阅读，50+ 注册
- **失败线**：< 50 阅读 → 复盘问题（标题？内容？平台选择？）

---

## 注意事项

- **不要刷屏**：每个平台每周最多发一次
- **不要自我推广过度**：先提供价值，再提产品
- **不要争辩**：如果有人批评，礼貌回应，不要争辩
- **遵守规则**：有些平台禁止自我推广，先读规则
