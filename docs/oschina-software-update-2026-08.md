# OSCHINA 软件更新新闻投递稿

> 依据 [OSCHINA 投递新闻和添加软件操作指南](https://www.oschina.net/question/2918182_2266982) 编写。  
> 产品版本号取自 `frontend/package.json`（**5.0.0**）。投递前确认 OSCHINA 已收录「ERD Online」。

---

## 推荐标题（择一使用）

**首选（软件更新新闻）：**

```
ERD Online 5.0.0 更新：字段库表单化、DDL 四库模板与登录体验修复
```

**备选：**

```
ERD Online v5.0.0 发布：开源数据库建模工具新增字段库与后端 DDL 引擎
```

```
ERD Online 5.0.0：数据库设计 Git + Figma，字段库 MVP 与 Freemarker DDL 导出
```

**若首次「添加软件」时用：**

```
ERD Online 5.0.0 正式发布：带版本管理的数据库建模与协作平台
```

---

## 表单字段

| 字段 | 内容 |
|---|---|
| **所属软件** | ERD Online |
| **新闻标题** | ERD Online 5.0.0 更新：字段库表单化、DDL 四库模板与登录体验修复 |
| **新闻出处** | https://github.com/erdonline/erdonline/blob/main/CHANGELOG.md |
| **授权协议** | MIT |

---

## 正文（复制至投递编辑器）

## 更新内容

ERD Online **5.0.0** 本次迭代主要围绕建模复用、DDL 导出与登录体验。

### 字段库

- 后端字段库 MVP 落地（platform / group / user 三级 scope，copy-on-apply 写入）
- 新建/编辑改为 Form.List 表单，不再手写 JSON
- 项目菜单「设置」可直接进入数据类型字典与字段库
- 表设计 JExcel 工具栏支持「从字段库写入」，含追加与覆盖模式

### DDL 模板

- 导出 SQL 统一由后端 Freemarker 引擎生成，前端不再本地拼 DDL
- DDL 模板支持 MySQL、Oracle、PostgreSQL、SQL Server 四库方言
- 未自定义模板以灰色只读示例展示，便于导出前核对
- DDL API 与版本 API 分域（`/ncnb/projectDdl/*`）

### 登录与会话

- 修复 JWT 过期后登录页第三方登录按钮消失的问题
- Web 会话 JWT 默认有效期由 12 小时调整为 7 天（环境变量 `JWT_EXPIRES_IN` 可配置）

### 其他

- 逆向解析支持选择导入目标模块，修复二次导入崩溃
- 文档站 GitHub Pages 双语构建修复

## 未来计划

- 字段库团队级治理与跨表复用体验完善
- ReactFlow 画布迁移（Strangler 模式）持续推进
- 评估 Web 会话 refresh 机制

## 下载与体验

- **在线 Demo（免登录，约 30 秒进关系图）**：https://www.erdonline.com/demo
- **工具对照（vs dbdiagram / DBML 等）**：https://www.erdonline.com/compare
- 源码（v5.0.0）：https://github.com/erdonline/erdonline
- 项目文档：https://doc.erdonline.com/
- 本地启动：

```bash
git clone https://github.com/erdonline/erdonline.git
cd erdonline
docker-compose up -d mysql redis
./backend/dev-ensure.sh
cd frontend && yarn start
```

浏览器访问 http://localhost:8000 。

## 软件介绍

ERD Online 5.0.0 是 MIT 许可的开源数据库建模工具，定位「数据库设计的 Git + Figma」——以 projectJSON 与版本体系管理 schema 演进，支持团队协作、多数据源正反向工程、DDL 导出与官方模板广场。技术栈：React + UmiJS + antd / Spring Boot + MyBatis + Flyway。

---

## 附：「添加软件」正文（尚未收录时使用）

**软件名称：** ERD Online  
**版本：** 5.0.0  
**授权协议：** MIT

## 简介

ERD Online 5.0.0 是 MIT 许可的开源数据库建模工具，把版本管理与协作带入 ER 设计。项目以 projectJSON 作为单一事实源，支持版本 diff、实库探测、多数据源正反向工程、DDL 导出与官方模板广场。

## 主要特性

- **版本管理**：保存版本、跨版本 diff、增量 DDL 脚本生成
- **协作建模**：项目成员、审批流、SocketIO 在线 presence
- **正反向工程**：MySQL / PostgreSQL / Oracle / SQL Server 逆向导入；DBML 导入导出
- **字段库**：平台/团队/个人三级字段复用（copy-on-apply）
- **模板广场**：公开浏览、安装、评分与发布审核
- **自托管**：docker-compose 一键起 MySQL/Redis

## 快速开始

```bash
git clone https://github.com/erdonline/erdonline.git
cd erdonline
docker-compose up -d mysql redis
./backend/dev-ensure.sh
cd frontend && yarn start
```

- 在线 Demo：https://www.erdonline.com/demo
- 工具对照：https://www.erdonline.com/compare
- 文档：https://doc.erdonline.com/docs/development

---

## 投递检查清单

- [ ] OSCHINA 已收录「ERD Online」
- [ ] 标题含 **ERD Online + 5.0.0 + 更新要点**
- [ ] 正文含：更新内容、未来计划、下载地址、软件介绍
- [ ] 新闻出处已填 CHANGELOG 链接
- [ ] 标题从二级起；中文标点；无额外 CSS
