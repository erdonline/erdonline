package com.erdonline.erd.model;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@JsonPropertyOrder({"name", "code", "entities"})
public class Module implements Serializable, Cloneable {
    private String name;
    private String code;
    private List<Entity> entities = new ArrayList<>();
    private String key;
    private String label;
    private List<ModuleImage> graphImages;

    public Module() {
    }
}
