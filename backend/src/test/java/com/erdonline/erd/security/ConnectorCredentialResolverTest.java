package com.erdonline.erd.security;

import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.erd.entity.DataSources;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConnectorCredentialResolverTest {

    @Mock
    private DataSourceAcl dataSourceAcl;

    private ConnectorCredentialResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new ConnectorCredentialResolver(dataSourceAcl);
    }

    @Test
    void noDataSourceId_leavesRawCredentials() {
        Map<String, Object> params = new HashMap<>();
        params.put("url", "jdbc:mysql://evil:3306/x");
        params.put("username", "u");
        params.put("password", "p");
        params.put("driverClassName", "com.mysql.cj.jdbc.Driver");

        resolver.apply(params);

        verifyNoInteractions(dataSourceAcl);
        assertEquals("jdbc:mysql://evil:3306/x", params.get("url"));
        assertEquals("p", params.get("password"));
    }

    @Test
    void blankDataSourceId_isNoOp() {
        Map<String, Object> params = new HashMap<>();
        params.put("dataSourceId", "  ");
        params.put("password", "client-secret");

        resolver.apply(params);

        verifyNoInteractions(dataSourceAcl);
        assertEquals("client-secret", params.get("password"));
    }

    @Test
    void ownedDataSourceId_overwritesClientJdbcFields() {
        DataSources owned = new DataSources();
        owned.setId("ds-a");
        owned.setUrl("jdbc:mysql://127.0.0.1:3306/erd");
        owned.setUsername("erd");
        owned.setPassword("server-secret");
        owned.setDriverClassName("com.mysql.cj.jdbc.Driver");
        when(dataSourceAcl.requireOwned("ds-a")).thenReturn(owned);

        Map<String, Object> params = new HashMap<>();
        params.put("dataSourceId", "ds-a");
        params.put("url", "jdbc:mysql://attacker:3306/x");
        params.put("username", "attacker");
        params.put("password", "attacker-pw");
        params.put("driverClassName", "org.h2.Driver");

        resolver.apply(params);

        verify(dataSourceAcl).requireOwned("ds-a");
        assertEquals("jdbc:mysql://127.0.0.1:3306/erd", params.get("url"));
        assertEquals("erd", params.get("username"));
        assertEquals("server-secret", params.get("password"));
        assertEquals("com.mysql.cj.jdbc.Driver", params.get("driverClassName"));
    }

    @Test
    void dataSourceIdOnly_fillsCredentials() {
        DataSources owned = new DataSources();
        owned.setId("ds-a");
        owned.setUrl("jdbc:postgresql://db:5432/erd");
        owned.setUsername("pg");
        owned.setPassword("secret");
        owned.setDriverClassName("org.postgresql.Driver");
        when(dataSourceAcl.requireOwned("ds-a")).thenReturn(owned);

        Map<String, Object> params = new HashMap<>();
        params.put("dataSourceId", "ds-a");

        resolver.apply(params);

        assertEquals("jdbc:postgresql://db:5432/erd", params.get("url"));
        assertEquals("pg", params.get("username"));
        assertEquals("secret", params.get("password"));
        assertEquals("org.postgresql.Driver", params.get("driverClassName"));
        assertNull(params.get("driver_class_name"));
    }

    @Test
    void ownedDataSourceId_buildsUrlFromHostWhenBlank() {
        DataSources owned = new DataSources();
        owned.setId("ds-host");
        owned.setType("MySQL");
        owned.setHost("127.0.0.1");
        owned.setPort(3306);
        owned.setDatabaseName("erd");
        owned.setUsername("root");
        owned.setPassword("root");
        owned.setDriverClassName("com.mysql.cj.jdbc.Driver");
        when(dataSourceAcl.requireOwned("ds-host")).thenReturn(owned);

        Map<String, Object> params = new HashMap<>();
        params.put("dataSourceId", "ds-host");
        params.put("url", "jdbc:mysql://attacker:3306/x");
        params.put("password", "attacker-pw");

        resolver.apply(params);

        assertEquals("jdbc:mysql://127.0.0.1:3306/erd", params.get("url"));
        assertEquals("root", params.get("password"));
    }

    @Test
    void buildJdbcUrl_coversDialects() {
        assertEquals("jdbc:postgresql://db:5432/erd",
                ConnectorCredentialResolver.buildJdbcUrl("postgresql", "db", 5432, "erd"));
        assertEquals("jdbc:oracle:thin:@db:1521:ORCL",
                ConnectorCredentialResolver.buildJdbcUrl("oracle", "db", 1521, "ORCL"));
        assertEquals("jdbc:sqlserver://db:1433;databaseName=erd",
                ConnectorCredentialResolver.buildJdbcUrl("sqlserver", "db", 1433, "erd"));
        assertNull(ConnectorCredentialResolver.buildJdbcUrl("mysql", null, 3306, "erd"));
    }

    @Test
    void foreignDataSourceId_forbidden() {
        when(dataSourceAcl.requireOwned("ds-b"))
                .thenThrow(new ValidateException(ApiErrorCode.FORBIDDEN));

        Map<String, Object> params = new HashMap<>();
        params.put("dataSourceId", "ds-b");
        params.put("password", "client-secret");

        ValidateException ex = assertThrows(ValidateException.class, () -> resolver.apply(params));
        assertEquals(ApiErrorCode.FORBIDDEN.getCode(), ex.getStatus());
        assertEquals("client-secret", params.get("password"));
    }

    @Test
    void applyMutate_rejectsMissingDataSourceId() {
        Map<String, Object> params = new HashMap<>();
        params.put("url", "jdbc:mysql://evil:3306/x");
        params.put("password", "p");

        ValidateException ex = assertThrows(ValidateException.class, () -> resolver.applyMutate(params));
        assertTrue(ex.getMessage().contains("dataSourceId"));
        assertEquals(ApiErrorCode.BAD_REQUEST.getCode(), ex.getStatus());
        verifyNoInteractions(dataSourceAcl);
        assertEquals("p", params.get("password"));
    }

    @Test
    void applyMutate_rejectsBlankDataSourceId() {
        Map<String, Object> params = new HashMap<>();
        params.put("dataSourceId", "  ");
        params.put("url", "jdbc:mysql://evil:3306/x");

        assertThrows(ValidateException.class, () -> resolver.applyMutate(params));
        verifyNoInteractions(dataSourceAcl);
    }

    @Test
    void applyMutate_resolvesOwnedId() {
        DataSources owned = new DataSources();
        owned.setId("ds-a");
        owned.setUrl("jdbc:mysql://127.0.0.1:3306/erd");
        owned.setUsername("erd");
        owned.setPassword("server-secret");
        owned.setDriverClassName("com.mysql.cj.jdbc.Driver");
        when(dataSourceAcl.requireOwned("ds-a")).thenReturn(owned);

        Map<String, Object> params = new HashMap<>();
        params.put("dataSourceId", "ds-a");
        params.put("password", "attacker");

        resolver.applyMutate(params);

        assertEquals("server-secret", params.get("password"));
        assertEquals("jdbc:mysql://127.0.0.1:3306/erd", params.get("url"));
    }
}
