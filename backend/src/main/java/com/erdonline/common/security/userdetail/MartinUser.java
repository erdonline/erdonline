package com.erdonline.common.security.userdetail;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;
import java.util.Set;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/5/29 10:35
 * @describtion 扩展auth2.0用户信息
 * @since 1.0
 */
public class MartinUser extends User {
    /**
     * 用户ID
     */
    @Getter
    private String  id;

    /**
     * 部门ID
     */
    @Getter
    private String deptId;

    /**
     * 角色ID
     */
    @Getter
    private Set<String> roleIds;

    /**
     * 租户ID
     */
    @Getter
    private String tenantId;

    public MartinUser(String id, String deptId,Set<String> roleIds, String tenantId, String username, String password, boolean enabled, boolean accountNonExpired, boolean credentialsNonExpired, boolean accountNonLocked, Collection<? extends GrantedAuthority> authorities) {
        super(username, password, enabled, accountNonExpired, credentialsNonExpired, accountNonLocked, authorities);
        this.id = id;
        this.deptId = deptId;
        this.roleIds = roleIds;
        this.tenantId = tenantId;
    }
}
