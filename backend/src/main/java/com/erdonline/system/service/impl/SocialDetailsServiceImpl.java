package com.erdonline.system.service.impl;

import com.erdonline.common.bean.system.SocialDetails;
import com.erdonline.system.mapper.SocialDetailsMapper;
import com.erdonline.system.service.SocialDetailsService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 系统社交账号 服务实现类
 * </p>
 *
 * @author 狮少
 * @date 2019-10-18
 */
@Service
public class SocialDetailsServiceImpl extends MartinServiceImpl<SocialDetailsMapper, SocialDetails> implements SocialDetailsService {

    @Override
    protected void setEntity() {
        this.clz = SocialDetails.class;
    }
}
