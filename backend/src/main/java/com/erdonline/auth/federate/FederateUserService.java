package com.erdonline.auth.federate;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.erdonline.common.bean.system.User;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.userdetail.MartinUserDetailsService;
import com.erdonline.config.ErdSecurityProperties;
import com.erdonline.erd.entity.UserIdentityLink;
import com.erdonline.erd.mapper.UserIdentityLinkMapper;
import com.erdonline.system.mapper.UserExtensionMapper;
import com.erdonline.system.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * 将 IdP 身份解析/绑定到本地用户，并加载 {@link MartinUser}。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FederateUserService {

    private final UserIdentityLinkMapper linkMapper;
    private final UserMapper userMapper;
    private final UserExtensionMapper userExtensionMapper;
    private final PasswordEncoder passwordEncoder;
    private final MartinUserDetailsService userDetailsService;
    private final ErdSecurityProperties erdSecurityProperties;

    @Transactional
    public MartinUser resolveForLogin(FederateIdentity identity) {
        UserIdentityLink existing = findLink(identity.provider(), identity.subject());
        if (existing != null) {
            return loadByUserId(existing.getUserId());
        }
        if (supportsEmailLink(identity)
                && identity.emailVerified()
                && StringUtils.hasText(identity.email())) {
            User byEmail = findByEmail(identity.email());
            if (byEmail != null) {
                insertLink(byEmail.getId(), identity);
                return userDetailsService.loadUserByUsername(byEmail.getUsername());
            }
        }
        if (!erdSecurityProperties.isAllowOpenRegister()) {
            log.warn("federate rejected open register provider={} (erd.security.allow-open-register={})",
                    identity.provider().wire(), erdSecurityProperties.isAllowOpenRegister());
            throw new FederateException(403, "开放注册已关闭，请使用已有账号登录后绑定，或联系管理员");
        }
        User created = createUser(identity);
        insertLink(created.getId(), identity);
        return userDetailsService.loadUserByUsername(created.getUsername());
    }

    @Transactional
    public void linkToUser(String userId, FederateIdentity identity) {
        UserIdentityLink same = findLink(identity.provider(), identity.subject());
        if (same != null) {
            if (!same.getUserId().equals(userId)) {
                throw new FederateException(409, "该第三方账号已绑定其他用户");
            }
            return;
        }
        UserIdentityLink mine = findLinkForUser(userId, identity.provider());
        if (mine != null) {
            throw new FederateException(409, "当前账号已绑定 " + identity.provider().wire());
        }
        insertLink(userId, identity);
    }

    @Transactional
    public void unlink(String userId, FederateProvider provider) {
        UserIdentityLink link = findLinkForUser(userId, provider);
        if (link == null) {
            throw new FederateException(404, "未绑定 " + provider.wire());
        }
        linkMapper.deleteById(link.getId());
    }

    public List<UserIdentityLink> listLinks(String userId) {
        return linkMapper.selectList(new LambdaQueryWrapper<UserIdentityLink>()
                .eq(UserIdentityLink::getUserId, userId)
                .orderByAsc(UserIdentityLink::getProvider));
    }

    private MartinUser loadByUserId(String userId) {
        User u = userMapper.selectById(userId);
        if (u == null || !StringUtils.hasText(u.getUsername())) {
            throw new FederateException(404, "本地用户不存在");
        }
        return userDetailsService.loadUserByUsername(u.getUsername());
    }

    private UserIdentityLink findLink(FederateProvider provider, String subject) {
        return linkMapper.selectOne(new LambdaQueryWrapper<UserIdentityLink>()
                .eq(UserIdentityLink::getProvider, provider.wire())
                .eq(UserIdentityLink::getSubject, subject)
                .last("LIMIT 1"));
    }

    private UserIdentityLink findLinkForUser(String userId, FederateProvider provider) {
        return linkMapper.selectOne(new LambdaQueryWrapper<UserIdentityLink>()
                .eq(UserIdentityLink::getUserId, userId)
                .eq(UserIdentityLink::getProvider, provider.wire())
                .last("LIMIT 1"));
    }

    private User findByEmail(String email) {
        return userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, email.trim())
                .last("LIMIT 1"));
    }

    /** Google / GitHub 在邮箱已验证时允许按邮箱绑定已有用户。 */
    private static boolean supportsEmailLink(FederateIdentity identity) {
        FederateProvider p = identity.provider();
        return p == FederateProvider.GOOGLE || p == FederateProvider.GITHUB;
    }

    private void insertLink(String userId, FederateIdentity identity) {
        UserIdentityLink link = new UserIdentityLink();
        link.setUserId(userId);
        link.setProvider(identity.provider().wire());
        link.setSubject(identity.subject());
        link.setUnionId(identity.unionId());
        link.setEmail(identity.email());
        link.setDisplayName(identity.displayName());
        linkMapper.insert(link);
    }

    private User createUser(FederateIdentity identity) {
        User user = new User();
        user.setUsername(allocateUsername(identity));
        user.setNickname(StringUtils.hasText(identity.displayName())
                ? identity.displayName() : user.getUsername());
        if (StringUtils.hasText(identity.email())) {
            user.setEmail(identity.email().trim());
        }
        user.setPwd(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setDeptId("1");
        user.setLockFlag("0");
        userMapper.insert(user);
        userExtensionMapper.bindRole(user.getId());
        log.info("federate created user id={} username={} provider={}",
                user.getId(), user.getUsername(), identity.provider().wire());
        return user;
    }

    private String allocateUsername(FederateIdentity identity) {
        String base;
        if (StringUtils.hasText(identity.email()) && identity.email().contains("@")) {
            base = identity.email().substring(0, identity.email().indexOf('@'))
                    .replaceAll("[^a-zA-Z0-9_]", "")
                    .toLowerCase(Locale.ROOT);
        } else {
            base = identity.provider().wire() + "_" + identity.subject()
                    .replaceAll("[^a-zA-Z0-9]", "");
        }
        if (base.length() > 24) {
            base = base.substring(0, 24);
        }
        if (!StringUtils.hasText(base)) {
            base = "u_" + IdUtil.fastSimpleUUID().substring(0, 8);
        }
        String candidate = base;
        for (int i = 0; i < 20; i++) {
            Long n = userMapper.selectCount(new LambdaQueryWrapper<User>()
                    .eq(User::getUsername, candidate));
            if (n == null || n == 0) {
                return candidate;
            }
            candidate = base + "_" + IdUtil.fastSimpleUUID().substring(0, 4);
            if (candidate.length() > 32) {
                candidate = candidate.substring(0, 32);
            }
        }
        return "u_" + IdUtil.fastSimpleUUID().substring(0, 16);
    }
}
