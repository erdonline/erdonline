package com.erdonline.erd.publicapi;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.entity.OAuthAccessToken;
import com.erdonline.erd.entity.OAuthApiClient;
import com.erdonline.erd.entity.OAuthAuthorizationCode;
import com.erdonline.erd.entity.OAuthRefreshToken;
import com.erdonline.erd.mapper.OAuthAccessTokenMapper;
import com.erdonline.erd.mapper.OAuthApiClientMapper;
import com.erdonline.erd.mapper.OAuthAuthorizationCodeMapper;
import com.erdonline.erd.mapper.OAuthRefreshTokenMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OAuthApiClientServiceImpl
        extends ServiceImpl<OAuthApiClientMapper, OAuthApiClient>
        implements OAuthApiClientService {

    private static final String REVOKED = "1";
    private static final String ACTIVE = "0";
    private static final String CONSUMED = "1";

    private final OAuthAccessTokenMapper oauthAccessTokenMapper;
    private final OAuthAuthorizationCodeMapper oauthAuthorizationCodeMapper;
    private final OAuthRefreshTokenMapper oauthRefreshTokenMapper;
    private final OidcIdTokenService oidcIdTokenService;

    public OAuthApiClientServiceImpl(
            OAuthAccessTokenMapper oauthAccessTokenMapper,
            OAuthAuthorizationCodeMapper oauthAuthorizationCodeMapper,
            OAuthRefreshTokenMapper oauthRefreshTokenMapper,
            OidcIdTokenService oidcIdTokenService) {
        this.oauthAccessTokenMapper = oauthAccessTokenMapper;
        this.oauthAuthorizationCodeMapper = oauthAuthorizationCodeMapper;
        this.oauthRefreshTokenMapper = oauthRefreshTokenMapper;
        this.oidcIdTokenService = oidcIdTokenService;
    }

    @Value("${erd.public-api.oauth-access-token-ttl-seconds:3600}")
    private long accessTokenTtlSeconds;

    @Value("${erd.public-api.oauth-auth-code-ttl-seconds:120}")
    private long authCodeTtlSeconds;

    @Value("${erd.public-api.oauth-refresh-token-ttl-seconds:2592000}")
    private long refreshTokenTtlSeconds;

    @Override
    public OAuthClientCreatedView create(CreateOAuthClientRequest request) {
        MartinUser user = SecurityContextUtil.getAccessUser();
        Set<String> scopes = PatScopes.normalizeForMint(request.getScopes());
        String clientType = OAuthClientCodec.normalizeClientType(request.getClientType());
        String redirectJoined = OAuthClientCodec.joinRedirectUris(request.getRedirectUris());
        if (OAuthClientCodec.CLIENT_TYPE_PUBLIC.equals(clientType)) {
            if (!StringUtils.hasText(redirectJoined)) {
                throw new IllegalArgumentException("public client requires redirectUris");
            }
        }

        String clientId = OAuthClientCodec.generateClientId();
        String plaintextSecret = null;
        String secretHash;
        String secretHint;
        if (OAuthClientCodec.CLIENT_TYPE_PUBLIC.equals(clientType)) {
            // UNIQUE(client_secret_hash)：存不可复用 ghost，永不下发明文
            String ghost = OAuthClientCodec.generateClientSecret();
            secretHash = OAuthClientCodec.hash(ghost);
            secretHint = "public";
        } else {
            plaintextSecret = OAuthClientCodec.generateClientSecret();
            secretHash = OAuthClientCodec.hash(plaintextSecret);
            secretHint = OAuthClientCodec.hint(plaintextSecret);
        }

        OAuthApiClient row = new OAuthApiClient();
        row.setClientId(clientId);
        row.setUserId(user.getId());
        row.setUsername(user.getUsername());
        row.setName(request.getName().trim());
        row.setClientType(clientType);
        row.setClientSecretHash(secretHash);
        row.setClientSecretHint(secretHint);
        row.setScopes(PatScopes.toCsv(scopes));
        row.setRedirectUris(redirectJoined);
        row.setRevoked(ACTIVE);
        save(row);

        return OAuthClientCreatedView.builder()
                .id(row.getId())
                .clientId(clientId)
                .name(row.getName())
                .clientType(clientType)
                .scopes(new ArrayList<>(scopes))
                .redirectUris(OAuthClientCodec.parseRedirectUris(redirectJoined))
                .clientSecretHint(row.getClientSecretHint())
                .createTime(row.getCreateTime())
                .clientSecret(plaintextSecret)
                .build();
    }

    @Override
    public List<OAuthClientSummaryView> listMine() {
        MartinUser user = SecurityContextUtil.getAccessUser();
        return list(new LambdaQueryWrapper<OAuthApiClient>()
                .eq(OAuthApiClient::getUserId, user.getId())
                .orderByDesc(OAuthApiClient::getCreateTime))
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void revoke(String id) {
        if (!StringUtils.hasText(id)) {
            throw new IllegalArgumentException("id required");
        }
        MartinUser user = SecurityContextUtil.getAccessUser();
        OAuthApiClient row = getOne(new LambdaQueryWrapper<OAuthApiClient>()
                .eq(OAuthApiClient::getId, id)
                .eq(OAuthApiClient::getUserId, user.getId())
                .last("LIMIT 1"));
        if (row == null) {
            throw new IllegalArgumentException("client not found");
        }
        row.setRevoked(REVOKED);
        updateById(row);
        oauthAccessTokenMapper.update(null, new LambdaUpdateWrapper<OAuthAccessToken>()
                .eq(OAuthAccessToken::getClientPk, row.getId())
                .eq(OAuthAccessToken::getRevoked, ACTIVE)
                .set(OAuthAccessToken::getRevoked, REVOKED));
        oauthRefreshTokenMapper.update(null, new LambdaUpdateWrapper<OAuthRefreshToken>()
                .eq(OAuthRefreshToken::getClientPk, row.getId())
                .eq(OAuthRefreshToken::getRevoked, ACTIVE)
                .set(OAuthRefreshToken::getRevoked, REVOKED));
        // 吊销未消费的 auth code
        oauthAuthorizationCodeMapper.update(null, new LambdaUpdateWrapper<OAuthAuthorizationCode>()
                .eq(OAuthAuthorizationCode::getClientPk, row.getId())
                .eq(OAuthAuthorizationCode::getConsumed, ACTIVE)
                .set(OAuthAuthorizationCode::getConsumed, CONSUMED));
    }

    @Override
    public OAuthTokenResponse issueClientCredentials(String clientId, String clientSecret, String scopeCsv) {
        if (!StringUtils.hasText(clientId) || !StringUtils.hasText(clientSecret)) {
            throw new IllegalArgumentException("invalid_client");
        }
        if (!OAuthClientCodec.looksLikeClientId(clientId.trim())) {
            throw new IllegalArgumentException("invalid_client");
        }
        OAuthApiClient client = loadActiveClient(clientId.trim());
        if (client == null) {
            throw new IllegalArgumentException("invalid_client");
        }
        if (OAuthClientCodec.CLIENT_TYPE_PUBLIC.equals(normalizeStoredType(client))) {
            throw new IllegalArgumentException("unauthorized_client");
        }
        if (!OAuthClientCodec.hashEquals(
                OAuthClientCodec.hash(clientSecret), client.getClientSecretHash())) {
            throw new IllegalArgumentException("invalid_client");
        }

        Set<String> allowed = PatScopes.parse(client.getScopes());
        Set<String> granted = resolveRequestedScopes(allowed, scopeCsv);
        return mintAccessTokenOnly(client, client.getUserId(), client.getUsername(), granted);
    }

    @Override
    public OAuthConsentView previewAuthorization(
            String clientId,
            String redirectUri,
            String scopeCsv,
            String state,
            String codeChallenge,
            String codeChallengeMethod,
            String nonce) {
        ConsentPrep prep = prepareConsent(
                clientId, redirectUri, scopeCsv, state, codeChallenge, codeChallengeMethod, nonce);
        return OAuthConsentView.builder()
                .clientId(prep.client().getClientId())
                .clientName(prep.client().getName())
                .clientType(normalizeStoredType(prep.client()))
                .scopes(new ArrayList<>(prep.granted()))
                .redirectUri(prep.redirectUri())
                .redirectHost(OAuthClientCodec.redirectHost(prep.redirectUri()))
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AuthCodeIssued createAuthorizationCode(
            String clientId,
            String redirectUri,
            String scopeCsv,
            String state,
            String codeChallenge,
            String codeChallengeMethod,
            String nonce) {
        MartinUser user = SecurityContextUtil.getAccessUser();
        ConsentPrep prep = prepareConsent(
                clientId, redirectUri, scopeCsv, state, codeChallenge, codeChallengeMethod, nonce);

        long ttl = Math.max(30, Math.min(600, authCodeTtlSeconds));
        String plaintext = OAuthClientCodec.generateAuthorizationCode();
        OAuthAuthorizationCode row = new OAuthAuthorizationCode();
        row.setCodeHash(OAuthClientCodec.hash(plaintext));
        row.setClientPk(prep.client().getId());
        row.setClientId(prep.client().getClientId());
        row.setUserId(user.getId());
        row.setUsername(user.getUsername());
        row.setRedirectUri(prep.redirectUri());
        row.setScopes(PatScopes.toCsv(prep.granted()));
        row.setCodeChallenge(prep.codeChallenge());
        row.setCodeChallengeMethod(OAuthClientCodec.PKCE_S256);
        row.setNonce(prep.nonce());
        row.setExpireTime(LocalDateTime.now().plusSeconds(ttl));
        row.setConsumed(ACTIVE);
        oauthAuthorizationCodeMapper.insert(row);

        return new AuthCodeIssued(plaintext, state.trim(), prep.redirectUri());
    }

    /**
     * 校验 authorize 参数并解析 granted scopes；不写库。
     * 调用方须已登录（Allow 路径会再取用户）。
     */
    private ConsentPrep prepareConsent(
            String clientId,
            String redirectUri,
            String scopeCsv,
            String state,
            String codeChallenge,
            String codeChallengeMethod,
            String nonce) {
        if (!StringUtils.hasText(state) || state.trim().length() > 512) {
            throw new IllegalArgumentException("invalid_request:state");
        }
        if (!StringUtils.hasText(clientId) || !OAuthClientCodec.looksLikeClientId(clientId.trim())) {
            throw new IllegalArgumentException("invalid_client");
        }
        OAuthClientCodec.validateRedirectUriShape(redirectUri);
        if (!OAuthClientCodec.PKCE_S256.equalsIgnoreCase(
                codeChallengeMethod == null ? "" : codeChallengeMethod.trim())) {
            throw new IllegalArgumentException("invalid_request:code_challenge_method");
        }
        String challenge = codeChallenge == null ? "" : codeChallenge.trim();
        if (!OAuthClientCodec.isValidCodeChallenge(challenge)) {
            throw new IllegalArgumentException("invalid_request:code_challenge");
        }
        String normalizedNonce = OidcIdTokenService.normalizeNonce(nonce);

        OAuthApiClient client = loadActiveClient(clientId.trim());
        if (client == null) {
            throw new IllegalArgumentException("invalid_client");
        }
        String exactRedirect = redirectUri.trim();
        if (!OAuthClientCodec.redirectUriAllowed(client.getRedirectUris(), exactRedirect)) {
            throw new IllegalArgumentException("invalid_request:redirect_uri");
        }

        Set<String> allowed = PatScopes.parse(client.getScopes());
        Set<String> granted = resolveRequestedScopes(allowed, scopeCsv);
        return new ConsentPrep(client, exactRedirect, granted, challenge, normalizedNonce);
    }

    private record ConsentPrep(
            OAuthApiClient client,
            String redirectUri,
            Set<String> granted,
            String codeChallenge,
            String nonce) {
    }

    @Override
    public boolean isRedirectUriRegistered(String clientId, String redirectUri) {
        if (!StringUtils.hasText(clientId) || !StringUtils.hasText(redirectUri)) {
            return false;
        }
        if (!OAuthClientCodec.looksLikeClientId(clientId.trim())) {
            return false;
        }
        try {
            OAuthClientCodec.validateRedirectUriShape(redirectUri.trim());
        } catch (IllegalArgumentException ex) {
            return false;
        }
        OAuthApiClient client = loadActiveClient(clientId.trim());
        return client != null
                && OAuthClientCodec.redirectUriAllowed(client.getRedirectUris(), redirectUri.trim());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OAuthTokenResponse exchangeAuthorizationCode(
            String clientId,
            String clientSecret,
            String code,
            String redirectUri,
            String codeVerifier) {
        if (!StringUtils.hasText(clientId) || !OAuthClientCodec.looksLikeClientId(clientId.trim())) {
            throw new IllegalArgumentException("invalid_client");
        }
        if (!StringUtils.hasText(code) || !OAuthClientCodec.looksLikeAuthorizationCode(code.trim())) {
            throw new IllegalArgumentException("invalid_grant");
        }
        if (!StringUtils.hasText(redirectUri)) {
            throw new IllegalArgumentException("invalid_request");
        }
        if (!OAuthClientCodec.isValidCodeVerifier(codeVerifier)) {
            throw new IllegalArgumentException("invalid_grant");
        }

        OAuthApiClient client = loadActiveClient(clientId.trim());
        if (client == null) {
            throw new IllegalArgumentException("invalid_client");
        }
        assertClientAuthForTokenEndpoint(client, clientSecret);

        String codeHash = OAuthClientCodec.hash(code.trim());
        OAuthAuthorizationCode authCode = oauthAuthorizationCodeMapper.selectOne(
                new LambdaQueryWrapper<OAuthAuthorizationCode>()
                        .eq(OAuthAuthorizationCode::getCodeHash, codeHash)
                        .last("LIMIT 1"));
        if (authCode == null) {
            throw new IllegalArgumentException("invalid_grant");
        }
        // 无论成败：已消费则拒绝；首次命中即标记消费（防并行重放）
        if (CONSUMED.equals(authCode.getConsumed())) {
            throw new IllegalArgumentException("invalid_grant");
        }
        authCode.setConsumed(CONSUMED);
        oauthAuthorizationCodeMapper.updateById(authCode);

        if (!client.getId().equals(authCode.getClientPk())
                || !client.getClientId().equals(authCode.getClientId())) {
            throw new IllegalArgumentException("invalid_grant");
        }
        if (authCode.getExpireTime() != null && authCode.getExpireTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("invalid_grant");
        }
        if (!redirectUri.trim().equals(authCode.getRedirectUri())) {
            throw new IllegalArgumentException("invalid_grant");
        }
        if (!OAuthClientCodec.PKCE_S256.equals(authCode.getCodeChallengeMethod())
                || !OAuthClientCodec.verifyPkceS256(codeVerifier, authCode.getCodeChallenge())) {
            throw new IllegalArgumentException("invalid_grant");
        }

        Set<String> granted = PatScopes.parse(authCode.getScopes());
        if (granted.isEmpty()) {
            throw new IllegalArgumentException("invalid_scope");
        }
        // OAT+ORT 以授权用户身份（非注册人）；新建轮换族；nonce 仅此路径进 id_token
        String familyId = newFamilyId();
        return mintTokenPair(
                client,
                authCode.getUserId(),
                authCode.getUsername(),
                granted,
                familyId,
                authCode.getNonce());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OAuthTokenResponse refreshAccessToken(
            String clientId,
            String clientSecret,
            String refreshToken,
            String scopeCsv) {
        if (!StringUtils.hasText(clientId) || !OAuthClientCodec.looksLikeClientId(clientId.trim())) {
            throw new IllegalArgumentException("invalid_client");
        }
        if (!StringUtils.hasText(refreshToken)
                || !OAuthClientCodec.looksLikeRefreshToken(refreshToken.trim())) {
            throw new IllegalArgumentException("invalid_grant");
        }

        OAuthApiClient client = loadActiveClient(clientId.trim());
        if (client == null) {
            throw new IllegalArgumentException("invalid_client");
        }
        assertClientAuthForTokenEndpoint(client, clientSecret);

        String tokenHash = OAuthClientCodec.hash(refreshToken.trim());
        OAuthRefreshToken row = oauthRefreshTokenMapper.selectOne(new LambdaQueryWrapper<OAuthRefreshToken>()
                .eq(OAuthRefreshToken::getTokenHash, tokenHash)
                .last("LIMIT 1"));
        if (row == null) {
            throw new IllegalArgumentException("invalid_grant");
        }
        if (!client.getId().equals(row.getClientPk())
                || !client.getClientId().equals(row.getClientId())) {
            throw new IllegalArgumentException("invalid_grant");
        }

        // 复用检测：已轮换/已吊销的 refresh 再现 → 整族失效
        if (REVOKED.equals(row.getRevoked())) {
            revokeFamily(row.getFamilyId());
            throw new IllegalArgumentException("invalid_grant");
        }
        if (row.getExpireTime() != null && row.getExpireTime().isBefore(LocalDateTime.now())) {
            row.setRevoked(REVOKED);
            oauthRefreshTokenMapper.updateById(row);
            throw new IllegalArgumentException("invalid_grant");
        }

        Set<String> allowed = PatScopes.parse(row.getScopes());
        Set<String> granted = resolveRequestedScopes(allowed, scopeCsv);

        // 轮换：先吊销本票，再签发新对（同 family）
        row.setRevoked(REVOKED);
        oauthRefreshTokenMapper.updateById(row);
        revokeFamilyAccessTokens(row.getFamilyId());

        return mintTokenPair(client, row.getUserId(), row.getUsername(), granted, row.getFamilyId(), null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void revokePresentedToken(
            String clientId, String clientSecret, String token, String tokenTypeHint) {
        if (!StringUtils.hasText(token)) {
            return;
        }
        String raw = token.trim();
        // 无 client_id 时仍按 RFC 7009 静默成功（不探测）
        if (!StringUtils.hasText(clientId) || !OAuthClientCodec.looksLikeClientId(clientId.trim())) {
            return;
        }
        OAuthApiClient client = loadActiveClient(clientId.trim());
        if (client == null) {
            return;
        }
        try {
            assertClientAuthForTokenEndpoint(client, clientSecret);
        } catch (IllegalArgumentException ex) {
            // 客户端认证失败：抛出由 controller 映射；否则假成功会削弱 confidential 保护
            throw ex;
        }

        String hint = tokenTypeHint == null ? "" : tokenTypeHint.trim().toLowerCase(Locale.ROOT);
        boolean tryRefresh = hint.isEmpty() || "refresh_token".equals(hint)
                || OAuthClientCodec.looksLikeRefreshToken(raw);
        boolean tryAccess = hint.isEmpty() || "access_token".equals(hint)
                || OAuthClientCodec.looksLikeAccessToken(raw);

        if (tryRefresh && OAuthClientCodec.looksLikeRefreshToken(raw)) {
            OAuthRefreshToken rt = oauthRefreshTokenMapper.selectOne(new LambdaQueryWrapper<OAuthRefreshToken>()
                    .eq(OAuthRefreshToken::getTokenHash, OAuthClientCodec.hash(raw))
                    .eq(OAuthRefreshToken::getClientPk, client.getId())
                    .last("LIMIT 1"));
            if (rt != null && ACTIVE.equals(rt.getRevoked())) {
                revokeFamily(rt.getFamilyId());
                return;
            }
        }
        if (tryAccess && OAuthClientCodec.looksLikeAccessToken(raw)) {
            OAuthAccessToken at = oauthAccessTokenMapper.selectOne(new LambdaQueryWrapper<OAuthAccessToken>()
                    .eq(OAuthAccessToken::getTokenHash, OAuthClientCodec.hash(raw))
                    .eq(OAuthAccessToken::getClientPk, client.getId())
                    .last("LIMIT 1"));
            if (at != null && ACTIVE.equals(at.getRevoked())) {
                if (StringUtils.hasText(at.getFamilyId())) {
                    revokeFamily(at.getFamilyId());
                } else {
                    at.setRevoked(REVOKED);
                    oauthAccessTokenMapper.updateById(at);
                }
            }
        }
    }

    /** public：secret 必须空；confidential：secret 必须匹配。 */
    private void assertClientAuthForTokenEndpoint(OAuthApiClient client, String clientSecret) {
        String type = normalizeStoredType(client);
        if (OAuthClientCodec.CLIENT_TYPE_CONFIDENTIAL.equals(type)) {
            if (!StringUtils.hasText(clientSecret)
                    || !OAuthClientCodec.hashEquals(
                    OAuthClientCodec.hash(clientSecret), client.getClientSecretHash())) {
                throw new IllegalArgumentException("invalid_client");
            }
        } else {
            if (StringUtils.hasText(clientSecret)) {
                throw new IllegalArgumentException("invalid_client");
            }
        }
    }

    private void revokeFamily(String familyId) {
        if (!StringUtils.hasText(familyId)) {
            return;
        }
        oauthRefreshTokenMapper.update(null, new LambdaUpdateWrapper<OAuthRefreshToken>()
                .eq(OAuthRefreshToken::getFamilyId, familyId)
                .eq(OAuthRefreshToken::getRevoked, ACTIVE)
                .set(OAuthRefreshToken::getRevoked, REVOKED));
        revokeFamilyAccessTokens(familyId);
    }

    private void revokeFamilyAccessTokens(String familyId) {
        if (!StringUtils.hasText(familyId)) {
            return;
        }
        oauthAccessTokenMapper.update(null, new LambdaUpdateWrapper<OAuthAccessToken>()
                .eq(OAuthAccessToken::getFamilyId, familyId)
                .eq(OAuthAccessToken::getRevoked, ACTIVE)
                .set(OAuthAccessToken::getRevoked, REVOKED));
    }

    private static String newFamilyId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    @Override
    public Optional<AuthenticatedOat> authenticateAccessToken(String plaintextToken) {
        if (!OAuthClientCodec.looksLikeAccessToken(plaintextToken)) {
            return Optional.empty();
        }
        String hash = OAuthClientCodec.hash(plaintextToken);
        OAuthAccessToken row = oauthAccessTokenMapper.selectOne(new LambdaQueryWrapper<OAuthAccessToken>()
                .eq(OAuthAccessToken::getTokenHash, hash)
                .eq(OAuthAccessToken::getRevoked, ACTIVE)
                .last("LIMIT 1"));
        if (row == null) {
            return Optional.empty();
        }
        if (row.getExpireTime() != null && row.getExpireTime().isBefore(LocalDateTime.now())) {
            return Optional.empty();
        }
        OAuthApiClient client = getById(row.getClientPk());
        if (client == null || REVOKED.equals(client.getRevoked())) {
            return Optional.empty();
        }
        return Optional.of(toAuthenticatedOat(row));
    }

    /** 可见性放宽供单测：过期/吊销已在外层过滤。 */
    static AuthenticatedOat toAuthenticatedOat(OAuthAccessToken row) {
        Set<String> scopes = PatScopes.parse(row.getScopes());
        List<SimpleGrantedAuthority> authorities = scopes.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
        MartinUser principal = new MartinUser(
                row.getUserId(),
                null,
                new HashSet<>(),
                "0",
                row.getUsername(),
                "N/A",
                true, true, true, true,
                authorities
        );
        return new AuthenticatedOat(principal, row.getId(), new ArrayList<>(scopes));
    }

    @Override
    public void touchLastUsed(String tokenId) {
        if (!StringUtils.hasText(tokenId)) {
            return;
        }
        OAuthAccessToken patch = new OAuthAccessToken();
        patch.setId(tokenId);
        patch.setLastUsedTime(LocalDateTime.now());
        oauthAccessTokenMapper.updateById(patch);
    }

    static Set<String> resolveRequestedScopes(Set<String> allowed, String scopeCsv) {
        if (allowed == null || allowed.isEmpty()) {
            throw new IllegalArgumentException("invalid_scope");
        }
        if (!StringUtils.hasText(scopeCsv)) {
            return new LinkedHashSet<>(allowed);
        }
        Set<String> requested = new LinkedHashSet<>();
        for (String part : scopeCsv.trim().split("[\\s,]+")) {
            if (part.isBlank()) {
                continue;
            }
            String s = part.trim().toLowerCase(Locale.ROOT);
            if (!allowed.contains(s)) {
                throw new IllegalArgumentException("invalid_scope");
            }
            requested.add(s);
        }
        if (requested.isEmpty()) {
            return new LinkedHashSet<>(allowed);
        }
        return requested;
    }

    /** client_credentials：仅短期 access，无 refresh / family。 */
    private OAuthTokenResponse mintAccessTokenOnly(
            OAuthApiClient client, String userId, String username, Set<String> granted) {
        return insertAccessAndBuild(client, userId, username, granted, null, null, null, null);
    }

    /**
     * authorization_code / refresh：access + refresh，同 family。
     * {@code nonce} 仅 auth code 换票传入；refresh 传 null（OIDC Core：续期 id_token 不含 nonce）。
     */
    private OAuthTokenResponse mintTokenPair(
            OAuthApiClient client,
            String userId,
            String username,
            Set<String> granted,
            String familyId,
            String nonce) {
        long refreshTtl = Math.max(3600, refreshTokenTtlSeconds);
        String refreshPlain = OAuthClientCodec.generateRefreshToken();
        OAuthRefreshToken rt = new OAuthRefreshToken();
        rt.setTokenHash(OAuthClientCodec.hash(refreshPlain));
        rt.setTokenHint(OAuthClientCodec.hint(refreshPlain));
        rt.setFamilyId(familyId);
        rt.setClientPk(client.getId());
        rt.setClientId(client.getClientId());
        rt.setUserId(userId);
        rt.setUsername(username);
        rt.setScopes(PatScopes.toCsv(granted));
        rt.setExpireTime(LocalDateTime.now().plusSeconds(refreshTtl));
        rt.setRevoked(ACTIVE);
        oauthRefreshTokenMapper.insert(rt);

        return insertAccessAndBuild(
                client, userId, username, granted, familyId, refreshPlain, refreshTtl, nonce);
    }

    private OAuthTokenResponse insertAccessAndBuild(
            OAuthApiClient client,
            String userId,
            String username,
            Set<String> granted,
            String familyId,
            String refreshPlain,
            Long refreshTtl,
            String nonce) {
        long ttl = Math.max(60, accessTokenTtlSeconds);
        String plaintext = OAuthClientCodec.generateAccessToken();
        LocalDateTime expire = LocalDateTime.now().plusSeconds(ttl);

        OAuthAccessToken token = new OAuthAccessToken();
        token.setClientPk(client.getId());
        token.setClientId(client.getClientId());
        token.setUserId(userId);
        token.setUsername(username);
        token.setTokenHash(OAuthClientCodec.hash(plaintext));
        token.setTokenHint(OAuthClientCodec.hint(plaintext));
        token.setScopes(PatScopes.toCsv(granted));
        token.setFamilyId(familyId);
        token.setExpireTime(expire);
        token.setRevoked(ACTIVE);
        oauthAccessTokenMapper.insert(token);

        // id_token：仅有 end-user 的 auth code / refresh 对（family 非空）且含 openid
        String idToken = null;
        if (familyId != null) {
            idToken = oidcIdTokenService.mintIfOpenid(
                    granted, client.getClientId(), userId, username, nonce, plaintext);
        }

        return OAuthTokenResponse.builder()
                .accessToken(plaintext)
                .tokenType("Bearer")
                .expiresIn(ttl)
                .scope(PatScopes.toCsv(granted))
                .scopes(new ArrayList<>(granted))
                .refreshToken(refreshPlain)
                .refreshExpiresIn(refreshTtl)
                .idToken(idToken)
                .build();
    }

    private OAuthApiClient loadActiveClient(String clientId) {
        return getOne(new LambdaQueryWrapper<OAuthApiClient>()
                .eq(OAuthApiClient::getClientId, clientId)
                .eq(OAuthApiClient::getRevoked, ACTIVE)
                .last("LIMIT 1"));
    }

    private static String normalizeStoredType(OAuthApiClient client) {
        String t = client.getClientType();
        if (!StringUtils.hasText(t)) {
            return OAuthClientCodec.CLIENT_TYPE_CONFIDENTIAL;
        }
        return t.trim().toLowerCase(Locale.ROOT);
    }

    private OAuthClientSummaryView toSummary(OAuthApiClient row) {
        return OAuthClientSummaryView.builder()
                .id(row.getId())
                .clientId(row.getClientId())
                .name(row.getName())
                .clientType(normalizeStoredType(row))
                .scopes(new ArrayList<>(PatScopes.parse(row.getScopes())))
                .redirectUris(OAuthClientCodec.parseRedirectUris(row.getRedirectUris()))
                .clientSecretHint(row.getClientSecretHint())
                .createTime(row.getCreateTime())
                .revoked(REVOKED.equals(row.getRevoked()))
                .build();
    }
}
