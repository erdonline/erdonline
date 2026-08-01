package com.erdonline.erd.command;

import cn.hutool.core.exceptions.ExceptionUtil;
import com.erdonline.common.core.api.R;
import com.erdonline.erd.model.Association;
import com.erdonline.erd.model.Entity;
import com.erdonline.erd.model.Module;
import com.erdonline.erd.model.ParseDataModel;
import com.erdonline.erd.reverse.ReverseDialect;
import com.erdonline.erd.reverse.ReverseDialectRegistry;
import com.erdonline.erd.reverse.TableIdentity;
import com.erdonline.erd.util.JdbcKit;
import com.erdonline.erd.util.StringKit;
import lombok.extern.slf4j.Slf4j;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 数据库逆向解析命令：委托 {@link ReverseDialect} 完成多库表结构读取。
 *
 * @author erdonline
 */
@Slf4j
public class DBReverseParseCommand extends AbstractDBCommand<R> {

    private static final String PARAM_FLAG = "flag";
    private static final String PARAM_SCHEMA = "schema";

    @Override
    public R exec(Map<String, String> params) {
        super.init(params);
        Connection connection = null;
        try {
            connection = JdbcKit.getConnection(this.driverClassName, this.url, this.username, this.password);
            String productName = StringKit.nvl(connection.getMetaData().getDatabaseProductName(), "MYSQL");
            ReverseDialect dialect = ReverseDialectRegistry.resolve(productName);

            ParseDataModel dataModel = new ParseDataModel();
            dataModel.setDbType(dialect.id());
            String nameCaseFlag = params.get(PARAM_FLAG);
            String schema = params.get(PARAM_SCHEMA);
            fillModule(dataModel, dialect, connection, schema, nameCaseFlag);
            return R.ok(dataModel);
        } catch (Exception ex) {
            log.error("数据库逆向解析失败", ex);
            Throwable causedBy = ExceptionUtil.getCausedBy(ex, SQLException.class);
            String message = causedBy != null ? causedBy.getMessage() : ex.getMessage();
            return R.failed(message);
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
        module.setCode("DB_REVERSE_" + dbType);
        module.setName("逆向解析_" + dbType);
        module.setEntities(entities);
        if (dialect.capability().isSupportsForeignKey()) {
            try {
                List<Association> associations = dialect.listAssociations(connection, tables, nameCaseFlag);
                module.setAssociations(associations);
            } catch (SQLException ex) {
                log.warn("读取外键关联失败，已跳过: {}", ex.getMessage());
                module.setAssociations(new ArrayList<>(0));
            }
        }
        dataModel.setModule(module);
    }
}
