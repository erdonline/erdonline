package com.erdonline.erd.plaza.service.impl;

import com.erdonline.erd.plaza.entity.MaterialDownload;
import com.erdonline.erd.plaza.mapper.MaterialDownloadMapper;
import com.erdonline.erd.plaza.service.MaterialDownloadService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import org.springframework.stereotype.Service;

/**
 * 下载记录表 服务实现
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-10-27
 * @describtion
 * @since 1.0
 */
@Service
public class MaterialDownloadServiceImpl extends MartinServiceImpl<MaterialDownloadMapper, MaterialDownload> implements MaterialDownloadService {
    @Override
    protected void setEntity() {
        this.clz = MaterialDownload.class;
    }
}
