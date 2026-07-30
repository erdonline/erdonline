package com.erdonline.system.service.impl;

import com.erdonline.common.bean.system.Code;
import com.erdonline.system.mapper.CodeMapper;
import com.erdonline.system.service.CodeService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 系统代码生成表 服务实现类
 * </p>
 *
 * @author 狮少
 * @version 1.0
 * @date 2021-05-08
 * @describtion
 * @since 1.0
 */
@Service
public class CodeServiceImpl extends MartinServiceImpl<CodeMapper, Code> implements CodeService {
    @Override
    protected void setEntity() {
        this.clz = Code.class;
    }
}
