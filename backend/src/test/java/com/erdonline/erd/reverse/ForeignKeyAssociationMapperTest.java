package com.erdonline.erd.reverse;

import com.erdonline.erd.model.Association;
import org.junit.jupiter.api.Test;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 外键 ResultSet → associations：两端均在表集内才产出；去重；字段名大小写。
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
    }

    @Test
    void mapFromKeyColumnUsage_keepsCompositeOrder_skipsMissingParent() throws SQLException {
        ResultSet rs = mock(ResultSet.class);
        when(rs.next()).thenReturn(true, true, true, false);
        // 复合 FK (tenant_id, user_id) → t_user，再加一条缺父表
        when(rs.getString("TABLE_NAME")).thenReturn("t_order", "t_order", "t_order");
        when(rs.getString("COLUMN_NAME")).thenReturn("tenant_id", "user_id", "x_id");
        when(rs.getString("REFERENCED_TABLE_NAME")).thenReturn("t_user", "t_user", "gone");
        when(rs.getString("REFERENCED_COLUMN_NAME")).thenReturn("tenant_id", "id", "id");

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
    }
}
