package com.erdonline.common.vip.license;

import de.schlichtherle.license.CipherParam;
import de.schlichtherle.license.DefaultCipherParam;
import de.schlichtherle.license.DefaultLicenseParam;
import de.schlichtherle.license.KeyStoreParam;
import de.schlichtherle.license.LicenseContent;
import de.schlichtherle.license.LicenseManager;
import de.schlichtherle.license.LicenseParam;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.File;
import java.text.DateFormat;
import java.text.MessageFormat;
import java.text.SimpleDateFormat;
import java.util.prefs.Preferences;

/**
 * License校验类
 *
 * @author 零代科技
 * @date 2023/4/20
 * @since 1.0.0
 */
@Slf4j
public class LicenseVerify {
    private static volatile LicenseContent licenseContent;


    /**
     * 安装License证书
     *
     * @author 零代科技
     * @date 2023/4/20 16:26
     * @since 1.0.0
     */
    @SneakyThrows
    public synchronized LicenseContent install(LicenseVerifyParam param) {
        LicenseContent result = null;
        DateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

        //1. 安装证书
        LicenseManager licenseManager = LicenseManagerHolder.getInstance(initLicenseParam(param));
        licenseManager.uninstall();

        result = licenseManager.install(new File(param.getLicensePath()));
        log.info(MessageFormat.format("证书安装成功，证书有效期：{0} - {1}", format.format(result.getNotBefore()), format.format(result.getNotAfter())));
        return result;
    }

    /**
     * 校验License证书
     *
     * @return boolean
     * @author 零代科技
     * @date 2023/4/20 16:26
     * @since 1.0.0
     */
    public static boolean verify() {
        try {
            LicenseContent licenseContent = licenseContent();
            DateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            log.debug(MessageFormat.format("证书校验通过，证书有效期：{0} - {1}", format.format(licenseContent.getNotBefore()), format.format(licenseContent.getNotAfter())));
            return true;
        } catch (Exception e) {
            log.debug("证书校验失败！", e);
            return false;
        }
    }

    /**
     * 获取授权信息
     *
     * @return
     * @throws Exception
     */
    public static LicenseContent licenseContent() {
        try {
            CustomLicenseManager licenseManager = LicenseManagerHolder.getInstance(null);
            if (licenseContent == null) {
                synchronized (LicenseVerify.class) {
                    if (licenseContent == null) {
                        //2. 校验证书
                        licenseContent = licenseManager.verify();
                    }
                }
            }
        } catch (Exception e) {
            log.debug("licence授权获取失败:{}", e);
        }
        return licenseContent;
    }

    /**
     * 初始化证书生成参数
     *
     * @param param License校验类需要的参数
     * @return de.schlichtherle.license.LicenseParam
     * @author 零代科技
     * @date 2023/4/20 10:56
     * @since 1.0.0
     */
    private LicenseParam initLicenseParam(LicenseVerifyParam param) {
        Preferences preferences = Preferences.userNodeForPackage(LicenseVerify.class);

        CipherParam cipherParam = new DefaultCipherParam(param.getStorePass());

        KeyStoreParam publicStoreParam = new CustomKeyStoreParam(LicenseVerify.class
                , param.getPublicKeysStorePath()
                , param.getPublicAlias()
                , param.getStorePass()
                , null);

        return new DefaultLicenseParam(param.getSubject()
                , preferences
                , publicStoreParam
                , cipherParam);
    }

}
