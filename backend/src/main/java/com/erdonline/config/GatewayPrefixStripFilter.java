package com.erdonline.config;

import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletRequestWrapper;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * 网关前缀剥离过滤器。
 *
 * <p>原微服务通过 API 网关的 {@code StripPrefix=1} 将 {@code /auth/**}、{@code /syst/**}、
 * {@code /ncnb/**} 分别路由到 auth / system / ncnb 服务并去掉前缀。单体化后网关不复存在，
 * 前端仍使用这些前缀，故在此剥离前缀，保持前端调用方式不变。</p>
 *
 * <p>实现方式：包装请求覆写其 URI/servletPath（不使用 forward），从而继续沿同一条
 * 过滤器链（含 Spring Security 的客户端认证过滤器）处理剥离后的路径。
 * 例：{@code /auth/oauth/token} → {@code /oauth/token}；{@code /syst/user/xx} → {@code /user/xx}。</p>
 *
 * <p>通过 {@link com.erdonline.config.FilterConfig} 以 {@code FilterRegistrationBean} 显式注册并排序，
 * 确保早于 Spring Security 过滤器链执行（{@code @Component}+{@code @Order} 对 servlet 过滤器排序不可靠）。</p>
 */
public class GatewayPrefixStripFilter implements Filter {

    private static final List<String> PREFIXES = Arrays.asList("/auth", "/syst", "/ncnb");

    @Override
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) req;

        org.slf4j.LoggerFactory.getLogger(GatewayPrefixStripFilter.class).warn(
                "[StripFilter] method={} uri={} origin={} acrm={}",
                request.getMethod(), request.getRequestURI(),
                request.getHeader("Origin"), request.getHeader("Access-Control-Request-Method"));

        // CORS 预检（OPTIONS + Origin + Access-Control-Request-Method）直接放行返回 200，
        // 避免被下游 OAuth2 授权服务器过滤器链拦截为 401。预检响应头在此直接写全，
        // 不依赖 CorsFilter 的执行顺序。
        String origin = request.getHeader("Origin");
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())
                && origin != null
                && request.getHeader("Access-Control-Request-Method") != null) {
            javax.servlet.http.HttpServletResponse response = (javax.servlet.http.HttpServletResponse) resp;
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
            String reqHeaders = request.getHeader("Access-Control-Request-Headers");
            response.setHeader("Access-Control-Allow-Headers", reqHeaders != null ? reqHeaders : "*");
            response.setHeader("Access-Control-Max-Age", "3600");
            response.setStatus(javax.servlet.http.HttpServletResponse.SC_OK);
            return;
        }

        String contextPath = request.getContextPath();
        String path = request.getRequestURI().substring(contextPath.length());

        for (String prefix : PREFIXES) {
            if (path.equals(prefix) || path.startsWith(prefix + "/")) {
                String stripped = path.substring(prefix.length());
                if (stripped.isEmpty()) {
                    stripped = "/";
                }
                chain.doFilter(new StrippedPathRequestWrapper(request, contextPath, stripped), resp);
                return;
            }
        }
        chain.doFilter(req, resp);
    }

    /** 覆写路径相关方法，使下游（含 Spring Security 与 DispatcherServlet）看到剥离后的路径 */
    private static class StrippedPathRequestWrapper extends HttpServletRequestWrapper {
        private final String newUri;
        private final String newPath;

        StrippedPathRequestWrapper(HttpServletRequest request, String contextPath, String strippedPath) {
            super(request);
            this.newPath = strippedPath;
            this.newUri = contextPath + strippedPath;
        }

        @Override
        public String getRequestURI() {
            return newUri;
        }

        @Override
        public String getServletPath() {
            return newPath;
        }

        @Override
        public String getPathInfo() {
            return null;
        }
    }
}
