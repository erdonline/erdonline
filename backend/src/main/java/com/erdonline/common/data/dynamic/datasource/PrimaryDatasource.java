package com.erdonline.common.data.dynamic.datasource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * @author: liangcan
 * @version: 1.0
 * @date: 2022/12/3 12:29
 * @describtion: PrimaryDatasource
 */
public class PrimaryDatasource extends SimpleProxyDatasource {
    private String primaryDsInitialSubspace;

    /**
     * Instantiates a new Primary datasource.
     *
     * @param dataSource the data source
     */
    public PrimaryDatasource(DataSource dataSource) {
        super(dataSource);
        init();
    }

    private void init() {
        try (Connection connection = super.getConnection()) {
            this.primaryDsInitialSubspace = SupportedConnectionSubspaceChange.getCurrentSubspaceIfSupport(connection, null);
        } catch (SQLException e) {
            throw new SqlHelperException(e);
        }
    }

    @Override
    public Connection getConnection() throws SQLException {
        Connection connection = super.getConnection();
        SupportedConnectionSubspaceChange.changeSubspaceIfSupport(connection, primaryDsInitialSubspace, null);
        return connection;
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        Connection connection = super.getConnection(username, password);
        SupportedConnectionSubspaceChange.changeSubspaceIfSupport(connection, primaryDsInitialSubspace, null);
        return connection;
    }
}