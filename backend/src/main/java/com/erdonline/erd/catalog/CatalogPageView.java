package com.erdonline.erd.catalog;

import lombok.Data;

import java.util.List;

@Data
public class CatalogPageView {
    private long total;
    private List<CatalogTemplateSummaryView> records;
}
