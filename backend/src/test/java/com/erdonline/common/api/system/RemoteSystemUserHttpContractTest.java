package com.erdonline.common.api.system;

import com.erdonline.common.bean.system.User;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * R-AUTH-01：loadUserByUsername 不得挂 HTTP；User.pwd 不得出现在 JSON 输出。
 */
class RemoteSystemUserHttpContractTest {

    @Test
    void loadUserByUsernameHasNoHttpMapping() throws Exception {
        Method m = RemoteSystemUser.class.getMethod("loadUserByUsername", String.class);
        assertNull(m.getAnnotation(GetMapping.class));
        assertNull(m.getAnnotation(PostMapping.class));
        assertNull(m.getAnnotation(RequestMapping.class));
        for (var ann : m.getParameterAnnotations()[0]) {
            assertFalse(ann.annotationType().getName().contains("PathVariable")
                    || ann.annotationType().getName().contains("RequestParam")
                    || ann.annotationType().getName().contains("RequestBody"));
        }
    }

    @Test
    void userRegisterHasNoHttpMapping() throws Exception {
        Method m = RemoteSystemUser.class.getMethod("userRegister",
                com.erdonline.common.api.dto.UserDto.class);
        assertNull(m.getAnnotation(GetMapping.class));
        assertNull(m.getAnnotation(PostMapping.class));
        assertNull(m.getAnnotation(RequestMapping.class));
        for (var ann : m.getParameterAnnotations()[0]) {
            assertFalse(ann.annotationType().getName().contains("PathVariable")
                    || ann.annotationType().getName().contains("RequestParam")
                    || ann.annotationType().getName().contains("RequestBody"));
        }
    }

    @Test
    void userPwdNeverSerialized() throws Exception {
        User user = new User();
        user.setUsername("admin");
        user.setPwd("$2a$10$secretHash");
        user.setSalt("s");
        String json = new ObjectMapper().writeValueAsString(user);
        assertFalse(json.contains("pwd"), json);
        assertFalse(json.contains("password"), json);
        assertFalse(json.contains("$2a$"), json);
        assertFalse(json.contains("salt"), json);
        assertTrue(json.contains("admin"), json);
    }
}
