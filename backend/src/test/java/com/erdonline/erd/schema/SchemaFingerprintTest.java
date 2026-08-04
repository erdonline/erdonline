package com.erdonline.erd.schema;

import com.erdonline.erd.model.Association;
import com.erdonline.erd.model.AssociationEnd;
import com.erdonline.erd.model.Entity;
import com.erdonline.erd.model.Field;
import com.erdonline.erd.model.Index;
import com.erdonline.erd.model.Module;
import com.erdonline.erd.model.ParseDataModel;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Schema fingerprint IR + probe classification (ADR-0022 slice 8).
 */
class SchemaFingerprintTest {

    @Test
    void hash_isStable_forSameStructure() {
        ParseDataModel model = sampleLiveModel();
        SchemaFingerprint fp1 = SchemaFingerprintBuilder.fromParseDataModel(model);
        SchemaFingerprint fp2 = SchemaFingerprintBuilder.fromParseDataModel(model);
        assertEquals(SchemaFingerprintHasher.hash(fp1), SchemaFingerprintHasher.hash(fp2));
    }

    @Test
    void hash_differs_whenColumnAdded() {
        ParseDataModel base = sampleLiveModel();
        ParseDataModel changed = sampleLiveModel();
        Field extra = new Field();
        extra.setName("email");
        extra.setType("VARCHAR");
        extra.setNotNull(false);
        changed.getModule().getEntities().get(0).getFields().add(extra);

        String h1 = SchemaFingerprintHasher.hash(SchemaFingerprintBuilder.fromParseDataModel(base));
        String h2 = SchemaFingerprintHasher.hash(SchemaFingerprintBuilder.fromParseDataModel(changed));
        assertNotEquals(h1, h2);
    }

    @Test
    void probe_synced_whenLiveMatchesProjectJson() {
        ParseDataModel live = sampleLiveModel();
        Map<String, Object> projectJson = sampleProjectJson();

        SchemaProbeResult result = SchemaProbeService.probe(live, projectJson);
        assertEquals(SchemaProbeStatus.SYNCED, result.getStatus());
        assertNotNull(result.getFingerprint());
        assertEquals(result.getFingerprint(), result.getModelFingerprint());
        assertNull(result.getReason());
    }

    @Test
    void probe_ahead_whenModelHasExtraColumn() {
        ParseDataModel live = sampleLiveModel();
        Map<String, Object> projectJson = sampleProjectJson();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> entities = (List<Map<String, Object>>)
                ((List<Map<String, Object>>) projectJson.get("modules")).get(0).get("entities");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> fields = (List<Map<String, Object>>) entities.get(0).get("fields");
        fields.add(Map.of("name", "EXTRA_COL", "type", "VARCHAR", "pk", false, "notNull", false));

        SchemaProbeResult result = SchemaProbeService.probe(live, projectJson);
        assertEquals(SchemaProbeStatus.AHEAD, result.getStatus());
        assertEquals(SchemaProbeReason.FINGERPRINT_MISMATCH, result.getReason());
        assertNotEquals(result.getFingerprint(), result.getModelFingerprint());
    }

    @Test
    void probe_behind_whenLiveHasExtraColumn() {
        ParseDataModel live = sampleLiveModel();
        Field extra = new Field();
        extra.setName("email");
        extra.setType("VARCHAR");
        extra.setNotNull(false);
        live.getModule().getEntities().get(0).getFields().add(extra);
        Map<String, Object> projectJson = sampleProjectJson();

        SchemaProbeResult result = SchemaProbeService.probe(live, projectJson);
        assertEquals(SchemaProbeStatus.BEHIND, result.getStatus());
        assertEquals(SchemaProbeReason.FINGERPRINT_MISMATCH, result.getReason());
    }

    @Test
    void probe_diverged_whenBothSidesDiffer() {
        ParseDataModel live = sampleLiveModel();
        Field liveExtra = new Field();
        liveExtra.setName("email");
        liveExtra.setType("VARCHAR");
        liveExtra.setNotNull(false);
        live.getModule().getEntities().get(0).getFields().add(liveExtra);

        Map<String, Object> projectJson = sampleProjectJson();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> entities = (List<Map<String, Object>>)
                ((List<Map<String, Object>>) projectJson.get("modules")).get(0).get("entities");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> fields = (List<Map<String, Object>>) entities.get(0).get("fields");
        fields.add(Map.of("name", "EXTRA_COL", "type", "VARCHAR", "pk", false, "notNull", false));

        SchemaProbeResult result = SchemaProbeService.probe(live, projectJson);
        assertEquals(SchemaProbeStatus.DIVERGED, result.getStatus());
        assertEquals(SchemaProbeReason.FINGERPRINT_MISMATCH, result.getReason());
    }

    @Test
    void probe_ahead_whenModelHasExtraTable() {
        ParseDataModel live = sampleLiveModel();
        Map<String, Object> projectJson = sampleProjectJson();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> entities = new ArrayList<>((List<Map<String, Object>>)
                ((List<Map<String, Object>>) projectJson.get("modules")).get(0).get("entities"));
        entities.add(Map.of(
                "title", "T_ORDER",
                "fields", List.of(Map.of("name", "ID", "type", "INT", "pk", true, "notNull", true)),
                "indexs", List.of()
        ));
        @SuppressWarnings("unchecked")
        Map<String, Object> module = (Map<String, Object>) ((List<Map<String, Object>>) projectJson.get("modules")).get(0);
        module.put("entities", entities);

        SchemaProbeResult result = SchemaProbeService.probe(live, projectJson);
        assertEquals(SchemaProbeStatus.AHEAD, result.getStatus());
    }

