package com.erdonline.erd.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.erd.dto.ProjectDto;
import com.erdonline.erd.entity.Project;
import com.erdonline.erd.mapper.ProjectMapper;
import com.erdonline.erd.security.ProjectAcl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectSaveOptimisticLockTest {

    @Mock
    private ProjectMapper projectMapper;

    @Mock
    private ProjectAcl projectAcl;

    @InjectMocks
    private ProjectServiceImpl projectService;

    @BeforeEach
    void wireMapper() {
        ReflectionTestUtils.setField(projectService, "baseMapper", projectMapper);
    }

    @Test
    void saveProject_returns409WhenRevisionMismatch() {
        String id = "proj-1";
        doNothing().when(projectAcl).assertMember(id);

        ProjectDto dto = new ProjectDto();
        dto.setId(id);
        dto.setUpdateTime(LocalDateTime.of(2026, 8, 4, 10, 0, 0));
        dto.setProjectJSON(new HashMap<>(Map.of("modules", List.of())));

        when(projectMapper.update(any(Project.class), any(Wrapper.class))).thenReturn(0);

        R<?> result = projectService.saveProject(dto);

        assertEquals(ApiErrorCode.PROJECT_SAVE_CONFLICT.getCode(), result.getCode());
        assertEquals(ApiErrorCode.PROJECT_SAVE_CONFLICT.getMsg(), result.getMsg());
    }

    @Test
    void saveProject_returnsNewUpdateTimeOnSuccess() {
        String id = "proj-2";
        LocalDateTime clientTime = LocalDateTime.of(2026, 8, 4, 10, 0, 0);
        LocalDateTime serverTime = LocalDateTime.of(2026, 8, 4, 10, 0, 5);

        doNothing().when(projectAcl).assertMember(id);

        ProjectDto dto = new ProjectDto();
        dto.setId(id);
        dto.setUpdateTime(clientTime);
        dto.setProjectJSON(new HashMap<>(Map.of("modules", List.of())));

        when(projectMapper.update(any(Project.class), any(Wrapper.class))).thenReturn(1);

        Project saved = new Project();
        saved.setId(id);
        saved.setUpdateTime(serverTime);
        when(projectMapper.selectById(eq(id))).thenReturn(saved);

        R<?> result = projectService.saveProject(dto);

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) result.getData();
        assertEquals(serverTime, payload.get("updateTime"));
    }
}
