package com.erdonline.erd.controller;

import cn.hutool.core.util.IdUtil;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.vip.annotation.VIP;
import com.erdonline.common.vip.enums.VIPLevelEnum;
import com.erdonline.common.vip.enums.VIPModuleEnum;
import com.erdonline.erd.command.DBReverseMetaCommand;
import com.erdonline.erd.command.DBReverseParseCommand;
import com.erdonline.erd.command.DbSqlExecCommand;
import com.erdonline.erd.command.DbSyncCommand;
import com.erdonline.erd.command.PingDBCommand;
import com.erdonline.erd.command.SchemaProbeCommand;
import com.erdonline.erd.entity.DbVersion;
import com.erdonline.erd.security.ConnectorCredentialResolver;
import com.erdonline.erd.service.DbChangeService;
import com.erdonline.erd.service.DbVersionService;
import com.erdonline.erd.vip.rights.ProjectVersionCountRight;
import com.erdonline.erd.vip.rights.SQLAuditRight;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;


/**
 * @author 狮少
 * @version 1.0
 * @date 2020/10/26
 * @describtion ConnectorController
 * @since 1.0
 */
@Slf4j
@RestController
@RequestMapping("connector")
public class ConnectorController {
    @Autowired
    DbChangeService dbChangeService;

    @Autowired
    private DbVersionService dbVersionService;

    @Autowired
    private ConnectorCredentialResolver connectorCredentialResolver;

    @PostMapping("ping")
    public R ping(@RequestBody Map map) {
        connectorCredentialResolver.apply(map);
        PingDBCommand pingDBCommand = new PingDBCommand();
        return pingDBCommand.exec(map);
    }

    @PostMapping("dbReverseParse")
    public R dbReverseParse(@RequestBody Map map) {
        connectorCredentialResolver.apply(map);
        DBReverseParseCommand dbReverseParseCommand = new DBReverseParseCommand();
        return dbReverseParseCommand.exec(map);
    }

    /**
     * 逆向导入元数据：方言能力矩阵 + schema 列表。
     */
    @PostMapping("dbReverseMeta")
    public R dbReverseMeta(@RequestBody Map map) {
        connectorCredentialResolver.apply(map);
        return new DBReverseMetaCommand().exec(map);
    }

    /**
     * B 层实库探测：逆向 schema → 规范化指纹；与 projectJSON 对比得五态 synced/ahead/behind/diverged/unknown（ADR-0022 #8/#10）。
     * 只读；须用户显式触发，不在页面加载时自动调用。
     */
    @PostMapping("schema/probe")
    public R schemaProbe(@RequestBody Map map) {
        connectorCredentialResolver.apply(map);
        return new SchemaProbeCommand().exec(map);
    }

    @PostMapping("dbversion")
    @VIP(module = VIPModuleEnum.ERD,vipLevel = {VIPLevelEnum.NONE,VIPLevelEnum.PRO}, rights = {ProjectVersionCountRight.class}, reset = true)
    public R dbversion(@RequestBody Map map) {
        String version = dbVersionService.dbversion(map);
        if (null == version) {
            DbVersion dbVersion = new DbVersion();
            dbVersion.setProjectId((String) map.get("projectId"));
            dbVersion.setDbVersion("0.0.0");
            dbVersion.setVersionDesc("基线版本，新建版本时请勿低于该版本");
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            String createTime = LocalDateTime.now().format(formatter);
            dbVersion.setDbKey((String) map.get("dbKey"));
            dbVersionService.save(dbVersion);
            version = "0.0.0";
        }
        return R.ok(version);

    }

    @PostMapping("checkdbversion")
    public R checkdbversion(@RequestBody Map map) {
        List<String> version = dbVersionService.checkdbversion(map);
        return R.ok(version.size());

    }


    @PostMapping("rebaseline")
    public R rebaseline(@RequestBody Map map) {
        return R.ok(dbVersionService.rebaseline((map)));
    }

    @PostMapping("dbsync")
    @VIP(module = VIPModuleEnum.ERD,vipLevel = {VIPLevelEnum.NONE,VIPLevelEnum.PRO}, rights = {SQLAuditRight.class}, reset = true)
    public R dbsync(@RequestBody Map map) {
        connectorCredentialResolver.applyMutate(map);
        DbSyncCommand dbSyncCommand = new DbSyncCommand();
        R result = dbSyncCommand.exec(map);
        if (ApiErrorCode.OK.getCode() == result.getCode()) {
            dbVersionService.saveDbVersion(map);
        }
        return result;
    }


    @PostMapping("sqlexec")
    @VIP(module = VIPModuleEnum.ERD,vipLevel = {VIPLevelEnum.NONE,VIPLevelEnum.PRO}, rights = {SQLAuditRight.class}, reset = true)
    public R sqlexec(@RequestBody Map map) {
        connectorCredentialResolver.applyMutate(map);
        DbSqlExecCommand dbSqlExecCommand = new DbSqlExecCommand();
        return dbSqlExecCommand.exec(map);
    }

    @PostMapping("updateVersion")
    public R updateVersion(@RequestBody Map<String, Object> params) {
        String id = IdUtil.fastSimpleUUID();
        String version = (String) params.get("version");
        String dbKey = (String) params.get("dbKey");
        String versionDesc = (String) params.get("versionDesc");
        String projectId = (String) params.get("projectId");
        DbVersion dbVersion = new DbVersion();
        dbVersion.setId(id);
        dbVersion.setDbVersion(version);
        dbVersion.setDbKey(dbKey);
        dbVersion.setVersionDesc(versionDesc);
        dbVersion.setProjectId(projectId);
        return R.ok(dbVersionService.save(dbVersion));
    }


}
