package com.erdonline.erd.catalog;

import com.erdonline.common.core.api.R;

public interface CatalogService {

    CatalogPageView listTemplates(String q, String tag, String sort, int page, int size, String userId);

    CatalogTemplateDetailView getTemplate(String id, String userId);

    R installTemplate(String id, String userId, String username);

    R rateTemplate(String id, String userId, int score);

    CatalogCreatorView getCreator(String handle);

    R submitTemplate(String userId, String username, SubmitTemplateRequest request);

    CatalogPageView listSubmissions(String reviewerUsername, int page, int size);

    R approveSubmission(String submissionId, String reviewerUserId, String reviewerUsername);

    R rejectSubmission(String submissionId, String reviewerUserId, String reviewerUsername, String note);
}
