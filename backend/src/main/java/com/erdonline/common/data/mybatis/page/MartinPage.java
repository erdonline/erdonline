package com.erdonline.common.data.mybatis.page;

import cn.hutool.core.bean.BeanUtil;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import lombok.Data;
import lombok.SneakyThrows;

import java.util.Map;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/3/17
 * @describtion MartinPage，适配根据前端框架分页参数
 * @since 1.0
 */
@Data
public class MartinPage<T> extends Page<T> {
    /**
     * 第几页
     */
    private static final String CURRENT = "current";
    /**
     * 每页几条
     */
    private static final String SIZE = "size";

    private T condition;

    /**
     * @param params
     * @param entity,传递一个new对象进来作为查询条件
     */
    @SneakyThrows
    public MartinPage(Map params, T entity) {
        super(Integer.parseInt(params.getOrDefault(CURRENT, 1).toString())
                , Integer.parseInt(params.getOrDefault(SIZE, 10).toString()));
        params.remove(CURRENT);
        params.remove(SIZE);
        BeanUtil.fillBeanWithMap(params, entity, true);
        condition = entity;
    }
}
