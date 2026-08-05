# ADR-0021：第三方登录 IdP 联邦（GitHub + Google + 微信）

- 状态：**✅ 已接受**（MVP 2026-08-04；GitHub 扩展同日）
- 决策者：项目维护者（人工选题；接续 ADR-0013 RS256 后）
- 前置：[ADR-0013](./0013-public-api-mcp.md) 将「第三方 IdP 联邦」列在明确不做；本 ADR **专项解封**该条，不影响 PAT/`erd_oat_` 公开 API 面

## 背景

产品登录此前仅账密 → 会话 JWT（HS256）。ADR-0013 做好了**本系统作为 IdP**（对外 OAuth/OIDC），但未做**本系统作为 RP**（接受第三方登录）。历史社交 OAuth（password-grant 旁路、`/login/success`、微信绑定页）已删除（R-DEAD / delete-dead-code），不可回潮旧路径。

## 决策

| 议题 | 决策 |
|---|---|
| 目标 | GitHub + Google + 微信用于**应用会话登录**（与密码登录同构签发会话 JWT）；**不**与 PAT / `erd_oat_` 公开 API 混用 |
| GitHub | OAuth App Authorization Code；scope=`read:user user:email`；subject=数字 `id`；邮箱取 `/user/emails` 已验证 primary（或任一 verified）；可按已验证邮箱绑定已有用户 |
| Google | Authorization Code + OIDC：`openid email profile`；验 `email_verified`；subject=`sub`；有邮箱则按邮箱绑定已有用户，否则按 `allow-open-register` 自动建号 |
| 微信 | **微信开放平台网站应用扫码**（`open.weixin.qq.com/connect/qrconnect`，`snsapi_login`）；**不做**公众号网页授权（与 PC Web 产品不符）。subject 优先 `unionid`，否则 `openid`；无邮箱时仅按 subject 链接，建号依赖开放注册 |
| 建号 / 绑定 | 无 link 且无邮箱匹配时：`allow-open-register` 开启 → 自动建号；关闭 → 403 文案引导先账密登录再于账号设置绑定 |
| 会话签发 | 复用 `JwtTokenService.issue(MartinUser)`；回调后经 Redis 短票换票，禁止把会话 JWT 放进 URL query |
| 登出 | 与账密同源：`POST /auth/exit` + 前端 `cache.clear()`（Header「退出登录」） |
| 存储 | 新表 `user_identity_link`（provider + subject 唯一）；**不**复活 `sys_social_details` / 旧 `/auth/oauth2/**` |
| 配置 | `GITHUB_CLIENT_ID`/`SECRET`/`REDIRECT_URI`；`GOOGLE_CLIENT_ID`/`SECRET`/`REDIRECT_URI`；`WECHAT_APP_ID`/`SECRET`/`REDIRECT_URI`；缺任一即该 provider **关闭**，启动不崩溃 |
| UI | 登录页按 `/auth/federate/providers` 显示按钮；账号设置「安全」区 link/unlink（登录态） |
| CSRF | OAuth `state` 存 Redis（TTL 短）；`redirect` 仅允许相对路径 `/…` |
| 解绑语义（2026-08-05 补） | unlink **只删 `user_identity_link`（物理删除），不删本地账号**；同身份下次登录先按约定用户名（`provider_subject`）/邮箱找回孤儿账号并**重新挂接**，而非当新用户创建——避免「解绑→重新登录」撞用户名/唯一键报「已存在」。重新挂接前用 `canRelink` 防劫持：候选账号若已挂着同 provider 的**别的** subject 视为非孤儿，拒绝挂接 |

## 后果

- 正面：PC 用户可用 GitHub / Google / 微信扫码进入同一会话面；自托管可选开启；解绑→重新登录不丢失本地账号数据（版本/项目归属不受影响）
- 代价：多一套出站 OAuth 回调运维；开放注册关时「无本地账号」须提示联系管理员或先密码登录绑定；`user_identity_link` 唯一键 `(provider, subject)` 不感知逻辑删除，故该表的 delete 必须走物理删除（`UserIdentityLinkMapper#physicalDeleteById`），不可用 MP 默认 `deleteById`
- 明确不做：回潮 password-grant / `/login/success` / `/account/settings/wechat`；微信公众号网页授权；用联邦票直调 `/api/v1/**`；解绑不做「孤儿账号软删/清理」——本地账号一律保留，交由用户自己决定是否重新绑定
