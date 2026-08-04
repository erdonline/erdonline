package com.erdonline.erd.publicapi;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.erdonline.erd.entity.OAuthAccessToken;
import com.erdonline.erd.entity.OAuthApiClient;
import com.erdonline.erd.entity.OAuthRefreshToken;
import com.erdonline.erd.mapper.OAuthAccessTokenMapper;
import com.erdonline.erd.mapper.OAuthApiClientMapper;
import com.erdonline.erd.mapper.OAuthAuthorizationCodeMapper;
import com.erdonline.erd.mapper.OAuthRefreshTokenMapper;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * refresh_token 轮换 / 复用检测 / client_credentials 不发 refresh；openid → id_token。
 */
@ExtendWith(MockitoExtension.class)
class OAuthRefreshTokenServiceTest {

    @Mock
    private OAuthAccessTokenMapper oauthAccessTokenMapper;
    @Mock
    private OAuthAuthorizationCodeMapper oauthAuthorizationCodeMapper;
    @Mock
    private OAuthRefreshTokenMapper oauthRefreshTokenMapper;
    @Mock
    private OAuthApiClientMapper oauthApiClientMapper;
    @Mock
    private OidcIdTokenService oidcIdTokenService;

    private OAuthApiClientServiceImpl service;

    private OAuthApiClient publicClient;
    private OAuthApiClient confidentialClient;
    private String confidentialSecret;

    @BeforeAll
    static void initMybatisPlusLambdaCache() {
        MybatisConfiguration configuration = new MybatisConfiguration();
        MapperBuilderAssistant assistant = new MapperBuilderAssistant(configuration, "");
        TableInfoHelper.initTableInfo(assistant, OAuthAccessToken.class);
        TableInfoHelper.initTableInfo(assistant, OAuthRefreshToken.class);
        TableInfoHelper.initTableInfo(assistant, OAuthApiClient.class);
    }

    @BeforeEach
    void setUp() {
        service = spy(new OAuthApiClientServiceImpl(
                oauthAccessTokenMapper, oauthAuthorizationCodeMapper, oauthRefreshTokenMapper,
                oidcIdTokenService));
        ReflectionTestUtils.setField(service, "baseMapper", oauthApiClientMapper);
        ReflectionTestUtils.setField(service, "accessTokenTtlSeconds", 3600L);
        ReflectionTestUtils.setField(service, "authCodeTtlSeconds", 120L);
        ReflectionTestUtils.setField(service, "refreshTokenTtlSeconds", 86400L);

        publicClient = new OAuthApiClient();
        publicClient.setId("cpk_pub");
        publicClient.setClientId("erd_cli_publicclient01");
        publicClient.setClientType(OAuthClientCodec.CLIENT_TYPE_PUBLIC);
        publicClient.setClientSecretHash(OAuthClientCodec.hash(OAuthClientCodec.generateClientSecret()));
        publicClient.setScopes(PatScopes.toCsv(PatScopes.DEFAULT_READ));
        publicClient.setRevoked("0");
        publicClient.setUserId("owner1");
        publicClient.setUsername("owner");

        confidentialSecret = OAuthClientCodec.generateClientSecret();
        confidentialClient = new OAuthApiClient();
        confidentialClient.setId("cpk_conf");
        confidentialClient.setClientId("erd_cli_confclient0001");
        confidentialClient.setClientType(OAuthClientCodec.CLIENT_TYPE_CONFIDENTIAL);
        confidentialClient.setClientSecretHash(OAuthClientCodec.hash(confidentialSecret));
        confidentialClient.setScopes(PatScopes.toCsv(PatScopes.DEFAULT_READ));
        confidentialClient.setRevoked("0");
        confidentialClient.setUserId("owner1");
        confidentialClient.setUsername("owner");
    }

    @Test
    void clientCredentials_doesNotIssueRefresh() {
        doReturn(confidentialClient).when(service).getOne(any(LambdaQueryWrapper.class));
        when(oauthAccessTokenMapper.insert(any(OAuthAccessToken.class))).thenReturn(1);

        OAuthTokenResponse resp = service.issueClientCredentials(
                confidentialClient.getClientId(), confidentialSecret, null);

        assertTrue(OAuthClientCodec.looksLikeAccessToken(resp.getAccessToken()));
        assertNull(resp.getRefreshToken());
        assertNull(resp.getRefreshExpiresIn());
        verify(oauthRefreshTokenMapper, never()).insert(any(OAuthRefreshToken.class));
    }

