package com.erdonline.erd.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.erdonline.erd.entity.UserIdentityLink;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Param;

/**
 * 第三方身份链接 Mapper（ADR-0021）。
 */
public interface UserIdentityLinkMapper extends BaseMapper<UserIdentityLink> {

    /**
     * 物理删除（绕过 {@code delFlag} 逻辑删除拦截）。
     *
     * <p>{@code uk_identity_provider_subject (provider, subject)} 未区分 del_flag，
     * 若用逻辑删除（UPDATE del_flag=1）解绑，旧行仍占坑，下次同身份重新绑定 insert 会撞唯一键
     * 报 DuplicateKeyException（回归见 FederateUserServiceTest#unlink_isPhysicalDelete）。
     * 解绑即彻底释放坑位，语义上也无需保留身份链接的软删除历史。
     */
    @Delete("DELETE FROM user_identity_link WHERE id = #{id}")
    int physicalDeleteById(@Param("id") String id);
}
