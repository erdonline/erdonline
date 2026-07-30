package com.erdonline.common.bean.system.vo;

import com.erdonline.common.bean.system.User;
import lombok.Data;

import java.io.Serializable;
import java.util.Map;
import java.util.Set;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/9/5
 * @describtion UserRolePrivilegeVo，传输给前端的权限，包含 菜单/操作/文件/元素 四类权限，后续可以自由扩展
 * @since 1.0
 */
@Data
public class UserRolePrivilegeVo implements Serializable {

    private static final long serialVersionUID = -74188199181458373L;
    /**
     * 当前用户所有信息
     */
    private User user;

    /**
     * 角色信息
     */
    private Set<String> roles;

    /**
     * 菜单权限
     */
    private Set<String> menus;

    /**
     * 操作权限
     */
    private Set<String> operations;

    /**
     * 文件权限
     */
    private Set<String> files;

    /**
     * 页面元素权限
     */
    private Set<String> elements;

    /**
     * 所有权限
     */
    private Set<String> authoritySet;

    /**
     * 基于restful的动态权限验证，所需要的权限集合
     */
    private Set<PrivilegeVO> restfulPrivilege;

    /**
     * 返给前端的集合，包含 菜单/操作/文件/元素 四类权限，后续可以自由扩展
     */
    private Map<String, Set> map;

}
