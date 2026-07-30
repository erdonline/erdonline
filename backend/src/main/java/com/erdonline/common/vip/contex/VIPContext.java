package com.erdonline.common.vip.contex;


import com.erdonline.common.core.support.SpringContextHelper;
import com.erdonline.common.vip.enums.VIPModuleEnum;
import com.erdonline.common.vip.enums.VIPLevelEnum;
import com.erdonline.common.vip.rights.BaseRight;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.util.Arrays;
import java.util.Optional;

/**
 * @author 零代科技
 * @version 1.0
 * @date 2023/5/6 17:51
 * @describtion VIPContext
 */
@Data
@Slf4j
@AllArgsConstructor
public class VIPContext {
    //模块
    private VIPModuleEnum module;
    //VIP等级
    private VIPLevelEnum[] vipLevel;
    //权益集合
    private Class<? extends BaseRight>[] rights;

    /**
     * 过滤第一条不满足的会员权益
     *
     * @return
     * @param reset
     */
    public Class<? extends BaseRight> filter(boolean reset) {
        Optional<Class<? extends BaseRight>> first = Arrays.stream(rights)
                .filter(f -> !SpringContextHelper.getBean(f).valid(reset))
                .findFirst();
        boolean present = first.isPresent();
        log.info("present: {}", present);
        if (present) {
            return first.get();
        }
        return null;
    }

    /**
     * 过滤第一条不满足的会员权益
     *
     * @return
     */
    public void apply(Class<? extends BaseRight>[] rights, boolean reset) {
        log.info("rights: {},reset: {}", rights, reset);
        Arrays.stream(rights)
                .forEach(f -> {
                    try {
                        BaseRight bean = SpringContextHelper.getBean(f);
                        if (bean.valid(reset) && reset) {
                            bean.reset();
                        }
                    } catch (Exception e) {
                        log.error("权益执行失败");
                    }
                });
    }
}
