package com.erdonline.erd.command;

import cn.hutool.core.exceptions.ExceptionUtil;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.erd.model.Association;
import com.erdonline.erd.model.Entity;
import com.erdonline.erd.model.Module;
import com.erdonline.erd.model.ParseDataModel;
import com.erdonline.erd.reverse.ReverseDialect;
import com.erdonline.erd.reverse.ReverseDialectRegistry;
import com.erdonline.erd.reverse.TableIdentity;
import com.erdonline.erd.schema.SchemaProbeResult;
import com.erdonline.erd.schema.SchemaProbeService;
import com.erdonline.erd.util.JdbcKit;
import com.erdonline.erd.util.StringKit;
import lombok.extern.slf4j.Slf4j;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Explicit live-schema probe: reverse introspect + fingerprint vs projectJSON (ADR-0022 #8).
 */
@Slf4j
public class SchemaProbeCommand extends AbstractDBCommand<R> {

    private static final String PARAM_FLAG = "flag";
    private static final String PARAM_SCHEMA = "schema";
    private static final String PARAM_PROJECT_JSON = "projectJSON";

    @Override
    @SuppressWarnings({"rawtypes", "unchecked"})
    public R exec(Map params) {
        try {
            super.init(params);
        } catch (ValidateException e) {
            return e.getStatus() != 0 ? R.failed(e.getStatus(), e.getMessage()) : R.failed(e.getMessage());
        }

        Connection connection = null;
        try {
            connection = JdbcKit.getConnection(this.driverClassName, this.url, this.username, this.password);
            String productName = StringKit.nvl(connection.getMetaData().getDatabaseProductName(), "MYSQL");
            ReverseDialect dialect = ReverseDialectRegistry.resolve(productName);

            ParseDataModel dataModel = new ParseDataModel();
            dataModel.setDbType(dialect.id());
            String nameCaseFlag = params.get(PARAM_FLAG) != null ? String.valueOf(params.get(PARAM_FLAG)) : null;
            String schema = params.get(PARAM_SCHEMA) != null ? String.valueOf(params.get(PARAM_SCHEMA)) : null;
            fillModule(dataModel, dialect, connection, schema, nameCaseFlag);

            Map<String, Object> projectJson = null;
            Object pj = params.get(PARAM_PROJECT_JSON);
            if (pj instanceof Map<?, ?> map) {
                projectJson = (Map<String, Object>) map;
            }

            SchemaProbeResult result = SchemaProbeService.probe(dataModel, projectJson);
            return R.ok(result);
        } catch (Exception ex) {
            log.error("schema probe failed", ex);
            Throwable causedBy = ExceptionUtil.getCausedBy(ex, SQLException.class);
            String message = causedBy != null ? causedBy.getMessage() : ex.getMessage();
            return R.ok(SchemaProbeService.connectionFailed(message));
        } finally {
            JdbcKit.close(connection);
        }
    }

    private void fillModule(ParseDataModel dataModel, ReverseDialect dialect, Connection connection,
                            String schema, String nameCaseFlag) throws SQLException {
        List<TableIdentity> tables = dialect.listTables(connection, schema, nameCaseFlag);
        List<Entity> entities = new ArrayList<>(tables.size());
        for (TableIdentity table : tables) {
            Entity entity = new Entity();
            dialect.fillEntity(connection, table, entity, dataModel, nameCaseFlag);
            entities.add(entity);
        }
        Module module = new Module();
        String dbType = dialect.id();
        module.setCode("SCHEMA_PROBE_" + dbType);
        module.setName("schema_probe_" + dbType);
        module.setEntities(entities);
        if (dialect.capability().isSupportsForeignKey()) {
            try {
                List<Association> associations = dialect.listAssociations(connection, tables, nameCaseFlag);
                module.setAssociations(associations);
            } catch (SQLException ex) {
                log.warn("schema probe: skip FK list: {}", ex.getMessage());
                module.setAssociations(new ArrayList<>(0));
            }
        }
        dataModel.setModule(module);
    }
}
