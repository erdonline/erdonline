package com.erdonline.erd.controller;

import com.erdonline.common.core.api.R;
import com.erdonline.erd.service.ProjectShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 社交解析（Open Graph / Twitter Card）揭示页（ADR-0025）。
 *
 * <p>爬虫不执行 JS，SPA 的 {@code index.html} 只有通用 meta，导致分享链接解析成空白卡片。
 * 本控制器为分享 / 演示 URL 预渲染带 {@code og:*} 的 HTML，仅面向爬虫；真人经 nginx 仍走 SPA，
 * 若直达本页则由 meta refresh / JS 跳回 SPA 路由。匿名可读（Security 放行 {@code /og/**}）。</p>
 *
 * @author erdonline
 */
@RestController
@RequestMapping("og")
@RequiredArgsConstructor
public class OgUnfurlController {

    private static final String SITE_NAME = "ERD Online";
    private static final String TAGLINE = "数据库设计的 Git + Figma";

    private final ProjectShareService projectShareService;

    @Value("${martin.ui.url:http://localhost:8000}")
    private String uiUrlRaw;

    /** 只读分享的社交卡片；失效 token 回落品牌通用卡片（仍 200，不暴露存在性）。 */
    @GetMapping(value = "s/{token}", produces = MediaType.TEXT_HTML_VALUE)
    public String share(@PathVariable String token) {
        String base = uiBase();
        String canonical = base + "/s/" + safePathSegment(token);
        String title;
        String description;
        R<?> r = projectShareService.getByToken(token);
        if (r != null && !r.invalid() && r.getData() instanceof Map<?, ?> data) {
            String name = str(data.get("projectName"));
            String desc = str(data.get("description"));
            int tables = countTables(data.get("projectJSON"));
            title = (name.isEmpty() ? "数据库关系图" : name) + " · " + SITE_NAME;
            StringBuilder d = new StringBuilder();
            d.append(desc.isEmpty() ? "在线数据库关系图" : desc);
            if (tables > 0) {
                d.append(" · ").append(tables).append(" 张表");
            }
            d.append(" · 用 ").append(SITE_NAME).append(" 在线查看（").append(TAGLINE).append("）");
            description = d.toString();
        } else {
            title = SITE_NAME + " · " + TAGLINE;
            description = "开源、免费的在线数据库建模与协作平台：版本快照 + 实时协作 + 关系图设计器。";
        }
        return page(title, description, canonical, base + "/landing-hero.jpg", canonical);
    }

    /** 公开演示的固定品牌卡片。 */
    @GetMapping(value = "demo", produces = MediaType.TEXT_HTML_VALUE)
    public String demo() {
        String base = uiBase();
        String canonical = base + "/demo";
        String title = SITE_NAME + " 在线演示 · " + TAGLINE;
        String description = "免登录体验：30 秒进入带用户/订单表的关系图，感受版本快照与实时协作。";
        return page(title, description, canonical, base + "/landing-hero.jpg", canonical);
    }

    // ---- helpers -------------------------------------------------------

    private String uiBase() {
        String first = uiUrlRaw == null ? "" : uiUrlRaw.split(",")[0].trim();
        if (first.isEmpty()) {
            first = "http://localhost:8000";
        }
        while (first.endsWith("/")) {
            first = first.substring(0, first.length() - 1);
        }
        return first;
    }

    /** 递归累加 projectJSON 中所有 {@code entities} 数组长度（表数量，尽力而为）。 */
    @SuppressWarnings("unchecked")
    private static int countTables(Object node) {
        try {
            if (node instanceof Map<?, ?> map) {
                int sum = 0;
                for (Map.Entry<?, ?> e : map.entrySet()) {
                    if ("entities".equals(e.getKey()) && e.getValue() instanceof List<?> list) {
                        sum += list.size();
                    } else {
                        sum += countTables(e.getValue());
                    }
                }
                return sum;
            }
            if (node instanceof List<?> list) {
                int sum = 0;
                for (Object item : list) {
                    sum += countTables(item);
                }
                return sum;
            }
        } catch (RuntimeException ignore) {
            // 尽力而为：结构异常不影响卡片渲染
        }
        return 0;
    }

    private static String str(Object o) {
        return o == null ? "" : o.toString();
    }

    /** 仅保留 token 安全字符，避免拼进 URL 造成注入（token 为 UUID hex）。 */
    private static String safePathSegment(String s) {
        if (s == null) {
            return "";
        }
        return s.replaceAll("[^A-Za-z0-9_-]", "");
    }

    private static String esc(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private static String page(String title, String description, String url, String image, String redirect) {
        String t = esc(title);
        String d = esc(description);
        String u = esc(url);
        String img = esc(image);
        String rd = esc(redirect);
        return "<!DOCTYPE html>\n"
                + "<html lang=\"zh-CN\">\n<head>\n"
                + "<meta charset=\"utf-8\">\n"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n"
                + "<title>" + t + "</title>\n"
                + "<meta name=\"description\" content=\"" + d + "\">\n"
                + "<link rel=\"canonical\" href=\"" + u + "\">\n"
                + "<meta property=\"og:site_name\" content=\"" + SITE_NAME + "\">\n"
                + "<meta property=\"og:type\" content=\"website\">\n"
                + "<meta property=\"og:title\" content=\"" + t + "\">\n"
                + "<meta property=\"og:description\" content=\"" + d + "\">\n"
                + "<meta property=\"og:url\" content=\"" + u + "\">\n"
                + "<meta property=\"og:image\" content=\"" + img + "\">\n"
                + "<meta property=\"og:image:width\" content=\"1200\">\n"
                + "<meta property=\"og:image:height\" content=\"630\">\n"
                + "<meta name=\"twitter:card\" content=\"summary_large_image\">\n"
                + "<meta name=\"twitter:title\" content=\"" + t + "\">\n"
                + "<meta name=\"twitter:description\" content=\"" + d + "\">\n"
                + "<meta name=\"twitter:image\" content=\"" + img + "\">\n"
                + "<meta http-equiv=\"refresh\" content=\"0; url=" + rd + "\">\n"
                + "<script>location.replace(" + jsString(redirect) + ");</script>\n"
                + "</head>\n<body>\n"
                + "<p><a href=\"" + rd + "\">" + t + "</a></p>\n"
                + "</body>\n</html>\n";
    }

    /** 生成安全的 JS 字符串字面量（转义引号与尖括号，避免破坏 script 上下文）。 */
    private static String jsString(String s) {
        String v = s == null ? "" : s
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("<", "\\u003c")
                .replace(">", "\\u003e");
        return "'" + v + "'";
    }
}
