package com.erdonline.erd.service.impl;

import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.common.security.userdetail.MartinUser;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import com.erdonline.erd.dto.DataDictApplyResult;
import com.erdonline.erd.dto.DataDictFieldDto;
import com.erdonline.erd.dto.DataDictInfoDto;
import com.erdonline.erd.entity.DataDict;
import com.erdonline.erd.mapper.DataDictMapper;
import com.erdonline.erd.security.DataDictAcl;
import com.erdonline.erd.security.DataDictScope;
import com.erdonline.erd.security.ProjectAcl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataDictServiceImplApplyTest {

    @Mock
    private DataDictMapper dataDictMapper;

    @Mock
    private DataDictAcl dataDictAcl;

    @Mock
    private ProjectAcl projectAcl;

    @Spy
    @InjectMocks
    private DataDictServiceImpl dataDictService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(dataDictService, "baseMapper", dataDictMapper);
        ReflectionTestUtils.setField(dataDictService, "clz", DataDict.class);
        bindUser("u1", "alice");
    }

    private static void bindUser(String id, String username) {
        MartinUser user = new MartinUser(
                id, null, new HashSet<>(), "0", username, "N/A",
                true, true, true, true, List.of());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(user, "n/a", List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void apply_returnsFieldsWithDictRef_andIncrementsUsage() {
        DataDict leaf = genderLeaf();
        doReturn(leaf).when(dataDictService).getById("dd-field-gender");
        when(dataDictMapper.updateById(any(DataDict.class))).thenReturn(1);

        DataDictApplyResult result = dataDictService.apply("dd-field-gender");

        assertNotNull(result);
        assertEquals("dd-field-gender", result.getDictId());
        assertEquals(1, result.getFields().size());
        assertEquals("dd-field-gender", result.getFields().get(0).getDictRef());
        assertEquals("gender", result.getFields().get(0).getName());
        assertEquals(1, result.getEnums().size());
        assertEquals("Gender", result.getEnums().get(0).getCode());
        verify(dataDictMapper).updateById(any(DataDict.class));
    }

    @Test
    void apply_rejectsNonLeaf() {
        DataDict folder = new DataDict();
        folder.setId("dd-cat-common");
        folder.setIsLeaf(false);
        folder.setScopeType(DataDictScope.PLATFORM);
        doReturn(folder).when(dataDictService).getById("dd-cat-common");

        assertThrows(ValidateException.class, () -> dataDictService.apply("dd-cat-common"));
    }

    private static DataDict genderLeaf() {
        DataDictFieldDto field = new DataDictFieldDto();
        field.setName("gender");
        field.setChnname("性别");
        field.setType("Gender");

        DataDictInfoDto info = new DataDictInfoDto();
        info.setFields(List.of(field));
        com.erdonline.erd.dto.DataDictEnumDto en = new com.erdonline.erd.dto.DataDictEnumDto();
        en.setCode("Gender");
        en.setName("性别");
        en.setKind("enum");
        info.setEnums(List.of(en));

        DataDict leaf = new DataDict();
        leaf.setId("dd-field-gender");
        leaf.setDictCode("gender");
        leaf.setTitle("性别");
        leaf.setIsLeaf(true);
        leaf.setScopeType(DataDictScope.PLATFORM);
        leaf.setUsageCount(0);
        leaf.setDictInfo(info);
        return leaf;
    }
}
