package com.erdonline.auth.federate;

import com.erdonline.common.bean.system.User;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.userdetail.MartinUserDetailsService;
import com.erdonline.config.ErdSecurityProperties;
import com.erdonline.erd.entity.UserIdentityLink;
import com.erdonline.erd.mapper.UserIdentityLinkMapper;
import com.erdonline.system.mapper.UserExtensionMapper;
import com.erdonline.system.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 回归：解绑（unbind）后重新登录须顺畅重新挂接，不撞「已存在」500。
 * 见 CHANGELOG「联邦登录：解绑后重新登录报「已存在」500」。
 */
@ExtendWith(MockitoExtension.class)
class FederateUserServiceTest {

    @Mock
    private UserIdentityLinkMapper linkMapper;
    @Mock
    private UserMapper userMapper;
    @Mock
    private UserExtensionMapper userExtensionMapper;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private MartinUserDetailsService userDetailsService;
    @Mock
    private ErdSecurityProperties erdSecurityProperties;

    private FederateUserService service;

    @BeforeEach
    void setUp() {
        service = new FederateUserService(
                linkMapper, userMapper, userExtensionMapper, passwordEncoder,
                userDetailsService, erdSecurityProperties);
    }

    private static FederateIdentity googleIdentity(String email, boolean verified) {
        return new FederateIdentity(FederateProvider.GOOGLE, "113298977828932750600", null, email, verified, "Alice");
    }

    @Test
    void unlink_isPhysicalDelete_notLogicalDeleteById() {
        UserIdentityLink link = new UserIdentityLink().setId("link-1").setUserId("user-1").setProvider("google");
        when(linkMapper.selectOne(any())).thenReturn(link);

        service.unlink("user-1", FederateProvider.GOOGLE);

        // 回归核心：必须走物理删除，而不是 BaseMapper#deleteById（会被 delFlag 逻辑删除拦截改写成
        // UPDATE del_flag=1，导致 uk_identity_provider_subject 旧行占坑，见 V15 迁移说明）。
        verify(linkMapper).physicalDeleteById("link-1");
        verify(linkMapper, never()).deleteById(anyString());
    }

    @Test
    void unlink_throwsFederateException404WhenNotLinked() {
        when(linkMapper.selectOne(any())).thenReturn(null);

        FederateException ex = assertThrows(FederateException.class,
                () -> service.unlink("user-1", FederateProvider.GOOGLE));
        assertEquals(404, ex.getStatus());
    }

    @Test
    void resolveForLogin_createsNewUserAndLink_whenNothingExists() {
        when(erdSecurityProperties.isAllowOpenRegister()).thenReturn(true);
        when(linkMapper.selectOne(any())).thenReturn(null); // 无既有链接、无孤儿账号链接检查
        when(userMapper.selectOne(any())).thenReturn(null); // 无同名用户、无同邮箱用户
        when(userMapper.selectCount(any())).thenReturn(0L);
        when(passwordEncoder.encode(anyString())).thenReturn("hash");
        MartinUser user = mock(MartinUser.class);
        when(userDetailsService.loadUserByUsername(anyString())).thenReturn(user);

        MartinUser result = service.resolveForLogin(googleIdentity("alice@example.com", true));

        assertEquals(user, result);
        verify(userMapper).insert(any(User.class));
        verify(linkMapper).insert(any(UserIdentityLink.class));
    }

    @Test
    void resolveForLogin_rejectsNewAccount_whenOpenRegisterDisabled() {
        when(erdSecurityProperties.isAllowOpenRegister()).thenReturn(false);
        when(linkMapper.selectOne(any())).thenReturn(null);
        when(userMapper.selectOne(any())).thenReturn(null);

        FederateException ex = assertThrows(FederateException.class,
                () -> service.resolveForLogin(googleIdentity("alice@example.com", true)));
        assertEquals(403, ex.getStatus());
        verify(userMapper, never()).insert(any(User.class));
    }

    /**
     * 核心回归：unbind 只删链接、留账号（unlink 语义）；重新登录时链接查不到，
     * 但账号仍按约定用户名 google_<sub> 存在——须重新挂接而非当新用户创建。
     * 覆盖 WeChat / 无邮箱 Google 场景（无法靠邮箱兜底重新挂接）。
     */
    @Test
    void resolveForLogin_relinksOrphanedAccount_byConventionUsername_whenLinkMissingAndNoEmail() {
        when(linkMapper.selectOne(any()))
                .thenReturn(null) // findLink(provider, subject) —— 已解绑，找不到
                .thenReturn(null); // canRelink 里 findLinkForUser —— 孤儿账号未挂任何该 provider 链接
        User orphan = new User().setId("user-1").setUsername("google_11329897782893275");
        when(userMapper.selectOne(any())).thenReturn(orphan); // findByUsername 命中孤儿账号
        MartinUser user = mock(MartinUser.class);
        when(userDetailsService.loadUserByUsername("google_11329897782893275")).thenReturn(user);

        MartinUser result = service.resolveForLogin(googleIdentity(null, false));

        assertEquals(user, result);
        ArgumentCaptor<UserIdentityLink> captor = ArgumentCaptor.forClass(UserIdentityLink.class);
        verify(linkMapper).insert(captor.capture());
        assertEquals("user-1", captor.getValue().getUserId());
        verify(userMapper, never()).insert(any(User.class));
    }

