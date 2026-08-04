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
 * 公开 API 限流：按 PAT id（或 IP）Redis 配额。仅挂 SecurityFilterChain。
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
        Object kind = request.getAttribute("erd.publicApi.tokenKind");
        String prefix = "oat".equals(kind) ? "oat:" : "pat:";
        String key = tokenId != null ? prefix + tokenId : "ip:" + clientIp(request);
        PublicApiRateLimiter.Decision decision = publicApiRateLimiter.tryAcquire(key);
        if (decision == PublicApiRateLimiter.Decision.ALLOW) {
            filterChain.doFilter(request, response);
            return;
        }
        if (decision == PublicApiRateLimiter.Decision.UNAVAILABLE) {
            writeJson(response, 503, "public API rate limit unavailable (Redis)");
            return;
        }
        response.setHeader("Retry-After", "60");
        writeJson(response, 429, "public API rate limit exceeded ("
                + publicApiRateLimiter.getLimitPerMinute() + "/min)");
    }

    private void writeJson(HttpServletResponse response, int status, String msg) throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), R.failed(status, msg));
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
