package com.erdonline.erd.publicapi;

public interface PublicApiProjectService {

    PublicProjectPageView listMine(int page, int size);

    PublicProjectDetailView getMine(String projectId);

    /** Requires {@code projects:write} + membership; partial metadata. */
    PublicProjectDetailView patchMine(String projectId, PatchPublicProjectRequest request);

    /** Requires {@code projects:write} + membership; replaces projectJSON (sanitized). */
    PublicProjectDetailView putProjectJsonMine(String projectId, PutPublicProjectJsonRequest request);
}
