package com.erdonline.erd.catalog;

import com.erdonline.common.core.api.R;
import com.erdonline.erd.entity.Project;
import com.erdonline.erd.mapper.CatalogCommentMapper;
import com.erdonline.erd.mapper.CatalogCommentReportMapper;
import com.erdonline.erd.mapper.CatalogCommentRestrictionMapper;
import com.erdonline.erd.mapper.CatalogInstallMapper;
import com.erdonline.erd.mapper.CatalogRatingMapper;
import com.erdonline.erd.mapper.CatalogSubmissionMapper;
import com.erdonline.erd.mapper.CatalogTemplateMapper;
import com.erdonline.erd.mapper.UserIdentityLinkMapper;
import com.erdonline.erd.service.ProjectService;
import com.erdonline.erd.service.impl.ProjectShareServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogServiceImplTest {

    @Mock
    private CatalogTemplateMapper templateMapper;
    @Mock
    private CatalogRatingMapper ratingMapper;
    @Mock
    private CatalogInstallMapper installMapper;
    @Mock
    private CatalogSubmissionMapper submissionMapper;
    @Mock
    private CatalogCommentMapper commentMapper;
    @Mock
    private CatalogCommentReportMapper commentReportMapper;
    @Mock
    private CatalogCommentRestrictionMapper commentRestrictionMapper;
    @Mock
    private ProjectService projectService;
    @Mock
    private UserIdentityLinkMapper identityLinkMapper;
    @Mock
    private CatalogProperties catalogProperties;

    private CatalogServiceImpl catalogService;

    @BeforeEach
    void setUp() {
        catalogService = new CatalogServiceImpl(
                templateMapper,
                ratingMapper,
                installMapper,
                submissionMapper,
                commentMapper,
                commentReportMapper,
                commentRestrictionMapper,
                projectService,
                identityLinkMapper,
                catalogProperties);
    }

    @Test
    void submitTemplate_creatorWithoutGithub_insertsPendingSubmission() {
        SubmitTemplateRequest request = new SubmitTemplateRequest();
        request.setProjectId("p1");
        request.setTitle("My Template");

        Project project = new Project();
        project.setId("p1");
        project.setCreator("u1");
        when(projectService.getById("p1")).thenReturn(project);

        R result = catalogService.submitTemplate("u1", "alice", request);

        assertEquals(200, result.getCode());
        ArgumentCaptor<CatalogSubmission> captor = ArgumentCaptor.forClass(CatalogSubmission.class);
        verify(submissionMapper).insert(captor.capture());
        CatalogSubmission row = captor.getValue();
        assertEquals("p1", row.getProjectId());
        assertEquals("u1", row.getSubmitterUserId());
        assertEquals("My Template", row.getTitle());
        assertEquals("pending", row.getStatus());
        verifyNoInteractions(identityLinkMapper);
    }

    @Test
    void submitTemplate_nonCreator_rejectedWithoutInsert() {
        SubmitTemplateRequest request = new SubmitTemplateRequest();
        request.setProjectId("p1");
        request.setTitle("My Template");

        Project project = new Project();
        project.setId("p1");
        project.setCreator("owner");
        when(projectService.getById("p1")).thenReturn(project);

        R result = catalogService.submitTemplate("u1", "alice", request);

        assertTrue(result.getCode() != 200);
        assertEquals("仅项目创建人可发布为模板", result.getMsg());
        verify(submissionMapper, never()).insert(any(CatalogSubmission.class));
    }

    @Test
    void prepareInstallJson_stripsDbsAndDefaultDataSource() {
        Map<String, Object> profile = new HashMap<>();
        profile.put("defaultDataSourceId", "ds-1");
        profile.put("dbs", List.of(Map.of("name", "secret")));
        Map<String, Object> json = new HashMap<>();
        json.put("profile", profile);
        json.put("modules", List.of());

        Map<String, Object> out = invokePrepare(json);
        @SuppressWarnings("unchecked")
        Map<String, Object> outProfile = (Map<String, Object>) out.get("profile");
        assertNotNull(outProfile);
        assertTrue(outProfile.get("dbs") instanceof List);
        assertTrue(((List<?>) outProfile.get("dbs")).isEmpty());
        assertTrue(!outProfile.containsKey("defaultDataSourceId"));
    }

    @Test
    void sanitizeViaShare_isUsed() {
        Map<String, Object> json = new HashMap<>();
        Map<String, Object> profile = new HashMap<>();
        profile.put("dbs", List.of(Map.of("password", "x")));
        json.put("profile", profile);
        Map<String, Object> sanitized = ProjectShareServiceImpl.sanitizeProjectJson(json);
        @SuppressWarnings("unchecked")
        List<?> dbs = (List<?>) ((Map<?, ?>) sanitized.get("profile")).get("dbs");
        assertTrue(dbs.isEmpty());
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> invokePrepare(Map<String, Object> source) {
        try {
            var m = CatalogServiceImpl.class.getDeclaredMethod("prepareInstallJson", Map.class);
            m.setAccessible(true);
            return (Map<String, Object>) m.invoke(null, source);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
