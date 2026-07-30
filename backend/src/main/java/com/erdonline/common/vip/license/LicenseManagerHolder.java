package com.erdonline.common.vip.license;

import de.schlichtherle.license.LicenseManager;
import de.schlichtherle.license.LicenseParam;

/**
 * de.schlichtherle.license.LicenseManager的单例
 *
 * @author 零代科技
 * @date 2023/4/19
 * @since 1.0.0
 */
public class LicenseManagerHolder {

    private static volatile CustomLicenseManager LICENSE_MANAGER;

    public static CustomLicenseManager getInstance(LicenseParam param){
        if(LICENSE_MANAGER == null){
            synchronized (LicenseManagerHolder.class){
                if(LICENSE_MANAGER == null){
                    LICENSE_MANAGER = new CustomLicenseManager(param);
                }
            }
        }

        return LICENSE_MANAGER;
    }

}
