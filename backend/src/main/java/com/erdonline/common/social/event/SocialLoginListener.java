package com.erdonline.common.social.event;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import com.erdonline.common.api.auth.RemoteAuthLogin;
import com.erdonline.common.api.ncnb.RemoteNcnbLoginSocketIO;
import com.erdonline.common.api.system.RemoteSystemLog;
import com.erdonline.common.bean.system.User;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.constant.SocialLoginConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.support.BasicAuthenticationInterceptor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/8/6
 * @describtion LoginListener
 * @since 1.0
 */
@Slf4j
@Component
public class SocialLoginListener {
    @Autowired
    private RemoteAuthLogin remoteAuthLogin;
    @Autowired
    private RemoteNcnbLoginSocketIO remoteNcnbLoginSocketIO;

    @Async
    @Order
    @EventListener(SocialLoginEvent.class)
    public void saveLog(SocialLoginEvent event) {
        User user = (User) event.getSource();
        LinkedHashMap token = (LinkedHashMap) remoteAuthLogin.socialLoginToken(user.getUsername(), SocialLoginConstants.INIT_PASSWORD);
        log.info("body: {}", token);
        remoteNcnbLoginSocketIO.sendSocialLoginSuccessInfo(token);
    }
}
