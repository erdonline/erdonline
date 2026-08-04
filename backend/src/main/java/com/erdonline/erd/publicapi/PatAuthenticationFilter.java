package com.erdonline.erd.publicapi;

import com.erdonline.common.core.api.R;
import com.erdonline.common.security.userdetail.MartinUser;
import com.fasterxml.jackson.databind.ObjectMapper;
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
 * `/api/v1/**` Bearer 鉴权：PAT（{@code erd_pat_}）或 OAuth access token（{@code erd_oat_}）。
 * 会话 JWT 不接受。仅挂 SecurityFilterChain，勿注册为 Servlet Filter。
 */
@RequiredArgsConstructor
public class PatAuthenticationFilter extends OncePerRequestFilter {

    private final PersonalAccessTokenService personalAccessTokenService;
    private final OAuthApiClientService oauthApiClientService;
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
            writeUnauthorized(response, "missing Bearer PAT or OAuth access token");
            return;
        }
        String raw = header.substring(7).trim();

        if (PatTokenCodec.looksLikePat(raw)) {
            Optional<PersonalAccessTokenService.AuthenticatedPat> auth =
                    personalAccessTokenService.authenticate(raw);
            if (auth.isEmpty()) {
                writeUnauthorized(response, "invalid or revoked PAT");
                return;
            }
            PersonalAccessTokenService.AuthenticatedPat pat = auth.get();
            bind(request, pat.user(), raw, pat.tokenId(), "pat");
            try {
                personalAccessTokenService.touchLastUsed(pat.tokenId());
                filterChain.doFilter(request, response);
            } finally {
                SecurityContextHolder.clearContext();
            }
            return;
        }

        if (OAuthClientCodec.looksLikeAccessToken(raw)) {
            Optional<OAuthApiClientService.AuthenticatedOat> auth =
                    oauthApiClientService.authenticateAccessToken(raw);
            if (auth.isEmpty()) {
                writeUnauthorized(response, "invalid, expired, or revoked OAuth access token");
                return;
            }
            OAuthApiClientService.AuthenticatedOat oat = auth.get();
            bind(request, oat.user(), raw, oat.tokenId(), "oat");
            try {
                oauthApiClientService.touchLastUsed(oat.tokenId());
                filterChain.doFilter(request, response);
            } finally {
                SecurityContextHolder.clearContext();
            }
            return;
        }

        writeUnauthorized(response,
                "expected PAT (erd_pat_…) or OAuth access token (erd_oat_…); session JWT is not accepted on /api/v1");
    }

    private static void bind(
            HttpServletRequest request,
            MartinUser user,
            String credentials,
            String tokenId,
            String kind) {
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user, credentials, user.getAuthorities());
        authentication.setDetails(tokenId);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        request.setAttribute("erd.pat.tokenId", tokenId);
        request.setAttribute("erd.publicApi.tokenKind", kind);
    }

    private void writeUnauthorized(HttpServletResponse response, String msg) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), R.failed(401, msg));
    }
}
