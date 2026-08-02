package com.erdonline.config;

import org.springframework.boot.actuate.info.Info;
import org.springframework.boot.actuate.info.InfoContributor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 自部署可观测：{@code GET /actuator/info} 暴露应用名与版本（无密钥）。
 * 打包 jar 时取 Manifest Implementation-Version；本地 classpath 运行回退 {@code dev}。
 */
@Component
public class ErdAppInfoContributor implements InfoContributor {

    static final String APP_NAME = "erd-online";

    @Override
    public void contribute(Info.Builder builder) {
        Map<String, Object> app = new LinkedHashMap<>(2);
        app.put("name", APP_NAME);
        app.put("version", resolveVersion());
        builder.withDetail("app", app);
    }

    static String resolveVersion() {
        String version = ErdAppInfoContributor.class.getPackage().getImplementationVersion();
        return version != null && !version.isBlank() ? version : "dev";
    }
}
