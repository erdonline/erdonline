package com.erdonline.erd.service.impl;

import com.erdonline.erd.entity.TestJson;
import com.erdonline.erd.mapper.TestJsonMapper;
import com.erdonline.erd.service.TestJsonService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * <p>
 *  服务实现类
 * </p>
 *
 * @author 零代科技
 * @version 1.0
 * @date 2023-02-26
 * @describtion
 * @since 1.0
 */
@Service
public class TestJsonServiceImpl extends MartinServiceImpl<TestJsonMapper, TestJson> implements TestJsonService {
    @Override
    protected void setEntity() {
        this.clz = TestJson.class;
    }
}
