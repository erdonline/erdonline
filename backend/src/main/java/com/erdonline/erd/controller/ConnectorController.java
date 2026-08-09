package com.erdonline.erd.controller;

import cn.hutool.core.util.IdUtil;
import com.erdonline.common.core.api.ApiErrorCode;
import com.erdonline.common.core.api.R;
import com.erdonline.common.core.exception.ValidateException;
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
import com.erdonline.erd.schema.SchemaProbeReason;
import com.erdonline.erd.schema.SchemaProbeResult;
import com.erdonline.erd.schema.SchemaProbeStatus;
import com.erdonline.erd.security.ConnectorCredentialResolver;
import com.erdonline.erd.security.SchemaProbeAccessGuard;
import com.erdonline.erd.security.annotation.DbKey;
import com.erdonline.erd.security.annotation.ProjectId;
import com.erdonline.erd.security.annotation.RequireProjectAccess;
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

    @Autowired
    private SchemaProbeAccessGuard schemaProbeAccessGuard;

    @RequireProjectAccess
    @PostMapping("ping")
    public R ping(@ProjectId @RequestBody Map map) {
        connectorCredentialResolver.apply(map);
        PingDBCommand pingDBCommand = new PingDBCommand();
        return pingDBCommand.exec(map);
    }

    @RequireProjectAccess
    @PostMapping("dbReverseParse")
    public R dbReverseParse(@ProjectId @RequestBody Map map) {
        connectorCredentialResolver.apply(map);
        DBReverseParseCommand dbReverseParseCommand = new DBReverseParseCommand();
        return dbReverseParseCommand.exec(map);
    }

    /**
     * 逆向导入元数据：方言能力矩阵 + schema 列表。
     */
    @RequireProjectAccess
    @PostMapping("dbReverseMeta")
    public R dbReverseMeta(@ProjectId @RequestBody Map map) {
        connectorCredentialResolver.apply(map);
        return new DBReverseMetaCommand().exec(map);
    }

    /**
     * B 层实库探测：逆向 schema → 规范化指纹；与 projectJSON 对比得五态 synced/ahead/behind/diverged/unknown（ADR-0022 #8/#10）。
     * 只读；须用户显式触发，不在页面加载时自动调用。
     */
    @PostMapping("schema/probe")
    public R schemaProbe(@RequestBody Map map) {
        try {
            schemaProbeAccessGuard.assertCanProbe(map);
            connectorCredentialResolver.applyProbe(map);
        } catch (ValidateException e) {
            if (e.getStatus() == ApiErrorCode.FORBIDDEN.getCode()) {
                SchemaProbeResult denied = SchemaProbeResult.builder()
                        .status(SchemaProbeStatus.UNKNOWN)
                        .reason(SchemaProbeReason.PROBE_ACL_DENIED)
                        .message(e.getMessage())
                        .build();
                R failed = R.failed(e.getStatus(), e.getMessage());
                failed.setData(denied);
                return failed;
            }
            return e.getStatus() != 0 ? R.failed(e.getStatus(), e.getMessage()) : R.failed(e.getMessage());
        }
        return new SchemaProbeCommand().exec(map);
    }

    @RequireProjectAccess
    @PostMapping("dbversion")
    @VIP(module = VIPModuleEnum.ERD,vipLevel = {VIPLevelEnum.NONE,VIPLevelEnum.PRO}, rights = {ProjectVersionCountRight.class}, reset = true)
    public R dbversion(@ProjectId @DbKey @RequestBody Map map) {
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

    @RequireProjectAccess
    @PostMapping("checkdbversion")
    public R checkdbversion(@ProjectId @DbKey @RequestBody Map map) {
        List<String> version = dbVersionService.checkdbversion(map);
        return R.ok(version.size());

    }


    @RequireProjectAccess
    @PostMapping("rebaseline")
    public R rebaseline(@ProjectId @DbKey @RequestBody Map map) {
        return R.ok(dbVersionService.rebaseline((map)));
    }

    // 成员 + db_key 归属须在真正对目标库下发 DDL/DML 之前断言（@RequireProjectAccess 在方法体
    // 之前触发），否则非成员/伪造 dbKey 也能先把 SQL 打到已鉴权的 dataSourceId 上再被拒绝（为时已晚）。
    @RequireProjectAccess
    @PostMapping("dbsync")
    @VIP(module = VIPModuleEnum.ERD,vipLevel = {VIPLevelEnum.NONE,VIPLevelEnum.PRO}, rights = {SQLAuditRight.class}, reset = true)
    public R dbsync(@ProjectId @DbKey @RequestBody Map map) {
        connectorCredentialResolver.applyMutate(map);
        DbSyncCommand dbSyncCommand = new DbSyncCommand();
        R result = dbSyncCommand.exec(map);
        if (ApiErrorCode.OK.getCode() == result.getCode()) {
            dbVersionService.saveDbVersion(map);
        }
        return result;
    }


    @RequireProjectAccess
    @PostMapping("sqlexec")
    @VIP(module = VIPModuleEnum.ERD,vipLevel = {VIPLevelEnum.NONE,VIPLevelEnum.PRO}, rights = {SQLAuditRight.class}, reset = true)
    public R sqlexec(@ProjectId @RequestBody Map map) {
        connectorCredentialResolver.applyMutate(map);
        DbSqlExecCommand dbSqlExecCommand = new DbSqlExecCommand();
        return dbSqlExecCommand.exec(map);
    }

    @RequireProjectAccess
    @PostMapping("updateVersion")
    public R updateVersion(@ProjectId @DbKey @RequestBody Map<String, Object> params) {
        String id = IdUtil.fastSimpleUUID();
        String version = (String) params.get("version");
        String versionDesc = (String) params.get("versionDesc");
        DbVersion dbVersion = new DbVersion();
        dbVersion.setId(id);
        dbVersion.setDbVersion(version);
        dbVersion.setDbKey((String) params.get("dbKey"));
        dbVersion.setVersionDesc(versionDesc);
        dbVersion.setProjectId((String) params.get("projectId"));
        return R.ok(dbVersionService.saveWithCanonicalDbKey(dbVersion));
    }


}
