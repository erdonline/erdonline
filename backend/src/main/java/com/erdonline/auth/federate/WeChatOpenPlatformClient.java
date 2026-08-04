package com.erdonline.auth.federate;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;

/**
 * 微信开放平台网站应用扫码登录（snsapi_login）。
 */
@Component
@RequiredArgsConstructor
public class WeChatOpenPlatformClient {

    private static final String AUTH = "https://open.weixin.qq.com/connect/qrconnect";
    private static final String TOKEN = "https://api.weixin.qq.com/sns/oauth2/access_token";
    private static final String USERINFO = "https://api.weixin.qq.com/sns/userinfo";

    private final FederateProperties properties;
    private final FederateHttpClient http;

    public String buildAuthorizeUrl(String state) {
        FederateProperties.Wechat w = properties.getWechat();
        return AUTH
                + "?appid=" + FederateHttpClient.encode(w.getAppId().trim())
                + "&redirect_uri=" + FederateHttpClient.encode(w.getRedirectUri().trim())
                + "&response_type=code"
                + "&scope=snsapi_login"
                + "&state=" + FederateHttpClient.encode(state)
                + "#wechat_redirect";
    }

    public FederateIdentity exchange(String code) throws IOException, InterruptedException {
        FederateProperties.Wechat w = properties.getWechat();
        String tokenUrl = TOKEN
                + "?appid=" + FederateHttpClient.encode(w.getAppId().trim())
                + "&secret=" + FederateHttpClient.encode(w.getAppSecret().trim())
                + "&code=" + FederateHttpClient.encode(code)
                + "&grant_type=authorization_code";
        JsonNode token = http.getJson(tokenUrl);
        assertNoWechatErr(token, "token");
        String access = text(token, "access_token");
        String openid = text(token, "openid");
        String unionid = text(token, "unionid");
        if (!StringUtils.hasText(access) || !StringUtils.hasText(openid)) {
            throw new IOException("WeChat token missing access_token/openid");
        }
        String infoUrl = USERINFO
                + "?access_token=" + FederateHttpClient.encode(access)
                + "&openid=" + FederateHttpClient.encode(openid);
        JsonNode info = http.getJson(infoUrl);
        assertNoWechatErr(info, "userinfo");
        if (!StringUtils.hasText(unionid)) {
            unionid = text(info, "unionid");
        }
        // subject：有 unionid 用 unionid（跨应用稳定），否则 openid
        String subject = StringUtils.hasText(unionid) ? unionid : openid;
        String nickname = text(info, "nickname");
        return new FederateIdentity(FederateProvider.WECHAT, subject, unionid, null, false, nickname);
    }

    private static void assertNoWechatErr(JsonNode n, String stage) throws IOException {
        if (n.has("errcode") && n.get("errcode").asInt(0) != 0) {
            throw new IOException("WeChat " + stage + " err=" + n.get("errcode").asInt()
                    + " " + text(n, "errmsg"));
        }
    }

    private static String text(JsonNode n, String field) {
        JsonNode v = n.get(field);
        if (v == null || v.isNull()) {
            return null;
        }
        String s = v.asText();
        return StringUtils.hasText(s) ? s.trim() : null;
    }
}
