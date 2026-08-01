package com.erdonline.common.security.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import com.erdonline.common.core.constant.CommonConstants;
import com.erdonline.common.security.util.SecurityContextUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/11/1
 * @describtion MybatisPlusConfiguration
 * @since 1.0
 */
@Configuration
@Slf4j
public class MybatisPlusConfiguration implements MetaObjectHandler {

    /**
     * 在进行填充时，需要保证填充对象与填充数据类型一致，不然无法填充
     *
     * @param metaObject
     */
    @Override
    public void insertFill(MetaObject metaObject) {
        log.debug("start insert fill ....");
        if (SecurityContextUtil.getUser() != null) {
            this.setFieldValByName(CommonConstants.CREATOR, SecurityContextUtil.getUser().getUsername() + "", metaObject);
        }
        this.setFieldValByName(CommonConstants.CREATE_TIME, LocalDateTime.now(), metaObject);
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        log.debug("start update fill ....");
        if (SecurityContextUtil.getUser() != null) {
            this.setFieldValByName(CommonConstants.UPDATER, SecurityContextUtil.getUser().getUsername() + "", metaObject);
        }
        this.setFieldValByName(CommonConstants.UPDATE_TIME, LocalDateTime.now(), metaObject);
    }
}
