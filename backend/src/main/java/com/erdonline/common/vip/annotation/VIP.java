package com.erdonline.common.vip.annotation;


import com.erdonline.common.vip.enums.VIPModuleEnum;
import com.erdonline.common.vip.enums.VIPLevelEnum;
import com.erdonline.common.vip.rights.BaseRight;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Inherited;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;


/**
 * @author 零代科技
 * @version 1.0
 * @date 2023/5/6 17:01
 * @describtion VIP
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
public @interface VIP {
    //模块
    VIPModuleEnum module();

    //会员等级
    VIPLevelEnum[] vipLevel();

    //重载会员权益
    Class<? extends BaseRight>[] rights();

    boolean reset();
}
