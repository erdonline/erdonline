package com.erdonline.common.security.client;

import com.erdonline.common.core.constant.CacheConstants;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.oauth2.provider.ClientDetails;
import org.springframework.security.oauth2.provider.client.JdbcClientDetailsService;

import javax.sql.DataSource;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/8/27
 * @describtion MartinClientDetailsService
 * @since 1.0
 */
public class MartinClientDetailsService extends JdbcClientDetailsService {
    public MartinClientDetailsService(DataSource dataSource) {
        super(dataSource);
    }

    /**
     *
     * @param clientId
     * @return
     */
    @Override
    @Cacheable(value = CacheConstants.CLIENT_DETAILS_KEY, key = "#clientId", unless = "#result == null")
    public ClientDetails loadClientByClientId(String clientId) {
        return super.loadClientByClientId(clientId);
    }
}
