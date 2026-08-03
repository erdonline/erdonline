package com.erdonline.erd.reverse.support;

import com.erdonline.erd.model.Association;
import com.erdonline.erd.model.Entity;
import com.erdonline.erd.model.Field;
import com.erdonline.erd.model.Index;
import com.erdonline.erd.model.ParseDataModel;
import com.erdonline.erd.model.Trigger;
import com.erdonline.erd.reverse.CommentResultSetMapper;
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
 * PostgreSQL 逆向：schema 一等公民；索引走 pg_catalog；FK 走 KEY_COLUMN_USAGE；
 * 注释走 obj_description / col_description（pgjdbc getColumns REMARKS 不可靠）；
 * 触发器走 information_schema.triggers → {@code entity.triggers}。
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
                    + "rc.constraint_name AS CONSTRAINT_NAME, "
                    + "rc.delete_rule AS DELETE_RULE, "
                    + "rc.update_rule AS UPDATE_RULE "
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

    /**
     * 表注释：obj_description(pg_class)；仅返回有 COMMENT 的行。
     */
    private static final String SQL_TABLE_COMMENTS =
            "SELECT c.relname AS TABLE_NAME, obj_description(c.oid, 'pg_class') AS REMARKS "
                    + "FROM pg_class c "
                    + "JOIN pg_namespace n ON n.oid = c.relnamespace "
                    + "WHERE n.nspname = ? AND c.relkind IN ('r', 'p') "
                    + "AND obj_description(c.oid, 'pg_class') IS NOT NULL";

    /**
     * 列注释：col_description；仅返回有 COMMENT 的行。
     */
    private static final String SQL_COLUMN_COMMENTS =
            "SELECT a.attname AS COLUMN_NAME, col_description(c.oid, a.attnum) AS REMARKS "
                    + "FROM pg_class c "
                    + "JOIN pg_namespace n ON n.oid = c.relnamespace "
                    + "JOIN pg_attribute a ON a.attrelid = c.oid "
                    + "WHERE n.nspname = ? AND c.relname = ? "
                    + "AND a.attnum > 0 AND NOT a.attisdropped "
                    + "AND col_description(c.oid, a.attnum) IS NOT NULL";

    /**
     * 表触发器：information_schema（多事件触发器按 event 拆行，对齐 schema 单 event 字段）。
     */
    private static final String SQL_TRIGGERS =
            "SELECT trigger_name AS TRIGGER_NAME, action_timing AS ACTION_TIMING, "
                    + "event_manipulation AS EVENT_MANIPULATION, "
                    + "action_orientation AS ACTION_ORIENTATION, "
                    + "action_statement AS ACTION_STATEMENT "
                    + "FROM information_schema.triggers "
                    + "WHERE event_object_schema = ? AND event_object_table = ? "
                    + "ORDER BY trigger_name, event_manipulation";

    private static final DialectCapability CAPABILITY = DialectCapability.builder()
            .supportsSchema(true)
            .supportsIndex(true)
            .supportsForeignKey(true)
            .supportsAutoIncrement(true)
            .supportsComment(true)
            .supportsTrigger(true)
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
    public List<TableIdentity> listTables(Connection connection, String schema, String nameCaseFlag)
            throws SQLException {
        List<TableIdentity> tables = super.listTables(connection, schema, nameCaseFlag);
        if (!capability().isSupportsComment() || tables.isEmpty()) {
            return tables;
        }
        try {
            return backfillTableComments(connection, tables, schema);
        } catch (SQLException ex) {
            log.warn("PostgreSQL 字典表注释读取失败，回退 JDBC: {}", ex.getMessage());
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
            log.warn("PostgreSQL 字典列注释读取失败 {}，回退 JDBC: {}",
                    table.getOriginTableName(), ex.getMessage());
        }
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
    protected List<Trigger> loadTriggers(Connection connection, TableIdentity table, String nameCaseFlag)
            throws SQLException {
        String schemaName = resolvePgSchema(table);
        try (PreparedStatement statement = connection.prepareStatement(SQL_TRIGGERS)) {
            statement.setString(1, schemaName);
            statement.setString(2, table.getOriginTableName());
            try (ResultSet rs = statement.executeQuery()) {
                return TriggerResultSetMapper.mapFromPostgresInformationSchema(
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
        String schemaName = resolvePgSchema(table);
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

    private static String resolvePgSchema(TableIdentity table) {
        String schemaName = table.getSchema();
        if (schemaName == null || schemaName.isEmpty()) {
            return DEFAULT_SCHEMA;
        }
        return schemaName;
    }
}
