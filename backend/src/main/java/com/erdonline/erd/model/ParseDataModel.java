package com.erdonline.erd.model;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

import java.util.Comparator;
import java.util.Map;
import java.util.TreeMap;

/**
 * 逆向解析中间模型。
 */
@Data
@JsonPropertyOrder({"dbType", "module", "dataTypeMap", "properties"})
public class ParseDataModel {
    private String dbType;
    private Module module;
    private Map<String, DataType> dataTypeMap = new TreeMap<>(Comparator.naturalOrder());
    private Map<String, Object> properties = new TreeMap<>(Comparator.naturalOrder());

    public ParseDataModel() {
    }
}
