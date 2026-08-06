<p align="center">
  <img src="docs/images/logo.png" alt="ERD Online" width="120"/>
</p>

<h1 align="center">ERD Online</h1>

<p align="center"><strong>Open-source, free online database modeling & metadata management platform</strong></p>

<p align="center">
  <a href="./README.md">简体中文</a> | English
</p>

<p align="center">
  <a href="./LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square"></a>
  <img alt="java" src="https://img.shields.io/badge/Java-8-orange.svg?style=flat-square">
  <img alt="spring boot" src="https://img.shields.io/badge/Spring%20Boot-2.3-brightgreen.svg?style=flat-square">
  <img alt="react" src="https://img.shields.io/badge/React-18-blue.svg?style=flat-square">
  <a href="#"><img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=flat-square"></a>
</p>

---

ERD Online offers easy-to-use metadata design, relationship diagramming, and SQL querying, complemented by version control, import/export, multi-datasource support, SQL parsing, auditing, and team collaboration — helping teams manage database metadata quickly and safely.

This repository is the **monolith** edition: the React frontend and the Spring Boot backend are unified in a single repo, and the full stack can be launched with one command — ideal for learning, self-hosting, and customization.

## ✨ Features

- 📦 **Ready to use** — focus on data structure design itself
- 🌱 **Team collaboration** — three-tier roles (owner / admin / member), element-level permissions
- 📋 **Metadata design** — clone existing tables, generate tables from JSON, default fields & naming rules
- 🏷 **Metadata management** — manage table structures online, forward-sync to databases
- 🎨 **Metadata parsing** — reverse-engineer existing databases into the platform
- 📱 **Multi-datasource** — MySQL, Oracle, DB2, SqlServer, PostgreSQL with structure sync
- 📡 **Version control** — snapshot every change, diff between versions
- 🎉 **Doc export** — one-click export to Word / HTML / Markdown
- 💯 **Online SQL** — queries, execution plans, history tracking
- 🧲 **Never lose data** — metadata operation history, restore to any version
- 🌏 **Data dictionary** — global dictionary enforcing design standards

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 · UmiJS Max · Ant Design Pro · Zustand · TypeScript |
| Backend | Spring Boot 2.3 · Spring Security OAuth2 · MyBatis-Plus · Redis |
| Storage | MySQL 8 · Redis |
| Deploy | Docker · Docker Compose · Nginx |

## 📁 Project Structure

```
erd-online/
├── backend/     # Spring Boot monolith (com.erdonline)
├── frontend/    # React frontend (UmiJS + Ant Design Pro)
├── db/          # Database init scripts
├── docs/        # Architecture / deployment / development docs
├── scripts/     # Local dev & build scripts
└── docker-compose.yml
```

## 🚀 Quick Start

### Option 1: Docker Compose (recommended)

```bash
git clone <this-repo> erd-online && cd erd-online
cp .env.example .env          # tweak ports / passwords
docker compose up -d          # mysql + redis + backend + frontend
```

Then open:

- Frontend: http://localhost:8000
- Backend API: http://localhost:9502

### Option 2: Local development

Prerequisites: JDK 8, Maven 3.6+, Node.js 16+, Yarn, MySQL 8, Redis.

```bash
# 1. Start databases (or use your own MySQL/Redis)
docker compose up -d mysql redis

# 2. Backend
cd backend && mvn spring-boot:run

# 3. Frontend (in another terminal)
cd frontend && yarn && yarn start
```

Or simply run `./scripts/dev.sh`.

## 📖 Documentation

Published docs: [https://erdonline.github.io/erdonline/](https://erdonline.github.io/erdonline/)

- [Architecture](https://erdonline.github.io/erdonline/docs/architecture)
- [Deployment](https://erdonline.github.io/erdonline/docs/deployment)
- [Development](https://erdonline.github.io/erdonline/docs/development)

Markdown sources live under `docs/` in this repo (kept in sync with the site).

## 🤝 Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) first.

## 📄 License

Released under the [MIT License](LICENSE).

## 🙏 Acknowledgements

- Frontend derived from [ERD-Online](https://www.erdonline.com/)
- Backend refactored from the Martin microservice scaffold into a monolith
