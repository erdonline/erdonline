package com.erdonline.common.websocket.config;

import java.security.Principal;

/**
 * @author 狮少
 * @version 1.0
 * @date 2021/5/20
 * @describtion StompPrincipal
 * @since 1.0
 */
public class StompPrincipal implements Principal {
    private String name;

    StompPrincipal(String name) {
        this.name = name;
    }

    @Override
    public String getName() {
        return name;
    }
}
