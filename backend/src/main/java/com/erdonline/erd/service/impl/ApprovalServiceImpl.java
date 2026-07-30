package com.erdonline.erd.service.impl;

import com.erdonline.common.core.api.R;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.entity.Approval;
import com.erdonline.erd.mapper.ApprovalMapper;
import com.erdonline.erd.service.ApprovalService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 元数据审批  服务实现类
 * </p>
 *
 * @author 零代科技
 * @version 1.0
 * @date 2023-03-26
 * @describtion
 * @since 1.0
 */
@Service
public class ApprovalServiceImpl extends MartinServiceImpl<ApprovalMapper, Approval> implements ApprovalService {
    @Override
    protected void setEntity() {
        this.clz = Approval.class;
    }

    @Override
    public R syncBdVersion(String versionId) {
        String userId = SecurityContextUtil.getAccessUser().getId();
        return R.ok(this.baseMapper.syncBdVersion(versionId, userId));
    }
}
