package com.erdonline.erd.controller;

import com.erdonline.common.core.api.R;
import com.erdonline.erd.service.ProjectShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.ArrayList;
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
        String safeToken = safePathSegment(token);
        String canonical = base + "/s/" + safeToken;
        String imageUrl = base + "/og/s/" + safeToken + "/image.png";
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
        return page(title, description, canonical, imageUrl, canonical);
    }

    /** 公开演示的固定品牌卡片。 */
    @GetMapping(value = "demo", produces = MediaType.TEXT_HTML_VALUE)
    public String demo() {
        String base = uiBase();
        String canonical = base + "/demo";
        String title = SITE_NAME + " 在线演示 · " + TAGLINE;
        String description = "免登录体验：30 秒进入带用户/订单表的关系图，感受版本快照与实时协作。";
        return page(title, description, canonical, base + "/og/demo/image.png", canonical);
    }

    /** 分享卡片 PNG（从 projectJSON 动态渲染的 ER 缩略图）。 */
    @GetMapping(value = "s/{token}/image.png", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> shareImage(@PathVariable String token) {
        R<?> r = projectShareService.getByToken(token);
        byte[] png;
        if (r != null && !r.invalid() && r.getData() instanceof Map<?, ?> data) {
            String name = str(data.get("projectName"));
            int tables = countTables(data.get("projectJSON"));
            png = OgImageRenderer.render(name.isEmpty() ? "Database schema" : name,
                    tables, extractTables(data.get("projectJSON"), 6));
        } else {
            png = OgImageRenderer.render(SITE_NAME, 0, List.of());
        }
        return imagePng(png);
    }

    /** 公开演示卡片 PNG。 */
    @GetMapping(value = "demo/image.png", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> demoImage() {
        List<OgImageRenderer.Table> sample = List.of(
                new OgImageRenderer.Table("sys_user", List.of("id", "username", "password_hash", "email"), 8),
                new OgImageRenderer.Table("sys_role", List.of("id", "code", "name"), 5),
                new OgImageRenderer.Table("biz_order", List.of("id", "user_id", "amount", "status"), 7));
        byte[] png = OgImageRenderer.render(SITE_NAME + " demo", 3, sample);
        return imagePng(png);
    }

    private static ResponseEntity<byte[]> imagePng(byte[] png) {
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .cacheControl(CacheControl.maxAge(Duration.ofHours(6)).cachePublic())
                .body(png);
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

    /** 从 projectJSON 抽取前 N 张表（ASCII 表名/字段名优先）用于渲染缩略图。 */
    private List<OgImageRenderer.Table> extractTables(Object projectJson, int limit) {
        List<Map<String, Object>> ents = new ArrayList<>();
        collectEntities(projectJson, ents);
        List<OgImageRenderer.Table> out = new ArrayList<>();
        for (Map<String, Object> e : ents) {
            if (out.size() >= limit) {
                break;
            }
            String name = firstNonEmpty(str(e.get("title")), str(e.get("defName")),
                    str(e.get("name")), str(e.get("chnname")));
            List<String> fieldNames = new ArrayList<>();
            int total = 0;
            if (e.get("fields") instanceof List<?> fl) {
                total = fl.size();
                for (Object f : fl) {
                    if (fieldNames.size() >= 6) {
                        break;
                    }
                    if (f instanceof Map<?, ?> fm) {
                        String fn = firstNonEmpty(str(fm.get("defName")), str(fm.get("name")),
                                str(fm.get("title")), str(fm.get("chnname")));
                        if (!fn.isEmpty()) {
                            fieldNames.add(fn);
                        }
                    }
                }
            }
            out.add(new OgImageRenderer.Table(name.isEmpty() ? "table" : name, fieldNames, total));
        }
        return out;
    }

    @SuppressWarnings("unchecked")
    private static void collectEntities(Object node, List<Map<String, Object>> acc) {
        if (node instanceof Map<?, ?> map) {
            if (map.get("entities") instanceof List<?> list) {
                for (Object o : list) {
                    if (o instanceof Map<?, ?> m) {
                        acc.add((Map<String, Object>) m);
                    }
                }
            }
            for (Map.Entry<?, ?> e : map.entrySet()) {
                if (!"entities".equals(e.getKey())) {
                    collectEntities(e.getValue(), acc);
                }
            }
        } else if (node instanceof List<?> list) {
            for (Object o : list) {
                collectEntities(o, acc);
            }
        }
    }

    private static String firstNonEmpty(String... xs) {
        for (String x : xs) {
            if (x != null && !x.isEmpty()) {
                return x;
            }
        }
        return "";
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
