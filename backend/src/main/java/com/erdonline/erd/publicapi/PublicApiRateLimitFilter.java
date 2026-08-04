package com.erdonline.erd.publicapi;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.erdonline.common.core.api.R;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * 公开 API 限流骨架：按 PAT id（或 IP）滑动窗口。仅挂 SecurityFilterChain。
 */
@RequiredArgsConstructor
public class PublicApiRateLimitFilter extends OncePerRequestFilter {

    private final PublicApiRateLimiter publicApiRateLimiter;
    private final ObjectMapper objectMapper;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getServletPath();
        return path == null || !path.startsWith("/api/v1/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Object tokenId = request.getAttribute("erd.pat.tokenId");
        String key = tokenId != null ? "pat:" + tokenId : "ip:" + clientIp(request);
        if (!publicApiRateLimiter.tryAcquire(key, System.currentTimeMillis())) {
            response.setStatus(429);
            response.setHeader("Retry-After", "60");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getOutputStream(),
                    R.failed(429, "public API rate limit exceeded ("
                            + publicApiRateLimiter.getLimitPerMinute() + "/min)"));
            return;
        }
        filterChain.doFilter(request, response);
    }

    private static String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            int comma = xff.indexOf(',');
            return (comma > 0 ? xff.substring(0, comma) : xff).trim();
        }
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }
}
