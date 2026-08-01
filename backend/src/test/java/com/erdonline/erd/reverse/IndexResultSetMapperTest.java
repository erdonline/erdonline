package com.erdonline.erd.reverse;

import com.erdonline.erd.model.Index;
import com.erdonline.erd.util.JsonUtil;
import org.junit.jupiter.api.Test;

import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 索引 ResultSet 映射：PRIMARY 跳过、唯一/复合、STATISTICS 与 JDBC 两种来源。
 */
class IndexResultSetMapperTest {

    @Test
    void mapFromJdbcIndexInfo_skipsPrimaryAndStatistic_groupsComposite() throws SQLException {
        ResultSet rs = mock(ResultSet.class);
        when(rs.next()).thenReturn(true, true, true, true, true, false);
        when(rs.getShort("TYPE")).thenReturn(
                DatabaseMetaData.tableIndexOther,
                DatabaseMetaData.tableIndexOther,
                DatabaseMetaData.tableIndexOther,
                DatabaseMetaData.tableIndexOther,
                DatabaseMetaData.tableIndexStatistic);
        when(rs.getString("INDEX_NAME")).thenReturn("PRIMARY", "uk_code_name", "uk_code_name", "idx_email", null);
        // PRIMARY 行提前 continue，不读 COLUMN_NAME / NON_UNIQUE
        when(rs.getString("COLUMN_NAME")).thenReturn("code", "name", "email");
        when(rs.getBoolean("NON_UNIQUE")).thenReturn(false, false, true);

        List<Index> indexes = IndexResultSetMapper.mapFromJdbcIndexInfo(rs, "DEFAULT");
        assertEquals(2, indexes.size());

        Index uniqueIndex = indexes.get(0);
        assertEquals("uk_code_name", uniqueIndex.getName());
        assertTrue(uniqueIndex.isUnique());
        assertEquals(List.of("code", "name"), uniqueIndex.getFields());

        Index normalIndex = indexes.get(1);
        assertEquals("idx_email", normalIndex.getName());
        assertFalse(normalIndex.isUnique());
        assertEquals(List.of("email"), normalIndex.getFields());
    }

    @Test
    void mapFromStatistics_respectsLowcaseAndNonUnique() throws SQLException {
        ResultSet rs = mock(ResultSet.class);
        when(rs.next()).thenReturn(true, true, false);
        when(rs.getString("INDEX_NAME")).thenReturn("IDX_USER", "IDX_USER");
        when(rs.getString("COLUMN_NAME")).thenReturn("USER_ID", "TENANT_ID");
        when(rs.getInt("NON_UNIQUE")).thenReturn(1, 1);

        List<Index> indexes = IndexResultSetMapper.mapFromStatistics(rs, "LOWCASE");
        assertEquals(1, indexes.size());
        assertEquals("idx_user", indexes.get(0).getName());
        assertFalse(indexes.get(0).isUnique());
        assertEquals(List.of("user_id", "tenant_id"), indexes.get(0).getFields());
    }

    @Test
    void indexJson_usesIsUniqueProperty() {
        Index index = new Index("idx_a", true);
        index.getFields().add("a");
        String json = JsonUtil.generate(index);
        assertTrue(json.contains("\"isUnique\":true"), json);
        assertTrue(json.contains("\"name\":\"idx_a\""), json);
    }
}
