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
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Oracle 逆向：schema=用户；索引走 ALL_INDEXES / ALL_IND_COLUMNS（排除主键约束索引）。
 *
 * @author erdonline
 */
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

    private static final DialectCapability CAPABILITY = DialectCapability.builder()
            .supportsSchema(true)
            .supportsIndex(true)
            .supportsForeignKey(true)
            .supportsAutoIncrement(false)
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
        String owner = table.getSchema();
        if (owner == null || owner.isEmpty()) {
            owner = resolveSchemaPattern(connection, null);
        } else {
            owner = owner.toUpperCase(Locale.ROOT);
        }
        String tableName = table.getOriginTableName().toUpperCase(Locale.ROOT);
        try (PreparedStatement statement = connection.prepareStatement(SQL_INDEXES)) {
            statement.setString(1, owner);
            statement.setString(2, tableName);
            try (ResultSet rs = statement.executeQuery()) {
                return IndexResultSetMapper.mapFromStatistics(rs, nameCaseFlag);
            }
        }
    }
}
