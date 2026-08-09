package com.erdonline.erd.service.impl;

import com.erdonline.common.core.api.R;
import com.erdonline.erd.entity.DbChange;
import com.erdonline.erd.mapper.DbChangeMapper;
import com.erdonline.erd.service.DbVersionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * 「所见即真差异」后端权威：diffAgainstLatest 接口 + saveVersion 落库前重算 changes。
 */
@ExtendWith(MockitoExtension.class)
class DbChangeServiceImplDiffTest {

    @Mock
    private DbChangeMapper dbChangeMapper;

    @Mock
    private DbVersionService dbVersionService;

    @InjectMocks
    private DbChangeServiceImpl dbChangeService;

    @BeforeEach
    void wireMapper() {
        ReflectionTestUtils.setField(dbChangeService, "baseMapper", dbChangeMapper);
    }

    private static Map<String, Object> projectJson(String moduleName, String tableTitle) {
        Map<String, Object> table = new LinkedHashMap<>();
        table.put("title", tableTitle);
        table.put("fields", new ArrayList<>());
        table.put("indexs", new ArrayList<>());

        Map<String, Object> module = new LinkedHashMap<>();
        module.put("name", moduleName);
        module.put("entities", new ArrayList<>(List.of(table)));

        Map<String, Object> pj = new HashMap<>();
        pj.put("modules", new ArrayList<>(List.of(module)));
        return pj;
    }

