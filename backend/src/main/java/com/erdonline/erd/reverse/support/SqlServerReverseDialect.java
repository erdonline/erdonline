package com.erdonline.erd.reverse.support;

import com.erdonline.erd.model.Association;
import com.erdonline.erd.model.Entity;
import com.erdonline.erd.model.Field;
import com.erdonline.erd.model.Index;
import com.erdonline.erd.model.ParseDataModel;
import com.erdonline.erd.reverse.CommentResultSetMapper;
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
 * SQL Server 逆向：默认 schema=dbo；索引走 sys.indexes；FK 走 sys.foreign_keys（保复合列序）；
 * 注释走 sys.extended_properties MS_Description（JDBC REMARKS 不可靠）。
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

    /**
     * 表注释：MS_Description（class=1, minor_id=0）；仅返回有扩展属性的行。
     */
    private static final String SQL_TABLE_COMMENTS =
            "SELECT t.name AS TABLE_NAME, CAST(ep.value AS NVARCHAR(4000)) AS REMARKS "
                    + "FROM sys.tables t "
                    + "JOIN sys.schemas s ON s.schema_id = t.schema_id "
                    + "JOIN sys.extended_properties ep ON ep.major_id = t.object_id "
                    + "AND ep.minor_id = 0 AND ep.class = 1 AND ep.name = N'MS_Description' "
                    + "WHERE s.name = ? AND ep.value IS NOT NULL";

    /**
     * 列注释：MS_Description（class=1, minor_id=column_id）；仅返回有扩展属性的行。
     */
    private static final String SQL_COLUMN_COMMENTS =
            "SELECT c.name AS COLUMN_NAME, CAST(ep.value AS NVARCHAR(4000)) AS REMARKS "
                    + "FROM sys.tables t "
                    + "JOIN sys.schemas s ON s.schema_id = t.schema_id "
                    + "JOIN sys.columns c ON c.object_id = t.object_id "
                    + "JOIN sys.extended_properties ep ON ep.major_id = t.object_id "
                    + "AND ep.minor_id = c.column_id AND ep.class = 1 "
                    + "AND ep.name = N'MS_Description' "
                    + "WHERE s.name = ? AND t.name = ? AND ep.value IS NOT NULL";

    private static final DialectCapability CAPABILITY = DialectCapability.builder()
            .supportsSchema(true)
            .supportsIndex(true)
            .supportsForeignKey(true)
            .supportsAutoIncrement(true)
            .supportsComment(true)
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
    public List<TableIdentity> listTables(Connection connection, String schema, String nameCaseFlag)
            throws SQLException {
        List<TableIdentity> tables = super.listTables(connection, schema, nameCaseFlag);
        if (!capability().isSupportsComment() || tables.isEmpty()) {
            return tables;
        }
        try {
            return backfillTableComments(connection, tables, schema);
        } catch (SQLException ex) {
            log.warn("SQL Server 字典表注释读取失败，回退 JDBC: {}", ex.getMessage());
            return tables;
        }
    }

    @Override
    public void fillEntity(Connection connection, TableIdentity table, Entity entity,
                           ParseDataModel dataModel, String nameCaseFlag) throws SQLException {
        super.fillEntity(connection, table, entity, dataModel, nameCaseFlag);
        if (!capability().isSupportsComment()) {
            return;
        }
        try {
            backfillColumnComments(connection, table, entity, nameCaseFlag);
        } catch (SQLException ex) {
            log.warn("SQL Server 字典列注释读取失败 {}，回退 JDBC: {}",
                    table.getOriginTableName(), ex.getMessage());
        }
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

    private List<TableIdentity> backfillTableComments(Connection connection, List<TableIdentity> tables,
                                                      String schema) throws SQLException {
        String schemaName = (schema != null && !schema.isEmpty()) ? schema : DEFAULT_SCHEMA;
        Map<String, String> comments;
        try (PreparedStatement statement = connection.prepareStatement(SQL_TABLE_COMMENTS)) {
            statement.setString(1, schemaName);
            try (ResultSet rs = statement.executeQuery()) {
                comments = CommentResultSetMapper.mapTableComments(rs);
            }
        }
        if (comments.isEmpty()) {
            return tables;
        }
        List<TableIdentity> filled = new ArrayList<>(tables.size());
        for (TableIdentity table : tables) {
            String remark = comments.get(table.getOriginTableName());
            if (remark != null && !remark.isEmpty()) {
                filled.add(table.withRemarks(remark));
            } else {
                filled.add(table);
            }
        }
        return filled;
    }

    private void backfillColumnComments(Connection connection, TableIdentity table, Entity entity,
                                        String nameCaseFlag) throws SQLException {
        String schemaName = resolveMsSchema(table);
        Map<String, String> comments;
        try (PreparedStatement statement = connection.prepareStatement(SQL_COLUMN_COMMENTS)) {
            statement.setString(1, schemaName);
            statement.setString(2, table.getOriginTableName());
            try (ResultSet rs = statement.executeQuery()) {
                comments = CommentResultSetMapper.mapColumnComments(rs, nameCaseFlag);
            }
        }
        if (comments.isEmpty() || entity.getFields() == null) {
            return;
        }
        for (Field field : entity.getFields()) {
            String remark = comments.get(field.getName());
            if (remark != null && !remark.isEmpty()) {
                field.setChnname(remark);
            }
        }
    }

    private static String resolveMsSchema(TableIdentity table) {
        String schemaName = table.getSchema();
        if (schemaName == null || schemaName.isEmpty()) {
            return DEFAULT_SCHEMA;
        }
        return schemaName;
    }
}
