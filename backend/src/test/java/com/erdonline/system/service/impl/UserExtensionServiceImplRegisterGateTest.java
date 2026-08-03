package com.erdonline.system.service.impl;

import com.erdonline.common.api.dto.UserDto;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.config.ErdSecurityProperties;
import com.erdonline.system.mapper.UserExtensionMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * R-AUTH-06：allow-open-register=false 时拒绝注册且不触达 DB。
 */
@ExtendWith(MockitoExtension.class)
class UserExtensionServiceImplRegisterGateTest {

    @Mock
    private UserExtensionMapper userExtensionMapper;

    private ErdSecurityProperties erdSecurityProperties;
    private UserExtensionServiceImpl service;

    @BeforeEach
    void setUp() {
        erdSecurityProperties = new ErdSecurityProperties();
        erdSecurityProperties.setAllowOpenRegister(true);
        service = new UserExtensionServiceImpl();
        ReflectionTestUtils.setField(service, "baseMapper", userExtensionMapper);
        ReflectionTestUtils.setField(service, "erdSecurityProperties", erdSecurityProperties);
    }

    @Test
    void rejectsWhenOpenRegisterDisallowed() {
        erdSecurityProperties.setAllowOpenRegister(false);
        UserDto dto = new UserDto();
        dto.setUsername("newuser");
        dto.setPwd("pass");
        dto.setEmail("a@b.c");
        dto.setPhone("13800000000");

        R result = service.userRegister(dto);

        assertEquals(ApiErrorCode.FORBIDDEN.getCode(), result.getCode());
        assertTrue(String.valueOf(result.getMsg()).contains("开放注册已关闭"));
        verify(userExtensionMapper, never()).selectList(any());
    }
}
