package com.erdonline.erd.catalog;

import com.erdonline.common.bean.system.User;
import com.erdonline.erd.entity.UserIdentityLink;
import com.erdonline.erd.mapper.UserIdentityLinkMapper;
import com.erdonline.system.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogAuthorResolverTest {

    @Mock
    private UserIdentityLinkMapper identityLinkMapper;
    @Mock
    private UserService userService;

    private CatalogAuthorResolver resolver;

    @BeforeEach
    void setUp() {
        resolver = new CatalogAuthorResolver(identityLinkMapper, userService);
    }

    @Test
    void resolve_prefersGithubHandle() {
        UserIdentityLink github = new UserIdentityLink();
        github.setDisplayName("OctoCat");
        when(identityLinkMapper.selectOne(any())).thenReturn(github);

        CatalogAuthorResolver.AuthorIdentity identity = resolver.resolve("user-1");

        assertEquals("octocat", identity.handle());
        assertEquals("OctoCat", identity.displayName());
        verifyNoInteractions(userService);
    }

    @Test
    void resolve_withoutGithub_usesUsernameAndNickname() {
        when(identityLinkMapper.selectOne(any())).thenReturn(null);
        User user = new User();
        user.setUsername("alice");
        user.setNickname("Alice Li");
        when(userService.getById("user-2")).thenReturn(user);

        CatalogAuthorResolver.AuthorIdentity identity = resolver.resolve("user-2");

        assertEquals("alice", identity.handle());
        assertEquals("Alice Li", identity.displayName());
    }

    @Test
    void resolve_withoutGithubOrNickname_usesUsernameAsDisplay() {
        when(identityLinkMapper.selectOne(any())).thenReturn(null);
        User user = new User();
        user.setUsername("bob");
        when(userService.getById("user-3")).thenReturn(user);

        CatalogAuthorResolver.AuthorIdentity identity = resolver.resolve("user-3");

        assertEquals("bob", identity.handle());
        assertEquals("bob", identity.displayName());
    }

    @Test
    void resolveHandle_withoutUserId_fallsBackToUsername() {
        assertEquals("carol", resolver.resolveHandle(null, "Carol"));
    }
}
