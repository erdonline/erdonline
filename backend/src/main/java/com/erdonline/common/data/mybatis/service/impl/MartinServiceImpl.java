package com.erdonline.common.data.mybatis.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.collection.ListUtil;
import cn.hutool.core.util.ReflectUtil;
import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.metadata.OrderItem;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.erdonline.common.bean.system.dto.BaseTreeNode;
import com.erdonline.common.bean.util.TreeUtil;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.constant.CommonConstants;
import com.erdonline.common.core.exception.StatefulException;
import com.erdonline.common.data.mybatis.parser.EntityParser;
import com.erdonline.common.data.mybatis.parser.TableLinkage;
import com.erdonline.common.data.mybatis.service.MartinService;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/8/19
 * @describtion MartinServiceImpl, 拓展mp的service，加入自己定义的通用方法
 * @since 1.0
 */
@Data
@Slf4j
public abstract class MartinServiceImpl<M extends BaseMapper<T>, T> extends ServiceImpl<M, T> implements MartinService<T> {
    protected Class<T> clz;

    @Autowired
    private ApplicationContext applicationContext;

    @Override
    public IPage<T> getPage(Map params) throws IllegalAccessException, InstantiationException {
        this.setEntity();
        Page page = new Page();
        BeanUtil.fillBeanWithMap(params, page, true);
        if (page.getSize() > 100) {
            throw new StatefulException(ApiErrorCode.PAGE_LIMIT_ERROR);
        }
        T entity = clz.newInstance();
        BeanUtil.fillBeanWithMap(params, entity, true);

        //修复排序的时候，驼峰不能自动转下划线问题
        ordersToUnderlineCase(page);
        QueryWrapper<T> query = Wrappers.query(entity);
        //对时间字段进行过滤
        filterDateTime(entity, query);
        //查询结果
        this.page(page, query);
        //填充注解字段
//        Page resultPage = fillAnnotationField(page, entity);
        return page;
    }

    @Override
    public List<BaseTreeNode> tree(T entity) {
        QueryWrapper<T> wrapper = Wrappers.query(entity);
        List<T> result = this.list(wrapper);
        List<BaseTreeNode> baseTreeNodeList = result.stream().map(m -> {
            BaseTreeNode baseTreeNode = new BaseTreeNode();
            BeanUtils.copyProperties(m, baseTreeNode);
            return baseTreeNode;
        }).collect(Collectors.toList());
        return TreeUtil.buildTreeByRecursive(baseTreeNodeList, "0");
    }

    /**
     * 根据entity上的注解，填充带注解的字段
     *
     * @param page
     * @param entity
     */
    private Page fillAnnotationField(Page page, T entity) {
        //根据Entity获取对应的该entity所有的外键注解信息
        List<TableLinkage> tableLinkages = EntityParser.getTableLinkageByEntity(entity.getClass());
        return queryBindTableAndFilField(page, tableLinkages);
    }

