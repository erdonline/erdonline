package com.erdonline.erd.schema;

/**
 * B-layer probe outcome (ADR-0022 slice 8 / five-state #10).
 */
public enum SchemaProbeStatus {
    /** Live schema matches model fingerprint. */
    SYNCED,
    /** Model has structure not yet in live DB. */
    AHEAD,
    /** Live DB has structure not in model. */
    BEHIND,
    /** Both sides have unique or conflicting changes. */
    DIVERGED,
    /** Cannot classify (no datasource, unreachable, permission, not probed). */
    UNKNOWN
}
