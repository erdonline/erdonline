package com.erdonline.erd.security;

import cn.hutool.core.util.StrUtil;
import com.erdonline.erd.entity.DataDict;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 字段库 scope ACL：platform 只读；group=项目成员；user=本人。
 */
@Component
@RequiredArgsConstructor
public class DataDictAcl {

    private final ProjectAcl projectAcl;

    public boolean canRead(DataDict record, String userId, String username) {
        if (record == null || StrUtil.isBlank(userId)) {
            return false;
        }
        String scope = normalizeScope(record.getScopeType());
        return switch (scope) {
            case DataDictScope.PLATFORM -> true;
            case DataDictScope.USER -> matchesUser(record, userId, username);
            case DataDictScope.GROUP -> StrUtil.isNotBlank(record.getScopeId())
                    && projectAcl.isMember(record.getScopeId(), userId);
            default -> false;
        };
    }

    public boolean canWrite(DataDict record, String userId, String username) {
        if (record == null || StrUtil.isBlank(userId)) {
            return false;
        }
        String scope = normalizeScope(record.getScopeType());
        if (DataDictScope.PLATFORM.equals(scope)) {
            return false;
        }
        return switch (scope) {
            case DataDictScope.USER -> matchesUser(record, userId, username);
            case DataDictScope.GROUP -> StrUtil.isNotBlank(record.getScopeId())
                    && projectAcl.isMember(record.getScopeId(), userId);
            default -> false;
        };
    }

    /** 新建条目：禁止 platform；group 须 project 成员；user 自动绑定本人。 */
    public void assertCreatable(DataDict entity, String userId, String username) {
        String scope = normalizeScope(entity.getScopeType());
        if (DataDictScope.PLATFORM.equals(scope)) {
            throw new com.erdonline.common.core.exception.ValidateException("平台字段库只读");
        }
        if (DataDictScope.GROUP.equals(scope)) {
            if (StrUtil.isBlank(entity.getScopeId())) {
                throw new com.erdonline.common.core.exception.ValidateException("团队字段库须指定 scopeId（团队项目 id）");
            }
            if (!projectAcl.isMember(entity.getScopeId(), userId)) {
                throw new com.erdonline.common.core.exception.ValidateException(
                        com.erdonline.common.core.api.ApiErrorCode.FORBIDDEN);
            }
            return;
        }
        if (DataDictScope.USER.equals(scope)) {
            entity.setScopeId(userId);
            return;
        }
        throw new com.erdonline.common.core.exception.ValidateException("无效的 scopeType");
    }

    public void assertReadable(DataDict record, String userId, String username) {
        if (!canRead(record, userId, username)) {
            throw new com.erdonline.common.core.exception.ValidateException(
                    com.erdonline.common.core.api.ApiErrorCode.FORBIDDEN);
        }
    }

    public void assertWritable(DataDict record, String userId, String username) {
        if (!canWrite(record, userId, username)) {
            throw new com.erdonline.common.core.exception.ValidateException(
                    com.erdonline.common.core.api.ApiErrorCode.FORBIDDEN);
        }
    }

    private static boolean matchesUser(DataDict record, String userId, String username) {
        if (userId.equals(record.getScopeId())) {
            return true;
        }
        return ResourceOwnership.matchesCreator(record.getCreator(), userId, username);
    }

    private static String normalizeScope(String scopeType) {
        if (StrUtil.isBlank(scopeType)) {
            return DataDictScope.USER;
        }
        return scopeType.trim().toLowerCase();
    }
}
