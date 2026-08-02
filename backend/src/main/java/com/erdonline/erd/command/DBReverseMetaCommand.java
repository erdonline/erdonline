package com.erdonline.erd.command;

import cn.hutool.core.exceptions.ExceptionUtil;
import com.erdonline.common.core.api.R;
import com.erdonline.erd.reverse.DialectCapability;
import com.erdonline.erd.reverse.ReverseDialect;
import com.erdonline.erd.reverse.ReverseDialectRegistry;
import com.erdonline.erd.util.JdbcKit;
import com.erdonline.erd.util.StringKit;
import lombok.extern.slf4j.Slf4j;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 逆向元数据：方言能力 + schema 列表（供导入向导显隐与选择）。
 *
 * @author erdonline
 */
@Slf4j
public class DBReverseMetaCommand extends AbstractDBCommand<R> {

    @Override
    public R exec(Map<String, String> params) {
        super.init(params);
        Connection connection = null;
        try {
            connection = JdbcKit.getConnection(this.driverClassName, this.url, this.username, this.password);
            String productName = StringKit.nvl(connection.getMetaData().getDatabaseProductName(), "MYSQL");
            ReverseDialect dialect = ReverseDialectRegistry.resolve(productName);
            DialectCapability capability = dialect.capability();
            List<String> schemas = capability.isSupportsSchema()
                    ? dialect.listSchemas(connection)
                    : Collections.emptyList();

            Map<String, Object> payload = new LinkedHashMap<>(8);
            payload.put("dialectId", dialect.id());
            payload.put("productName", productName);
            payload.put("supportsSchema", capability.isSupportsSchema());
            payload.put("supportsIndex", capability.isSupportsIndex());
            payload.put("supportsForeignKey", capability.isSupportsForeignKey());
            payload.put("supportsAutoIncrement", capability.isSupportsAutoIncrement());
            payload.put("supportsComment", capability.isSupportsComment());
            payload.put("schemas", schemas);
            return R.ok(payload);
        } catch (Exception ex) {
            log.error("读取逆向元数据失败", ex);
            Throwable causedBy = ExceptionUtil.getCausedBy(ex, SQLException.class);
            String message = causedBy != null ? causedBy.getMessage() : ex.getMessage();
            return R.failed(message);
        } finally {
            JdbcKit.close(connection);
        }
    }
}
