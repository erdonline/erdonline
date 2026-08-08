package com.erdonline.erd.service.impl;

import cn.hutool.core.util.StrUtil;
import com.erdonline.common.security.util.SecurityContextUtil;
import com.erdonline.erd.entity.DbChange;
import com.erdonline.erd.entity.VersionAttribution;
import com.erdonline.erd.mapper.VersionAttributionMapper;
import com.erdonline.erd.service.VersionAttributionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
public class VersionAttributionServiceImpl implements VersionAttributionService {

    private static final int UTM_MAX = 128;
    private static final int REFERRER_MAX = 256;
    private static final int LANDING_MAX = 128;

    @Autowired
    private VersionAttributionMapper versionAttributionMapper;

    @Override
    public void recordIfPresent(DbChange saved, Map<String, Object> attribution) {
        if (saved == null || attribution == null || attribution.isEmpty()) {
            return;
        }
        if (StrUtil.isBlank(saved.getProjectId()) || StrUtil.isBlank(saved.getDbKey())
                || StrUtil.isBlank(saved.getVersion())) {
            return;
        }
        try {
            VersionAttribution row = new VersionAttribution();
            row.setDbChangeId(saved.getId());
            row.setProjectId(saved.getProjectId());
            row.setDbKey(saved.getDbKey());
            row.setVersion(saved.getVersion());
            if (SecurityContextUtil.getUser() != null) {
                row.setUsername(SecurityContextUtil.getUser().getUsername());
            }
            row.setUtmSource(truncate(stringVal(attribution.get("utm_source")), UTM_MAX));
            row.setUtmMedium(truncate(stringVal(attribution.get("utm_medium")), UTM_MAX));
            row.setUtmCampaign(truncate(stringVal(attribution.get("utm_campaign")), UTM_MAX));
            row.setUtmContent(truncate(stringVal(attribution.get("utm_content")), UTM_MAX));
            row.setUtmTerm(truncate(stringVal(attribution.get("utm_term")), UTM_MAX));
            row.setReferrer(truncate(stringVal(attribution.get("referrer")), REFERRER_MAX));
            row.setLanding(truncate(stringVal(attribution.get("landing")), LANDING_MAX));
            row.setAttrTs(longVal(attribution.get("ts")));
            if (isBlankAttribution(row)) {
                return;
            }
            versionAttributionMapper.insert(row);
        } catch (Exception e) {
            log.warn("version attribution sink failed projectId={} version={}",
                    saved.getProjectId(), saved.getVersion(), e);
        }
    }

    static boolean isBlankAttribution(VersionAttribution row) {
        return StrUtil.isAllBlank(
                row.getUtmSource(),
                row.getUtmMedium(),
                row.getUtmCampaign(),
                row.getUtmContent(),
                row.getUtmTerm(),
                row.getReferrer(),
                row.getLanding());
    }

    static String stringVal(Object raw) {
        if (raw == null) {
            return null;
        }
        String s = String.valueOf(raw).trim();
        return s.isEmpty() ? null : s;
    }

    static Long longVal(Object raw) {
        if (raw == null) {
            return null;
        }
        if (raw instanceof Number n) {
            return n.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(raw).trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
