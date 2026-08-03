package com.erdonline.erd.security;

import cn.hutool.core.util.StrUtil;
import com.erdonline.common.core.constant.OssConstants;
import com.erdonline.common.core.exception.ValidateException;
import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Word 模板上传/读取约束（R-DATA-04）：扩展名与对象键归属项目前缀，禁止跨租户路径。
 *
 * <p>对象键约定：{@code martin/projecterd/{projectId}/{fileName.docx}}（与
 * {@link com.erdonline.erd.service.impl.GenDocServiceImpl#uploadWordTemplate} 一致）。
 */
public final class WordTemplateGuard {

    private static final String DOCX = ".docx";
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/octet-stream",
            "application/msword",
            "application/zip"
    );

    /** bucket/projecterd/{projectId}/{filename} — no nested dirs, no ".." */
    private static final Pattern OWNED_PATH = Pattern.compile(
            "^" + Pattern.quote(OssConstants.DEFAULT_BUCKET) + "/"
                    + Pattern.quote(OssConstants.PROJECT_MODULE_ERD_BUCKET)
                    + "([^/]+)/([^/]+)$");

    private WordTemplateGuard() {
    }

    /**
     * Validates upload payload; returns a safe basename (no path segments).
     */
    public static String assertUploadable(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ValidateException("上传文件不能为空");
        }
        String raw = file.getOriginalFilename();
        if (StrUtil.isBlank(raw)) {
            throw new ValidateException("文件名不能为空");
        }
        String base = basename(raw);
        if (!base.toLowerCase(Locale.ROOT).endsWith(DOCX)) {
            throw new ValidateException("仅允许上传 .docx Word 模板");
        }
        if (base.length() > 200) {
            throw new ValidateException("文件名过长");
        }
        String ct = file.getContentType();
        if (StrUtil.isNotBlank(ct) && !ALLOWED_CONTENT_TYPES.contains(ct.toLowerCase(Locale.ROOT))) {
            throw new ValidateException("不支持的 Content-Type：" + ct);
        }
        return base;
    }

    /**
     * Default template is shared; custom paths must be under the caller's project prefix.
     * Returns owning projectId for custom templates, or null for the default template.
     */
    public static String assertReadableDoctpl(String doctpl) {
        String resolved = normalize(doctpl);
        if (OssConstants.DEFAULT_WORD_PATH.equals(resolved)) {
            return null;
        }
        rejectTraversal(resolved);
        Matcher m = OWNED_PATH.matcher(resolved);
        if (!m.matches()) {
            throw new ValidateException("非法 Word 模板路径");
        }
        String projectId = m.group(1);
        String fileName = m.group(2);
        if (!fileName.toLowerCase(Locale.ROOT).endsWith(DOCX)) {
            throw new ValidateException("非法 Word 模板路径");
        }
        return projectId;
    }

    /**
     * When exporting for a project, custom doctpl must belong to that same projectId.
     */
    public static void assertDoctplForProject(String doctpl, String projectId) {
        String owner = assertReadableDoctpl(doctpl);
        if (owner != null && !owner.equals(projectId)) {
            throw new ValidateException("Word 模板不属于当前项目");
        }
    }

    public static String objectKey(String projectId, String safeFileName) {
        return OssConstants.PROJECT_MODULE_ERD_BUCKET + projectId + StrUtil.SLASH + safeFileName;
    }

    public static String normalize(String doctpl) {
        if (StrUtil.isBlank(doctpl)) {
            return OssConstants.DEFAULT_WORD_PATH;
        }
        return doctpl.trim();
    }

    private static String basename(String raw) {
        String name = raw.replace('\\', '/');
        int slash = name.lastIndexOf('/');
        if (slash >= 0) {
            name = name.substring(slash + 1);
        }
        if (StrUtil.isBlank(name) || name.equals(".") || name.equals("..") || name.contains("..")) {
            throw new ValidateException("非法文件名");
        }
        return name;
    }

    private static void rejectTraversal(String path) {
        if (path.contains("..") || path.contains("\\") || path.startsWith("/") || path.contains("//")) {
            throw new ValidateException("非法 Word 模板路径");
        }
    }
}
