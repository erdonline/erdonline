package com.erdonline.erd.security;

import com.erdonline.common.core.constant.OssConstants;
import com.erdonline.common.core.exception.ValidateException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WordTemplateGuardTest {

    @Test
    void assertUploadable_acceptsDocx() {
        MockMultipartFile file = new MockMultipartFile("file", "tpl.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                new byte[]{1, 2, 3});
        assertEquals("tpl.docx", WordTemplateGuard.assertUploadable(file));
    }

    @Test
    void assertUploadable_stripsPathAndRejectsNonDocx() {
        MockMultipartFile pathy = new MockMultipartFile("file", "../../evil.docx",
                "application/octet-stream", new byte[]{1});
        assertEquals("evil.docx", WordTemplateGuard.assertUploadable(pathy));

        MockMultipartFile exe = new MockMultipartFile("file", "a.exe",
                "application/octet-stream", new byte[]{1});
        assertThrows(ValidateException.class, () -> WordTemplateGuard.assertUploadable(exe));
    }

    @Test
    void assertUploadable_rejectsBadContentType() {
        MockMultipartFile file = new MockMultipartFile("file", "x.docx",
                "text/html", new byte[]{1});
        assertThrows(ValidateException.class, () -> WordTemplateGuard.assertUploadable(file));
    }

    @Test
    void assertReadableDoctpl_defaultOk() {
        assertNull(WordTemplateGuard.assertReadableDoctpl(null));
        assertNull(WordTemplateGuard.assertReadableDoctpl(""));
        assertNull(WordTemplateGuard.assertReadableDoctpl(OssConstants.DEFAULT_WORD_PATH));
    }

    @Test
    void assertReadableDoctpl_ownedPathReturnsProjectId() {
        String path = OssConstants.DEFAULT_BUCKET + "/projecterd/p1/custom.docx";
        assertEquals("p1", WordTemplateGuard.assertReadableDoctpl(path));
    }

    @Test
    void assertReadableDoctpl_rejectsTraversalAndForeign() {
        assertThrows(ValidateException.class,
                () -> WordTemplateGuard.assertReadableDoctpl("martin/../secret.docx"));
        assertThrows(ValidateException.class,
                () -> WordTemplateGuard.assertReadableDoctpl("other/projecterd/p1/a.docx"));
        assertThrows(ValidateException.class,
                () -> WordTemplateGuard.assertReadableDoctpl("martin/projecterd/p1/sub/a.docx"));
        assertThrows(ValidateException.class,
                () -> WordTemplateGuard.assertReadableDoctpl("martin/projecterd/p1/a.pdf"));
    }

    @Test
    void assertDoctplForProject_rejectsCrossProject() {
        String other = OssConstants.DEFAULT_BUCKET + "/projecterd/other/tpl.docx";
        ValidateException ex = assertThrows(ValidateException.class,
                () -> WordTemplateGuard.assertDoctplForProject(other, "mine"));
        assertTrue(ex.getMessage().contains("不属于"));
        assertDoesNotThrow(() -> WordTemplateGuard.assertDoctplForProject(other, "other"));
        assertDoesNotThrow(() -> WordTemplateGuard.assertDoctplForProject(null, "mine"));
    }

    @Test
    void objectKey_underProjectPrefix() {
        assertEquals("projecterd/abc/t.docx", WordTemplateGuard.objectKey("abc", "t.docx"));
    }
}
