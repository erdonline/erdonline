package com.erdonline.erd.plaza.vo.request;

import lombok.Data;

@Data
public class MaterialQueryRequest {
    private Integer page = 1;
    private Integer pageSize = 20;
    private Integer categoryId;
    private Integer subCategoryId;
    private Integer platformId;
    private Integer industryId;
    private String keyword;
    private String sortBy;
}
