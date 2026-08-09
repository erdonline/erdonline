package com.erdonline.erd.util;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DdlForeignKeyRendererTest {

    @Test
    void groupAssociationsForFk_mergesCompositeByConstraintName() {
        var groups = DdlForeignKeyRenderer.groupAssociationsForFk(List.of(
                Map.of(
                        "from", Map.of("entity", "order_item", "field", "order_id"),
                        "to", Map.of("entity", "orders", "field", "id"),
                        "constraintName", "fk_oi_order",
                        "deleteRule", "CASCADE"),
                Map.of(
                        "from", Map.of("entity", "order_item", "field", "shop_id"),
                        "to", Map.of("entity", "orders", "field", "shop_id"),
                        "constraintName", "fk_oi_order",
                        "updateRule", "RESTRICT")));
        assertEquals(1, groups.size());
        assertEquals(List.of("order_id", "shop_id"), groups.get(0).fromFields());
        assertEquals("CASCADE", groups.get(0).deleteRule());
        assertEquals("RESTRICT", groups.get(0).updateRule());
    }

    @Test
    void rebuildForeignKeyDdl_mysqlQuotesAndOnClauses() {
        var fk = new DdlForeignKeyRenderer.ForeignKeyGroup(
                "fk_order_user", "t_order", "t_user",
                List.of("user_id"), List.of("id"),
                "CASCADE", "RESTRICT");
        String sql = DdlForeignKeyRenderer.rebuildForeignKeyDdl(fk, "MYSQL");
        assertTrue(sql.contains("ADD CONSTRAINT `fk_order_user`"));
        assertTrue(sql.contains("ON DELETE CASCADE"));
        assertTrue(sql.contains("ON UPDATE RESTRICT"));
    }

    @Test
    void oracleSkipsOnUpdate() {
        var fk = new DdlForeignKeyRenderer.ForeignKeyGroup(
                "fk_x", "a", "b", List.of("c"), List.of("d"), null, "CASCADE");
        String sql = DdlForeignKeyRenderer.rebuildForeignKeyDdl(fk, "ORACLE");
        assertTrue(sql.contains("FOREIGN KEY"));
        assertFalse(sql.contains("ON UPDATE"));
    }

    private static void assertFalse(boolean condition) {
        org.junit.jupiter.api.Assertions.assertFalse(condition);
    }
}
