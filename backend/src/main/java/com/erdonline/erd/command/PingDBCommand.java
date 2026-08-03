package com.erdonline.erd.command;

import com.erdonline.common.core.api.R;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.erd.util.JdbcKit;
import lombok.extern.slf4j.Slf4j;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Map;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/4/26
 * @describtion PingDBCommand
 * @since 1.0
 */
@Slf4j
public class PingDBCommand extends AbstractDBCommand<R> {

    public PingDBCommand() {
    }

    public R exec(Map<String, String> params) {
        try {
            super.init(params);
        } catch (ValidateException e) {
            return R.failed(e.getMessage());
        }

        try {
            Class.forName(this.driverClassName);
        } catch (ClassNotFoundException var11) {
            log.error("", var11);
            return R.failed("驱动加载失败，驱动类不存在(ClassNotFoundException)！出错消息：" + var11.getMessage());
        }

        Connection conn = null;

        try {
            conn = DriverManager.getConnection(this.url, this.username, this.password);
            return R.ok("连接成功");
        } catch (SQLException var9) {
            log.error("连接失败!出错消息", var9);
            return R.failed("连接失败!出错消息：" + var9.getMessage());
        } finally {
            JdbcKit.close(conn);
        }

    }
}

