package com.erdonline.erd.schema;

/**
 * Machine-readable probe failure / skip reasons.
 */
public enum SchemaProbeReason {
    /** No JDBC datasource selected (client-side). */
    PROBE_NO_DATASOURCE,
    /** User has not clicked probe yet (client-side). */
    PROBE_NOT_PROBED,
    /** JDBC connect or reverse introspection failed. */
    PROBE_CONNECTION_FAILED,
    /** Credentials valid but schema introspection denied. */
    PROBE_NO_PERMISSION,
    /** Reverse parse returned no module. */
    PROBE_REVERSE_EMPTY,
    /** Request omitted projectJSON for comparison. */
    PROBE_NO_MODEL,
    /** Structural IR differs (informational when status is AHEAD/BEHIND/DIVERGED). */
    FINGERPRINT_MISMATCH
}
