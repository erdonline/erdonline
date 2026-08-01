package com.erdonline.erd.service.impl;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.erdonline.common.core.api.R;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.entity.Project;
import com.erdonline.erd.entity.ProjectShare;
import com.erdonline.erd.mapper.ProjectShareMapper;
import com.erdonline.erd.service.ProjectService;
import com.erdonline.erd.service.ProjectShareService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 只读分享：token → 项目名 + projectJSON（不含写权限）。
 *
 * @author erdonline
 */
@Service
@RequiredArgsConstructor
public class ProjectShareServiceImpl extends ServiceImpl<ProjectShareMapper, ProjectShare>
        implements ProjectShareService {

    private static final String ENABLED = "1";
    private static final String DISABLED = "0";

    private final ProjectService projectService;

    @Override
    public R createShare(String projectId) {
        if (!StringUtils.hasText(projectId)) {
            return R.failed("projectId 不能为空");
        }
        Project project = projectService.getById(projectId);
        if (project == null) {
            return R.failed("项目不存在");
        }
        var accessUser = SecurityContextUtil.getAccessUser();
        String userId = accessUser.getId();
        String username = accessUser.getUsername();
        // 历史数据 creator 可能是 username 或 userId
        String creator = project.getCreator();
        if (creator != null
                && !creator.equals(userId)
                && !creator.equals(username)) {
            return R.failed("仅项目创建人可分享");
        }

        ProjectShare existing = getOne(new LambdaQueryWrapper<ProjectShare>()
                .eq(ProjectShare::getProjectId, projectId)
                .eq(ProjectShare::getEnabled, ENABLED)
                .and(w -> w.isNull(ProjectShare::getExpireTime)
                        .or()
                        .gt(ProjectShare::getExpireTime, LocalDateTime.now()))
                .last("LIMIT 1"));
        if (existing != null) {
            return R.ok(toCreatePayload(existing.getToken()));
        }

        ProjectShare share = new ProjectShare();
        share.setToken(IdUtil.fastSimpleUUID());
        share.setProjectId(projectId);
        share.setEnabled(ENABLED);
        save(share);
        return R.ok(toCreatePayload(share.getToken()));
    }

    @Override
    public R getByToken(String token) {
        if (!StringUtils.hasText(token)) {
            return R.failed("token 无效");
        }
        ProjectShare share = getOne(new LambdaQueryWrapper<ProjectShare>()
                .eq(ProjectShare::getToken, token)
                .eq(ProjectShare::getEnabled, ENABLED)
                .last("LIMIT 1"));
        if (share == null) {
            return R.failed("分享不存在或已失效");
        }
        if (share.getExpireTime() != null && share.getExpireTime().isBefore(LocalDateTime.now())) {
            return R.failed("分享已过期");
        }
        Project project = projectService.getById(share.getProjectId());
        if (project == null) {
            return R.failed("项目不存在");
        }
        Map<String, Object> payload = new HashMap<>(8);
        payload.put("readonly", Boolean.TRUE);
        payload.put("projectId", project.getId());
        payload.put("projectName", project.getProjectName());
        payload.put("description", project.getDescription());
        payload.put("projectJSON", sanitizeProjectJson(project.getProjectJSON()));
        payload.put("configJSON", project.getConfigJSON());
        return R.ok(payload);
    }

    /**
     * 脱敏 profile.dbs.*.properties 中的 password / username 敏感字段。
     */
    @SuppressWarnings("unchecked")
    static Map<String, Object> sanitizeProjectJson(Map<String, Object> projectJson) {
        if (projectJson == null || projectJson.isEmpty()) {
            return projectJson;
        }
        Map<String, Object> copy = deepCopyMap(projectJson);
        Object profileObj = copy.get("profile");
        if (!(profileObj instanceof Map)) {
            return copy;
        }
        Map<String, Object> profile = (Map<String, Object>) profileObj;
        Object dbsObj = profile.get("dbs");
        if (!(dbsObj instanceof Iterable)) {
            return copy;
        }
        for (Object dbObj : (Iterable<?>) dbsObj) {
            if (!(dbObj instanceof Map)) {
                continue;
            }
            Map<String, Object> db = (Map<String, Object>) dbObj;
            Object propsObj = db.get("properties");
            if (propsObj instanceof Map) {
                Map<String, Object> props = (Map<String, Object>) propsObj;
                maskSecret(props, "password");
                maskSecret(props, "username");
            }
            maskSecret(db, "password");
            maskSecret(db, "username");
        }
        return copy;
    }

    private static void maskSecret(Map<String, Object> map, String key) {
        if (map.containsKey(key) && map.get(key) != null && !String.valueOf(map.get(key)).isEmpty()) {
            map.put(key, "***");
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> deepCopyMap(Map<String, Object> source) {
        Map<String, Object> result = new HashMap<>(source.size() * 2);
        for (Map.Entry<String, Object> entry : source.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof Map) {
                result.put(entry.getKey(), deepCopyMap((Map<String, Object>) value));
            } else if (value instanceof Iterable && !(value instanceof String)) {
                java.util.List<Object> list = new java.util.ArrayList<>();
                for (Object item : (Iterable<?>) value) {
                    if (item instanceof Map) {
                        list.add(deepCopyMap((Map<String, Object>) item));
                    } else {
                        list.add(item);
                    }
                }
                result.put(entry.getKey(), list);
            } else {
                result.put(entry.getKey(), value);
            }
        }
        return result;
    }

    @Override
    public R revoke(String token) {
        if (!StringUtils.hasText(token)) {
            return R.failed("token 无效");
        }
        ProjectShare share = getOne(new LambdaQueryWrapper<ProjectShare>()
                .eq(ProjectShare::getToken, token)
                .last("LIMIT 1"));
        if (share == null) {
            return R.failed("分享不存在");
        }
        share.setEnabled(DISABLED);
        updateById(share);
        return R.ok(Boolean.TRUE);
    }

    private static Map<String, Object> toCreatePayload(String token) {
        Map<String, Object> payload = new HashMap<>(4);
        payload.put("token", token);
        payload.put("path", "/ncnb/share/" + token);
        return payload;
    }
}
