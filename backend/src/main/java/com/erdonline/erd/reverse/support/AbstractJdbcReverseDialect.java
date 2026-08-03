package com.erdonline.erd.reverse.support;

import com.erdonline.erd.model.Association;
import com.erdonline.erd.model.DataType;
import com.erdonline.erd.model.Entity;
import com.erdonline.erd.model.Field;
import com.erdonline.erd.model.Index;
import com.erdonline.erd.model.ParseDataModel;
import com.erdonline.erd.model.Trigger;
import com.erdonline.erd.reverse.DefaultValueMapper;
import com.erdonline.erd.reverse.ForeignKeyAssociationMapper;
import com.erdonline.erd.reverse.IndexResultSetMapper;
import com.erdonline.erd.reverse.NameCaseAdjuster;
import com.erdonline.erd.reverse.ReverseDialect;
import com.erdonline.erd.reverse.TableIdentity;
import com.erdonline.erd.util.JdbcKit;
import com.erdonline.erd.util.StringKit;
import lombok.extern.slf4j.Slf4j;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * 基于 JDBC DatabaseMetaData 的共用逆向逻辑；子类可覆盖索引/schema 解析。
 *
 * @author erdonline
 */
@Slf4j
public abstract class AbstractJdbcReverseDialect implements ReverseDialect {

    private static final String[] TABLE_TYPES = new String[]{"TABLE"};
    private static final Set<String> IGNORED_TABLES;

    static {
        Set<String> ignored = new HashSet<>(8);
        ignored.add("PDMAN_DB_VERSION");
        ignored.add("TRACE_XE_ACTION_MAP");
        ignored.add("TRACE_XE_EVENT_MAP");
        IGNORED_TABLES = Collections.unmodifiableSet(ignored);
    }

    @Override
    public List<TableIdentity> listTables(Connection connection, String schema, String nameCaseFlag)
            throws SQLException {
        DatabaseMetaData metaData = connection.getMetaData();
        String catalog = resolveCatalog(connection, schema);
        String schemaPattern = resolveSchemaPattern(connection, schema);
        List<TableIdentity> tables = new ArrayList<>(64);
        try (ResultSet rs = metaData.getTables(catalog, schemaPattern, "%", TABLE_TYPES)) {
            while (rs.next()) {
                String originName = rs.getString("TABLE_NAME");
                if (originName == null || isIgnoredTable(originName)) {
                    continue;
                }
                String displayName = NameCaseAdjuster.adjust(originName, nameCaseFlag);
                String remarks = rs.getString("REMARKS");
                String tableCatalog = rs.getString("TABLE_CAT");
                String tableSchema = rs.getString("TABLE_SCHEM");
                tables.add(new TableIdentity(
                        tableCatalog != null ? tableCatalog : catalog,
                        tableSchema != null ? tableSchema : schemaPattern,
                        originName,
                        displayName,
                        remarks));
            }
        }
        return tables;
    }

