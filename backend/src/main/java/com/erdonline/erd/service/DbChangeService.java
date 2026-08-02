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
     * 保存或更新历史版本；同项目内非空 tag 唯一，冲突时返回失败且不落库。
     */
    R saveVersion(DbChange dbChange);

    /**
     * 同项目内是否已存在相同非空标签（更新时排除自身）。
     */
    boolean isTagTaken(String projectId, String tag, String excludeId);
}
