package com.erdonline.system.service.impl;

import com.erdonline.system.mapper.DeptMapper;
import com.erdonline.system.service.DeptExtensionService;
import com.erdonline.system.service.DeptService;
import com.erdonline.common.bean.system.Dept;
import com.erdonline.common.bean.system.dto.DeptTreeNode;
import com.erdonline.common.bean.util.TreeUtil;
import com.erdonline.common.core.constant.CommonConstants;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * <p>
 * 系统部门 服务实现类
 * </p>
 *
 * @author 狮少
 * @version 1.0
 * @date 2021-05-08
 * @describtion
 * @since 1.0
 */
@Service
public class DeptExtensionServiceImpl extends MartinServiceImpl<DeptMapper, Dept> implements DeptExtensionService {
    @Override
    protected void setEntity() {
        this.clz = Dept.class;
    }

    @Override
    public List getAllDptTree() {
        List<Dept> list = this.list();
        List<DeptTreeNode> menuTree = TreeUtil.buildDeptTreeByRecursive(list, CommonConstants.MENU_ROOT);
        return menuTree;
    }
}