    @Override
    public void fillEntity(Connection connection, TableIdentity table, Entity entity,
                           ParseDataModel dataModel, String nameCaseFlag) throws SQLException {
        entity.setTitle(table.getDisplayTableName());
        entity.setChnname(table.getRemarks());
        fillColumnsAndPrimaryKeys(connection, table, entity, dataModel, nameCaseFlag);
        if (capability().isSupportsIndex()) {
            try {
                entity.setIndexs(loadIndexes(connection, table, nameCaseFlag));
            } catch (SQLException ex) {
                log.warn("读取表 {} 索引失败，已跳过: {}", table.getOriginTableName(), ex.getMessage());
                entity.setIndexs(new ArrayList<>(0));
            }
        } else {
            entity.setIndexs(new ArrayList<>(0));
        }
        if (capability().isSupportsTrigger()) {
            try {
                entity.setTriggers(loadTriggers(connection, table, nameCaseFlag));
            } catch (SQLException ex) {
                log.warn("读取表 {} 触发器失败，已跳过: {}", table.getOriginTableName(), ex.getMessage());
                entity.setTriggers(new ArrayList<>(0));
            }
        } else {
            entity.setTriggers(new ArrayList<>(0));
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
        DatabaseMetaData metaData = connection.getMetaData();
        for (TableIdentity table : tables) {
            try (ResultSet rs = metaData.getImportedKeys(
                    table.getCatalog(), table.getSchema(), table.getOriginTableName())) {
                for (Association association
                        : ForeignKeyAssociationMapper.mapImportedKeys(rs, originToDisplay, nameCaseFlag)) {
                    String key = associationKey(association);
                    byKey.putIfAbsent(key, association);
                }
            } catch (SQLException ex) {
                log.warn("读取表 {} 外键失败，已跳过: {}", table.getOriginTableName(), ex.getMessage());
            }
        }
        return new ArrayList<>(byKey.values());
    }

    protected static String associationKey(Association association) {
        String fromEntity = association.getFrom() != null ? association.getFrom().getEntity() : "";
        String fromField = association.getFrom() != null ? association.getFrom().getField() : "";
        String toEntity = association.getTo() != null ? association.getTo().getEntity() : "";
        String toField = association.getTo() != null ? association.getTo().getField() : "";
        return fromEntity + '\0' + fromField + '\0' + toEntity + '\0' + toField;
    }

    protected static Map<String, String> buildOriginToDisplay(List<TableIdentity> tables) {
        Map<String, String> originToDisplay = new HashMap<>(tables.size() * 2);
        for (TableIdentity table : tables) {
            if (table.getOriginTableName() != null) {
                originToDisplay.put(
                        table.getOriginTableName().toUpperCase(Locale.ROOT),
                        table.getDisplayTableName());
            }
        }
        return originToDisplay;
    }

    /**
     * 默认 JDBC getIndexInfo；MySQL 等可覆盖为字典 SQL。
     */
    protected List<Index> loadIndexes(Connection connection, TableIdentity table, String nameCaseFlag)
            throws SQLException {
        DatabaseMetaData metaData = connection.getMetaData();
        try (ResultSet rs = metaData.getIndexInfo(
                table.getCatalog(),
                table.getSchema(),
                table.getOriginTableName(),
                false,
                true)) {
            return IndexResultSetMapper.mapFromJdbcIndexInfo(rs, nameCaseFlag);
        }
    }

    /**
     * JDBC 无统一 getTriggers；默认空。热库覆盖为字典 SQL。
     */
    protected List<Trigger> loadTriggers(Connection connection, TableIdentity table, String nameCaseFlag)
            throws SQLException {
        return Collections.emptyList();
    }

    protected void fillColumnsAndPrimaryKeys(Connection connection, TableIdentity table, Entity entity,
                                             ParseDataModel dataModel, String nameCaseFlag)
            throws SQLException {
        DatabaseMetaData metaData = connection.getMetaData();
        String catalog = table.getCatalog();
        String schema = table.getSchema();
        String tableName = table.getOriginTableName();

        Set<String> primaryKeys = new HashSet<>(8);
        try (ResultSet pkRs = metaData.getPrimaryKeys(catalog, schema, tableName)) {
            while (pkRs.next()) {
                String columnName = pkRs.getString("COLUMN_NAME");
                if (columnName != null) {
                    primaryKeys.add(NameCaseAdjuster.adjust(columnName, nameCaseFlag));
                }
            }
        }

        try (ResultSet rs = metaData.getColumns(catalog, schema, tableName, "%")) {
            while (rs.next()) {
                entity.getFields().add(buildField(rs, primaryKeys, dataModel, nameCaseFlag));
            }
        }
    }

    protected Field buildField(ResultSet rs, Set<String> primaryKeys, ParseDataModel dataModel,
                               String nameCaseFlag) throws SQLException {
        String columnName = NameCaseAdjuster.adjust(rs.getString("COLUMN_NAME"), nameCaseFlag);
        String remarks = rs.getString("REMARKS");
        String typeName = rs.getString("TYPE_NAME");
        int dataType = rs.getInt("DATA_TYPE");
        int columnSize = rs.getInt("COLUMN_SIZE");
        int decimalDigits = rs.getInt("DECIMAL_DIGITS");
        String isNullable = rs.getString("IS_NULLABLE");

        Field field = new Field();
        field.setName(columnName);
        field.setChnname(remarks);
        field.setPk(primaryKeys.contains(columnName));
        field.setNotNull(!"YES".equalsIgnoreCase(isNullable));
        if (supportsAutoIncrementColumn()) {
            String autoIncrement = rs.getString("IS_AUTOINCREMENT");
            field.setAutoIncrement(autoIncrement != null && !"NO".equalsIgnoreCase(autoIncrement));
        }
        String defaultValue = DefaultValueMapper.normalizeJdbcColumnDef(rs.getString("COLUMN_DEF"));
        if (defaultValue != null) {
            field.setDefaultValue(defaultValue);
        }
        DataType domainType = touchDataType(typeName, dataType, columnSize, decimalDigits, dataModel);
        field.setType(domainType.getCode());
        return field;
    }

    protected boolean supportsAutoIncrementColumn() {
        return capability().isSupportsAutoIncrement();
    }

    protected boolean isIgnoredTable(String tableName) {
        return IGNORED_TABLES.contains(tableName.toUpperCase(Locale.ROOT));
    }

    /**
     * catalog / schema 解析：默认用连接当前 catalog，schema 参数优先。
     */
    protected String resolveCatalog(Connection connection, String schema) throws SQLException {
        return connection.getCatalog();
    }

    protected String resolveSchemaPattern(Connection connection, String schema) throws SQLException {
        if (schema != null && !schema.isEmpty()) {
            return schema;
        }
        return null;
    }

    protected DataType touchDataType(String typeName, int dataType, int columnSize, int decimalDigits,
                                     ParseDataModel dataModel) {
        List<String> atomList = new ArrayList<>(4);
        List<String> lenList = new ArrayList<>(2);
        atomList.add(typeName);
        String domainTypeName = typeName;
        if (JdbcKit.isNumeric(dataType)) {
            atomList.add(String.valueOf(columnSize));
            lenList.add(String.valueOf(columnSize));
            if (decimalDigits > 0) {
                atomList.add(String.valueOf(decimalDigits));
                lenList.add(String.valueOf(decimalDigits));
            }
            if (typeName != null && typeName.contains("INT") && typeName.contains("UNSIGNED")
                    && typeName.contains(" ")) {
                String[] parts = typeName.split(" ");
                domainTypeName = parts[0] + "(" + StringKit.join(lenList, ",") + ") " + parts[1];
            } else {
                domainTypeName = typeName + "(" + StringKit.join(lenList, ",") + ")";
            }
        } else if (JdbcKit.isShortString(dataType)) {
            atomList.add(String.valueOf(columnSize));
            lenList.add(String.valueOf(columnSize));
            domainTypeName = typeName + "(" + StringKit.join(lenList, ",") + ")";
        }

        String domainName = StringKit.join(atomList, "_");
        Map<String, DataType> dataTypeMap = dataModel.getDataTypeMap();
        DataType domainDataType = dataTypeMap.get(domainName);
        if (domainDataType == null) {
            domainDataType = new DataType();
            domainDataType.setName(domainName);
            domainDataType.setCode(domainName);
            domainDataType.setType(domainTypeName);
            dataTypeMap.put(domainName, domainDataType);
        }
        return domainDataType;
    }
}
