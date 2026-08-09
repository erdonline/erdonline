package com.erdonline.erd.service;

import com.erdonline.common.core.api.R;
import com.erdonline.common.data.mybatis.service.MartinService;
import com.erdonline.erd.entity.DbChange;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * <p>
 * 版本表 服务类
 * </p>
 *
 * @author 狮少
 * @since 2020-10-28
 */
@Transactional(rollbackFor = Exception.class)
public interface DbChangeService extends MartinService<DbChange> {

    /**
     * 查询历史版本
     *
     * @param map
     * @return
     */
    R loadHistory(Map map);


    /**
     * 查询历史版本，只查询版本信息
     *
     * @param projectId
     * @return
     */
    List<DbChange> loadHistoryVersion(String projectId,String dbKey);

    /**
     * 删除版本
     *
     * @param projectId
     * @return
     */
    R deleteHistory(String changeId);

    /**
     * 删除项目下所有版本版本
     *
     * @param dbChange
     * @return
     */
    R deleteAllHistory(DbChange dbChange);

    /**
     * byte[]字段转json
     *
     * @param dbChanges
     * @return
     */
    R getHashMapsByDbChanges(List<DbChange> dbChanges);

    /**
     * 保存或更新历史版本；tag 为逗号分隔多标签，不做跨版本唯一校验。
     */
    R saveVersion(DbChange dbChange);

    /**
     * A 层全量 structural diff（后端权威）：当前模型 ↔ 最新版本基线（或显式传入的基线）。
     * 「未保存版本」/ 比对面板必须消费同一份后端算法结果，前端只展示（ADR-0022 延伸）。
     *
     * @param body {@code projectId}、{@code dbKey}、{@code projectJSON}（当前模型）必填；
     *             {@code baselineProjectJSON} 可选——传入则直接对该基线 diff，不查库（用于历史版本两两比对）
     */
    R diffAgainstLatest(Map<String, Object> body);

    /**
     * 版本同步 SQL（全量 / 增量）；与 {@link com.erdonline.erd.util.VersionSyncSqlEngine} 同源。
     *
     * @param body {@code projectJSON}、{@code dialectCode}、{@code mode}（full|incremental）必填；
     *             incremental 时需 {@code baselineProjectJSON} 或 {@code changes}；
     *             {@code upgradeType} 可选（increment|rebuild）
     */
    R generateSyncSql(Map<String, Object> body);
}
