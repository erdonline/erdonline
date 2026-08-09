package com.erdonline.erd.dto;

import lombok.Data;

import java.util.Map;

/**
 * projectJSON Field 片段（字段库 apply 载荷）。
 */
@Data
public class DataDictFieldDto {
    private String name;
    private String chnname;
    private String type;
    private String typeName;
    private String dataType;
    private String remark;
    private Boolean pk;
    private Boolean notNull;
    private Boolean autoIncrement;
    private Boolean relationNoShow;
    private String defaultValue;
    private String uiHint;
    /** 可选：追溯来源 data_dict.id（copy-on-apply，无 live 级联） */
    private String dictRef;
    /** forward-compat：保留未知键 */
    private Map<String, Object> extra;
}
