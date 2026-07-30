package com.erdonline.system.service;

import com.erdonline.common.bean.system.Dept;
import com.erdonline.common.data.mybatis.service.MartinService;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * <p>
 * 系统部门 服务类
 * </p>
 *
 * @author 狮少
 * @version 1.0
 * @date 2021-05-08
 * @describtion
 * @since 1.0
 */
@Transactional(rollbackFor = Exception.class)
public interface DeptExtensionService extends MartinService<Dept> {
    /**
     * 获取系统所有菜单树
     *
     * @return
     */
    List getAllDptTree();
}
