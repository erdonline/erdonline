package com.erdonline.common.security.util;

import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.security.userdetail.MartinUser;
import lombok.experimental.UtilityClass;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;

import java.util.Set;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/10/25
 * @describtion SecurityContextUtil
 * @since 1.0
 */
@UtilityClass
public class SecurityContextUtil {

    public Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    public Set<String> getAuthorities() {
        return AuthorityUtils.authorityListToSet(getAuthentication().getAuthorities());
    }

    /**
     * 次方法的调用方要求不强求在已登录状态
     *
     * @return
     */
    public MartinUser getUser() {
        if (getAuthentication() == null) {
            return null;
        }
        if (getAuthentication() instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return (MartinUser) getAuthentication().getPrincipal();
    }

    /**
     * 次方法的调用方要求必须在已登录的情况下，不然就拒绝
     *
     * @return
     */
    public MartinUser getAccessUser() {
        Authentication authentication = getAuthentication();
        if (authentication == null) {
            throw new AccessDeniedException(ApiErrorCode.UNAUTHORIZED.getMsg());
        }
        if (authentication instanceof AnonymousAuthenticationToken) {
            throw new AccessDeniedException(ApiErrorCode.UNAUTHORIZED.getMsg());
        }
        Object principal = authentication.getPrincipal();
        if (principal == null) {
            throw new AccessDeniedException(ApiErrorCode.UNAUTHORIZED.getMsg());
        }
        return (MartinUser) principal;
    }
}
