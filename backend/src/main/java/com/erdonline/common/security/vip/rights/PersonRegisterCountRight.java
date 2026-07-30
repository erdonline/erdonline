package com.erdonline.common.security.vip.rights;

import cn.hutool.core.util.StrUtil;
import com.erdonline.common.api.system.RemoteSystemUser;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.data.redis.RedisUtil;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.common.vip.rights.BaseRight;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2023/5/7 15:59
 * @describtion: PersonCountRight
 */
@Slf4j
@Component
public class PersonRegisterCountRight implements BaseRight<Integer> {
    private Integer limit = 5;
    private String redisItem = "person_register_count";

    @Autowired
    private RedisUtil redisUtil;

    @Autowired
    private RemoteSystemUser remoteSystem;

    @Override
    public Integer load() {
        R<Integer> r = remoteSystem.totalUser();
        log.info("r: {}", r);
        if (r.valid()) {
            return r.getData();
        }
        return 0;
    }

    @Override
    public void reset() {
        String userId = SecurityContextUtil.getAccessUser().getId();
        String formatRedisKey = StrUtil.format(redisKey, userId);
        redisUtil.hashPut(formatRedisKey, redisItem, this.load() + 1, timeout);
    }

    @Override
    public boolean valid(boolean reset) {
        return this.load() < limit;
    }

    @Override
    public String msg() {
        return ApiErrorCode.GLOBAL_REGISTER_PERSON_COUNT.getMsg();
    }
}
