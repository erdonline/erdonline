package com.erdonline.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.filter.CorsFilter;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * CORS 预检须在 Spring Security 之前由 {@link CorsFilter} 放行（R-CFG-04）。
 * 回归：prod 多 Origin CSV、demo/pages.dev 预检、非法 Origin 403。
 */
class CorsPreflightFilterTest {

    private static CorsFilter corsFilter(String martinUiUrl) {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("martin.ui.url", martinUiUrl);
        CorsConfig config = new CorsConfig();
        FilterRegistrationBean<CorsFilter> registration = config.corsFilterRegistration(env);
        return registration.getFilter();
    }

    @Test
    void preflightAllowsDemoOriginFromCsvList() throws ServletException, IOException {
        CorsFilter filter = corsFilter("https://app.erdonline.com,https://erdonline-demo.pages.dev");
        MockHttpServletRequest request = optionsPreflight(
                "https://erdonline-demo.pages.dev", "GET");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertEquals(200, response.getStatus());
        assertEquals("https://erdonline-demo.pages.dev",
                response.getHeader("Access-Control-Allow-Origin"));
        assertEquals("GET", response.getHeader("Access-Control-Allow-Methods"));
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    void preflightAllowsProductionOriginFromCsvList() throws ServletException, IOException {
        CorsFilter filter = corsFilter("https://app.erdonline.com,https://erdonline-demo.pages.dev");
        MockHttpServletRequest request = optionsPreflight(
                "https://app.erdonline.com", "POST");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertEquals(200, response.getStatus());
        assertEquals("https://app.erdonline.com",
                response.getHeader("Access-Control-Allow-Origin"));
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    void preflightRejectsUnknownOrigin() throws ServletException, IOException {
        CorsFilter filter = corsFilter("https://app.erdonline.com");
        MockHttpServletRequest request = optionsPreflight(
                "https://evil.example.com", "GET");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertEquals(403, response.getStatus());
        assertNull(response.getHeader("Access-Control-Allow-Origin"));
        verify(chain, never()).doFilter(request, response);
    }

    private static MockHttpServletRequest optionsPreflight(String origin, String method) {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/auth/login");
        request.addHeader("Origin", origin);
        request.addHeader("Access-Control-Request-Method", method);
        request.addHeader("Access-Control-Request-Headers", "content-type");
        return request;
    }
}
