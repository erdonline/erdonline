package com.erdonline.auth.federate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 出站 HTTP（JDK {@link HttpClient}）；联邦 IdP token/userinfo 专用。
 */
@Component
@RequiredArgsConstructor
public class FederateHttpClient {

    private static final Duration TIMEOUT = Duration.ofSeconds(15);

    private final ObjectMapper objectMapper;
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(TIMEOUT)
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    /** GitHub API 要求非空 User-Agent；对其它 IdP 亦无害。 */
    private static final String USER_AGENT = "erdonline-federate";

    public JsonNode getJson(String url) throws IOException, InterruptedException {
        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .timeout(TIMEOUT)
                .GET()
                .header("Accept", "application/json")
                .header("User-Agent", USER_AGENT)
                .build();
        return exchange(req);
    }

    public JsonNode getJsonBearer(String url, String accessToken) throws IOException, InterruptedException {
        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .timeout(TIMEOUT)
                .GET()
                .header("Accept", "application/json")
                .header("User-Agent", USER_AGENT)
                .header("Authorization", "Bearer " + accessToken)
                .build();
        return exchange(req);
    }

    public JsonNode postForm(String url, Map<String, String> form) throws IOException, InterruptedException {
        String body = form.entrySet().stream()
                .map(e -> encode(e.getKey()) + "=" + encode(e.getValue() == null ? "" : e.getValue()))
                .collect(Collectors.joining("&"));
        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .timeout(TIMEOUT)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("Accept", "application/json")
                .header("User-Agent", USER_AGENT)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        return exchange(req);
    }

    private JsonNode exchange(HttpRequest req) throws IOException, InterruptedException {
        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        String raw = res.body() == null ? "" : res.body();
        if (res.statusCode() < 200 || res.statusCode() >= 300) {
            throw new IOException("HTTP " + res.statusCode() + " from " + req.uri() + ": " + truncate(raw));
        }
        if (raw.isBlank()) {
            return objectMapper.createObjectNode();
        }
        // WeChat 偶发返回 text/plain JSON
        return objectMapper.readTree(raw);
    }

    static String encode(String v) {
        return URLEncoder.encode(v, StandardCharsets.UTF_8);
    }

    private static String truncate(String s) {
        return s.length() > 200 ? s.substring(0, 200) + "…" : s;
    }
}
