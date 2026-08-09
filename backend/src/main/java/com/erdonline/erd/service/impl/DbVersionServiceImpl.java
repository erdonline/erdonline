package com.erdonline.erd.service.impl;

import cn.hutool.core.util.StrUtil;
import com.erdonline.common.data.mybatis.service.impl.MartinServiceImpl;
import com.erdonline.erd.entity.DbVersion;
import com.erdonline.erd.mapper.DbVersionMapper;
import com.erdonline.erd.security.VersionDbKeyGuard;
import com.erdonline.erd.service.DbVersionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * <p>
 * 服务实现类
 * </p>
 *
 * @author 狮少
 * @since 2020-10-29
 */
@Service
public class DbVersionServiceImpl extends MartinServiceImpl<DbVersionMapper, DbVersion> implements DbVersionService {

    @Autowired
    private VersionDbKeyGuard dbKeyGuard;

    // 项目成员 + db_key 归属校验已由 ConnectorController 方法上的 @RequireProjectAccess
    // + ProjectAccessAspect 在方法体执行前统一完成，此处只做别名归一化（业务逻辑，非鉴权）。

    @Override
    public String dbversion(Map map) {
        canonicalizeDbKey(map);
        return baseMapper.dbversion(map);
    }

    @Override
    public List<String> checkdbversion(Map map) {
        canonicalizeDbKey(map);
        return baseMapper.checkdbversion(map);
    }

    @Override
    public Integer rebaseline(Map map) {
        canonicalizeDbKey(map);
        return baseMapper.rebaseline(map);
    }

    @Override
    public Boolean saveDbVersion(Map map) {
        canonicalizeDbKey(map);
        DbVersion dbVersion = new DbVersion();
        dbVersion.setDbVersion((String) map.get("version"));
        dbVersion.setVersionDesc((String) map.get("versionDesc"));
        dbVersion.setProjectId((String) map.get("projectId"));
        dbVersion.setDbKey((String) map.get("dbKey"));
        return this.save(dbVersion);
    }

    @Override
    public Boolean saveWithCanonicalDbKey(DbVersion dbVersion) {
        if (dbVersion != null
                && StrUtil.isNotBlank(dbVersion.getProjectId())
                && StrUtil.isNotBlank(dbVersion.getDbKey())) {
            dbVersion.setDbKey(dbKeyGuard.resolveDbKey(dbVersion.getProjectId(), dbVersion.getDbKey()));
        }
        return this.save(dbVersion);
    }

    /** 把 map 里的 dbKey 别名（SNAPSHOT/defaultDB 等）归一化为规范值，供下游 mapper/#{dbKey} 使用。 */
    @SuppressWarnings("unchecked")
    private void canonicalizeDbKey(Map map) {
        Object projectIdRaw = map == null ? null : map.get("projectId");
        String projectId = projectIdRaw == null ? null : String.valueOf(projectIdRaw);
        Object dbKeyRaw = map == null ? null : map.get("dbKey");
        String dbKey = dbKeyRaw == null ? null : String.valueOf(dbKeyRaw);
        if (map != null && dbKeyRaw != null) {
            map.put("dbKey", dbKeyGuard.resolveDbKey(projectId, dbKey));
        }
    }

    @Override
    protected void setEntity() {
        this.clz = DbVersion.class;

    }
}
