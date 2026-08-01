package com.erdonline.erd.reverse.support;

import com.erdonline.erd.reverse.DialectCapability;
import com.erdonline.erd.reverse.DialectIds;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Locale;

/**
 * JDBC 通用兜底：表/列/PK；索引尽力（getIndexInfo），失败不阻断。
 * <p>认领所有未被更具体方言认领的 productName（由 Registry 放在列表末尾）。
 *
 * @author erdonline
 */
public class GenericJdbcReverseDialect extends AbstractJdbcReverseDialect {

    private static final DialectCapability CAPABILITY = DialectCapability.builder()
            .supportsSchema(true)
            .supportsIndex(true)
            .supportsForeignKey(false)
            .supportsAutoIncrement(false)
            .build();

    @Override
    public String id() {
        return DialectIds.GENERIC;
    }

    @Override
    public boolean supports(String productName) {
        // Registry 将本实现放在最后；此处恒 true 作为兜底
        return true;
    }

    @Override
    public DialectCapability capability() {
        return CAPABILITY;
    }

    @Override
    protected String resolveSchemaPattern(Connection connection, String schema) throws SQLException {
        if (schema != null && !schema.isEmpty()) {
            return schema;
        }
        String product = connection.getMetaData().getDatabaseProductName();
        String upper = product == null ? "" : product.toUpperCase(Locale.ROOT);
        if (upper.contains("ORACLE") || upper.contains("DB2") || upper.contains("DM")) {
            String user = connection.getMetaData().getUserName();
            if (user == null || user.isEmpty()) {
                throw new SQLException(product + " 数据库 schema 不允许为空");
            }
            return user.toUpperCase(Locale.ROOT);
        }
        return null;
    }
}
