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
        //防止数据库中没有配置当前url权限数据时，误拦截所有人。
        //单体开源版策略：未在权限表登记的 URL，对已通过认证的用户放行
        //（返回 null，AbstractSecurityInterceptor 会跳过鉴权 decide）。
        //数据隔离由业务层的项目级权限（project_user / project_role）负责，不依赖此处的功能权限。
        if (CollUtil.isEmpty(configAttributes)) {
            log.debug("URL[{}]未在权限表登记，对已认证用户放行", path);
            return null;
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
