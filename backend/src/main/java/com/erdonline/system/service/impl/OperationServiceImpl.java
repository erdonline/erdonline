package com.erdonline.system.service.impl;

import com.erdonline.common.bean.system.Operation;
import com.erdonline.system.mapper.OperationMapper;
import com.erdonline.system.service.OperationService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 系统操作 服务实现类
 * </p>
 *
 * @author 狮少
 * @version 1.0
 * @date 2021-05-08
 * @describtion
 * @since 1.0
 */
@Service
public class OperationServiceImpl extends MartinServiceImpl<OperationMapper, Operation> implements OperationService {
    @Override
    protected void setEntity() {
        this.clz = Operation.class;
    }
}
