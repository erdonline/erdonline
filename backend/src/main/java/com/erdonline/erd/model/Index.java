package com.erdonline.erd.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * 表索引（与前端 projectJSON entity.indexs 对齐：name / fields / isUnique / filter）。
 */
@Data
public class Index implements Serializable {
    private String name;
    private List<String> fields = new ArrayList<>();
    @JsonProperty("isUnique")
    private boolean unique;
    /**
     * 部分/过滤索引谓词原样（PG {@code indpred} / SQL Server {@code filter_definition}）。
     * 无谓词时为 null。
     */
    private String filter;

    public Index() {
    }

    public Index(String name, boolean unique) {
        this.name = name;
        this.unique = unique;
    }
}
