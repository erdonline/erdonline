package com.erdonline.erd.vip.rights;

import cn.hutool.core.util.StrUtil;
import com.erdonline.common.core.api.R;
import com.erdonline.common.data.redis.RedisUtil;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.common.vip.rights.BaseRight;
import com.erdonline.erd.service.ProjectService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * 团队项目计数权益。
 * <p>开源版不限制项目个数：{@link #valid} 恒为 true。
 */
@Slf4j
@Component
public class GroupProjectCountRight implements BaseRight<Integer> {
    /** 历史商业限制值；开源版 valid() 忽略此上限 */
    private Integer limit = Integer.MAX_VALUE;
    private String redisItem = "group_project_count";

    @Autowired
    private RedisUtil redisUtil;

    @Autowired
    private ProjectService projectService;

    @Override
    public Integer load() {
        String userId = SecurityContextUtil.getAccessUser().getId();
        String formatRedisKey = StrUtil.format(redisKey, userId);
        String securityCount = redisUtil.hashGet(formatRedisKey, redisItem);
        Integer count = null;
        if (securityCount == null) {
            R<Integer> r = projectService.groupProjectCount();
            if (r.valid()) {
                redisUtil.hashPut(formatRedisKey, redisItem, aes.encryptBase64(String.valueOf(r.getData())), timeout);
                count = r.getData();
            }
        } else {
            count = Integer.valueOf(aes.decryptStr(securityCount));
        }
        return count;
    }

    @Override
    public void reset() {
        String userId = SecurityContextUtil.getAccessUser().getId();
        String formatRedisKey = StrUtil.format(redisKey, userId);
        redisUtil.hashPut(formatRedisKey, redisItem, aes.encryptBase64(String.valueOf(this.load() + 1)), timeout);
    }

    @Override
    public boolean valid(boolean reset) {
        // 开源版：不限制团队项目数量
        return true;
    }

    @Override
    public String msg() {
        return StrUtil.format("团队项目已超过{}个", limit);
    }
}
