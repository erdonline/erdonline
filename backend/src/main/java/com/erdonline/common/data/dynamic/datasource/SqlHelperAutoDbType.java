package com.erdonline.common.data.dynamic.datasource;

import cn.hutool.core.util.StrUtil;
import com.alibaba.druid.DbType;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * @author: liangcan
 * @version: 1.0
 * @date: 2022/12/3 12:31
 * @describtion: SqlHelperAutoDbType
 */
public class SqlHelperAutoDbType {
    public static DbType getDbType(DataSource dataSource) {
        String url = getUrl(dataSource);
        if (StrUtil.isEmpty(url)) {
            throw new SqlHelperException("无法自动获取jdbcUrl，请通过配置指定数据库类型!");
        }
        DbType dbType = fromJdbcUrl(url);
        if (dbType == null) {
            throw new SqlHelperException("无法从" + url + "自动获取数据库类型com.alibaba.druid.DbType，请通过配置指定数据库类型!");
        }
        return dbType;
    }

    public static DbType getDbType(Connection connection) {
        try {
            DbType dbType = fromJdbcUrl(connection.getMetaData().getURL());
            return dbType;
        } catch (SQLException e) {
            throw new SqlHelperException("自动获取DbType失败");
        }
    }

    public static DbType fromJdbcUrl(String jdbcUrl) {
        final String url = jdbcUrl.toLowerCase();
        for (DbType dbType : DbType.values()) {
            if (url.contains(dbType.name().toLowerCase())) {
                return dbType;
            }
        }
        return null;
    }

    /**
     * 获取url
     *
     * @param dataSource
     * @return
     */
    static private String getUrl(DataSource dataSource) {
        Connection conn = null;
        try {
            conn = dataSource.getConnection();
            return conn.getMetaData().getURL();
        } catch (SQLException e) {
            throw new SqlHelperException(e);
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    //ignore
                }
            }
        }
    }


}
