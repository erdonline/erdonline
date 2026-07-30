package com.erdonline.common.security.dynamic;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.core.util.URLUtil;
import com.erdonline.common.api.system.RemoteSystemUser;
import com.erdonline.common.bean.system.vo.PrivilegeVO;
import com.erdonline.common.core.api.R;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.access.ConfigAttribute;
import org.springframework.security.access.SecurityConfig;
import org.springframework.security.web.FilterInvocation;
import org.springframework.security.web.access.intercept.FilterInvocationSecurityMetadataSource;
import org.springframework.util.AntPathMatcher;

import javax.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/3/22
 * @describtion 用于获取、生成系统所需权限信息， 完成之后交给 {@link DynamicAccessDecisionManager} 做判断
 * @since 1.0
 */
@Slf4j
public class DynamicSecurityMetadataSource implements FilterInvocationSecurityMetadataSource {
    @Autowired
    private RemoteSystemUser remoteSystem;

    @Override
    public Collection<ConfigAttribute> getAttributes(Object o) throws IllegalArgumentException {
        Map<String, ConfigAttribute> configAttributeMap = new HashMap<>();
        R<Set<PrivilegeVO>> r = remoteSystem.loadSecurity();
        Set<PrivilegeVO> resourceList = r.getData();
        resourceList.stream().forEach((resource) -> {
            if (StrUtil.isAllNotBlank(resource.getUrl(), resource.getMethod(), resource.getAuthority())) {
                configAttributeMap.put(resource.getUrl() + StrUtil.COLON + resource.getMethod()
                        , new SecurityConfig(resource.getAuthority()));
            }
        });
        List<ConfigAttribute> configAttributes = new ArrayList<>();
        //获取当前访问的路径
        String url = ((FilterInvocation) o).getRequestUrl();
        log.debug("DynamicSecurityMetadataSource,接口：{},权限：{}", url, resourceList);
        String path = URLUtil.getPath(url);
        HttpServletRequest request = ((FilterInvocation) o).getHttpRequest();
        AntPathMatcher pathMatcher = new AntPathMatcher();
        configAttributeMap.keySet().stream().forEach((pattern) -> {
            if (pattern != null && pathMatcher.match(pattern, path + StrUtil.COLON + request.getMethod())) {
                configAttributes.add(configAttributeMap.get(pattern));
            }
        });
        //防止数据库中没有配置当前url权限数据，不能进行权限拦截
        if (CollUtil.isEmpty(configAttributes)) {
            log.debug("数据库中没有配置权限数据,系统即将自动干预权限系统");
            ConfigAttribute configAttribute = new SecurityConfig("ROLE_NO_USER");
            configAttributes.add(configAttribute);
        }
        return configAttributes;
    }

    @Override
    public Collection<ConfigAttribute> getAllConfigAttributes() {
        return null;
    }

    @Override
    public boolean supports(Class<?> aClass) {
        return true;
    }
}
