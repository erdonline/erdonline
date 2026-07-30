package com.erdonline.erd.service.impl;


import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import com.erdonline.erd.entity.ProjectRole;
import com.erdonline.erd.mapper.ProjectRoleMapper;
import com.erdonline.erd.service.ProjectRoleService;
import org.springframework.stereotype.Service;

/**
 * <p>
 *  服务实现类
 * </p>
 *
 * @author ncnb
 * @version 1.0
 * @date 2022-10-22
 * @describtion
 * @since 1.0
 */
@Service
public class ProjectRoleServiceImpl extends MartinServiceImpl<ProjectRoleMapper, ProjectRole> implements ProjectRoleService {
    @Override
    protected void setEntity() {
        this.clz = ProjectRole.class;
    }
}
