package com.erdonline.erd.service.impl;

import com.erdonline.common.core.api.R;
import com.erdonline.common.core.constant.OssConstants;
import com.erdonline.common.oss.service.OssTemplate;
import com.erdonline.erd.entity.Project;
import com.erdonline.erd.service.DbChangeService;
import com.erdonline.erd.service.ProjectService;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GenDocServiceImplTest {

    @Mock
    private OssTemplate minioOssTemplate;

    @Mock
    private ProjectService projectService;

    @Mock
    private DbChangeService dbChangeService;

    @InjectMocks
    private GenDocServiceImpl genDocService;

    @BeforeEach
    void clearOssByDefault() throws Exception {
        // 默认模拟「MinIO 缺席」：InjectMocks 会注入 mock，单测按需覆盖
        setOss(null);
    }

    private void setOss(OssTemplate oss) throws Exception {
        var field = GenDocServiceImpl.class.getDeclaredField("minioOssTemplate");
        field.setAccessible(true);
        field.set(genDocService, oss);
    }

    @Test
    void normalizeDoctpl_blank_usesDefaultPath() {
        assertEquals(OssConstants.DEFAULT_WORD_PATH, GenDocServiceImpl.normalizeDoctpl(null));
        assertEquals(OssConstants.DEFAULT_WORD_PATH, GenDocServiceImpl.normalizeDoctpl(""));
        assertEquals("martin/custom.docx", GenDocServiceImpl.normalizeDoctpl("martin/custom.docx"));
    }

    @Test
    void openTemplateStream_withoutMinio_fallsBackToClasspathDefault() throws Exception {
        try (InputStream in = genDocService.openTemplateStream(null)) {
            assertNotNull(in);
            try (XWPFDocument doc = new XWPFDocument(in)) {
                assertNotNull(doc.getDocument());
            }
        }
    }

    @Test
    void openTemplateStream_customWithoutMinio_throwsClearError() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> genDocService.openTemplateStream("martin/projecterd/p1/custom.docx"));
        assertTrue(ex.getMessage().contains("MinIO"));
        assertEquals(GenDocServiceImpl.MINIO_REQUIRED_MSG, ex.getMessage());
    }

    @Test
    void uploadWordTemplate_withoutMinio_returnsFailed() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "tpl.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                new byte[]{1, 2, 3});
        R<?> r = genDocService.uploadWordTemplate(file, "proj-1");
        assertTrue(r.invalid());
        assertEquals(GenDocServiceImpl.MINIO_REQUIRED_MSG, r.getMsg());
    }

    @Test
    void openTemplateStream_withMinio_usesOssForCustom() throws Exception {
        setOss(minioOssTemplate);
        byte[] bytes;
        try (InputStream classpath = new org.springframework.core.io.ClassPathResource(
                OssConstants.CLASSPATH_DEFAULT_WORD_TEMPLATE).getInputStream()) {
            bytes = classpath.readAllBytes();
        }
        when(minioOssTemplate.download("martin", "projecterd/p1/custom.docx"))
                .thenReturn(new ByteArrayInputStream(bytes));

        try (InputStream in = genDocService.openTemplateStream("martin/projecterd/p1/custom.docx")) {
            assertNotNull(in);
            assertTrue(in.read() >= 0);
        }
        verify(minioOssTemplate).download("martin", "projecterd/p1/custom.docx");
    }

    @Test
    void openTemplateStream_minioFailsOnDefault_fallsBackToClasspath() throws Exception {
        setOss(minioOssTemplate);
        when(minioOssTemplate.download(anyString(), anyString()))
                .thenThrow(new RuntimeException("connection refused"));

        try (InputStream in = genDocService.openTemplateStream("")) {
            assertNotNull(in);
            try (XWPFDocument doc = new XWPFDocument(in)) {
                assertNotNull(doc.getDocument());
            }
        }
    }

    @Test
    void downloadWordTemplate_withoutMinio_writesDocx() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        genDocService.downloadWordTemplate(null, response);
        assertTrue(response.getContentAsByteArray().length > 0);
        assertTrue(response.getContentType().contains("octet-stream")
                || "application/octet-stream".equals(response.getContentType()));
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(response.getContentAsByteArray()))) {
            assertNotNull(doc.getDocument());
        }
    }

    @Test
    void genDataBaseDocx_withoutMinio_exportsDocx() throws Exception {
        Project project = new Project();
        project.setProjectName("demo-proj");
        Map<String, Object> json = new HashMap<>();
        json.put("modules", List.of());
        project.setProjectJSON(json);
        when(projectService.getOne(any())).thenReturn(project);
        when(dbChangeService.loadHistoryVersion(anyString(), anyString())).thenReturn(Collections.emptyList());

        MockHttpServletResponse response = new MockHttpServletResponse();
        Map<String, Object> params = new HashMap<>();
        params.put("projectId", "p1");
        params.put("dbKey", "MYSQL");
        params.put("imgs", new HashMap<>());

        genDocService.genDataBaseDocx(params, response);

        assertTrue(response.getContentAsByteArray().length > 0);
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(response.getContentAsByteArray()))) {
            assertNotNull(doc.getDocument());
        }
        verify(minioOssTemplate, never()).download(anyString(), anyString());
    }

    @Test
    void uploadWordTemplate_withMinio_delegates() throws Exception {
        setOss(minioOssTemplate);
        when(minioOssTemplate.upload(eq(OssConstants.DEFAULT_BUCKET), anyString(), any(InputStream.class), anyBoolean()))
                .thenReturn("martin/projecterd/p1/tpl.docx");
        MockMultipartFile file = new MockMultipartFile("file", "tpl.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                new byte[]{1, 2, 3});
        R<?> r = genDocService.uploadWordTemplate(file, "p1");
        assertTrue(r.valid());
        assertEquals("martin/projecterd/p1/tpl.docx", r.getData());
    }
}
