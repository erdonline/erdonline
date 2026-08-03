package com.erdonline.erd.reverse.support;

import com.erdonline.erd.model.Association;
import com.erdonline.erd.model.Index;
import com.erdonline.erd.model.Trigger;
import com.erdonline.erd.reverse.DialectCapability;
import com.erdonline.erd.reverse.DialectIds;
import com.erdonline.erd.reverse.ForeignKeyAssociationMapper;
import com.erdonline.erd.reverse.IndexResultSetMapper;
import com.erdonline.erd.reverse.TableIdentity;
import com.erdonline.erd.reverse.TriggerResultSetMapper;
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
 * MySQL / MariaDB 逆向：索引走 STATISTICS（MySQL 8 函数键位读 EXPRESSION → {@code indexs[].fields[]}）；
 * FK 走 KEY_COLUMN_USAGE（字典级，保复合列序）；
 * 触发器走 INFORMATION_SCHEMA.TRIGGERS → {@code entity.triggers}。
 *
 * @author erdonline
 */
@Slf4j
public class MysqlReverseDialect extends AbstractJdbcReverseDialect {

    /**
     * MySQL 8+ 函数索引：STATISTICS.COLUMN_NAME 为空时读 EXPRESSION。
     * MariaDB / 旧版无 EXPRESSION 列时回退 {@link #SQL_INDEXES_LEGACY}。
     */
    private static final String SQL_INDEXES =
            "SELECT INDEX_NAME, "
                    + "CASE WHEN COLUMN_NAME IS NULL OR COLUMN_NAME = '' THEN EXPRESSION "
                    + "ELSE COLUMN_NAME END AS COLUMN_NAME, "
                    + "NON_UNIQUE, SEQ_IN_INDEX "
                    + "FROM INFORMATION_SCHEMA.STATISTICS "
                    + "WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? "
                    + "ORDER BY INDEX_NAME, SEQ_IN_INDEX";

    private static final String SQL_INDEXES_LEGACY =
            "SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE, SEQ_IN_INDEX "
                    + "FROM INFORMATION_SCHEMA.STATISTICS "
                    + "WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? "
                    + "ORDER BY INDEX_NAME, SEQ_IN_INDEX";

    private static final String SQL_FOREIGN_KEYS =
            "SELECT k.TABLE_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_NAME, k.REFERENCED_COLUMN_NAME, "
                    + "k.ORDINAL_POSITION, k.CONSTRAINT_NAME, "
                    + "rc.DELETE_RULE, rc.UPDATE_RULE "
                    + "FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k "
                    + "INNER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS t "
                    + "ON k.CONSTRAINT_SCHEMA = t.CONSTRAINT_SCHEMA "
                    + "AND k.CONSTRAINT_NAME = t.CONSTRAINT_NAME "
                    + "AND k.TABLE_SCHEMA = t.TABLE_SCHEMA "
                    + "AND k.TABLE_NAME = t.TABLE_NAME "
                    + "INNER JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc "
                    + "ON k.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA "
                    + "AND k.CONSTRAINT_NAME = rc.CONSTRAINT_NAME "
                    + "AND k.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA "
                    + "WHERE t.CONSTRAINT_TYPE = 'FOREIGN KEY' "
                    + "AND k.TABLE_SCHEMA = ? AND k.TABLE_NAME = ? "
                    + "AND k.REFERENCED_TABLE_NAME IS NOT NULL "
                    + "ORDER BY k.CONSTRAINT_NAME, k.ORDINAL_POSITION";

    private static final String SQL_TRIGGERS =
            "SELECT TRIGGER_NAME, ACTION_TIMING, EVENT_MANIPULATION, ACTION_ORIENTATION, ACTION_STATEMENT "
                    + "FROM INFORMATION_SCHEMA.TRIGGERS "
                    + "WHERE EVENT_OBJECT_SCHEMA = ? AND EVENT_OBJECT_TABLE = ? "
                    + "ORDER BY TRIGGER_NAME";

    private static final DialectCapability CAPABILITY = DialectCapability.builder()
            .supportsSchema(false)
            .supportsIndex(true)
            .supportsForeignKey(true)
            .supportsAutoIncrement(true)
            .supportsComment(true)
            .supportsTrigger(true)
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
        try {
            return queryIndexes(connection, SQL_INDEXES, schemaName, table.getOriginTableName(), nameCaseFlag);
        } catch (SQLException ex) {
            // 无 EXPRESSION 列（MariaDB / MySQL 8.0.13 前）：退回列名-only，函数键位继续软丢
            log.warn("MySQL 函数索引字典不可用 {}，回退列名索引: {}",
                    table.getOriginTableName(), ex.getMessage());
            return queryIndexes(connection, SQL_INDEXES_LEGACY, schemaName, table.getOriginTableName(),
                    nameCaseFlag);
        }
    }

    private static List<Index> queryIndexes(Connection connection, String sql, String schemaName,
                                            String tableName, String nameCaseFlag) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, schemaName);
            statement.setString(2, tableName);
            try (ResultSet rs = statement.executeQuery()) {
                return IndexResultSetMapper.mapFromStatistics(rs, nameCaseFlag);
            }
        }
    }

    @Override
    protected List<Trigger> loadTriggers(Connection connection, TableIdentity table, String nameCaseFlag)
            throws SQLException {
        String schemaName = resolveCatalog(connection, table);
        try (PreparedStatement statement = connection.prepareStatement(SQL_TRIGGERS)) {
            statement.setString(1, schemaName);
            statement.setString(2, table.getOriginTableName());
            try (ResultSet rs = statement.executeQuery()) {
                return TriggerResultSetMapper.mapFromInformationSchema(
                        rs, table.getDisplayTableName(), nameCaseFlag);
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