    @Test
    void classify_diverged_onColumnTypeMismatch() {
        ParseDataModel live = sampleLiveModel();
        live.getModule().getEntities().get(0).getFields().get(1).setType("TEXT");
        Map<String, Object> projectJson = sampleProjectJson();

        SchemaProbeResult result = SchemaProbeService.probe(live, projectJson);
        assertEquals(SchemaProbeStatus.DIVERGED, result.getStatus());
    }

    @Test
    void connectionFailed_mapsPermissionErrors() {
        SchemaProbeResult result = SchemaProbeService.connectionFailed("Access denied for user 'ro'@'%'");
        assertEquals(SchemaProbeStatus.UNKNOWN, result.getStatus());
        assertEquals(SchemaProbeReason.PROBE_NO_PERMISSION, result.getReason());
    }

    @Test
    void connectionFailed_mapsUnreachable() {
        SchemaProbeResult result = SchemaProbeService.connectionFailed("Communications link failure");
        assertEquals(SchemaProbeStatus.UNKNOWN, result.getStatus());
        assertEquals(SchemaProbeReason.PROBE_CONNECTION_FAILED, result.getReason());
    }

    @Test
    void probe_unknown_withoutProjectJson() {
        SchemaProbeResult result = SchemaProbeService.probe(sampleLiveModel(), null);
        assertEquals(SchemaProbeStatus.UNKNOWN, result.getStatus());
        assertEquals(SchemaProbeReason.PROBE_NO_MODEL, result.getReason());
        assertNotNull(result.getFingerprint());
    }

    @Test
    void ignoresInfraTables_dbVersion() {
        ParseDataModel model = sampleLiveModel();
        Entity infra = new Entity();
        infra.setTitle("db_version");
        Field v = new Field();
        v.setName("db_version");
        v.setType("VARCHAR");
        infra.setFields(List.of(v));
        model.getModule().getEntities().add(infra);

        SchemaFingerprint fp = SchemaFingerprintBuilder.fromParseDataModel(model);
        assertEquals(1, fp.getTables().size());
        assertEquals("t_user", fp.getTables().get(0).getName());
    }

    private static ParseDataModel sampleLiveModel() {
        Field id = new Field();
        id.setName("ID");
        id.setType("INT");
        id.setPk(true);
        id.setNotNull(true);
        id.setAutoIncrement(true);

        Field name = new Field();
        name.setName("NAME");
        name.setType("VARCHAR");
        name.setNotNull(true);

        Index idx = new Index();
        idx.setName("idx_name");
        idx.setUnique(false);
        idx.setFields(List.of("NAME"));

        Entity entity = new Entity();
        entity.setTitle("T_USER");
        entity.setFields(new ArrayList<>(List.of(id, name)));
        entity.setIndexs(new ArrayList<>(List.of(idx)));

        AssociationEnd from = new AssociationEnd("T_ORDER", "USER_ID");
        AssociationEnd to = new AssociationEnd("T_USER", "ID");
        Association assoc = new Association(Association.RELATION_ONE_TO_MANY, from, to);
        assoc.setConstraintName("fk_order_user");

        Module module = new Module();
        module.setEntities(new ArrayList<>(List.of(entity)));
        module.setAssociations(new ArrayList<>(List.of(assoc)));

        ParseDataModel model = new ParseDataModel();
        model.setModule(module);
        return model;
    }

    private static Map<String, Object> sampleProjectJson() {
        Map<String, Object> fieldId = new HashMap<>();
        fieldId.put("name", "ID");
        fieldId.put("type", "INT");
        fieldId.put("pk", true);
        fieldId.put("notNull", true);
        fieldId.put("autoIncrement", true);

        Map<String, Object> fieldName = new HashMap<>();
        fieldName.put("name", "NAME");
        fieldName.put("type", "VARCHAR");
        fieldName.put("notNull", true);

        Map<String, Object> index = new HashMap<>();
        index.put("name", "idx_name");
        index.put("isUnique", false);
        index.put("fields", List.of("NAME"));

        Map<String, Object> entity = new HashMap<>();
        entity.put("title", "T_USER");
        entity.put("fields", new ArrayList<>(List.of(fieldId, fieldName)));
        entity.put("indexs", new ArrayList<>(List.of(index)));

        Map<String, Object> from = Map.of("entity", "T_ORDER", "field", "USER_ID");
        Map<String, Object> to = Map.of("entity", "T_USER", "field", "ID");
        Map<String, Object> association = new HashMap<>();
        association.put("from", from);
        association.put("to", to);
        association.put("constraintName", "fk_order_user");

        Map<String, Object> module = new HashMap<>();
        module.put("name", "main");
        module.put("entities", List.of(entity));
        module.put("associations", List.of(association));

        Map<String, Object> projectJson = new HashMap<>();
        projectJson.put("modules", List.of(module));
        return projectJson;
    }
}
