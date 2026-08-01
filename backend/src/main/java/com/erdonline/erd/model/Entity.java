package com.erdonline.erd.model;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@JsonPropertyOrder({"title", "chnname", "fields"})
public class Entity implements Serializable {
    private String title;
    private String chnname;
    private List<Field> fields = new ArrayList<>();

    public Entity() {
    }
}
