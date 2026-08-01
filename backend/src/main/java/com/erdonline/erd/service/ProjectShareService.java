package com.erdonline.erd.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.erdonline.common.core.api.R;
import com.erdonline.erd.entity.ProjectShare;

import java.util.Map;

/**
 * 项目只读分享。
 *
 * @author erdonline
 */
public interface ProjectShareService extends IService<ProjectShare> {

    /**
     * 为项目创建（或复用未过期）分享令牌。
     */
    R createShare(String projectId);

    /**
     * 匿名读取只读快照。
     */
    R getByToken(String token);

    /**
     * 禁用分享。
     */
    R revoke(String token);
}
