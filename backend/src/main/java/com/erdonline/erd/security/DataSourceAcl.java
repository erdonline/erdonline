package com.erdonline.erd.security;

import cn.hutool.core.util.StrUtil;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.entity.DataSources;
import com.erdonline.erd.mapper.DataSourcesMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * dataSources tenancy: creator ownership (list already filters by username).
 *
 * <p>直查 {@code DataSourcesMapper}（绕过 {@code DataSourcesServiceImpl}），故须自行调用
 * {@link DataSourceCredentialCipher} 解密 username/password（R-DATA-06），
 * 让 {@code ConnectorCredentialResolver} 等下游拿到明文用于建连。</p>
 */
@Component
@RequiredArgsConstructor
public class DataSourceAcl {

    private final DataSourcesMapper dataSourcesMapper;
    private final DataSourceCredentialCipher credentialCipher;

    public DataSources requireOwned(String id) {
        MartinUser user = SecurityContextUtil.getAccessUser();
        return requireOwned(id, user.getId(), user.getUsername());
    }

    public DataSources requireOwned(String id, String userId, String username) {
        if (StrUtil.isBlank(id)) {
            throw new ValidateException(ApiErrorCode.FORBIDDEN);
        }
        DataSources ds = dataSourcesMapper.selectById(id);
        if (ds == null || !ResourceOwnership.matchesCreator(ds.getCreator(), userId, username)) {
            throw new ValidateException(ApiErrorCode.FORBIDDEN);
        }
        credentialCipher.decryptInPlace(ds);
        return ds;
    }

    public void assertOwned(String id) {
        requireOwned(id);
    }
}
