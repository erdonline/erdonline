package com.erdonline.erd.catalog;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CatalogSocialLogicTest {

    @Test
    void isOfficial_whenNoSourceProject() {
        CatalogTemplate t = new CatalogTemplate().setSourceProjectId(null);
        assertTrue(CatalogSocialLogic.isOfficial(t));
    }

    @Test
    void isOfficial_whenCommunitySubmission() {
        CatalogTemplate t = new CatalogTemplate().setSourceProjectId("proj-1");
        assertFalse(CatalogSocialLogic.isOfficial(t));
    }

    @Test
    void isCommentsEnabled_defaultsOpen() {
        assertTrue(CatalogSocialLogic.isCommentsEnabled(new CatalogTemplate()));
        assertTrue(CatalogSocialLogic.isCommentsEnabled(new CatalogTemplate().setCommentsEnabled(1)));
        assertFalse(CatalogSocialLogic.isCommentsEnabled(new CatalogTemplate().setCommentsEnabled(0)));
    }
}
