package com.erdonline.erd.catalog;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CatalogInstallResultView {
    private String projectId;
    private String projectName;
    private String templateId;
}
