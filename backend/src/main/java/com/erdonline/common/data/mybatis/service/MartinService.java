package com.erdonline.common.data.mybatis.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.erdonline.common.bean.system.dto.BaseTreeNode;

import java.util.List;
import java.util.Map;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/8/19
 * @describtion MartinService
 * @since 1.0
 */
public interface MartinService<T> extends IService<T> {
    /**
     * 拓展分页查询、加入排序,并且修复排序传入的字段不能驼峰自动转换
     *
     * @param params
     * @return
     * @throws IllegalAccessException
     * @throws InstantiationException
     */
    IPage<T> getPage(Map params) throws IllegalAccessException, InstantiationException;

     List<BaseTreeNode> tree(T entity);
}
