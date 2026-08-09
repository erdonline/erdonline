package com.erdonline.erd.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * dataTypeDomains.datatype 枚举片段。
 */
@Data
public class DataDictEnumDto {
    private String name;
    private String code;
    private String kind;
    private List<Map<String, String>> values;
    private Map<String, Map<String, String>> apply;
}
