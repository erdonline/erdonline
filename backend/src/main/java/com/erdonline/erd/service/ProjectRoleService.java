package com.erdonline.erd.service;

import com.erdonline.common.data.mybatis.service.MartinService;
import com.erdonline.erd.entity.ProjectRole;
import org.springframework.transaction.annotation.Transactional;

/**
 * <p>
 *  服务类
 * </p>
 *
 * @author ncnb
 * @version 1.0
 * @date 2022-10-22
 * @describtion
 * @since 1.0
 */
@Transactional(rollbackFor = Exception.class)
public interface ProjectRoleService extends MartinService<ProjectRole> {

}
