package com.erdonline.erd.model;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

import java.io.Serializable;

/**
 * 表间关联（外键逆向产物），对齐前端 modules[].associations。
 * <p>约定：{@code from}=外键侧（子表），{@code to}=主键侧（父表）；{@code relation} 默认 {@code 1:n}。
 *
 * @author erdonline
 */
@Data
@JsonPropertyOrder({"relation", "from", "to"})
public class Association implements Serializable {

    public static final String RELATION_ONE_TO_MANY = "1:n";

    private String relation;
    private AssociationEnd from;
    private AssociationEnd to;

    public Association() {
    }

    public Association(String relation, AssociationEnd from, AssociationEnd to) {
        this.relation = relation;
        this.from = from;
        this.to = to;
    }
}
