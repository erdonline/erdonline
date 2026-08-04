package com.erdonline.erd.schema;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Normalized table slice for schema fingerprint.
 */
@Data
@JsonPropertyOrder({"name", "columns", "indexes"})
public class SchemaTableFingerprint {
    private String name;
    private List<SchemaColumnFingerprint> columns = new ArrayList<>();
    private List<SchemaIndexFingerprint> indexes = new ArrayList<>();
}
