package com.erdonline.erd.mcp;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Streamable HTTP MCP sidecar proxy (ADR-0013). Spring exposes {@code /mcp} on the
 * public HTTP port; Node {@code @erdonline/mcp} serves tools on an internal port.
 */
@Data
@ConfigurationProperties(prefix = "erd.mcp")
public class McpProperties {

    /** When false, {@code /mcp} is not registered (local stdio-only dogfood). */
    private boolean enabled = true;

    /** Sidecar base URL without trailing slash, e.g. {@code http://127.0.0.1:3920}. */
    private String internalBaseUrl = "http://127.0.0.1:3920";
}
