package com.erdonline.common.core.support;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/3/16
 * @describtion ValidateGroup，用于valid框架中，其区分参数传递类型
 * @since 1.0
 */
public class ValidateGroup {
    /**
     * 新增分组
     */
    public interface Add {

    }

    /**
     * 修改操作分组
     */
    public interface Update {
    }

    /**
     * 删除操作分组
     */
    public interface Delete {
    }

}
