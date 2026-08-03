package com.erdonline.erd.model;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@JsonPropertyOrder({"title", "chnname", "fields", "indexs", "triggers"})
public class Entity implements Serializable {
    private String title;
    private String chnname;
    private List<Field> fields = new ArrayList<>();
    /** 非主键索引（PRIMARY 已映射到 field.pk） */
    private List<Index> indexs = new ArrayList<>();
    /** 表级触发器（逆向保真；可选） */
    private List<Trigger> triggers = new ArrayList<>();

    public Entity() {
    }
}
