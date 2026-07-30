package com.erdonline.common.data.dynamic.spring;

import com.erdonline.common.data.dynamic.datasource.SqlHelperDynamicDataSourceProxy;
import org.springframework.core.InfrastructureProxy;

import javax.sql.DataSource;
import java.util.function.Function;

/**
 * @author: liangcan
 * @version: 1.0
 * @date: 2022/12/3 12:50
 * @describtion: SqlHelperDynamicDataSourceProxy
 */
public class SpringSqlHelperDynamicDataSourceProxy extends SqlHelperDynamicDataSourceProxy implements InfrastructureProxy {
    public SpringSqlHelperDynamicDataSourceProxy(DataSource primaryDs) {
        super(primaryDs);
    }

    public SpringSqlHelperDynamicDataSourceProxy(DataSource primaryDs, Function<DataSource, DataSource> dsUpgradeCallback) {
        super(primaryDs, dsUpgradeCallback);
    }

    /**
     * 适应spring事务，做到数据源切换后再开启的事务为一个新的事务，保证正常切换。
     *
     * @return
     * @See org.springframework.transaction.support.TransactionSynchronizationUtils#unwrapResourceIfNecessary()
     */
    @Override
    public Object getWrappedObject() {
        return getDatasource();
    }
}

