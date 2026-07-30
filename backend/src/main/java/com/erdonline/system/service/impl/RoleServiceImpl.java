package com.erdonline.system.service.impl;

import com.erdonline.common.bean.system.Role;
import com.erdonline.system.mapper.RoleMapper;
import com.erdonline.system.service.RoleService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 系统角色 服务实现类
 * </p>
 *
 * @author 狮少
 * @version 1.0
 * @date 2021-05-08
 * @describtion
 * @since 1.0
 */
@Service
public class RoleServiceImpl extends MartinServiceImpl<RoleMapper, Role> implements RoleService {
    @Override
    protected void setEntity() {
        this.clz = Role.class;
    }
}
