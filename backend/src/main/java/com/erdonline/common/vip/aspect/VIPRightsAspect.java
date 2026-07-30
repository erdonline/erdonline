package com.erdonline.common.vip.aspect;

import com.erdonline.common.core.support.SpringContextHelper;
import com.erdonline.common.vip.annotation.VIP;
import com.erdonline.common.vip.contex.VIPContext;
import com.erdonline.common.vip.enums.VIPModuleEnum;
import com.erdonline.common.vip.enums.VIPLevelEnum;
import com.erdonline.common.vip.exception.VIPException;
import com.erdonline.common.vip.license.LicenseVerify;
import com.erdonline.common.vip.rights.BaseRight;
import de.schlichtherle.license.LicenseContent;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.util.Arrays;


/**
 * @author: 零代科技
 * @version: 1.0
 * @date: 2023/5/7 10:29
 * @describtion: VIPRightsAspect
 */
@Aspect
@Component
@Slf4j
public class VIPRightsAspect implements VIPAspect {
    @Override
    public void beforeProcess(JoinPoint point, VIP vip) {
        LicenseContent licenseContent = LicenseVerify.licenseContent();
        if (licenseContent == null) {
            VIPModuleEnum module = vip.module();
            log.info("module: {}", module);
            VIPLevelEnum[] vipLevelEnums = vip.vipLevel();
            log.info("vipLevelEnums: {}", vipLevelEnums);
            Class<? extends BaseRight>[] rights = vip.rights();
            log.info("rights: {}", rights);
            VIPContext vipContext = new VIPContext(module, vipLevelEnums, rights);
            Class<? extends BaseRight> filter = vipContext.filter(vip.reset());
            if (filter != null) {
                throw new VIPException(888801, SpringContextHelper.getBean(filter).msg());
            }
        }
    }


    @Override
    public void afterProcess(JoinPoint point, VIP vip) {
        LicenseContent licenseContent = LicenseVerify.licenseContent();
        if (licenseContent == null) {
            VIPModuleEnum module = vip.module();
            log.info("module: {}", module);
            VIPLevelEnum[] vipLevelEnums = vip.vipLevel();
            log.info("vipLevelEnums: {}", vipLevelEnums);
            Class<? extends BaseRight>[] rights = vip.rights();
            log.info("rights: {}", rights);
            VIPContext vipContext = new VIPContext(module, vipLevelEnums, rights);
            vipContext.apply(rights,vip.reset());
        }
    }
}
