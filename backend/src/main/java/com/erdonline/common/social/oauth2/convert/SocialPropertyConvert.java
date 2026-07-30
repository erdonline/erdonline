package com.erdonline.common.social.oauth2.convert;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/8/5
 * @describtion SocialPropertyConvert
 * @since 1.0
 */
@Getter
@AllArgsConstructor
public enum SocialPropertyConvert {
    NICKNAME("nickname", new String[]{"nickname","nick","name","username","login_name","login","email","displayName","userPrincipalName","miliaoNick","screen_name"}),
    AVATAR("avatar", new String[]{"avatar","avatar_url","picture","headPictureURL","imageUrl","pictureUrl","miliaoIcon","image_original","profile_image","avatarUrl","profile_image_url_https","profile_image_url","headimgurl",""}),
    GENDER("gender", new String[]{"gender","sex","gendar"}),
    LOCATION("location", new String[]{"locale","address","street_address"}),
    EMAIL("email", new String[]{"email","mail"});

    private String property;
    private String[] socialProperties;
}
