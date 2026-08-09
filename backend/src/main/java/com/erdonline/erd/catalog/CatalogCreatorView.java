package com.erdonline.erd.catalog;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CatalogCreatorView {
    private String handle;
    private String displayName;
    private List<CatalogTemplateSummaryView> templates;
}
