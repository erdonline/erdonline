package com.erdonline.system.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import com.erdonline.system.mapper.PrivilegeExtensionMapper;
import com.erdonline.system.service.PrivilegeExtensionService;
import com.erdonline.common.bean.system.Privilege;
import com.erdonline.common.bean.system.vo.PrivilegeVO;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.constant.CacheConstants;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * <p>
 * 系统权限 服务实现类
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 */
@Service
public class PrivilegeExtensionServiceImpl extends MartinServiceImpl<PrivilegeExtensionMapper, Privilege> implements PrivilegeExtensionService {
    public static final String USER_SECURITY_URL_ALL = CacheConstants.USER_SECURITY_URL_ALL;

    @Override
    @Cacheable(value = CacheConstants.USER_SECURITY_URL, key = "#roleList.toArray()")
    public Set<PrivilegeVO> getPrivilegeByRoles(Set<String> roleList) {
        if (CollUtil.isEmpty(roleList)) {
            return null;
        }
        return this.baseMapper.getPrivilegeByRoles(roleList);
    }

    @Override
    @Cacheable(value = CacheConstants.USER_SECURITY_URL, key = "#root.target.USER_SECURITY_URL_ALL")
    public Set<PrivilegeVO> getAllPrivilege() {
        return this.baseMapper.getPrivilegeByRoles(null);
    }

    @Override
    public Boolean saveCheckedMenus(Map map) {
        Integer roleId = (Integer) map.get("roleId");
        if (roleId != null) {
            this.baseMapper.deleteOldMenus(map);
        }
        Object checkedKeys = map.get("checkedKeys");
        if (checkedKeys instanceof Map) {
            List checked = null;
            if (CollUtil.isNotEmpty((Map) checkedKeys)) {
                checked = (List) ((Map) checkedKeys).get("checked");
                if (CollUtil.isNotEmpty(checked)) {
                    map.put("checked", checked);
                    this.baseMapper.saveCheckedMenus(map);
                } else {
                    return Boolean.FALSE;
                }
            } else {
                return Boolean.FALSE;
            }
        } else if (checkedKeys instanceof List) {
            if (CollUtil.isNotEmpty((List) checkedKeys)) {
                map.put("checked", checkedKeys);
                this.baseMapper.saveCheckedMenus(map);
            } else {
                return Boolean.FALSE;
            }
        } else {
            return Boolean.FALSE;
        }
        return Boolean.TRUE;
    }

    @Override
    public R saveCheckedOperations(Map map) {
        String roleId = (String) map.get("roleId");
        if (ObjectUtil.isNull(roleId)) {
            return R.failed("角色标识roleId为空");
        }
        List checkedKeys = (List) map.get("checkedKeys");
        if (CollUtil.isEmpty(checkedKeys)) {
            return R.failed("权限集合checkedKeys为空");
        }
        this.baseMapper.deleteOldOperations(map);
        this.baseMapper.saveCheckedOperations(map);
        return R.ok("保存角色权限成功");
    }

    @Override
    public void initERDAdminPermission(String roleId) {
        this.baseMapper.initERDAdminPermission(roleId);
    }

    @Override
    public void initERDManagerPermission(String roleId) {
        this.baseMapper.initERDManagerPermission(roleId);
    }

    @Override
    public void initERDCommonPermission(String roleId) {
        this.baseMapper.initERDCommonPermission(roleId);
    }

    @Override
    protected void setEntity() {
        this.clz = Privilege.class;
    }
}
