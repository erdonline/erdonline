package com.erdonline.common.social.resource;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.util.ObjectUtil;
import cn.hutool.core.util.ReflectUtil;
import cn.hutool.core.util.StrUtil;
import com.erdonline.common.api.auth.RemoteAuthLogin;
import com.erdonline.common.api.system.RemoteSystemUser;
import com.erdonline.common.bean.system.User;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.constant.SocialLoginConstants;
import com.erdonline.common.core.support.SpringContextHelper;
import com.erdonline.common.social.event.SocialLoginEvent;
import com.erdonline.common.social.oauth2.convert.SocialPropertyConvert;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/8/3
 * @describtion SocialPrincipalExtractor
 * @since 1.0
 */
@Slf4j
@Component
public class SocialPrincipalExtractor {
    private final static String COLUMN_SUFFIX = "_openid";
    private final static String BEAN_SUFFIX = "Openid";
    private final static String WECHAT_COUNTRY = "country";
    private final static String WECHAT_PROVINCE = "province";
    private final static String WECHAT_CITY = "city";

    @Autowired
    private RemoteSystemUser remoteSystemUser;

    @Autowired
    private RemoteAuthLogin remoteAuthLogin;

    public User getUserByOpenid(String registrationId, String openid) {
        log.info("registrationId: {},openid: {}", registrationId, openid);
        HashMap<String, String> params = new HashMap<>(2);
        params.put(SocialLoginConstants.OPENID_COLUMN, registrationId + COLUMN_SUFFIX);
        params.put(SocialLoginConstants.OPENID, openid);
        return remoteSystemUser.getUserByWechatOpenid(params);
    }


    public LinkedHashMap extractPrincipal(String registrationId, Map<String, Object> map) {
        log.info("social login user info: {}", map);
        //得到对应的社交平台的 openid
        String openid = map.get(SocialLoginConstants.OPENID).toString();
        User user = getUserByOpenid(registrationId, openid);
        if (user == null) {
            user = new User();
            BeanUtil.copyProperties(map, user);
            user.setUsername(SocialLoginConstants.randomUserName(openid, 5, 5));
            user.setAvatar("");
            //保存社交登录字段
            ReflectUtil.invoke(user, "set" + StrUtil.upperFirst(registrationId) + BEAN_SUFFIX, openid);
            fillUserSocialProperty(user, map);
            R<User> register = remoteSystemUser.register(user);
            user = register.getData();
        }
        //登录成功后，生成一个本系统可用的token
        LinkedHashMap token = (LinkedHashMap) remoteAuthLogin.socialLoginToken(user.getUsername(), SocialLoginConstants.INIT_PASSWORD);

        //解决异步线程，父子线程无法共享session、request
//        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
//        RequestContextHolder.setRequestAttributes(requestAttributes, true);
//        SpringContextHelper.publishEvent(new SocialLoginEvent(user));
        return token;
    }

    /**
     * 根据社交登录的返回信息，填充user
     *
     * @param user
     * @param map
     */
    private void fillUserSocialProperty(User user, Map map) {
        user.setNickname(fill(SocialPropertyConvert.NICKNAME, map) == null ? "" : (String) fill(SocialPropertyConvert.NICKNAME, map));
        user.setAvatar(fill(SocialPropertyConvert.AVATAR, map) == null ? "" : (String) fill(SocialPropertyConvert.AVATAR, map));
        user.setGender(fill(SocialPropertyConvert.GENDER, map) == null ? "" : getRealGender(fill(SocialPropertyConvert.GENDER, map)));
        if (ObjectUtil.isNotNull(map.get(WECHAT_COUNTRY)) && ObjectUtil.isNotNull(map.get(WECHAT_PROVINCE)) && ObjectUtil.isNotNull(map.get(WECHAT_CITY))) {
            String location = String.format("%s %s %s", map.get(WECHAT_COUNTRY), map.get(WECHAT_PROVINCE), map.get(WECHAT_CITY));
            user.setLocation(location);
        } else {
            user.setLocation(fill(SocialPropertyConvert.LOCATION, map) == null ? "" : (String) fill(SocialPropertyConvert.LOCATION, map));
        }
        user.setEmail(fill(SocialPropertyConvert.EMAIL, map) == null ? "" : (String) fill(SocialPropertyConvert.EMAIL, map));

    }

    private Object fill(SocialPropertyConvert socialPropertyConvert, Map map) {
        Optional<String> first = Arrays.stream(socialPropertyConvert.getSocialProperties()).filter(property -> map.containsKey(property)).findFirst();
        if (first.isPresent()) {
            return map.get(first.get());
        } else {
            return null;
        }
    }

    private String getRealGender(Object originalGender) {
        originalGender = originalGender.toString();
        log.info("originalGender: {}", originalGender);
        String[] males = {"m", "男", "1", "male"};
        if (Arrays.asList(males).contains(originalGender)) {
            return "1";
        }
        return "0";
    }

}
