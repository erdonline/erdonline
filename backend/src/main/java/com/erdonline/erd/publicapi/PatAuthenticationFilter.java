package com.erdonline.erd.publicapi;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.erdonline.common.core.api.R;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

/**
 * `/api/v1/**` Bearer PAT 鉴权（与会话 JWT 分离）。仅挂 SecurityFilterChain，勿注册为 Servlet Filter。
 */
@RequiredArgsConstructor
public class PatAuthenticationFilter extends OncePerRequestFilter {

    private final PersonalAccessTokenService personalAccessTokenService;
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
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.regionMatches(true, 0, "Bearer ", 0, 7)) {
            writeUnauthorized(response, "missing Bearer PAT");
            return;
        }
        String raw = header.substring(7).trim();
        if (!PatTokenCodec.looksLikePat(raw)) {
            writeUnauthorized(response, "expected PAT (erd_pat_…); session JWT is not accepted on /api/v1");
            return;
        }
        Optional<PersonalAccessTokenService.AuthenticatedPat> auth =
                personalAccessTokenService.authenticate(raw);
        if (auth.isEmpty()) {
            writeUnauthorized(response, "invalid or revoked PAT");
            return;
        }
        PersonalAccessTokenService.AuthenticatedPat pat = auth.get();
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                pat.user(), raw, pat.user().getAuthorities());
        authentication.setDetails(pat.tokenId());
        SecurityContextHolder.getContext().setAuthentication(authentication);
        request.setAttribute("erd.pat.tokenId", pat.tokenId());
        try {
            personalAccessTokenService.touchLastUsed(pat.tokenId());
            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private void writeUnauthorized(HttpServletResponse response, String msg) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), R.failed(401, msg));
    }
}
