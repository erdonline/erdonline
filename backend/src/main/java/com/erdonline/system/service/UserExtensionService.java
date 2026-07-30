package com.erdonline.system.service;

import com.erdonline.system.dto.UserDto;
import com.erdonline.common.api.system.RemoteSystemUser;
import com.erdonline.common.bean.system.User;
import com.erdonline.common.core.api.R;
import com.erdonline.common.data.mybatis.service.MartinService;
import org.springframework.transaction.annotation.Transactional;

/**
 * <p>
 * 系统用户 服务类
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 */
@Transactional(rollbackFor = Exception.class)
public interface UserExtensionService extends MartinService<User>,RemoteSystemUser {

    /**
     * 获取当前登录用户的所有信息
     *
     * @return
     */
    R currentUser();

    R accountBasic();

    R accountUpdate(UserDto userDto);
}
