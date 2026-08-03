package com.erdonline.auth.endpint;

import com.erdonline.common.core.api.R;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.socketio.SocketTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 签发 Socket.IO 握手短票（需登录）。网关前缀剥离：/auth/socket-ticket → /socket-ticket。
 */
@RestController
@RequiredArgsConstructor
public class SocketTicketController {

    private final SocketTicketService socketTicketService;

    @PostMapping({"/socket-ticket", "/auth/socket-ticket"})
    public R<Map<String, Object>> issue() {
        MartinUser user = SecurityContextUtil.getAccessUser();
        String ticket = socketTicketService.issue(user.getId(), user.getUsername());
        Map<String, Object> body = new HashMap<>(4);
        body.put("ticket", ticket);
        body.put("username", user.getUsername());
        body.put("expiresIn", SocketTicketService.TTL.getSeconds());
        return R.ok(body);
    }
}
