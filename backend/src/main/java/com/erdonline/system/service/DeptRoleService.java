package com.erdonline.system.service;

import com.erdonline.common.bean.system.DeptRole;
import com.baomidou.mybatisplus.extension.service.IService;
import com.erdonline.common.data.mybatis.service.MartinService;
import org.springframework.transaction.annotation.Transactional;

/**
 * <p>
 * 系统部门角色关系 服务类
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 */
@Transactional(rollbackFor = Exception.class)
public interface DeptRoleService extends MartinService<DeptRole> {

}
