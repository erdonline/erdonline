package com.erdonline.common.data.dynamic.aspect;

import cn.hutool.core.convert.Convert;
import cn.hutool.http.HttpStatus;
import com.alibaba.druid.DbType;
import com.erdonline.common.api.ncnb.RemoteNcnbDatabase;
import com.erdonline.common.bean.system.Log;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.common.core.support.SpringContextHelper;
import com.erdonline.common.data.dynamic.annotation.Dynamic;
import com.erdonline.common.data.dynamic.datasource.ConnectionSubspaceTypeEnum;
import com.erdonline.common.data.dynamic.datasource.LogicDsMeta;
import com.erdonline.common.data.dynamic.datasource.SqlHelperAutoDbType;
import com.erdonline.common.data.dynamic.datasource.SqlHelperDsContextHolder;
import com.erdonline.common.data.dynamic.datasource.SupportedConnectionSubspaceChange;
import com.erdonline.common.data.dynamic.spring.SpringSqlHelperDsManager;
import com.erdonline.erd.security.JdbcUrlGuard;
import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.datasource.pooled.PooledDataSource;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

import java.sql.Connection;
import java.util.LinkedHashMap;
import java.util.Map;


/**
 * @author: liangcan
 * @version: 1.0
 * @date: 2022/12/3 13:57
 * @describtion: 动态切换数据源
 */
@Aspect
@Component
@Slf4j
public class DynamicAspect {
    @Autowired
    private SpringSqlHelperDsManager springSqlHelperDsManager;
    @Autowired
    private RemoteNcnbDatabase remoteNcnbDatabase;

    @Around("@annotation(dynamic)")
    public Object around(ProceedingJoinPoint point, Dynamic dynamic) throws Throwable {
        Object obj = null;
        try {
            Object[] args = point.getArgs();
            Map params = (Map) args[0];
            String driverClassName = "";
            String url = "";
            String username = "";
            String password = "";
            String key = (String) params.get("key");
            R result = remoteNcnbDatabase.getDataSourceInfoById(key);
            if (result.getCode() == ApiErrorCode.OK.getCode()) {
                LinkedHashMap dataBaseInfo = (LinkedHashMap) result.getData();
                log.info("dataBaseInfo: {}", dataBaseInfo);
                driverClassName = (String) dataBaseInfo.get("driverClassName");
                url = JdbcUrlGuard.assertAllowedAndPin((String) dataBaseInfo.get("url"));
                username = (String) dataBaseInfo.get("username");
                password = (String) dataBaseInfo.get("password");
            }else {
                throw new ValidateException("非法的数据源");
            }
            if (!springSqlHelperDsManager.contains(key)) {
                PooledDataSource pooledDataSource = new PooledDataSource(driverClassName, url, username, password);
                Connection connection = pooledDataSource.getConnection();
                ConnectionSubspaceTypeEnum subspaceType = SupportedConnectionSubspaceChange.getSupportedSubspaceType(connection);
                springSqlHelperDsManager.put(key, LogicDsMeta.builder()
                        .datasourceId(key)
                        .expectedSubspaceType(subspaceType)
                        .createFunc(() -> {
                            return pooledDataSource;
                        }).build());
            }
            SqlHelperDsContextHolder.switchTo(key);
            obj = point.proceed();
        } catch (Exception e) {
            throw e;
        } finally {
            //切回默认数据源
            SqlHelperDsContextHolder.switchTo(null);
        }
        return obj;
    }
}
