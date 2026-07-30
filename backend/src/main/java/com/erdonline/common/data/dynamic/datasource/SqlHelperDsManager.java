package com.erdonline.common.data.dynamic.datasource;

import javax.sql.DataSource;

/**
 * @author: liangcan
 * @version: 1.0
 * @date: 2022/12/3 12:25
 * @describtion: SqlHelperDsManager
 */
public interface SqlHelperDsManager {

    void put(String logicName, LogicDsMeta dsMeta);

    /**
     * 移除某个逻辑数据源
     *
     * @param logicName
     * @return 当对应的数据源id没有被其他逻辑数据源引用时，从管理中删除的Datasource对象。否则返回null
     * @throws SqlHelperException 当logicName不存在
     */
    DataSource remove(String logicName);

    boolean contains(String logicName);
}
