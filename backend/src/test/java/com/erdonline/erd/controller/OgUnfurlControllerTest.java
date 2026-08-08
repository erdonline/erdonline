package com.erdonline.erd.controller;

import com.erdonline.common.core.api.R;
import com.erdonline.erd.service.ProjectShareService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * ADR-0025 社交解析揭示页：per-project OG、HTML 转义（防注入）、表数量、失效回落、多源取首。
 */
class OgUnfurlControllerTest {

    private OgUnfurlController controller(ProjectShareService svc, String uiUrl) {
        OgUnfurlController c = new OgUnfurlController(svc);
        ReflectionTestUtils.setField(c, "uiUrlRaw", uiUrl);
        return c;
    }

    @Test
    void share_validToken_rendersEscapedPerProjectCard() {
        ProjectShareService svc = mock(ProjectShareService.class);
        Map<String, Object> projectJson = Map.of(
                "modules", List.of(Map.of("entities", List.of(Map.of(), Map.of(), Map.of()))));
        Map<String, Object> data = Map.of(
                "projectName", "<b>用户库</b>",
                "description", "含\"引号\"与 <标签>",
                "projectJSON", projectJson);
        when(svc.getByToken("tok123")).thenReturn(R.ok(data));

        // 多源 ERD_UI_URL 取首个、去尾斜杠
        String html = controller(svc, "https://app.example.com/,https://second.example.com").share("tok123");

        assertTrue(html.contains("<meta property=\"og:title\""), "should have og:title");
        assertTrue(html.contains("twitter:card\" content=\"summary_large_image\""));
        assertTrue(html.contains("3 张表"), "table count from entities");
        assertTrue(html.contains("https://app.example.com/s/tok123"), "canonical uses first origin");
        assertTrue(html.contains("https://app.example.com/og/s/tok123/image.png"), "og image is dynamic per-share PNG");
        // XSS：项目名/描述必须被转义，不得原样注入标签
        assertTrue(html.contains("&lt;b&gt;用户库&lt;/b&gt;"), "name html-escaped");
        assertFalse(html.contains("<b>用户库</b>"), "raw tag must not leak into head");
        assertTrue(html.contains("&quot;引号&quot;"), "quotes escaped");
    }

    @Test
    void share_scriptInName_isEscaped() {
        ProjectShareService svc = mock(ProjectShareService.class);
        Map<String, Object> data = Map.of("projectName", "<script>alert(1)</script>",
                "description", "", "projectJSON", Map.of());
        when(svc.getByToken("x")).thenReturn(R.ok(data));

        String html = controller(svc, "https://app.example.com").share("x");

        assertTrue(html.contains("&lt;script&gt;alert(1)&lt;/script&gt;"));
        assertFalse(html.contains("<script>alert(1)"), "must not emit executable script");
    }

    @Test
    void share_invalidToken_fallsBackToBrandCard() {
        ProjectShareService svc = mock(ProjectShareService.class);
        when(svc.getByToken("gone")).thenReturn(R.failed("分享不存在或已失效"));

        String html = controller(svc, "https://app.example.com").share("gone");

        assertTrue(html.contains("ERD Online · 数据库设计的 Git + Figma"));
        assertFalse(html.contains("张表"), "brand fallback has no table count");
        assertTrue(html.contains("https://app.example.com/s/gone"));
    }

    @Test
    void demo_rendersDemoCard() {
        ProjectShareService svc = mock(ProjectShareService.class);
        String html = controller(svc, "https://app.example.com").demo();

        assertTrue(html.contains("在线演示"));
        assertTrue(html.contains("summary_large_image"));
        assertTrue(html.contains("0; url=https://app.example.com/demo"));
    }
}
