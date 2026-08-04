package com.erdonline.auth.federate;

import com.erdonline.common.core.api.R;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.entity.UserIdentityLink;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 第三方 IdP 联邦（ADR-0021）。客户端路径带 {@code /auth} 前缀，控制器映射为剥离后路径。
 */
@Slf4j
@RestController
@RequestMapping({"/federate", "/auth/federate"})
@RequiredArgsConstructor
public class FederateController {

    private final FederateAuthService authService;
    private final FederateUserService userService;

    @GetMapping("/providers")
    public R providers() {
        return R.ok(authService.providers());
    }

    /** 匿名登录起跳（仅 login 模式）。绑定见 {@link #startLink}。 */
    @GetMapping("/{provider}")
    public ResponseEntity<?> startLogin(
            @PathVariable String provider,
            @RequestParam(value = "redirect", required = false) String redirect) {
        try {
            FederateProvider p = FederateProvider.fromWire(provider);
            String url = authService.startAuthorize(p, FederateAuthService.MODE_LOGIN, null, redirect);
            return ResponseEntity.status(HttpStatus.FOUND).header("Location", url).build();
        } catch (FederateException fe) {
            return ResponseEntity.status(fe.getStatus()).body(R.failed(fe.getMessage()));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(R.failed(iae.getMessage()));
        }
    }

    /**
     * 已登录绑定起跳（须会话 JWT；不在 ignore-urls）。
     * 前端用 fetch/XHR 拿不到 302 Location 时亦可用 {@code window.location} 直跳本路径（浏览器会带 Bearer…）—
     * 会话 JWT 在 localStorage，故前端应先 {@code GET} 本接口经 XHR（拦截器附 Authorization）取 Location，再 {@code location.assign}。
     */
    @GetMapping("/links/{provider}/start")
    public R startLink(@PathVariable String provider) {
        try {
            MartinUser user = SecurityContextUtil.getAccessUser();
            if (user == null || !StringUtils.hasText(user.getId())) {
                return R.failed("请先登录再绑定第三方账号");
            }
            FederateProvider p = FederateProvider.fromWire(provider);
            String url = authService.startAuthorize(p, FederateAuthService.MODE_LINK, user.getId(), null);
            Map<String, String> body = new LinkedHashMap<>(1);
            body.put("authorizeUrl", url);
            return R.ok(body);
        } catch (FederateException fe) {
            return R.failed(fe.getMessage());
        } catch (IllegalArgumentException iae) {
            return R.failed(iae.getMessage());
        }
    }

    @GetMapping("/{provider}/callback")
    public ResponseEntity<?> callback(
            @PathVariable String provider,
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "error_description", required = false) String errorDescription) {
        if (StringUtils.hasText(error)) {
            String msg = StringUtils.hasText(errorDescription) ? errorDescription : error;
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(R.failed(msg));
        }
        try {
            FederateProvider p = FederateProvider.fromWire(provider);
            String ui = authService.handleCallback(p, code, state);
            return ResponseEntity.status(HttpStatus.FOUND).header("Location", ui).build();
        } catch (FederateException fe) {
            return ResponseEntity.status(fe.getStatus()).body(R.failed(fe.getMessage()));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(R.failed(iae.getMessage()));
        }
    }

    /** 浏览器短票换会话 JWT（一次性）。 */
    @PostMapping("/session")
    public ResponseEntity<?> session(@RequestParam("ticket") String ticket) {
        try {
            Map<String, Object> body = authService.consumeTicket(ticket);
            return ResponseEntity.ok(body);
        } catch (FederateException fe) {
            return ResponseEntity.status(fe.getStatus()).body(R.failed(fe.getMessage()));
        }
    }

    @GetMapping("/links")
    public R links() {
        MartinUser user = SecurityContextUtil.getAccessUser();
        List<Map<String, Object>> list = userService.listLinks(user.getId()).stream()
                .map(this::toView)
                .collect(Collectors.toList());
        Map<String, Object> body = new HashMap<>(4);
        body.put("providers", authService.providers());
        body.put("links", list);
        return R.ok(body);
    }

    @DeleteMapping("/links/{provider}")
    public R unlink(@PathVariable String provider) {
        try {
            MartinUser user = SecurityContextUtil.getAccessUser();
            userService.unlink(user.getId(), FederateProvider.fromWire(provider));
            Map<String, Object> ok = new LinkedHashMap<>(2);
            ok.put("provider", provider);
            ok.put("unlinked", true);
            return R.ok(ok);
        } catch (FederateException fe) {
            return R.failed(fe.getMessage());
        } catch (IllegalArgumentException iae) {
            return R.failed(iae.getMessage());
        }
    }

    private Map<String, Object> toView(UserIdentityLink link) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("provider", link.getProvider());
        m.put("email", link.getEmail());
        m.put("displayName", link.getDisplayName());
        m.put("linked", true);
        return m;
    }
}
