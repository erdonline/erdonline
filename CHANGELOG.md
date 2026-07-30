# Changelog

本项目所有重要变更都记录在此文件中。
格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-07-30

首个单体版本：将原 Spring Cloud 微服务后端（Martin 脚手架）与 React 前端整合为单一 monorepo。

### Added
- 统一的开源工程化：双语 README、LICENSE(MIT)、CONTRIBUTING、CODE_OF_CONDUCT、SECURITY、CI workflows、issue/PR 模板、dependabot
- 一键启动：根级 `docker-compose.yml`（mysql + redis + backend + frontend）与 `scripts/dev.sh`
- 后端统一启动类 `ErdOnlineApplication`，按业务域分包 `common/auth/system/erd/config`
- `GatewayPrefixStripFilter`：进程内剥离 `/auth`、`/syst`、`/ncnb` 前缀，替代原 API 网关
- 双数据源配置（`martin` 系统库 + `erd` 建模库），按 mapper 包路由

### Changed
- 后端由 Spring Cloud 微服务重构为单个 Spring Boot 单体应用
- 根包名统一为 `com.erdonline`（原 `com.java2e.martin`）
- 服务间 Feign 远程调用改为进程内本地 Bean 注入
- OAuth2 授权服务器与资源服务器合并至同一进程，共用 RedisTokenStore 本地校验 token

### Removed
- 服务发现（Nacos）、API 网关、Sentinel、Skywalking
- 脚手架示例/工具模块：resource、sso、swagger-demo、loco、generator、quartz、monitor
- 前端卖源码相关页面与冗余部署脚本
