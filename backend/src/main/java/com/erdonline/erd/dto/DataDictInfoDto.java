package com.erdonline.erd.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * data_dict.dict_info 结构化载荷。
 */
@Data
public class DataDictInfoDto {
    private List<DataDictFieldDto> fields = new ArrayList<>();
    private List<DataDictEnumDto> enums = new ArrayList<>();
}
