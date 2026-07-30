package com.erdonline.common.data.dynamic.spring;

import com.erdonline.common.data.dynamic.datasource.DefaultSqlHelperDsManager;
import com.erdonline.common.data.dynamic.datasource.LogicDsMeta;
import com.erdonline.common.data.dynamic.datasource.SqlHelperDsManager;
import com.erdonline.common.data.dynamic.datasource.SqlHelperDynamicDataSourceProxy;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;

import javax.sql.DataSource;

/**
 * @author: liangcan
 * @version: 1.0
 * @date: 2022/12/3 12:49
 * @describtion: SpringSqlHelperDsManager
 */
public class SpringSqlHelperDsManager implements BeanPostProcessor, SqlHelperDsManager {
    private DefaultSqlHelperDsManager sqlHelperDsManager;

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof DataSource) {
            if (bean instanceof SpringSqlHelperDynamicDataSourceProxy) {
                this.sqlHelperDsManager = ((SpringSqlHelperDynamicDataSourceProxy) bean).getSqlHelperDsManager();
                return bean;
            } else {
                SqlHelperDynamicDataSourceProxy dataSource = new SqlHelperDynamicDataSourceProxy((DataSource) bean);
                this.sqlHelperDsManager = dataSource.getSqlHelperDsManager();
                return dataSource;
            }
        }
        return bean;
    }

    @Override
    public void put(String logicName, LogicDsMeta dsMeta) {
        sqlHelperDsManager.put(logicName, dsMeta);
    }

    @Override
    public DataSource remove(String logicName) {
        return sqlHelperDsManager.remove(logicName);
    }

    @Override
    public boolean contains(String logicName) {
        return sqlHelperDsManager.contains(logicName);
    }
}