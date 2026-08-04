package com.erdonline.erd.publicapi;

import com.erdonline.common.security.userdetail.MartinUser;

import java.util.List;
import java.util.Optional;

public interface OAuthApiClientService {

    OAuthClientCreatedView create(CreateOAuthClientRequest request);

    List<OAuthClientSummaryView> listMine();

    void revoke(String id);

    /**
     * client_credentials：校验 client_id + client_secret，签发短期 access_token（明文仅返回一次）。
     * public 客户端拒绝。不签发 refresh_token。
     *
     * @param scopeCsv 请求的 scope（空=客户端全部 scope）；须 ⊆ 客户端已注册 scope
     */
    OAuthTokenResponse issueClientCredentials(String clientId, String clientSecret, String scopeCsv);

    /**
     * Authorization Code 同意页预览：校验 PKCE/redirect/scope，不签发 code。
     * {@code nonce} 可选（OIDC）；仅校验长度，预览不落库。
     */
    OAuthConsentView previewAuthorization(
            String clientId,
            String redirectUri,
            String scopeCsv,
            String state,
            String codeChallenge,
            String codeChallengeMethod,
            String nonce);

    /**
     * Authorization Code：用户显式 Allow 后签发短命 code（明文返回一次，库中仅哈希）。
     * 要求 PKCE S256、state 非空、redirect_uri 精确匹配注册表。
     * {@code nonce} 可选（OIDC）；绑定进 code，换票写入 id_token。
     */
    AuthCodeIssued createAuthorizationCode(
            String clientId,
            String redirectUri,
            String scopeCsv,
            String state,
            String codeChallenge,
            String codeChallengeMethod,
            String nonce);

    /**
     * redirect_uri 是否对活跃 client 精确注册（用于 authorize 错误回跳，防开放重定向）。
     */
    boolean isRedirectUriRegistered(String clientId, String redirectUri);

    /**
     * authorization_code + PKCE 换票。public：无 secret；confidential：须 secret（body 或 Basic）。
     * 签发 access_token + refresh_token（轮换族）。
     */
    OAuthTokenResponse exchangeAuthorizationCode(
            String clientId,
            String clientSecret,
            String code,
            String redirectUri,
            String codeVerifier);

    /**
     * refresh_token 换票：校验后吊销旧 refresh，签发新 access + refresh（同 family）。
     * 若提交已轮换/已吊销的 refresh → 整族吊销（复用检测）并 invalid_grant。
     */
    OAuthTokenResponse refreshAccessToken(
            String clientId,
            String clientSecret,
            String refreshToken,
            String scopeCsv);

    /**
     * RFC 7009 风格吊销：按前缀识别 access / refresh；未知票也视为成功（防探测）。
     * confidential 须 secret；public 不得带 secret。
     */
    void revokePresentedToken(String clientId, String clientSecret, String token, String tokenTypeHint);

    /**
     * 校验明文 access token（{@code erd_oat_…}），成功返回已注入 scope authorities 的 {@link MartinUser}。
     */
    Optional<AuthenticatedOat> authenticateAccessToken(String plaintextToken);

    void touchLastUsed(String tokenId);

    record AuthenticatedOat(MartinUser user, String tokenId, List<String> scopes) {
    }

    record AuthCodeIssued(String code, String state, String redirectUri) {
    }
}
