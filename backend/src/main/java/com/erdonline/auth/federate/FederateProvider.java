package com.erdonline.auth.federate;

/**
 * 支持的 IdP（ADR-0021）。
 */
public enum FederateProvider {
    GITHUB("github"),
    GOOGLE("google"),
    WECHAT("wechat");

    private final String wire;

    FederateProvider(String wire) {
        this.wire = wire;
    }

    public String wire() {
        return wire;
    }

    public static FederateProvider fromWire(String raw) {
        if (raw == null) {
            throw new IllegalArgumentException("provider required");
        }
        String n = raw.trim().toLowerCase();
        for (FederateProvider p : values()) {
            if (p.wire.equals(n)) {
                return p;
            }
        }
        throw new IllegalArgumentException("unsupported provider: " + raw);
    }
}
