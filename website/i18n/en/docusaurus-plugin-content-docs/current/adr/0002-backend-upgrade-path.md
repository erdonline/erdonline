# ADR-0002: Backend straight to Spring Boot 3.5 + modern JWT auth

- Status: Accepted (2026-08-01, second revision)
- Decision makers: Project maintainers

## Context

Archived `spring-security-oauth2` (password grant + Redis opaque + Adapter) cannot move to Boot 3. ReactFlow R3 is closed. Maintainers do not require legacy login contract compatibility.

## Decision

- **Spring Boot 3.5.16 + JDK 17**
- **Auth**: Spring Security 6 + `oauth2ResourceServer` (JWT); `POST /auth/login` (JSON) issues access token
- **Do not keep**: `/oauth/token` password grant, Basic client2, RedisTokenStore opaque, three `*ConfigurerAdapter` classes
- **Frontend contract sync**: login uses POST JSON; header remains `Authorization: Bearer <jwt>`
- **Social login removed entirely** (`common.social` / SocialDetails / WeChat bind page); dynamic URL permissions kept, Security 6 convergence in a separate milestone

## Consequences

- Positive: aligned with official recommended model, no archived dependencies
- Cost: legacy clients/scripts still calling `/auth/oauth/token` break; frontend and docs must update
