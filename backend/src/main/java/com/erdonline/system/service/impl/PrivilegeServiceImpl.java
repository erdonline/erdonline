package com.erdonline.system.service.impl;

import com.erdonline.common.bean.system.Privilege;
import com.erdonline.system.mapper.PrivilegeMapper;
import com.erdonline.system.service.PrivilegeService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 系统权限 服务实现类
 * </p>
 *
 * @author 狮少
 * @version 1.0
 * @date 2021-05-08
 * @describtion
 * @since 1.0
 */
@Service
public class PrivilegeServiceImpl extends MartinServiceImpl<PrivilegeMapper, Privilege> implements PrivilegeService {
    @Override
    protected void setEntity() {
        this.clz = Privilege.class;
    }
}
