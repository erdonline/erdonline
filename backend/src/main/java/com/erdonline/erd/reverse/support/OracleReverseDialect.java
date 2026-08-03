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
 * Oracle 逆向：schema=用户；索引走 ALL_INDEXES；FK 走 ALL_CONSTRAINTS（R）+ ALL_CONS_COLUMNS；
 * 注释走 ALL_TAB_COMMENTS / ALL_COL_COMMENTS（ojdbc REMARKS 依赖 remarksReporting，字典更稳）。
 *
 * @author erdonline
 */
@Slf4j
public class OracleReverseDialect extends AbstractJdbcReverseDialect {

    private static final String SQL_SCHEMAS =
            "SELECT username FROM all_users "
                    + "WHERE oracle_maintained = 'N' "
                    + "AND username NOT LIKE 'APEX_%' "
                    + "AND username NOT LIKE 'FLOWS_%' "
                    + "ORDER BY username";

    /**
     * 列顺序对齐 IndexResultSetMapper.mapFromStatistics：INDEX_NAME / COLUMN_NAME / NON_UNIQUE。
     */
    private static final String SQL_INDEXES =
            "SELECT i.index_name AS index_name, c.column_name AS column_name, "
                    + "CASE WHEN i.uniqueness = 'UNIQUE' THEN 0 ELSE 1 END AS non_unique, "
                    + "c.column_position AS seq_in_index "
                    + "FROM all_indexes i "
                    + "JOIN all_ind_columns c ON i.owner = c.index_owner "
                    + "AND i.index_name = c.index_name AND i.table_name = c.table_name "
                    + "WHERE i.table_owner = ? AND i.table_name = ? "
                    + "AND i.index_type != 'LOB' "
                    + "AND NOT EXISTS ( "
                    + "  SELECT 1 FROM all_constraints ac "
                    + "  WHERE ac.owner = i.owner AND ac.index_name = i.index_name "
                    + "  AND ac.constraint_type = 'P' "
                    + ") "
                    + "ORDER BY i.index_name, c.column_position";

    private static final String SQL_FOREIGN_KEYS =
            "SELECT a.table_name AS TABLE_NAME, a.column_name AS COLUMN_NAME, "
                    + "c_pk.table_name AS REFERENCED_TABLE_NAME, "
                    + "b.column_name AS REFERENCED_COLUMN_NAME, "
                    + "a.position AS ORDINAL_POSITION, "
                    + "a.constraint_name AS CONSTRAINT_NAME "
                    + "FROM all_cons_columns a "
                    + "JOIN all_constraints c ON a.owner = c.owner "
                    + "AND a.constraint_name = c.constraint_name "
                    + "JOIN all_constraints c_pk ON c.r_owner = c_pk.owner "
                    + "AND c.r_constraint_name = c_pk.constraint_name "
                    + "JOIN all_cons_columns b ON c_pk.owner = b.owner "
                    + "AND c_pk.constraint_name = b.constraint_name "
                    + "AND b.position = a.position "
                    + "WHERE c.constraint_type = 'R' "
                    + "AND a.owner = ? AND a.table_name = ? "
                    + "ORDER BY a.constraint_name, a.position";

    /**
     * 表注释：ALL_TAB_COMMENTS；仅返回有 COMMENT 的行。
     */
    private static final String SQL_TABLE_COMMENTS =
            "SELECT table_name AS TABLE_NAME, comments AS REMARKS "
                    + "FROM all_tab_comments "
                    + "WHERE owner = ? AND table_type = 'TABLE' "
                    + "AND comments IS NOT NULL";

    /**
     * 列注释：ALL_COL_COMMENTS；仅返回有 COMMENT 的行。
     */
    private static final String SQL_COLUMN_COMMENTS =
            "SELECT column_name AS COLUMN_NAME, comments AS REMARKS "
                    + "FROM all_col_comments "
                    + "WHERE owner = ? AND table_name = ? "
                    + "AND comments IS NOT NULL";

    private static final DialectCapability CAPABILITY = DialectCapability.builder()
            .supportsSchema(true)
            .supportsIndex(true)
            .supportsForeignKey(true)
            .supportsAutoIncrement(false)
            .supportsComment(true)
            .build();

