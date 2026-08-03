package com.erdonline.system.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * R-AUTH-02：UserController CRUD 必须带 sys_user_* 权限（对齐 UserExtensionController / 种子 operation）。
 */
class UserControllerAuthContractTest {

    @Test
    void crudEndpointsRequireSysUserAuthorities() {
        Map<String, String> expected = Map.of(
                "save", "hasAuthority('sys_user_add')",
                "removeById", "hasAuthority('sys_user_del')",
                "edit", "hasAuthority('sys_user_edit')",
                "getById", "hasAuthority('sys_user_get')",
                "getPage", "hasAuthority('sys_user_page')",
                "removeBatch", "hasAuthority('sys_user_deleteBatch')"
        );

        Map<String, Method> byName = Arrays.stream(UserController.class.getDeclaredMethods())
                .filter(m -> expected.containsKey(m.getName()))
                .collect(Collectors.toMap(Method::getName, m -> m, (a, b) -> a));

        assertEquals(expected.keySet(), byName.keySet());

        assertNotNull(byName.get("save").getAnnotation(PostMapping.class));
        assertNotNull(byName.get("removeById").getAnnotation(DeleteMapping.class));
        assertNotNull(byName.get("edit").getAnnotation(PutMapping.class));
        assertNotNull(byName.get("getById").getAnnotation(GetMapping.class));
        assertNotNull(byName.get("getPage").getAnnotation(GetMapping.class));
        assertNotNull(byName.get("removeBatch").getAnnotation(DeleteMapping.class));

        for (var e : expected.entrySet()) {
            PreAuthorize auth = byName.get(e.getKey()).getAnnotation(PreAuthorize.class);
            assertNotNull(auth, e.getKey() + " missing @PreAuthorize");
            assertEquals(e.getValue(), auth.value(), e.getKey());
        }
    }
}
