package com.erdonline.erd.publicapi;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.entity.OAuthAccessToken;
import com.erdonline.erd.entity.OAuthApiClient;
import com.erdonline.erd.mapper.OAuthAccessTokenMapper;
import com.erdonline.erd.mapper.OAuthApiClientMapper;
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

    private final OAuthAccessTokenMapper oauthAccessTokenMapper;

    @Value("${erd.public-api.oauth-access-token-ttl-seconds:3600}")
    private long accessTokenTtlSeconds;

    @Override
    public OAuthClientCreatedView create(CreateOAuthClientRequest request) {
        MartinUser user = SecurityContextUtil.getAccessUser();
        Set<String> scopes = PatScopes.normalizeForMint(request.getScopes());
        String clientId = OAuthClientCodec.generateClientId();
        String plaintextSecret = OAuthClientCodec.generateClientSecret();

        OAuthApiClient row = new OAuthApiClient();
        row.setClientId(clientId);
        row.setUserId(user.getId());
        row.setUsername(user.getUsername());
        row.setName(request.getName().trim());
        row.setClientSecretHash(OAuthClientCodec.hash(plaintextSecret));
        row.setClientSecretHint(OAuthClientCodec.hint(plaintextSecret));
        row.setScopes(PatScopes.toCsv(scopes));
        row.setRevoked(ACTIVE);
        save(row);

        return OAuthClientCreatedView.builder()
                .id(row.getId())
                .clientId(clientId)
                .name(row.getName())
                .scopes(new ArrayList<>(scopes))
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
    }

    @Override
    public OAuthTokenResponse issueClientCredentials(String clientId, String clientSecret, String scopeCsv) {
        if (!StringUtils.hasText(clientId) || !StringUtils.hasText(clientSecret)) {
            throw new IllegalArgumentException("invalid_client");
        }
        if (!OAuthClientCodec.looksLikeClientId(clientId.trim())) {
            throw new IllegalArgumentException("invalid_client");
        }
        OAuthApiClient client = getOne(new LambdaQueryWrapper<OAuthApiClient>()
                .eq(OAuthApiClient::getClientId, clientId.trim())
                .eq(OAuthApiClient::getRevoked, ACTIVE)
                .last("LIMIT 1"));
        if (client == null) {
            throw new IllegalArgumentException("invalid_client");
        }
        String secretHash = OAuthClientCodec.hash(clientSecret);
        if (!secretHash.equals(client.getClientSecretHash())) {
            throw new IllegalArgumentException("invalid_client");
        }

        Set<String> allowed = PatScopes.parse(client.getScopes());
        Set<String> granted = resolveRequestedScopes(allowed, scopeCsv);

        long ttl = Math.max(60, accessTokenTtlSeconds);
        String plaintext = OAuthClientCodec.generateAccessToken();
        LocalDateTime expire = LocalDateTime.now().plusSeconds(ttl);

        OAuthAccessToken token = new OAuthAccessToken();
        token.setClientPk(client.getId());
        token.setClientId(client.getClientId());
        token.setUserId(client.getUserId());
        token.setUsername(client.getUsername());
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
        // client 吊销后既有票也应失效
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

    private OAuthClientSummaryView toSummary(OAuthApiClient row) {
        return OAuthClientSummaryView.builder()
                .id(row.getId())
                .clientId(row.getClientId())
                .name(row.getName())
                .scopes(new ArrayList<>(PatScopes.parse(row.getScopes())))
                .clientSecretHint(row.getClientSecretHint())
                .createTime(row.getCreateTime())
                .revoked(REVOKED.equals(row.getRevoked()))
                .build();
    }
}