    @Override
    public String id() {
        return DialectIds.ORACLE;
    }

    @Override
    public boolean supports(String productName) {
        if (productName == null || productName.isEmpty()) {
            return false;
        }
        return productName.toUpperCase(Locale.ROOT).contains(DialectIds.ORACLE);
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
            log.warn("Oracle 字典表注释读取失败，回退 JDBC: {}", ex.getMessage());
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
            log.warn("Oracle 字典列注释读取失败 {}，回退 JDBC: {}",
                    table.getOriginTableName(), ex.getMessage());
        }
    }

    @Override
    public List<String> listSchemas(Connection connection) throws SQLException {
        List<String> schemas = new ArrayList<>(32);
        try (PreparedStatement statement = connection.prepareStatement(SQL_SCHEMAS);
             ResultSet rs = statement.executeQuery()) {
            while (rs.next()) {
                String name = rs.getString(1);
                if (name != null && !name.isEmpty()) {
                    schemas.add(name);
                }
            }
        } catch (SQLException ex) {
            // 权限不足时退回当前用户
            String user = connection.getMetaData().getUserName();
            if (user != null && !user.isEmpty()) {
                schemas.add(user.toUpperCase(Locale.ROOT));
            }
        }
        return schemas;
    }

    @Override
    protected String resolveCatalog(Connection connection, String schema) {
        return null;
    }

    @Override
    protected String resolveSchemaPattern(Connection connection, String schema) throws SQLException {
        if (schema != null && !schema.isEmpty()) {
            return schema.toUpperCase(Locale.ROOT);
        }
        String user = connection.getMetaData().getUserName();
        if (user == null || user.isEmpty()) {
            throw new SQLException("Oracle 数据库 schema 不允许为空");
        }
        return user.toUpperCase(Locale.ROOT);
    }

    @Override
    protected List<Index> loadIndexes(Connection connection, TableIdentity table, String nameCaseFlag)
            throws SQLException {
        String owner = resolveOwner(connection, table);
        String tableName = table.getOriginTableName().toUpperCase(Locale.ROOT);
        try (PreparedStatement statement = connection.prepareStatement(SQL_INDEXES)) {
            statement.setString(1, owner);
            statement.setString(2, tableName);
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
            String owner = resolveOwner(connection, table);
            String tableName = table.getOriginTableName().toUpperCase(Locale.ROOT);
            try (PreparedStatement statement = connection.prepareStatement(SQL_FOREIGN_KEYS)) {
                statement.setString(1, owner);
                statement.setString(2, tableName);
                try (ResultSet rs = statement.executeQuery()) {
                    for (Association association
                            : ForeignKeyAssociationMapper.mapFromKeyColumnUsage(
                            rs, originToDisplay, nameCaseFlag)) {
                        byKey.putIfAbsent(associationKey(association), association);
                    }
                }
            } catch (SQLException ex) {
                log.warn("Oracle 字典外键读取失败 {}，回退 JDBC: {}",
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
        String owner = resolveSchemaPattern(connection, schema);
        Map<String, String> comments;
        try (PreparedStatement statement = connection.prepareStatement(SQL_TABLE_COMMENTS)) {
            statement.setString(1, owner);
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
            if (remark == null || remark.isEmpty()) {
                // Oracle 未加引号标识符为大写；兼容 JDBC 返回与字典大小写不一致
                remark = comments.get(table.getOriginTableName().toUpperCase(Locale.ROOT));
            }
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
        String owner = resolveOwner(connection, table);
        String tableName = table.getOriginTableName().toUpperCase(Locale.ROOT);
        Map<String, String> comments;
        try (PreparedStatement statement = connection.prepareStatement(SQL_COLUMN_COMMENTS)) {
            statement.setString(1, owner);
            statement.setString(2, tableName);
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

    private String resolveOwner(Connection connection, TableIdentity table) throws SQLException {
        String owner = table.getSchema();
        if (owner == null || owner.isEmpty()) {
            return resolveSchemaPattern(connection, null);
        }
        return owner.toUpperCase(Locale.ROOT);
    }
}
