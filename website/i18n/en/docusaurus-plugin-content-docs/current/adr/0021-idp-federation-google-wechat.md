# ADR-0021: Third-party login IdP federation (GitHub + Google + WeChat)

- Status: **✅ Accepted** (MVP 2026-08-04; GitHub extension same day)
- Decision makers: Project maintainers (manual topic selection; after ADR-0013 RS256)
- Prerequisite: [ADR-0013](/docs/adr/public-api-mcp) listed "third-party IdP federation" as explicit non-goal; this ADR **special unblocks** that item, does not affect PAT/`erd_oat_` public API surface

## Context

Product login was password-only → session JWT (HS256). ADR-0013 made **this system as IdP** (outbound OAuth/OIDC), but not **this system as RP** (accept third-party login). Legacy social OAuth (password-grant bypass, `/login/success`, WeChat bind page) deleted (R-DEAD / delete-dead-code), must not revive old paths.

## Decision

| Topic | Decision |
|---|---|
| Goal | GitHub + Google + WeChat for **application session login** (same session JWT as password); **do not** mix with PAT / `erd_oat_` public API |
| GitHub | OAuth App Authorization Code; scope=`read:user user:email`; subject=numeric `id`; email from `/user/emails` verified primary (or any verified); may bind existing user by verified email |
| Google | Authorization Code + OIDC: `openid email profile`; verify `email_verified`; subject=`sub`; with email bind existing user by email, else auto-create per `allow-open-register` |
| WeChat | **WeChat Open Platform website app QR** (`open.weixin.qq.com/connect/qrconnect`, `snsapi_login`); **no** official account web auth (not PC Web product). Subject prefers `unionid`, else `openid`; no email — link by subject only, create account depends on open registration |
| Account create / bind | No link and no email match: `allow-open-register` on → auto-create; off → 403 message guide password login then bind in account settings |
| Session issue | Reuse `JwtTokenService.issue(MartinUser)`; after callback exchange via Redis short ticket, forbid session JWT in URL query |
| Logout | Same as password: `POST /auth/exit` + frontend `cache.clear()` (Header "Sign out") |
| Storage | New table `user_identity_link` (provider + subject unique); **do not** revive `sys_social_details` / old `/auth/oauth2/**` |
| Config | `GITHUB_CLIENT_ID`/`SECRET`/`REDIRECT_URI`; `GOOGLE_CLIENT_ID`/`SECRET`/`REDIRECT_URI`; `WECHAT_APP_ID`/`SECRET`/`REDIRECT_URI`; missing any → that provider **off**, startup does not crash |
| UI | Login page shows buttons per `/auth/federate/providers`; account settings "Security" link/unlink (logged in) |
| CSRF | OAuth `state` in Redis (short TTL); `redirect` only relative path `/…` |
| Unlink semantics (2026-08-05 addendum) | unlink **only deletes `user_identity_link` (physical delete), does not delete local account**; same identity next login first finds orphan account by convention username (`provider_subject`)/email and **re-attaches**, not new user — avoids "unlink→re-login" username/unique key "already exists". Before re-attach use `canRelink` anti-hijack: if candidate account already has same provider **different** subject, treat as non-orphan, reject attach |

## Consequences

- Positive: PC users enter same session via GitHub / Google / WeChat QR; self-host optional; unlink→re-login does not lose local account data (version/project ownership unaffected)
- Cost: extra outbound OAuth callback ops; when open registration off "no local account" must prompt contact admin or password login first; `user_identity_link` unique `(provider, subject)` ignores logical delete, so delete must be physical (`UserIdentityLinkMapper#physicalDeleteById`), not MP default `deleteById`
- Explicitly not doing: revive password-grant / `/login/success` / `/account/settings/wechat`; official account web auth; federated ticket direct call `/api/v1/**`; unlink does not "orphan account soft-delete/cleanup" — local account always kept, user decides re-bind
