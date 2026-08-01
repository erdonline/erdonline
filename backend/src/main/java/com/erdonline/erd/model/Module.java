package com.erdonline.erd.model;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@JsonPropertyOrder({"name", "code", "entities", "associations"})
public class Module implements Serializable, Cloneable {
    private String name;
    private String code;
    private List<Entity> entities = new ArrayList<>();
    /** 表间关联（外键逆向）；与前端 modules[].associations 对齐 */
    private List<Association> associations = new ArrayList<>();
    private String key;
    private String label;
    private List<ModuleImage> graphImages;

    public Module() {
    }
}
