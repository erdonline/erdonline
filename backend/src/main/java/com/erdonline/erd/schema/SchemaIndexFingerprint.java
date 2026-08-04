package com.erdonline.erd.schema;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Normalized index slice for schema fingerprint.
 */
@Data
@JsonPropertyOrder({"name", "fields", "unique", "filter"})
public class SchemaIndexFingerprint {
    private String name;
    private List<String> fields = new ArrayList<>();
    @JsonProperty("unique")
    private boolean unique;
    private String filter;
}
