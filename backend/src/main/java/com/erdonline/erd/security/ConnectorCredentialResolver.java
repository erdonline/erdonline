package com.erdonline.erd.security;

import cn.hutool.core.util.StrUtil;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.erd.entity.DataSources;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Map;

/**
 * Prefer ACL-checked {@code dataSources} credentials when {@code dataSourceId} is present.
 *
 * <p>Raw JDBC url/username/password remain allowed for designer reverse-engineer / ping UX
 * when no id is supplied. Mutate paths ({@code sqlexec}/{@code dbsync}) must call
 * {@link #applyMutate(Map)} which rejects raw-only payloads. When id is present,
 * client-supplied JDBC fields are overwritten so callers cannot smuggle alternate
 * credentials under a trusted id.
 */
@Component
@RequiredArgsConstructor
public class ConnectorCredentialResolver {

    public static final String KEY_DATA_SOURCE_ID = "dataSourceId";

    private final DataSourceAcl dataSourceAcl;

    /**
     * B-layer probe: require saved datasource id (no raw JDBC smuggling from share/anon contexts).
     */
    @SuppressWarnings("rawtypes")
    public void applyProbe(Map params) {
        if (resolveId(params) == null) {
            throw new ValidateException(ApiErrorCode.BAD_REQUEST.getCode(),
                    "实库探测须使用已保存数据源（dataSourceId）");
        }
        apply(params);
    }

    /**
     * Mutate paths: require non-blank {@code dataSourceId}, then ACL-resolve credentials.
     */
    @SuppressWarnings("rawtypes")
    public void applyMutate(Map params) {
        if (resolveId(params) == null) {
            throw new ValidateException(ApiErrorCode.BAD_REQUEST.getCode(),
                    "同步/SQL执行须使用已保存数据源（dataSourceId），禁止直传 JDBC 账密");
        }
        apply(params);
    }

    /**
     * Mutates {@code params} in place when {@code dataSourceId} is non-blank.
     */
    @SuppressWarnings({"rawtypes", "unchecked"})
    public void apply(Map params) {
        String id = resolveId(params);
        if (id == null) {
            return;
        }
        DataSources ds = dataSourceAcl.requireOwned(id);
        String url = StrUtil.blankToDefault(ds.getUrl(), null);
        if (StrUtil.isBlank(url)) {
            url = buildJdbcUrl(ds.getType(), ds.getHost(), ds.getPort(), ds.getDatabaseName());
        }
        String driver = ds.getDriverClassName();
        if (StrUtil.isBlank(driver)) {
            driver = defaultDriver(ds.getType());
        }
        params.put("driverClassName", driver);
        params.put("url", url);
        params.put("username", ds.getUsername());
        params.put("password", ds.getPassword());
    }

    @SuppressWarnings("rawtypes")
    static String resolveId(Map params) {
        if (params == null) {
            return null;
        }
        Object idObj = params.get(KEY_DATA_SOURCE_ID);
        if (idObj == null) {
            return null;
        }
        String id = String.valueOf(idObj).trim();
        if (StrUtil.isBlank(id) || "null".equalsIgnoreCase(id)) {
            return null;
        }
        return id;
    }

    /** Mirror FE {@code generateJdbcUrl} for host-mode rows with null {@code url}. */
    static String buildJdbcUrl(String type, String host, Integer port, String databaseName) {
        if (StrUtil.isBlank(host) || port == null || StrUtil.isBlank(databaseName)) {
            return null;
        }
        String t = type == null ? "" : type.trim().toLowerCase(Locale.ROOT);
        return switch (t) {
            case "mysql", "mariadb" -> "jdbc:mysql://" + host + ":" + port + "/" + databaseName;
            case "postgresql", "postgres" -> "jdbc:postgresql://" + host + ":" + port + "/" + databaseName;
            case "oracle" -> "jdbc:oracle:thin:@" + host + ":" + port + ":" + databaseName;
            case "sqlserver", "mssql" ->
                    "jdbc:sqlserver://" + host + ":" + port + ";databaseName=" + databaseName;
            default -> {
                // MySQL-compatible product labels (e.g. "MySQL")
                if (t.contains("mysql") || t.contains("maria")) {
                    yield "jdbc:mysql://" + host + ":" + port + "/" + databaseName;
                }
                if (t.contains("postgres")) {
                    yield "jdbc:postgresql://" + host + ":" + port + "/" + databaseName;
                }
                if (t.contains("oracle")) {
                    yield "jdbc:oracle:thin:@" + host + ":" + port + ":" + databaseName;
                }
                if (t.contains("sqlserver") || t.contains("mssql")) {
                    yield "jdbc:sqlserver://" + host + ":" + port + ";databaseName=" + databaseName;
                }
                yield null;
            }
        };
    }

    static String defaultDriver(String type) {
        String t = type == null ? "" : type.trim().toLowerCase(Locale.ROOT);
        if (t.contains("postgres")) {
            return "org.postgresql.Driver";
        }
        if (t.contains("oracle")) {
            return "oracle.jdbc.OracleDriver";
        }
        if (t.contains("sqlserver") || t.contains("mssql")) {
            return "com.microsoft.sqlserver.jdbc.SQLServerDriver";
        }
        return "com.mysql.cj.jdbc.Driver";
    }
}
