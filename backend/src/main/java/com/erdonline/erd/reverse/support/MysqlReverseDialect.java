package com.erdonline.erd.reverse.support;

import com.erdonline.erd.model.Association;
import com.erdonline.erd.model.Index;
import com.erdonline.erd.reverse.DialectCapability;
import com.erdonline.erd.reverse.DialectIds;
import com.erdonline.erd.reverse.ForeignKeyAssociationMapper;
import com.erdonline.erd.reverse.IndexResultSetMapper;
import com.erdonline.erd.reverse.TableIdentity;
import lombok.extern.slf4j.Slf4j;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * MySQL / MariaDB 逆向：索引走 STATISTICS；FK 走 KEY_COLUMN_USAGE（字典级，保复合列序）。
 *
 * @author erdonline
 */
@Slf4j
public class MysqlReverseDialect extends AbstractJdbcReverseDialect {

    private static final String SQL_INDEXES =
            "SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE, SEQ_IN_INDEX "
                    + "FROM INFORMATION_SCHEMA.STATISTICS "
                    + "WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? "
                    + "ORDER BY INDEX_NAME, SEQ_IN_INDEX";

    private static final String SQL_FOREIGN_KEYS =
            "SELECT k.TABLE_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME, "
                    + "k.ORDINAL_POSITION, k.CONSTRAINT_NAME "
                    + "FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k "
                    + "INNER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS t "
                    + "ON k.CONSTRAINT_SCHEMA = t.CONSTRAINT_SCHEMA "
                    + "AND k.CONSTRAINT_NAME = t.CONSTRAINT_NAME "
                    + "AND k.TABLE_SCHEMA = t.TABLE_SCHEMA "
                    + "AND k.TABLE_NAME = t.TABLE_NAME "
                    + "WHERE t.CONSTRAINT_TYPE = 'FOREIGN KEY' "
                    + "AND k.TABLE_SCHEMA = ? AND k.TABLE_NAME = ? "
                    + "AND k.REFERENCED_TABLE_NAME IS NOT NULL "
                    + "ORDER BY k.CONSTRAINT_NAME, k.ORDINAL_POSITION";

    private static final DialectCapability CAPABILITY = DialectCapability.builder()
            .supportsSchema(false)
            .supportsIndex(true)
            .supportsForeignKey(true)
            .supportsAutoIncrement(true)
            .supportsComment(true)
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
        String schemaName = resolveCatalog(connection, table);
        try (PreparedStatement statement = connection.prepareStatement(SQL_INDEXES)) {
            statement.setString(1, schemaName);
            statement.setString(2, table.getOriginTableName());
            try (ResultSet rs = statement.executeQuery()) {
                return IndexResultSetMapper.mapFromStatistics(rs, nameCaseFlag);
            }
        }
    }

    @Override
    public List<Association> listAssociations(Connection connection, List<TableIdentity> tables,
                                              String nameCaseFlag) throws SQLException {
        if (!capability().isSupportsForeignKey() || tables == null || tables.isEmpty()) {
            return Collections.emptyList();
        }
        Map<String, String> originToDisplay = buildOriginToDisplay(tables);
        Map<String, Association> byKey = new LinkedHashMap<>(32);
        for (TableIdentity table : tables) {
            String schemaName = resolveCatalog(connection, table);
            try (PreparedStatement statement = connection.prepareStatement(SQL_FOREIGN_KEYS)) {
                statement.setString(1, schemaName);
                statement.setString(2, table.getOriginTableName());
                try (ResultSet rs = statement.executeQuery()) {
                    for (Association association
                            : ForeignKeyAssociationMapper.mapFromKeyColumnUsage(
                            rs, originToDisplay, nameCaseFlag)) {
                        byKey.putIfAbsent(associationKey(association), association);
                    }
                }
            } catch (SQLException ex) {
                log.warn("MySQL 字典外键读取失败 {}，回退 JDBC: {}",
                        table.getOriginTableName(), ex.getMessage());
                try (ResultSet rs = connection.getMetaData().getImportedKeys(
                        table.getCatalog(), table.getSchema(), table.getOriginTableName())) {
                    for (Association association
                            : ForeignKeyAssociationMapper.mapImportedKeys(
                            rs, originToDisplay, nameCaseFlag)) {
                        byKey.putIfAbsent(associationKey(association), association);
                    }
                } catch (SQLException jdbcEx) {
                    log.warn("读取表 {} 外键失败，已跳过: {}",
                            table.getOriginTableName(), jdbcEx.getMessage());
                }
            }
        }
        return new ArrayList<>(byKey.values());
    }

    private static String resolveCatalog(Connection connection, TableIdentity table) throws SQLException {
        String schemaName = table.getCatalog();
        if (schemaName == null || schemaName.isEmpty()) {
            schemaName = connection.getCatalog();
        }
        return schemaName;
    }
}
