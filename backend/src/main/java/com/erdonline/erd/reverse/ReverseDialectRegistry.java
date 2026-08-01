package com.erdonline.erd.reverse;

import com.erdonline.erd.reverse.support.GenericJdbcReverseDialect;
import com.erdonline.erd.reverse.support.MysqlReverseDialect;
import com.erdonline.erd.reverse.support.OracleReverseDialect;
import com.erdonline.erd.reverse.support.PostgresqlReverseDialect;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/**
 * 方言注册表：按 JDBC productName 解析实现，未命中则 Generic。
 *
 * @author erdonline
 */
public final class ReverseDialectRegistry {

    private static final List<ReverseDialect> DIALECTS;

    static {
        List<ReverseDialect> list = new ArrayList<>(8);
        list.add(new MysqlReverseDialect());
        list.add(new PostgresqlReverseDialect());
        list.add(new OracleReverseDialect());
        // P0 后续：SQL Server
        list.add(new GenericJdbcReverseDialect());
        DIALECTS = Collections.unmodifiableList(list);
    }

    private ReverseDialectRegistry() {
    }

    /**
     * @param productName {@link java.sql.DatabaseMetaData#getDatabaseProductName()}
     */
    public static ReverseDialect resolve(String productName) {
        String normalized = productName == null ? "" : productName.trim().toUpperCase(Locale.ROOT);
        for (ReverseDialect dialect : DIALECTS) {
            if (dialect.supports(normalized)) {
                return dialect;
            }
        }
        return DIALECTS.get(DIALECTS.size() - 1);
    }

    public static List<ReverseDialect> all() {
        return DIALECTS;
    }
}
