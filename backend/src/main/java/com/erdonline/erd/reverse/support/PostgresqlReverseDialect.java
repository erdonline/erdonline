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
 * PostgreSQL 逆向：schema 一等公民；索引走 pg_catalog；FK 走 KEY_COLUMN_USAGE。
 *
 * @author erdonline
 */
@Slf4j
public class PostgresqlReverseDialect extends AbstractJdbcReverseDialect {

    private static final String DEFAULT_SCHEMA = "public";

    private static final String SQL_SCHEMAS =
            "SELECT schema_name FROM information_schema.schemata "
                    + "WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast') "
                    + "AND schema_name NOT LIKE 'pg_temp_%' "
                    + "AND schema_name NOT LIKE 'pg_toast_temp_%' "
                    + "ORDER BY schema_name";

    /**
     * 对齐业界字典取数：unnest(indkey) 保序；排除主键索引。
     */
    private static final String SQL_INDEXES =
            "SELECT i.relname AS index_name, a.attname AS column_name, "
                    + "CASE WHEN ix.indisunique THEN 0 ELSE 1 END AS non_unique, x.ord AS seq_in_index "
                    + "FROM pg_class t "
                    + "JOIN pg_namespace ns ON ns.oid = t.relnamespace "
                    + "JOIN pg_index ix ON t.oid = ix.indrelid "
                    + "JOIN pg_class i ON i.oid = ix.indexrelid "
                    + "JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS x(attnum, ord) ON TRUE "
                    + "JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = x.attnum "
                    + "WHERE ns.nspname = ? AND t.relname = ? AND NOT ix.indisprimary "
                    + "ORDER BY i.relname, x.ord";

    /**
     * PG 的 key_column_usage 无 REFERENCED_*；经 referential_constraints 对齐唯一约束列（复合 FK 保序）。
     */
    private static final String SQL_FOREIGN_KEYS =
            "SELECT kcu.table_name AS TABLE_NAME, kcu.column_name AS COLUMN_NAME, "
                    + "rcu.table_name AS REFERENCED_TABLE_NAME, "
                    + "rcu.column_name AS REFERENCED_COLUMN_NAME, "
                    + "kcu.ordinal_position AS ORDINAL_POSITION, "
                    + "rc.constraint_name AS CONSTRAINT_NAME "
                    + "FROM information_schema.referential_constraints rc "
                    + "JOIN information_schema.key_column_usage kcu "
                    + "ON rc.constraint_catalog = kcu.constraint_catalog "
                    + "AND rc.constraint_schema = kcu.constraint_schema "
                    + "AND rc.constraint_name = kcu.constraint_name "
                    + "JOIN information_schema.key_column_usage rcu "
                    + "ON rc.unique_constraint_catalog = rcu.constraint_catalog "
                    + "AND rc.unique_constraint_schema = rcu.constraint_schema "
                    + "AND rc.unique_constraint_name = rcu.constraint_name "
                    + "AND rcu.ordinal_position = kcu.position_in_unique_constraint "
                    + "WHERE kcu.table_schema = ? AND kcu.table_name = ? "
                    + "ORDER BY rc.constraint_name, kcu.ordinal_position";

    private static final DialectCapability CAPABILITY = DialectCapability.builder()
            .supportsSchema(true)
            .supportsIndex(true)
            .supportsForeignKey(true)
            .supportsAutoIncrement(true)
            .build();

    @Override
    public String id() {
        return DialectIds.POSTGRESQL;
    }

    @Override
    public boolean supports(String productName) {
        if (productName == null || productName.isEmpty()) {
            return false;
        }
        String upper = productName.toUpperCase(Locale.ROOT);
        return upper.contains("POSTGRES") || upper.contains("ENTERPRISEDB");
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
        }
        return schemas;
    }

    @Override
    protected String resolveCatalog(Connection connection, String schema) {
        // PG JDBC：表挂在 schema，catalog 用连接库名即可（getTables 传 catalog 常为当前库）
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
        String schemaName = resolvePgSchema(table);
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
            String schemaName = resolvePgSchema(table);
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
                log.warn("PostgreSQL 字典外键读取失败 {}，回退 JDBC: {}",
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

    private static String resolvePgSchema(TableIdentity table) {
        String schemaName = table.getSchema();
        if (schemaName == null || schemaName.isEmpty()) {
            return DEFAULT_SCHEMA;
        }
        return schemaName;
    }
}
