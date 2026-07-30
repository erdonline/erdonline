package com.erdonline.common.vip.license;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.StrUtil;
import lombok.extern.slf4j.Slf4j;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.stereotype.Component;

/**
 * 在项目启动时安装证书
 *
 * @author 零代科技
 * @date 2023/4/24
 * @since 1.0.0
 */
@Slf4j
@Component
public class LicenseCommandLineRunner implements CommandLineRunner {
    /**
     * 证书subject
     */
    @Value("${license.subject:ERD Online授权}")
    private String subject;

    /**
     * 公钥别称
     */
    @Value("${license.publicAlias:publicCert}")
    private String publicAlias;

    /**
     * 访问公钥库的密码
     */
    @Value("${license.storePass:public_ERDOnline88888}")
    private String storePass;

    /**
     * 证书路径
     */
    @Value("${license.licensePath:/opt/erd/license.lic}")
    private String licensePath;

    /**
     * 密钥库存储路径
     */
    @Value("${license.publicKeysStorePath:/opt/erd/publicCerts.keystore}")
    private String publicKeysStorePath;

    @Override
    public void run(String... args) throws Exception {
        try {
            install(null);
        } catch (Exception e) {
            log.error("e: {}", e);
        }
    }

    public void install(String path) {
        log.info("path: {}", path);
        if (StrUtil.isNotBlank(licensePath)&& FileUtil.exist(licensePath)) {
            log.info("尊敬的用户，正在为您安装证书。。。");

            LicenseVerifyParam param = new LicenseVerifyParam();
            param.setSubject(subject);
            param.setPublicAlias(publicAlias);
            param.setStorePass(storePass);
            if(StrUtil.isNotBlank(path)){
                param.setLicensePath(path);
            }else {
                param.setLicensePath(licensePath);
            }
            param.setPublicKeysStorePath(publicKeysStorePath);

            LicenseVerify licenseVerify = new LicenseVerify();
            //安装证书
            licenseVerify.install(param);

            log.info("证书安装结束");
        }else {
            log.info("证书不存在");
        }
    }
}
