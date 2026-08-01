package com.erdonline.erd.reverse.support;

import com.erdonline.erd.model.Index;
import com.erdonline.erd.reverse.DialectCapability;
import com.erdonline.erd.reverse.DialectIds;
import com.erdonline.erd.reverse.IndexResultSetMapper;
import com.erdonline.erd.reverse.TableIdentity;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/**
 * MySQL / MariaDB 逆向：索引走 INFORMATION_SCHEMA.STATISTICS（对齐 DBeaver / jOOQ-meta）。
 *
 * @author erdonline
 */
public class MysqlReverseDialect extends AbstractJdbcReverseDialect {

    private static final String SQL_INDEXES =
            "SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE, SEQ_IN_INDEX "
                    + "FROM INFORMATION_SCHEMA.STATISTICS "
                    + "WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? "
                    + "ORDER BY INDEX_NAME, SEQ_IN_INDEX";

    private static final DialectCapability CAPABILITY = DialectCapability.builder()
            .supportsSchema(false)
            .supportsIndex(true)
            .supportsForeignKey(true)
            .supportsAutoIncrement(true)
            .build();

    @Override
    public String id() {
        return DialectIds.MYSQL;
    }

    @Override
    public boolean supports(String productName) {
        if (productName == null || productName.isEmpty()) {
            return false;
        }
        String upper = productName.toUpperCase(Locale.ROOT);
        return upper.contains(DialectIds.MYSQL) || upper.contains(DialectIds.MARIADB);
    }

    @Override
    public DialectCapability capability() {
        return CAPABILITY;
    }

    @Override
    public List<String> listSchemas(Connection connection) {
        // MySQL 以 catalog（库名）为主，schema 概念弱化
        return Collections.emptyList();
    }

    @Override
    protected String resolveSchemaPattern(Connection connection, String schema) {
        // MySQL：表挂在 catalog 下，schemaPattern 置 null
        return null;
    }

    @Override
    protected List<Index> loadIndexes(Connection connection, TableIdentity table, String nameCaseFlag)
            throws SQLException {
        String schemaName = table.getCatalog();
        if (schemaName == null || schemaName.isEmpty()) {
            schemaName = connection.getCatalog();
        }
        try (PreparedStatement statement = connection.prepareStatement(SQL_INDEXES)) {
            statement.setString(1, schemaName);
            statement.setString(2, table.getOriginTableName());
            try (ResultSet rs = statement.executeQuery()) {
                return IndexResultSetMapper.mapFromStatistics(rs, nameCaseFlag);
            }
        }
    }
}
