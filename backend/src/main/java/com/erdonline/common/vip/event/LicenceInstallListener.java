package com.erdonline.common.vip.event;


import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.StrUtil;
import com.erdonline.common.vip.license.LicenseCommandLineRunner;
import com.erdonline.common.vip.license.LicenseCreatorParam;
import com.erdonline.common.vip.license.LicenseVerify;
import com.erdonline.common.vip.license.LicenseVerifyParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.AutoConfigureOrder;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * @author 狮少
 * @version 1.0
 * @date 2020/9/18
 * @describtion LogListener
 * @since 1.0
 */
@Slf4j
@Component
public class LicenceInstallListener {
    @Autowired
    private LicenseCommandLineRunner licenseCommandLineRunner;

    public void onMessage(String  path) {
        path = path.replace("\"", "");
        log.info("LicenceInstallListener path: {}", path);
        licenseCommandLineRunner.install(path);
    }


}
