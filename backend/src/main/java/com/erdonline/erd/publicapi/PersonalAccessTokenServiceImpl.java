package com.erdonline.erd.publicapi;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.entity.PersonalAccessToken;
import com.erdonline.erd.mapper.PersonalAccessTokenMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PersonalAccessTokenServiceImpl
        extends ServiceImpl<PersonalAccessTokenMapper, PersonalAccessToken>
        implements PersonalAccessTokenService {

    private static final String REVOKED = "1";
    private static final String ACTIVE = "0";

    @Override
    public PatCreatedView create(CreatePatRequest request) {
        MartinUser user = SecurityContextUtil.getAccessUser();
        Set<String> scopes = PatScopes.normalizeForMint(request.getScopes());
        String plaintext = PatTokenCodec.generatePlaintext();

        PersonalAccessToken row = new PersonalAccessToken();
        row.setUserId(user.getId());
        row.setUsername(user.getUsername());
        row.setName(request.getName().trim());
        row.setTokenHash(PatTokenCodec.hash(plaintext));
        row.setTokenHint(PatTokenCodec.hint(plaintext));
        row.setScopes(PatScopes.toCsv(scopes));
        row.setRevoked(ACTIVE);
        if (request.getExpiresInDays() != null) {
            row.setExpireTime(LocalDateTime.now().plusDays(request.getExpiresInDays()));
        }
        save(row);

        return PatCreatedView.builder()
                .id(row.getId())
                .name(row.getName())
                .scopes(new ArrayList<>(scopes))
                .tokenHint(row.getTokenHint())
                .expireTime(row.getExpireTime())
                .createTime(row.getCreateTime())
                .token(plaintext)
                .build();
    }

    @Override
    public List<PatSummaryView> listMine() {
        MartinUser user = SecurityContextUtil.getAccessUser();
        return list(new LambdaQueryWrapper<PersonalAccessToken>()
                .eq(PersonalAccessToken::getUserId, user.getId())
                .orderByDesc(PersonalAccessToken::getCreateTime))
                .stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Override
    public void revoke(String id) {
        if (!StringUtils.hasText(id)) {
            throw new IllegalArgumentException("id required");
        }
        MartinUser user = SecurityContextUtil.getAccessUser();
        PersonalAccessToken row = getOne(new LambdaQueryWrapper<PersonalAccessToken>()
                .eq(PersonalAccessToken::getId, id)
                .eq(PersonalAccessToken::getUserId, user.getId())
                .last("LIMIT 1"));
        if (row == null) {
            throw new IllegalArgumentException("token not found");
        }
        row.setRevoked(REVOKED);
        updateById(row);
    }

    @Override
    public Optional<AuthenticatedPat> authenticate(String plaintextToken) {
        if (!PatTokenCodec.looksLikePat(plaintextToken)) {
            return Optional.empty();
        }
        String hash = PatTokenCodec.hash(plaintextToken);
        PersonalAccessToken row = getOne(new LambdaQueryWrapper<PersonalAccessToken>()
                .eq(PersonalAccessToken::getTokenHash, hash)
                .eq(PersonalAccessToken::getRevoked, ACTIVE)
                .last("LIMIT 1"));
        if (row == null) {
            return Optional.empty();
        }
        if (row.getExpireTime() != null && row.getExpireTime().isBefore(LocalDateTime.now())) {
            return Optional.empty();
        }
        return Optional.of(toAuthenticatedPat(row));
    }

    /** 可见性放宽供单测：过期/吊销已在外层过滤。 */
    static AuthenticatedPat toAuthenticatedPat(PersonalAccessToken row) {
        Set<String> scopes = PatScopes.parse(row.getScopes());
        List<SimpleGrantedAuthority> authorities = scopes.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
        MartinUser principal = new MartinUser(
                row.getUserId(),
                null,
                new HashSet<>(),
                "0",
                row.getUsername(),
                "N/A",
                true, true, true, true,
                authorities
        );
        return new AuthenticatedPat(principal, row.getId(), new ArrayList<>(scopes));
    }

    @Override
    public void touchLastUsed(String tokenId) {
        if (!StringUtils.hasText(tokenId)) {
            return;
        }
        PersonalAccessToken patch = new PersonalAccessToken();
        patch.setId(tokenId);
        patch.setLastUsedTime(LocalDateTime.now());
        updateById(patch);
    }

    private PatSummaryView toSummary(PersonalAccessToken row) {
        return PatSummaryView.builder()
                .id(row.getId())
                .name(row.getName())
                .scopes(new ArrayList<>(PatScopes.parse(row.getScopes())))
                .tokenHint(row.getTokenHint())
                .expireTime(row.getExpireTime())
                .lastUsedTime(row.getLastUsedTime())
                .createTime(row.getCreateTime())
                .revoked(REVOKED.equals(row.getRevoked()))
                .build();
    }
}
