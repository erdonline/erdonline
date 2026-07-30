package com.erdonline.erd.model;

import com.alibaba.fastjson.annotation.JSONField;
import lombok.Data;

import java.io.Serializable;

@Data
public class Field implements Serializable {
    @JSONField(
            ordinal = 1
    )
    private String name;
    @JSONField(
            ordinal = 2
    )
    private String type;
    @JSONField(
            ordinal = 3
    )
    private String chnname;
    @JSONField(
            ordinal = 4
    )
    private String remark = "";
    @JSONField(
            ordinal = 5
    )
    private boolean pk;
    @JSONField(
            ordinal = 6
    )
    private boolean notNull;
    @JSONField(
            ordinal = 7
    )
    private boolean autoIncrement;
    @JSONField(
            ordinal = 8
    )
    private String defaultValue = "";
    @JSONField(
            ordinal = 9
    )
    private Boolean relationNoShow = false;
    @JSONField(
            ordinal = 10
    )
    private String uiHint = "";

    public Field() {
    }

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