    /** 有邮箱且已验证时，既有的按邮箱重新挂接路径依旧生效（不因新增用户名分支而回归）。 */
    @Test
    void resolveForLogin_relinksOrphanedAccount_byEmail_whenUsernameNotConventionBased() {
        when(linkMapper.selectOne(any())).thenReturn(null);
        User orphan = new User().setId("user-2").setUsername("alice").setEmail("alice@example.com");
        // findByUsername(google_xxx) 找不到（当年是邮箱分支起的名），findByEmail 命中
        when(userMapper.selectOne(any()))
                .thenReturn(null)
                .thenReturn(orphan);
        MartinUser user = mock(MartinUser.class);
        when(userDetailsService.loadUserByUsername("alice")).thenReturn(user);

        MartinUser result = service.resolveForLogin(googleIdentity("alice@example.com", true));

        assertEquals(user, result);
        ArgumentCaptor<UserIdentityLink> captor = ArgumentCaptor.forClass(UserIdentityLink.class);
        verify(linkMapper).insert(captor.capture());
        assertEquals("user-2", captor.getValue().getUserId());
        verify(userMapper, never()).insert(any(User.class));
    }

    /** 防劫持：候选账号已挂着同 provider 的另一 subject 链接时，不得重新挂接（不是孤儿账号）。 */
    @Test
    void resolveForLogin_doesNotRelink_whenCandidateAlreadyLinkedToDifferentSubject() {
        when(erdSecurityProperties.isAllowOpenRegister()).thenReturn(true);
        UserIdentityLink otherLink = new UserIdentityLink().setId("link-x").setUserId("user-1").setProvider("google");
        when(linkMapper.selectOne(any()))
                .thenReturn(null) // findLink(provider, subject)：本身没链接
                .thenReturn(otherLink); // canRelink 的 findLinkForUser：该账号已挂别的 google 身份
        User candidate = new User().setId("user-1").setUsername("google_11329897782893275");
        when(userMapper.selectOne(any())).thenReturn(candidate);
        when(userMapper.selectCount(any())).thenReturn(1L, 0L); // 用户名唯一性探测：撞了一次，加随机后缀后不撞
        when(passwordEncoder.encode(anyString())).thenReturn("hash");
        MartinUser user = mock(MartinUser.class);
        when(userDetailsService.loadUserByUsername(anyString())).thenReturn(user);

        service.resolveForLogin(googleIdentity(null, false));

        // 未重新挂接到 candidate；走到了新建用户分支
        verify(userMapper).insert(any(User.class));
    }

    @Test
    void resolveForLogin_translatesDuplicateKeyExceptionTo409() {
        when(erdSecurityProperties.isAllowOpenRegister()).thenReturn(true);
        when(linkMapper.selectOne(any())).thenReturn(null);
        when(userMapper.selectOne(any())).thenReturn(null);
        when(userMapper.selectCount(any())).thenReturn(0L);
        when(passwordEncoder.encode(anyString())).thenReturn("hash");
        when(userMapper.insert(any(User.class)))
                .thenThrow(new DuplicateKeyException("Duplicate entry 'google-113298977828932750600' for key 'x'"));

        FederateException ex = assertThrows(FederateException.class,
                () -> service.resolveForLogin(googleIdentity(null, false)));

        // 不再是裸 500——回调页会用这个 409 走友好错误跳转，而不是直出 JSON。
        assertEquals(409, ex.getStatus());
    }

    @Test
    void listLinks_ordersByProvider() {
        when(linkMapper.selectList(any())).thenReturn(List.of());
        List<UserIdentityLink> links = service.listLinks("user-1");
        assertEquals(0, links.size());
    }

    @Test
    void linkToUser_rejectsWhenAlreadyLinkedToAnotherUser() {
        UserIdentityLink same = new UserIdentityLink().setUserId("user-2");
        when(linkMapper.selectOne(any())).thenReturn(same);

        FederateException ex = assertThrows(FederateException.class,
                () -> service.linkToUser("user-1", googleIdentity("a@b.com", true)));
        assertEquals(409, ex.getStatus());
    }
}
