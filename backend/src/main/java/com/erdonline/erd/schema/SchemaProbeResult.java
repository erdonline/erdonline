package com.erdonline.erd.schema;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

/**
 * Response body for {@code POST /connector/schema/probe}.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SchemaProbeResult {
    private SchemaProbeStatus status;
    /** Live DB schema fingerprint (SHA-256 hex). */
    private String fingerprint;
    /** Model/baseline fingerprint when comparison attempted. */
    private String modelFingerprint;
    /** ISO-8601 probe timestamp. */
    private String checkedAt;
    /** Table count in live fingerprint (excludes infra tables). */
    private Integer tableCount;
    private SchemaProbeReason reason;
    /** Human-readable detail (connection error, etc.). */
    private String message;
}
