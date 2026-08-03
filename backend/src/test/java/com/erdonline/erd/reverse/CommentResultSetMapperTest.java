package com.erdonline.erd.reverse;

import org.junit.jupiter.api.Test;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * 注释 ResultSet 映射：跳过空 REMARKS；列名受 nameCase 影响。
 */
class CommentResultSetMapperTest {

    @Test
    void mapTableComments_skipsBlankAndKeepsNonEmpty() throws SQLException {
        ResultSet rs = mock(ResultSet.class);
        when(rs.next()).thenReturn(true, true, true, false);
        when(rs.getString("TABLE_NAME")).thenReturn("t_user", "t_order", "t_empty");
        when(rs.getString("REMARKS")).thenReturn("用户表", "订单表", "");

        Map<String, String> comments = CommentResultSetMapper.mapTableComments(rs);
        assertEquals(2, comments.size());
        assertEquals("用户表", comments.get("t_user"));
        assertEquals("订单表", comments.get("t_order"));
        assertFalse(comments.containsKey("t_empty"));
    }

    @Test
    void mapColumnComments_respectsLowcaseAndSkipsNull() throws SQLException {
        ResultSet rs = mock(ResultSet.class);
        when(rs.next()).thenReturn(true, true, true, false);
        when(rs.getString("COLUMN_NAME")).thenReturn("USER_ID", "EMAIL", "CODE");
        when(rs.getString("REMARKS")).thenReturn("用户ID", null, "编码");

        Map<String, String> comments = CommentResultSetMapper.mapColumnComments(rs, "LOWCASE");
        assertEquals(2, comments.size());
        assertEquals("用户ID", comments.get("user_id"));
        assertEquals("编码", comments.get("code"));
        assertTrue(!comments.containsKey("email") && !comments.containsKey("EMAIL"));
    }

    /**
     * Oracle ALL_TAB_COMMENTS / ALL_COL_COMMENTS 别名后形状：大写标识符 + REMARKS。
     */
    @Test
    void mapComments_oracleDictionaryShape_upperIdentifiers() throws SQLException {
        ResultSet tableRs = mock(ResultSet.class);
        when(tableRs.next()).thenReturn(true, true, false);
        when(tableRs.getString("TABLE_NAME")).thenReturn("T_USER", "T_ORDER");
        when(tableRs.getString("REMARKS")).thenReturn("用户表", "订单表");

        Map<String, String> tableComments = CommentResultSetMapper.mapTableComments(tableRs);
        assertEquals("用户表", tableComments.get("T_USER"));
        assertEquals("订单表", tableComments.get("T_ORDER"));

        ResultSet columnRs = mock(ResultSet.class);
        when(columnRs.next()).thenReturn(true, true, false);
        when(columnRs.getString("COLUMN_NAME")).thenReturn("USER_ID", "STATUS");
        when(columnRs.getString("REMARKS")).thenReturn("用户ID", "状态");

        Map<String, String> columnComments =
                CommentResultSetMapper.mapColumnComments(columnRs, "DEFAULT");
        assertEquals("用户ID", columnComments.get("USER_ID"));
        assertEquals("状态", columnComments.get("STATUS"));
    }
}
