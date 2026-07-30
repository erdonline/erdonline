package com.erdonline.erd.service.impl;

import com.erdonline.erd.entity.Datatype;
import com.erdonline.erd.mapper.DatatypeMapper;
import com.erdonline.erd.service.DatatypeService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 数据域 服务实现类
 * </p>
 *
 * @author 零代科技
 * @version 1.0
 * @date 2023-03-04
 * @describtion
 * @since 1.0
 */
@Service
public class DatatypeServiceImpl extends MartinServiceImpl<DatatypeMapper, Datatype> implements DatatypeService {
    @Override
    protected void setEntity() {
        this.clz = Datatype.class;
    }
}
