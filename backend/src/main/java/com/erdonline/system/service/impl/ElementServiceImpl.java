package com.erdonline.system.service.impl;

import com.erdonline.common.bean.system.Element;
import com.erdonline.system.mapper.ElementMapper;
import com.erdonline.system.service.ElementService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 系统页面元素 服务实现类
 * </p>
 *
 * @author 狮少
 * @version 1.0
 * @date 2021-05-08
 * @describtion
 * @since 1.0
 */
@Service
public class ElementServiceImpl extends MartinServiceImpl<ElementMapper, Element> implements ElementService {
    @Override
    protected void setEntity() {
        this.clz = Element.class;
    }
}
