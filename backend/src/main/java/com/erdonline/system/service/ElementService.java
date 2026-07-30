package com.erdonline.system.service;

import com.erdonline.common.bean.system.Element;
import com.erdonline.common.data.mybatis.service.MartinService;
import org.springframework.transaction.annotation.Transactional;

/**
 * <p>
 * 系统页面元素 服务类
 * </p>
 *
 * @author 狮少
 * @version 1.0
 * @date 2021-05-08
 * @describtion
 * @since 1.0
 */
@Transactional(rollbackFor = Exception.class)
public interface ElementService extends MartinService<Element> {

}
