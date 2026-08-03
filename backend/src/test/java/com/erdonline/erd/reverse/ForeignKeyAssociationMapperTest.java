package com.erdonline.erd.reverse;

import com.erdonline.erd.model.Association;
import org.junit.jupiter.api.Test;

import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 外键 ResultSet → associations：两端均在表集内才产出；去重；字段名大小写；
 * 约束名 + ON DELETE/UPDATE（复合边同名，不聚合 fields[]）。
 */
class ForeignKeyAssociationMapperTest {

    @Test
    void mapImportedKeys_keepsInScopeFks_skipsMissingParent_dedupes() throws SQLException {
        ResultSet rs = mock(ResultSet.class);
        when(rs.next()).thenReturn(true, true, true, false);
        when(rs.getString("FKTABLE_NAME")).thenReturn("t_order", "t_order", "t_order");
        when(rs.getString("FKCOLUMN_NAME")).thenReturn("user_id", "user_id", "orphan_id");
        when(rs.getString("PKTABLE_NAME")).thenReturn("t_user", "t_user", "missing_parent");
        when(rs.getString("PKCOLUMN_NAME")).thenReturn("id", "id", "id");
        when(rs.getString("FK_NAME")).thenReturn("fk_order_user");
        when(rs.getShort("DELETE_RULE")).thenReturn((short) DatabaseMetaData.importedKeyCascade);
        when(rs.getShort("UPDATE_RULE")).thenReturn((short) DatabaseMetaData.importedKeyRestrict);
        when(rs.wasNull()).thenReturn(false);

        Map<String, String> originToDisplay = new HashMap<>(4);
        originToDisplay.put("T_ORDER", "T_ORDER");
        originToDisplay.put("T_USER", "T_USER");

        List<Association> associations =
                ForeignKeyAssociationMapper.mapImportedKeys(rs, originToDisplay, "UPPERCASE");
        assertEquals(1, associations.size());
        Association association = associations.get(0);
        assertEquals(Association.RELATION_ONE_TO_MANY, association.getRelation());
        assertEquals("T_ORDER", association.getFrom().getEntity());
        assertEquals("USER_ID", association.getFrom().getField());
        assertEquals("T_USER", association.getTo().getEntity());
        assertEquals("ID", association.getTo().getField());
        assertEquals("fk_order_user", association.getConstraintName());
        assertEquals("CASCADE", association.getDeleteRule());
        assertEquals("RESTRICT", association.getUpdateRule());
    }

    @Test
    void mapFromKeyColumnUsage_keepsCompositeOrder_sharesConstraintMeta() throws SQLException {
        ResultSet rs = mock(ResultSet.class);
        when(rs.next()).thenReturn(true, true, true, false);
        // 复合 FK (tenant_id, user_id) → t_user，再加一条缺父表
        when(rs.getString("TABLE_NAME")).thenReturn("t_order", "t_order", "t_order");
        when(rs.getString("COLUMN_NAME")).thenReturn("tenant_id", "user_id", "x_id");
        when(rs.getString("REFERENCED_TABLE_NAME")).thenReturn("t_user", "t_user", "gone");
        when(rs.getString("REFERENCED_COLUMN_NAME")).thenReturn("tenant_id", "id", "id");
        when(rs.getString("CONSTRAINT_NAME")).thenReturn("fk_order_user_tenant");
        when(rs.getString("DELETE_RULE")).thenReturn("CASCADE");
        when(rs.getString("UPDATE_RULE")).thenReturn("NO ACTION");

        Map<String, String> originToDisplay = new HashMap<>(4);
        originToDisplay.put("T_ORDER", "T_ORDER");
        originToDisplay.put("T_USER", "T_USER");

        List<Association> associations =
                ForeignKeyAssociationMapper.mapFromKeyColumnUsage(rs, originToDisplay, "UPPERCASE");
        assertEquals(2, associations.size());
        assertEquals("TENANT_ID", associations.get(0).getFrom().getField());
        assertEquals("TENANT_ID", associations.get(0).getTo().getField());
        assertEquals("USER_ID", associations.get(1).getFrom().getField());
        assertEquals("ID", associations.get(1).getTo().getField());
        assertEquals("fk_order_user_tenant", associations.get(0).getConstraintName());
        assertEquals("fk_order_user_tenant", associations.get(1).getConstraintName());
        assertEquals("CASCADE", associations.get(0).getDeleteRule());
        assertEquals("CASCADE", associations.get(1).getDeleteRule());
        assertEquals("NO ACTION", associations.get(0).getUpdateRule());
        assertEquals("NO ACTION", associations.get(1).getUpdateRule());
    }

    @Test
    void normalizeRule_mapsSqlServerUnderscores() {
        assertEquals("NO ACTION", ForeignKeyAssociationMapper.normalizeRule("NO_ACTION"));
        assertEquals("SET NULL", ForeignKeyAssociationMapper.normalizeRule("SET_NULL"));
        assertEquals("SET DEFAULT", ForeignKeyAssociationMapper.normalizeRule("SET_DEFAULT"));
        assertEquals("CASCADE", ForeignKeyAssociationMapper.normalizeRule(" cascade "));
        assertNull(ForeignKeyAssociationMapper.normalizeRule("  "));
        assertNull(ForeignKeyAssociationMapper.normalizeRule(null));
    }

    @Test
    void mapJdbcRule_coversImportedKeyConstants() {
        assertEquals("CASCADE",
                ForeignKeyAssociationMapper.mapJdbcRule((short) DatabaseMetaData.importedKeyCascade));
        assertEquals("SET NULL",
                ForeignKeyAssociationMapper.mapJdbcRule((short) DatabaseMetaData.importedKeySetNull));
        assertEquals("NO ACTION",
                ForeignKeyAssociationMapper.mapJdbcRule((short) DatabaseMetaData.importedKeyNoAction));
        assertNull(ForeignKeyAssociationMapper.mapJdbcRule(null));
    }
}
