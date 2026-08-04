package com.erdonline.erd.schema;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

/**
 * Normalized column slice for schema fingerprint (ADR-0022 B-layer IR).
 */
@Data
@JsonPropertyOrder({"name", "type", "pk", "notNull", "autoIncrement", "defaultValue"})
public class SchemaColumnFingerprint {
    private String name;
    private String type;
    private boolean pk;
    private boolean notNull;
    private boolean autoIncrement;
    private String defaultValue = "";
}
