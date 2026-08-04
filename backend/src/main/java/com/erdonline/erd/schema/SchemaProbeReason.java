package com.erdonline.erd.schema;

/**
 * Machine-readable probe failure / skip reasons.
 */
public enum SchemaProbeReason {
    /** JDBC connect or reverse introspection failed. */
    PROBE_CONNECTION_FAILED,
    /** Reverse parse returned no module. */
    PROBE_REVERSE_EMPTY,
    /** Request omitted projectJSON for comparison. */
    PROBE_NO_MODEL,
    /** Fingerprints differ (informational when status=DIFFERENT). */
    FINGERPRINT_MISMATCH
}
