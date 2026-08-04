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
     *
     * @param scopeCsv 请求的 scope（空=客户端全部 scope）；须 ⊆ 客户端已注册 scope
     */
    OAuthTokenResponse issueClientCredentials(String clientId, String clientSecret, String scopeCsv);

    /**
     * 校验明文 access token（{@code erd_oat_…}），成功返回已注入 scope authorities 的 {@link MartinUser}。
     */
    Optional<AuthenticatedOat> authenticateAccessToken(String plaintextToken);

    void touchLastUsed(String tokenId);

    record AuthenticatedOat(MartinUser user, String tokenId, List<String> scopes) {
    }
}
