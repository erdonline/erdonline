package com.erdonline.erd.security;

import cn.hutool.core.util.StrUtil;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.exception.ValidateException;
import com.erdonline.common.security.userdetail.MartinUser;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.entity.DataSources;
import com.erdonline.erd.entity.Project;
import com.erdonline.erd.mapper.DataSourcesMapper;
import com.erdonline.erd.service.ProjectService;
import com.erdonline.erd.util.VersionDbKeyResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 版本通道（{@code db_key}）与项目成员的统一守卫：hisProject / dbChange / db_version / Public API
 * 版本相关路径共用同一份校验，禁止各自为政地重复/遗漏。
 *
 * <p>威胁模型：{@code db_key} 对齐产品 JDBC 通道时等于 {@code data_sources.id}；该表按 creator
 * 归属（无 project_id 列，见 ADR-0008）。因此"属于当前项目"在此定义为：
 * 调用者是 {@code projectId} 的成员（{@link ProjectAcl}），且 {@code db_key} 解析后的规范值
 * 要么是快照哨兵 {@link VersionDbKeyResolver#SNAPSHOT_KEY}，要么是调用者自己名下的
 * {@code data_sources.id}（{@link DataSourceAcl} 同款 creator 归属判定）。伪造/越权的
 * {@code db_key}（他人或他项目的 dataSourceId、任意字符串）一律 403，不做静默改写。</p>
 */
@Component
@RequiredArgsConstructor
public class VersionDbKeyGuard {

    private final ProjectAcl projectAcl;
    private final ProjectService projectService;
    private final DataSourcesMapper dataSourcesMapper;

    /** 项目成员断言；未登录/非成员一律 403（{@link ProjectAcl#assertMember} 透传）。 */
    public void assertMember(String projectId) {
        projectAcl.assertMember(projectId);
    }

    /**
     * 仅做旧别名归一化（ADR-0008 legacy alias → 规范键），不做归属校验。
     * 用于 dbKey 为可选过滤条件、且已在别处完成归属校验的场景。
     */
    public String resolveDbKey(String projectId, String dbKey) {
        if (StrUtil.isBlank(dbKey)) {
            return dbKey;
        }
        String defaultDataSourceId = null;
        if (StrUtil.isNotBlank(projectId)) {
            Project project = projectService.getById(projectId);
            if (project != null) {
                defaultDataSourceId = VersionDbKeyResolver.defaultDataSourceIdFromProjectJson(project.getProjectJSON());
            }
        }
        return VersionDbKeyResolver.resolve(dbKey, defaultDataSourceId);
    }

    /**
     * 版本读写的统一入口：成员校验 → 别名归一化 → 归属校验，返回规范 {@code db_key}。
     * 空 {@code dbKey}（如列表页不按通道过滤）直接放行返回原值；非空则必须是快照哨兵
     * 或调用者名下的 {@code data_sources.id}，否则 403（fail-closed，不静默改写/降级）。
     */
    public String assertDbKeyBelongsToCaller(String projectId, String dbKey) {
        assertMember(projectId);
        String canonical = resolveDbKey(projectId, dbKey);
        if (StrUtil.isBlank(canonical)) {
            return canonical;
        }
        if (VersionDbKeyResolver.SNAPSHOT_KEY.equals(canonical)) {
            return canonical;
        }
        MartinUser user = SecurityContextUtil.getAccessUser();
        DataSources ds = dataSourcesMapper.selectById(canonical);
        if (ds == null || !ResourceOwnership.matchesCreator(ds.getCreator(), user.getId(), user.getUsername())) {
            throw new ValidateException(ApiErrorCode.FORBIDDEN);
        }
        return canonical;
    }
}
