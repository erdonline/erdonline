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
 * SQL Server 逆向：默认 schema=dbo；索引走 sys.indexes；FK 走 sys.foreign_keys（保复合列序）。
 *
 * @author erdonline
 */
@Slf4j
public class SqlServerReverseDialect extends AbstractJdbcReverseDialect {

    private static final String DEFAULT_SCHEMA = "dbo";

    private static final String SQL_SCHEMAS =
            "SELECT name FROM sys.schemas "
                    + "WHERE name NOT IN ('sys', 'INFORMATION_SCHEMA', 'guest') "
                    + "AND name NOT LIKE 'db\\_%' ESCAPE '\\' "
                    + "ORDER BY name";

    /**
     * 列顺序对齐 IndexResultSetMapper.mapFromStatistics：INDEX_NAME / COLUMN_NAME / NON_UNIQUE。
     */
    private static final String SQL_INDEXES =
            "SELECT i.name AS index_name, c.name AS column_name, "
                    + "CASE WHEN i.is_unique = 1 THEN 0 ELSE 1 END AS non_unique, "
                    + "ic.key_ordinal AS seq_in_index "
                    + "FROM sys.indexes i "
                    + "JOIN sys.index_columns ic ON i.object_id = ic.object_id "
                    + "AND i.index_id = ic.index_id "
                    + "JOIN sys.columns c ON ic.object_id = c.object_id "
                    + "AND ic.column_id = c.column_id "
                    + "JOIN sys.tables t ON t.object_id = i.object_id "
                    + "JOIN sys.schemas s ON s.schema_id = t.schema_id "
                    + "WHERE s.name = ? AND t.name = ? "
                    + "AND i.is_primary_key = 0 AND i.type > 0 "
                    + "AND ic.is_included_column = 0 "
                    + "AND i.name IS NOT NULL "
                    + "ORDER BY i.name, ic.key_ordinal";

    private static final String SQL_FOREIGN_KEYS =
            "SELECT OBJECT_NAME(fk.parent_object_id) AS TABLE_NAME, "
                    + "pc.name AS COLUMN_NAME, "
                    + "OBJECT_NAME(fk.referenced_object_id) AS REFERENCED_TABLE_NAME, "
                    + "rc.name AS REFERENCED_COLUMN_NAME, "
                    + "fkc.constraint_column_id AS ORDINAL_POSITION, "
                    + "fk.name AS CONSTRAINT_NAME "
                    + "FROM sys.foreign_keys fk "
                    + "JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id "
                    + "JOIN sys.columns pc ON fkc.parent_object_id = pc.object_id "
                    + "AND fkc.parent_column_id = pc.column_id "
                    + "JOIN sys.columns rc ON fkc.referenced_object_id = rc.object_id "
                    + "AND fkc.referenced_column_id = rc.column_id "
                    + "JOIN sys.tables t ON t.object_id = fk.parent_object_id "
                    + "JOIN sys.schemas s ON s.schema_id = t.schema_id "
                    + "WHERE s.name = ? AND t.name = ? "
                    + "ORDER BY fk.name, fkc.constraint_column_id";

    private static final DialectCapability CAPABILITY = DialectCapability.builder()
            .supportsSchema(true)
            .supportsIndex(true)
            .supportsForeignKey(true)
            .supportsAutoIncrement(true)
            .build();

    @Override
    public String id() {
        return DialectIds.SQLSERVER;
    }

    @Override
    public boolean supports(String productName) {
        if (productName == null || productName.isEmpty()) {
            return false;
        }
        String upper = productName.toUpperCase(Locale.ROOT);
        return upper.contains("SQL SERVER")
                || upper.contains("MSSQL")
                || upper.contains(DialectIds.SQLSERVER);
    }

    @Override
    public DialectCapability capability() {
        return CAPABILITY;
    }

    @Override
    public List<String> listSchemas(Connection connection) throws SQLException {
        List<String> schemas = new ArrayList<>(16);
        try (PreparedStatement statement = connection.prepareStatement(SQL_SCHEMAS);
             ResultSet rs = statement.executeQuery()) {
            while (rs.next()) {
                String name = rs.getString(1);
                if (name != null && !name.isEmpty()) {
                    schemas.add(name);
                }
            }
        } catch (SQLException ex) {
            schemas.add(DEFAULT_SCHEMA);
        }
        if (schemas.isEmpty()) {
            schemas.add(DEFAULT_SCHEMA);
        }
        return schemas;
    }

    @Override
    protected String resolveCatalog(Connection connection, String schema) {
        try {
            return connection.getCatalog();
        } catch (SQLException ex) {
            return null;
        }
    }

    @Override
    protected String resolveSchemaPattern(Connection connection, String schema) {
        if (schema != null && !schema.isEmpty()) {
            return schema;
        }
        return DEFAULT_SCHEMA;
    }

    @Override
    protected List<Index> loadIndexes(Connection connection, TableIdentity table, String nameCaseFlag)
            throws SQLException {
        String schemaName = resolveMsSchema(table);
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
            String schemaName = resolveMsSchema(table);
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
                log.warn("SQL Server 字典外键读取失败 {}，回退 JDBC: {}",
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

    private static String resolveMsSchema(TableIdentity table) {
        String schemaName = table.getSchema();
        if (schemaName == null || schemaName.isEmpty()) {
            return DEFAULT_SCHEMA;
        }
        return schemaName;
    }
}
