package com.erdonline.erd.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.exceptions.ExceptionUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.erdonline.common.bean.system.User;
import com.erdonline.common.bean.system.dto.BaseTreeNode;
import com.erdonline.common.bean.util.TreeUtil;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.exception.StatefulException;
import com.erdonline.common.core.support.SpringContextHelper;
import com.erdonline.common.data.dynamic.datasource.ConnectionSubspaceTypeEnum;
import com.erdonline.common.data.dynamic.datasource.LogicDsMeta;
import com.erdonline.common.data.dynamic.datasource.SqlHelperDsContextHolder;
import com.erdonline.common.data.dynamic.datasource.SqlHelperDsManager;
import com.erdonline.common.data.dynamic.spring.SpringSqlHelperDsManager;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.dto.QueryInfoTreeNode;
import com.erdonline.erd.entity.QueryHistory;
import com.erdonline.erd.entity.QueryInfo;
import com.erdonline.erd.event.QueryHistoryEvent;
import com.erdonline.erd.mapper.QueryInfoMapper;
import com.erdonline.erd.security.SqlGuard;
import com.erdonline.erd.service.QueryHistoryService;
import com.erdonline.erd.service.QueryInfoService;
import com.erdonline.common.core.exception.ValidateException;
import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.datasource.pooled.PooledDataSource;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * <p>
 * sql信息表  服务实现类
 * </p>
 *
 * @author zerocode
 * @version 1.0
 * @date 2022-12-02
 * @describtion
 * @since 1.0
 */
@Slf4j
@Service
public class QueryInfoServiceImpl extends MartinServiceImpl<QueryInfoMapper, QueryInfo> implements QueryInfoService {

    @Autowired
    private QueryHistoryService queryHistoryService;

    @Override
    protected void setEntity() {
        this.clz = QueryInfo.class;
    }

    @Override
    public R exec(Map params) {
        log.info("params: {}", params);
        MartinUser accessUser = SecurityContextUtil.getAccessUser();
        String sql;
        try {
            sql = SqlGuard.assertReadOnly((String) params.get("sql"));
        } catch (ValidateException e) {
            return R.failed(e.getMessage());
        }
        String dbName = (String) params.get("dbName");
        String queryId = (String) params.get("queryId");
        Page page = new Page();
        BeanUtil.fillBeanWithMap(params, page, true);
        if (page.getSize() > 100) {
            page.setSize(100);
        }
        IPage query = null;
        try {
            long start = System.currentTimeMillis();
            query = this.baseMapper.exec(page, sql);
            long end = System.currentTimeMillis();

            QueryHistory queryHistory = new QueryHistory();
            queryHistory.setTitle("");
            queryHistory.setSqlInfo(sql);
            queryHistory.setDbName(dbName);
            queryHistory.setQueryId(queryId);
            queryHistory.setDuration(Long.valueOf((int) (end - start)));
            queryHistory.setCreator(accessUser.getUsername());
            SpringContextHelper.publishEvent(new QueryHistoryEvent(queryHistory));
        } catch (Exception e) {
            log.error("执行SQL异常:", e);
            Throwable causedBy = ExceptionUtil.getCausedBy(e, SQLException.class);
            return R.failed(causedBy.getMessage());
        }
        HashMap<Object, Object> result = new HashMap<>(2);
        if (query.getTotal() > 0) {
            // 假设 result 已经定义为 Map 类型
            List<?> records = query.getRecords(); // 确保 getRecords 返回的是 List
            Map<?, ?> maxMap = records.stream()
                    .filter(record -> record instanceof Map)
                    .map(record -> (Map<?, ?>) record)
                    .max(Comparator.comparingInt(Map::size))
                    .orElse(null);
            if (maxMap != null) {
                result.put("columns", maxMap.keySet());
            }
        } else {
            result.put("columns", new ArrayList<>());
        }
        result.put("tableData", query);
        return R.ok(result);
    }

    @Override
    public R explain(Map params) {
        log.info("params: {}", params);
        MartinUser accessUser = SecurityContextUtil.getAccessUser();
        String sql;
        try {
            sql = SqlGuard.assertReadOnly((String) params.get("sql"));
        } catch (ValidateException e) {
            return R.failed(e.getMessage());
        }
        String dbName = (String) params.get("dbName");
        String queryId = (String) params.get("queryId");

        List<Map> query = null;
        try {
            long start = System.currentTimeMillis();
            query = this.baseMapper.explain(sql);
            long end = System.currentTimeMillis();

            QueryHistory queryHistory = new QueryHistory();
            queryHistory.setTitle("");
            queryHistory.setSqlInfo(sql);
            queryHistory.setDbName(dbName);
            queryHistory.setQueryId(queryId);
            queryHistory.setDuration(Long.valueOf((int) (end - start)));
            queryHistory.setCreator(accessUser.getUsername());
            SpringContextHelper.publishEvent(new QueryHistoryEvent(queryHistory));
        } catch (Exception e) {
            log.error("执行SQL异常:", e);
            Throwable causedBy = ExceptionUtil.getCausedBy(e, SQLException.class);
            return R.failed(causedBy.getMessage());
        }
        HashMap<Object, Object> result = new HashMap<>(2);
        if (CollUtil.isNotEmpty(query)) {
            Map o = query.get(0);
            result.put("columns", o.keySet());
        } else {
            result.put("columns", new ArrayList<>());
        }
        result.put("tableData", query);
        return R.ok(result);
    }

    @Override
    public List<BaseTreeNode> tree(QueryInfo entity) {
        MartinUser accessUser = SecurityContextUtil.getAccessUser();
        entity.setCreator(accessUser.getUsername());
        QueryWrapper<QueryInfo> wrapper = Wrappers.query(entity);
        List<QueryInfo> result = this.list(wrapper);
        List<BaseTreeNode> baseTreeNodeList = result.stream().map(m -> {
            BaseTreeNode baseTreeNode = new QueryInfoTreeNode();
            BeanUtils.copyProperties(m, baseTreeNode);
            return baseTreeNode;
        }).collect(Collectors.toList());
        return TreeUtil.buildTreeByRecursive(baseTreeNodeList, "0");
    }
}
