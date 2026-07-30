package com.erdonline.common.security.dynamic;

import com.erdonline.common.core.api.R;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDecisionManager;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.ConfigAttribute;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.core.Authentication;

import java.util.Collection;
import java.util.Iterator;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/3/22
 * @describtion 判断每个请求是否拥有指定权限，authentication.getAuthorities()所需要的权限，由{@link com.erdonline.common.security.userdetail.MartinUserDetailsService#getUserDetails(R)}  }获取
 * @since 1.0
 */
@Slf4j
public class DynamicAccessDecisionManager implements AccessDecisionManager {

    @Override
    public void decide(Authentication authentication, Object object,
                       Collection<ConfigAttribute> configAttributes) throws AccessDeniedException, InsufficientAuthenticationException {
        Iterator<ConfigAttribute> iterator = configAttributes.iterator();
        boolean match = configAttributes.stream().anyMatch((configAttribute) -> {
            String needAuthority = configAttribute.getAttribute();
            return authentication.getAuthorities().stream().anyMatch((grantedAuthority) ->
                    {
                        if (needAuthority == null) {
                            return false;
                        }
                        String authority = grantedAuthority.getAuthority();
                        boolean flag = needAuthority.trim().equals(authority);
                        log.debug("needAuthority:{},authority:{},equal:{}", needAuthority, authority, flag);
                        return flag;
                    }
            );
        });
        if (match) {
            log.debug("成功匹配到权限数据，即将放行");
            return;
        }
        log.debug("未匹配到权限数据，即将拦截");
        throw new AccessDeniedException("抱歉，您没有访问权限");
    }

    @Override
    public boolean supports(ConfigAttribute configAttribute) {
        return true;
    }

    @Override
    public boolean supports(Class<?> aClass) {
        return true;
    }
}