    /**
     * 根据注解信息，填充返回结果
     *
     * @param page          ，分页结果
     * @param tableLinkages ，当前entity的所有需要处理的注解信息
     */
    private Page queryBindTableAndFilField(Page page, List<TableLinkage> tableLinkages) {
        //没有注解字段，无需处理
        if (CollUtil.isEmpty(tableLinkages)) {
            return page;
        }
        Page<Map<String, Object>> resultPage = new Page<>();
        for (TableLinkage tableLinkage : tableLinkages) {
            QueryWrapper query = Wrappers.query();
            String pk = null;
            //获取关联entity的主键，BindDict默认为id，其余通过算法获得
            if (tableLinkage.getBindEntity() != null) {
                pk = EntityParser.getPrimaryKey(tableLinkage.getBindEntity());
            } else {
                pk = CommonConstants.PRIMARY_KRY;
            }
            //指定要查询的列
            query.select(pk, tableLinkage.getBindColumn());
            //该项是为BindDict准备的，用于过滤type字段
            if (tableLinkage.getType() != null) {
                query.eq("type", tableLinkage.getType());
            }
            List records = null;
            boolean resultRecordsEmpty = CollUtil.isEmpty(resultPage.getRecords());
            if (resultRecordsEmpty) {
                records = page.getRecords();
            } else {
                //将page的其他属性复制给resultPage
                records = resultPage.getRecords();
                resultPage = page;
                resultPage.setRecords(records);
            }
            //获取当前注解字段的字段名称
            String currentAnnotationFieldName = tableLinkage.getField().getName();
            //定义一个长度为1的array，用于往lambda表达式中传值
            final Map[] lambdaArray = {new HashMap<>((int) page.getSize())};
            //获取page中的要关联的外键集合
            List collect = (List) records.stream().filter(m -> BeanUtil.getFieldValue(m, currentAnnotationFieldName) != null)
                    .map(m -> BeanUtil.getFieldValue(m, currentAnnotationFieldName))
                    .collect(Collectors.toList());
            //如果外键存在值，才去查询外键表，避免不必要的查询
            if (CollUtil.isNotEmpty(collect)) {
                //添加过滤条件，避免全表查询
                query.in(pk, collect);
                //查询数据库中当前注解值的所有记录
                List<Map<String, Object>> list = tableLinkage.getMartinService().listMaps(query);
                //将查询结果转化为一个map，方便后面赋值tableLinkage = {TableLinkage@20409} "TableLinkage(type=null, field=private java.lang.String com.erdonline.erd.entity.DataDict.creator, bindColumn=username, bindEntity=class com.erdonline.common.bean.system.User, martinService=null)"
                lambdaArray[0] = list.stream().collect(
                        Collectors.toMap(
                                map -> map.get(CommonConstants.PRIMARY_KRY).toString(),
                                map -> map.get(tableLinkage.getBindColumn())
                        )
                );
            }
            ArrayList<Map<String, Object>> resultList = new ArrayList<>();
            //为分页结果的每一条记录增加一个字段
            records.stream()
                    .forEach(t -> {
                        Map<String, Object> resultMap = null;
                        if (resultRecordsEmpty) {
                            resultMap = BeanUtil.beanToMap(t);
                        } else {
                            resultMap = (Map) t;
                        }
                        Map<String, Object> tmpMap = lambdaArray[0];
                        String fieldName = tableLinkage.getField().getName();
                        Object key = resultMap.get(fieldName);
                        if (fieldName.endsWith(CommonConstants.FK_SUFFIX)) {
                            fieldName = StrUtil.subWithLength(fieldName, 0, fieldName.length() - 2);
                        }
                        if (key != null) {
                            resultMap.put(fieldName + CommonConstants.BIND_SUFFIX, tmpMap.get(key.toString()));
                        } else {
                            resultMap.put(fieldName + CommonConstants.BIND_SUFFIX, null);

                        }
                        resultList.add(resultMap);
                    });
            resultPage.setRecords(resultList);
        }
        return resultPage;
    }

    /**
     * 对时间字段进行过滤
     *
     * @param entity
     * @param query
     * @throws IllegalAccessException
     */
    private void filterDateTime(T entity, QueryWrapper<T> query) throws IllegalAccessException {
        try {
            Field field = entity.getClass().getDeclaredField(CommonConstants.CREATE_TIME);
            field.setAccessible(true);
            field.set(entity, null);
            Object createTime = ReflectUtil.invoke(entity, "get" + StrUtil.upperFirst(CommonConstants.CREATE_TIME));
            if (createTime != null) {
                reflectSetEntity(entity, query, (LocalDateTime) createTime, CommonConstants.CREATE_TIME);
            }
        } catch (NoSuchFieldException e) {
            log.error("获取不到 createTIme 字段", e);
        }

        try {
            Field field = entity.getClass().getDeclaredField(CommonConstants.UPDATE_TIME);
            field.setAccessible(true);
            field.set(entity, null);
            Object updateTime = ReflectUtil.invoke(entity, "get" + StrUtil.upperFirst(CommonConstants.UPDATE_TIME));
            if (updateTime != null) {
                reflectSetEntity(entity, query, (LocalDateTime) updateTime, CommonConstants.UPDATE_TIME);
            }
        } catch (NoSuchFieldException e) {
            log.error("获取不到 updateTIme 字段", e);
        }
    }

    /**
     * 修复排序的时候，驼峰不能自动转下划线问题
     *
     * @param page
     */
    private void ordersToUnderlineCase(Page page) {
        List<OrderItem> orders = page.orders();
        if (CollUtil.isNotEmpty(orders)) {
            for (OrderItem orderItem : orders) {
                String column = orderItem.getColumn();
                if (StrUtil.isNotBlank(column)) {
                    String underlineCase = StrUtil.toUnderlineCase(column);
                    if (log.isDebugEnabled()) {
                        log.debug("column = " + underlineCase);
                    }
                    orderItem.setColumn(underlineCase);
                }
            }
        }
    }

    /**
     * 反射设置entity中的新增、修改时间为null,不然mybatis-plus会自己增加精确匹配
     *
     * @param entity
     * @param query
     * @param dateTime
     * @param column
     * @throws IllegalAccessException
     */
    private void reflectSetEntity(T entity, QueryWrapper<T> query, LocalDateTime dateTime, String column) throws IllegalAccessException {
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        query.like(StrUtil.toUnderlineCase(column), dtf.format(dateTime));

    }

    /**
     * 每个子类都必须调用该方法
     *
     * @return
     */
    protected abstract void setEntity();
}
