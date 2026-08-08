<p align="center">
  <img src="docs/images/logo.png" alt="ERD Online" width="120"/>
</p>

<h1 align="center">ERD Online</h1>

<p align="center"><strong>开源、免费的在线数据库建模与元数据管理平台</strong></p>

<p align="center">
  简体中文 | <a href="./README.en-US.md">English</a>
</p>

<p align="center">
  <a href="./LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square"></a>
  <img alt="java" src="https://img.shields.io/badge/Java-17-orange.svg?style=flat-square">
  <img alt="spring boot" src="https://img.shields.io/badge/Spring%20Boot-3.5-brightgreen.svg?style=flat-square">
  <img alt="react" src="https://img.shields.io/badge/React-18-blue.svg?style=flat-square">
  <a href="https://github.com/erdonline/erdonline/stargazers"><img alt="stars" src="https://img.shields.io/github/stars/erdonline/erdonline?style=flat-square"></a>
  <a href="https://github.com/erdonline/erdonline/issues"><img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=flat-square"></a>
</p>

<p align="center">
  <a href="https://www.erdonline.com/demo"><img alt="在线体验" src="https://img.shields.io/badge/▶_在线体验-免登录-6C5CE7?style=for-the-badge"></a>
  <a href="https://erdonline.github.io/erdonline/"><img alt="文档" src="https://img.shields.io/badge/文档-在线-2D9CDB?style=for-the-badge"></a>
</p>

---

ERD Online 定位为**数据库设计的 Git + Figma**：版本与协作是壁垒，设计器体验是及格线。提供关系图画布（ReactFlow）、版本快照与 diff、导入导出、多数据源与团队权限。

本仓库是 **单体架构（monolith）**：前端与 Spring Boot 同仓，docker-compose 一键起全栈。

> **30 秒惊艳，免注册**：打开 [**www.erdonline.com/demo**](https://www.erdonline.com/demo) → 进入带 `用户`/`订单` 表的关系图，改一张表、存一个版本、看一次 diff。

## 🆚 为什么选它

| | ERD Online | dbdiagram.io | Navicat / PDManer | drawio |
|---|:---:|:---:|:---:|:---:|
| 开源免费 | ✅ MIT | ❌ | ❌ | ✅ |
| 版本快照 + diff | ✅ | ❌ | ⚠️ 手动 | ❌ |
| 实时协作 | ✅ | ❌ | ❌ | ⚠️ |
| 懂数据库（正/反向） | ✅ | ⚠️ | ✅ | ❌ |
| 团队角色与权限 | ✅ 三级 | ❌ | ⚠️ | ❌ |
| 自托管 | ✅ 一键 | ❌ | ❌ | ✅ |
| 开放 API / MCP（给 AI agent） | ✅ | ❌ | ❌ | ❌ |

## ✨ 特性

- 📦 **开箱即用**：专注数据结构设计本身
- 🌱 **团队协作**：三级权限（拥有者 / 管理员 / 普通角色），元素级权限控制
- 📋 **元数据设计**：复制已有表结构、JSON 生成表、默认字段与大小写规范
- 🏷 **元数据管理**：在线管理表结构，支持正向同步到数据库
- 🎨 **元数据解析**：将已有数据库结构反向解析入库管理
- 📱 **多数据源**：MySQL、Oracle、DB2、SqlServer、PostgreSQL 在线管理与结构同步
- 📡 **版本管理**：每次变动生成版本，版本间差异比对
- 🎉 **文档导出**：一键导出 Word / HTML / Markdown 文档
- 💯 **在线 SQL**：SQL 查询、执行计划、历史留痕
- 🧲 **永不丢失**：元数据操作历史留痕，可恢复到任意历史版本
- 🌏 **数据字典**：全局数据字典，统一设计规范

## 🏗 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 · UmiJS Max · Ant Design Pro · Zustand · TypeScript · ReactFlow |
| 后端 | Spring Boot 3.5 · JWT Resource Server · MyBatis-Plus · Redis |
| 存储 | MySQL 8 · Redis |
| 部署 | Docker · Docker Compose · Nginx |

## 📁 项目结构

```
erd-online/
├── backend/     # Spring Boot 单体后端 (com.erdonline)
├── frontend/    # React 前端 (UmiJS + Ant Design Pro)
├── db/          # 数据库初始化脚本
├── docs/        # 架构 / 部署 / 开发文档
├── scripts/     # 本地开发与构建脚本
└── docker-compose.yml
```

## 🚀 快速开始

### 方式一：Docker Compose 一键启动（推荐）

```bash
git clone <this-repo> erd-online && cd erd-online
cp .env.example .env          # 按需修改端口 / 密码
docker compose up -d          # 启动 mysql + redis + backend + frontend
```

启动后访问：

- 前端：http://localhost:8000
- 后端 API：http://localhost:9502
- 默认账号：`admin` / `123456`
- **免登录演示**：http://localhost:8000/demo（只读分享；可「复制到我的项目」）

登录后首页点 **「示例项目」**：约 30 秒进入带用户/订单表的关系图，再在「版本 → 版本管理」保存快照。

已有库需补演示种子时：`docker exec -i erd-mysql mysql -uroot -proot < db/init/08_public_demo.sql`

### 方式二：本地开发

前置：JDK **17**、Maven 3.8+、Node.js **20**、Yarn、MySQL 8、Redis。

```bash
# 1. 起数据库（或用本机已有的 MySQL/Redis）
docker compose up -d mysql redis

# 2. 后端（JDK 17；改代码后用 backend/dev-restart.sh 或 mvn compile 热加载）
cd backend && JAVA_HOME=$(/usr/libexec/java_home -v 17) SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run

# 3. 前端（另开终端）
cd frontend && yarn && yarn start
```

也可直接使用脚本：`./scripts/dev.sh`。

## 📖 文档

在线文档：[https://erdonline.github.io/erdonline/](https://erdonline.github.io/erdonline/)

- [愿景与路线图](https://erdonline.github.io/erdonline/docs/vision) · [roadmap](https://erdonline.github.io/erdonline/docs/roadmap)
- [架构说明](https://erdonline.github.io/erdonline/docs/architecture)
- [部署指南](https://erdonline.github.io/erdonline/docs/deployment)（含 [CF Pages / GitHub Secrets 清单](https://erdonline.github.io/erdonline/docs/deployment#cf-pages-setup)）· [开发指南](https://erdonline.github.io/erdonline/docs/development)

仓库内 Markdown 副本见 `docs/` 目录（与在线站同步）。

## 🤝 贡献

欢迎贡献！现代技术栈 + 一键开发环境 + CI 质量门禁，让第一个 PR 很好落地；新手可从 **good first issue** 标签起步。请先阅读 [贡献指南](CONTRIBUTING.md) 与 [行为准则](CODE_OF_CONDUCT.md)。

**如果 ERD Online 对你有用，请 [⭐ Star 一下](https://github.com/erdonline/erdonline)——这是开源项目活下去的燃料。**

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 🙏 致谢

- 前端衍生自 [ERD-Online](https://www.erdonline.com/)
- 后端基于 Martin 微服务脚手架重构为单体
