package com.erdonline.system.service.impl;

import com.erdonline.common.bean.system.DeptRole;
import com.erdonline.system.mapper.DeptRoleMapper;
import com.erdonline.system.service.DeptRoleService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 系统部门角色关系 服务实现类
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 */
@Service
public class DeptRoleServiceImpl extends MartinServiceImpl<DeptRoleMapper, DeptRole> implements DeptRoleService {

    @Override
    protected void setEntity() {
        this.clz = DeptRole.class;
    }
}