    @Test
    void refresh_rotatesAndInvalidatesOld() {
        String oldPlain = OAuthClientCodec.generateRefreshToken();
        String family = "familyaaaaaaaaaaaaaaaaaaaaaaaa";
        OAuthRefreshToken stored = activeRefresh(oldPlain, family, publicClient);

        doReturn(publicClient).when(service).getOne(any(LambdaQueryWrapper.class));
        when(oauthRefreshTokenMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(stored);
        when(oauthRefreshTokenMapper.updateById(any(OAuthRefreshToken.class))).thenReturn(1);
        when(oauthRefreshTokenMapper.insert(any(OAuthRefreshToken.class))).thenReturn(1);
        when(oauthAccessTokenMapper.insert(any(OAuthAccessToken.class))).thenReturn(1);
        when(oauthAccessTokenMapper.update(isNull(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        OAuthTokenResponse resp = service.refreshAccessToken(
                publicClient.getClientId(), null, oldPlain, null);

        assertTrue(OAuthClientCodec.looksLikeAccessToken(resp.getAccessToken()));
        assertTrue(OAuthClientCodec.looksLikeRefreshToken(resp.getRefreshToken()));
        assertNotEquals(oldPlain, resp.getRefreshToken());
        assertEquals(86400L, resp.getRefreshExpiresIn());
        assertEquals("1", stored.getRevoked());

        ArgumentCaptor<OAuthRefreshToken> rtCap = ArgumentCaptor.forClass(OAuthRefreshToken.class);
        verify(oauthRefreshTokenMapper).insert(rtCap.capture());
        assertEquals(family, rtCap.getValue().getFamilyId());
        assertEquals(OAuthClientCodec.hash(resp.getRefreshToken()), rtCap.getValue().getTokenHash());

        ArgumentCaptor<OAuthAccessToken> atCap = ArgumentCaptor.forClass(OAuthAccessToken.class);
        verify(oauthAccessTokenMapper).insert(atCap.capture());
        assertEquals(family, atCap.getValue().getFamilyId());
    }

    @Test
    void refresh_reuseOfRotatedToken_revokesFamily() {
        String plain = OAuthClientCodec.generateRefreshToken();
        String family = "familybbbbbbbbbbbbbbbbbbbbbbbb";
        OAuthRefreshToken stored = activeRefresh(plain, family, publicClient);
        stored.setRevoked("1");

        doReturn(publicClient).when(service).getOne(any(LambdaQueryWrapper.class));
        when(oauthRefreshTokenMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(stored);
        when(oauthRefreshTokenMapper.update(isNull(), any(LambdaUpdateWrapper.class))).thenReturn(1);
        when(oauthAccessTokenMapper.update(isNull(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.refreshAccessToken(publicClient.getClientId(), null, plain, null));
        assertEquals("invalid_grant", ex.getMessage());
        verify(oauthRefreshTokenMapper, atLeastOnce()).update(isNull(), any(LambdaUpdateWrapper.class));
        verify(oauthRefreshTokenMapper, never()).insert(any(OAuthRefreshToken.class));
    }

    @Test
    void revokePresentedRefresh_revokesFamily() {
        String plain = OAuthClientCodec.generateRefreshToken();
        String family = "familycccccccccccccccccccccccc";
        OAuthRefreshToken stored = activeRefresh(plain, family, publicClient);

        doReturn(publicClient).when(service).getOne(any(LambdaQueryWrapper.class));
        when(oauthRefreshTokenMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(stored);
        when(oauthRefreshTokenMapper.update(isNull(), any(LambdaUpdateWrapper.class))).thenReturn(1);
        when(oauthAccessTokenMapper.update(isNull(), any(LambdaUpdateWrapper.class))).thenReturn(1);

        service.revokePresentedToken(publicClient.getClientId(), null, plain, "refresh_token");

        verify(oauthRefreshTokenMapper).update(isNull(), any(LambdaUpdateWrapper.class));
        verify(oauthAccessTokenMapper).update(isNull(), any(LambdaUpdateWrapper.class));
    }

    @Test
    void refresh_wrongSecret_invalidClient() {
        String plain = OAuthClientCodec.generateRefreshToken();
        doReturn(confidentialClient).when(service).getOne(any(LambdaQueryWrapper.class));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service.refreshAccessToken(
                        confidentialClient.getClientId(), "erd_cs_wrong", plain, null));
        assertEquals("invalid_client", ex.getMessage());
        verify(oauthRefreshTokenMapper, never()).selectOne(any());
    }

    @Test
    void clientCredentials_doesNotIssueIdTokenEvenWithOpenidRegistered() {
        confidentialClient.setScopes(PatScopes.toCsv(
                Set.of(PatScopes.OPENID, PatScopes.PROJECTS_READ)));
        doReturn(confidentialClient).when(service).getOne(any(LambdaQueryWrapper.class));
        when(oauthAccessTokenMapper.insert(any(OAuthAccessToken.class))).thenReturn(1);

        OAuthTokenResponse resp = service.issueClientCredentials(
                confidentialClient.getClientId(), confidentialSecret, PatScopes.OPENID);

        assertNull(resp.getIdToken());
        assertNull(resp.getRefreshToken());
        verify(oidcIdTokenService, never()).mintIfOpenid(any(), any(), any(), any(), any(), any());
    }

    @Test
    void refresh_withOpenid_includesIdTokenWithoutNonce() {
        String oldPlain = OAuthClientCodec.generateRefreshToken();
        String family = "familybbbbbbbbbbbbbbbbbbbbbbbb";
        OAuthRefreshToken stored = activeRefresh(oldPlain, family, publicClient);
        stored.setScopes(PatScopes.toCsv(Set.of(PatScopes.OPENID, PatScopes.PROJECTS_READ)));

        doReturn(publicClient).when(service).getOne(any(LambdaQueryWrapper.class));
        when(oauthRefreshTokenMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(stored);
        when(oauthRefreshTokenMapper.updateById(any(OAuthRefreshToken.class))).thenReturn(1);
        when(oauthAccessTokenMapper.update(isNull(), any(LambdaUpdateWrapper.class))).thenReturn(1);
        when(oauthRefreshTokenMapper.insert(any(OAuthRefreshToken.class))).thenReturn(1);
        when(oauthAccessTokenMapper.insert(any(OAuthAccessToken.class))).thenReturn(1);
        when(oidcIdTokenService.mintIfOpenid(any(), any(), any(), any(), isNull(), any()))
                .thenReturn("header.payload.sig");

        OAuthTokenResponse resp = service.refreshAccessToken(
                publicClient.getClientId(), null, oldPlain, null);

        assertEquals("header.payload.sig", resp.getIdToken());
        // refresh：nonce=null；access_token 明文传入以算 at_hash
        verify(oidcIdTokenService).mintIfOpenid(
                any(), eq(publicClient.getClientId()), eq("u_auth"), eq("alice"),
                isNull(), any());
    }

    @Test
    void tokenResponse_builderCarriesRefreshFields() {
        OAuthTokenResponse r = OAuthTokenResponse.builder()
                .accessToken("erd_oat_x")
                .tokenType("Bearer")
                .expiresIn(60)
                .scope("projects:read")
                .scopes(List.of("projects:read"))
                .refreshToken("erd_ort_y")
                .refreshExpiresIn(100L)
                .idToken("id.jwt.here")
                .build();
        assertNotNull(r.getRefreshToken());
        assertEquals(100L, r.getRefreshExpiresIn());
        assertEquals("id.jwt.here", r.getIdToken());
    }

    private static OAuthRefreshToken activeRefresh(String plain, String family, OAuthApiClient client) {
        OAuthRefreshToken stored = new OAuthRefreshToken();
        stored.setId("rt1");
        stored.setTokenHash(OAuthClientCodec.hash(plain));
        stored.setTokenHint(OAuthClientCodec.hint(plain));
        stored.setFamilyId(family);
        stored.setClientPk(client.getId());
        stored.setClientId(client.getClientId());
        stored.setUserId("u_auth");
        stored.setUsername("alice");
        stored.setScopes(PatScopes.toCsv(PatScopes.DEFAULT_READ));
        stored.setExpireTime(LocalDateTime.now().plusDays(7));
        stored.setRevoked("0");
        return stored;
    }
}
