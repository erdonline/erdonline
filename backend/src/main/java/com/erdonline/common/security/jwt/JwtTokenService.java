package com.erdonline.common.security.jwt;

import com.erdonline.common.core.constant.SecurityConstants;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.vip.license.LicenseVerify;
import de.schlichtherle.license.LicenseContent;
import cn.hutool.core.date.DatePattern;
import cn.hutool.core.date.DateUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JwtTokenService {

    private final JwtEncoder jwtEncoder;
    private final JwtProperties jwtProperties;

    public Map<String, Object> issue(MartinUser user) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(jwtProperties.getExpiresIn());

        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer(jwtProperties.getIssuer())
                .issuedAt(now)
                .expiresAt(exp)
                .subject(user.getUsername())
                .claim(SecurityConstants.TOKEN_USER_ID, user.getId())
                .claim(SecurityConstants.TOKEN_USERNAME, user.getUsername())
                .claim(SecurityConstants.TOKEN_DEPT_ID, user.getDeptId())
                .claim(SecurityConstants.TOKEN_ROLE_IDS, user.getRoleIds())
                .claim(SecurityConstants.TOKEN_TENANT_ID, user.getTenantId())
                .claim("authorities", user.getAuthorities().stream()
                        .map(a -> a.getAuthority()).collect(Collectors.toList()));

        String token = jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(),
                claims.build()
        )).getTokenValue();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("access_token", token);
        body.put("token_type", "Bearer");
        body.put("expires_in", jwtProperties.getExpiresIn());
        body.put(SecurityConstants.TOKEN_USER_ID, user.getId());
        body.put(SecurityConstants.TOKEN_USERNAME, user.getUsername());
        body.put(SecurityConstants.TOKEN_LICENSE, SecurityConstants.MARTIN_LICENSE);
        LicenseContent licenseContent = LicenseVerify.licenseContent();
        if (licenseContent != null) {
            body.put(SecurityConstants.LICENSE_TO, licenseContent.getInfo());
            body.put(SecurityConstants.LICENSED_START_TIME,
                    DateUtil.format(licenseContent.getNotBefore(), DatePattern.NORM_DATETIME_FORMAT));
            body.put(SecurityConstants.LICENSED_END_TIME,
                    DateUtil.format(licenseContent.getNotAfter(), DatePattern.NORM_DATETIME_FORMAT));
        } else {
            body.put(SecurityConstants.LICENSE_TO, "");
            body.put(SecurityConstants.LICENSED_START_TIME, "");
            body.put(SecurityConstants.LICENSED_END_TIME, "");
        }
        return body;
    }
}
