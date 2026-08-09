package com.erdonline.erd.catalog;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.erdonline.common.bean.system.User;
import com.erdonline.erd.entity.UserIdentityLink;
import com.erdonline.erd.mapper.UserIdentityLinkMapper;
import com.erdonline.system.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Locale;

/**
 * ADR-0028：模板作者 handle / 展示名解析。
 * 优先 GitHub handle → 账号 username → nickname；不生成 community-* 占位。
 */
@Component
@RequiredArgsConstructor
public class CatalogAuthorResolver {

    private final UserIdentityLinkMapper identityLinkMapper;
    private final UserService userService;

    public AuthorIdentity resolve(String userId) {
        if (!StringUtils.hasText(userId)) {
            return AuthorIdentity.empty();
        }
        UserIdentityLink github = identityLinkMapper.selectOne(new LambdaQueryWrapper<UserIdentityLink>()
                .eq(UserIdentityLink::getUserId, userId)
                .eq(UserIdentityLink::getProvider, "github")
                .last("LIMIT 1"));
        if (github != null && StringUtils.hasText(github.getDisplayName())) {
            String display = github.getDisplayName().trim();
            return new AuthorIdentity(display.toLowerCase(Locale.ROOT), display);
        }
        User user = userService.getById(userId);
        if (user != null) {
            if (StringUtils.hasText(user.getUsername())) {
                String username = user.getUsername().trim();
                String display = StringUtils.hasText(user.getNickname())
                        ? user.getNickname().trim()
                        : username;
                return new AuthorIdentity(username.toLowerCase(Locale.ROOT), display);
            }
            if (StringUtils.hasText(user.getNickname())) {
                String display = user.getNickname().trim();
                return new AuthorIdentity(display.toLowerCase(Locale.ROOT), display);
            }
        }
        String fallback = userId.length() > 8 ? userId.substring(0, 8) : userId;
        return new AuthorIdentity(fallback.toLowerCase(Locale.ROOT), fallback);
    }

    public String resolveHandle(String userId, String username) {
        AuthorIdentity identity = resolve(userId);
        if (StringUtils.hasText(identity.handle())) {
            return identity.handle();
        }
        return StringUtils.hasText(username) ? username.trim().toLowerCase(Locale.ROOT) : "";
    }

    public record AuthorIdentity(String handle, String displayName) {
        static AuthorIdentity empty() {
            return new AuthorIdentity("", "");
        }
    }
}
