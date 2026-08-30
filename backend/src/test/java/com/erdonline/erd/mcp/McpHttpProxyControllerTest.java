package com.erdonline.erd.mcp;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.core.annotation.Order;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MCP public endpoint → loopback sidecar contract. The fake sidecar is local and
 * never calls a database or a live backend.
 */
class McpHttpProxyControllerTest {

    private static final String PAT = "Bearer erd_pat_unit_test_only";
    private static final AtomicReference<String> LAST_AUTHORIZATION = new AtomicReference<>();
    private static final AtomicReference<String> LAST_BODY = new AtomicReference<>();

    private static HttpServer sidecar;
    private static MockMvc mockMvc;

    @BeforeAll
    static void setUp() throws IOException {
        sidecar = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        sidecar.createContext("/mcp", McpHttpProxyControllerTest::handleSidecarRequest);
        sidecar.start();

        McpProperties properties = new McpProperties();
        properties.setInternalBaseUrl(
                "http://127.0.0.1:" + sidecar.getAddress().getPort() + "/");
        mockMvc = MockMvcBuilders
                .standaloneSetup(new McpHttpProxyController(properties))
                .build();
    }

    @AfterAll
    static void tearDown() {
        sidecar.stop(0);
    }

    @Test
    void getMcp_preservesSidecarMethodNotAllowedContract() throws Exception {
        mockMvc.perform(get("/mcp"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(content().contentType("application/json"))
                .andExpect(content().json("""
                        {"jsonrpc":"2.0","error":{"code":-32000,"message":"Method not allowed (use POST)."},"id":null}
                        """));
    }

    @Test
    void postInitialize_forwardsBodyAndReturnsServerIdentity() throws Exception {
        String initialize = """
                {"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}
                """;

        mockMvc.perform(post("/mcp")
                        .contentType("application/json")
                        .accept("application/json, text/event-stream")
                        .content(initialize))
                .andExpect(status().isOk())
                .andExpect(header().string("Mcp-Session-Id", "unit-session"))
                .andExpect(content().json("""
                        {"jsonrpc":"2.0","id":1,"result":{"serverInfo":{"name":"erdonline","version":"0.3.0"}}}
                        """));

        assertEquals(initialize, LAST_BODY.get());
    }

    @Test
    void postToolsList_returnsFourteenToolShape() throws Exception {
        mockMvc.perform(post("/mcp")
                        .contentType("application/json")
                        .accept("application/json, text/event-stream")
                        .content("""
                                {"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
                                """))
                .andExpect(status().isOk())
                .andExpect(content().json(toolsListResponse()));
    }

    @Test
    void bearerPat_isForwardedAsIsAndSecurityChainHasHighestOrder() throws Exception {
        mockMvc.perform(post("/mcp")
                        .header("Authorization", PAT)
                        .contentType("application/json")
                        .content("""
                                {"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
                                """))
                .andExpect(status().isOk());

        assertEquals(PAT, LAST_AUTHORIZATION.get(),
                "Spring must forward the PAT instead of trying to decode it as a JWT");
        Order order = McpSecurityConfiguration.class
                .getDeclaredMethod("mcpSecurityFilterChain",
                        org.springframework.security.config.annotation.web.builders.HttpSecurity.class)
                .getAnnotation(Order.class);
        assertNotNull(order);
        assertEquals(0, order.value(), "MCP security chain must run before the JWT chain");
    }

    private static void handleSidecarRequest(HttpExchange exchange) throws IOException {
        LAST_AUTHORIZATION.set(exchange.getRequestHeaders().getFirst("Authorization"));
        LAST_BODY.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));

        if ("GET".equals(exchange.getRequestMethod())) {
            writeJson(exchange, 405, """
                    {"jsonrpc":"2.0","error":{"code":-32000,"message":"Method not allowed (use POST)."},"id":null}
                    """);
            return;
        }
        if (LAST_BODY.get().contains("\"initialize\"")) {
            exchange.getResponseHeaders().add("Mcp-Session-Id", "unit-session");
            writeJson(exchange, 200, """
                    {"jsonrpc":"2.0","id":1,"result":{"serverInfo":{"name":"erdonline","version":"0.3.0"}}}
                    """);
            return;
        }
        writeJson(exchange, 200, toolsListResponse());
    }

    private static void writeJson(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    private static String toolsListResponse() {
        return """
                {"jsonrpc":"2.0","id":2,"result":{"tools":[
                  {"name":"list_projects"},{"name":"get_project"},{"name":"get_project_schema"},
                  {"name":"list_tables"},{"name":"describe_table"},{"name":"list_versions"},
                  {"name":"get_version"},{"name":"create_version"},{"name":"update_project"},
                  {"name":"put_project_json"},{"name":"list_templates"},{"name":"get_template"},
                  {"name":"install_template"},{"name":"get_creator"}
                ]}}
                """;
    }
}
