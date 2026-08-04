package com.erdonline.erd.publicapi;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.entity.OAuthAccessToken;
import com.erdonline.erd.entity.OAuthApiClient;
import com.erdonline.erd.entity.OAuthAuthorizationCode;
import com.erdonline.erd.mapper.OAuthAccessTokenMapper;
import com.erdonline.erd.mapper.OAuthApiClientMapper;
import com.erdonline.erd.mapper.OAuthAuthorizationCodeMapper;
import lombok.RequiredArgsConstructor;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OAuthApiClientServiceImpl
        extends ServiceImpl<OAuthApiClientMapper, OAuthApiClient>
        implements OAuthApiClientService {

    private static final String REVOKED = "1";
    private static final String ACTIVE = "0";
    private static final String CONSUMED = "1";

    private final OAuthAccessTokenMapper oauthAccessTokenMapper;
    private final OAuthAuthorizationCodeMapper oauthAuthorizationCodeMapper;

    @Value("${erd.public-api.oauth-access-token-ttl-seconds:3600}")
    private long accessTokenTtlSeconds;

    @Value("${erd.public-api.oauth-auth-code-ttl-seconds:120}")
    private long authCodeTtlSeconds;

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
        return mintAccessToken(client, client.getUserId(), client.getUsername(), granted);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AuthCodeIssued createAuthorizationCode(
            String clientId,
            String redirectUri,
            String scopeCsv,
            String state,
            String codeChallenge,
            String codeChallengeMethod) {
        MartinUser user = SecurityContextUtil.getAccessUser();
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
        if (!OAuthClientCodec.isValidCodeChallenge(codeChallenge == null ? "" : codeChallenge.trim())) {
            throw new IllegalArgumentException("invalid_request:code_challenge");
        }

        OAuthApiClient client = loadActiveClient(clientId.trim());
        if (client == null) {
            throw new IllegalArgumentException("invalid_client");
        }
        if (!OAuthClientCodec.redirectUriAllowed(client.getRedirectUris(), redirectUri.trim())) {
            throw new IllegalArgumentException("invalid_request:redirect_uri");
        }

        Set<String> allowed = PatScopes.parse(client.getScopes());
        Set<String> granted = resolveRequestedScopes(allowed, scopeCsv);

        long ttl = Math.max(30, Math.min(600, authCodeTtlSeconds));
        String plaintext = OAuthClientCodec.generateAuthorizationCode();
        OAuthAuthorizationCode row = new OAuthAuthorizationCode();
        row.setCodeHash(OAuthClientCodec.hash(plaintext));
        row.setClientPk(client.getId());
        row.setClientId(client.getClientId());
        row.setUserId(user.getId());
        row.setUsername(user.getUsername());
        row.setRedirectUri(redirectUri.trim());
        row.setScopes(PatScopes.toCsv(granted));
        row.setCodeChallenge(codeChallenge.trim());
        row.setCodeChallengeMethod(OAuthClientCodec.PKCE_S256);
        row.setExpireTime(LocalDateTime.now().plusSeconds(ttl));
        row.setConsumed(ACTIVE);
        oauthAuthorizationCodeMapper.insert(row);

        return new AuthCodeIssued(plaintext, state.trim(), redirectUri.trim());
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

        String type = normalizeStoredType(client);
        if (OAuthClientCodec.CLIENT_TYPE_CONFIDENTIAL.equals(type)) {
            if (!StringUtils.hasText(clientSecret)
                    || !OAuthClientCodec.hashEquals(
                    OAuthClientCodec.hash(clientSecret), client.getClientSecretHash())) {
                throw new IllegalArgumentException("invalid_client");
            }
        } else {
            // public：不得带有效 confidential secret 冒充；允许空 secret
            if (StringUtils.hasText(clientSecret)) {
                throw new IllegalArgumentException("invalid_client");
            }
        }

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
        // OAT 以授权用户身份（非注册人）
        return mintAccessToken(client, authCode.getUserId(), authCode.getUsername(), granted);
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

    private OAuthTokenResponse mintAccessToken(
            OAuthApiClient client, String userId, String username, Set<String> granted) {
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
        token.setExpireTime(expire);
        token.setRevoked(ACTIVE);
        oauthAccessTokenMapper.insert(token);

        return OAuthTokenResponse.builder()
                .accessToken(plaintext)
                .tokenType("Bearer")
                .expiresIn(ttl)
                .scope(PatScopes.toCsv(granted))
                .scopes(new ArrayList<>(granted))
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
