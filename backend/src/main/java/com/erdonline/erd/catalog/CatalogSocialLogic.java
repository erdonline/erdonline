package com.erdonline.erd.catalog;

import org.springframework.util.StringUtils;

/**
 * 可单测的 catalog 社交小逻辑（从 Service 抽出，避免反射）。
 */
final class CatalogSocialLogic {

    private CatalogSocialLogic() {
    }

    static boolean isOfficial(CatalogTemplate t) {
        return !StringUtils.hasText(t.getSourceProjectId());
    }

    static boolean isCommentsEnabled(CatalogTemplate t) {
        return t.getCommentsEnabled() == null || t.getCommentsEnabled() != 0;
    }
}
