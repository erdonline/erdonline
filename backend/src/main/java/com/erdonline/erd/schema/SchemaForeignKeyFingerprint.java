package com.erdonline.erd.schema;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

/**
 * Normalized FK edge for schema fingerprint.
 */
@Data
@JsonPropertyOrder({"fromTable", "fromColumn", "toTable", "toColumn", "constraintName", "deleteRule", "updateRule"})
public class SchemaForeignKeyFingerprint {
    private String fromTable;
    private String fromColumn;
    private String toTable;
    private String toColumn;
    private String constraintName;
    private String deleteRule;
    private String updateRule;
}
