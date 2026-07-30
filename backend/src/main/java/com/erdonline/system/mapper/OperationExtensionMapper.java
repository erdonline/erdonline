package com.erdonline.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.erdonline.common.bean.system.Operation;

/**
 * <p>
 * 系统操作 Mapper 接口
 * </p>
 *
 * @author 狮少
 * @version 1.0
 * @date 2021-05-08
 * @describtion
 * @since 1.0
 */
public interface OperationExtensionMapper extends BaseMapper<Operation> {

    /**
     * 判定表在数据库是否存在
     *
     * @param tableName
     * @return
     */
    int isTableExits(String tableName);

}
