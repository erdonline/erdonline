package com.erdonline.erd.service.impl;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.erdonline.erd.entity.DataSources;
import com.erdonline.erd.mapper.DataSourcesMapper;
import com.erdonline.erd.security.DataSourceCredentialCipher;
import com.erdonline.erd.service.DataSourcesService;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.Serializable;
import java.util.List;

/**
 * 数据源 服务实现
 *
 * <p>R-DATA-06：{@code username}/{@code password} 经本 Service 落库前用
 * {@link DataSourceCredentialCipher} 加密，取出后解密，对上层（Controller/
 * {@code ConnectorCredentialResolver} 等）透明——它们仍读写明文。绕过本 Service
 * 直查 {@code DataSourcesMapper} 的路径（{@code DataSourceAcl}）须自行调用 cipher 解密。</p>
 *
 * @author 零代科技
 * @version 1.0
 * @date 2024-09-07
 * @describtion
 * @since 1.0
 */
@Service
@RequiredArgsConstructor
public class DataSourcesServiceImpl extends MartinServiceImpl<DataSourcesMapper, DataSources> implements DataSourcesService {

    private final DataSourceCredentialCipher credentialCipher;

    @Override
    protected void setEntity() {
        this.clz = DataSources.class;
    }

    @Override
    public boolean save(DataSources entity) {
        credentialCipher.encryptInPlace(entity);
        return super.save(entity);
    }

    @Override
    public boolean updateById(DataSources entity) {
        credentialCipher.encryptInPlace(entity);
        return super.updateById(entity);
    }

    @Override
    public boolean update(DataSources entity, Wrapper<DataSources> updateWrapper) {
        credentialCipher.encryptInPlace(entity);
        return super.update(entity, updateWrapper);
    }

    @Override
    public DataSources getById(Serializable id) {
        DataSources ds = super.getById(id);
        credentialCipher.decryptInPlace(ds);
        return ds;
    }

    @Override
    public List<DataSources> list(Wrapper<DataSources> queryWrapper) {
        List<DataSources> result = super.list(queryWrapper);
        result.forEach(credentialCipher::decryptInPlace);
        return result;
    }

    @Override
    public <E extends IPage<DataSources>> E page(E page, Wrapper<DataSources> queryWrapper) {
        E result = super.page(page, queryWrapper);
        result.getRecords().forEach(credentialCipher::decryptInPlace);
        return result;
    }
}
