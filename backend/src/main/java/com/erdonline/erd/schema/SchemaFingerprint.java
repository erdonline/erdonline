package com.erdonline.erd.schema;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Canonical schema IR for live-vs-model fingerprint comparison (ADR-0022).
 */
@Data
@JsonPropertyOrder({"tables", "foreignKeys"})
public class SchemaFingerprint {
    private List<SchemaTableFingerprint> tables = new ArrayList<>();
    private List<SchemaForeignKeyFingerprint> foreignKeys = new ArrayList<>();
}
