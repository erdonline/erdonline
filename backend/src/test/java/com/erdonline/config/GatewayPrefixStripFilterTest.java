package com.erdonline.config;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 网关前缀剥离：/auth|/syst|/ncnb 前缀必须去掉。
 */
class GatewayPrefixStripFilterTest {

    private final GatewayPrefixStripFilter filter = new GatewayPrefixStripFilter();

    @Test
    void stripsAuthPrefix() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);
        when(request.getContextPath()).thenReturn("");
        when(request.getRequestURI()).thenReturn("/auth/login");

        filter.doFilter(request, response, chain);

        ArgumentCaptor<HttpServletRequest> captor = ArgumentCaptor.forClass(HttpServletRequest.class);
        verify(chain).doFilter(captor.capture(), any());
        HttpServletRequest forwarded = captor.getValue();
        assertEquals("/login", forwarded.getRequestURI());
        assertEquals("/login", forwarded.getServletPath());
    }

    @Test
    void leavesUnprefixedPath() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);
        when(request.getContextPath()).thenReturn("");
        when(request.getRequestURI()).thenReturn("/actuator/health");

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
    }

    @Test
    void stripsSystAndNcnbPrefixes() throws Exception {
        assertStripped("/syst/user/register", "/user/register");
        assertStripped("/ncnb/project/get/1", "/project/get/1");
    }

    private void assertStripped(String uri, String expected) throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);
        when(request.getContextPath()).thenReturn("");
        when(request.getRequestURI()).thenReturn(uri);

        filter.doFilter(request, response, chain);

        ArgumentCaptor<HttpServletRequest> captor = ArgumentCaptor.forClass(HttpServletRequest.class);
        verify(chain).doFilter(captor.capture(), any());
        assertEquals(expected, captor.getValue().getRequestURI());
        assertEquals(expected, captor.getValue().getServletPath());
    }
}
