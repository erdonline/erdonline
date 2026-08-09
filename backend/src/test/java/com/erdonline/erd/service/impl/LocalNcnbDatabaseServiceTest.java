package com.erdonline.erd.service.impl;

import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.erd.entity.DataSources;
import com.erdonline.erd.mapper.DataSourcesMapper;
import com.erdonline.erd.security.DataSourceAcl;
import com.erdonline.erd.security.DataSourceCredentialCipher;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.HashSet;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * 回归：{@code @Dynamic}（queryInfo/exec、explain 等任意 SQL 执行路径）唯一的凭证来源
 * {@link LocalNcnbDatabaseService#getDataSourceInfoById} 此前完全无 ACL——任意登录用户
 * 只要能猜到/枚举出他人的 {@code data_sources.id} 就能拿到明文库连接信息并对其执行任意只读
 * SQL（本轮审计发现的最高危漏洞）。现收紧为 {@link DataSourceAcl#requireOwned}。
 */
@ExtendWith(MockitoExtension.class)
class LocalNcnbDatabaseServiceTest {

    @Mock
    private DataSourcesMapper dataSourcesMapper;

    private LocalNcnbDatabaseService service;

    @BeforeEach
    void setUp() {
        DataSourceCredentialCipher cipher =
                new DataSourceCredentialCipher(DataSourceCredentialCipher.INSECURE_DEV_DEFAULT, new MockEnvironment());
        DataSourceAcl dataSourceAcl = new DataSourceAcl(dataSourcesMapper, cipher);
        service = new LocalNcnbDatabaseService(dataSourceAcl);
        bindUser("user-a", "alice");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private static void bindUser(String id, String username) {
        MartinUser user = new MartinUser(
                id, null, new HashSet<>(), "0", username, "N/A",
                true, true, true, true, List.of());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, "n/a", List.of()));
    }

    @Test
    void ownDataSource_returnsCredentials() {
        DataSources owned = new DataSources();
        owned.setId("ds-a");
        owned.setCreator("alice");
        owned.setUrl("jdbc:mysql://localhost:3306/erd");
        owned.setUsername("root");
        owned.setPassword("secret");
        org.mockito.Mockito.when(dataSourcesMapper.selectById("ds-a")).thenReturn(owned);

        R<?> result = service.getDataSourceInfoById("ds-a");

        assertEquals(ApiErrorCode.OK.getCode(), result.getCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.getData();
        assertEquals("root", data.get("username"));
        assertEquals("secret", data.get("password"));
    }

    @Test
    void foreignDataSource_forbidden_noCredentialLeak() {
        DataSources ownedByBob = new DataSources();
        ownedByBob.setId("ds-b");
        ownedByBob.setCreator("bob");
        ownedByBob.setPassword("bobs-secret");
        org.mockito.Mockito.when(dataSourcesMapper.selectById("ds-b")).thenReturn(ownedByBob);

        R<?> result = service.getDataSourceInfoById("ds-b");

        assertEquals(ApiErrorCode.FORBIDDEN.getCode(), result.getCode());
    }

    @Test
    void missingDataSource_failsWithoutLeakingExistence() {
        org.mockito.Mockito.when(dataSourcesMapper.selectById("ds-missing")).thenReturn(null);

        R<?> result = service.getDataSourceInfoById("ds-missing");

        // 与「存在但非我」用同一状态码，避免通过响应差异枚举出真实存在的 dataSourceId。
        assertEquals(ApiErrorCode.FORBIDDEN.getCode(), result.getCode());
    }
}
