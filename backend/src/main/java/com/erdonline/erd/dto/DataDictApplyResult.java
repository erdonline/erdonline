package com.erdonline.erd.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * POST /dataDict/{id}/apply 响应：供前端 copy 进 projectJSON。
 */
@Data
public class DataDictApplyResult {
    private String dictId;
    private String dictCode;
    private String title;
    private List<DataDictFieldDto> fields = new ArrayList<>();
    private List<DataDictEnumDto> enums = new ArrayList<>();
}
