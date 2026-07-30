package com.erdonline.system.service.impl;

import cn.hutool.core.util.StrUtil;
import com.erdonline.system.mapper.OperationExtensionMapper;
import com.erdonline.system.mapper.OperationMapper;
import com.erdonline.system.service.MenuExtensionService;
import com.erdonline.system.service.OperationExtensionService;
import com.erdonline.system.service.OperationService;
import com.erdonline.common.bean.system.Menu;
import com.erdonline.common.bean.system.Operation;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.constant.CommonConstants;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 系统操作 服务实现类
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 */
@Slf4j
@Service
public class OperationExtensionServiceImpl extends MartinServiceImpl<OperationExtensionMapper, Operation> implements OperationExtensionService {

    @Autowired
    private MenuExtensionService menuExtensionService;

    @Override
    protected void setEntity() {
        this.clz = Operation.class;
    }

    @Override
    public R generateOperation(Menu menu) {
        String tableName = menu.getTableName();
        if (StrUtil.isBlank(tableName)) {
            return R.failed(R.pretty(menu.getName()) + "，绑定表名为空");
        }
        boolean flag = this.isTableExits(tableName);
        if (!flag) {
            return R.failed(R.pretty(menu.getName()) + "，绑定表名不存在");
        }
        for (int i = 0; i < CommonConstants.CRUD_SIZE; i++) {
            Operation operation = new Operation();
            operation.setMenuId(menu.getId());
            operation.setName(CommonConstants.CRUD_CN[i]);
            operation.setAuthority(tableName + StrUtil.UNDERLINE + CommonConstants.CRUD_EN[i]);
            baseMapper.insert(operation);
        }
        Menu updateMenu = new Menu();
        updateMenu.setId(menu.getId());
        updateMenu.setFlagIsGentOperation(true);
        menuExtensionService.updateById(updateMenu);
        return R.ok(Boolean.TRUE);
    }

    @Override
    public boolean isTableExits(String tableName) {
        boolean flag = false;
        int tableExits = 0;
        try {
            tableExits = baseMapper.isTableExits(tableName);
            if (tableExits >= 0) {
                flag = true;
            }
        } catch (Exception e) {
            log.error(R.pretty(tableName) + "不存在，", e);
        }
        return flag;
    }
}
