package com.erdonline.erd.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

import java.io.Serializable;

/**
 * 表间关联（外键逆向产物），对齐前端 modules[].associations。
 * <p>约定：{@code from}=外键侧（子表），{@code to}=主键侧（父表）；{@code relation} 默认 {@code 1:n}。
 * <p>复合 FK 仍按列拆成多条（ADR-0011）；同约束共享 {@code constraintName} / 引用动作，不聚合为 {@code fields[]}。
 *
 * @author erdonline
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonPropertyOrder({"relation", "from", "to", "constraintName", "deleteRule", "updateRule"})
public class Association implements Serializable {

    public static final String RELATION_ONE_TO_MANY = "1:n";

    private String relation;
    private AssociationEnd from;
    private AssociationEnd to;
    /** 库中 FK 约束名（可选；复合多边同名） */
    private String constraintName;
    /** CASCADE / SET NULL / SET DEFAULT / RESTRICT / NO ACTION（可选） */
    private String deleteRule;
    /** CASCADE / SET NULL / SET DEFAULT / RESTRICT / NO ACTION（可选） */
    private String updateRule;

    public Association() {
    }

    public Association(String relation, AssociationEnd from, AssociationEnd to) {
        this.relation = relation;
        this.from = from;
        this.to = to;
    }
}
