package com.erdonline.erd.publicapi;

public interface PublicApiVersionService {

    /**
     * Paginated version history for a project the PAT user belongs to.
     *
     * @param dbKey optional filter; blank = all db keys
     */
    PublicVersionPageView listMine(String projectId, String dbKey, int page, int size);

    /** Single version; must belong to {@code projectId}. */
    PublicVersionDetailView getMine(String projectId, String versionId);
}
