package com.erdonline.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
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
 * 例：{@code /auth/login} → {@code /login}；{@code /syst/user/xx} → {@code /user/xx}。</p>
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

        // CORS 预检由 CorsFilter（最高优先级）统一处理，此处不再短路——
        // 原短路逻辑会回显任意 Origin 并带 Allow-Credentials:true，是潜在跨域漏洞
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
