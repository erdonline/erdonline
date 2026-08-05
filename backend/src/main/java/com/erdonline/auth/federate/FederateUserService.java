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
import org.springframework.dao.DuplicateKeyException;
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
        try {
            return resolveForLoginWithoutExistingLink(identity);
        } catch (DuplicateKeyException e) {
            // 兜底：理应已被上面的重新挂接 / 下面的 open-register 分支挡住；仍撞唯一键
            // 大概率是极端并发（同一身份两个回调几乎同时到达）。不再让业务 500 裸抛到浏览器
            // （旧 bug：回调页直出 JSON「已存在」），转成可读的联邦异常，callback() 会转成错误跳转。
            log.warn("federate resolveForLogin duplicate provider={} subject={}: {}",
                    identity.provider().wire(), identity.subject(), e.getMessage());
            throw new FederateException(409, "账号信息冲突，请重新尝试登录");
        }
    }

    private MartinUser resolveForLoginWithoutExistingLink(FederateIdentity identity) {
        // 曾绑定过又解绑（unlink 只删链接，不删账号，见 unlink()）：链接找不到，但账号仍在。
        // 按约定用户名（provider_subject，见 allocateUsername 无邮箱分支）精确匹配，重新挂链接，
        // 而不是当作新用户创建——否则 insert 用户名撞已有账号的唯一键报「已存在」。
        User byConventionUsername = findByUsername(conventionUsername(identity));
        if (byConventionUsername != null && canRelink(byConventionUsername, identity)) {
            log.info("federate relinking orphaned user id={} username={} provider={} (unbind→relogin)",
                    byConventionUsername.getId(), byConventionUsername.getUsername(), identity.provider().wire());
            insertLink(byConventionUsername.getId(), identity);
            return userDetailsService.loadUserByUsername(byConventionUsername.getUsername());
        }
        if (supportsEmailLink(identity)
                && identity.emailVerified()
                && StringUtils.hasText(identity.email())) {
            User byEmail = findByEmail(identity.email());
            if (byEmail != null && canRelink(byEmail, identity)) {
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
        // 物理删除而非 deleteById（逻辑删除会被 UserIdentityLink#delFlag 全局拦截改写成
        // UPDATE del_flag=1）：uk_identity_provider_subject(provider, subject) 不区分 del_flag，
        // 逻辑删除的旧行会一直占坑，导致下次同身份重新登录 insert 新链接时撞唯一键 500。
        // 产品语义：解绑=还给这个 provider+subject 组合的绑定权，不保留软删历史（见 unbind-relink ADR 讨论）。
        linkMapper.physicalDeleteById(link.getId());
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

    private User findByUsername(String username) {
        if (!StringUtils.hasText(username)) {
            return null;
        }
        return userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username)
                .last("LIMIT 1"));
    }

    /**
     * 无邮箱兜底分支的约定用户名（provider_subject），与 {@link #allocateUsername} 首个候选一致
     * （含同样的 24 字符截断，否则长 subject——如 Google 21 位数字 sub——两处算出的串会不一致，
     * 「解绑后重新登录」按用户名找不到孤儿账号）。由外部 subject（IdP 不透明且唯一）派生，
     * 可安全用作重新挂接锚点。
     */
    private static String conventionUsername(FederateIdentity identity) {
        String base = identity.provider().wire() + "_" + sanitizeSubject(identity.subject());
        return base.length() > 24 ? base.substring(0, 24) : base;
    }

    private static String sanitizeSubject(String subject) {
        return subject == null ? "" : subject.replaceAll("[^a-zA-Z0-9]", "");
    }

    /**
     * 重新挂接前的防劫持防护：候选账号若已对同一 provider 挂着别的 subject 的活跃链接，
     * 说明它不是「这个身份解绑后的孤儿账号」，不能重新挂接（防止用户名撞车导致身份错挂）。
     */
    private boolean canRelink(User candidate, FederateIdentity identity) {
        UserIdentityLink linkedElsewhere = findLinkForUser(candidate.getId(), identity.provider());
        return linkedElsewhere == null;
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
            base = conventionUsername(identity);
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
