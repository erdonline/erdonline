package com.erdonline.system.service.impl;

import com.erdonline.common.bean.system.User;
import com.erdonline.system.mapper.UserMapper;
import com.erdonline.system.service.UserService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 系统用户 服务实现类
 * </p>
 *
 * @author 狮少
 * @version 1.0
 * @date 2021-05-08
 * @describtion
 * @since 1.0
 */
@Service
public class UserServiceImpl extends MartinServiceImpl<UserMapper, User> implements UserService {
    @Override
    protected void setEntity() {
        this.clz = User.class;
    }
}
