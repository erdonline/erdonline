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
 * @author: 零代科技
 * @version: 1.0
 * @date: 2023/5/7 15:59
 * @describtion: GroupProjectCountRight
 */
@Slf4j
@Component
public class GroupProjectCountRight implements BaseRight<Integer> {
    private Integer limit = 1;
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
        Integer count = this.load();
        if (!reset) {
            count = count - 1;
        }
        return count < limit;
    }

    @Override
    public String msg() {
        return StrUtil.format("团队项目已超过{}个", limit);
    }

    public static void main(String[] args) {
        Integer count = 12;
        String s1 = aes.encryptBase64(String.valueOf(12));
        System.out.println("s1 = " + s1);
        String s = aes.decryptStr(s1);
        System.out.println("s = " + s);

    }
}