    @Test
    void diffAgainstLatest_noExistingVersion_hasBaselineFalseAndAllAdds() {
        when(dbChangeMapper.selectList(any())).thenReturn(Collections.emptyList());

        Map<String, Object> body = new HashMap<>();
        body.put("projectId", "p1");
        body.put("dbKey", "SNAPSHOT");
        body.put("projectJSON", projectJson("M1", "T_USER"));

        R<?> result = dbChangeService.diffAgainstLatest(body);
        assertEquals(200, result.getCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.getData();
        assertFalse((Boolean) data.get("hasBaseline"));
        assertNull(data.get("baseline"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> changes = (List<Map<String, Object>>) data.get("changes");
        assertTrue(changes.stream().anyMatch(c -> "entity".equals(c.get("type")) && "add".equals(c.get("opt"))));
    }

    @Test
    void diffAgainstLatest_sameAsLatestVersion_noChanges() {
        Map<String, Object> pj = projectJson("M1", "T_USER");
        DbChange latest = new DbChange();
        latest.setId("v1");
        latest.setVersion("1.0.0");
        latest.setProjectJSON(pj);
        when(dbChangeMapper.selectList(any())).thenReturn(List.of(latest));

        Map<String, Object> body = new HashMap<>();
        body.put("projectId", "p1");
        body.put("dbKey", "SNAPSHOT");
        // 内容相同、但是不同的对象引用（模拟两次 JSON 反序列化）
        body.put("projectJSON", projectJson("M1", "T_USER"));

        R<?> result = dbChangeService.diffAgainstLatest(body);
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.getData();
        assertTrue((Boolean) data.get("hasBaseline"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> changes = (List<Map<String, Object>>) data.get("changes");
        assertTrue(changes.isEmpty(), () -> "expected no diff for content-equal snapshot, got: " + changes);
    }

    @Test
    void diffAgainstLatest_explicitBaseline_skipsDbLookup() {
        Map<String, Object> body = new HashMap<>();
        body.put("projectId", "p1");
        body.put("dbKey", "SNAPSHOT");
        body.put("projectJSON", projectJson("M1", "T_ORDER"));
        body.put("baselineProjectJSON", projectJson("M1", "T_USER"));

        R<?> result = dbChangeService.diffAgainstLatest(body);
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.getData();
        assertTrue((Boolean) data.get("hasBaseline"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> changes = (List<Map<String, Object>>) data.get("changes");
        assertTrue(changes.stream().anyMatch(c -> "T_ORDER".equals(c.get("name")) && "add".equals(c.get("opt"))));
        assertTrue(changes.stream().anyMatch(c -> "T_USER".equals(c.get("name")) && "delete".equals(c.get("opt"))));
    }

    @Test
    void diffAgainstLatest_returnsAlignedDdlWithEntityCreates() {
        Map<String, Object> body = new HashMap<>();
        body.put("projectId", "p1");
        body.put("dbKey", "SNAPSHOT");
        body.put("dialectCode", "MYSQL");
        body.put("projectJSON", projectJsonWithDomains("T_NEW"));
        body.put("baselineProjectJSON", projectJsonWithDomains("T_OLD"));

        R<?> result = dbChangeService.diffAgainstLatest(body);
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.getData();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> changes = (List<Map<String, Object>>) data.get("changes");
        String ddl = String.valueOf(data.get("ddl"));
        assertTrue(changes.stream().anyMatch(c -> "T_NEW".equals(c.get("name")) && "add".equals(c.get("opt"))));
        assertTrue(ddl.contains("CREATE TABLE `T_NEW`"), () -> "ddl must match entity add: " + ddl);
    }

    private static Map<String, Object> projectJsonWithDomains(String tableTitle) {
        Map<String, Object> table = new LinkedHashMap<>();
        table.put("title", tableTitle);
        table.put("fields", new ArrayList<>(List.of(
                Map.of("name", "id", "type", "String", "pk", true))));
        Map<String, Object> module = new LinkedHashMap<>();
        module.put("name", "M1");
        module.put("entities", new ArrayList<>(List.of(table)));
        module.put("associations", new ArrayList<>());
        Map<String, Object> pj = new HashMap<>();
        pj.put("profile", Map.of("sqlConfig", "/*SQL@Run*/"));
        pj.put("dataTypeDomains", Map.of(
                "datatype", new ArrayList<>(List.of(
                        Map.of("code", "String", "apply", Map.of("MYSQL", Map.of("type", "VARCHAR(32)"))))),
                "database", new ArrayList<>(List.of(
                        Map.of("code", "MYSQL", "defaultDatabase", true,
                                "createTableTemplate", "CREATE TABLE `{{=it.entity.title}}`();{{=it.separator}}")))));
        pj.put("modules", new ArrayList<>(List.of(module)));
        return pj;
    }

    @Test
    void diffAgainstLatest_missingProjectJSON_returnsError() {
        Map<String, Object> body = new HashMap<>();
        body.put("projectId", "p1");
        body.put("dbKey", "SNAPSHOT");

        R<?> result = dbChangeService.diffAgainstLatest(body);
        assertFalse(result.getCode() == 200);
    }

    @Test
    void saveVersion_insertRecomputesChangesServerSide_ignoresClientSuppliedChanges() {
        Map<String, Object> pj = projectJson("M1", "T_USER");
        DbChange latest = new DbChange();
        latest.setId("v0");
        latest.setVersion("1.0.0");
        latest.setProjectJSON(new HashMap<>());
        when(dbChangeMapper.selectList(any())).thenReturn(List.of(latest));
        when(dbChangeMapper.insert(any(DbChange.class))).thenReturn(1);

        DbChange incoming = new DbChange();
        incoming.setProjectId("p1");
        incoming.setDbKey("SNAPSHOT");
        incoming.setVersion("2.0.0");
        incoming.setVersionDesc("desc");
        incoming.setProjectJSON(pj);
        // 客户端伪造/过期的 changes：必须被后端重算结果覆盖，不得直接落库
        incoming.setChanges(new ArrayList<>(List.of("stale-client-changes")));

        R<?> result = dbChangeService.saveVersion(incoming);
        assertEquals(200, result.getCode());

        ArgumentCaptor<DbChange> captor = ArgumentCaptor.forClass(DbChange.class);
        org.mockito.Mockito.verify(dbChangeMapper).insert(captor.capture());
        List<Object> persistedChanges = captor.getValue().getChanges();
        assertFalse(persistedChanges.contains("stale-client-changes"));
        assertTrue(persistedChanges.stream()
                .anyMatch(c -> c instanceof Map && "add".equals(((Map<?, ?>) c).get("opt"))));
    }

    @Test
    void saveVersion_baseVersionTrueWithNoExistingHistory_stillGetsRealDiff() {
        // 首版判定（baseVersion=true）不代表 changes 该恒为空：重建基线后清空历史，
        // 首次落库时基线视为空模型，diff 仍应算出「模型里现有内容」的 add 列表，
        // 否则「模型变更」摘要与实际模型内容错位（用户看到有表却无变更摘要）。
        when(dbChangeMapper.selectList(any())).thenReturn(Collections.emptyList());
        when(dbChangeMapper.insert(any(DbChange.class))).thenReturn(1);

        DbChange incoming = new DbChange();
        incoming.setProjectId("p1");
        incoming.setDbKey("SNAPSHOT");
        incoming.setVersion("0.0.0");
        incoming.setVersionDesc("基线本");
        incoming.setBaseVersion(true);
        incoming.setProjectJSON(projectJson("M1", "T_USER"));
        incoming.setChanges(new ArrayList<>(List.of("should-be-dropped")));

        R<?> result = dbChangeService.saveVersion(incoming);
        assertEquals(200, result.getCode());

        ArgumentCaptor<DbChange> captor = ArgumentCaptor.forClass(DbChange.class);
        org.mockito.Mockito.verify(dbChangeMapper).insert(captor.capture());
        List<Object> persistedChanges = captor.getValue().getChanges();
        assertFalse(persistedChanges.contains("should-be-dropped"));
        assertTrue(persistedChanges.stream()
                .anyMatch(c -> c instanceof Map && "add".equals(((Map<?, ?>) c).get("opt"))
                        && "T_USER".equals(((Map<?, ?>) c).get("name"))));
    }
}
