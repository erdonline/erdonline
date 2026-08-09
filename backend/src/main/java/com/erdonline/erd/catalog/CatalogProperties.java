package com.erdonline.erd.catalog;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * ADR-0028：模板广场配置（Open VSX 模式）。
 */
@Data
@ConfigurationProperties(prefix = "erd.catalog")
public class CatalogProperties {

    /**
     * 可选远程 catalog API 根 URL（空 = 仅本地/offline）。
     */
    private String apiUrl = "";

    /**
     * 可审核社区提交的维护者用户名列表（默认 admin）。
     */
    private List<String> maintainerUsernames = new ArrayList<>(List.of("admin"));

    /** 同一用户在同一模板下发表评论的最小间隔（秒）。 */
    private int commentRateLimitSeconds = 60;

    /** 举报达此阈值自动隐藏（pending review）。 */
    private int commentAutoHideReportThreshold = 2;
}
