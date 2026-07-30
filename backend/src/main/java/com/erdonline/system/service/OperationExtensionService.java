package com.erdonline.system.service;

import com.erdonline.common.bean.system.Menu;
import com.erdonline.common.bean.system.Operation;
import com.erdonline.common.core.api.R;
import com.erdonline.common.data.mybatis.service.MartinService;
import org.springframework.transaction.annotation.Transactional;

/**
 * <p>
 * 系统操作 服务类
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 */
@Transactional(rollbackFor = Exception.class)
public interface OperationExtensionService extends MartinService<Operation> {
    /**
     * 生成菜单CRUD按钮
     *
     * @param menu
     * @return
     */
    R generateOperation(Menu menu);

    /**
     * 判定表在数据库是否存在
     *
     * @param tableName
     * @return
     */
    boolean isTableExits(String tableName);
}
