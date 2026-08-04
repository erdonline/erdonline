package com.erdonline.erd.publicapi;

import com.erdonline.common.security.userdetail.MartinUser;

import java.util.List;
import java.util.Optional;

public interface PersonalAccessTokenService {

    PatCreatedView create(CreatePatRequest request);

    List<PatSummaryView> listMine();

    void revoke(String id);

    /**
     * 校验明文 PAT，成功返回已注入 scope authorities 的 {@link MartinUser}。
     */
    Optional<AuthenticatedPat> authenticate(String plaintextToken);

    void touchLastUsed(String tokenId);

    record AuthenticatedPat(MartinUser user, String tokenId, List<String> scopes) {
    }
}
