package com.erdonline.erd.model;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

import java.io.Serializable;

@Data
@JsonPropertyOrder({
        "name", "type", "chnname", "remark", "pk", "notNull",
        "autoIncrement", "defaultValue", "relationNoShow", "uiHint"
})
public class Field implements Serializable {
    private String name;
    private String type;
    private String chnname;
    private String remark = "";
    private boolean pk;
    private boolean notNull;
    private boolean autoIncrement;
    private String defaultValue = "";
    private Boolean relationNoShow = false;
    private String uiHint = "";

    public Field() {
    }

    @Override
    public String toString() {
        return "Field{" +
                "name='" + this.name + '\'' +
                ", type='" + this.type + '\'' +
                ", chnname='" + this.chnname + '\'' +
                ", remark='" + this.remark + '\'' +
                ", pk=" + this.pk +
                ", notNull=" + this.notNull +
                ", autoIncrement=" + this.autoIncrement +
                ", defaultValue='" + this.defaultValue + '\'' +
                ", relationNoShow=" + this.relationNoShow +
                ", uiHint='" + this.uiHint + '\'' +
                '}';
    }
}
