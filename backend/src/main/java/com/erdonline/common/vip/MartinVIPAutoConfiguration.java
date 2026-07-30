package com.erdonline.common.vip;

import com.erdonline.common.vip.contex.VIPContextHolder;
import com.erdonline.common.vip.rights.BaseRight;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

import java.util.Iterator;
import java.util.ServiceLoader;

/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2023/5/7 11:31
 * @describtion: MartinVIPAutoConfiguration
 */
@Slf4j
@Configuration
@AllArgsConstructor
@ConditionalOnWebApplication
@ComponentScan(basePackages = {"com.erdonline.common.vip", "com.erdonline.common.core"})
public class MartinVIPAutoConfiguration implements InitializingBean {

    @Override
    public void afterPropertiesSet() throws Exception {
        log.info("初始化会员权益");
        ServiceLoader<BaseRight> load = ServiceLoader.load(BaseRight.class);
        Iterator<BaseRight> iterator = load.iterator();
        while (iterator.hasNext()) {
            BaseRight right = iterator.next();
            VIPContextHolder.add(right.getClass().getName(),right);
        }
    }
}
