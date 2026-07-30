package com.erdonline.auth.endpint;

import com.erdonline.common.core.api.R;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author 狮少
 * @version 1.0
 * @date 2019/5/17
 * @describtion AuthEndpoint
 * @since 1.0
 */
@Slf4j
@RestController
@RequestMapping()
public class AuthEndpoint {

    @Autowired
    private TokenService tokenService;

    /**
     * 退出登录，处理token
     *
     * @param authHeader
     * @return
     */
    @PostMapping("/exit")
    public R logout(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authHeader) {
        log.info("authHeader: {}", authHeader);
        return tokenService.removeToken(authHeader);
    }


}
