package com.erdonline.erd.service;

import com.erdonline.erd.entity.DbChange;

import java.util.Map;

/**
 * 版本保存归因落库（append-only，失败不影响存版主流程）。
 */
public interface VersionAttributionService {

    void recordIfPresent(DbChange saved, Map<String, Object> attribution);
}
