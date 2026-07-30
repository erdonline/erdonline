package com.erdonline.system.service.impl;

import com.erdonline.system.entity.SysAnnouncement;
import com.erdonline.system.mapper.SysAnnouncementMapper;
import com.erdonline.system.service.SysAnnouncementService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * 公告表  服务实现
 *
 * @author 零代科技
 * @version 1.0
 * @date 2023-10-04
 * @describtion
 * @since 1.0
 */
@Service
public class SysAnnouncementServiceImpl extends MartinServiceImpl<SysAnnouncementMapper, SysAnnouncement> implements SysAnnouncementService {
    @Override
    protected void setEntity() {
        this.clz = SysAnnouncement.class;
    }
}
