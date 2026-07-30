package com.erdonline.common.social.oauth2;

import cn.hutool.core.date.DatePattern;
import cn.hutool.core.date.DateUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.erdonline.common.core.constant.SecurityConstants;
import com.erdonline.common.vip.license.LicenseVerify;
import de.schlichtherle.license.LicenseContent;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Configurable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.common.DefaultOAuth2AccessToken;
import org.springframework.security.oauth2.common.OAuth2AccessToken;
import org.springframework.security.oauth2.common.util.OAuth2Utils;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.provider.OAuth2Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/8/3
 * @describtion Oauth2AuthenticationSuccessHandler
 * @since 1.0
 */
@Slf4j
@Configuration
public class Oauth2AuthenticationSuccessHandler implements AuthenticationSuccessHandler {
    @Value("${martin.ui.url}")
    private String uiUrl;

    @SneakyThrows
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        OAuth2AuthenticationToken oAuth2AuthenticationToken = (OAuth2AuthenticationToken) authentication;
        log.info("Oauth2AuthenticationSuccessHandler:{}", oAuth2AuthenticationToken);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("application/json;charset=UTF-8");
        DefaultOAuth2User principal = (DefaultOAuth2User) oAuth2AuthenticationToken.getPrincipal();
        String accessToken = (String) principal.getAttributes().get(OAuth2AccessToken.ACCESS_TOKEN);
        String username = (String) principal.getAttributes().get("username");
        log.info("accessToken:{}", accessToken);
        log.info("uiUrl:{}", uiUrl);
        String location = uiUrl + "/login/success?access_token=" + accessToken
                + "&loginType=" + oAuth2AuthenticationToken.getAuthorizedClientRegistrationId()
                + "&username=" + username;
        LicenseContent licenseContent = LicenseVerify.licenseContent();
        if (licenseContent != null) {
            location = location + "&" + SecurityConstants.LICENSE_TO + "=" + URLEncoder.encode(licenseContent.getInfo(), "UTF-8");
            location = location + "&" + SecurityConstants.LICENSED_START_TIME + "=" + DateUtil.format(licenseContent.getNotBefore(), DatePattern.NORM_DATETIME_FORMAT);
            location = location + "&" + SecurityConstants.LICENSED_END_TIME + "=" + DateUtil.format(licenseContent.getNotAfter(), DatePattern.NORM_DATETIME_FORMAT);
        }
        log.info("location: {}", location);
        response.sendRedirect(location);
    }

}
