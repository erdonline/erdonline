package com.erdonline.erd.catalog;

import lombok.Data;

import java.util.List;

@Data
public class CatalogCommentPageView {
    private long total;
    private List<CatalogCommentView> records;
}
