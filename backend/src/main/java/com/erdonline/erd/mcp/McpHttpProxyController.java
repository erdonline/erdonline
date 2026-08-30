package com.erdonline.erd.mcp;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Locale;
import java.util.Set;

/**
 * Reverse-proxy {@code /mcp} → internal Node Streamable HTTP sidecar.
 * PAT travels in {@code Authorization: Bearer erd_pat_…} (validated by sidecar → /api/v1).
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "erd.mcp", name = "enabled", havingValue = "true", matchIfMissing = true)
public class McpHttpProxyController {

    private static final Set<String> FORWARD_REQUEST_HEADERS = Set.of(
            "authorization", "content-type", "accept", "mcp-session-id");
    private static final Set<String> SKIP_RESPONSE_HEADERS = Set.of(
            "transfer-encoding", "connection", "keep-alive", "content-length");

    private final McpProperties mcpProperties;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @RequestMapping(
            path = "/mcp",
            method = {RequestMethod.GET, RequestMethod.POST, RequestMethod.DELETE})
    public void proxyMcp(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String target = mcpProperties.getInternalBaseUrl().replaceAll("/+$", "") + "/mcp";
        String method = request.getMethod();
        byte[] body = RequestMethod.POST.name().equalsIgnoreCase(method)
                ? StreamUtils.copyToByteArray(request.getInputStream())
                : null;

        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(target))
                .timeout(Duration.ofMinutes(2));

        if (RequestMethod.GET.name().equalsIgnoreCase(method)) {
            builder.GET();
        } else if (RequestMethod.DELETE.name().equalsIgnoreCase(method)) {
            builder.DELETE();
        } else {
            builder.method(
                    method,
                    body != null
                            ? HttpRequest.BodyPublishers.ofByteArray(body)
                            : HttpRequest.BodyPublishers.noBody());
        }

        var headerNames = request.getHeaderNames();
        while (headerNames.hasMoreElements()) {
            String name = headerNames.nextElement();
            if (FORWARD_REQUEST_HEADERS.contains(name.toLowerCase(Locale.ROOT))) {
                builder.header(name, request.getHeader(name));
            }
        }

        try {
            HttpResponse<InputStream> upstream = httpClient.send(
                    builder.build(), HttpResponse.BodyHandlers.ofInputStream());
            response.setStatus(upstream.statusCode());
            upstream.headers().map().forEach((name, values) -> {
                if (!SKIP_RESPONSE_HEADERS.contains(name.toLowerCase(Locale.ROOT))) {
                    for (String value : values) {
                        response.addHeader(name, value);
                    }
                }
            });
            try (InputStream in = upstream.body(); OutputStream out = response.getOutputStream()) {
                in.transferTo(out);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            writeSidecarUnavailable(response);
        } catch (Exception e) {
            log.warn("MCP proxy to {} failed: {}", target, e.toString());
            writeSidecarUnavailable(response);
        }
    }

    private void writeSidecarUnavailable(HttpServletResponse response) throws IOException {
        if (response.isCommitted()) {
            return;
        }
        response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
        response.setContentType("application/json");
        response.getWriter().write(
                "{\"jsonrpc\":\"2.0\",\"error\":{\"code\":-32603,"
                        + "\"message\":\"MCP sidecar unavailable\"},\"id\":null}");
    }
}
