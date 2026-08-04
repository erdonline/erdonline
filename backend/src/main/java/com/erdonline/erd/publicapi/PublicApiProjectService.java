package com.erdonline.erd.publicapi;

public interface PublicApiProjectService {

    PublicProjectPageView listMine(int page, int size);

    PublicProjectDetailView getMine(String projectId);
}
