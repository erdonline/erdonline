package com.erdonline.common.bean.system.mapstruct;

import com.erdonline.common.bean.system.Role;
import com.erdonline.common.bean.system.User;
import com.erdonline.common.bean.system.vo.UserRoleVo;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/8/11
 * @describtion UserRoleVoConverter
 * @since 1.0
 */
@Mapper
public interface UserRoleVoConverter {
    UserRoleVoConverter INSTANCE = Mappers.getMapper(UserRoleVoConverter.class);

    /**
     * 将 User 中的信息映射到VO
     *
     * @param user
     * @return
     */
    UserRoleVo userToVo(User user);

    /**
     * 将 Role 中的信息映射到VO
     *
     * @param role
     * @return
     */
    UserRoleVo roleToVo(Role role);

}
