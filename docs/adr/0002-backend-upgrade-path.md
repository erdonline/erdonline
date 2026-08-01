# ADR-0002：后端直上 Spring Boot 3.5 + 现代 JWT 认证

- 状态：已接受（2026-08-01，二次修订）
- 决策者：项目维护者

## 背景

归档的 `spring-security-oauth2`（password grant + Redis opaque + Adapter）无法带到 Boot 3。ReactFlow R3 已闭环。维护者不要求兼容旧登录契约。

## 决策

- **Spring Boot 3.5.16 + JDK 17**
- **认证**：Spring Security 6 + `oauth2ResourceServer`（JWT）；`POST /auth/login`（JSON）签发 access token
- **不保留**：`/oauth/token` password grant、Basic client2、RedisTokenStore opaque、三个 `*ConfigurerAdapter`
- **前端同步改契约**：登录改 POST JSON；请求头仍 `Authorization: Bearer <jwt>`
- **社交登录整包删除**（`common.social` / SocialDetails / 微信绑定页）；动态 URL 权限仍保留，另里程碑按 Security 6 收敛

## 后果

- 正面：与官方推荐模型对齐，无归档依赖
- 代价：旧客户端/脚本若仍调 `/auth/oauth/token` 会失效，需改前端与文档
