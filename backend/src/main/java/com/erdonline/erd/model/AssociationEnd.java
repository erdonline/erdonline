package com.erdonline.erd.model;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

import java.io.Serializable;

/**
 * 关联端点：实体标题 + 字段名（与前端 associations.from/to 对齐）。
 *
 * @author erdonline
 */
@Data
@JsonPropertyOrder({"entity", "field"})
public class AssociationEnd implements Serializable {

    private String entity;
    private String field;

    public AssociationEnd() {
    }

    public AssociationEnd(String entity, String field) {
        this.entity = entity;
        this.field = field;
    }
}
